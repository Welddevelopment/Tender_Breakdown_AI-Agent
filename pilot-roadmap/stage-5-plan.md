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

**Audit correction:** the answer worklist grouping **already exists** and — importantly — uses its *own* completeness model in `lib/answers.ts` (`readinessOf`: deal-breaker → no-draft → needs-input → ready, ordered `compareWeakestFirst`, visualized by `ReadinessLedger.tsx`). This is deliberately **not** the matrix's decision-status triage: answers ask "is the drafted response submittable?", the matrix asks "what decision does this need?". Do **not** port `deriveTriage`/`pendingStatusWord` over it — the distinct model is correct. Keep the FSM above as the *decision* overlay only.

## Workstreams (revised against the audit — `/answers` is ~65% built)

**A · Answer worklist + grouping** — *Current state: done, and correctly distinct.* `lib/answers.ts` + `ReadinessLedger.tsx` + `AnswersBody.tsx` already group and order by answer-completeness. **Genuine gap:** no bulk-approve UI on `/answers` (context has `approveMany`, it's just not wired here) and fewer filter chips than the matrix.
· Scope: wire a bulk-approve affordance that excludes any answer with an open gap; optional filter-chip parity. Do **not** rebuild the grouping.
· Model: **Sonnet** (small). Done when: bulk-approve on `/answers` touches only gap-free, confident, drafted answers.

**B · The gap-fill experience** — *Current state: fully present.* `GapInterview.tsx` + `OpenQuestions.tsx` surface, collect, persist (localStorage), and transition `auto → human_edited` when all gaps close (shared save path inline + consolidated). **Genuine gap:** partial per-gap input is transient — lost if you close the expansion mid-answer.
· Scope (optional/small): protect partial input (auto-save the in-progress gap draft, or confirm-before-discard per form-design). Nothing else.
· Model: **Sonnet/Haiku**. Done when: a half-typed gap answer survives closing the panel.

**C · Answer review + evidence (civic-record parity)** — *Current state: partial — THE main frontend build.* `AnswerPanel.tsx` shows the draft in a 64ch column with evidence receipts ("Backed by your {doc}, p.{page}") down a mono margin, plus a settle animation and inline text-edit. **Genuine gaps:** (1) **no decision actions** — it has answer-text edit but no Approve/Flag; (2) **no "Show evidence"** link opening the capability doc (the mirror of the matrix's `SourceVerifyOverlay` "Show source"); (3) plainer than `RequirementPanel` — no ruled `--rule-hair` margin, no audit line.
· Scope: add Approve/Flag decision actions to the answer panel; add Show-evidence → capability-doc overlay; true up to the Stage 3 device kit (ruled margin, mono record voice, audit line).
· Model: **Sonnet** restyle against the existing device kit; **Haiku** for badges/tokens; trust-critical decision copy = Jawad/Opus review.
· Done when: answer panel matches `RequirementPanel` discipline; Show-evidence opens the backing doc; decisions recorded with an audit line.

**D · Cross-surface state coherence** — *Current state: decoupled, and gated on a backend gap.* `answer.state` and `requirement.status` are independent branches; editing an answer doesn't touch the requirement and vice-versa; **answer text + gap answers persist to localStorage only — there is no backend endpoint for them yet** (`answer-store.ts:3-9`); there's no undo for answer edits (undo exists for decisions).
· **⚠ Backend prerequisite (Pranav, not frontend):** a persistence endpoint for answer text + gap answers. Without it, a pilot user's drafted answers are lost across devices and invisible to collaborators — a real data-loss risk, arguably the single most pilot-critical Stage 5 item. Coordinate on `comms/board-backend.md`.
· Frontend scope: decide + make legible the intended relationship (recommendation: keep `answer.state` and `requirement.status` **independent** but show both honestly — "requirement accepted · answer still needs input" is a valid displayed state, not a bug); add undo for answer edits (mirror `snapshotDecisions/restoreDecisions`).
· Model: **Opus** (cross-surface state; eliminating impossible states). Backend endpoint: **Pranav**.
· Done when: the answer/requirement relationship is legible and consistent; answer edits are undoable; answers persist server-side (once the endpoint lands).

## Motion

No new hero motion. Reuse Stage 3's tokens (`ease-settle`, the approval stamp) for the gap-filled → answer-complete beat. `prefers-reduced-motion` composed end-state is mandatory. **No Fable this stage.**

## Sequencing (revised — A/B mostly done, C is the real work)

**C first** (the main frontend build — decision actions + Show-evidence + device-kit trueing; no blocker) → **A** (bulk-approve UI, small) → **B** (protect partial gap input, optional) → **D-frontend** (answer/requirement legibility + undo for answer edits). In parallel and off the frontend critical path: **hand the backend answer-persistence endpoint to Pranav** on `comms/board-backend.md` — it unblocks D's server-side persistence but not the frontend coherence work, so the two proceed independently. One commit per workstream; `npm run build` + `npm run lint` green per commit; trunk to `main`.

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
- 2026-07-09 — **audit complete; `/answers` is ~65% built.** Findings folded in:
  A grouping already exists via a *distinct, correct* answer-completeness model
  (`lib/answers.ts`) — plan corrected to NOT port matrix triage; B gap-fill is
  fully present (only partial-input protection missing); C (answer decision
  actions + Show-evidence + device-kit trueing) is the real frontend build; D
  is decoupled and gated on a **new backend answer-persistence endpoint**
  (answer text is localStorage-only today — `answer-store.ts:3-9`), handed to
  Pranav. Sequencing reset to C → A → B → D-frontend. Still no Fable.
- 2026-07-09 — **frontend shipped: C → A → B → D-frontend, one commit each on `main`.**
  Design fork resolved with Jawad: the answer's Approve/Flag is **answer-scoped
  and independent** of the requirement decision (new `answer.decision`), so
  "requirement approved · answer still needs input" is a real displayed state.
  - **C** (`c4e632e`) — answer-scoped Approve/Flag/Reopen with a self-writing
    audit line; Show-evidence overlay (`AnswerEvidenceOverlay`, the answer-side
    mirror of `SourceVerifyOverlay`, honest that it can't render the capability
    doc — no fetch URL yet); margin trued to the `--rule-hair` token. Verdict
    persists independent of `answer.state`.
  - **A** (`5d491dd`) — bulk-approve of ready drafts (`isAnswerApprovable`:
    gap-free, confident, undecided); Undo toast on a new `snapshotAnswers`/
    `restoreAnswers` seam.
  - **B** (`4bbe186`) — half-typed gap answers lifted to context (`gapDrafts`),
    surviving panel collapse / card unmount.
  - **D-frontend** (`89afba8`) — requirement status shown beside answer state on
    the card; answer edits undoable (same snapshot seam).
- 2026-07-09 — **backend answer-persistence endpoint landed** (`911aba7` backend,
  `a5c3e3e` frontend wiring), closing D's last open item. `PATCH
  /requirements/{id}/answer` persists answer text + gap answers + the answer
  verdict (was localStorage-only); actor stamped server-side, cross-account
  access 404s, requirement status untouched (verified end-to-end). Frontend
  syncs best-effort from every answer mutation + undo, with localStorage kept as
  the offline/mock fallback. Stage 5 is now complete end-to-end; the only
  remaining backend note is the pre-existing SSE `?token=` stream-ticket item
  (Stage 4 carry-over, unrelated).
