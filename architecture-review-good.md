# Architecture Review — Tender Breakdown / Bidframe

*Deep-review, 2026-07-12. Method: five parallel investigation agents (backend, engine+tests, frontend, infra/CI/ops, docs-vs-code adversarial), followed by two challenge agents — one defending the current architecture, one attacking the proposed target — reconciled against repository evidence. Every material claim below carries a file citation and a confidence label. Findings the defense refuted with code evidence were removed or downgraded; only what survived adversarial reconciliation appears here.*

---

## A. Executive verdict

**What this system actually is.** A three-tier modular monolith built by four people (and their agents) in two weeks: a FastAPI backend (`backend/app/`, ~3.9k LOC) that ingests UK tender PDFs and extracts requirements via LLM + deterministic safety nets; a pure-stdlib reconciliation/eval library (`engine/`, ~1.9k LOC library + ~5.1k LOC tests); and a Next.js 16 frontend (~26.1k LOC) that is simultaneously the product (compliance matrix at `/review`) and the company's entire go-to-market surface (landing, pitch deck, scrolly demo — ~26% of frontend LOC). Live deployment: Fly.io single machine (`bidframe-api.fly.dev`, `fly.toml`) + Vercel frontend, SQLite, in-process job threads and SSE.

**Is it fit for purpose?** **Yes, for this month — with four correctness/security exceptions that need immediate action.** The core pipeline is unusually well-engineered for its age: conservative merge logic with incident-referenced comments, a deterministic gating safety net that floors disqualifier recall regardless of LLM failures (`backend/app/pipeline.py:165`, proven on gold sets), a genuinely honest eval harness (`engine/eval.py` — bipartite matching, anti-gaming design, quarantined mislabelled gold data), and a clean mock/live seam in the frontend (`frontend/src/lib/api.ts:11-15`). The engineering culture visible in the code (tests named `test_demo_no_bluff.py`, `test_adversarial_safety.py`; docstrings citing postmortems G-009/G-028/G-032) is a real asset. The problems are almost all at the *edges*: process (zero CI), operations (unverified data durability, zero observability), governance (every markdown "source of truth" lags the code by 1–4 schema generations), and a handful of specific write-path and auth bugs.

**Three most consequential conclusions:**

1. **The product's data durability is unverified and possibly broken.** `store.py`'s `_db_path()` defaults to a path relative to `backend/` — the *ephemeral* container filesystem — while the Fly volume mounts at `/data` (`fly.toml [mounts]`). Whether production data survives a deploy depends entirely on a `DATABASE_URL` secret that cannot be verified from the repo (ops notes say it was set: `ops/fly-deploy-status.md:22-24` — but uploaded PDFs are confirmed *not* on the volume, `ops/fly-deploy-status.md:44-47`, so the source panel breaks on every redeploy). There is no backup of any kind. For a product whose output is *audited compliance decisions*, this is the single scariest fact in the repo. (Confidence: high on the code; medium on live config.)

2. **The repo's stated governance is fiction; the executable contract is the real one.** The schema exists in five places; the two that agree with reality are `backend/app/schema.py` (22 fields) and `frontend/src/types/requirement.ts`. The three markdown copies with the strongest authority language — CLAUDE.md ("Schema reminder", still 15-field), AGENTS.md, `tender-master-plan.md` ("THE coordination artifact") — are all stale, and CLAUDE.md is injected into every agent session, so it *actively misleads the team's own agents*. Similarly: AGENTS.md documents the wrong upload response shape, omits auth entirely, and lists 6 of 28 actual endpoints; the "locked schema / PR ceremony" rule was waived in practice (STATUS.md:40); "stay in your lane" is contradicted by the engine test suite being the backend's de facto integration suite. (Confidence: high.)

3. **There is no automated safety net for the humans.** The engine has ~45 test files including real end-to-end regression guards — and *nothing runs them*. `.github/workflows/` contains only the hourly codemap cron. Backend dependencies are fully unpinned (`backend/requirements.txt`), so any redeploy can pull a breaking `pydantic`/`openai` major on demo morning. Four agents pushing to trunk in parallel with an honor-system "never push broken" rule is exactly the setup CI exists for. (Confidence: high.)

**Single highest-leverage change:** a one-day operations hardening pass: (1) verify/force the SQLite path onto the Fly volume + move uploads there + add Litestream or a nightly backup; (2) add one CI workflow (pytest engine tests key-gated, `npm run build && npm run lint`); (3) pin backend deps. This converts the two failure modes that could actually kill a pilot — silent data loss and a broken trunk — into non-events, for roughly one engineer-day.

---

## B. Current-system architecture map

```
                         ┌─────────────────────────────────────────────┐
  Vercel (frontend)      │  Next.js 16 / React 19 — frontend/ (~26k)   │
  bidframe.org           │  /review /upload /answers /graph /teams …    │
                         │  + marketing theater: / /pitch /demo (~26%) │
                         │  State: RequirementsContext.tsx (875 LOC)   │
                         │  API seam: lib/api.ts (mock ⇄ live via      │
                         │  NEXT_PUBLIC_API_BASE_URL, api.ts:11-15)    │
                         └────────────────┬────────────────────────────┘
                                          │ bearer JWT (localStorage);
                                          │ ?token= for pdf/source/SSE
                         ┌────────────────▼────────────────────────────┐
  Fly.io single machine  │  FastAPI — backend/app/main.py (866 LOC,    │
  bidframe-api.fly.dev   │  28 routes: auth, upload, jobs, draft,      │
  (render.yaml + vercel  │  PATCH, teams, share, comments, SSE)        │
  backend config = stale │  auth.py (PBKDF2 + HS256 JWT, invite-only)  │
  duplicate targets)     │  In-memory: JOBS dict (main.py:173),        │
                         │  SSE subscribers (events.py) — single proc  │
                         ├─────────────────────────────────────────────┤
                         │  pipeline.py: ingest → chunk → extract      │
                         │  → dedup → engine.reconcile → gating        │
                         │  safety-net union → graph → source_rects    │
                         │  → autofill  (background daemon thread)     │
                         │  ingest.py: fitz → pypdf → pdfplumber →     │
                         │  optional gpt-4o vision OCR (≤15 pp)        │
                         │  extract.py: openai | anthropic | heuristic │
                         ├──────────────┬──────────────────────────────┤
                         │ SQLite       │ engine/ (stdlib, ~1.9k LOC)  │
                         │ (JSON-blob   │ reconcile · gating_scan ·    │
                         │ requirements │ gating_filter · answer ·     │
                         │ rows;        │ embeddings · eval harness    │
                         │ volume       │ imported by pipeline behind  │
                         │ /data — DB   │ try/ImportError fallbacks    │
                         │ path unveri- │ (pipeline.py:43-103)         │
                         │ fied; uploads│ engine/tests = de facto      │
                         │ NOT on vol)  │ integration suite for API    │
                         └──────────────┴──────────────────────────────┘
  External: OpenAI (extraction, OCR, embeddings, answers, gating filter)
            Google tokeninfo (sign-in verification, auth.py:145-168)
  CI: .github/workflows/codemap.yml only (hourly doc regen bot)
```

**Ownership (per AGENTS.md roles):** backend/J own `backend/`; generalist owns `engine/` + eval; frontend owns `frontend/`. **Actual dependency direction:** backend → engine (optional imports); engine/tests → backend (9 files import `backend.app.*` — intended layering inverted at test level); frontend → backend HTTP only, plus a *display-layer* near-dupe folder (`frontend/src/lib/dedupe.ts`) that mirrors engine concepts but serves a different contract (view folding, reversible — see §G).

**Verified facts vs assumptions:** everything above is verified by reading code except: (a) whether `DATABASE_URL` is set correctly on the live Fly machine (assumption from `ops/fly-deploy-status.md`); (b) whether the Render instance is still running (assumed stale); (c) frontend build passing (configs exist, `node_modules` absent in this environment, not executed).

---

## C. End-to-end workflow and data-flow analysis

**Upload → matrix (the core journey), traced through code:**

1. `POST /tenders/upload` (`main.py:325`) — authenticated; extension whitelist (`main.py:346`); each `UploadFile` read **fully into RAM** (`main.py:359`); zips expanded in memory with entry-count/size guards from `infolist()` metadata (`main.py:141-152`, zip-slip guarded at :158). Size limits (50 MB/file, 150 MB/pack) enforced **after** bytes are in RAM and after writing to disk (`main.py:385-397`) — limits protect disk, not memory. This matches the recorded Fly OOM incident (STATUS.md, J row).
2. Job registered in the in-memory `JOBS` dict (`main.py:173`), pipeline runs on a daemon `threading.Thread` (`main.py:420-424`); client polls `GET /tenders/jobs/{job_id}`.
3. `run_pipeline_multi` (`pipeline.py:350`): per-doc ingest (fitz → pypdf fallback → pdfplumber table enrichment → optional vision OCR of ≤15 sparse pages, `ingest.py:255`, :33) → 3000-char overlapping chunks (`chunk.py:66`) → per-chunk LLM extraction with 3× retry then **return-empty** (`extract.py:417-450`) → exact dedup → `engine.reconcile` (conservative all-pairs merge, numeric-conflict blocking, noisy-OR confidence — `engine/reconcile.py:103-227`) → **deterministic gating safety net** union (`pipeline.py:165` + `engine/gating_scan.py` — the load-bearing correctness floor) → graph refs → PyMuPDF `search_for` source rects → mock autofill.
4. `store.save_tender` (`store.py:161`): tender row + requirements as JSON blobs, written once at pipeline end.
5. Frontend: `pollJob` 700 ms loop (`UploadDropzone.tsx:123-133`) → `loadTender` (`RequirementsContext.tsx:227-243`) → `MatrixView` → row click → `RequirementPanel` (source excerpt + PDF highlight) → decision → optimistic local update + fire-and-forget `PATCH /requirements/{id}` with toast-only failure handling (`RequirementsContext.tsx:455-467`).

**Where the flow breaks (verified):**

- **LLM outage mid-extraction:** each failed chunk returns `[]` after retries; the tender completes "successfully" with only heuristic/safety-net content. The gating net floors *disqualifier* recall (the worst case is covered — defense confirmed, `engine/tests/test_net_floor.py`), but ordinary mandatory requirements silently vanish and the job status says success. The user cannot distinguish "sparse tender" from "OpenAI was down." (`extract.py:449`, `pipeline.py:428-433`.)
- **Skipped documents vanish:** in a multi-doc pack, unreadable docs are collected into a `skipped` list that is **never surfaced** (`pipeline.py:384-393` — dead variable). A bid manager uploading a 5-file pack where one fails sees 4 files' requirements with no warning.
- **Restart mid-job:** thread dies, JOBS entry gone → client polls 404; uploaded files orphaned on disk with no tender row and no cleanup (`main.py:206-232`). Observed live as "expired" extractions after the Fly OOM.
- **`/draft` vs concurrent PATCH:** `/draft` loads the tender, runs a minutes-long LLM autofill over the in-memory copy, then `replace_drafts` DELETE-all + reinserts every row (`main.py:656-695`, `store.py:194-209`). Any decision PATCHed during the drafting window is silently overwritten by the stale copy. (Defense argued the window is narrow at current concurrency; the attack agent confirmed the clobber is real and noted `store.update_answer` (`store.py:678`) already does careful per-field merges — the fix path exists in the same file.)
- **PATCH failure on the client:** optimistic update persists, server state diverges; the UI's own copy admits it ("It shows here, but may not have been kept", `RequirementsContext.tsx:44-45`). For a tool whose export is the audit record, client/server divergence is an integrity gap.
- **Autofill all-or-nothing:** one unhandled 429 abandons the whole answer batch, swallowed at `pipeline.py:236`; a tender with zero answers is indistinguishable from "autofill not run" (acknowledged in `engine/README.md:39`).

**Trust boundaries:** unauthenticated surface is only `/health`, `/auth/login`, `/auth/google` (verified). Inside the boundary: JWTs ride in query strings on three endpoints (`main.py:575, 620, 831`) — logs/history/Referer leakage; CORS accepts any `*.vercel.app` origin (`main.py:75` — not the auth boundary, but overly broad); tender/capability document *content* is untrusted input interpolated raw into LLM prompts (`gating_filter.py:121,144`, `answer.py:167-172`) and, for DOCX, rendered as mammoth-generated HTML via `dangerouslySetInnerHTML` (`DocxSourceView.tsx:108`) — self-XSS today, real stored XSS the moment the already-shipped teams/share feature exposes one user's document to another.

---

## D. Findings table

Grouped by shared root cause. Priority: P0 correctness/security now · P1 high-leverage · P2 important · P3 optional. Effort: S <½ day, M ≤3 days, L >3 days.

### Root cause 1: Operations were never promoted from "demo" to "product" (the repo's own runbook points prospects at this deployment)

| # | Finding | Pri | Conf | Evidence | Consequence | Recommendation | Effort | Deps |
|---|---------|-----|------|----------|-------------|----------------|--------|------|
| 1.1 | SQLite path defaults to ephemeral container FS; durability depends on an unverifiable Fly secret; **uploads confirmed not on the volume**; zero backups | **P0** | High (code) / Med (live) | `store.py` `_db_path()` default `sqlite:///./tender.db`; `fly.toml [mounts]` `/data`; `ops/fly-deploy-status.md:22-24, 44-47` | A redeploy can wipe all users/tenders/decisions; source panel already breaks on every deploy (PDFs gone) | Verify `DATABASE_URL` on the machine; move `UPLOAD_DIR` to `/data`; add Litestream (better than nightly dump: continuous, near-zero ops) | S–M | none |
| 1.2 | Zero CI: no workflow runs the ~45 engine test files, frontend build, or lint | **P0** | High | `.github/workflows/` = `codemap.yml` only | 4 parallel trunk-pushers, honor-system only; regressions reach the live demo branch | One workflow: `pytest engine/tests` (key-gate the LLM/OCR tests with markers — attack agent's triage caveat) + `npm run build && npm run lint`, on push/PR | S–M | none |
| 1.3 | Backend deps fully unpinned (incl. `openai`, `pydantic`, `fastapi`) | **P0** | High | `backend/requirements.txt` | Any redeploy can pull a breaking major; demo-day roulette | `pip freeze` → lock file used by Dockerfile | S | none |
| 1.4 | Observability ≈ zero: `print()` logging, no error tracking, no uptime check; runbook's mitigation is "hit /health once a minute before showing it" | P1 | High | grep `backend/app/`; `backend/DEPLOY.md:20`; (partial credit: `engine/usage_log.py` LLM cost ledger exists) | You learn the product is down from a prospect | `logging` module + Sentry free tier + external uptime ping | S | none |
| 1.5 | Three backend deploy configs, one live: Fly real, `render.yaml` documented-but-stale, `vercel.json` backend service dubious; `frontend/.env.example:6` still points at Render | P2 | High | `fly.toml`; `render.yaml`; `vercel.json` "services.backend"; `backend/DEPLOY.md:6-23` | New engineer/agent deploys to the wrong place; docs disagree | Delete `render.yaml` + the vercel backend block (keep the frontend block — attack agent: deleting `vercel.json` wholesale breaks the Vercel frontend deploy); fix env examples | S | 1.1 first |
| 1.6 | Single machine, single region, Fly account owned by a teammate's personal org | P3 | High | `fly.toml`; `ops/fly-deploy-status.md:4-5` | Bus factor; deploy = downtime for in-flight extractions | Move to a company org when convenient; accept single machine for now | S | none |

### Root cause 2: Write paths were designed for one user per tender, but multi-user collaboration already shipped

| # | Finding | Pri | Conf | Evidence | Consequence | Recommendation | Effort | Deps |
|---|---------|-----|------|----------|-------------|----------------|--------|------|
| 2.1 | `/draft` full-tender rewrite clobbers decisions PATCHed during the (minutes-long) LLM window | P1 | High | `main.py:656-695`; `store.py:194-209` | Human decisions silently discarded — worst possible failure for an audit tool | Route draft output through per-row `update_answer`-style merges (`store.py:678` already models this) instead of DELETE-all | M | none |
| 2.2 | Optimistic client writes never roll back on PATCH failure; bulk actions fan out N unordered PATCHes with partial-failure = mixed state | P1 | High | `RequirementsContext.tsx:455-467, 483-489, 730-785` | Client/server divergence in the audit record | Rollback-or-refetch on failure. **Do not** add per-row versioning yet — SSE already pushes authoritative state to viewers (`useTenderActivity.ts`, `events.publish`); LWW + rollback covers pilot scale (attack-agent finding, accepted) | S–M | none |
| 2.3 | SQLite opened with no pragmas: no WAL, no `busy_timeout`; `save_tender` bulk-writes can collide with request reads | P2 | High | `store.py:39-47` | "database is locked" errors under concurrent upload + review | Two-line pragma addition in `_conn()` | S | none |
| 2.4 | `/source` checks owner-only while `/pdf` checks `can_access` — team members can't open non-PDF source docs | P2 | High | `main.py:639` vs `:596` | Live collaboration bug today | Use `can_access` in `/source` | S | none |
| 2.5 | JOBS dict in-memory only; restart loses in-flight jobs; orphaned upload folders accumulate | P2 | High | `main.py:173, 206-232` | Confusing "expired" jobs (observed live); disk creep | Persist job *state transitions* (not per-chunk ticks — attack agent's contention caveat) to SQLite + startup sweep marking orphans `error`; cleanup orphan folders | M | 2.3 |

### Root cause 3: Failure is reported as success (fail-open everywhere, surfaced nowhere)

| # | Finding | Pri | Conf | Evidence | Consequence | Recommendation | Effort | Deps |
|---|---------|-----|------|----------|-------------|----------------|--------|------|
| 3.1 | LLM outage → per-chunk empty returns → "successful" tender missing non-gating requirements; job status can't express "degraded" | P1 | High | `extract.py:417-450`; `pipeline.py:428-433`; README's own G-022/G-028 postmortems | User trusts an incomplete compliance matrix. (Downgraded from "silent disqualifier loss" — the gating net floors that case, `pipeline.py:165`, `test_net_floor.py`) | Count failed chunks in the pipeline; job ends `done_degraded` with a visible banner when >0 | M | 2.5 helps |
| 3.2 | Skipped pack documents collected but never reported | P1 | High | `pipeline.py:384-393` (dead variable) | Whole documents silently absent from the matrix | Thread `skipped` into the job result + UI warning | S | none |
| 3.3 | Autofill all-or-nothing on one 429, swallowed | P2 | High | `pipeline.py:236`; `engine/README.md:39` | Zero answers, indistinguishable from not-run | Per-requirement try/except in `draft_all`; report partial count | S–M | none |
| 3.4 | Engine imports fall back to thin placeholders on ImportError — a mis-rooted deploy silently ships degraded reconcile/routing (bit them once: G-009) | P2 | High | `pipeline.py:43-103` + `main.py:56` (five guarded sites); `Dockerfile:4-9` | Second source of truth for dedupe thresholds (0.86/0.65 vs engine's 0.70); silent quality cliff | Since both deploy paths now ship `engine/` (`Dockerfile:19`, `render.yaml:19` `rootDir: .`), replace silent fallbacks with fail-at-startup. Scope honestly: 5 sites + `test_pipeline_wiring.py:21` + Dockerfile comment in one commit (attack-agent caveat) | S–M | 1.2 (CI catches the test) |
| 3.5 | Frontend poll loop: no timeout/backoff/abort; one network blip aborts the flow; keeps polling after navigation | P2 | High | `UploadDropzone.tsx:123-133` | Stuck/zombie polls on flaky networks | AbortController + max duration + transient-error retry | S | none |

### Root cause 4: Trust boundary drawn for a single-tenant demo

| # | Finding | Pri | Conf | Evidence | Consequence | Recommendation | Effort | Deps |
|---|---------|-----|------|----------|-------------|----------------|--------|------|
| 4.1 | `AUTH_SECRET` falls back to a hardcoded dev secret; server boots and signs tokens with it | **P0** | High | `auth.py:68, 97-98` | Anyone with repo access can forge a valid JWT for any deployment that missed the env var | Fail at startup when the dev secret would be used and `FLY_APP_NAME` (or a new `ENV` flag) indicates prod. Pair with deploy health-check gating so a botched secret ≠ unbootable outage (attack-agent caveat). The "obviously-refused-looking" default (`auth.py:15-16`) shows intent; make it enforcement | S | none |
| 4.2 | PII committed: `crm/leads.csv` (~400 named contacts, emails, phones, profiling notes), `bidframe_outreach_mailmerge.csv` (352 rows w/ full personalized bodies), 6 more CSVs, `crm/drafts/` | **P0** | High | files read directly; violates the repo's own rule (yc-story: PII "never in this repo") | UK GDPR exposure for a company selling to the UK public sector; toxic if repo is ever shared/shown | Move CRM out of git **now** (stop the bleeding, S). History scrub is a separate coordinated event: `git filter-repo` + force-push conflicts with AGENTS.md's force-push ban, invalidates 4 clones + Vercel/codemap integrations — schedule a freeze window; if the repo stays private, scrub at the next natural pause (attack-agent rescoping, accepted) | S now, M later | team coordination |
| 4.3 | Bearer JWTs in query strings on `/pdf`, `/source`, `/events` | P1 | High | `main.py:575, 620, 831`; `api.ts:663-668` (its own comment contradicts `api.ts:180-182`) | 7-day tokens in access logs, history, Referer | Short-lived signed URLs for docs; cookie or short-lived token for SSE | M | none |
| 4.4 | Mammoth DOCX → `dangerouslySetInnerHTML`, unsanitized | P1 | Med | `DocxSourceView.tsx:108`; no DOMPurify in deps | Self-XSS today; **stored XSS across users once sharing is used** — and teams/share/comments endpoints are already live (`ShareRequest`, `test_teams_comments.py`) | DOMPurify before render (~1 hr). Do before promoting sharing to pilots | S | none |
| 4.5 | CORS `allow_origin_regex` matches any `*.vercel.app` | P2 | High | `main.py:75` | Any Vercel-hosted attacker origin passes CORS (bearer-not-cookie limits blast radius) | Pin to the team's Vercel project domains | S | none |
| 4.6 | No rate limiting (login brute force slowed only by PBKDF2 cost); zip expansion trusts `infolist()` metadata then inflates into RAM; whole packs buffered in memory | P2 | Med | `main.py:141-166, 359`; `auth.py` | DoS/OOM vectors (one OOM already observed) | slowapi on `/auth/login` + `/upload`; stream-with-cap on zip entry read | M | none |
| 4.7 | Prompt injection: raw tender text into gating-filter prompts could convince both judges to DROP a real gate — the one injection path that can suppress a disqualifier (filter is drop-only over the net's output); groundedness check verifies citation *existence*, not claim truth | P2 | Med | `gating_filter.py:121, 144`; `answer.py:167-172`; no injection tests (test_adversarial_safety tests invariants, not injection) | Malicious tender/capability doc degrades output | Keep `GATING_FILTER` off by default (it is); add one injection red-team test to the eval harness | S–M | none |

### Root cause 5: The documentation layer decayed into a second, false system of record

| # | Finding | Pri | Conf | Evidence | Consequence | Recommendation | Effort | Deps |
|---|---------|-----|------|----------|-------------|----------------|--------|------|
| 5.1 | Five schema copies; CLAUDE.md still 15-field (code: 22), injected into every agent session; `schema.py` docstring falsely claims to mirror AGENTS.md; one real TS/Py mismatch (`EvidenceRef.page` required in TS, optional in Pydantic) | P1 | High | `schema.py:96-135` vs `types/requirement.ts` vs CLAUDE.md vs AGENTS.md vs `tender-master-plan.md:66` | Agents (the team's main workforce) build against the wrong contract | Declare `schema.py` + `types/requirement.ts` the only authority; in CLAUDE.md/AGENTS.md **replace the schema with a pointer, don't delete** — agents need the reference in-context (attack-agent caveat, accepted). Fix the `page` nullability | S | none |
| 5.2 | AGENTS.md API section: wrong upload shape (documents `{tender_id, requirement_count}`, code returns `{job_id, tender_id}` + polling, `main.py:325-430`), no auth mention, 6 of 28 routes; `backend/README.md` table ~40% of reality; stale inline claims (`types/requirement.ts:32-33` says an endpoint "doesn't exist yet" that exists at `main.py:741`) | P1 | High | cited inline | An agent following the read order gets 401s and wrong shapes | One honest pass over AGENTS.md + backend/README endpoint table; delete `tender-master-plan.md`'s stale sections or mark it historical | S–M | 5.1 |
| 5.3 | ~57 root markdown files; ≥13 are outreach/sales artifacts, ~10 pitch/demo narrative, several dated one-offs; `START-HERE.md` indexes files that moved/don't exist (`gtm-plan.md`) | P2 | High | root `ls`; infra-agent count | Onboarding noise; stale docs already caused the Render/Fly confusion | Move outreach → `crm/` (leaving with 4.2) or `archive/`; keep the ~12 load-bearing files. **Keep** `comms/`, STATUS.md, role files — they're the agent-team's coordination infra, not sprawl | S | 4.2 |
| 5.4 | Hourly codemap cron is doing the primary job (3–4 back-to-back bot commits prove the "regenerate in-commit" rule is routinely skipped); it's a bot committing to main 24×/day with rebase-race retry logic | P3 | High | `codemap.yml:36-56`; commits `752a8c2`…`1163e8c` | History noise, race hazards | Switch trigger to `push` with paths filter | S | none |

### Root cause 6: The frontend carries the company (product + GTM) in one bundle with no tests

| # | Finding | Pri | Conf | Evidence | Consequence | Recommendation | Effort | Deps |
|---|---------|-----|------|----------|-------------|----------------|--------|------|
| 6.1 | Zero frontend tests, no test runner configured | P1 | High | no test files/script in `frontend/` | The 26k-LOC surface that closes pilots has no regression protection | Don't chase coverage: ~10 tests on the two things that matter — `RequirementsContext` decision/undo/merge logic and `lib/dedupe.ts` folding rules — plus one Playwright smoke of upload→matrix→decision (Chromium is preinstalled) | M | 1.2 |
| 6.2 | `ComplianceMatrix.tsx` (1,332) and `MatrixView.tsx` (1,159): **layered, not duplicated** — MatrixView imports ComplianceMatrix; but marketing surfaces (`landing/HeroResolve.tsx:7`, `PitchDeck.tsx:27`, `DemoView.tsx:8`) mount the live product component directly | P2 | High | importer graph verified by attack agent | Every matrix evolution risks the landing page and pitch deck; demo choreography (`mockReplayFrames`, `playReveal`) is interleaved inside the core provider (`RequirementsContext.tsx:300-339`) and upload path | **Not** consolidation (original draft finding withdrawn — premise was wrong). Instead: give marketing surfaces a prop-frozen snapshot wrapper, and extract demo-replay choreography out of `RequirementsContext` into a demo-only module | M | 6.1 |
| 6.3 | 875-line context provider, ~30 functions, unmemoized value object → every state change re-renders all consumers | P2 | High | `RequirementsContext.tsx:821-864` | Perf degradation as matrix grows; change amplification | `useMemo` the value; split demo-replay out (with 6.2) | S–M | none |
| 6.4 | ~6,800 LOC (~26%) marketing theater + ~8 MB of assets in the product bundle repo | P3 | High | LOC counts per `components/landing|pitch|demo` | Slower builds, mixed concerns — but this is the company's distribution engine right now (defense point, accepted) | Leave until after pilots; then split marketing site out | L | not now |
| 6.5 | 1.4 MB prebake JSON + heavy client deps (`pdfjs-dist`, `exceljs`, `mammoth`, `docx`, `@xyflow/react`); dynamic-import status unverified | P3 | Med | `src/data/*.json`; `package.json` | Bundle weight | Audit code-splitting once, opportunistically | S | none |

**Findings raised then withdrawn after the challenge round** (kept for honesty): "frontend duplicates engine dedupe" — `dedupe.ts` is display-only, reversible folding with its own documented contract; "three PDF libs is confusion" — it's deliberate layered recall engineering for messy legacy PDFs (`ingest.py:64-100`); "consolidate the two matrix components" — they're layered (see 6.2); "silent disqualifier loss on LLM failure" — the deterministic gating net specifically floors that case; "/draft clobbers everything" — narrowed to the drafting-window race (2.1); "per-row optimistic-concurrency versioning" — rejected as premature given live SSE + pilot scale.

---

## E. Proposed target architecture (12–24 months)

**Principle: this is already approximately the right architecture. The target is the same boxes with the failure modes closed — not new boxes.**

**Remains (unchanged):**
- Modular monolith: FastAPI + engine-as-imported-library + Next.js. No microservices, no queue service, no Kubernetes.
- SQLite — with WAL/busy_timeout, on a verified volume, with Litestream replication. **Stated migration trigger** (per the attack agent): move to Postgres + a second machine only when you need zero-downtime deploys during a pilot's working day or a second app process (which also breaks in-process SSE, `events.py:9-11`). Not before.
- Thread-based background extraction (no Celery/Redis) — but with job state persisted and orphan-swept.
- The engine's design: conservative reconcile, deterministic gating net, drop-only fail-open gating filter, groundedness-gated autofill, the eval harness and gold sets. Untouched.
- Invite-only PBKDF2+JWT auth; mock-first frontend seam; SSE collaboration; comms/STATUS agent coordination.

**Changes (hardening, not re-architecture):** fail-hard startup checks (AUTH_SECRET, engine importability) replacing silent degradation; per-row draft merges replacing `replace_drafts`; degraded/error job states replacing success-with-holes; rollback-on-PATCH-failure; DOMPurify; signed URLs replacing `?token=`; CI + pinned deps + Sentry + Litestream.

**Consolidated:** one backend deploy config (Fly; frontend stays on Vercel — "one target per tier"); one schema authority (`schema.py` + `types/requirement.ts`, markdown copies become pointers); one endpoint reference (backend/README regenerated from the FastAPI OpenAPI schema, so it can't drift); demo choreography extracted from `RequirementsContext` into a demo module.

**Deleted:** `render.yaml`, `vercel.json` backend service block, the five ImportError fallback branches + placeholder reconcile (`pipeline.py:43-103`), dead code (`skipped` handling replaced by real reporting, `get_requirement_owner`, `mixed_pack_smoke.py` if confirmed superseded), PII CSVs and outreach files from the repo, stale schema blocks in CLAUDE.md/`tender-master-plan.md`, the hourly cron trigger.

**Deliberately not built:** Postgres, Redis, worker services, optimistic-concurrency versioning, a component library refactor, marketing-site split, multi-region — all premature at <10 users.

---

## F. Migration roadmap

**Do now (P0 — ~2 engineer-days total, no dependencies, each independently shippable):**
1. Verify `DATABASE_URL` points at `/data` on the live machine; move `UPLOAD_DIR` to the volume; add Litestream. *Acceptance: deploy the app, confirm tenders + source PDFs survive; restore a Litestream replica to a scratch machine.*
2. Fail-hard on dev `AUTH_SECRET` in prod (add an `ENV` flag; gate behind Fly health checks). *Acceptance: unset secret → machine fails health check and old version keeps serving.*
3. Move `crm/` + outreach CSVs/md out of git; add to `.gitignore`. *Acceptance: `git ls-files | grep -iE 'crm|outreach|mailmerge'` returns nothing.* (History scrub scheduled separately — see "do next".)
4. CI workflow: key-gated pytest + frontend build/lint on push/PR. *Acceptance: a deliberately broken commit goes red.*
5. Pin `backend/requirements.txt`. *Acceptance: Docker build uses the lock; rebuild is reproducible.*

**Do next (P1 — the correctness/trust batch, order matters):**
6. Surface failure: skipped-docs reporting (3.2, S) → failed-chunk counting + `done_degraded` job state (3.1) → persist job transitions + startup orphan sweep (2.5). *Prereq: CI (step 4) green; acceptance: kill OpenAI key mid-upload → UI shows a degraded banner, not a clean matrix; restart mid-job → job shows `error`, not eternal processing.*
7. `/draft` per-row merge via the `update_answer` pattern (2.1). *Test first: extend `test_draft_concurrency.py` with a PATCH-during-draft case that fails on current code.*
8. Frontend write integrity: rollback-on-PATCH-failure + bounded poll (2.2, 3.5). *Acceptance: PATCH returning 500 visibly reverts the row.*
9. DOMPurify on DOCX render (4.4) — **before promoting the share feature to any pilot.** Signed URLs / cookie for `?token=` endpoints (4.3). Fix `/source` authz (2.4, one line).
10. Docs truth pass (5.1, 5.2): schema pointers, regenerate endpoint table from OpenAPI, fix `EvidenceRef.page`. Cheap, and it de-confuses every future agent session — do it the same week.
11. Delete engine fallbacks, all five sites + `test_pipeline_wiring.py:21` in one commit (3.4). *Safe intermediate state: none needed — both deploy paths already ship engine/.*

**Do later (P2):** SQLite pragmas (2.3 — can ride along with step 6); ~10 frontend tests + one Playwright smoke (6.1); prop-frozen marketing matrix wrapper + demo-choreography extraction (6.2, 6.3); rate limiting + zip streaming (4.6); CORS pinning (4.5); injection red-team test (4.7); root-doc archive sweep (5.3); codemap cron → push trigger (5.4); PII history scrub as a coordinated freeze-window event (amend AGENTS.md's force-push rule for the one commit, re-clone instructions, secret-scan after).

**Do not do (rejected as premature or wrong):** Postgres/Redis/queue migration; per-row optimistic-concurrency versioning; matrix "consolidation"; deleting `dedupe.ts`; marketing-site extraction; microservices of any kind; rewriting the heuristic extractor or the `_STRONG` regex (tested, gold-verified); frontend state-management framework adoption.

---

## G. Do not change

These are genuinely good and would be dangerous or wasteful to rewrite:

- **The engine** (`engine/reconcile.py`, `gating_scan.py`, `answer.py`, `eval.py`): conservative merge with numeric-conflict blocking, safety escalation (any member gating → merged row gating), noisy-OR confidence, the deterministic disqualifier floor, groundedness-gated answers that refuse to bluff, and an eval harness with bipartite matching and honest data hygiene (quarantined mislabelled gold set, `gold-set/eval-manifest.json`). This is the company's technical moat; the incident-referenced docstrings are its institutional memory.
- **The test investment where it counts:** `test_adversarial_safety.py`, `test_net_floor.py`, `test_demo_no_bluff.py`, `test_pipeline_wiring.py` pin real behavioral invariants and real shipped bugs. The engine-tests-exercise-the-backend layering is untidy but it *is* the integration suite — don't move it until something breaks because of where it lives.
- **The mock/live API seam** (`api.ts:11-15`, `isApiEnabled()`): demo-safe by default, one env var to go live, seed/live races explicitly handled (`RequirementsContext.tsx:188-194`).
- **The layered PDF ingest** (fitz → pypdf → pdfplumber → capped vision OCR): three libraries is deliberate recall engineering for exactly the messy documents this product exists for.
- **`frontend/src/lib/dedupe.ts`:** display-only, reversible, gating-safe folding with a 30-line contract comment. It is not a duplicate of engine reconcile; deleting it breaks `matrix-derive.ts` and `text-match.ts`.
- **Auth fundamentals:** PBKDF2-200k, constant-time compare, Google tokeninfo verification with aud/iss checks, 404-not-403 anti-probing — above-average for week two. Fix the dev-secret fallback and token-in-URL; keep the rest.
- **The demo/marketing investment itself:** ~26% of frontend LOC funds the company's only distribution channel, and the replay is provably honest (real pipeline frames, tested no-bluff invariant). Restructure its coupling (6.2), don't delete it.
- **SQLite + single machine + threads:** correct for this scale. The mistake would be migrating infrastructure instead of closing the failure modes above.

## H. Unknowns

1. **Is `DATABASE_URL` actually set to `/data/tender.db` on the live Fly machine?** Resolves finding 1.1's severity from "possible total data loss per deploy" to "uploads-only loss." Evidence: `fly ssh console -C 'env | grep DATABASE_URL'` or `fly secrets list`.
2. **Is the Render instance still running (and serving stale data to anyone)?** Evidence: hit `bidframe-api.onrender.com/health`; check Render dashboard.
3. **Does the frontend build/lint actually pass at HEAD?** Configs exist; `node_modules` was absent here. Resolved automatically by roadmap step 4.
4. **Does the `generalist/prod-clerk-supabase` branch (Clerk + Supabase + durable worker, per STATUS.md) exist on the remote, and is it intended to supersede this architecture?** If a parallel prod stack is real, parts of this roadmap (jobs table, auth hardening) may be superseded — reconcile before investing. Evidence: `git fetch --all` on a full clone; ask the generalist.
5. **Are mammoth's HTML-generation options restricted anywhere?** Determines whether 4.4 is exploitable in practice or defense-in-depth. Evidence: read the mammoth call options in `DocxSourceView.tsx` / any wrapper.
6. **Repo visibility trajectory:** private forever vs. shown to buyers/YC — determines whether the PII history scrub is urgent or can wait for a natural pause.
7. **Is `vercel.json`'s backend service block live or inert?** Evidence: Vercel dashboard; a request to `/api/backend/health` on the production frontend domain.

---

*Bottom line: this is a well-built prototype with an honest core and demo-grade edges. Nothing here requires re-architecture. Roughly two days of P0 work (data durability, CI, dep pinning, auth fail-hard, PII removal) and one focused P1 week (surface failures, fix the two write-path races, sanitize DOCX, truth-up the docs) turns it into something a pilot can safely depend on — and everything on the "do not do" list should stay undone.*
