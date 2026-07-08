# Pilot Roadmap — Generalist (Bobby)

Owner: Bobby (CEO / generalist — engine, eval, glue, plus cross-lane backend & frontend)
Scope: ~60–70% backend (with Pranav) · ~20–30% UI/UX frontend · you also own the engine/eval spine
Last updated: 2026-07-08
Reads with: [`ops/pilot-readiness-roadmap.md`](../ops/pilot-readiness-roadmap.md), plus the backend doc (`backend-pranav.md`) and frontend doc (`frontend-jawad.md`) — your work overlaps both by design.

---

## Why this document exists

You're the connective role: 60–70% backend alongside Pranav, 20–30% frontend UI/UX, and you own the engine/eval/verification spine that the whole scorecard leans on. That makes you the natural owner of the **cross-cutting** items — the ones that don't sit cleanly in one lane: the one-command verification path, the job-failure *experience* (backend truth + frontend rendering), observability, and turning pilot misses into eval fixtures.

Your engine is already the strongest part of the product. The verified audit is unambiguous: reconcile/dedupe (`engine/reconcile.py`), the eval harness (`engine/eval.py`), the gold set (`gold-set/` — 8 hand-labelled CSVs incl. mixed-pack), and ~116 tests are **comprehensive and green**. Engine quality sits at **15/20** — the highest-scoring line. Your job is *not* to rebuild it; it's to (a) keep it locked as pilots add real tenders, and (b) spend your backend/frontend time on the cross-lane reliability that lifts the *other* lines.

Three lenses:

- **Business lens** — you own the number that makes the whole pitch honest: "0 dangerous misses, 0 bluffs." Every pilot miss you fold back into the gold set defends that claim. Eval work is not internal hygiene — it's the receipt behind the sales line.
- **UX lens** — your 20–30% frontend is spent where backend truth meets the user: the job-failure state, the recovery path, the split-panel review flow. A truthful "this failed, here's why, retry" is a UX deliverable.
- **Engineering lens** — you're the one who makes "is the build safe to demo?" answerable with one command, and who keeps the trust invariants (deterministic safety net, format-neutral reconcile) intact as formats and tenders grow.

---

## Current position (verified)

| Scorecard line you touch | Now | At 70 | At 75 |
|---|---:|---:|---:|
| Engine quality & safety (of 20) | 15 | 15 | 15 (hold it) |
| Backend reliability (of 20) — co-owned | 11 | 13 | 15 |
| Ops & team process (of 15) — co-owned with Joe | 8 | 9 | 10 |
| Frontend reliability (of 15) — your 20–30% | 9 | 11 | 12 |

Your leverage is disproportionately in **Ops** and the **cross-lane** half of Backend/Frontend.

---

## Part A — Work to reach 70 (pilot gate)

### A1. Build the one-command verification path  *(P0 · Ops · your signature deliverable)*

The team needs repeatable confidence before every pilot call — not vibe checks. You own the checklist; Pranav makes backend deps installable.

- **Tasks:** create a "before every pilot" command list that runs, in order: frontend lint, frontend build, backend import check, mixed-pack smoke, and gating-floor smoke. Wire the engine harnesses you already have — `engine/scripts/mixed_pack_smoke.py`, `engine/scripts/gating_recall.py`, `engine/scripts/eval_all.py` — into one documented sequence. Make sure a *new teammate* can run it from docs (fix or document any missing local tooling).
- **Business framing:** this converts "we think it works" into "we verified it works at 09:14 today." It's the ops line, and it's what lets Joe book calls without a founder babysitting each deploy.
- **Done when:** a new teammate runs the whole sequence from docs; frontend lint + build pass; backend imports pass; mixed-pack smoke passes; gating-floor smoke passes; the latest result is stored in an ops note when a pilot is scheduled.

> Caveat to bake into the checklist (you flagged this yourself): `eval_all` scores **extraction only** and does *not* apply the safety net — so it reports a lower gating recall with "dangerous misses" that the *shipped* pipeline actually catches. Document this next to the command so nobody misreads the raw number or quotes it in a demo.

### A2. Job-failure experience — backend truth → frontend render  *(P1 · your backend + frontend overlap)*

Pranav surfaces a failure *reason* from the backend (his A4/B2); you make the frontend **render** it well. The upload error UI already exists (`UploadDropzone.tsx`, typed error kinds) — extend it to processing/job failures so a stuck job becomes a clear, recoverable state instead of a silent spinner.

- **Done when:** a failed processing job shows a reason + retry path in the UI; the state matches the backend's truth after a refresh.

### A3. Keep the trust invariants format-neutral  *(P1 · engine · hold the line)*

As mixed packs (PDF + DOCX + XLSX + CSV) flow through, the deterministic safety net, reconcile, and eval must stay format-neutral — a requirement extracted from a spreadsheet is graded the same as one from a PDF.

- **Done when:** mixed-pack gold scoring stays green; no format regresses gating recall; the safety net still catches every known deal-breaker.

---

## Part B — The extra 5 points (70 → 75): your cross-lane contribution

The stretch to 75 is three hardening stages. You co-own two of them with Pranav and one with Joe.

### B1. Durable job state (with Pranav)  *(Backend durability stage)*
Pair on persisting job state (status/failure/file-list/timestamps) so a refresh or restart shows truthful state, and on the reconnecting SSE + polling fallback. You take the **frontend recovery** side; Pranav takes persistence. See `backend-pranav.md §B2`.
- **Done when:** refresh mid-processing and a forced restart both yield truthful, recoverable states end-to-end.

### B2. Observability (with Pranav)  *(Observability stage)*
Co-own structured logging keyed by tender/job/user id with error categories (upload/parse/extraction/reconcile/draft/auth/storage) and basic counters (success rate, extraction/draft duration, error rate). You care especially about the **engine-adjacent** categories (extraction/reconcile/draft) since that's where quality regressions hide.
- **Done when:** every pilot run is traceable by job id; an intentionally-failed job is diagnosable from logs; no raw tender text logged.

### B3. Misses → eval fixtures (with Joe)  *(Pilot OS / feedback loop)*
When a pilot surfaces a real miss or false positive (Joe captures it in the results template), you convert it into a `gold-set/` fixture or regression test — but only when the tender is public or explicitly permissioned. This is the mechanism that makes each pilot *improve the product*, and it's part of the Ops point toward 75.
- **Done when:** ≥1 pilot miss becomes a regression/eval item; the gold set grows from real usage without ingesting confidential material into the repo.

### B4. Frontend component boundaries — only where it pays  *(your 20–30% frontend)*
The layout target (`layout.md`) is split matrix/panel with clean review/answer/evidence/decision zones. Split large components **by responsibility, not by line count**, and only where it solves a *measured* slow render or a real ownership pain — not for neatness. Memoise/virtualise only where a large tender actually renders slowly.
- **Done when:** matrix interaction stays responsive on large tenders; any split follows measured pain; demo pages still work after the demo-fixture provider split (coordinate with Jawad's A2).

---

## What NOT to do yet (scope discipline)

- **Don't** expand the engine for its own sake — it's at 15/20 and holding is the goal, not maxing it. Broader production eval evidence comes *from pilots*, not from more synthetic fixtures.
- **Don't** start the Postgres migration or a real job queue — that's beta-band (80+). B1 persists state; the queue is later. (Migration *planning* is fine as P2, shared with Pranav.)
- **Don't** refactor frontend components cosmetically. The roadmap is explicit: split only on measured route weight or ownership pain.

---

## Business lens — your eval work is the receipt

Map your effort to the claim it defends:

| Your work | The claim it backs | Where the claim is used |
|---|---|---|
| Gold set + gating-recall smoke | "12/12 deal-breakers, 0 dangerous misses" | Joe's demo headline; `demo-claim-ledger.md` |
| Deterministic safety net | "we flag uncertainty, we don't bluff" | the honesty beat in every demo |
| Misses → fixtures loop | "we measure what we miss and fix it" | pilot feedback → roadmap; YC proof log |
| One-command verification | "the build was verified before this call" | Joe's go/no-go; ops confidence |

If a claim can't point to one of your artifacts, it shouldn't be in the pitch (the `yc-story.md` five-minute-verification rule).

---

## Definition of done for your lane at 75

- [ ] One-command pilot verification runs from docs (lint, build, imports, mixed-pack smoke, gating-floor smoke); latest result logged
- [ ] `eval_all` extraction-only caveat documented next to the command
- [ ] Job-failure state renders truthfully end-to-end and survives refresh/restart (with Pranav)
- [ ] Structured logs traceable by job id, engine-adjacent error categories present (with Pranav)
- [ ] ≥1 real pilot miss folded into `gold-set/` without ingesting confidential material
- [ ] Trust invariants stay format-neutral across mixed packs
- [ ] Any frontend component split is justified by measured pain, not tidiness

---

## Reference map

| Need | File / location |
|---|---|
| Master scoring & bands | `ops/pilot-readiness-roadmap.md` |
| Backend punch-list (your co-owned half) | `pilot-roadmap/backend-pranav.md` |
| Frontend + design gate (your 20–30%) | `pilot-roadmap/frontend-jawad.md`, `frontend/layout.md`, `frontend/SLOP-CHECK.md` |
| Reconcile / dedupe | `engine/reconcile.py` |
| Eval harness | `engine/eval.py` |
| Gold set (8 CSVs incl. mixed-pack) | `gold-set/` |
| Smoke/eval scripts | `engine/scripts/` (`mixed_pack_smoke.py`, `gating_recall.py`, `eval_all.py`, `run_tender.py`) |
| Claim → source → owner ledger | `demo-claim-ledger.md` |
| Proof-point log | `yc-story.md` |
