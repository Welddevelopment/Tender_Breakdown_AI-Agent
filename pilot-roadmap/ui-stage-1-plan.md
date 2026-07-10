# UI Improvement — Stage 1: Foundation & Motion Tokens (apply the tokens to the controls)

Owner: Jawad (frontend) · Drafted 2026-07-10, after product Stage 7 (landing/demo continuity) shipped.
Reads with: `frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md` (§"Stage 1", §"Visual Token and Pattern Plan", §"Motion And Microinteractions"), `frontend/UI/UX/Motion Overhaul/MOTION.md` (the token + timing spec), `frontend/UI/UX/Motion Overhaul/{QA.md,delete.md}` (gates), `frontend/{DESIGN-SYSTEM.md,design-language.md,SLOP-CHECK.md}` (the design discipline).

> **Track note:** this is the first stage of the *UI Improvement Plan's own* staged rollout (its Stages 1–6), a separate track from the product roadmap's Stages 1–7 (which is complete through 7). "Stage 1" here = **UI Foundation And Motion Tokens**.

## Why this is Stage 1

Every later UI-improvement stage (workspace header, matrix, intake, bid, collaboration) restyles controls and overlays. Stage 1 lays the interaction foundation those stages build on: a single, tokenised vocabulary for how a control **presses, focuses, loads, disables, and settles**, and one consistent timing for how overlays open and close. Do it first so nothing downstream reinvents its own timing or silently loses an affordance.

## Step 0 — Audit first (done; folded in). Stage 1 is ~60% built.

The **token layer already exists and is coherent** — this stage is *applying* the tokens to the controls, not building them:

- **Design tokens — DONE.** Full palette (paper, ink, forest, accent, signal oxblood/amber/yellow/light-green), rule weights, depth/shadow tokens in `globals.css:6-62`. Fonts (Fraunces/Chillax/IBM Plex Mono) self-hosted via `localFont` (`layout.tsx:16-51`).
- **Motion tokens — DONE.** Durations `--motion-instant` (80ms) → `--motion-hero` (700ms) (`globals.css:74-81`); easings `--ease-standard/enter/exit/forest/record/settle/stamp` (`globals.css:83-89`); **global reduced-motion collapse to 1ms** (`globals.css:92-102`); collaboration moss-pulse (`globals.css:114-127`).
- **Focus management — PARTIAL but templated.** `ShareControl.tsx:105-137` and `SourceVerifyOverlay.tsx:45-52` have full focus trap + Esc + focus-return. `CommentThread.tsx` has **none** (no trap/Esc on the comment form).

**The genuine remaining Stage-1 work (a polish + standardisation pass):**
1. **Button interaction states are inconsistent.** No shared press feedback: some buttons use ad-hoc `active:` classes (`BookDemoButton`), most product buttons have only `transition-colors hover:` + `disabled:opacity` and **no `--motion-instant` press depth** (`AutofillButton.tsx`, `CommentThread.tsx:150`, `CapabilityUpload.tsx`, and matrix/answers action buttons).
2. **Loading states are ad-hoc.** `AutofillButton` spins; others just dim — no shared loading pattern or timing.
3. **No token-driven "settled/saved" feedback.** Approve/flag/comment/share/gap-answered land without a one-shot settle; the toaster (`layout.tsx:81-98`) has no `--motion-*` entry/exit.
4. **Overlay/drawer timing is unspecified.** `SourceVerifyOverlay.tsx:76,86` and `ShareControl.tsx:194-200` animate at browser defaults, not `--motion-panel` (240ms).
5. **`CommentThread` lacks focus trap + Esc** (parity with `ShareControl`).
6. **No baseline screenshots** and **no control/state affordance inventory** (the spec's "mark every control before restyling").

## Boundary / constraints

- **Apply, don't re-architect.** The tokens exist; this stage wires them to controls. No new colours, fonts, or off-token shadows (SLOP-CHECK).
- **No affordance regressions.** Mark every control's current states first (§D) so nothing silently loses a focus ring, disabled state, or loading cue while being standardised (delete.md guardrail: never delete accessibility affordances).
- **Reduced-motion stays whole.** Every added motion must collapse via the existing global rule; press/settle become instant, focus rings and validation stay.
- **Record vs forest motion** (MOTION.md): proof/approval/audit use record easing (`--ease-record`, small settle, ≤6px); arrival/success use forest. No decorative motion in matrix/source/export surfaces.

## The interaction-state vocabulary (what Stage 1 standardises)

One shared spec for every actionable control, all reduced-motion-safe:

```
default  → resting
hover    → colour shift only (existing)
focus    → 2px forest ring, offset to the ground behind it (existing pattern, make universal)
press    → --motion-instant (80ms), ~1–2px translate/scale, --ease-standard
loading  → one shared spinner/label pattern, control disabled, aria-busy
disabled → reduced opacity + not-allowed, no motion
settled  → one-shot settle (--ease-settle at --motion-standard) on save/approve/post; never loops
```

## Workstreams

**D · Baseline + affordance inventory** — *first, per the spec ("mark every control before restyling").*
· Scope: capture baseline screenshots of `/`, `/review`, `/answers`, `/graph`, `/teams`, `/upload`; write a short control inventory (`frontend/UI/UX/Motion Overhaul/stage-1-control-audit.md`) listing each button/overlay and which of the six states it currently affords. This is the regression guard for A–C.
· Model: **Sonnet** + Playwright. Done when: baseline shots exist and every control's current states are recorded.

**A · Button interaction states** — *the bulk.*
· Current state: press/loading inconsistent (audit §1–2).
· Scope: a shared press treatment (`--motion-instant`, ~1–2px, `--ease-standard`) and a universal focus ring, applied across the product action buttons (`AutofillButton`, `CommentThread`, `CapabilityUpload`, matrix/answers/decision controls). One loading pattern (spinner + label + `aria-busy` + disabled). Prefer a small shared `Button`/class utility over per-site copies where it doesn't fight existing markup.
· Model: **Sonnet** (mechanical against the token spec). Done when: every common control has visible press, focus, loading, and disabled states, all reduced-motion-safe.

**B · Settled/saved feedback** — *the trust beat.*
· Scope: a one-shot settle (`--ease-settle`, `--motion-standard`) on approve/flag/edit, comment posted, share success, and gap answered; wire the toaster entry/exit to the motion tokens. No loops; record surfaces keep the restrained record easing.
· Model: **Sonnet**; **Haiku** for token/class tables. Done when: a save/approve visibly settles once and reads as recorded, static under reduced-motion.

**C · Overlay/drawer timing + CommentThread focus** — *consistency + a11y.*
· Scope: apply `--motion-panel` (240ms) open/close to `SourceVerifyOverlay`, `ShareControl`, and any drawer; give `CommentThread` the `ShareControl` focus-trap + Esc + focus-return treatment.
· Model: **Sonnet** (template the existing focus pattern). Done when: overlays open/close at one consistent timing; keyboard users open and close every core overlay without losing focus.

## Sequencing & models

**D** (baseline + inventory) → **A** (buttons) → **B** (settled states) → **C** (overlays + comment focus). One commit per workstream; `npm run build` + `npm run lint` green per commit; trunk to `main`. No backend. **Fable: not needed** — the motion vocabulary is specced and the tokens exist; this is application + standardisation, not visual exploration.

## Verification

- Build + lint green per commit; SLOP-CHECK + greyscale on touched surfaces.
- Every common control shows press, focus, loading, disabled, and settled states (checked against the §D inventory — no affordance lost).
- Reduced-motion: enabling it leaves no broken transition; press/settle become instant, focus rings + validation remain (screenshot-verified).
- Keyboard: open and close `SourceVerifyOverlay`, `ShareControl`, and `CommentThread` without losing focus.
- Overlays open/close at one consistent `--motion-panel` timing; no decorative motion added to matrix/source/export surfaces.

## Changelog

- 2026-07-10 — plan drafted; Step-0 audit folded in. Token layer (colour, type, motion durations/easings, global reduced-motion collapse) is already built; Stage 1's real work is applying those tokens to controls — button press/loading, settled/saved feedback, consistent overlay timing, and `CommentThread` focus parity — plus a baseline + control-affordance inventory taken first. No backend; no Fable.
- 2026-07-10 — **shipped D → A → B → C, one commit each on `main`.**
  - **D** (`c88e807`) — control-affordance audit (`stage-1-control-audit.md`) + baseline screenshots; confirmed most action buttons had no focus ring or press.
  - **A** (`e43f9c4`) — shared `.ui-btn` utility (2px forest focus-visible ring + press tap, motion-token-timed, reduced-motion-instant) applied to the primary action buttons (Draft/Export/bulk-approve/gap-save/comment/upload/answer-decision); `aria-busy` on loading buttons. Verified: focus ring computes to forest 2px on keyboard focus.
  - **B** (`8407712`) — `.settle-once` + `.toast-settle` on the settle tempo; the save/undo toaster now settles in at the token timing, covering approve/flag/comment/share/gap (all toast-based) in one place.
  - **C** (`635ef54`) — `.panel-enter` gives source-verify, share, and answer-evidence sheets one consistent `--motion-panel` open (verified visible + opacity 1 under reduced motion). **Deviation from plan:** `CommentThread` is an inline form, not a modal, so a focus *trap* was wrong; gave it the correct inline treatment instead (focus ring + Esc-to-clear + `aria-busy`).
  - Build + lint green per commit. Stage 1's control-standardisation scope is complete; remaining button-by-button coverage (every matrix decision control) can extend `.ui-btn` incrementally in later UI stages.
