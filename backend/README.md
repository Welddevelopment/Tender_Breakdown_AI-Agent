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
| `store.py` | SQLite persistence (tenders + requirements + capability docs) |
| `schema.py` | the locked data contract as Pydantic models |
| `main.py` | the FastAPI app + all endpoints |

### Extraction is pluggable
- **No key →** `HeuristicExtractor` (signal words: shall/must/PASS-FAIL). Proves plumbing. *Not the demo-quality bar.*
- **`OPENAI_API_KEY` set →** `OpenAIExtractor` (our provider) — function-calling structured output, gating recall 1.0 on SPSO.
- **`ANTHROPIC_API_KEY` →** `ClaudeExtractor` (alternative). Force any with `LLM_PROVIDER=openai|anthropic|heuristic`.

## Endpoints

| Method | Path | Does |
|--------|------|------|
| `GET` | `/health` | `{ status, extractor }` — also wakes up the Render free tier |
| `GET` | `/tenders` | List all uploaded tenders `[{ tender_id, title, requirement_count }]` |
| `POST` | `/tenders/upload` | multipart PDF (`file`, optional `title`) → `{ tender_id, requirement_count }` |
| `GET`  | `/tenders/{id}/requirements` | `{ tender_id, title, requirements, capability_docs }` in the locked schema |
| `POST` | `/tenders/{id}/draft` | Auditable autofill — re-draft answers with `?provider=openai` or upload capability docs |
| `PATCH`| `/requirements/{id}` | body `{ status?, decision? }` → updated requirement |

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
