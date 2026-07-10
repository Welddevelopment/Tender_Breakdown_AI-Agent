# UI Stage 1 — Control & State Affordance Audit (baseline)

The regression guard for UI-improvement Stage 1 (`pilot-roadmap/ui-stage-1-plan.md`).
Records, **before** any restyle, which interaction states every common control
affords today, so Stage 1 A–C can standardise without silently losing an
affordance (delete.md guardrail). Captured 2026-07-10, at commit before Stage 1A.

Baseline screenshots (QA reference, not committed): `/answers`, `/showcase`,
`/review` at 1280px — held in the run's scratchpad.

## The six states (the vocabulary Stage 1 standardises)

`default · hover · focus (2px forest ring) · press (--motion-instant tap) · loading (spinner + aria-busy + disabled) · settled (one-shot --ease-settle)`

## Current state matrix (✓ present · ✗ missing · n/a not applicable)

| Control | File | hover | focus-ring | press | loading | disabled | settled |
|---|---|---|---|---|---|---|---|
| Draft my answers | `AutofillButton.tsx` | ✓ | ✗ | ✗ | ✓ spinner | ✓ | ✗ |
| Export (menu) | `ExportMenu.tsx` | ✓ | ✗ | ✗ | ✓ "Preparing…" | ✓ | ✗ |
| Format items (menu) | `ExportMenu.tsx` | ✓ | ✗ | ✗ | n/a | n/a | ✗ |
| Bulk approve ready | `AnswersBody.tsx` | ✓ | ✗ | ✗ | ✗ | n/a | ✗ (toast only) |
| Capability upload | `CapabilityUpload.tsx` | ✓ | ✗ | ✗ | partial | n/a | ✗ |
| Gap save / update | `OpenQuestions.tsx` | ✓ | ✗ | ✗ | ✗ | ✓ (dirty) | ✗ (toast only) |
| Comment submit | `CommentThread.tsx` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Requirement decision (Approve/Edit/Flag/Reopen) | `RequirementPanel.tsx` | ✓ | ✓ (1) | ✗ | n/a | ✗ | ✓ ApprovalStamp |
| Answer decision (Approve/Flag/Reopen/Save) | `AnswerPanel.tsx` | ✓ | ✓ (1) | ✗ | n/a | n/a | ✗ |
| Filter chips | `AnswerFilterBar.tsx` | ✓ | ✗ | ✓ | n/a | n/a | n/a |
| Book a demo (landing) | `BookDemoButton.tsx` | ✓ | ✓ | ✓ cta-shine | n/a | ✓ | n/a |

**Overlays / focus management**

| Overlay | File | open/close timing | Esc | focus trap | focus return |
|---|---|---|---|---|---|
| Source verify | `SourceVerifyOverlay.tsx` | browser default (no token) | ✓ | partial | ✓ |
| Share | `ShareControl.tsx` | browser default (no token) | ✓ | ✓ | ✓ |
| Answer evidence | `AnswerEvidenceOverlay.tsx` | browser default (no token) | ✓ | partial | ✓ |
| Comment thread | `CommentThread.tsx` | n/a (inline) | ✗ | ✗ | ✗ |

## The gaps Stage 1 closes (verified in code)

- **Focus rings are missing on most product action buttons** — `AutofillButton`, `ExportMenu`, `AnswersBody`, `CapabilityUpload`, `OpenQuestions`, `CommentThread` have **zero** `focus-visible` rings today (grep). Keyboard focus is invisible on them. → **A**.
- **No press feedback** anywhere in the product surfaces (only landing + filter chips have `active:`). → **A**.
- **No `aria-busy`** on any loading control; loading patterns are ad-hoc (spinner vs dim). → **A**.
- **No token-driven settled feedback** on save/approve/comment/gap beyond the ApprovalStamp; toaster has no `--motion-*` entry/exit. → **B**.
- **Overlays animate at browser defaults**, not `--motion-panel` (240ms). → **C**.
- **`CommentThread` has no focus trap or Esc** (unlike `ShareControl`). → **C**.

## What is already solid (do not regress)

- The whole token layer: colour, type, `--motion-*` durations, `--ease-*` easings, and the **global reduced-motion collapse to 1ms** (`globals.css:74-102`).
- `ShareControl` + `SourceVerifyOverlay` focus-trap/Esc/return patterns (template for `CommentThread`).
- `ApprovalStamp` settle and the `moss-pulse` collaboration beat (already token-timed, reduced-motion-safe).
</content_placeholder>
