# Stage 5 Plan — Answer & Gap Review Flow

Owner: Jawad (frontend `/answers` surface) · coordinating with Bobby (autofill / answer-draft pipeline)
Drafted 2026-07-09, after Stage 4 shipped (`bd99590`).
Reads with: `pilot-roadmap/stage-3-plan.md` (device kit + motion it inherits), `pilot-roadmap/frontend-jawad.md` (lane brief), `frontend/design-language.md` (record-led rule for exports/answers), `frontend/SLOP-CHECK.md` (gate).

## Why this is Stage 5

The product loop is **upload → review requirements → draft answers → export**. Stages 1–4 delivered the first half (matrix review) plus reliability. `/answers` is the **mirror of Stage 2 for the answer half**, and it is visibly under-built (`AnswerWorkspace.tsx` ≈ 41 lines vs. a fully-fledged matrix). Stage 5 does for grounded answers what Stage 2 did for requirements: turn `/answers` into a confident review-and-fill flow.

**Business framing (why it earns the slot):** this is the value-realization step. The pilot ask — "would you run your next bid through it?" — needs the user to produce *usable* draft answers and know exactly which gaps to fill. Answers are the output carried into their real bid; they are also the content Stage 6 (Export & Handoff) will emit. Metrics to move: gap-closure rate, % answers reaching `human_edited`/approved, time-to-first-usable-answer.

**Boundary:** answers are **record-led** (they get exported). Forest stays on the chrome frame (the moss shell already wraps `/answers`) and on actions only — no forest decoration on answer cards or evidence. Matrix-core discipline applies here too.

## Step 0 — Audit first (non-negotiable)

The lesson that saved us on Stage 2 (which turned out already built): **verify before building.** Before any workstream starts, a read-only fan-out reports the *actual* state of `/answers` vs. matrix parity. Every workstream item below must open with "current state: …". Likely this stage is *trueing + flow-wiring*, not build-from-scratch.

Surfaces to map: `AnswerWorkspace.tsx`, `AnswersBody.tsx`, `AnswerPanel.tsx` (+ `.module.css`), `AnswerCard.tsx`, `AnswerFilterBar.tsx`, `AnswerStateBadge.tsx`, `OpenQuestions.tsx`, `GapInterview.tsx`, `AutofillButton.tsx`; the `/answers` route; `lib/answers.ts`, `lib/answer-store.ts`; and how answer decisions persist vs. the matrix (`RequirementsContext`, `lib/api.ts` `postComment`/`draft`).

## The answer state model (state-machine lens)

Surface `answer.state` as a first-class, visible FSM — it exists in the schema, so this is exposing it, not inventing it:

```
empty ──draft──▶ auto ──edit──▶ human_edited
                  │                 ▲
                  └─gap detected──▶ needs_input ──fillGap──┘
open_questions:   unanswered ──answer──▶ answered
```

The answer worklist groups by *what each answer needs* — the `deriveTriage`/`pendingStatusWord` pattern, ported to answers:
**Gaps to fill** (needs_input / unanswered questions) → **Drafts to check** (auto, low-confidence) → **Ready** (auto, confident) → **Approved / edited**. No impossible states (never `auto` + unanswered required question presented as "ready").

## Workstreams

**A · Answer worklist + grouping** — port Stage 2's triage/worklist to `/answers`: group by need (gaps first), a triage line ("6 gaps to fill · 12 to check · 40 ready"), Next routes to the highest-priority gap. Likely a new pure `lib/answer-triage.ts` mirroring `triage.ts`.
· Model: **Sonnet** (spec-driven mirror of existing triage). Opus reviews the state model.
· Done when: `/answers` groups by need, gaps lead, Next walks the gap worklist; pure functions unit-testable.

**B · The gap-fill experience** (form-design lens) — the open questions are forms that complete an answer. Apply: single column; top-aligned persistent labels; "why we're asking" helper text; resizable textarea for prose; **auto-save so a partial gap answer is never lost**; validate on blur; honest copy; a review beat before it flips the answer. `GapInterview.tsx` is the home; filling a gap transitions `needs_input → human_edited`.
· Model: **Sonnet** (forms). Opus for the gap→answer wiring; trust-critical "why we're asking" copy = Jawad/Opus review.
· Done when: a gap can be filled, auto-saved (survives refresh), and flips the answer state; validation + a11y (label/`aria-describedby`) pass.

**C · Answer review + evidence (civic-record parity)** — the draft is record-led: answer text (Chillax) with `evidence_refs` in the mono margin (which capability doc backs the claim + page), confidence bead, two-sided traceability (requirement ↔ answer ↔ evidence). Bring Stage 3's device kit (ruled margin, mono record voice) to the answer panel. Actions: Approve · Edit · Flag · **Show evidence** (mirror the matrix "Show source"). Honest bulk approve = only confident, fully-grounded, gap-free answers.
· Model: **Sonnet** restyle against the existing device kit; **Haiku** for badges/tokens/copy tables.
· Done when: answer panel matches matrix panel discipline; Show-evidence opens the capability-doc source; bulk approve excludes anything with an open gap.

**D · Cross-surface state coherence** — matrix and answers are two views of the same requirements. A decision on one reflects on the other; both route through the same `RequirementsContext` handlers + undo; `answer.state` stays in sync with `requirement.status`; the `ControlPanel` tally (already reads both) never disagrees.
· Model: **Opus** (eliminating impossible states across two surfaces is the one genuinely hard, cross-cutting piece).
· Done when: approve/edit/flag on either surface updates both + the tally; undo works from both; two-account isolation holds.

## Motion

No new hero motion. Reuse Stage 3's tokens (`ease-settle`, the approval stamp) for the gap-filled → answer-complete beat. `prefers-reduced-motion` composed end-state is mandatory. **No Fable this stage.**

## Sequencing (riskiest-appropriate)

Step 0 audit → **A** (grouping) → **C** (answer device-kit) → **B** (gap forms) → **D last** (the integration hub). One commit per workstream; `npm run build` + `npm run lint` green per commit; trunk to `main` per repo rules. Any single change large enough to risk `main` goes on a `frontend/<name>` branch + PR (unlikely at this granularity).

## Verification

- Build + lint green per commit; SLOP-CHECK + greyscale on every answer surface.
- A gap fills, auto-saves (survives refresh), flips the answer to `human_edited`, and the matrix reflects it.
- Bulk approve touches only gap-free confident answers; undo works from both surfaces.
- Two-account: answer decisions isolate correctly.
- Boundary intact: no forest on answer cards/evidence; chrome moss unchanged.

## Models — do I need Fable? **No.**

Stage 5 is record-led **flow + forms + state coherence** — no motion/brand-visual *exploration* (Fable's only edge); it inherits Stage 3's motion + device kit wholesale.

| Work | Model | Why |
|---|---|---|
| Step 0 audit (read-only fan-out) | **Explore / Sonnet** | efficient read-only mapping; token-light |
| A grouping · B gap forms · C answer device-kit | **Sonnet** | spec-driven against patterns that already exist |
| Badges, token/copy tables | **Haiku** | mechanical, cheapest |
| D cross-surface coherence + trust-critical gap copy | **Opus** | the one place a wrong call creates impossible states / breaks trust |

Net: mostly **Sonnet + Haiku**, a little **Opus**, **zero Fable**.

## Known dependency (not a Stage 5 item)

Stage 4 left one recorded exception: the SSE `tenderEventsUrl` still carries `?token=` (EventSource can't set headers — needs a backend stream ticket, raised for Pranav). Live activity on `/answers` rides that stream, so track it, but it's backend-owned.

## Changelog

- 2026-07-09 — plan drafted; Step 0 audit launched to fill per-workstream "current state".
