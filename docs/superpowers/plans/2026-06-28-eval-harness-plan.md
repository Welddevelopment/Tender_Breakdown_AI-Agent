# Bidframe Eval Harness — TDD Implementation Plan

Pipeline **step 10 (verification loop)** — but built **EARLY**, because it is the headline-number machine:
the proof of the scored ~35% engineering bar and the demo's *"caught X%, flagged the rest."* It reuses
`engine.similarity` (the same swappable seam reconcile uses). One engineer can execute this top-to-bottom.

> **Self-contained value:** hand-label one tender's true requirements as a gold set, run reconcile on it,
> and score it — a **real accuracy number with no dependency on the backend.** This is the Generalist's
> highest-leverage deliverable; protect its time (role-generalist.md guardrail).

---

## 1. Goal & Context

Given a hand-labelled **GOLD set** (a tender's true requirements) and the **TOOL OUTPUT** (reconcile's final
list today; backend extraction later), compute and report:

- **recall** — did we catch every requirement? (a miss = a silent disqualifier risk = the worst failure)
- **precision** — were the ones we found real, or hallucinated?
- **gating_accuracy / gating_recall** — did we catch **and correctly flag** the disqualifiers? (the safety headline)
- a **misses report** — the dangerous gold requirements we missed + the false positives we invented.

- **Home:** `engine/` (Generalist lane). New: `engine/eval.py`, `engine/gold/`, `engine/tests/test_eval_*`.
- **Reuses** `engine.similarity.similarity` (built in the reconcile plan's Phase 2 — the shared foundation).
- **Stack:** Python 3.12 stdlib only + `pytest`. **Method:** TDD. **All file I/O + stdout UTF-8** (cp1252 box, J-008).

---

## 2. What we are NOT doing (out of scope)

- **No LLM-judged matching.** Gold↔output matching is deterministic (the `similarity()` seam), so the number is reproducible and auditable.
- **No reconcile-threshold calibration here.** That is a *consumer* of eval (Day 3 confidence routing); the harness only measures.
- **No multi-tender aggregation dashboard / charts.** Score one tender; aggregation across the gold set is a thin wrapper added later.
- **No per-category precision/recall breakdown** (informational only; add on Day 4 if time).
- **No new dependencies.**

---

## 3. The gold-set format (the Generalist's second team contract)

The minimum needed to score. Humans produce one per labelled tender (everyone labels one by EOD Day 2).

`engine/gold/<tender>.gold.json`:
```json
{
  "tender_id": "tnd-001",
  "source_filename": "managed-it-tender.pdf",
  "requirements": [
    { "gold_id": "g-001", "text": "The supplier must hold ISO 9001 certification.",
      "source_page": 14, "type": "mandatory", "is_gating": true, "category": "certification" }
  ]
}
```
Load-bearing fields: `text` (matching), `source_page` (tie-break), `type` + `is_gating` (accuracy). `category` is informational.

---

## 4. Metrics (precise definitions)

**Matching** gold↔output is **one-to-one, greedy by descending similarity**, threshold `MATCH_THRESHOLD = 0.60`,
tie-break preferring equal `source_page`. Reuses `engine.similarity.similarity`. Then:

- `TP` = matched gold reqs · `FN` (miss) = unmatched gold reqs · `FP` = unmatched output reqs.
- `recall = TP / (TP + FN)` · `precision = TP / (TP + FP)` · `f1` = harmonic mean (0 if either is 0).
- `gating_accuracy` = among **matched pairs**, fraction where `output.is_gating == gold.is_gating`.
- `gating_recall` = (gold gating reqs that are **matched AND output flags `is_gating=true`**) / (all gold gating reqs). **← the safety headline: did the disqualifiers survive?**
- `report`: `misses` (unmatched gold; gating ones marked **DANGEROUS**) + `false_positives` (unmatched output).

All ratios `round(..., 4)`; guard divide-by-zero (empty gold or empty output → define the ratio as `0.0` and note it).

---

## 5. Module layout

```
engine/
  eval.py                       # match_requirements(), score(), format_report(), main(argv)
  gold/
    mock.gold.json              # the mock tender's 5 true requirements (golden)
  tests/
    fixtures/
      eval_gold_syn.json        # synthetic gold (4 reqs)
      eval_output_syn.json      # synthetic output (4 reqs) — known TP/FN/FP/misclassification
    test_eval_match.py
    test_eval_metrics.py
    test_eval_report.py
    test_eval_integration.py    # reconcile(mock raw) -> score vs mock.gold.json (the closed loop)
```
CLI (from repo root): `python -m engine.eval --gold engine/gold/mock.gold.json --output final.json [--report report.json]`

---

## Phase E0 — Golden fixtures (the hand-verified ground truth)

No test yet — these are the data every later test asserts against. **The expected metrics below are
hand-computed simple fractions; do NOT change them to fit code — if a metric mismatches, STOP and report.**

**`engine/tests/fixtures/eval_gold_syn.json`** — 4 true requirements, 3 of them gating (gs-1, gs-2, gs-4):
```json
{
  "tender_id": "syn-001",
  "source_filename": "synthetic.pdf",
  "requirements": [
    { "gold_id": "gs-1", "text": "The supplier must hold ISO 9001 certification.", "source_page": 14, "type": "mandatory", "is_gating": true,  "category": "certification" },
    { "gold_id": "gs-2", "text": "The supplier must hold employer's liability insurance of at least £5,000,000.", "source_page": 22, "type": "mandatory", "is_gating": true,  "category": "insurance" },
    { "gold_id": "gs-3", "text": "The supplier should provide a dedicated account manager.", "source_page": 48, "type": "optional",  "is_gating": false, "category": "technical" },
    { "gold_id": "gs-4", "text": "The supplier must demonstrate an annual turnover of at least £2,000,000.", "source_page": 61, "type": "mandatory", "is_gating": true,  "category": "financial" }
  ]
}
```

**`engine/tests/fixtures/eval_output_syn.json`** — 4 tool-output reqs. Matched texts are identical to gold so
matching is unambiguous; `os-2` deliberately **misclassifies** the insurance disqualifier as non-gating; `os-5` is a
**false positive**; `gs-4` (turnover) has **no** output → a **dangerous (gating) miss**.
```json
{
  "tender_id": "syn-001",
  "title": "Synthetic",
  "requirements": [
    { "id": "req-0001", "text": "The supplier must hold ISO 9001 certification.", "source_page": 14, "type": "mandatory", "is_gating": true,  "category": "certification", "confidence": 0.95, "status": "pending", "needs_review": false, "decision": null, "source_clause": "S1", "source_excerpt": "x", "depends_on": [], "draft_answer": null },
    { "id": "req-0002", "text": "The supplier must hold employer's liability insurance of at least £5,000,000.", "source_page": 22, "type": "mandatory", "is_gating": false, "category": "insurance", "confidence": 0.90, "status": "pending", "needs_review": false, "decision": null, "source_clause": "S2", "source_excerpt": "x", "depends_on": [], "draft_answer": null },
    { "id": "req-0003", "text": "The supplier should provide a dedicated account manager.", "source_page": 48, "type": "optional", "is_gating": false, "category": "technical", "confidence": 0.80, "status": "pending", "needs_review": false, "decision": null, "source_clause": "S3", "source_excerpt": "x", "depends_on": [], "draft_answer": null },
    { "id": "req-0004", "text": "All correspondence shall be conducted in English.", "source_page": 90, "type": "optional", "is_gating": false, "category": "other", "confidence": 0.70, "status": "pending", "needs_review": true, "decision": null, "source_clause": "S9", "source_excerpt": "x", "depends_on": [], "draft_answer": null }
  ]
}
```

**Hand-computed expected metrics for the synthetic pair (the golden values):**
| metric | value | why |
|---|---|---|
| matches (TP) | **3** | gs-1↔req-0001, gs-2↔req-0002, gs-3↔req-0003 (identical text) |
| misses (FN) | **1** | gs-4 (turnover) — no similar output |
| false_positives (FP) | **1** | req-0004 ("English") — no similar gold |
| recall | **0.75** | 3 / (3+1) |
| precision | **0.75** | 3 / (3+1) |
| f1 | **0.75** | harmonic mean of 0.75, 0.75 |
| gating_accuracy | **0.6667** | matched pairs: gs-1/T✓, gs-2/F✗, gs-3/F✓ → 2/3 |
| gating_recall | **0.3333** | gold gating {gs-1,gs-2,gs-4}: gs-1 caught+flagged✓, gs-2 caught-but-unflagged✗, gs-4 missed✗ → 1/3 |
| dangerous misses | **1** | gs-4 is a gating miss |

**`engine/gold/mock.gold.json`** — the mock tender's 5 true requirements. **Texts are identical to the reconcile
plan's `golden_final.json`** so the closed-loop integration (Phase E4) scores a clean 1.0:
```json
{
  "tender_id": "tnd-001",
  "source_filename": "managed-it-tender.pdf",
  "requirements": [
    { "gold_id": "g-001", "text": "The supplier shall hold a valid ISO 9001 certification at the time of tender submission.", "source_page": 14, "type": "mandatory", "is_gating": true,  "category": "certification" },
    { "gold_id": "g-002", "text": "The supplier must hold employer's liability insurance of at least £5,000,000.", "source_page": 22, "type": "mandatory", "is_gating": true,  "category": "insurance" },
    { "gold_id": "g-003", "text": "The supplier should provide a dedicated account manager for the contract term.", "source_page": 48, "type": "optional",  "is_gating": false, "category": "technical" },
    { "gold_id": "g-004", "text": "The supplier must demonstrate an annual turnover of at least £2,000,000.", "source_page": 61, "type": "mandatory", "is_gating": true,  "category": "financial" },
    { "gold_id": "g-005", "text": "The supplier shall provide three case studies of comparable public-sector contracts.", "source_page": 74, "type": "mandatory", "is_gating": false, "category": "experience" }
  ]
}
```

**Done-criteria E0:** all three fixtures parse as UTF-8 JSON.

---

## Phase E1 — `match_requirements(gold, output) -> matches, unmatched_gold, unmatched_output`

**(a) Test first — `engine/tests/test_eval_match.py`:** load the synthetic fixtures; assert exactly 3 matches with
the expected `(gold_id, output_id)` pairs; assert `gs-4` is the only unmatched gold; assert `req-0004` is the only
unmatched output; assert determinism (same call twice → identical result).

**(b) Run / watch fail:** `python -m pytest engine/tests/test_eval_match.py -v` → `ModuleNotFoundError: engine.eval`.

**(c) Implement** in `engine/eval.py`: build all `(gold, output)` candidate pairs with
`similarity(gold.text, output.text) >= MATCH_THRESHOLD` (0.60); sort by `(-sim, 0 if same source_page else 1)`;
greedily assign one-to-one (skip a pair if either side already matched). Return the three lists. Use `.get()` defensively.

**(d) Verify:** `python -m pytest engine/tests/test_eval_match.py -v` → all pass.
**Done-criteria:** 3 matches, `gs-4` unmatched gold, `req-0004` unmatched output, deterministic.

---

## Phase E2 — `score(gold, output) -> dict`

**(a) Test first — `engine/tests/test_eval_metrics.py`:** assert `recall == 0.75`, `precision == 0.75`,
`f1 == 0.75`, `gating_accuracy == 0.6667`, `gating_recall == 0.3333`, `tp == 3`, `fn == 1`, `fp == 1`. Add an
empty-output edge case: `score(gold, {"requirements": []})` → `recall == 0.0`, `precision == 0.0`, no crash.

**(b) Run / watch fail.**

**(c) Implement** `score`: call `match_requirements`, compute the metrics in §4, `round(...,4)`, guard div-by-zero.

**(d) Verify:** all pass.
**Done-criteria:** every golden metric matches exactly; empty input doesn't crash.

---

## Phase E3 — `format_report(gold, output) -> dict` + CLI

**(a) Test first — `engine/tests/test_eval_report.py`:** the report dict carries the headline metrics plus
`misses` (one entry, `gs-4`, marked gating/DANGEROUS) and `false_positives` (one entry, `req-0004`). Assert the
dangerous-miss flag is set for `gs-4`.

**(b) Run / watch fail.**

**(c) Implement** `format_report` (metrics + `misses` with a `dangerous: is_gating` flag + `false_positives`), a
human-readable `_render(report) -> str`, and `main(argv)` (argparse `--gold`, `--output`, optional `--report`;
UTF-8 stdout guard like `backend/scripts/parse_check.py`; `raise SystemExit(main(sys.argv))`).

**(d) Verify:** all pass.
**Done-criteria:** report lists the dangerous miss + the false positive; CLI prints the headline.

---

## Phase E4 — The closed loop (the demo artifact)

**(a) Test first — `engine/tests/test_eval_integration.py`:** load `engine/tests/fixtures/mock_raw_extraction.json`
(the reconcile fixture) → `reconcile(...)` → `score(mock_gold, reconciled)`. Because reconcile produces exactly the
5 true requirements, assert `recall == 1.0`, `precision == 1.0`, `gating_recall == 1.0`, and `0` dangerous misses.

**(b) Run / watch fail** (until both reconcile and eval are implemented).

**(c) Implement:** nothing new — this wires `engine.reconcile.reconcile` + `engine.eval.score` + `mock.gold.json`.

**(d) Verify:** `python -m pytest engine/tests/test_eval_integration.py -v` → pass.
CLI smoke: run reconcile to `out.json`, then `python -m engine.eval --gold engine/gold/mock.gold.json --output out.json`
→ prints recall 1.0 / precision 1.0 / gating_recall 1.0, 0 dangerous misses. **The closed Generalist loop, no backend.**

---

## Day-2+ handoff

- Each teammate hand-labels one real tender into `engine/gold/<tender>.gold.json`.
- Run reconcile (or, once ready, backend extraction) → `engine.eval` → the **real headline number** for the demo.
- Feed `misses` back to backend/reconcile; use `gating_recall` (the disqualifier-survival rate) to tune reconcile thresholds.
- A thin `eval_all` wrapper aggregates metrics across the gold set when there's more than one labelled tender.
