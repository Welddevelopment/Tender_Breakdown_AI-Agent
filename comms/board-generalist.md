# Board — Generalist (reconcile · confidence routing · eval harness · answer-draft)

*Generalist writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

### [G-042] @all · DELIVERABLE · OPEN · 2026-07-04 · judge Q&A "cram layer" pushed to `main` (`demo-day/judge-qa-battlecard-2026-07-04.md`)
**Plain English:** pushed a **learn-it-in-under-an-hour** judge Q&A battlecard. We already have 3 Q&A docs
(`demo/q-and-a-battlecard.md`, `demo-day/qa-prep.md`, `demo/qa-prep.md`) — those are **reference/lookup**
(route a question to its owner). This new one is the **training/cram layer**: instead of memorising 50
answers, you memorise **one answer-formula + the 6 sanctioned numbers + 5 positioning sentences**, and
every answer in it is a recombination of those. Organised **by attack vector** (wrapper attacks · eval
probing · trust/hallucination · demo integrity · market/YC · competitor kill-shots · hostile drills ·
technical deep-dive), each with *why the judge is asking*. ~40 Qs including gotchas the other docs don't
cover (e.g. "you wrote the 101-phrase test AND the detector — isn't that circular?", "keyword matching is
1990s tech", "£341bn isn't your TAM", alarm-fatigue, liability, feature-vs-company).

**Number-safe:** every stat pulled straight from `demo-claim-ledger.md` — 26/26 · 10/10 Bradwell held-out ·
0-missed Duffield · 101/101 synthetic · 42/42 citations · £341bn (2023/24). Same "Do NOT say" guardrails
as the ledger. Cross-linked to the 3 sibling docs in its header; **ledger wins** on any disagreement.

**@j / @all — optional consolidation call (not blocking):** we now have 4 Q&A docs. My suggestion: keep
this as the single *"learn it"* doc and let the others stay as reference, rather than growing a 5th. Flag
if you'd rather I merge them or park this in `demo/` next to the others.

### [G-041] @j @backend @frontend · DELIVERABLE · OPEN · 2026-07-04 · answered J's "For Bobby" §10 ask — YC-framework competitor analysis pushed to `main` (`competitor-analysis.md`)
**Plain English (Bobby-directed):** pushed **`competitor-analysis.md`** — the *strategic* companion to J's
`pitch-competitor-analysis.md`. J's stays the **pitch-slide build spec** (matrix + £ wall + `PitchDeck.tsx`
touch-points); mine is the **YC pressure-test** J's §10 asked me to add on top: unique insight, why-now,
"why won't the incumbent just do this", wedge→expand, the 2×2, bottom-up market sizing, the decision-capture
moat, and an honest self-audit of the red flags a partner (or the ex-Palantir judge) would raise about *us*.
The two docs cross-link so their roles don't blur.

**Which of J's §10 threads I closed:**
- **#2 (newer entrants):** added **mytender.io** — the closest direct competitor *by segment*, which my v1 had
  missed. Now in the camp table, a deep-dive paragraph ("same buyer, opposite promise: they write, we verify"),
  and the 2×2 (SME + black-box quadrant — the sharpest single contrast).
- **#3 (measured recall):** swapped the **banned "98% accuracy"** (violates the §6 copy rule — good catch that it
  was still floating around) for the sanctioned scoped numbers **12/12 · 10/10 · 101/101, 0 dangerous misses**,
  with the **J-083** caveat to quote the *net-applied* gating figure (not `eval_all`, which understates).
- **#4 (G-Cloud):** added the Digital Marketplace distribution angle (~4,000 suppliers, ~90% SMEs) ⚠️verify count.
- **#6 (7th axis):** wrote up the **deterministic safety-net** ("gates caught without the model") as a column only
  we can fill — flagged for you to decide if the on-stage matrix has room.
- Replaced my hand-waved market numbers with your **sourced** ones (£341bn · £45.2bn · £29.1bn).

**Still open (yours/mine, not blocking):** **#1** pin a *real* AutogenAI/mytender.io price (both demo-gated today —
a live fetch or a G2 leak would sharpen the price row); **#5** pressure-test each competitor claim in the traction
calls. @j — it's your positioning lane; I stayed additive + cross-linked rather than editing your pitch doc. Flag
anything you'd frame differently and I'll adjust.

### [G-040] @frontend @j @backend · DELIVERABLE+FINDING · OPEN · 2026-07-04 · overnight demo-prep pack in `demo/` + Bradwell staleness fixed — ⚠️ one decision needed: the /demo proof button is GONE without the Bradwell PDF
**Plain English (Bobby-directed overnight run):** full judge-optimized demo pack landed in **`demo/`**
(strategy, run-of-show, pitch script, Q&A battlecard, final checklist — built ON Pranav's `demo-day/`
kit, not replacing it), and `demo-day/` + `/pitch` are now **reconciled to the J-081 Bradwell switch**
(run-sheet, all 4 cue cards, pre-show checklist, backup plan: SPSO→Bradwell 34pp/12 deal-breakers,
demo date 4→5 Jul, claim-ledger numbers wired into Bobby's beats).

**⚠️ THE ONE DECISION (verified in code — this is the J-081 smoke-test result):** on `/demo`, the
matrix is `pointer-events-none` — **no row is clickable**, so J-081's "click the insurance row" doesn't
exist there; the one interactive proof is the **"See a deal-breaker in the document"** button → PDF
overlay with the exact line highlighted. That button renders only when `DEMO_PDFS`
(`frontend/src/lib/api.ts`) resolves the tender's PDF — it only mapped `spso-cleaning.pdf`, so **on the
Bradwell prebake the button silently vanishes = the demo's trust payoff is missing on the deployed site
right now.** I added the Bradwell mapping (inert until the file exists). The missing piece is ONE
command, but repo rules say never commit tender PDFs (the SPSO copy in `frontend/public/demo/` is the
existing precedent), so it's Joel's call, not mine:
```bash
cp data/tenders/bradwell-grounds-itt.pdf frontend/public/demo/   # then commit + push → Vercel
```

**Also fixed (safe text-only):** `/pitch` said "cached **SPSO** output" on the visible Demo-reliability
slide + 2 speaker notes → now Bradwell (`PitchDeck.tsx`). **Flagged, NOT fixed (Jawad's curated copy):**
the `/demo` cinematic scrolly still narrates **"SPSO Cleaning Services ITT", 13pp/183 reqs/9
deal-breakers** (`components/demo/sample.ts` `DEMO_FACTS` + wall prose says "cleaning services") right
above the **Bradwell** worked example — a visible on-page contradiction; either re-flavor to Bradwell
(34pp/50 reqs/12 deal-breakers) or genericize the title. Also note `/answers` is auth-gated on the
mock/live tender (NOT Bradwell) and `/demo` has no approve click — if we want a live approve on stage,
it's `/review` (rehearsed), per the updated run-sheet.

### [G-039] @j @backend · INFO · OPEN · 2026-07-02 · PUSHED the G-038 fix (gating_scan)
**Landed the passfail-never fix in `gating_scan.py` (`8149d42`) — the safety-net now surfaces the museum PQQ Pass/Fail gates (g61-63) it was silently dropping (p23-24 uncovered: 0 → 10). Suite 154 green (+2 tests).** @j it's your file and you were mid-iteration — I applied it on Bobby's call; it's a 6-line change (skip `_covered` when `_PASSFAIL` matches `source_excerpt`, non-pass/fail unchanged) built on your `_PASSFAIL` + framing. Flag me if you'd have done it differently and I'll adjust.
- **Honest caveat:** it's recall-first, so it over-surfaces (~10 candidates on the PQQ pages, incl. some noise like font-size/appendix lines near "Pass/Fail") — all `needs_review` low-conf, collapsed by reconcile same-page dedup, and only genuine ones get credited by the semantic gating measure. Tightening *which* pass/fail lines qualify is a clean follow-up (precision, paused per J-062).
- **@backend — still the one missing piece:** union `uncovered_gating` into `pipeline.run_pipeline_multi` before reconcile (J-062 #1) so these reach the served output.
- **Net:** this (surface) + #1 (wire) + my semantic gating measure (credit g16/g70) = **museum dangerous 5 → 0**. Confirm with `LLM_MODEL=gpt-4o python -m engine.scripts.eval_all` once #1 lands.

### [G-038] @j @backend · REQUEST · OPEN · 2026-07-02 · root cause + VALIDATED fix for museum g61-63 (the last 3 dangerous)
**Diagnosed exactly why the safety-net still misses the museum PQQ Pass/Fail gates, and validated the fix offline (real PDF p23-24 + cached gpt-4o extraction). @j it's your `gating_scan.py` (you're mid-iteration on it — `f2757c0`), so handing you the change rather than clobbering; say the word and I'll push it.**

**Root cause:** `scan_candidates` DOES detect all three ("3.2.1 Previous Relevant Experience (Pass/Fail)", "3.2.2 Quality Standard (Pass/Fail)", "3.2.3 Financial Information (Pass/Fail)") — regex + `_units` 3-window reform them fine. But **`_covered` (containment ≥0.6) suppresses them**: a generic extracted "…complete and submit the documents…" req shares ≥60% boilerplate tokens, so the safety-net thinks they're covered and drops them. ⚠️ your `f2757c0` "Pass/Fail requirement:" prefix *lengthened* the candidate → against a typical extraction the uncovered count on p23-24 went **1 → 0** (the prefix words overlap the generic req more). Good for semantic readability, but it worsened the coverage suppression.

**Validated fix — never let coverage suppress a Pass/Fail candidate** (recall-first, exactly the module's stated intent). In `uncovered_gating`, using your existing `_PASSFAIL`:
```python
for seq, cand in enumerate(scan_candidates(pages)):
    is_pf = bool(_PASSFAIL.search(cand["source_excerpt"]))
    if not is_pf and _covered(content_tokens(cand["text"]), extracted_token_sets):
        continue
    ...
```
**Offline results vs the cached gpt-4o extraction (surfaced on p23-24 / whole-doc / g61,g62,g63):** current `0 / 3 / ✗✗✗`; containment→0.85 `2 / 10 / ✓✓✗`; clause-aware `4 / 24 / ✗✓✓`; **passfail-never `10 / 18 / ✓✓✓`** ← only one that surfaces all three. The +candidates are `needs_review` low-conf and collapse in reconcile (same-page dedup); precision is paused per J-062 anyway.

**@backend:** still need `uncovered_gating` unioned into `pipeline.run_pipeline_multi` before reconcile (J-062 #1) for this to reach output.

**The other 2 of the 5 (g16, g70) are already handled** — my eval semantic gating measure (G-036) credits them (they're genuinely surfaced, just verbose-gold lexical misses). So **this fix + the #1 wiring + my semantic measure = museum dangerous 5 → 0** (then re-run `LLM_MODEL=gpt-4o python -m engine.scripts.eval_all` to confirm). Experiment script in scratchpad; ping me to push the change or pair.

### [G-037] @all · INFO · OPEN · 2026-07-02 · session handoff (generalist)
**Everything assigned to me is DONE + on `main`. Suite 152 green. Handoff so the next generalist session doesn't redo anything:**
- **J-056 dedup (items 1+2): shipped** — embedding semantic dedup (`engine/embeddings.py`, opt-in `RECONCILE_SEMANTIC=1`, off by default) + null-clause **same-page fallback** (extractor emits ~100% null `source_clause`, so the old same-page+clause gate was a no-op) + ensemble/union collapse. Proven safe: reconcile OFF vs ON identical on gating recall / recall / dangerous across mini+gpt-4o × single+2-pass (G-032, G-033).
- **J-062 #2 (atomic gold): DROPPED — do NOT retry.** Atomising the museum gold backfired (gating recall 0.90→0.70) and was reverted (J-065/J-066). Gold edits to chase the number are fragile.
- **J-062 #3 (fair gating match): shipped** — `engine.eval.semantic_gating_recall` (region-anchored: same page ±1 + cosine≥0.68 + greedy 1:1, can't fake a 1.0) folded into `eval_all` alongside the lexical number, +11 adversarial tests. Validated J's semantic measure first: sound (no false credit at 0.68) but run-variable; **honest number = SPSO 2/2, museum ~7/10** (G-035, G-036).
- **The ONE thing left for the release gate (museum gating recall 1.0) is #1 — SURFACE g61/g62/g63** (Q3.2.x Pass/Fail selection questions), backend/J lane (safety-net `engine.gating_scan` + prompt). NOT the matcher, NOT dedup. My eval reports 1.0 honestly the moment they're surfaced.
- **Next generalist session:** once #1 lands, re-run `LLM_MODEL=gpt-4o python -m engine.scripts.eval_all` (key from root `.env`) for the official gating number. ⚠️ don't run concurrent real-key eval jobs (shared 30k-TPM key) and `pull --rebase` before every push (multiple generalist worktrees clobber this board).

### [G-036] @j @backend @all · INFO · OPEN · 2026-07-02 · re J-063 #2 — LANDED (semantic gating in eval_all)
**#3 done + on `main` (`e9b06ed`). `eval_all` now reports a TRUSTWORTHY semantic gating recall alongside the lexical one — deterministic, region-anchored, and it cannot fake a 1.0. Suite 152 green.**
- **`engine/eval.py::semantic_gating_recall(gold, output, embed_index, threshold=0.68, page_tol=1)`** — credits a disqualifier caught when a surfaced GATING req covers its region (**same page ±1**) AND cosine ≥ threshold, **greedy 1:1**. This fixes the two ways raw best-cosine could lie: the **granularity trap** (1:1 stops one generic "submit the documents" req crediting g61+g62+g63) and **cross-page coincidences** (page anchor). It **never manufactures a credit for an unsurfaced gate** — honest miss, not a gamed 1.0. Prints every miss for audit.
- **Folded into `eval_all`** (`engine/scripts/eval_all.py`): opt-in via `OPENAI_API_KEY` (independent of `RECONCILE_SEMANTIC`); **None offline → the lexical gating recall stays the default**, so nothing breaks key-free. Shown as its own line + per-tender misses.
- **Tests:** `test_semantic_gating.py` (9 adversarial — genuine catch credited; cross-page/below-threshold/non-gating/unsurfaced never credited; 1:1 granularity; deterministic) + 2 aggregate tests. **@j — this is the "validate it credits genuine catches only" you asked for, codified.**
- **The number it gives today (per G-035):** SPSO **2/2**, museum **~7/10** (honest — g61/g62/g63 are NOT surfaced as distinct gating reqs). **The gate to a real 1.0 is #1 (surface g61-63), backend/J lane — not the matcher.** Run it: `LLM_MODEL=gpt-4o python -m engine.scripts.eval_all` (semantic line appears when a key is set).
- **My J-062 items #2 (atomic gold — dropped, backfired per J-066) + #3 (this) are complete.** Standing by if #1 lands and you want me to re-run the official number, or if you want the safety-net union folded into the eval_all semantic measure too (it currently scores reconcile output; `gating_recall.py` adds the safety-net separately).

### [G-035] @j @backend @all · INFO · OPEN · 2026-07-02 · re J-063/J-062 🔴 — VALIDATION (don't rubber-stamp)
**Ran your `gating_recall.py` independently (mini, current v4, single-pass) to validate the semantic measure before I fold it into `eval_all`. Verdict: the MEASURE is sound (threshold 0.68 does not false-credit), but it is NOT a stable 1.0 — my run = museum 7/10, and the 3 misses aren't genuinely surfaced. Crediting them would be the exact "fake 1.0" we're guarding against. Data:**

```
SPSO   2/2  — g17 deadline 0.73, g19 conformance 0.90        (both genuine)
museum 7/10 — CAUGHT g2 .84 g3 .85 g12 .98 g16 .70 g64 .78 g70 .94 g71 .88 (all genuine)
              MISS   g61 .64  g62 .65  g63 .64   (Q3.2.1-3 Pass/Fail)
```
1. **Anti-gaming holds:** all 9 credited are the true disqualifier; NO wrong disqualifier hits ≥0.68. Your 0.68 threshold is safe. ✅
2. **But it's run-variable at the margin:** you (J-064) got museum **9/10** same config; I get **7/10**. g61-63 sit 0.64–0.71 and flip caught/miss run-to-run (you flagged this yourself in J-066). A release gate can't ride a non-reproducible number.
3. **The 3 misses are NOT surfaced as distinct gating reqs** — g61/g62/g63 best-match only a GENERIC "Tenderers are required to complete and submit the documents…" req (0.64). Proof it's not the real question: g62 (MISS 0.65) and g64 (CAUGHT 0.78) match the *same* generic req — it just credits whichever gold is worded most like "submit documents." The specific "Q3.2.x [subject] is Pass/Fail" is not its own gating req. **The overarching gate g70 "fail any 3.2.x → eliminated" IS caught (0.94)** — so the disqualifier *outcome* is surfaced; the three sub-questions aren't.

**So the honest museum semantic gating recall is ~0.70, not 1.0.** Two legit routes to a real 1.0, neither is my matcher (#3):
- **(a) #1 SURFACE them** — @backend/@j: `gating_scan._STRONG` matches `pass/fail`, but g61-63 aren't being added — likely `_units` isn't reforming the "3.2.x … (Pass/Fail)" line out of the form/table layout, or `_covered` treats them as covered by the generic submit-docs req. Worth a look; this is the real gap.
- **(b)** team calls g61-63 as *covered by g70* (granularity) — a gold-scope decision, and J-066 showed gold edits are fragile, so I'd only do this with sign-off.

**My build (proceeding):** fold a DETERMINISTIC, region-anchored gating credit into `eval_all` (same page ± strong-signal + greedy 1:1, every credit printed) so the number stops flip-flopping and can't false-credit — shown ALONGSIDE the lexical number. It will NOT manufacture the missing 3; it gives a trustworthy stable figure to gate on. @j — flagging before anyone reports 1.0 upward; this is the validation you asked for.

### [G-034] @j @backend @all · REPLY · OPEN · 2026-07-02 · re J-062 🔴
**YES to both my J-062 items — #2 atomic gold + #3 fair gating match. Starting #2 now, #3 straight after. My combined-stack eval (this session, gracious-hertz) independently confirms your diagnosis with hard numbers, so we're aligned:**
- **Dedup is NOT the cause of any museum miss (proven):** reconcile OFF vs ON is identical on gating recall / recall / dangerous misses across mini+gpt-4o × single+2-pass. Keep `RECONCILE_SEMANTIC=1` — it only ever collapses non-gating dupes.
- **The gpt-4o museum dangerous misses decompose exactly per your plan:** `g16` (collusion) match_score **0.513** and `g70` (Part-A/B fail→elimination) **0.466** = extracted but the scorer can't match the verbose gold row → my **#2 (atomic gold) + #3 (fair match)**; `g61/g62/g63` (Q3.2.1-3 Pass/Fail) best **0.38–0.42** = were true extraction misses, your v4 prompt (`aef63a8`) should now surface them (a re-run will confirm).
- **Demo note:** gpt-4o SPSO precision 0.68 vs mini 0.29 (both gating 1.0 / 0 dangerous); `source_clause` ~97–100% null on both models → the G-032 same-page fallback is load-bearing.

**#2 atomic gold (mine, in progress):** re-label museum `g16 / g61 / g62 / g63` (+ `g70`) as ONE clean row each, faithful to the tender's real disqualifier sentence, read fresh from the PDF (independent of tool output — no teaching-to-the-test).
**#3 fair gating match (mine, next):** credit a gold gating row as caught when a surfaced GATING req covers the same disqualifier region (page + shared strong-signal terms), not only text ≥0.60 — with adversarial tests so it can never mask a genuine miss.
**#1 (surface/safety-net wiring) is @backend + you** — I'm staying out of `pipeline.py` to avoid collision; ping if you want me on the eval side of it.
Will post here before editing the museum gold so no clobber (⚠️ note: a 2nd generalist worktree `jolly-hermann` was active earlier per the G-033 below — confirming I'm the one taking #2/#3).

### [G-033] @j @backend @all · INFO · OPEN · 2026-07-02
**Closed the loop on J-056 item 2: the eval harness couldn't MEASURE the ensemble — the reconcile side was ready, but `run_tender`/`eval_all` extracted single-pass. Fixed + pinned the union invariants. 137 tests green.**

**Plain English (for Joel):** Pranav built the "read each page a few times and combine what you find" feature (multi-pass), and my dedup already knew how to merge the overlap. But I found a gap: our *accuracy scorer* was still reading each page only once, so turning the feature on would change the live product but **not the number we measure** — we'd be flying blind on whether it actually helps. One-line fix so the scorer uses the same multi-pass path the live app does (off by default, identical results until you switch it on). Then I added three safety checks proving the combine step is trustworthy: a requirement found in only one pass survives, a reworded duplicate collapses, and two *different* deal-breakers never get merged into one.

**Technical:**
- **The gap:** `backend/app/pipeline.py` (live API) routes through `extract_chunk_multi` (honours `EXTRACT_PASSES`), but `engine/scripts/run_tender.py:raw_envelope_from_pdf` — which `eval_all` imports for its extraction — called `extractor.extract_chunk(chunk)` directly. So `EXTRACT_PASSES=3 python -m engine.scripts.eval_all` would score the *single-pass* set: the ensemble was unmeasurable.
- **Fix (`engine/scripts/run_tender.py`, my lane):** route through `extract_chunk_multi(extractor, chunk)`, mirroring the live pipeline. **True no-op at the default** (`extract_chunk_multi` returns `extractor.extract_chunk(chunk)` verbatim when `EXTRACT_PASSES≤1` or non-openai — backend-verified byte-identical, B-013), so every single-pass eval number is unchanged. Unlocks `EXTRACT_PASSES=N python -m engine.scripts.eval_all` to measure recall/precision of the union.
- **Ensemble invariants pinned (`engine/tests/test_embedding_dedup.py`, +3, all offline via the injected `_FakeIndex`, pass-tagged raws like backend emits):** (1) **recall** — a requirement surfaced in only pass 1 survives the union (never dedup'd away); (2) **precision** — a cross-pass paraphrase (temp=0.7 diversity) collapses via the semantic path, and lexical-only honestly stays separate (no silent over-merge without the index); (3) **safety** — two DISTINCT gating rows, one per pass, both survive even with a hot index. Item 2's escalation (gating/mandatory if ANY pass flags it + noisy-OR agreement boost) was already covered by `test_union_merge_escalates_gating_from_any_pass`.
- **Suite: 134 → 137 green.** No new files, no schema/API change, no codemap impact. `reconcile()` still pure/offline.

**@backend:** no action — this consumes your `extract_chunk_multi` exactly as designed; the pass-tagged `raw_id`s union cleanly through reconcile with no special-casing. When you want a real ensemble read, `EXTRACT_PASSES=2` (or 3) on an `eval_all` run will now show it.

**⚠️ @all — parallel-session collision I caught + resolved:** two generalist sessions were live at once (worktrees `jolly-hermann` = me, `gracious-hertz`). Both had started the real-key `eval_all` against the **same 30k-TPM key** → they'd 429 each other + double-spend. I **killed my run** and left gracious-hertz's in-flight (it's on `gpt-4o-mini`, `RECONCILE_SEMANTIC=1`, `EXTRACT_PASSES=1`); the museum-41pp number + the B-013 determinism before/after will come from that session. Heads-up there's also a 3rd worktree `strange-ptolemy` on an older commit. **If you're acting as generalist in a second session: don't double-run key-bound work, and mind `board-generalist.md` (this file) for clobbers — pull --rebase before pushing.**

### [G-032] @j @backend @all · INFO · OPEN · 2026-07-02
**J-056 item 1 (semantic dedup) landed — and measuring it surfaced the REAL precision blocker: the extractor emits no clause refs, so reconcile was silently a no-op on live data. Fixed. 134 tests green.**

**Plain English (for Joel):** I built the "collapse duplicate requirements" upgrade. Measuring it on the real SPSO run, I found the tool was keeping *every* duplicate — the extractor doesn't tag which clause a requirement came from (100% blank), and our merge rule refused to merge anything without a matching clause tag. So the "clean-up" step was doing nothing on real tenders. I fixed the rule to fold duplicates that sit on the **same page** when the clause tag is missing, with strong safety guards. Result on SPSO: duplicate rows **246 → 122**, precision **0.32 → 0.41**, and the deal-breaker catch stayed perfect (gating recall 1.0, 0 dangerous misses, recall unchanged).

**Technical:**
- **Root cause found by measurement:** on the live SPSO extract (gpt-4o-mini), **100% of raws have `source_clause=None`**. `_source_proximal` required same-page AND same *non-null* clause → 0 merges (246 raw → 246 final). The dupes were there (70 dup-text groups, 88 rows collapsible on same-page+exact-text) — all blocked by the null clause.
- **Fix (`engine/reconcile.py`):** clause is the strong provenance signal *when present* (different non-null clause → never merge, unchanged), but a **null clause now falls back to same-page proximity**. Guards layered on: (a) exact-normalised-text on same page always collapses (incl. gating); (b) **numeric-conflict guard** on ALL paths — disjoint numbers never merge (£5m vs £10m, ISO 9001 vs 14001); (c) a **gating row fuzzy-merges only with a matching clause** — with an unknown clause it collapses on exact text only (mirrors the shipped frontend `dedupe.ts` safety net); (d) the **embedding path never touches a gating row**.
- **Embedding semantic dedup (`engine/embeddings.py`, new):** OpenAI `text-embedding-3-small`, cosine ≥ 0.87, pure-Python cosine (no numpy), one batched call + process cache, embed-safe usage logging. **OFF by default** — gated behind `RECONCILE_SEMANTIC=1` (+ a key); `build_index()` returns None otherwise and reconcile stays pure lexical, so the suite is deterministic/offline even with a key exported. Wired at the I/O edges (live pipeline, `eval_all`, `run_tender`, reconcile CLI); `reconcile()` stays pure.
- **Measured (SPSO, same raws A/B, isolates dedup from extraction noise):** original 246→246 / prec 0.321 → same-page fallback (embeddings off) 246→125 / prec 0.400 → +embeddings 246→122 / prec 0.409, f1 0.56→0.57. recall 0.947, gating recall 1.0, dangerous 0 throughout. (Embeddings' marginal add is small on SPSO — most dupes are exact/lexical — but real, and it's the mechanism for item 2.)

**@j — please sanity-check (safety-invariant change):** I flipped **two adversarial tests** to a better-justified invariant — `test_null_clause_never_merges` and `test_grouping::test_null_clause_blocks_merge_even_if_text_identical` now assert *null-clause + same-page + exact text → merges* (the old "null clause never merges" made reconcile useless on real data). Added **3 new guard tests**: null-clause different-page still never merges; null-clause gating collapses on exact text only (fuzzy blocked); numeric-conflict blocks distinct specs. Your eval `match_score` (J-057) is untouched — that's your lane; I only consume it to measure. Ping me to revert if you object to the invariant change.

**@backend (Pranav) — one ask (not blocking):** the extractor emits **no `source_clause`** (100% null on SPSO). Clause/heading refs are the strong provenance signal — if extraction v2 can capture the section heading per requirement, dedup gets both safer and more precise. The same-page fallback handles the null case for now.

**Item 2 (ensemble/union merge):** ready — `merge_group`'s noisy-OR + safety escalation collapse a multi-pass union and keep gating/mandatory if ANY pass flags it (test added). It'll consume your multi-pass union when it lands; no API change needed.

### [G-031] @j · INFO · OPEN · 2026-07-02
**J-048 fully closed — @j please tick it.** G-028 verified the accuracy + workflow at the API/data-contract level (gating recall 1.0 · 0 dangerous · 0 bluffs · multi-file provenance · per-user isolation) and caught+fixed a live-OpenAI upload crash. The one remaining piece — the **in-browser visual/interaction pass** (auth-gate redirect + refresh-stays-in + sign-out re-gates, confidence beads rendering, deal-breakers-first, keyboard nav j/k/a, `/graph` render, `/demo` logged-out, empty states) — **Bobby has now done in the browser.** So the full e2e smoke (accuracy + workflow + visual) is satisfied on consolidated `main`; J-048 is done end to end.

### [G-030] @j @all · INFO · OPEN · 2026-07-02
**Pre-send prep for Joel's morning blast (Bobby-directed). NON-DESTRUCTIVE — did NOT touch `crm/leads.csv` or any `crm/drafts/*.md` (no write-clash with the CRM session). Two new staging files + verification.**
- **① Clean sendable list → `crm/sendable-list-2026-07-02.csv` (312 rows).** "Send all" raw = **359**, but only **312 are verified + have an email**; the other 47 are partial/unverified/human_review — including all **4 J-050 DO-NOT-SEND rows** (L-0117 Cooper Weston, L-0195 Advantage Catering, L-0238 Award Refrigeration, L-0276 Skyguard), which are non-verified so they auto-drop. **All 312 have a ready draft (0 missing).** → send these 312, hold the 47.
- **② The 116 `MT-###` micro-targets → `crm/mt-migration-staging-2026-07-02.csv`.** Parsed all 116 from `outreach-micro-targets.md`, deduped vs `leads.csv`: **0 overlap** (Codex's CRM track + Claude's MT track hit disjoint firms), 0 internal dupes → **312 + 116 = 428 unique** if both channels fire. ⚠️ **The proposed ids (L-0413..L-0528) COLLIDE with Codex's reserved `L-0401+` range** — Joel/Codex must reassign real ids at merge time; use the file for the firm/email/dedupe data, **not** the ids. Left `leads.csv` untouched deliberately.
- **③ Draft red-flag scan (all 335 drafts).** Only **4 flagged** — exactly the 4 held rows above (stub drafts, no cold-email/LinkedIn section), all already excluded from the sendable 312. **The 312 sendable drafts have zero merge-field errors**; spot-checked personalisation is real + firm-specific (e.g. L-0250 cites the firm's Warrington/Halton NHS hospital projects; L-0401 cites its Cornwall Council SEND transport). Minor/optional: a few LinkedIn DMs read slightly clumsily from auto-templating — polish, not blocking.
- **④ Demo env re-confirmed (for same-day bookings).** Local backend `/health`=**openai**; accuracy green — gating recall **1.0**, 0 dangerous misses, **0 bluffs** (SPSO 193/193); pre-bake fixtures intact (SPSO 183 reqs/9 gating, NHS 498/65). ⚠️ **The deployed Render backend is still keyless** — if a prospect books and you want a *live* upload, set the Render `OPENAI_API_KEY` + **pre-load a tender first** (30k-TPM throttles a big live extract); else demo off `/demo` (pre-bake, key-independent). Full live path was proven yesterday (G-028).
- **Not mine to do:** actually sending the emails is Joel's call (outward bulk send). Also a deliverability heads-up: 300+ cold emails from one domain in one morning risks spam-flagging the sending domain — worth throttling into batches / a warmed inbox, and every send needs a PECR opt-out line (many targets are sole traders).

### [G-029] @backend @all · INFO · OPEN · 2026-07-01
**Wrote the G-028 crash up as a regression trap in the living docs (so it can't be silently reintroduced).**
- **`engine/README.md`** — reconcile null-safety **invariant**: any sort/compare on `char_start`/`source_page` must coalesce `None→0` (`… or 0`), never `.get(key, 0)` (that default only fills a *missing* key → a present-`None` crashes `None < int`). The heuristic never hits it (verbatim excerpts) and tests use `?sync=1`, so only a live-OpenAI async smoke surfaces this class.
- **`backend/README.md`** ("Async upload — the traps") — both known async-upload crashes (G-022 shadowed job + G-028 reconcile `None<int`) were invisible to `pytest` because it runs `?sync=1` + heuristic. **Lesson recorded: after touching extract/reconcile, run a live OpenAI async smoke, not just the suite.** @backend — this is the doc most likely to save you a debugging hour; the crash was engine-side (fixed), your `char_start=None` emit is correct.

### [G-028] @joel @backend @all · INFO · OPEN · 2026-07-01
**Ran J-048 (the live e2e smoke) on consolidated `main` with the REAL OpenAI extractor — and it caught a real demo-crasher, now fixed + pushed. Both workflow and accuracy are green.**

**In plain English (for Joel):** I did the full click-through you asked for on the real AI path. It found a genuine bug that would have crashed live uploads on stage — the kind of thing only a real end-to-end run surfaces. I've fixed it, added a test so it can't come back, and re-run everything: uploads, multi-file packs, source-checking, approvals, per-user isolation, and the accuracy gate all pass. **Your J-048 integration gate is closed.**

**The bug (found → fixed → verified live):**
- **Symptom:** every *real-quality* (OpenAI) async upload could crash the WHOLE extraction job with `'<' not supported between instances of NoneType and int`. The job failed silently to the user as "could not process this tender."
- **Root cause (my lane):** `engine/reconcile.py` `_canonical` sorted merge candidates by `.get("char_start", 0)` — but the default only fills a *missing* key. A real extractor sets `char_start=None` when it can't locate an excerpt verbatim (`backend/app/extract.py:220`), so a merge group tying on confidence + excerpt-length while mixing an `int` and a `None` char_start hit `None < int` and crashed the sort.
- **Why tests missed it:** the heuristic extractor's excerpts are always verbatim → `char_start` is always an int (never None); and the test/eval path uses `?sync=1` with data that doesn't tie. Only the live OpenAI + async path triggers it.
- **Fix:** coalesce `None→0` to match the existing `_key` / `merge_group` idiom (`… or 0`). Regression test added (`test_merge.py::test_canonical_tiebreak_tolerates_none_char_start`). Full engine suite **117 green**. Pushed **`31e9042`**.
- **@backend — FYI, no action:** the OpenAI extractor emitting `char_start=None` for an unlocated excerpt is *correct*; the bug was purely in `engine/`. Flagging so you're aware the real-path async job was crashing pre-fix.

**Live re-verification (real OpenAI extractor, async job path, post-fix):**
- **The exact tender that crashed (Cleaning-ITT, 41pp) → `done`:** 417 reqs, 40 deal-breakers, no crash.
- **2-doc pack → `done`:** 634 reqs. **Multi-file provenance intact** — d1=432 / d2=202 reqs (pack NOT collapsed), zero cross-doc filename contamination, `?doc=d1` serves museum.pdf (298KB) and `?doc=d2` serves the Tendering doc (331KB) — correct distinct docs; `?doc=d9` → 404 (no crash).
- **Workflow all green:** auth gate (401 logged-out / wrong-pw), login, single + multi async upload → matrix, draft answers grounded **460/460 cited (0 bluffs)** + 174 gaps surfaced, decisions PATCH → 200 + persist across reload, **per-user isolation** (user B sees 0 of A's tenders, 404 on tender + source PDF), `/tenders` list.
- **Accuracy re-verified:** gating recall **1.0**, dangerous misses **0** (both SPSO disqualifiers caught), **0 bluffs** — SPSO 193/193 + NHS 172/172 citations verified against capability docs.

**Honest gaps:** purely-visual items (confidence beads *rendering*, `/graph` + `/demo` scrollytelling pixels, `j/k/a` keyboard nav) I did NOT click — verified the data/contract behind them, but they want a 60-sec human eyeball. Also: the **30k-TPM key throttles bulk extraction** (a 41pp tender takes ~6-7 min live) — demo off the pre-baked fixtures or locally, not the (still keyless) Render URL.

### [G-027] @frontend @j @jawad · INFO · OPEN · 2026-07-01
**Landed on `main`: a frontend UI/UX design uplift (cross-lane, generalist-directed) — flagging @frontend (your lane) and @j @jawad (it retunes a LOCKED design token; pushed on Bobby's call, please sanity-check).** `eslint` + `next build` green; eyeballed on `/demo` + `/thank-you`. Full spec: `frontend/design-uplift.md`.
**Guiding idea — design "dynamic range": the deal-breaker is the one place the calm palette breaks into an alarm; completion is the one place it celebrates.**
- **A · deal-breaker alarm** — `signal-oxblood` retuned **#8A2D2A → #B42D24** (a truer alarm red on the warm paper) + a NEW sibling token **`--color-signal-oxblood-frame: #8A2D2A`** scoped to edges/borders only (a fill/frame two-tone). The "Can't answer this" bead is now **full-fill + a bold `!`** (was a 30%-fill "low battery"); GatingHero dots 10→11px, spine 2→3px in the frame tone. Runtime token + its swatch docs (`globals.css` + `design/colours.html` + `DESIGN-SYSTEM.md` + `design-language.md`) kept in sync. Two-palette rule held — red only ever on status carriers, never a button/nav/heading/bg.
- **B · win moment** — the completion summary is now a Civic-Record "record filed" sheet: the forest **ApprovalStamp** (only when nothing's flagged — stays honest) + a mono decision tally, doubling as the CSV export surface. Closes frontend-ux-audit **#8** (HIGH).
- **C · booking return** — every "Book a demo" CTA now opens Cal.com in a **new tab**, plus a branded **`/thank-you`** route. **@joel: one external step** — set the Cal.com `bidframe` event's "Redirect on booking" to `https://<prod-domain>/thank-you`.
- **D · status column** — killed the "Needs your eye" wall; pending rows now differentiate (blank / **Deal-breaker to clear** / Needs your answer / Worth a second look). Presentational only, no schema touch.
Merged cleanly over your display-dedupe (G-025) — `ComplianceMatrix` + `GatingHero` carry both. Logo direction picked (register-seal + wordmark lockup), NOT built. **@j @jawad — ack the oxblood token when you can; ping me to revert if you object.**

### [G-026] @all · INFO · OPEN · 2026-07-01
**Docs synced to reality** (like G-013) — brought the markdown in line with the Day-4 work; nothing functional changed:
- **STATUS.md** — Generalist row + a Recently-shipped entry (live path verified e2e, the async-upload bug fix, pre-bake fixtures, display-dedupe, richer capability docs, SPSO gold sign-off).
- **backend/README.md** — documented the **async-upload trap** (re G-022): the background job passes a `docs` list → must call `run_pipeline_multi`; **don't re-add a `pdf_path` `_run_extract_job`**, and note `?sync=1` hides it from the tests.
- **engine/README.md** — new "Demo fixtures + re-baking": the pre-bake fixtures; autofill grounding is **retrieval-gated** (add capability docs to ground more, don't touch the answerer); the **30k-TPM + `_autofill` all-or-nothing** gotcha (use `MockAnswerer` or throttle); `pytest engine/tests/` = 116 with backend deps / ~110 without.
- Memory (my agent store) updated too: OpenAI key recovered (local, 30k-TPM), deployed still keyless.
Still open for others: **@frontend** wire the SPSO/NHS fixtures into `/demo` (G-021); **@j** set `OPENAI_API_KEY` on Render (deployed still heuristic).

### [G-025] @all @frontend · INFO · OPEN · 2026-07-01
**Demo-clarity refinements shipped (display dedupe + richer autofill evidence) — safety numbers unchanged.**
Two demo-leverage tweaks, both adversarially verified, both keeping the guarantees intact:
- **Display-level dedupe (frontend, `c48611c`):** the matrix + deal-breaker hero now collapse near-duplicate
  rows **for DISPLAY ONLY** (new `frontend/src/lib/dedupe.ts`) — SPSO hero **9→6 unique**, matrix **183→122 shown**.
  Pure/reversible: nothing discarded (folded members stay in the data + CSV export; each shows an "also cited on
  p.X" note). **Gating rows collapse on EXACT text only, never fuzzy** — an adversarial pass caught the fuzzy
  version folding two *different* NHS gating rows (PQQ vs ITT) into one deal-breaker, so I restricted it: a
  disqualifier can never be hidden. Engine reconcile + locked schema untouched. @frontend — touches
  `ComplianceMatrix` + `GatingHero`, flagging.
- **Richer demo-bidder evidence (engine, `9254baf`) + re-baked SPSO fixture:** expanded AcmeClean's capability
  docs (method statement, experience/TUPE, commercial terms, 2 client refs, insurance, H&S/COSHH, QA) → autofill
  now grounds **109 of 183** (was 48), honestly leaving 74 as `needs_input` (s.19 legal ack, the literal
  deadline, submission gates, specialist post-survey tasks). **0 bluffs.**
- **Safety re-verified:** gating recall **1.0** · **0 dangerous misses** · **0 bluffs** · full suite **116 green**
  · frontend build+lint green.
- **Honest note:** the fixture's answers are the **mock/upload-time** grounding (instant, cited); polished OpenAI
  prose comes via the live **"Autofill with AI"** button (verified, 0 bluffs). I couldn't bulk-bake polished prose
  for all 109 — the key is on a **30k-TPM** tier that rate-limits it — but the grounding COUNT is identical and
  the button covers polish on demand.
### [G-024] @j @all · INFO · OPEN · 2026-07-01
**Full live OpenAI path verified end-to-end — the definitive answer to Joel's "not sure it works on the API."**
Ran the exact combined run through the real HTTP layer with the OpenAI extractor (no mocks/heuristics):
`GET /health` = openai → **async upload SPSO → job → `done` (198 reqs, 8 deal-breakers, 221s)** →
`GET /requirements` (**both disqualifiers caught**: submission deadline + substantial-conformance) →
`POST /draft?provider=openai` (**45 grounded, 0 bluffs**). **RESULT: the live OpenAI path is OK.**
Together with G-022 (fixed the async-upload bug that was silently failing every upload) and G-023 (pre-bake +
locked numbers), Joel's verification is **closed**. NHS 66pp fixture also committed (498 reqs, 0 bluffs). Both
pre-bake fixtures are on `main`; the only thing left is @frontend wiring them into `/demo` (G-021).

### [G-023] @all @j · INFO · OPEN · 2026-07-01
**UNBLOCKED: OpenAI key recovered → pre-bake done, numbers locked, live path VERIFIED (re J-020 + Joel's ask).**
The key was on my other laptop (it's what ran the G-003/G-009 evals). With it in a gitignored local `.env`:
- **The live OpenAI path works end-to-end** — @j, this is Joel's "does it work on the API" answer, YES:
  `GET /health` → `extractor: openai`; upload → async job → **done** → `/requirements` → `/draft?provider=openai`.
- **Pre-bake (J-020): SPSO fixture committed** (`frontend/src/data/spso-prebake.json`) — real gpt-4o run:
  **183 reqs · both disqualifiers caught · 48 grounded answers · 0 bluffs**; eval vs gold **gating recall 1.0 ·
  0 dangerous misses · recall 0.89 (17/19)**. The headline holds on the real path. **NHS 66pp fixture landing next.**
- **Full test suite 116 green** (I fixed 4 autofill-wiring tests the J-042 auth merge had silently broken).
- **On the key (@j):** it's my **personal** key, used **locally only** for the pre-bake. Do **NOT** put it on the
  public Render endpoint (anyone who uploads spends it). The pre-baked fixtures make the demo **key-independent** —
  the safe stage path (G-020). A live hosted demo would need the key set on Render behind the invite-only auth only.

### [G-022] @backend · ANSWER · OPEN · 2026-07-01
**Fixed a demo-blocking bug: every async upload was silently failing.** `backend/app/main.py` had a
**duplicated `_run_extract_job`** — the second def (`pdf_path`-based) shadowed the correct `docs`-based one that
`POST /tenders/upload` calls, so the job thread received a docs **list** where it expected a path string →
`Path(list)` crash → job → `error("could not process this PDF")` on **every** upload. The `?sync=1` path (and
the tests, which use it) worked, so nobody caught it — and nobody had a key to exercise the live async path.
Removed the stale duplicate (+ its dup `JOBS`/`_set_job`); verified end-to-end via TestClient (upload → job →
**done**). Pushed (`2abb8c9`). Surgical edit in your lane — flagging.

### [G-021] @frontend · INFO · OPEN · 2026-07-01
**Two things in/for your lane.**
1. **`getTenders()` 401 fixed + pushed** (`4ba49be`) — added the missing `{ headers: { ...authHeaders() } }`;
   `npm run build` + `lint` green. Closes G-016 #1 (the J-042 regression).
2. **SPSO pre-bake fixture is committed** at `frontend/src/data/spso-prebake.json` (real gpt-4o extract+autofill,
   GET `/requirements` shape). **Please wire it into `/demo`** in place of the fabricated `mockTender` so the
   showcase shows a real tender. I stayed out of it (invasive — `DemoView` reads via `RequirementsContext`);
   ping me for the glue. **NHS 66pp fixture landing shortly.** Still open from G-016 #2: `?limit` threading
   (low priority — the pre-bake sidesteps live draft).

### [G-020] @j @all · ACTION · OPEN · 2026-07-01
**Demo-correct run — where we stand on the key (re J-020 + J-026 + G-009).** I have **no OpenAI key**,
so I can't produce the J-020 pre-bake myself right now. Status + the decision I need:
- **G-009 half-1 (render.yaml flip) is DONE** — thanks J (J-026); the engine is on the deployed path.
  The remaining half is **just the key**: set `OPENAI_API_KEY` in the Render dashboard (`sync:false`),
  redeploy, and `GET /health` should flip `heuristic`→`openai`. Blocked on the organiser credits.
- **The pre-bake (J-020) makes the live key optional for the demo — but still needs a key to run** the
  one real extract+autofill on SPSO + NHS-66pp. So a key is the single gate either way.
- **Two key-lean options if OpenAI credits don't land:** (1) the repo already has an **Anthropic path**
  (`LLM_PROVIDER=anthropic`, `ClaudeExtractor` on `ANTHROPIC_API_KEY`, `claude-opus-4-8`) — an Anthropic
  key gives us the pre-bake *and* a live Render fallback; autofill would fall back to the mock answerer
  unless we add a small `ClaudeAnswerer` (I can, ~30 min). (2) A hand-produced reference fixture,
  re-scored with our own eval harness so any quoted number stays honest.
- **@j — which do we bank on?** (a) keep chasing an OpenAI key, (b) get anyone an Anthropic key, or
  (c) MODE-C recorded demo. Say the word and I'll produce the pre-bake the moment a key exists. Meanwhile
  I'm doing the no-key Day-5 work (SPSO gold sign-off ✓ G-019, museum ✓ G-018, small fixes ✓ G-016).

### [G-019] @all @j · INFO · OPEN · 2026-07-01
**SPSO gold signed off — the headline answer key is now verified (was a first-pass draft).** Checked all
**19 rows row-by-row** against the source text (pp.1-6, via the repo ingester) and removed the
"FIRST-PASS DRAFT / Joel fix this" banner in `gold-set/spso-cleaning.labels.csv`. Findings:
- **Every row is grounded**, source_page correct, no mislabel. The two gating rows are the **true
  disqualifiers**: **g17** (submission deadline, 12:00 06/11/2013) + **g19** (substantial-conformance
  pass/fail). That's exactly what "gating recall 1.0 / 0 dangerous misses" rests on — now on a *verified*
  key, not a draft.
- **One soft item left out on purpose:** the p5 FOI "disclosure presumption" note (a 'should be aware',
  not a hard obligation). Add as optional/no for fuller non-gating recall; it doesn't touch the gating story.

### [G-018] @backend @j · ANSWER · OPEN · 2026-07-01
**Re B-002 — the museum gold can't enter the aggregate: it's MIS-SOURCED, not just mis-formatted.**
Verified today: `data/tenders/museum-cleaning-itt.pdf` is **byte-identical** (md5 52f03df8...) to
`Cleaning-ITT-Version-1.3-FINAL-1.pdf` — the **MAC (Metropolitan Arts Centre), Belfast** cleaning ITT —
yet `museum-cleaning.labels.csv`'s 92 rows carry **SPSO-2013 content** (the Ombudsman, s.19 SPSO Act 2002,
eblows@spso.org.uk, deadline 06/11/2013). So they're SPSO labels bolted onto the wrong PDF; cleaning
gating/type/pages won't fix that. **Kept `draft:true`** and corrected the note in `eval-manifest.json`.
- **@backend:** to un-quarantine, it needs a **full re-label from the real MAC PDF** per
  `labelling-guide.md`, or we drop the entry. Your call whether it's worth it this late.
- **Honest-numbers consequence (@j):** scored accuracy is **one validated tender (SPSO)**. The
  multi-tender line is **robustness** (7/7 survive, incl. NHS 472 reqs, no crash) — **not** recall.

### [G-017] @j · ANSWER · OPEN · 2026-07-01
**Re J-019 — already verified in G-004; please flip J-019 to RESOLVED.** Your gating-definition
tightening was re-run on SPSO (OpenAI extractor) in **G-004**: gating **accuracy 0.39 → 1.0**
(over-flagging gone) with gating **recall still 1.0** (g17 + g19 caught). Nothing more needed from me —
just flagging so J-019 isn't left dangling OPEN on your board.

### [G-016] @frontend · INFO · OPEN · 2026-07-01
**Two small diffs for your lane + a heads-up on a test fix I made in mine.** Staying out of `frontend/`
(your lane) — here are ready patches:
1. **`getTenders()` 401 regression (from J-042 auth).** `frontend/src/lib/api.ts:218` is the only fetch
   missing the auth header (every sibling has `{ headers: { ...authHeaders() } }`), so "list/reopen
   tenders" 401s on the live build. Fix: `fetch(\`${BASE}/tenders\`, { headers: { ...authHeaders() } })`.
2. **Thread `?limit` into autofill** so a live draft on 128-req SPSO doesn't fire 128 OpenAI calls. In
   `draftAnswers` (`api.ts:237`) add `limit?: number` to opts, build the query as `provider`+`limit`
   (e.g. `?provider=openai&limit=20`), and have `AutofillButton` pass a `limit`.
- **FYI (my lane, done):** added `pytest.importorskip` guards to `engine/tests/test_autofill_wiring.py`
  + `test_pipeline_wiring.py` so `pytest engine/tests/` stays green in a pure-engine checkout (they
  bridge into the FastAPI backend, which pulls PyJWT/fastapi/pydantic). No-op when backend deps are present.

### [G-015] @all · INFO · OPEN · 2026-06-29
**Day-5 hardening (the safe half): an adversarial trust-invariant suite — judge-style attacks on our 4 claims.**
`engine/tests/test_adversarial_safety.py` — **18 new tests, all green (116 total).** Additive only (no behaviour
change, nothing outside `engine/tests/`), so it can't move `main`. The four demo claims all **hold under attack**:
1. **Conservative reconcile** — different page / different clause / null clause / low-token-overlap (insurance-vs-turnover)
   **never merge**, even with identical text; a genuine cross-chunk dup still *does* (noisy-OR). A wrong merge = silent miss.
2. **Safety escalation** — a merged group stays gating + mandatory if *any* member is; confidence never drops below a member.
3. **Autofill never bluffs** — no evidence → `needs_input` (empty text, no refs), never fabrication; and the groundedness
   detector **catches a planted fake citation**.
4. **The eval can't hide a disqualifier miss** — a missed gating gold → `dangerous_miss`; *found-but-not-flagged* gating →
   gating recall drops (we measure the failure).

**One honest known limitation (documented, NOT fixed — flagging for transparency):** reconcile is *lexical*, so two
near-identical-but-different requirements that share the **same page AND clause** could merge. Mitigation = the page+clause
AND-gate (the extractor clause-separates distinct requirements); a semantic guard is future work. Not a regression.

This is a clean judge-proof artifact ("here's our adversarial safety suite"). The *other* half of Day-5 (final QA of the
hosted path, demo video) still waits on **G-009** (J's render.yaml flip) — can't judge-test the deployed demo until it runs the real engine.

### [G-014] @all @j · INFO · OPEN · 2026-06-29
**Day-4 "break it before the judges do" — done (in the Generalist lane), and it caught a real problem.**

**1. Locked headline (honest).** The *stable, load-bearing* numbers, every run: **gating recall 1.0 (both disqualifiers
caught & flagged) · 0 dangerous misses · 0 bluffs (42/42 citations verified).** Overall extraction recall wiggles
**~0.79–0.95** run-to-run on SPSO (gpt-4o noise — 15–18/19); **don't quote a single recall %, quote the disqualifier
catch + groundedness** (those don't move). That's the trustworthy story.

**2. Robustness: survives the messy 35%.** Pushed **7/7** of the ugliest distinct real tenders through the WHOLE
pipeline (ingest→extract→reconcile→autofill) — **no crashes**, incl. **66pp NHS framework (472 reqs)**, **53pp
security+cleaning (364 reqs)**, gov.uk example (362), appendix-A (202). Demonstrable "it doesn't fall over."

**3. ⚠️ Quarantined a bad gold set — `museum` needs a human.** The aggregate eval flagged it: museum scored recall
**0.01 / 87 "dangerous misses"** — but that's a **gold artifact, not an extraction failure** (a same-size cleaning
tender extracts 200–360 reqs fine). The museum gold is **auto-generated, never human-validated**: **88/92 rows marked
`is_gating=true`** (manufactures the fake dangerous misses), `type` = `Specification/Commercial/…` (not the
`mandatory/optional` enum), `source_page` = strings (`"Appendix 1 p.1"`). I marked it **`draft: true`** in
`eval-manifest.json` (excluded from scoring — the manifest's own mechanism), so the aggregate reflects only **validated**
gold (SPSO). **@j / whoever labelled museum:** it needs a cleanup pass per `labelling-guide.md` (fix the all-gating
over-marking, the type enum, integer pages); flip `draft:false` and the aggregate lights up "across 2 tenders."

**Demo-set rec (technical — narrative call is @j's):** **hero = SPSO** (clean 13pp, the disqualifier-catch + autofill
story). **Messy proof = NHS 66pp framework** or the 53pp security+cleaning (survives, visibly big/ugly). **Don't demo on
museum** until its gold is fixed.

### [G-013] @all · INFO · OPEN · 2026-06-29
**Docs synced to reality.** Refreshed the markdown so it matches what's on `main`:
- **`engine/README.md`** rewritten — now covers `answer.py` (autofill), `eval_answers.py` (groundedness), `scripts/`,
  the live-API wiring, and the run commands. (The old "autofill fields omitted, arrive via a future PR" note is gone —
  they flow through the API now.)
- **`backend/README.md`** — added the **`POST /tenders/{id}/draft`** row to the endpoints table (provider/limit/files).
- **`STATUS.md`** — Generalist row + a "Recently shipped" entry for the autofill-live + demo-hardening batch.
Nothing functional changed here; just keeping the source of truth honest. The G-009 deploy flip is still the one open item.

### [G-012] @all · INFO · OPEN · 2026-06-29
**Demo-hardening batch — autofill is now fast, proven, sharp, and bidder-uploadable. 98 tests green.**
Four follow-ups to G-010/G-011, all on `main`:
1. **`POST /draft` is demo-fast** — the per-requirement OpenAI calls run **concurrently** (was sequential = minutes
   on 128 reqs) + optional **`?limit=N`** (gating-first) to cap work for a snappy live click. Result is byte-identical
   to sequential (proven in tests). @frontend: the "Autofill with AI" button benefits automatically.
2. **Groundedness eval** (`engine/eval_answers.py`) — makes "**it never bluffs**" a *number*: every grounded answer's
   citation must verifiably exist in the capability docs, no auto-answer may be unevidenced. **On SPSO: 32 grounded,
   96 gaps, 42/42 citations verified, 0 bluffs.** @j — that's a defensible judge-proof line alongside gating recall 1.0.
3. **Sharper gap questions** — the gap interview now uses **J's `prompts/gap-interview.md`** (OpenAI): crisp,
   second-person, gating-first, deduped. *Before:* "Please provide evidence or details for: <full clause>". *After:*
   "Do you hold ISO 9001 certification?" Deterministic mock stays the no-key fallback.
4. **Capability-doc upload** (`/answers`) — @frontend, added a panel to drop in the bidder's own `.pdf/.txt` evidence →
   re-grounds live (`POST /draft` `files=`). Completes two-sided traceability. Your lane (3 small files) — restyle freely.

**Still the #1 demo gate (J): flip G-009** (`render.yaml rootDir: .` + Render `OPENAI_API_KEY`) — it makes the engine
reconcile *and* all of this autofill live on the hosted site. Everything works locally against `:8000` today.

### [G-011] @frontend @j · INFO · OPEN · 2026-06-29
**"Autofill with AI" is now clickable end-to-end** — wired the `POST /tenders/{id}/draft` endpoint (G-010)
into the UI so the precise OpenAI grounding actually fires in the demo. **Build + lint green** (Next 16 production build).
@frontend — this touches your lane (4 small, additive files); revert/restyle freely, flagging so you're not surprised:
- **`lib/api.ts`** — `draftAnswers(tenderId, {provider, files})` → `POST /draft` (mirrors your existing fetch helpers).
- **`context/RequirementsContext.tsx`** — tracks `tenderId` (set in `loadTender`) + a `draftAnswers(provider)` action
  + a `drafting` flag; swaps the enriched requirements + capability docs back into state.
- **`components/AutofillButton.tsx`** (new) — self-contained CTA (uses your `bg-forest`/`text-paper` tokens), so your
  `GapInterview` is untouched. **Hidden on the mock default** (only shows once a live tender is loaded).
- **`app/answers/page.tsx`** — renders the button above the gap interview.

**Demo flow now:** upload → grounded **mock** answers appear instantly (G-010) → click **"Autofill with AI"** →
`?provider=openai` re-drafts precise, evidence-cited prose and it swaps in live. **Two notes:** (1) the OpenAI re-draft
is sequential per requirement, so on a big tender (128 reqs) it runs for a while — great for a *small* demo tender; if
you want it snappy live, trim the tender or I can add a server-side cap (my lane). (2) capability-doc **upload** hits the
same endpoint via multipart `files=` — I left the upload control to you; ping me for the `api.ts` glue. Needs the **G-009
render.yaml fix** to work on the *hosted* site (locally it works against `:8000` now).

### [G-010] @frontend @backend @j · INFO · OPEN · 2026-06-29
**Auditable autofill is now wired into the live API — `GET /tenders/{id}/requirements` returns grounded answers.**
The differentiator is no longer mock-only; the API serves real `answer` + `open_questions` in the locked schema.
**85 tests green** (incl. a FastAPI `TestClient` upload→GET→draft round-trip). All changes import-safe + guarded.

What changed (backend lane — surgical, flagged below):
- **`pipeline.py`** — after reconcile/graph, `run_pipeline` now drafts a grounded answer per requirement from the
  bidder's capability docs (engine.answer). Uses the **MockAnswerer on upload** = deterministic, **free, instant**
  (no surprise 128× LLM calls); so the matrix *and* answers land in one upload with no extra latency.
- **`POST /tenders/{id}/draft`** (new) — re-draft with a real answerer + optional capability-doc upload:
  `?provider=openai` for J's precise answer-generation prompt, or multipart `files=` (.txt/.pdf) to swap in the real
  bidder's docs. Persists + returns the enriched tender.
- **`store.py`** — persists `capability_docs` (idempotent additive migration; answers already ride in the requirement blob).

**@frontend** — your `/answers` answer/evidence/gap UI now renders **real API data**, not just mocks: set
`NEXT_PUBLIC_API_BASE_URL` and upload a tender — answers + `open_questions` + `capability_docs` come back populated.
Optional polish: wire an **"Autofill (AI)"** button → `POST /tenders/{id}/draft?provider=openai` (+ a capability-doc
upload control hitting the same endpoint with `files=`). Want me to add the `api.ts` helper (`draftAnswers(tenderId)`),
or will you take it? It's your lane so I didn't touch `frontend/`.

**@backend** — heads-up, I edited `pipeline.py` / `store.py` / `main.py` (surgical, import-safe, 85 tests green). Autofill
is guarded exactly like reconcile: a backend-rooted deploy just **skips** it (answers stay null, `/draft` → 503) and it
goes **fully live with the G-009 render.yaml fix**. Capability-doc PDF ingest reuses your `ingest_pdf`. Follow-up if you
want it back in your lane: a real capability-doc **library** (persist uploads per bidder, not per tender).

**Real numbers (@j, demo narrative):** ran the wired autofill over the **128 real SPSO requirements** →
**32 grounded answers (each cites a capability doc) · 96 honestly flagged `needs_input`.** The submission *deadline* and
*confidentiality* items correctly came back needs_input — **it asks rather than bluffs.** Note the **upload-path mock
answerer is coarse** (token-overlap, free); for the *precise* grounded prose in the demo, hit `POST /draft?provider=openai`.
Demo line: **"it drafts the answers it can evidence, and asks you about the rest."**

### [G-009] @j @backend · ACTION · OPEN · 2026-06-29
**The deployed API silently runs the PLACEHOLDER reconcile + catches 0 disqualifiers — two tiny fixes make it real.**
This is the Day-4 integration gate; flagging before it bites us in the demo.

**The gap (proven, not guessed):**
- `render.yaml` has `rootDir: backend`, so `engine/` isn't on the path → `backend/app/pipeline.py` falls back to
  `_HAVE_ENGINE = False` → the deployed API uses the **thin placeholder** dedupe + the 0.65 fallback threshold, **not**
  my conservative reconcile / noisy-OR / safety-escalation / calibrated 0.70. Verified: imported from `backend/`
  → `_HAVE_ENGINE = False`; imported from repo root → `True`.
- `OPENAI_API_KEY` is blank on Render → **heuristic extractor → gating recall 0.0** (misses both SPSO disqualifiers,
  per G-006). The 100%-disqualifier-catch headline only holds on the OpenAI path.

**I verified the fix end-to-end through the REAL HTTP endpoints** (uvicorn from repo root + OPENAI key, uploaded
`spso-cleaning.pdf`, GET /requirements, scored vs `gold-set/spso-cleaning.labels.csv`):
**gating recall 1.0 · both disqualifiers caught + flagged · 0 dangerous misses.** Engine is on the path; storage
paths are unaffected (`UPLOAD_DIR` + the SQLite file are `Path(__file__)`-relative → resolve to `backend/…` regardless
of cwd, so `rootDir: .` is safe). Engine is stdlib-only → no new deps.

**@j — the drop-in (3 lines changed in `render.yaml`, everything else as-is):**
```yaml
    rootDir: .
    buildCommand: pip install -r backend/requirements.txt
    startCommand: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```
…then **set `OPENAI_API_KEY` in the Render dashboard** (it's `sync: false`, so it lives in the dashboard, not the file).
After redeploy, `GET /health` should read `{"extractor":"openai"}` (today it's `heuristic`). It's your deploy lane so
I didn't touch `render.yaml` — ping me if you'd rather I take the edit.

**Two honesty notes for the narrative (@j):** (1) on this run `needs_review` came back **0%** — every gpt-4o confidence
landed ≥ 0.70 — so the "we flag the uncertain ones" moment isn't guaranteed to fire on SPSO. Lean the live demo on the
**disqualifier catch + source traceability**, not the confidence dot (consistent with G-007). (2) Full-doc extraction
scored recall 0.74 (14/19) vs 0.95 on pp.1-6 — gpt-4o run/scope variance, **@backend**'s lane, not the engine; the
disqualifiers came through either way.

### [G-008] @all · INFO · OPEN · 2026-06-29
**Auditable autofill shipped** — `engine/answer.py` + `engine/scripts/draft_answers.py` (Generalist steps 12-13,
autofill-scope-decision.md). Per requirement: thin RAG over the bidder's capability docs → a **grounded** answer
(cites which doc) or **needs_input**; gaps collapse into a deduped question list. **Emits the exact frontend
`Answer`/`EvidenceRef`/`OpenQuestion` shape** — @frontend your AnswerPanel/GapInterview/OpenQuestions can render real
data, not just mocks. Pluggable: MockAnswerer (free, deterministic, tested) + OpenAIAnswerer (J's
`prompts/answer-generation.md`). **79 tests green.**
- **The trust discipline is real:** on SPSO the OpenAI answerer grounded only **3/19** — exactly the ones it could
  evidence from the docs — and flagged the rest needs_input. **It does not bluff.** That honesty is the product.
- Demo data: `engine/fixtures/capability/` = a mock bidder (AcmeClean Ltd). Tailor per-tender for a punchier demo.
- **Deliberately thin — follow-ups (happy to pair):** (1) wire J's `prompts/gap-interview.md` LLM for SHARPER questions
  (current dedup is deterministic/verbose); (2) **@backend** capability-doc ingest (step 11) + wire answer-draft into
  the live API so the hosted frontend shows real drafts.
Try it: `python -m engine.scripts.draft_answers --gold gold-set/spso-cleaning.labels.csv` (mock, free).

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
