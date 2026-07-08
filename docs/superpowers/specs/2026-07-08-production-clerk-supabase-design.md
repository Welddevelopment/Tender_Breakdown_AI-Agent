# Production migration — Clerk + Supabase (system of record) + queue-worker engine

**Date:** 2026-07-08 · **Owner:** Generalist (cross-lane, CEO-directed) · **Branch:** `generalist/prod-clerk-supabase`
**Status:** approved (Bobby, in session). Supersedes the 07-04 "extend self-hosted auth" spec — that work shipped
and carried the demo; this migration replaces it for production.

## Why (production-grade audit of today's stack)

| Today | Production problem |
|---|---|
| SQLite file in the Fly container | Data loss on redeploy/volume failure; no concurrent writes, no backups |
| Hand-rolled PBKDF2+JWT auth (+ Google bolt-on) | Fails customer security review; no MFA/revocation/audit |
| Hand-built teams/sharing tables | Duplicate of what Clerk Organizations does, ours to maintain |
| In-memory SSE pub/sub | Dies on restart; breaks at 2 instances |
| In-memory JOBS registry + threads | Deploy mid-extraction loses the job; Fly auto-stop had to be disabled as a workaround |
| PDFs on container disk | Same loss class as SQLite |

## End state

```
Browser ── Clerk session ──▶ Next.js (Vercel)
   │                            │  /api/upload (server route)
   │ supabase-js (Clerk JWT)    ▼
   ▼                         Supabase ◀── service-role ── Python worker (Fly)
Supabase Postgres (RLS by org) + Storage + Realtime      claims jobs, runs the engine
```

- **Auth:** Clerk — Google + email/password, MFA available. **Clerk Organizations = teams** (invites, roles,
  prebuilt UI). Frontend: `@clerk/nextjs`, `proxy.ts` middleware (Next 16), `<SignIn>`, `<OrganizationSwitcher>`,
  `<OrganizationProfile>` at `/teams`. An active org is required (org gate) — every data row is org-scoped.
- **Database:** Supabase Postgres is the system of record. Clerk registered as Supabase third-party auth
  provider; every client call carries the Clerk token; **RLS keys every table to the JWT's org claim
  (`auth.jwt()->'o'->>'id'`)**. The locked requirement JSON stays the wire shape (NO change to the team-locked
  schema — columns mirror it).
- **Storage:** `tender-docs` bucket, paths `org_id/tender_id/…` with org-scoped storage policies. Capability
  docs same pattern.
- **Realtime:** Supabase Realtime (`postgres_changes`) on `requirements`, `comments`, `jobs` — replaces the
  in-memory SSE. Live decisions/comments/progress across teammates, multi-instance safe.
- **Extraction = queue + worker (the production pattern, not a compromise):**
  - Upload: Next.js server route → PDF(s) to Storage → insert `tenders` row (`processing`) + `jobs` row (`queued`).
  - Worker: the existing Python engine, run as a small always-on Fly process. Claims jobs via Postgres
    `FOR UPDATE SKIP LOCKED`, downloads the pack from Storage, runs ingest→extract→reconcile→autofill, streams
    progress into the job row, bulk-inserts requirements, flips the tender to `ready`/`failed`.
  - Durable: jobs survive restarts/deploys (row, not thread); `attempts` + a stale-claim watchdog give retries;
    Fly auto-stop can be re-enabled later since state is in Postgres, not memory.
  - Worker credentials: service-role (direct `DATABASE_URL` via psycopg + Storage REST via httpx) — never
    exposed to the frontend.
- **Autofill:** a second job type (`draft`) through the same queue.
- **Attribution (unforgeable, kept):** BEFORE-trigger on `requirements` stamps `decision.actor` and on
  `comments` stamps `author_*` from the JWT's `sub`/claims — enforced in the database, clients can't forge it.

## What retires (after cutover)

`backend/app/auth.py` (login/google/admin), `store.py` (SQLite), `events.py` (SSE), the teams/sharing/comments
HTTP endpoints, most of the FastAPI surface (worker keeps `/health`). Frontend: `AuthContext`/`AuthGate`/`login`
page → Clerk; `TeamsManager`/`ShareControl`-teams → Clerk org components; SSE hooks → Realtime.

## What survives

The engine (`ingest/chunk/extract/reconcile/answer` + `engine/`) — unchanged, re-hosted in the worker. The
whole review workspace UI. **Mock mode:** no env keys → the mock/demo build runs exactly as today (pilots+demos
stay safe).

## Phases (each lands green; main shippable throughout)

1. **Schema** — Supabase SQL migration: tables (`tenders`, `requirements`, `comments`, `jobs`,
   `capability_docs`), RLS, triggers, realtime publication, storage bucket + policies. Setup doc for the two
   dashboards (Clerk app + Supabase project, ~10 min human work).
2. **Clerk frontend** — provider, `proxy.ts`, sign-in, org gate, `/teams` = `<OrganizationProfile>`,
   AuthContext adapter (Clerk user → the shape the app already consumes).
3. **Data layer** — Clerk-authed supabase-js client; RequirementsContext reads Supabase + Realtime; decisions +
   comments write direct under RLS.
4. **Upload + queue** — `/api/upload` route (Storage + tender + job rows); ProcessingView watches the job row
   via Realtime.
5. **Worker** — `backend/worker.py` polling loop wrapping the engine; Fly process config.
6. **Cutover** — retire the old paths, docs, comms, STATUS; E2E with two Google accounts in one org.

## Env

Frontend/Vercel: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Worker/Fly: `DATABASE_URL` (Supabase direct), `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, existing `OPENAI_API_KEY`. None set → mock mode.

## Verification bar (production)

- RLS negative tests (org A ⇸ org B) run as SQL; trigger forgery test (client-sent actor overwritten).
- Worker: kill mid-job → job requeued by watchdog and completes; 2 workers → no double-claim (SKIP LOCKED).
- Existing engine test suite stays green; frontend build+lint green in mock AND live config.
- E2E: two Google accounts, one org: upload → live progress → both see matrix; decision + comment appear live
  on the other screen; second org sees nothing.
