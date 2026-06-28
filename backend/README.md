# Backend — Tender Breakdown API

FastAPI service: PDF ingest → chunk → extract → classify → SQLite → REST API.

> **Status (2026-06-28):** pipeline + all three endpoints **implemented and tested
> end-to-end** on a real tender (SPSO cleaning ITT → 20 requirements). Scaffolded by J
> as cover while backend ramps up — **backend owns hardening it** (see "Owner TODOs").

## Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # optional — fill ANTHROPIC_API_KEY to use Claude
uvicorn app.main:app --reload    # http://localhost:8000  ·  docs at /docs
```

Check it's alive: `curl http://localhost:8000/health` → `{"status":"ok","extractor":"heuristic"}`

## The pipeline (`app/`)

| Module | Does |
|--------|------|
| `ingest.py` | PDF → page-numbered text (PyMuPDF, pypdf fallback) |
| `chunk.py` | structure-aware **overlapping** chunks (nothing lost at boundaries) |
| `extract.py` | chunk → raw requirements. **Pluggable:** heuristic (no key), **OpenAI** (set `OPENAI_API_KEY` — our provider), or Claude (`ANTHROPIC_API_KEY`) |
| `pipeline.py` | ingest → chunk → extract → thin reconcile → `Requirement[]` |
| `store.py` | SQLite persistence (tenders + requirements) |
| `schema.py` | the locked data contract as Pydantic models |
| `main.py` | the FastAPI app + endpoints |

### Extraction is pluggable (no API key needed today)
- **No key →** `HeuristicExtractor` (signal words: shall/must/PASS-FAIL). Proves the
  plumbing + gives the frontend real data. *Not the quality bar.*
- **`OPENAI_API_KEY` set →** `OpenAIExtractor` (our chosen provider) uses
  `prompts/extraction.md` + function-calling structured output. Set `LLM_MODEL` to whatever
  your credits cover (default `gpt-4o`). This is where real accuracy comes from.
- `ANTHROPIC_API_KEY` → `ClaudeExtractor` (optional alternative). Force any with
  `LLM_PROVIDER=openai|anthropic|heuristic`.

## Endpoints (match the locked schema — see ../AGENTS.md)

| Method | Path | Does |
|--------|------|------|
| `POST` | `/tenders/upload` | multipart PDF (`file`, optional `title`) → `{ tender_id, requirement_count }` |
| `GET`  | `/tenders/{id}/requirements` | `{ tender_id, title, requirements: [...] }` in the locked schema |
| `PATCH`| `/requirements/{id}` | body `{ status?, decision? }` → updated requirement |

## Owner TODOs (backend, when back on track)
- Add the `OPENAI_API_KEY` and confirm the OpenAI path (model choice via `LLM_MODEL`; add retries/backoff).
- Harden ingest: pdfplumber fallback for tables; strip header/footer noise; OCR detection.
- Refine `source_page` to the exact page (currently chunk-level best-effort).
- Build graph edges (`criteria_ref`, `depends_on`, `is_gating` relationships).
- Hand the raw extraction list to the generalist for proper reconcile (the `_reconcile`
  in `pipeline.py` is a thin placeholder — see role-generalist.md).

## Quick local check
```bash
# parse a tender PDF without the server:
python scripts/parse_check.py data/tenders/<file>.pdf
```
