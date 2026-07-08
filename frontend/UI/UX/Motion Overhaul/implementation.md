# Bidframe UX, UI, And Motion Implementation Plan

Local planning draft. Created 2026-07-05. No commit or push has been made.

This is the execution guide for taking Bidframe's multipage app to the next
level. It turns the UX, UI, and motion plans into staged implementation work
that can be shared across Codex, Claude Code, Cursor, and Devin without losing
the product direction.

## Source Of Truth

Read these before implementation work starts:

- [../AGENTS.md](../../../../AGENTS.md): repo rules, data contract, frontend conventions,
  git workflow, and build expectations.
- [../START-HERE.md](../../../../START-HERE.md): repo orientation and current project
  map.
- [../CODEMAP.md](../../../../CODEMAP.md): current code structure and import graph.
- [../STATUS.md](../../../../STATUS.md): live team status.
- [../comms/README.md](../../../../comms/README.md) and the four comms boards: async
  coordination context.
- [AGENTS.md](../../../AGENTS.md): frontend-specific rules, including the Next.js 16
  reminder.

Read these for the actual design direction:

- [UX-OVERHAUL-BRIEF.md](UX-OVERHAUL-BRIEF.md): workflow, IA, collaboration,
  source proof, bid response, marks, and staged UX rollout.
- [UI-IMPROVEMENT-PLAN.md](UI-IMPROVEMENT-PLAN.md): staged UI rollout,
  component priorities, product assumptions, and final UI acceptance checklist.
- [MOTION.md](MOTION.md): app-wide motion tokens, route motion map,
  microinteraction specs, reduced-motion rules, and rollout plan.
- [QA.md](QA.md): success metrics, stage QA gates, route checks,
  accessibility, performance, and release QA.
- [delete.md](delete.md): deletion backlog for removing, merging, demoting, or
  protecting UI and workflow elements.
- [design-language.md](../../../design-language.md): forest-led civic record system.
- [DESIGN-SYSTEM.md](../../../DESIGN-SYSTEM.md): colour, type, layout, status, and motion
  foundations.
- [SLOP-CHECK.md](../../../SLOP-CHECK.md): enforceable visual quality gate.
- [layout.md](../../../layout.md): app layout model.
- [copywriting.md](../../../copywriting.md): approved product language and copy rules.
- [landing-page-brief.md](../../../landing-page-brief.md): landing page rules and
  forest-led public expression.

Reference but do not prioritise:

- [../demo-scrolly-design-pack.md](../../../../demo-scrolly-design-pack.md): older demo
  scrolly direction that can inform Stage 7.
- [../graph-and-verification-deep-plan.md](../../../../graph-and-verification-deep-plan.md):
  deeper source-proof and marks thinking, useful during Stage 3 and Stage 6 if
  it still matches current code.

## Master Pipeline

Implement in this order:

1. UX overhaul stages 1 to 6 from [UX-OVERHAUL-BRIEF.md](UX-OVERHAUL-BRIEF.md).
2. UI rollout stages 1 to 7 from [UI-IMPROVEMENT-PLAN.md](UI-IMPROVEMENT-PLAN.md).
3. Motion from [MOTION.md](MOTION.md) inside each UI stage, not as a final
   decorative pass.
4. QA from [QA.md](QA.md) after every stage, not only at the end.
5. Delete-list checks from [delete.md](delete.md) before each stage, so the team
   removes or simplifies before adding more UI.

Judgment:

The UI and motion plan is large enough to require staged delivery. Do not run a
single "make the app beautiful" task. Every stage should improve a real user
capability and leave the app complete if the next stage slips.

## Five-Principle Stage Gate

Use this before every task, every AI prompt, and every stage review.

1. **Question every requirement.** What user risk does this solve? The strongest
   answers are review speed, source trust, collaboration clarity, export safety,
   and tender orientation.
2. **Delete before adding.** Can an existing control, state, label, or motion be
   removed instead of redesigned?
3. **Simplify before styling.** Can the user understand the next action, state,
   owner, source, and blocker faster?
4. **Accelerate the real workflow.** Does this reduce time to source proof,
   decision, teammate action, gap answer, or export readiness?
5. **Automate last.** Is the manual workflow clear enough to automate safely,
   and does automation preserve human review where needed?

Do not delete trust. Source proof, exact/approx match, audit trail,
collaboration attribution, export blockers, accessibility, and reduced-motion
support are required product substance.

## Measurement And QA Summary

The overhaul should be measured against [QA.md](QA.md), not judged only by
whether it looks better.

Primary success signals:

- Faster time to first source proof.
- Faster time to first meaningful decision.
- Better export blocker comprehension.
- Successful two-account collaboration activation.
- Clearer bid readiness comprehension.
- Higher upload confidence for mixed packs.
- Stronger landing -> `/demo` -> app continuity.

Every stage must end with:

- `npm run lint`.
- `npm run build` if feasible.
- Route checks for the stage's affected surfaces.
- Reduced-motion check.
- Keyboard/focus check for affected interactions.
- Greyscale/state-recognition check where status is involved.
- A short sign-off using the template in [QA.md](QA.md).

Deletion signal:

- Check [delete.md](delete.md) before each stage. If a control, state, label, or
  motion can be removed, merged, demoted, or renamed without hurting trust, do
  that before adding new UI.

## Tool Roles

### Codex

Use Codex as the lead local integrator.

Best for:

- Reading the repo and preserving existing patterns.
- Implementing stages with several connected files.
- Resolving integration issues after other tools touch the code.
- Running local checks.
- Keeping the UX, UI, and motion docs aligned with the code.

Default Codex responsibilities:

- Stage 1: UI foundation and motion tokens.
- Stage 2: workspace header and navigation.
- Stage 3: matrix and source proof.
- Final integration before commit or PR.

### Claude Code

Use Claude Code for focused implementation and review.

Best for:

- Dense component passes.
- Accessibility review.
- Copy and state grammar.
- Bid response, evidence, gaps, export, collaboration, and comments.

Default Claude Code responsibilities:

- Stage 5: bid response and export readiness.
- Stage 6: collaboration presence and audit.
- Review of Stage 3 source proof and keyboard/focus behaviour.

### Cursor

Use Cursor where your eye matters.

Best for:

- Visual tuning while the app is running.
- CSS and microinteraction feel.
- Responsive polish.
- Landing and `/demo` choreography.
- Small scoped edits selected by file or component.

Cursor should not roam the repo. Give it file-scoped prompts and visually review
each change.

### Devin

Use Devin only for isolated, well-specified tickets.

Best for:

- Screenshot and QA reports.
- Stage 4 upload/processing if file ownership is clean.
- Reduced-motion checks.
- Playwright or browser verification tasks.
- Focused implementation where file scope is narrow.

Do not ask Devin to "overhaul the UI." Give Devin one stage slice, exact files,
and a stop condition.

## Branching And Worktree Rules

This overhaul is risky enough for a branch:

```bash
git checkout -b frontend/ux-ui-motion-overhaul
```

If you keep working locally without a branch, be extra strict about file
ownership.

Rules:

- Do not push or commit until the human explicitly asks.
- Do not change the requirement schema.
- Do not edit backend or engine unless a stage explicitly requires a type/API
  adjustment and the team agrees.
- Do not overwrite existing dirty work. Inspect before editing.
- If adding, deleting, or moving files before a real commit, remember that the
  repo rule requires regenerating [../CODEMAP.md](../../../../CODEMAP.md) in that commit.
- Do not use `/showcase` as the main target. It is a walkthrough aid.
- Lock files per stage. Only one tool owns a file at a time.

Current caution:

Upload and processing files already have local changes. Do not start Stage 4
until these are understood:

- `src/components/ProcessingView.tsx`
- `src/components/TendersList.tsx`
- `src/components/UploadDropzone.tsx`
- `src/context/RequirementsContext.tsx`
- `src/lib/api.ts`
- `src/components/ProcessingView.module.css`
- `src/components/RegisterPreview.module.css`
- `src/components/RegisterPreview.tsx`

## Reusable Base Prompt

Use this at the top of every AI coding prompt.

```text
You are working in the Bidframe repo.

Read and follow:
- AGENTS.md
- START-HERE.md
- CODEMAP.md
- STATUS.md
- comms/README.md and all four comms boards
- frontend/AGENTS.md
- frontend/UI/UX/Motion Overhaul/UX-OVERHAUL-BRIEF.md
- frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md
- frontend/UI/UX/Motion Overhaul/MOTION.md
- frontend/UI/UX/Motion Overhaul/QA.md
- frontend/UI/UX/Motion Overhaul/delete.md
- frontend/design-language.md
- frontend/DESIGN-SYSTEM.md
- frontend/SLOP-CHECK.md
- frontend/layout.md
- frontend/copywriting.md

Implement only the stage named below. Stay in frontend unless the prompt
explicitly says otherwise. Do not change the requirement schema. Do not push or
commit. Preserve unrelated worktree changes. If you find dirty changes in files
you need to edit, inspect them and work with them instead of reverting them.

Use existing components, tokens, and repo patterns. Motion must follow
frontend/UI/UX/Motion Overhaul/MOTION.md. Forest motion guides arrival, processing, collaboration, and
success. Record motion proves source, approval, audit, marks, and export states.
Serious review surfaces stay quiet.

Apply the Five-Principle Stage Gate before editing: question the requirement,
delete what is unnecessary, simplify before styling, accelerate the real
workflow, and automate only after the manual flow is clear. Do not delete
trust-critical proof, audit, collaboration, accessibility, or reduced-motion
support.

Use frontend/UI/UX/Motion Overhaul/QA.md for success metrics and stage QA. Each
stage should finish with the relevant QA gate, not just code changes.
Check frontend/UI/UX/Motion Overhaul/delete.md before adding new UI so deletion,
merge, demotion, or rename candidates are handled first.

After implementation, run the relevant checks if possible, report changed files,
tests/checks run, risks, and any follow-up work.
```

## Stage 0: Preflight And Baseline

Purpose:

Create a clean implementation baseline before code changes begin.

Owner:

- Codex or Devin.

Scope:

- Confirm current branch and dirty worktree.
- Read the source-of-truth docs.
- Confirm local dependencies are installed.
- Capture screenshots for `/upload`, `/review`, `/answers`, `/graph`, `/teams`,
  `/`, `/demo`, and `/pack` if a dev server can run.
- Record current lint/build status.
- Identify file ownership for Stage 1 and Stage 2.

Prompt:

```text
Use the reusable base prompt.

Stage: Preflight and baseline.

Do not edit files. Inspect the current frontend state, dirty worktree, and
source-of-truth docs. Produce a short baseline report:
- current branch
- dirty files grouped by likely owner
- relevant frontend routes
- existing motion/style tokens in globals.css
- whether npm run lint and npm run build can run
- screenshot checklist for desktop and mobile
- files that must not be touched without human confirmation

Stop after the report.
```

Done when:

- The team knows what is dirty.
- The first implementation stage has a safe file list.
- The baseline route list is clear.

## Stage 1: UI Foundation And Motion Tokens

Source:

- [UI Stage 1](UI-IMPROVEMENT-PLAN.md#stage-1-ui-foundation-and-motion-tokens)
- [MOTION.md](MOTION.md)

Primary owner:

- Codex.

Reviewer:

- Claude Code for accessibility and focus behaviour.

Likely files:

- `src/app/globals.css`
- `src/components/AppMain.tsx`
- `src/components/SiteHeader.tsx`
- `src/components/DocumentHeader.tsx`
- `src/components/SourceVerifyOverlay.tsx`
- `src/components/ShareControl.tsx`
- `src/components/CommentThread.tsx`
- `src/components/RequirementDrawer.tsx`

Implementation prompt:

```text
Use the reusable base prompt.

Stage: UI Stage 1, foundation and motion tokens.

Implement only Stage 1 from frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md.

Goals:
- Add motion duration and easing tokens from frontend/UI/UX/Motion Overhaul/MOTION.md.
- Add global reduced-motion handling.
- Standardise common press, focus, active, disabled, loading, and saved states.
- Check source overlay, share dialog, comment thread, and drawers for focus
  return and keyboard escape.

Constraints:
- No large layout changes.
- No landing or /demo choreography.
- No new collaboration behaviour.
- No decorative forest animation.
- Do not change schema, API, backend, or data files.

Verification:
- npm run lint
- npm run build if feasible
- Manual or code inspection for reduced motion and focus return

Report:
- changed files
- tokens added
- components touched
- checks run
- unresolved risks
```

Cursor polish prompt:

```text
Only edit files already touched in Stage 1. Tune interaction states for
professional feel according to frontend/UI/UX/Motion Overhaul/MOTION.md. Do not alter layout, data
logic, API calls, or copy. Preserve reduced-motion behaviour.
```

Done when:

- Controls respond immediately.
- Reduced motion does not break the app.
- Core overlays and dialogs can be used by keyboard.
- No work surface gained decorative motion.

## Stage 2: Workspace Header And Navigation

Source:

- [UI Stage 2](UI-IMPROVEMENT-PLAN.md#stage-2-workspace-header-and-navigation)
- [UX Stage 1](UX-OVERHAUL-BRIEF.md#stage-1-workspace-orientation)

Primary owner:

- Codex.

Reviewer:

- Cursor for visual hierarchy.

Likely files:

- `src/components/SiteHeader.tsx`
- `src/components/SectionNav.tsx`
- `src/components/DocumentHeader.tsx`
- `src/components/ControlPanel.tsx`
- `src/components/ShareControl.tsx`
- `src/components/ActivityFeed.tsx`
- `src/lib/collaborators.ts`

Implementation prompt:

```text
Use the reusable base prompt.

Stage: UI Stage 2, workspace header and navigation.

Implement only Stage 2 from frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md.

Goals:
- Make the loaded tender, current view, source-pack count, people/access, and
  next useful action visible or one click away.
- Align navigation around Tender, Matrix, Bid, and Marks.
- Make active route state visible in greyscale.
- Replace generic Next actions with contextual action text where the current
  data supports it.
- Keep Teams as utility/admin while making collaboration visible in the
  workspace header.

Motion:
- Active nav rule or state changes in 120ms to 180ms.
- Primary action has immediate press/loading feedback.
- New activity or member change gets one restrained moss/forest pulse only if
  backed by real data.

Constraints:
- Do not redesign matrix rows.
- Do not build a new role picker.
- Do not fake presence.
- Do not touch landing, /demo, /showcase, backend, or schema.

Verification:
- desktop and narrow view check
- greyscale active route check
- npm run lint
- npm run build if feasible

Report changed files, checks, screenshots if available, and risks.
```

Cursor polish prompt:

```text
Only edit the workspace header/navigation files from Stage 2. Improve hierarchy,
spacing, active state, and responsive fit. Do not change route logic, API calls,
or labels outside Tender, Matrix, Bid, Marks, Share tender, Activity, and the
contextual primary action.
```

Done when:

- A client can identify the tender, view, team access, and next action in five
  seconds.
- Header motion is subtle and does not compete with the matrix.

## Stage 3: Matrix Review And Source Proof

Source:

- [UI Stage 3](UI-IMPROVEMENT-PLAN.md#stage-3-matrix-review-and-source-proof)
- [UX Stage 2](UX-OVERHAUL-BRIEF.md#stage-2-matrix-review-flow)
- [UX Stage 3](UX-OVERHAUL-BRIEF.md#stage-3-source-proof-loop)
- [MOTION source proof](MOTION.md#requirement-panel-and-source-proof)

Primary owner:

- Codex.

Reviewer:

- Claude Code for accessibility, source-proof truthfulness, and focus handling.
- Cursor for final visual tuning.

Likely files:

- `src/components/MatrixView.tsx`
- `src/components/ComplianceMatrix.tsx`
- `src/components/GatingHero.tsx`
- `src/components/RequirementPanel.tsx`
- `src/components/RequirementDrawer.tsx`
- `src/components/RequirementSpine.tsx`
- `src/components/SourceVerifyOverlay.tsx`
- `src/components/PdfSourceView.tsx`
- `src/components/DocxSourceView.tsx`
- `src/components/SheetSourceView.tsx`
- `src/components/ApprovalStamp.tsx`
- `src/components/ConfidenceIndicator.tsx`

Implementation prompt:

```text
Use the reusable base prompt.

Stage: UI Stage 3, matrix review and source proof.

Implement only Stage 3 from frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md.

Goals:
- Strengthen matrix state grammar for deal-breaker, low confidence, needs
  input, approved, flagged, commented, owner/actor, exact source, approximate
  source, and missing source.
- Make Show source a consistent first-class affordance.
- Refine RequirementPanel into a focused working sheet.
- Keep exact and approximate source proof honest and visually distinct.
- Add or tune approval stamp and flagging treatment with audit context.

Motion:
- Row hover/focus under 120ms.
- Source overlay entry 180ms to 240ms.
- Exact/approx highlight uses record motion.
- Approval stamp settles once.
- No forest motion in source proof.
- No row height or column width animation.

Constraints:
- Do not rework /answers.
- Do not change source matching logic unless strictly necessary for UI state.
- Do not use raw confidence numbers.
- Do not reduce row scan density.
- Do not touch backend or schema.

Verification:
- greyscale state recognition
- keyboard open/close source overlay and return focus
- source exact/approx/no-match state check
- npm run lint
- npm run build if feasible

Report changed files, checks, and any ambiguous source-proof cases.
```

Claude review prompt:

```text
Review Stage 3 only. Focus on source-proof honesty, keyboard/focus behaviour,
accessibility names, greyscale state recognition, and whether any motion feels
decorative in serious proof surfaces. Do not refactor unrelated code. Return
findings with file references and suggested minimal fixes.
```

Done when:

- The matrix is clearer without feeling like a dashboard.
- Source proof is obvious and honest.
- Approval/flagging feels official.

## Stage 4: Tender Intake And Processing

Source:

- [UI Stage 4](UI-IMPROVEMENT-PLAN.md#stage-4-tender-intake-and-processing)
- [MOTION upload](MOTION.md#upload-and-tender-library)

Primary owner:

- Codex or Devin, but only after dirty upload files are understood.

Reviewer:

- Cursor for visual fit.

Likely files:

- `src/components/UploadDropzone.tsx`
- `src/components/ProcessingView.tsx`
- `src/components/TendersList.tsx`
- `src/components/NoTenderLoaded.tsx`
- `src/components/RegisterPreview.tsx`
- `src/context/RequirementsContext.tsx`
- `src/lib/source-doc.ts`

Implementation prompt:

```text
Use the reusable base prompt.

Stage: UI Stage 4, tender intake and processing.

Before editing, inspect existing dirty changes in upload and processing files.
If they conflict or appear unfinished, stop and report.

Goals:
- Make /upload read as Tender library plus tender-pack intake.
- Show per-file staged rows with format badge, name, size, remove action, and
  accepted/rejected state.
- Improve ProcessingView into a file-to-register progress story.
- Use backend per-file progress if available, but do not invent fake progress.
- Add clear success actions: Open matrix, Review deal-breakers, Open bid.
- Improve NoTenderLoaded as a recovery state.

Motion:
- Dropzone hover/focus gets forest guidance.
- File accepted/rejected feedback is immediate.
- Processing advances through document stages with forest-guided motion.
- Success resolves into the record/register.
- Errors stop motion and show recovery.

Constraints:
- Do not touch matrix, answers, landing, /demo, backend, or schema.
- Do not overwrite existing dirty work.
- Do not fake per-file progress if the data is absent.

Verification:
- loose files and ZIP pack UI states
- unsupported file error
- mobile upload layout
- reduced motion
- npm run lint
- npm run build if feasible

Report changed files, dirty-file decisions, checks, and any backend-data gaps.
```

Devin ticket prompt:

```text
Branch or local task: frontend-ui-stage-4-upload-processing.

Implement Stage 4 only from frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md.
Scope is limited to UploadDropzone, ProcessingView, TendersList, NoTenderLoaded,
RegisterPreview, RequirementsContext only if needed, and source-doc helpers only
if needed.

Stop immediately if existing local changes conflict. Do not edit matrix,
answers, landing, demo, backend, engine, schema, or API contracts.

Use MOTION.md for dropzone/file/progress/success/error microinteractions.
Run npm run lint and npm run build if feasible. Provide desktop and mobile
screenshots if possible. Report changed files and any risks.
```

Done when:

- Upload clearly handles tender packs.
- Processing tells the truth about what is happening.
- Success points into the workflow.

## Stage 5: Bid Response And Export Readiness

Source:

- [UI Stage 5](UI-IMPROVEMENT-PLAN.md#stage-5-bid-response-and-export-readiness)
- [UX Stage 5](UX-OVERHAUL-BRIEF.md#stage-5-bid-response-workflow)
- [MOTION bid response](MOTION.md#bid-response-and-answers)

Primary owner:

- Claude Code.

Integrator:

- Codex.

Likely files:

- `src/components/AnswersBody.tsx`
- `src/components/AnswerWorkspace.tsx`
- `src/components/AnswerCard.tsx`
- `src/components/AnswerPanel.tsx`
- `src/components/AnswerFilterBar.tsx`
- `src/components/ReadinessLedger.tsx`
- `src/components/GapInterview.tsx`
- `src/components/CapabilityUpload.tsx`
- `src/components/EvidenceLibrary.tsx`
- `src/components/AutofillButton.tsx`
- `src/components/ExportMenu.tsx`

Implementation prompt:

```text
Use the reusable base prompt.

Stage: UI Stage 5, bid response and export readiness.

Implement only Stage 5 from frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md.

Goals:
- Make /answers feel like Bid or Bid response, not a second matrix.
- Lead with a readiness ledger that guides work.
- Group answer cards by needs input, needs review, backed by evidence, and ready.
- Make evidence references feel pressed into the record.
- Make gap questions calm and form-like.
- Make export blockers visible before export starts.
- Separate export artifact types:
  - Compliance Matrix for internal tracking, XLSX first, CSV fallback.
  - Bid Response Draft for editable response work, DOCX first.
  - Audit/Evidence Pack for internal proof trail, PDF or DOCX appendix.
- Keep client-ready output clean and internal proof output detailed.
- Never hide unresolved gaps or uncertainty in exported artifacts.

Motion:
- Ledger updates with record-style settle.
- Evidence upload and backs N updates give feedback.
- Gap answered state saves and updates counts once.
- Export blocker list appears immediately.
- Export start uses filed-page or sheet-gather motion, never celebration before
  readiness.

Constraints:
- Do not change answer-generation logic.
- Do not add assignment to every gap.
- Do not touch matrix, upload, landing, demo, backend, or schema.

Verification:
- evidence-backed answer state
- gap answered state
- export blocked state
- export ready state
- export artifact menu with Compliance Matrix, Bid Response Draft, Audit/Evidence
  Pack, and All Files if supported
- exported artifact honesty for unresolved gaps and evidence refs
- keyboard access to forms and export menu
- npm run lint
- npm run build if feasible

Report changed files, checks, and any copy or state questions.
```

Codex integration prompt:

```text
Review and integrate the Stage 5 changes. Check consistency with the workspace
header, matrix state grammar, MOTION.md, copywriting.md, and SLOP-CHECK.md.
Fix only integration issues. Do not broaden scope.
```

Done when:

- The user can see what is drafted, evidenced, missing, and blocking export.
- Export readiness feels trustworthy.

## Stage 6: Collaboration Presence And Audit

Source:

- [UI Stage 6](UI-IMPROVEMENT-PLAN.md#stage-6-collaboration-presence-and-audit)
- [UX Stage 4](UX-OVERHAUL-BRIEF.md#stage-4-collaboration-at-the-work-item)
- [MOTION collaboration](MOTION.md#collaboration)

Primary owner:

- Claude Code or Devin for isolated pieces.

Integrator:

- Codex.

Likely files:

- `src/components/ShareControl.tsx`
- `src/components/ActivityFeed.tsx`
- `src/components/CommentThread.tsx`
- `src/components/TeamsManager.tsx`
- `src/components/ComplianceMatrix.tsx`
- `src/components/RequirementPanel.tsx`
- `src/components/AnswerCard.tsx`
- `src/lib/collaborators.ts`

Implementation prompt:

```text
Use the reusable base prompt.

Stage: UI Stage 6, collaboration presence and audit.

Implement only Stage 6 from frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md.

Goals:
- Show teammate decisions, comments, and ownership at rows/cards/panels.
- Polish ShareControl as a focused dialog with success/error states.
- Make ActivityFeed read as audit trail: actor, action, object, time.
- Keep comments tied to requirement, answer, source excerpt, or gap.
- Use Owner and Member labels first.
- Add blocker-comment treatment only where it directly blocks approval, answer
  completion, or export.
- Add explicit collaboration edge states for failed/pending/expired invites,
  permission changes, simultaneous decisions, reconnecting activity, unknown or
  former actors, long names, many collaborators, and blocker comments before
  export.

Motion:
- Real new activity gets one moss pulse, then becomes static record.
- Comment posted inserts and settles once.
- Member added appears once, then rests.
- Do not imply live presence unless backed by realtime data.
- Do not animate stale activity after reconnect as if it just happened.
- Permission loss, invite failure, and conflict warnings should stay still and
  close to the relevant control.

Constraints:
- No fake typing indicators.
- No fake presence.
- No complex permissions redesign.
- No generic chat UI.
- Do not touch backend or schema unless a missing field makes the stage
  impossible, in which case stop and report.

Verification:
- solo mode
- shared tender mode if available
- comment posting
- activity event display
- failed invite
- already accepted invite if possible
- lost permission or view-only state
- simultaneous decision/conflict simulation
- reconnecting or stale activity state
- former or unknown actor attribution
- many collaborators and long names
- export blocked by blocker comment
- greyscale collaboration markers
- keyboard and screen reader labels
- npm run lint
- npm run build if feasible

Report changed files, checks, and any data assumptions.
```

Devin isolated ticket prompt:

```text
Implement one isolated Stage 6 slice only: ActivityFeed audit-trail polish.
Do not edit ShareControl, TeamsManager, matrix, answers, backend, or schema.
Use existing data and collaborators helpers. Follow MOTION.md for one-time
activity pulse and reduced-motion fallback. Run lint/build if feasible and
report screenshots or state examples.
```

Done when:

- Teamwork is visible at the work item.
- Activity reads as record evidence, not chat noise.

## Stage 7: Forest-Led Continuity, Landing, And `/demo`

Source:

- [UI Stage 7](UI-IMPROVEMENT-PLAN.md#stage-7-forest-led-continuity-landing-and-demo)
- [MOTION landing](MOTION.md#landing-page)
- [MOTION demo](MOTION.md#demo)
- [landing-page-brief.md](../../../landing-page-brief.md)

Primary owner:

- Cursor plus Codex.

Reviewer:

- Human visual review.

Likely files:

- `src/components/landing/Landing.tsx`
- `src/components/landing/ForestHeroLayers.tsx`
- `src/components/landing/HeroResolve.tsx`
- `src/components/landing/ProductShots.tsx`
- `src/components/landing/ProofScrolly.tsx`
- `src/components/landing/BookDemoButton.tsx`
- `src/components/landing/ClosingArrival.tsx`
- `src/components/DemoView.tsx`
- `src/components/demo/DemoScrolly.tsx`
- `src/components/demo/ScrollyStage.tsx`
- `src/components/demo/steps.ts`
- `src/components/demo/useScrollTimeline.ts`
- `src/components/MatrixView.tsx`

Implementation prompt:

```text
Use the reusable base prompt.

Stage: UI Stage 7, forest-led continuity, landing, and /demo.

Implement only Stage 7 from frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md.

Goals:
- Make landing -> /demo -> app feel like one Bidframe product.
- Tune landing motion and microinteractions against the forest-led civic record
  language.
- Tune /demo scrolly choreography so it teaches real app interactions: upload,
  deal-breaker, source proof, collaboration, marks, and export.
- Ensure landing product shots and /demo proof moments use the same state
  grammar as the app.
- Confirm /showcase is not treated as the main product target.

Motion:
- Forest motion carries arrival, guidance, processing, collaboration, and
  success.
- Record motion carries source proof, approval, marks, audit, and export.
- Landing and /demo can be more choreographed than the app, but source proof and
  decision states remain disciplined.
- Reduced-motion mode leaves landing and /demo polished and static.

Constraints:
- No new pitch mechanics.
- Do not restyle /showcase as a primary product surface.
- Do not create a prettier fake product in /demo than the app can support.
- Do not animate proof numbers unless landing-page-brief.md is updated to allow
  it.

Verification:
- desktop and mobile landing
- desktop and mobile /demo
- reduced-motion landing and /demo
- no text overlap during motion
- product shot readability
- source-proof consistency with app
- npm run lint
- npm run build if feasible

Report changed files, screenshots, checks, and visual risks.
```

Cursor visual prompt:

```text
Focus only on Stage 7 visual and motion feel. Keep the app/product truth intact.
Tune landing and /demo so forest motion guides arrival and momentum, while
source proof, approval, marks, audit, and export remain record-disciplined.
Do not change backend, schema, live data logic, /showcase, or pitch mechanics.
```

Done when:

- A prospect recognises the same product across landing, `/demo`, and app.
- `/demo` makes the multipage app easier to understand.
- Reduced motion still feels polished.

## Stage Review Prompt

Use after every stage, preferably with a tool that did not implement the stage.

```text
Review the completed stage against:
- frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md
- frontend/UI/UX/Motion Overhaul/MOTION.md
- frontend/design-language.md
- frontend/DESIGN-SYSTEM.md
- frontend/SLOP-CHECK.md
- frontend/copywriting.md

Focus on bugs, regressions, accessibility gaps, motion discipline, visual
consistency, and scope creep. Lead with findings ordered by severity. Include
file references. If there are no major issues, say so clearly and list residual
risks or test gaps.
```

## Quality Gates

Use [QA.md](QA.md) as the full QA source of truth. Run after each stage:

```bash
cd frontend
npm run lint
npm run build
```

Manual checks:

- Desktop route check.
- Mobile route check.
- Reduced-motion check.
- Keyboard-only check.
- Greyscale state recognition.
- Source overlay focus return.
- Share dialog focus trap.
- Comment thread submit and recovery.
- Export blocked and export-ready states.
- No raw confidence numbers.
- No decorative motion on proof surfaces.
- No text overlap during motion.
- Stage sign-off template from [QA.md](QA.md).

Browser route checklist:

- `/upload`
- `/review`
- `/answers`
- `/graph`
- `/teams`
- `/`
- `/demo`
- `/pack`

Do not treat `/showcase` as the target, but make sure shared component changes
do not break it.

## File Ownership Guide

High-conflict files:

- `src/app/globals.css`
- `src/components/DocumentHeader.tsx`
- `src/components/SectionNav.tsx`
- `src/components/MatrixView.tsx`
- `src/components/ComplianceMatrix.tsx`
- `src/components/RequirementPanel.tsx`
- `src/components/SourceVerifyOverlay.tsx`
- `src/components/UploadDropzone.tsx`
- `src/components/ProcessingView.tsx`
- `src/context/RequirementsContext.tsx`
- `src/lib/api.ts`
- `src/components/DemoView.tsx`
- `src/components/landing/*`

Rule:

One tool owns a high-conflict file at a time. If another tool needs it, stop and
integrate first.

## Stage Handoff Template

Every AI tool should finish with this format:

```text
Stage:
Owner/tool:
Changed files:
What changed:
Motion added or changed:
Accessibility notes:
Checks run:
Screenshots captured:
Known risks:
Follow-up recommendations:
Files another tool should not touch until integrated:
```

## Release Readiness Checklist

The overhaul is ready to merge or ship when:

- UX stages 1 to 6 are implemented or consciously deferred.
- UI stages 1 to 7 are implemented or consciously deferred.
- Motion tokens and reduced-motion handling exist.
- Landing, `/demo`, and app feel connected.
- Matrix and source proof remain serious and trustworthy.
- Upload and processing feel transparent.
- `/answers` clearly shows readiness, evidence, gaps, and export blockers.
- Collaboration is visible at the work item.
- Collaboration edge cases preserve input, attribution, and recovery.
- Marks still works before award criteria exist.
- `npm run lint` passes.
- `npm run build` passes.
- Desktop and mobile visual QA are complete.
- Reduced-motion QA is complete.
- Keyboard QA is complete.
- No schema changes were made without explicit approval.
- CODEMAP is regenerated before commit if files were added, moved, or deleted.

## Final Judgment

The upgrade should make Bidframe feel more directed, more alive, more
collaborative, and more trustworthy. Forest motion and visual warmth should make
the product feel guided. Civic record structure should make the product feel
solid enough for real tender work. When those two goals conflict, proof wins.
