# Bidframe UX, UI, And Motion QA Layer

Local planning draft. Created 2026-07-05. No commit or push has been made.

This document defines how to measure and verify the UX, UI, and motion overhaul.
It is the quality gate for [UX-OVERHAUL-BRIEF.md](UX-OVERHAUL-BRIEF.md),
[UI-IMPROVEMENT-PLAN.md](UI-IMPROVEMENT-PLAN.md),
[MOTION.md](MOTION.md), [delete.md](delete.md), and
[implementation.md](implementation.md).

## QA Purpose

The overhaul is successful only if Bidframe becomes easier to understand, faster
to use, more trustworthy, more collaborative, and more conversion-ready.

The QA layer should answer:

1. Did the user move through the tender workflow faster?
2. Did the user trust the source proof more?
3. Did collaboration become visible at the work item?
4. Did `/answers` make readiness, evidence, gaps, and export blockers clearer?
5. Did motion improve feedback and continuity without slowing serious work?
6. Did landing -> `/demo` -> app feel like one product?

## North Star

Confident tender progress.

A user can open or upload a tender, find a deal-breaker, verify its source,
make or request a decision, involve a teammate, understand bid-response gaps,
and know whether export is blocked without the presenter explaining the UI.

## Measurement Principles

- Measure before and after each stage where possible.
- Use real or prebaked tender data, not empty mock shells.
- Prefer behavioural metrics for workflow clarity.
- Pair numbers with short qualitative notes.
- Do not optimise for speed by hiding risk.
- Do not count a task complete if the user cannot explain what happened.

## Primary Metrics

| Metric | Definition | Method | Target | Stage owner |
|---|---|---|---|---|
| Time to first source proof | Time from loaded `/review` to opening a relevant source proof for a deal-breaker | Timed usability task or event timestamps | Under 45 seconds in a guided test | Stage 3 |
| Time to first decision | Time from loaded `/review` to approve, flag, or comment on one requirement | Timed usability task or event timestamps | Under 90 seconds for a normal row; under 2 minutes for a deal-breaker | Stage 3 |
| Export blocker comprehension | User can state what blocks export and where to fix it | Usability prompt after opening export | 4 of 5 testers can explain blockers without help | Stage 5 |
| Collaboration activation | Tender is shared, second user acts, first user sees named activity | Two-account test | Pass in live or local two-account flow | Stage 6 |
| Bid readiness comprehension | User can identify drafted, evidence-backed, needs-input, and export-ready answer states | State recognition test | 4 of 5 testers classify states correctly | Stage 5 |
| Upload confidence | User can tell which files are staged, processing, failed, or ready | Upload task with mixed pack | 4 of 5 testers describe current state correctly | Stage 4 |
| Landing-to-demo continuity | Prospect recognises the same product logic after moving from `/` to `/demo` to app | Five-minute walkthrough test | 4 of 5 viewers identify same source-proof and review model | Stage 7 |
| Demo CTA intent | Visitor clicks `Book demo`, `See demo`, or enters app from landing/demo | Analytics events or manual session notes | Baseline first, improve after Stage 7 | Stage 7 |

## Supporting Metrics

| Metric | Definition | Target |
|---|---|---|
| Source proof success rate | User opens source proof for the intended requirement | 90 percent in test tasks |
| Source proof confidence | User says source proof is exact, approximate, or unavailable correctly | 80 percent in test tasks |
| Next-action clarity | User can name the primary next action on each route | 4 of 5 testers |
| Reduced-motion pass rate | All key flows remain usable with reduced motion | 100 percent |
| Keyboard task completion | User can review, show source, comment, share, answer gap, and export via keyboard | 100 percent for core flows |
| Mobile route usability | Core routes do not overlap, clip, or hide primary actions at narrow widths | 100 percent for tested routes |
| Build health | `npm run lint` and `npm run build` pass after each stage | 100 percent before merge |

## Instrumentation Events

These events are not a requirement to build analytics immediately. They define
what should be measurable when instrumentation is added.

- `landing_cta_clicked`
- `demo_started`
- `demo_source_proof_opened`
- `tender_selected`
- `tender_upload_started`
- `file_added`
- `file_rejected`
- `file_processing_updated`
- `matrix_ready`
- `requirement_selected`
- `source_opened`
- `source_exact_matched`
- `source_approx_matched`
- `requirement_approved`
- `requirement_flagged`
- `comment_posted`
- `activity_received`
- `tender_shared`
- `gap_answered`
- `evidence_uploaded`
- `draft_started`
- `draft_completed`
- `marks_requirement_selected`
- `export_blocked`
- `export_started`
- `export_failed`

Minimum event shape:

```ts
type ProductEvent = {
  name: string;
  route: string;
  tenderId?: string;
  requirementId?: string;
  sourceDocId?: string;
  actorRole?: "owner" | "member" | "anonymous";
  outcome?: "success" | "blocked" | "failed";
  timestamp: string;
};
```

Do not send sensitive tender text, source excerpts, capability evidence, email
addresses, or raw document contents in analytics events.

## Stage QA Gates

### Stage 0: Preflight And Baseline

Must capture:

- Current branch and dirty worktree.
- Baseline screenshots for `/upload`, `/review`, `/answers`, `/graph`,
  `/teams`, `/`, `/demo`, and `/pack`.
- Current lint/build status.
- Current first-click friction notes.
- High-conflict files already modified.

Pass condition:

- Team knows what is safe to edit and what must be preserved.

### Stage 1: UI Foundation And Motion Tokens

Check:

- Motion tokens exist and are used consistently.
- Reduced motion disables transform-heavy animation.
- Buttons, links, icon buttons, tabs, dialogs, drawers, and overlays have
  visible default, hover, focus, active, disabled, loading, and saved states.
- Source overlay, share dialog, comment thread, and drawer return focus.
- Keyboard escape works where expected.

Pass condition:

- Controls feel responsive before any major visual restyle.

### Stage 2: Workspace Header And Navigation

Check:

- Current tender is visible or one click away.
- Route labels are `Tender`, `Matrix`, `Bid`, and `Marks`.
- Active state survives greyscale.
- People/access and activity are visible when data exists.
- Primary action says what it will do.
- Header does not bury the work surface.

Pass condition:

- In five seconds, a user can identify tender, view, team state, and next action.

### Stage 3: Matrix Review And Source Proof

Check:

- Deal-breaker, low confidence, needs input, approved, flagged, commented, and
  owner states are distinguishable.
- `Show source` is consistent in row, panel, and overlay.
- Exact source match, approximate match, and no match are visually and textually
  distinct.
- Approval and flagging have clear saved states.
- Matrix row height does not jump during hover/focus/selection.
- Source overlay is keyboard usable and returns focus.

Pass condition:

- User can find a risky row, open proof, decide, and explain the decision.

### Stage 4: Tender Intake And Processing

Check:

- File staging list shows name, format, size, status, and remove action.
- ZIP and mixed-pack copy is honest.
- Unsupported files show clear errors.
- Processing names the current stage.
- Per-file progress uses real backend data when available.
- Success routes to Matrix, deal-breaker review, or Bid.
- Error state preserves recoverable user work.

Pass condition:

- User can describe whether the pack is staged, uploading, reading, extracting,
  reconciling, ready, or failed.

### Stage 5: Bid Response And Export Readiness

Check:

- `/answers` reads as `Bid` or `Bid response`.
- Readiness ledger guides attention.
- Answer states are visible: needs input, needs review, evidence-backed, ready.
- Evidence references show source and backing relationship.
- Gap form is usable and calm.
- Export blockers appear before export starts.
- Export never implies readiness while deal-breakers or gaps remain.
- Export artifact choices are distinct: Compliance Matrix, Bid Response Draft,
  Audit/Evidence Pack, and All Files if supported.
- Exported artifacts preserve unresolved gaps and missing evidence as explicit
  prompts or blocker notes.
- Client-ready output is clean; internal audit output carries proof detail.

Pass condition:

- User can answer a gap, see readiness change, and explain export blockers.

### Stage 6: Collaboration Presence And Audit

Check:

- Share flow works in solo and shared states.
- Named teammate actions appear in context.
- Activity feed reads as actor, action, object, time.
- Comments are tied to requirement, answer, source excerpt, or gap.
- No fake presence, fake typing, or fake role controls.
- Removed or unavailable members degrade honestly.
- Invite pending, failed, expired, and already-accepted states are legible.
- Lost permission mid-session preserves unsaved text and explains the change.
- Simultaneous edits or decisions do not silently overwrite another teammate.
- Reconnecting/offline states make unsynced comments, invites, and decisions
  explicit.
- Long names and many collaborators do not break the header or row layout.
- Export readiness distinguishes blocker comments from FYI comments.

Pass condition:

- In a two-account test, the first user sees the second user's decision or
  comment in the right work context, and at least one collaboration edge case
  recovers without data loss or hidden attribution.

Collaboration edge-case QA matrix:

| Scenario | Expected result |
|---|---|
| Invite fails | Email/input is preserved, message explains what happened, retry is available. |
| Invite already accepted | User sees that access already exists; no duplicate member is created. |
| Permission removed while editing | Draft text stays visible; blocked action explains the new permission. |
| Two users decide the same item | Latest saved record names the actor and time; no silent overwrite. |
| Activity stream reconnects | UI says reconnecting or refreshed; stale events do not pulse as new. |
| Former teammate appears in audit | Attribution remains as `Former teammate` or equivalent neutral copy. |
| Many collaborators | Header collapses people into a count without pushing out `Export` or `Next`. |
| Export with blocker comment | Export/readiness shows the blocker and routes back to the work item. |

### Stage 7: Forest-Led Continuity, Landing, And `/demo`

Check:

- Landing, `/demo`, and app share state grammar and source-proof behaviour.
- Forest motion guides arrival and momentum.
- Record motion carries proof, decisions, marks, audit, and export.
- `/demo` explains the real multipage app, not a prettier fake product.
- Reduced-motion mode leaves landing and `/demo` polished.
- No text overlaps during motion at desktop or mobile sizes.
- CTA path to demo or booking remains clear.

Pass condition:

- A prospect can move from landing to `/demo` to app and recognise the same
  product logic.

## Route QA Matrix

| Route | Must verify |
|---|---|
| `/upload` | Tender library, file staging, rejected files, upload progress, success action, no-tender recovery |
| `/review` | Matrix states, source proof, decision save, comments, collaboration markers, keyboard review |
| `/answers` | Readiness ledger, answer states, evidence upload, gaps, export blockers, export action |
| `/graph` or Marks | Split/Ledger/Map modes, missing criteria fallback, requirement selection, related items |
| `/teams` | Team creation, owner/member labels, invite/recovery, no fake permissions |
| `/` | Forest-led landing, product clarity, CTA, responsive hero, reduced motion |
| `/demo` | Guided story, source proof consistency, collaboration beat, marks/export beat, reduced motion |
| `/pack` | Mixed-pack badges, source-format honesty, no fake PDF highlight for non-PDF rows |

## Accessibility QA

Required checks:

- All icon-only controls have accessible names.
- Touch targets are at least 44px where practical.
- Keyboard can reach primary action, source proof, comments, share, answer gap,
  and export.
- Focus indicators are visible.
- Dialogs and overlays trap focus and return focus.
- Status is not communicated by colour alone.
- Error messages are near affected fields.
- Reduced motion is respected globally.
- Screen reader labels do not expose misleading AI confidence or hidden raw
  numbers.

## Motion QA

Required checks:

- User input feedback appears within 100ms.
- Panels, overlays, dialogs, and drawers use consistent timing.
- Matrix rows do not shift height.
- Source proof highlight is restrained and clear.
- Approval stamp settles once.
- Activity pulse happens once, then becomes static.
- Upload/processing motion names real progress.
- Export success does not animate before export is actually possible.
- Reduced motion removes parallax, slide, scale, rotation, shimmer, and trail
  drawing.

## Performance Budget

Motion and richer UI must not make the product feel slower.

Targets:

- Matrix scrolling remains smooth with the largest prebaked tender.
- Source overlay appears promptly after click; if source loading is slow, show a
  named loading state.
- Route-level interactions should not wait on decorative animation.
- Product app motion sequences should finish within 500ms.
- Landing and `/demo` feature sequences should finish within 900ms unless
  scroll-controlled.
- Avoid animating layout properties in dense surfaces.
- Do not add a heavy animation library for basic microinteractions.
- Verify mobile performance before merging Stage 7.

## Visual QA

Check at minimum:

- 375px narrow mobile.
- 768px tablet.
- 1440px desktop.
- Wide desktop.
- Browser zoom at 125 percent.
- Greyscale mode or colour-blind simulation where available.

Visual failure examples:

- Text overlaps during motion.
- Button label clips.
- Row height changes while scanning.
- Nested cards appear.
- Forest colour is decorative instead of functional.
- Status colour is the only state indicator.
- Landing typography scale leaks into dense app surfaces.

## Content QA

Check:

- No raw confidence numbers.
- No hype or unsupported claims.
- No "AI magic" phrasing where source/evidence language is needed.
- `Show source` is used consistently.
- `Tender`, `Matrix`, `Bid`, and `Marks` are consistent.
- Empty, loading, error, success, blocker, and reduced-access states have useful
  next actions.
- Copy follows [../../../copywriting.md](../../../copywriting.md).

## Severity Levels

| Severity | Meaning | Examples |
|---|---|---|
| P0 | Blocks trust, demo, build, or core workflow | Build fails, source proof lies, export implies ready when blocked, schema broken |
| P1 | Serious UX or accessibility regression | Keyboard cannot close source overlay, deal-breaker state unclear, share flow broken |
| P2 | Noticeable quality issue | Motion too slow, mobile spacing awkward, copy inconsistent, activity marker unclear |
| P3 | Polish issue | Minor spacing, small visual inconsistency, low-risk refinement |

P0 and P1 must be fixed before a stage is considered complete.

## QA Bug Template

```text
Title:
Severity:
Stage:
Route:
File/component:
Steps to reproduce:
Expected:
Actual:
Screenshot/video:
Browser/device:
Reduced motion on/off:
Keyboard only?:
Notes:
```

## Stage Sign-Off Template

```text
Stage:
Owner:
Reviewer:
Checks run:
Routes checked:
Desktop/mobile screenshots:
Reduced-motion result:
Keyboard result:
Metrics captured:
P0/P1 issues:
Deferred P2/P3 issues:
Ready for next stage?:
```

## Release QA Checklist

- `npm run lint` passes.
- `npm run build` passes.
- No schema changes without explicit approval.
- Source proof is honest for exact, approximate, and missing matches.
- Matrix states are distinguishable in greyscale.
- Upload and processing states are truthful.
- `/answers` readiness and export blockers are clear.
- Export artifacts separate internal tracking, editable response, and proof/audit
  needs.
- Collaboration is visible at the work item.
- Collaboration edge cases preserve input, attribution, and recovery.
- Reduced motion works across app, landing, and `/demo`.
- Mobile layouts do not overlap or clip text.
- Landing -> `/demo` -> app continuity is visible.
- CODEMAP is regenerated before commit if files were added, moved, or deleted.

## Reporting Cadence

After each stage, record:

- What shipped.
- What metric improved or needs baseline.
- What QA passed.
- P0/P1 issues found and fixed.
- P2/P3 issues deferred.
- Whether the next stage is safe to start.

Keep the report short. The point is to protect momentum, not create ceremony.
