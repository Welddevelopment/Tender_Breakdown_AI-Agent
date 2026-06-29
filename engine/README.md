# engine/ — Generalist lane (reconcile · routing · eval · auditable autofill)

Pure-Python (stdlib + `pytest`) verification & autofill layer the Generalist owns. Sibling to `/backend`; never nested under it. ~116 tests (incl. an adversarial trust-invariant suite).

## Run (always from the repo root)

```bash
# tests
python -m pytest engine/tests/ -v

# reconcile a raw extraction envelope -> clean final envelope + report
python -m engine.reconcile engine/tests/fixtures/mock_raw_extraction.json --out out.json --report report.json

# score extraction against a gold set (recall / precision / gating recall / dangerous misses)
python -m engine.eval --gold engine/gold/mock.gold.json --output out.json

# auditable autofill: grounded answers + gap interview (mock = free; --provider openai = precise)
python -m engine.scripts.draft_answers --gold gold-set/spso-cleaning.labels.csv --out out.enriched.json

# groundedness eval: prove the autofill never bluffs (0 = clean)
python -m engine.eval_answers --tender out.enriched.json --capability engine/fixtures/capability
```

Use `python` (not `python3` / `py`). All file I/O and stdout are UTF-8 (this box defaults to cp1252 — see `comms/board-j.md` J-008).

## Live in the backend

The engine is imported by `backend/app/pipeline.py` + `main.py` behind an **import-safe fallback**, so:
- **reconcile + `needs_review` routing** run inside the real pipeline (`POST /tenders/upload`);
- **autofill** runs on upload (free mock answerer) and via **`POST /tenders/{id}/draft`** (OpenAI, parallelized, `?limit=N`, optional capability-doc upload).

A **backend-rooted deploy** can't import `engine/`, so it silently falls back to placeholders + skips autofill. To make the engine live on Render, the deploy must root at the repo (`render.yaml rootDir: .`) — see `comms/board-generalist.md` **G-009**.

## Output contract

`reconcile` emits the **15-field `Requirement`** + `{tender_id, title, requirements}` envelope from `frontend/src/types/requirement.ts`. The additive autofill fields (`answer`, `open_questions`, `capability_docs`) are populated by the answer-draft step and now flow through the live API (the frontend type + matrix already carry them). Merge provenance lives in the reconcile **report**, never in a requirement object.

## Modules

- `reconcile.py` — conservative dedupe/merge (char + token-Jaccard + same page + same clause), noisy-OR confidence, safety escalation (+ audit report).
- `similarity.py` — the swappable similarity seam (difflib char-ratio + content-token Jaccard). Shared with eval + retrieval.
- `eval.py` — score extraction vs a hand-labelled gold set (recall / precision / gating recall + a misses report).
- `answer.py` — auditable autofill: thin RAG over the bidder's capability docs → a grounded answer or `needs_input` (**never bluffs**). `MockAnswerer` (free, deterministic) + `OpenAIAnswerer` (J's `prompts/answer-generation.md` + `gap-interview.md`). `draft_all(max_workers=N)` parallelizes.
- `eval_answers.py` — **groundedness eval**: every grounded answer's citation must verifiably exist in the capability docs; no unevidenced auto-answers. Turns "never bluffs" into a number.
- `_io.py` — UTF-8-safe JSON read/write.
- `scripts/` — `calibrate.py` (needs_review threshold), `eval_all.py` (aggregate across tenders), `run_tender.py` (PDF→extract→reconcile→eval), `draft_answers.py` (autofill demo).
- `gold/`, `fixtures/capability/` — hand-labelled gold sets + the demo bidder's (AcmeClean) capability docs.
