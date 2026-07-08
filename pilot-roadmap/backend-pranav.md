# Pilot Roadmap — Backend (Pranav)

Owner: Pranav (backend: PDF ingest, extraction, API, auth, storage, jobs)
Scope: 100% backend (`/backend`)
Last updated: 2026-07-08
Reads with: [`ops/pilot-readiness-roadmap.md`](../ops/pilot-readiness-roadmap.md), `backend/README.md`, `CODEMAP.md`. Coordinate the frontend half of the token change with Jawad (`frontend/src/lib/api.ts`) and share the jobs/observability work with Bobby (generalist doc).

---

## Why this document exists

Backend reliability is the **largest single line on the scorecard (20 points)** and the biggest constraint on how far we can expose the product. The engine is locked (116 tests, gold set — that's Bobby's world). The API layer around it is where the pilot-blocking risk lives. This doc is your verified punch-list to take backend reliability from its current **11/20** to **13/20 at pilot gate (70)** and **15/20 at 75**, plus the security items that are shared but backend-owned.

Every item below was checked against the actual code — file:line included. Two things the roadmap called "gaps" are **not** gaps and you should not spend time on them:

- **Health + extractor selection is correct** (`main.py:258–260`, `extract.py:1–19`) — pluggable heuristic/openai/anthropic with proper auto-selection. Leave it; just make sure prod has the key (below).
- **The engine** (reconcile/eval/gold set/smoke) is comprehensive and green. Not yours to touch.

Three lenses:

- **Business lens** — backend failures are the most expensive kind: a lost job, a leaked token, or a "who can see this document?" bug is a *pilot-ending* event, and trust is our entire wedge. Reliability work here maps directly to the risk line and to retention (a pilot that gets stuck doesn't come back).
- **UX lens** — the backend owes the frontend *truthful state*. A job that fails silently, or a refresh that loses progress, becomes a broken UX no amount of frontend polish can fix.
- **Engineering lens** — this is your home. The theme is: make failure **clear, contained, and recoverable**, without a premature rewrite. The audit does *not* support migrating the DB or adding a queue before pilots — that's beta-band (80+) work.

---

## Current position (verified)

| Scorecard line | Now | At 70 | At 75 |
|---|---:|---:|---:|
| Backend reliability (of 20) | 11 | 13 | 15 |
| Security & privacy (of 15) — backend-owned share | 8 | 11 | 13 |

---

## Part A — Work to reach 70 (pilot gate)

### A1. Fix the source access-control inconsistency  *(P0 · Security)*

**Verified real.** Two source endpoints use *different* access rules:

- `main.py:570–604` — `GET /tenders/{id}/pdf` calls `store.can_access()` (owner **or** shared member **or** team). Broad.
- `main.py:615–649` — `GET /tenders/{id}/source` calls `store.get_tender_owner() != user["id"]` (owner **only**). Strict.

So a collaborator/team user can see matrix rows and open the PDF, but gets a 404 opening a DOCX/XLSX/CSV source. Both endpoints also duplicate manual token decoding (`:585–589` vs `:628–632`). The access helpers live in `store.py:314–337` (`can_access`, `can_access_requirement`).

- **Business framing:** inconsistent access is a *fatal* trust bug in both directions — a user blocked from a doc they own, or (worse) a path to a doc they shouldn't see. This is the risk line at its sharpest.
- **Tasks:** route `/source` through the same `can_access()` decision as `/pdf`; extract the duplicated token-decoding into one shared helper; add tests for **owner / collaborator / denied** across PDF, DOCX, XLSX, CSV; document the access model in `backend/README.md`.
- **Done when:** owner/collaborator/denied tests pass for every source type; no source endpoint uses a different rule without a commented reason; a two-account manual check passes.

### A2. Verify production env & health before pilots  *(P0 · shared with Joe)*

**Not a code gap — an ops discipline.** The extractor silently falls back to thin heuristics if `OPENAI_API_KEY` is absent.

- **Tasks:** confirm `AUTH_SECRET`, `OPENAI_API_KEY` (or intended provider key), and model settings are present in prod; confirm `/health` reports the intended extractor, not heuristic; verify persistent-storage behaviour on the deployed backend; add health expectations to the runbook.
- **Done when:** deployed `/health` reports the intended extractor; no pilot ever runs on silent fallback extraction.

### A3. Enforce upload limits *before* buffering the file  *(P1)*

**Verified real.** `main.py:356–368` calls `f.file.read()` (`:358`) — the **entire** file into memory — and ZIPs are expanded in memory (`:360`) *before* the size check at `:377–396` (`:384`). Guards `MAX_ZIP_ENTRIES` / `MAX_ZIP_UNCOMPRESSED_MB` also fire only after the full ZIP is read (`:136`).

- **Business framing:** a 500 MB upload (accidental or hostile) buffers into memory before we reject it — an OOM/DoS risk on a single-instance deploy, i.e. it takes the whole demo down.
- **Tasks:** enforce per-file and total size limits as early as practical (stream/inspect `Content-Length` and cap the read); reject oversize before full buffering; keep the existing typed 413 responses so the frontend's already-built error UI shows the right message.
- **Done when:** an over-limit file is rejected without being fully buffered; large/bad/good/mixed-ZIP manual tests pass; the frontend shows the correct recoverable state (that UI already exists — `UploadDropzone.tsx`).

### A4. Document single-process assumptions + surface job failure reasons  *(P1)*

**Verified real.** Jobs and events are in-process memory:

- `main.py:168–186` — `JOBS: dict[str, dict]` behind a lock, capped at 100. Comment already notes: "Single process only … a multi-instance deploy would move this to Redis."
- `events.py:17–46` — subscriber registry in memory, same caveat.

For 3–5 hand-held pilots on a single instance this is *acceptable* — but the team must know what breaks, and users must see *why* a job failed.

- **Tasks:** write the single-process assumptions into `backend/README.md`/runbook (jobs, events, redeploy behaviour, storage); set safe concurrency defaults for the pilot deploy; ensure a failed job returns a **reason** the frontend can render (feeds the retry path the UI already supports).
- **Done when:** runbook explains jobs/events/redeploy/storage; a failed job shows a reason + retry path in the UI.

---

## Part B — The extra 5 points (70 → 75): backend owns ~4 of them

The stretch to 75 is three hardening stages. Backend is the primary owner of two of them and co-owns the third with the frontend.

### B1. Token hardening — remove query-string auth  *(Security stage · ~2 pts · HIGH severity)*

**Verified real, highest-severity item in the product.** The frontend embeds the bearer token in URLs — `?token=` on PDF (`api.ts:131–145`) and source (`:184–196`) — and both backend endpoints accept it (`main.py:587–588`, `:628–632`). Tokens are in `localStorage` (`api.ts:23–53`) and live 7 days (`auth.py:_TOKEN_TTL_SECONDS = 60*60*24*7`). Query-string tokens leak into access logs, proxy logs, and browser history.

- **Business framing:** this is the one item a procurement buyer will directly ask about, and the one that could end a pilot. Closing it is worth more to the sale than any feature.
- **Backend tasks:** replace long-lived query-token document access with **short-lived signed links** (mint a per-document, short-TTL signed URL) *or* require the `Authorization: Bearer` header and have the frontend fetch into a blob (coordinate with Jawad — he flips `api.ts` in the same window); shorten the session token TTL from 7 days; keep the localStorage decision documented with a safer next step noted; add cross-user isolation + source-access tests across all formats.
- **Done when:** no document URL carries a token; links expire/require auth; two-account isolation test passes; access checks consistent across matrix/PDF/source.

### B2. Durable job state — survive refresh & restart  *(Backend durability stage · ~1.5 pts)*

**The fix for the in-memory fragility, at pilot-appropriate depth** (not a full queue — that's 80+ band). Today a refresh mid-processing or a redeploy loses the user's understanding of what happened.

- **Tasks:** persist enough job state (status, failure reason, file list, timestamps) for the UI to recover after refresh; expose states truthfully — queued / processing / completed / partial / failed / cancelled; make the SSE event stream reconnect safely; add a polling fallback if events drop (the frontend already polls every 700ms — meet it halfway).
- **Done when:** refreshing during processing shows a truthful state; a forced backend restart during a test job yields a clear failed/retryable state, not ghost progress; users are never stuck on an indefinite spinner.

### B3. Observability — traceable by job id  *(Observability stage · co-owned with Bobby · ~0.5–1 pt)*

- **Tasks:** structured logs keyed by tender id / job id / user id / file count / provider / duration / outcome; **never log full tender text**; error categories for upload / parse / extraction / reconcile / draft / auth / storage; basic counters (upload count, success rate, extraction duration, error rate); a private log-query recipe in the runbook.
- **Done when:** every pilot run is traceable by job id; one intentionally-failed job is easy to diagnose from logs; no raw confidential content in logs.

---

## What NOT to do yet (scope discipline)

The audit explicitly does **not** support these before pilots — they're beta-band (80+):

- **No** SQLite → Postgres migration yet. The JSON-blob pattern (`store.py:49–54` requirements as a `data TEXT` blob; tenders/docs as JSON columns `:108–130`) is weak for multi-user production but *fine* for 3–5 hand-held pilots. You may **plan** the migration (map tables, indexes, cutover criteria) as P2 so it's never an emergency — but don't execute it now.
- **No** real job queue (Redis/worker) yet — B2 persists state; the queue is beta work.
- **No** object storage move yet.
- **No** rewrite for neatness. Refactor only when it removes a named risk (wrong-doc access, blocked access, fragile deploy, stuck job, lost-state-on-restart).

---

## Backend testing (a real gap to start closing)

**Verified:** there is **no `backend/tests/` directory.** The backend is exercised only indirectly through engine tests + a manual `backend/scripts/stress_test.py`. For the P0 items above (access control especially), add focused backend tests so the gate is provable, not asserted. This also feeds the team's one-command verification path (see Bobby's doc — he owns the checklist; you own making backend deps installable and importable from docs).

---

## Definition of done for your lane at 75

- [ ] `/source` and `/pdf` share one access decision; owner/collaborator/denied tests pass for all four source formats
- [ ] Prod env verified; `/health` reports the intended extractor; runbook has health expectations
- [ ] Upload rejects over-limit files before full buffering; typed 413s intact
- [ ] Single-process assumptions documented; failed jobs surface a reason + retry
- [ ] No auth token in any URL; token TTL shortened; cross-user isolation + source-access tests pass
- [ ] Job state persists across refresh and restart; SSE reconnects; polling fallback exists
- [ ] Structured logs traceable by job id, no raw tender text
- [ ] First `backend/tests/` covering access control; backend deps installable/importable from docs

---

## Reference map

| Need | File / location |
|---|---|
| Master scoring & bands | `ops/pilot-readiness-roadmap.md` |
| API detail + error codes | `backend/README.md` |
| Whole-repo map + import graphs | `CODEMAP.md` |
| Access helpers | `backend/app/store.py:314–337` |
| Source/PDF endpoints | `backend/app/main.py:570–649` |
| Jobs / events (in-memory) | `backend/app/main.py:168–186`, `backend/app/events.py:17–46` |
| Upload handler | `backend/app/main.py:356–396` |
| Auth / token TTL | `backend/app/auth.py` |
| Extractor selection | `backend/app/extract.py:1–19` |
| Frontend token usage (coordinate) | `frontend/src/lib/api.ts:23–53,131–145,184–196` |
| Deploy status | `ops/fly-deploy-status.md` |
