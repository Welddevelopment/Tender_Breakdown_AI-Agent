# Backend — Bidframe API

FastAPI service: PDF ingest → chunk → extract → classify → graph → SQLite → REST API.

> **Status (2026-06-29, Day 5 — locked):** pipeline hardened + stress-tested end-to-end.
> Corrupt/empty/encrypted PDFs return a helpful 422 (never a crash). Per-chunk error
> isolation so one flaky chunk doesn't kill the tender. LLM calls retry with exponential
> backoff. Heuristic extractor runs with no key; auto-upgrades to OpenAI when
> `OPENAI_API_KEY` is set. 98 engine tests green. 2.1s per tender (heuristic path).

## Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill OPENAI_API_KEY for real extraction quality
uvicorn app.main:app --reload    # http://localhost:8000  ·  docs at /docs
```

Check it's alive: `curl http://localhost:8000/health` → `{"status":"ok","extractor":"heuristic"}`

## The pipeline (`app/`)

| Module | Does |
|--------|------|
| `ingest.py` | PDF → page-numbered text (PyMuPDF → pypdf fallback → pdfplumber for tables → header/footer stripping → sparse-page OCR flagging) |
| `chunk.py` | structure-aware **overlapping** chunks (nothing lost at boundaries) |
| `extract.py` | chunk → raw requirements. **Pluggable:** heuristic (no key), **OpenAI** (`OPENAI_API_KEY`), or Claude (`ANTHROPIC_API_KEY`). Retries 3× with exponential backoff. |
| `graph.py` | criteria_ref + depends_on edges (regex + cross-reference detection) |
| `pipeline.py` | ingest → chunk → extract → reconcile → graph → autofill → `TenderResponse` |
| `store.py` | SQLite persistence (tenders + requirements + capability docs + users) |
| `schema.py` | the locked data contract as Pydantic models |
| `auth.py` | invite-only auth: pbkdf2 password hashing, JWT sessions, the `current_user` guard |
| `admin.py` | CLI to create/list accounts (`python -m app.admin …`) — there is no public signup |
| `main.py` | the FastAPI app + all endpoints |

### Extraction is pluggable
- **No key →** `HeuristicExtractor` (signal words: shall/must/PASS-FAIL). Proves plumbing. *Not the demo-quality bar.*
- **`OPENAI_API_KEY` set →** `OpenAIExtractor` (our provider) — function-calling structured output, gating recall 1.0 on SPSO.
- **`ANTHROPIC_API_KEY` →** `ClaudeExtractor` (alternative). Force any with `LLM_PROVIDER=openai|anthropic|heuristic`.

### Async upload — the traps

`POST /tenders/upload` runs extraction on a **background thread** (`_run_extract_job`) and returns `{job_id, tender_id}`; the UI polls `GET /tenders/jobs/{id}` until `done`. `?sync=1` blocks instead and returns the result directly (the tests + eval harness use this path). ⚠️ **The job passes a `docs` list and must call `run_pipeline_multi` — do NOT add a second `_run_extract_job` that takes a `pdf_path`. A duplicate definition once shadowed the real one, so the job did `Path(<list>)` and crashed *every* async upload; because the tests use `?sync=1`, nothing caught it (fixed 2026-07-01, G-022).**

⚠️ **Both known async-upload crashes were invisible to the tests because the tests use `?sync=1` + the heuristic extractor.** The second was an engine reconcile crash (`None < int`) that failed *only* live-OpenAI async jobs (fixed 2026-07-01, G-028 — see `engine/README.md` reconcile null-safety invariant). **Lesson: after touching the extract/reconcile path, run a live OpenAI async smoke, not just `pytest` — the sync+heuristic path can be green while the real async path crashes.**

## Authentication (invite-only)

Bidframe is a paid product, so every tender endpoint is gated: it requires a bearer
token and only ever returns the **caller's own** tenders. There is no public signup —
you create accounts for customers with the admin CLI.

```bash
# 1. Set a strong signing secret (>=32 bytes) wherever the API runs. Without it the
#    dev default is used, which is insecure and fine only for local work.
export AUTH_SECRET="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"

# 2. Create an account (prompts for the password; --password to pass it inline).
cd backend
python -m app.admin create-user alice@firm.co.uk
python -m app.admin list-users
python -m app.admin set-password alice@firm.co.uk   # reset a password
```

Sign in from the frontend, or directly:
`POST /auth/login {email, password}` → `{ token, user }`. Send the token as
`Authorization: Bearer <token>` on every request (the frontend does this
automatically once signed in). Tokens are stateless JWTs, valid 7 days.

## Endpoints

Everything under `/tenders` and `/requirements` requires a valid bearer token (401
otherwise) and is scoped to the signed-in user (someone else's tender reads as 404).

| Method | Path | Auth | Does |
|--------|------|------|------|
| `GET` | `/health` | — | `{ status, extractor }` — also wakes up the Render free tier |
| `POST` | `/auth/login` | — | `{ email, password }` → `{ token, user }` (generic 401 on bad creds) |
| `GET` | `/auth/me` | ✓ | the signed-in `{ id, email }` — the frontend validates the token with this |
| `GET` | `/tenders` | ✓ | List the user's tenders `[{ tender_id, title, requirement_count }]` |
| `POST` | `/tenders/upload` | ✓ | multipart PDF (`file`, optional `title`) → `{ job_id, tender_id }` (`?sync=1` → `{ tender_id, requirement_count }`) |
| `GET`  | `/tenders/{id}/requirements` | ✓ | `{ tender_id, title, requirements, capability_docs, source_docs, award_criteria }` in the locked schema |
| `GET`  | `/tenders/{id}/pdf` | ✓ | the original PDF inline (bearer header **or** `?token=` for `<iframe>`/link opens) |
| `POST` | `/tenders/{id}/draft` | ✓ | Auditable autofill — re-draft answers with `?provider=openai` or upload capability docs |
| `PATCH`| `/requirements/{id}` | ✓ | body `{ status?, decision? }` → updated requirement |

## Error handling

| Scenario | HTTP | Detail |
|----------|------|--------|
| Non-PDF upload | 400 | "Please upload a PDF." |
| Corrupt / empty / encrypted PDF | 422 | "Could not parse … may be corrupt, encrypted, or image-only." |
| File > 50 MB | 413 | "File too large." |
| Tender not found | 404 | "Tender not found." |
| Requirement not found | 404 | "Requirement not found." |
| Autofill engine not available | 503 | "Autofill engine not on this deployment's path." |
| Pipeline crash (unexpected) | 500 | Descriptive message + original error |

## Measured accuracy (SPSO tender, OpenAI extractor)

- **Recall:** 0.947 (18/19 requirements caught)
- **Gating recall:** 1.0 (both disqualifiers caught)
- **Gating accuracy:** 1.0 (zero over-flagging)
- **Dangerous misses:** 0
- **Groundedness:** 0 bluffs (42/42 citations verified)

## Demo tips

- **Render free tier sleeps on idle.** Hit `GET /health` ~30s before the demo to wake it.
- **SQLite resets on Render redeploy.** Re-upload the tender fresh on stage.
- **Keep the mock as the hero showcase** until `OPENAI_API_KEY` is on Render — heuristic gives thin content.

## Quick local check
```bash
python scripts/parse_check.py data/tenders/<file>.pdf
```
