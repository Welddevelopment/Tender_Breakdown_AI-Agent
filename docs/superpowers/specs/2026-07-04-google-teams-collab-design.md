# Google sign-in + teams + collaboration — design (extend, don't replace)

**Date:** 2026-07-04 · **Branch:** `generalist/auth-collab` (branch+PR — cross-lane, touches auth/schema) · **Status:** approved in session

> Supersedes the earlier Clerk+Supabase spec/plan, which was written against a stale Day-1
> snapshot. `main` already has self-hosted JWT auth + per-tender sharing + attribution. We
> **extend** that system — no Clerk, no Supabase, no rip-and-replace.

## What already exists on `main` (do not rebuild)

- **Auth:** invite-only email/password — PBKDF2 + JWT (`backend/app/auth.py`), admin CLI (`app.admin`),
  `/auth/login`, `/auth/me`; frontend `AuthContext`, `AuthGate`, `/login`, `AccountMenu`.
- **Collaboration (sharing):** `tender_members` table, `POST /tenders/{id}/share`, `GET /tenders/{id}/members`,
  `can_access`/`can_access_requirement`; frontend `ShareControl`, `ActivityFeed`, `collaborators.ts`.
- **Attribution:** `Decision.actor` (id/email/name) stamped server-side on PATCH.

## The four genuine gaps we build

1. **Google sign-in** — add Google OAuth to the existing JWT auth.
2. **Persistent teams** — a group you add authenticated users to once; tenders shared to a team.
3. **Realtime** — live decisions/comments/members via SSE (dependency-light; no external service).
4. **Comments** — threaded notes per requirement.

## 1. Google sign-in

- **Backend** `POST /auth/google { id_token }`: verify the Google ID token via Google's
  `tokeninfo` endpoint using **stdlib `urllib`** (no new dependency). Check `aud == GOOGLE_CLIENT_ID`,
  `email_verified`, and `exp`. Then **find-or-create** the user by email and issue the existing app JWT
  (same `AuthResponse` shape as `/auth/login`).
- **Auto-provisioning:** a first-time Google email creates an account with `password_hash = "google-oauth"`
  (a non-PBKDF2 sentinel that can never satisfy `verify_password`, so password login stays closed for
  Google-only users). Gated by `GOOGLE_AUTO_PROVISION` (default: on when `GOOGLE_CLIENT_ID` is set). This
  is the deliberate, documented relaxation of "invite-only" the user asked for — it's the onboarding path
  for teammates.
- **Frontend:** Google Identity Services button on `/login` (script loaded only when
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set), `api.loginWithGoogle(idToken)`, `AuthContext.signInWithGoogle`.
  Email/password stays exactly as-is; the two live side by side.
- **Config absent → nothing changes:** no `GOOGLE_CLIENT_ID` ⇒ endpoint 503s, button hidden.

## 2. Persistent teams

- **Schema (additive, idempotent migrations in `store.init_db`):**
  - `teams (id, name, owner_id, created_at)`
  - `team_members (team_id, user_id, role, added_at)` — role `owner|member`
  - `tenders.team_id TEXT` — a tender may belong to a team (nullable; existing tenders unaffected).
- **Access:** extend `can_access`/`can_access_requirement` — a user reaches a tender if owner **OR**
  in `tender_members` **OR** the tender's `team_id` is one of the user's teams. Adding someone to a team
  grants them every current+future team tender in one step.
- **Endpoints (all `Depends(current_user)`):**
  - `POST /teams { name }` → create (caller = owner + first member)
  - `GET /teams` → my teams (+ member counts)
  - `GET /teams/{id}/members`, `POST /teams/{id}/members { email }` (owner-only; target must have an
    account — same invite-only convention as tender share), `DELETE /teams/{id}/members/{user_id}`
  - `POST /tenders/{id}/team { team_id }` → share a tender to a team (owner-only)
- **Frontend:** `/teams` page (create team, list teams + members, add/remove members by email),
  `api.ts` team functions, a **Teams** entry in `AccountMenu`/nav, and a "share to a team" affordance
  alongside the existing per-person `ShareControl`.

## 3. Realtime (SSE)

- **Backend** `GET /tenders/{id}/events?token=…` → `text/event-stream`. Per-tender in-memory pub/sub
  (a set of `asyncio.Queue`s per tender), mirroring the existing in-memory `JOBS` pattern (single-process
  Render instance; a note documents the Redis path for multi-instance). Auth via `?token=` (already the
  established pattern for `/pdf`). Broadcast an event on: decision PATCH, comment POST, tender share,
  team-tender share.
- **Frontend:** an `useTenderEvents(tenderId)` hook (`EventSource`) that refetches the tender / appends
  the comment on each event, wired through `RequirementsContext`. Falls back to no-op when the API is off.

## 4. Comments

- **Schema:** `comments (id, tender_id, req_id, author_id, author_name, body, created_at)`.
- **Endpoints:** `GET /requirements/{req_id}/comments`, `POST /requirements/{req_id}/comments { body }`
  — both guarded by `can_access_requirement`; author stamped server-side; POST broadcasts over SSE.
- **Frontend:** a comment thread in the requirement detail panel (`RequirementPanel`), authored via the
  existing collaborator colour/initials treatment.

## Non-negotiables

- **Never break the mock/showcase build** (`isApiEnabled()` / config-absent ⇒ features hide, app still runs).
- **Keep `engine/tests/test_collaboration.py` green**; add tests for the new backend surface.
- **Locked requirement schema unchanged.** New tables/columns are additive; `Decision` unchanged.
- **Regenerate `CODEMAP.md`** (`python scripts/gen_codemap.py`) in the same change when files are added.
- Branch + PR; post to `comms/board-generalist.md`; `main` stays demo-able.

## Verification

- `cd frontend && npm run build && npm run lint` green.
- `python -m pytest engine/tests/ backend/ -q` green (existing + new).
- Manual: Google sign-in creates+authenticates an account; create a team, add a second (Google) account,
  share a tender to the team, both see it; a decision + a comment by one appear live on the other (SSE).
