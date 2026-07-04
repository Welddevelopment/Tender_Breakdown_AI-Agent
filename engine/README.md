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

## Demo fixtures + re-baking

`frontend/src/data/spso-prebake.json` (SPSO hero) + `nhs-prebake.json` (NHS 66pp messy-proof) are `GET /requirements`-shaped snapshots of a **real gpt-4o run**, so the demo serves real, source-traced, autofilled data with **no live API call on stage** (G-020/G-023). Regenerate by running the pipeline against a demo tender with `OPENAI_API_KEY` set.

- **Autofill grounding is retrieval-gated:** token-overlap retrieval over `fixtures/capability/` decides answer vs `needs_input`, so the **mock and OpenAI answerers ground the *same* set** (only the prose differs). To make autofill ground **more**, add capability docs — don't touch the answerer.
- **Re-baking gotcha:** the demo key is on a low **30k tokens/min** tier, and `pipeline._autofill` is **all-or-nothing** (one unhandled 429 abandons the whole batch), so bulk OpenAI drafting of 100+ reqs rate-limits. Throttle hard (concurrency 1–2 + SDK `max_retries`) or use the **`MockAnswerer`** (grounds the same set, instant, free, cited). The committed fixtures use the mock/upload-time grounding; polished OpenAI prose is the live "Autofill with AI" button.
- **`pytest engine/tests/`** = **116** with the backend deps installed, **~110** without — the `test_*_wiring.py` FastAPI tests `importorskip` `fastapi`/`PyJWT`/`pydantic` and need an authed user (J-042).

## Output contract

`reconcile` emits the **15-field `Requirement`** + `{tender_id, title, requirements}` envelope from `frontend/src/types/requirement.ts`. The additive autofill fields (`answer`, `open_questions`, `capability_docs`) are populated by the answer-draft step and now flow through the live API (the frontend type + matrix already carry them). Merge provenance lives in the reconcile **report**, never in a requirement object.

## Mixed-pack / format-neutrality (gotcha)

The trust layer is **format-neutral** — `reconcile`/`gating_scan`/`eval` operate on an opaque
`source_page` int + text and never open a PDF, so Word/Excel/CSV sources flow through unchanged
(`backend/app/ingest_office.py` bakes a locator like `[XLSX Pricing row 5 | A5:E5]` into the page text
and collapses every Office doc to `Page(number=1)`). Tests: `test_mixed_pack_engine.py`.

- **Cross-document dedupe is a PIPELINE-level partition, not a reconcile guard.** `group_candidates`
  has **no `source_doc_id`** awareness (`source_doc_id`/`source_filename` aren't in `FINAL_KEYS` — the
  backend re-attaches them). So identical text on `source_page=1` from two *different* files **merges if
  grouped together** — and every Office doc lands on page 1, so this is the real collision case. The
  safety is that `backend/app/pipeline.py::run_pipeline_multi` reconciles **each document independently**,
  then renumbers. **Do not flatten that partition, and do not add `source_doc_id` to the merge key**
  (schema-adjacent). Regression-locked by `test_per_document_reconcile_keeps_cross_doc_requirements_separate`.
- **`source_page` is the only int-contract field.** A non-PDF `source_clause` (e.g. `XLSX: Pricing!A12`)
  is an opaque string everywhere — never `int()`-ed — so eval/reporting renders it fine. Office docs keep
  `source_page=1`; never treat that as a real PDF page or a highlight (`source_rect` stays null for Office).
- **`scripts/eval_all.py` + `scripts/gating_recall.py` are PDF-bound by design** (they `fitz.open` the gold
  corpus). That's fine — they're batch harnesses over the PDF gold sets, not the runtime trust layer.

## Modules

- `reconcile.py` — conservative dedupe/merge (char + token-Jaccard + same page + same clause), noisy-OR confidence, safety escalation (+ audit report).
  - **Null-safety invariant (regression trap):** a *real* extractor emits `char_start=None` / `source_page=None` when it can't locate an excerpt verbatim — so any sort/compare on those fields must coalesce `None→0` (`… or 0`), **not** `.get(key, 0)` (that default only fills a *missing* key, so a present-but-`None` value slips through and crashes the sort with `None < int`). This bit `_canonical` and failed *every* live-OpenAI async upload whose merge group tied on confidence + excerpt-length while mixing an `int` and a `None` char_start (fixed 2026-07-01, **G-028**; regression test `test_merge.py::test_canonical_tiebreak_tolerates_none_char_start`). The heuristic extractor never hits it (its excerpts are verbatim → char_start is always an int) and the tests use `?sync=1`, so **only a live OpenAI + async smoke surfaces this class of bug** — keep one in the loop.
- `similarity.py` — the swappable similarity seam (difflib char-ratio + content-token Jaccard). Shared with eval + retrieval.
- `eval.py` — score extraction vs a hand-labelled gold set (recall / precision / gating recall + a misses report).
- `answer.py` — auditable autofill: thin RAG over the bidder's capability docs → a grounded answer or `needs_input` (**never bluffs**). `MockAnswerer` (free, deterministic) + `OpenAIAnswerer` (J's `prompts/answer-generation.md` + `gap-interview.md`). `draft_all(max_workers=N)` parallelizes.
- `eval_answers.py` — **groundedness eval**: every grounded answer's citation must verifiably exist in the capability docs; no unevidenced auto-answers. Turns "never bluffs" into a number.
- `_io.py` — UTF-8-safe JSON read/write.
- `scripts/` — `calibrate.py` (needs_review threshold), `eval_all.py` (aggregate across tenders), `run_tender.py` (PDF→extract→reconcile→eval), `draft_answers.py` (autofill demo).
- `gold/`, `fixtures/capability/` — hand-labelled gold sets + the demo bidder's (AcmeClean) capability docs.
