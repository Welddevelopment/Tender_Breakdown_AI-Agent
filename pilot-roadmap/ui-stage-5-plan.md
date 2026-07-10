# UI Improvement — Stage 5: Bid Response And Export Readiness

Owner: Jawad (frontend) · Drafted 2026-07-10, after UI Stage 4 + Stage 4 follow-ups shipped.
Reads with: `frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md` (§"Stage 5", §"5. Bid Response Workspace"), `MOTION.md` (§"Answers"/"Export").

## Promise

The bid-response workspace makes answer state legible at a glance, treats a human verdict as official, and never lets an export imply readiness while deal-breakers or gaps remain.

## Step 0 — Audit (done). Stage 5 is ~85% built.

Already DONE, leave alone: the readiness ledger + honest export blockers (`ReadinessLedger.tsx`, `ExportReadinessSummary.tsx`, `export-readiness.ts`), evidence traceability + overlay, the gap interview, the full answer state machine + persisted verdicts, bulk approve with undo. Answer verdict attribution already renders as **text** ("Answer approved by X, 14:32") in the decision footer (`AnswerPanel.tsx:280-289`).

Genuine remaining work (3 commits):

**A · Answer verdict stamp (visual).** The answer decision is attributed in prose but doesn't carry the matrix's stamp device, so approval doesn't feel as official across surfaces (Decision 4 wants one recognisable treatment). Reuse `ApprovalStamp` for an approved answer and add a matching **flagged** stamp (oxblood) in the `AnswerPanel` decision footer, replacing the bare status word with the device + the existing audit line. No new copy, no logic change. File: `AnswerPanel.tsx`. Model: **Sonnet**.

**B · Answer-state swim-lanes.** Plan §5 line ~940: "group answer cards by state: needs input, needs review, backed by evidence, ready." Today all cards render in one flat list (`AnswerWorkspace.tsx`). When no filter is active, group cards by `readinessOf()` into labelled lanes (Deal-breakers · Needs input · No draft · Ready) matching the ledger's four tallies exactly; keep the flat list when a filter is on (the filter is its own grouping). Quiet section headers in the existing idiom; a lane only renders when non-empty. File: `AnswerWorkspace.tsx`. Model: **Sonnet**.

**C · Two specified settle motions.** From MOTION.md §Answers/Export, conservative and reduced-motion-safe: (1) a gap-answered **settle-once** on the open-question item when a gap is saved (`OpenQuestions.tsx`); (2) an **export-start gather** — a brief filed-page/sheet-gather beat (240–360ms via `--motion-process`) when an export begins (`ExportMenu.tsx`). One-shot, no loops, collapse to instant under reduced motion. Files: `OpenQuestions.tsx`, `ExportMenu.tsx` (+ CSS module if needed). Model: **Sonnet**.

## Boundary / constraints

- **Apply the existing grammar; don't re-architect the workspace.** Reuse `ApprovalStamp`, `readinessOf()`, the ledger taxonomy, motion tokens, and the calm register — no celebration, no emoji, no scores.
- **Honesty holds.** No change to what counts as ready/blocked; export gating stays as-is.
- **Reduced motion stays whole** — every new motion collapses to instant via the token override; stamps rest at their static base.
- **No backend.** Verdicts/answers are client-side today; this is presentation only.

## Sequencing & verification

A / B / C touch disjoint files (`AnswerPanel.tsx`; `AnswerWorkspace.tsx`; `OpenQuestions.tsx`+`ExportMenu.tsx`) → three Sonnet subagents in parallel, integrated + verified by the lead. One commit per workstream; `npm run build` + `npm run lint` green per commit; headless-browser check of `/answers` (stamp on an approved answer, swim-lanes when unfiltered, gap settle, export gather) + reduced motion; trunk to `main` over the codemap bot.

## Changelog

- 2026-07-10 — **Stage 5 shipped (A/B/C).** Answer verdict stamp (A) — approved answers render the shared ApprovalStamp, flagged answers a matching oxblood FlaggedStamp; dead `answerAuditLine` removed. Answer-state swim-lanes (B) — unfiltered cards group into Deal-breakers → Needs input → No draft → Ready via `readinessOf()`, stable partition so the weakest-first sort survives. Two settle motions (C) — gap-answered `settle-once` on the answered transition, export-start `gather` beat on idle→busy, both one-shot + reduced-motion gated. Built in parallel by three Sonnet subagents on disjoint files, integrated + verified by the lead. Verified in a headless browser: all four lane headers render with counts (deal-breaker count oxblood-tinted), and approving an answer shows the "✓ APPROVED — Approved by you, 23:38." stamp with a single attribution. Build + lint green.
- 2026-07-10 — plan drafted; Step-0 audit folded in (Stage 5 ~85% built). Real work: visual verdict stamp, answer-state swim-lanes, and two specified settle motions. No backend.
