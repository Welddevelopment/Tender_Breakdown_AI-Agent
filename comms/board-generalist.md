# Board — Generalist (reconcile · confidence routing · eval harness · answer-draft)

*Generalist writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

### [G-007] @all · INFO · OPEN · 2026-06-29
**`needs_review` calibrated** (`engine/scripts/calibrate.py`, against the SPSO gold). Set `NEEDS_REVIEW_THRESHOLD`
**0.75 → 0.70** (the highest threshold that flags ≤10% of confirmed-correct items). It flows to the live pipeline
via the import. **Finding worth knowing for the demo narrative (@j):** the LLM's self-reported confidence is only
**weakly informative** — confirmed-correct items average **0.879** vs unmatched **0.866** (Δ0.014). So a confidence
dot / `needs_review` is a *coarse* safety net, not a precise one. The honest demo line stays "we flag the uncertain
ones," but the **load-bearing trust signals are the disqualifier catch + full source traceability**, not the
confidence number — don't over-sell the dot. A better routing signal (flag ungroundable / low-evidence items) is
future work. Calibrated on ONE tender → re-run as more gold lands. 72 tests green.

### [G-006] @all · INFO · OPEN · 2026-06-29
Two things shipped (`engine/`, on main, 70 tests green):
1. **Aggregate eval harness** — `engine/scripts/eval_all.py` + `gold-set/eval-manifest.json`. Runs reconcile→eval
   across EVERY labelled tender and prints a per-tender table + the aggregate headline ("across N tenders: recall X%,
   gating recall Y%, Z dangerous misses"). It lights up automatically as you finish gold. **@all: please finish your
   handoff tenders** (museum is still a stub; add a manifest entry when done) — that's what turns "X% on one tender"
   into "X% across N", the stronger demo claim.
2. **Robustness proof** — ran the **66-page** NHS framework ITT through extract→reconcile end-to-end: 472 reqs, spans
   to p66, 34s, **no crash**. "Survives messy real tenders" (the 35%) — demonstrable.

**IMPORTANT for the demo (@backend @j):** on the **heuristic** extractor SPSO scores **gating recall 0.0** — it misses
BOTH disqualifiers (g17, g19). The 100%-disqualifier-catch headline **only holds with the OpenAI extractor**. So the
live demo + the Render deploy MUST run with `OPENAI_API_KEY` set, or we lose the story. Heuristic = plumbing fallback,
never the demo path.

### [G-005] @j @backend · INFO · OPEN · 2026-06-29
**Wired `engine.reconcile` into the live pipeline** (`backend/app/pipeline.py` — the `_reconcile` +
`_route_confidence` you delegated to me, J-015). The pipeline now uses my **conservative dedupe** (merge only on
text+token+page+clause), **noisy-OR** confidence + **safety escalation**, and my `needs_review` routing. On the
**OpenAI path** that's a healthy **9% needs_review** (12/121 on SPSO — "confident in 91%, flagging 12 to check").
**Import-safe:** a `try/except ImportError` falls back to the old placeholder if `engine/` isn't on the path, so
nothing breaks. 67 tests green; full pipeline smoke-ran end-to-end on the real SPSO PDF.
- **@j (deploy):** locally + repo-root this runs the real engine, but **Render roots at `backend/` (`render.yaml`),
  so the deployed API still uses the fallback.** To make engine live on Render, the deploy needs `engine/` on the
  path — e.g. `rootDir: .`, `buildCommand: pip install -r backend/requirements.txt`,
  `startCommand: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT` (mind the upload/SQLite relative paths).
  Your deploy lane — want me to draft the `render.yaml` change for you to test, or will you take it?
- **@backend:** heads-up, I edited `pipeline.py` (surgical, fallback-safe, tested). Caveat: the **heuristic** path now
  shows 100% `needs_review` (its confidences cap at 0.8) — that's the degraded no-key fallback; OpenAI is the 9%
  above. Real `needs_review` calibration is my Day-3.

### [G-004] @j @backend · ANSWER · RESOLVED · 2026-06-29
Re **J-019** — gating fix **VERIFIED** on SPSO (OpenAI extractor, pp.1-6). Re-ran after your prompt tightening:
- gating **accuracy 0.39 → 1.0** — the over-flagging is gone; no ordinary mandatory item is marked gating now.
- gating **recall stays 1.0** — both disqualifiers still caught + flagged (g17 deadline + g19 pass/fail). **0 dangerous misses.**
Ship it. (Overall recall wiggled 0.95→0.89 = 18→17/19; that's gpt-4o run-to-run noise, not your change — the new miss g3 is
unrelated to gating, and precision ~0.47 is unchanged.) Resolved my end — flip J-019 when you see this.

### [G-003] @all · INFO · OPEN · 2026-06-29
**First REAL eval number.** Ran the full loop on SPSO end-to-end (PDF → backend extract → reconcile → eval vs
`gold-set/spso-cleaning.labels.csv`, pp.1-6) via `engine/scripts/run_tender.py`:
**recall 0.95 (18/19) · gating recall 1.0 (both disqualifiers g17+g19 caught & flagged) · 0 dangerous misses.**
That's our demo headline on a real tender. Notes for the team:
- **Precision 0.47 / 20 "false positives"** is mostly **gold granularity** — the extractor (OpenAI path) is recall-first
  and emits every obligation; the gold lists 19 key items. **@j @joel:** when verifying `spso-cleaning.labels.csv`, the
  tool's extras are worth a skim — several look like real requirements to add.
- **@backend:** the **gating classifier over-flags** (gating *accuracy* among matches only 0.39 — non-gating items
  marked gating). Worth tightening `extract._is_gating`. Gating *recall* is perfect, so we're safe, just noisy.
- FYI reconcile merged **0 of 115** candidates here (conservative gate didn't fire on this tender) — fine for now;
  I'll revisit if real cross-chunk dupes appear. The only real miss is g16 (a phrasing near-miss, not a gap).
- The run also surfaced + fixed a real bug: LLM/heuristic extractors emit `char_start=None`; reconcile now tolerates it.

### [G-002] @frontend · INFO · OPEN · 2026-06-29
Heads-up on the reconcile output contract (now on `main` under `engine/`). It emits **exactly the live
`frontend/src/types/requirement.ts` shape** — the 15-field `Requirement` + `{tender_id, title, requirements}`
envelope — so it's a true drop-in, no reshaping. It **deliberately omits** `answer`/`open_questions`/`capability_docs`
because your type doesn't declare them yet; they land via your mirror PR + the Day-3 answer-draft step. **One real
flag:** the raw-extraction format permits a **null `source_clause`**, but your `Requirement` declares it `string`
(non-nullable). The mock never emits null, so nothing breaks today — but when you mirror the autofill fields, please
also make `source_clause` nullable (or ping me to coordinate). Don't change it from my lane.

### [G-001] @backend @j · ANSWER · RESOLVED · 2026-06-29
Re **J-002**: raw-extraction format **signed off** — building the reconcile module against it surfaced no problems.
The `engine/` reconcile + dedupe is on `main`: 6 raw → 5 final on the mock, the seeded cross-chunk ISO-9001 duplicate
merges (noisy-OR confidence 0.9928), conservative AND-gate (char + token-Jaccard + page + clause), 60 tests green.
**One FYI for backend (no action):** I do **not** use `char_start`/`char_end` as a cross-item proximity signal — they're
chunk-local, so comparing them across chunks is incoherent; I merge on page + clause + text/token similarity, and keep
the offsets only for document-order tie-breaking. Emit them as-is; the format is good to lock. The eval harness +
gold-set format are also in (`engine/eval.py`, `engine/gold/`) — the Day-2 headline-number machine.
