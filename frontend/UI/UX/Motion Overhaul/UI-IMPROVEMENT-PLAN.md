# Bidframe App UI Improvement Plan

Local planning draft. Created 2026-07-05. No commit or push has been made.

This plan sits under [UX-OVERHAUL-BRIEF.md](UX-OVERHAUL-BRIEF.md). The product
recommendation stays the same: UX first, UI second, roughly a 75/25 split. That
means this is not a full visual overhaul. It is a focused UI pass that makes the
UX overhaul legible, credible, and easier to demo while moving Bidframe toward
the forest-led civic record system.

## Skills Applied

- `ui-ux-pro-max`: used for accessibility, touch targets, navigation clarity,
  state feedback, data density, and interaction quality checks.
- `design-rationale`: used to make the major UI decisions explainable through
  user needs, business goals, trade-offs, and validation criteria.
- `motion-system`: used to turn motion into a tokenised product layer rather
  than one-off animation flourishes.
- `animation-principles`: used for timing, easing, choreography, interruption,
  and reduced-motion discipline.
- `micro-interaction-spec`: used to specify triggers, rules, feedback, loops,
  and accessibility for the small interactions that make the app feel alive.
- Existing Bidframe design docs: [DESIGN-SYSTEM.md](../../../DESIGN-SYSTEM.md),
  [design-language.md](../../../design-language.md), and
  [SLOP-CHECK.md](../../../SLOP-CHECK.md).

## UI Goal

Make the app read as one trustworthy tender record, not a set of adjacent tools.

The user should be able to answer these questions in five seconds on every core
screen:

1. Which tender am I working on?
2. Where am I in the workflow?
3. What needs my attention next?
4. What evidence/source backs this?
5. Who else has seen, edited, or commented on it?

## Sequencing Recommendation

Do the UX overhaul first without waiting for the UI pass.

The UX pass should focus on structure and behaviour:

- route labels and navigation hierarchy
- current tender clarity
- next-action logic
- source-proof access
- collaboration placement
- empty/loading/error states
- workflow copy
- row, card, and panel state meaning

During that UX pass, keep visual changes deliberately small. Reuse existing
tokens and components, fix obvious hierarchy problems, and avoid introducing new
forest-led surfaces before the updated design-language guidelines settle.

Then run this UI improvement plan as the second pass. That pass is where
Bidframe moves further into the forest-led civic record style: forest for
guidance, upload/processing, collaboration presence, demo continuity, and
primary action; record discipline for matrix review, source proof, evidence,
approval, audit trail, marks, and export.

Recommended delivery pipeline:

1. UX overhaul stages 1 to 6 from [UX-OVERHAUL-BRIEF.md](UX-OVERHAUL-BRIEF.md).
2. UI rollout stages 1 to 7 in this document.
3. [MOTION.md](MOTION.md) implemented inside those UI stages, not after them.

The judgment call: motion is now too important to leave as a final polish pass.
It affects perceived responsiveness, upload confidence, collaboration, source
proof, approval, export, and the landing/demo continuity. Each UI stage below
therefore includes the motion work needed for that surface to feel complete.

## Product Assumptions Carried Forward

These answer the UX open questions and should shape the UI pass.

1. `Teams` stays a utility/admin route. The loaded-tender workspace should still
   show a compact `People` or `Access` area in the header so sharing, members,
   and activity are visible at the point of work.
2. Permissions should start with `Owner` and `Member`. Do not expose a heavy
   role picker until customer usage proves it is needed. The UI can reserve
   space for future labels such as `Can edit`, `Can comment`, and `View only`,
   but the first shipped treatment should not imply controls that do not exist.
3. Comments are conversational by default and tied to the object they discuss.
   A later `Mark as blocking` state can exist for comments that genuinely stop
   export or approval, but the first pass should not turn every comment into a
   task system.
4. Open questions in `/answers` do not all need assignment on day one. Start
   with clear gap ownership by context, comments, mentions, and activity. Add
   explicit assignment only for requirements or gaps where the team workflow
   really benefits from it.
5. `Marks` should remain accessible before award criteria are detected. The
   fallback should be honest: show deal-breakers, source-pack structure,
   dependencies, and a clear `No published award criteria found yet` state
   rather than hiding the page.
6. Motion is now part of the UI system. Forest motion should guide arrival,
   progress, collaboration, and success. Record motion should prove source,
   approval, audit, and export states. Serious review surfaces stay quiet.
   The detailed source of truth is [MOTION.md](MOTION.md).

## Non-Goals

- Do not redesign the brand from scratch. Adjust it: forest is the
  brand/emotional layer, Civic Record is the proof/work-surface layer, and warm
  paper connects them.
- Do not restyle `/showcase`. That surface is a single-page walkthrough aid.
- Do not lead with the public landing page, `/pitch`, `/faq`, or `/thank-you`.
  Landing and `/demo` belong in the final continuity stage after the app
  surfaces are stable.
- Do not build a generic SaaS dashboard with stat cards, a persistent left rail,
  or decorative gradients.
- Do not change the requirement schema.
- Do not introduce raw confidence numbers.
- Do not add a new colour system. Extend semantic usage only if the existing
  tokens cannot carry the job.

## Design Guardrails

- One primary action per screen.
- Signal colours only carry status, confidence, source traceability, or risk.
- Colour is never the only state indicator. Use words, icons, fill levels, rule
  weight, and layout.
- Forest must have a job: first impression, guidance, primary action, upload
  resolve, live collaboration, or demo momentum. It should not become green
  decoration sprayed across every component.
- Dense is acceptable. This is a document workflow, not a marketing page.
- Depth means focus. Only the active sheet, important callout, or worked surface
  should lift.
- Use real document metadata wherever possible: tender title, source filename,
  clause, page, requirement id, team member, timestamp.
- Collaboration should feel like part of the tender record, not a separate chat
  app bolted onto the side.

## Five-Principle UI Gate

Every UI stage should pass this filter before implementation and again before
review.

| Principle | Bidframe translation | What to delete or protect |
|---|---|---|
| Question every requirement | Which user risk does this visual or component change reduce? | Delete changes that only make the app look busier. Protect source proof, auditability, collaboration clarity, and export safety. |
| Delete delete delete | Remove UI that does not support review, proof, collaboration, or export. | Delete duplicate CTAs, vague badges, unused panels, decorative status, over-explained copy, and motion that does not clarify state. |
| Simplify | Make the next action, source action, state meaning, and ownership easier to understand. | Prefer one primary action, consistent labels, consistent `Show source`, fewer state variants, and calmer grouping. |
| Accelerate | Make the user move faster through the work without hiding risk. | Reduce clicks to source proof, approval, commenting, gap answering, and export blockers. Do not speed past deal-breakers. |
| Automate | Automate repeated support work only after the manual flow is clear. | Good later automation: next item routing, evidence matching, gap grouping, export readiness, and teammate nudges. Bad automation: pretending legal review is done. |

Use this as a stage gate, not a reason to flatten the product. Bidframe needs
some serious complexity because it sells trust. The goal is not fewer things at
all costs; it is fewer things that do not earn their place.

## Measurement And QA Summary

Use [QA.md](QA.md) as the measurement and QA layer for the UI rollout.
Use [delete.md](delete.md) as the deletion backlog before adding new surfaces or
controls.

Primary UI success signals:

- Users can identify the tender, route, team state, and next action in five
  seconds.
- Matrix states are distinguishable in greyscale.
- `Show source` is found and used without coaching.
- Upload/processing state is understandable for mixed packs.
- `/answers` clearly separates gaps, evidence, drafts, readiness, and export
  blockers.
- Collaboration appears at the work item, not only in `/teams`.
- Landing, `/demo`, and app feel like one product.

Every UI stage should include:

- Visual QA at mobile, tablet, desktop, and wide desktop.
- State QA for default, hover, focus, active, disabled, loading, empty, error,
  and success.
- Accessibility QA for labels, focus, keyboard, status meaning, and reduced
  motion.
- Motion QA for timing, interruption, and no decorative movement on proof
  surfaces.
- Performance check for matrix scanning, source overlay, and route load.

## 75/25 UI Strategy

The UI work should concentrate on six layers:

1. Orientation: a stronger persistent tender header and clearer view state.
2. State grammar: one consistent visual language for risk, confidence, approval,
   gaps, comments, ownership, and source proof.
3. Source proof: make `Show source` look and behave like a first-class product
   affordance everywhere it appears.
4. Collaboration: surface people, comments, assignments, and activity at the
   decision point.
5. Feeling and continuity: bring the forest-led brand world into app chrome,
   upload/processing, collaboration presence, and primary action without
   weakening the record surfaces.
6. Polish: motion, focus states, empty states, and copy refinements after the
   workflow is clear.

## Screen-by-Screen Plan

### 1. Shared App Shell

Routes:

- `/upload`
- `/review`
- `/answers`
- `/graph`
- `/teams`

Primary files:

- `src/components/SiteHeader.tsx`
- `src/components/SectionNav.tsx`
- `src/components/DocumentHeader.tsx`
- `src/components/ControlPanel.tsx`
- `src/components/ShareControl.tsx`
- `src/components/AppMain.tsx`

UI treatment:

- Turn the top of the app into a clearer Tender Workspace Header without making
  it visually heavy.
- Left zone: `BIDFRAME`, tender title, tender id, source pack count.
- Centre zone: workflow navigation with labels `Tender`, `Matrix`, `Bid`,
  `Marks`.
- Right zone: people strip, `Share tender`, `Activity`, and one primary next
  action.
- Use a 2px rule or active underline plus label weight for the active view. Do
  not rely on colour alone.
- Let the header carry a controlled forest-led sense of guidance: primary action,
  share/activity, and live people can feel current and warm, while tender refs
  and status remain in the record voice.
- Keep the header compact enough that the matrix still feels like the main
  object, not buried under chrome.

Button and label changes:

- Replace generic `Next` copy with contextual actions:
  - `Review next deal-breaker`
  - `Answer next gap`
  - `Approve next draft`
  - `Export`
- `Share` becomes `Share tender` when a tender is loaded.
- Add an `Activity` control beside share, showing a quiet count if there are new
  comments or updates.

Acceptance criteria:

- On any app page, a client can identify the tender, current view, unresolved
  work, and sharing status without opening another panel.
- The active route is legible in greyscale.
- The header does not introduce a persistent left rail or dashboard layout.

### 2. Tender Library and Upload

Routes:

- `/upload`
- `/tenders`

Primary files:

- `src/components/UploadDropzone.tsx`
- `src/components/ProcessingView.tsx`
- `src/components/TendersList.tsx`
- `src/components/NoTenderLoaded.tsx`
- `src/context/RequirementsContext.tsx`

UI treatment:

- Make `/upload` read as `Tender library`, not just an upload form.
- Add a current tender strip when a tender is loaded.
- The current tender strip should show title, uploaded date, source doc count,
  requirement count, deal-breaker count, and people/shared state.
- Use a single raised sheet for the upload zone. This is one of the places where
  paper grain and depth can be earned.
- Group tender cards by `Current`, `Shared with me`, `Uploaded by me`, and
  `Samples` when relevant.
- Processing states should show progress as the document becoming a register:
  file received, text extracted, requirements found, matrix ready.

Button and feature changes:

- After upload completes, primary action is `Open matrix`.
- Secondary actions are `Draft bid` and `Share tender`.
- `NoTenderLoaded` should offer `Pick a tender` plus recent tenders, not only
  upload.
- Processing failures should offer `Try again` and `Upload a different file`.

Acceptance criteria:

- A user never wonders whether they are looking at sample data, an old tender,
  or the tender they just uploaded.
- Upload progress gives useful work state, not just a spinner.
- Empty and error states preserve momentum.

### 3. Matrix Command Centre

Route:

- `/review`

Primary files:

- `src/components/MatrixView.tsx`
- `src/components/ComplianceMatrix.tsx`
- `src/components/GatingHero.tsx`
- `src/components/RequirementPanel.tsx`
- `src/components/ControlPanel.tsx`
- `src/components/CommentThread.tsx`
- `src/components/ActivityFeed.tsx`

UI treatment:

- Keep the matrix as a contents page, not a spreadsheet clone.
- Add or strengthen the real clause/reference margin using `source_clause`,
  `source_page`, or requirement id.
- Give deal-breakers a heavier reading edge and slightly stronger row rhythm.
- Needs-review rows should show hesitation through status word, confidence dot,
  and row affordance, not colour alone.
- Approved rows should settle into a forest tick or approval stamp treatment,
  with a short audit line when selected.
- Rows with comments or assignments should show a quiet collaboration marker at
  the row end.
- When a row is selected, the matrix spine should retain enough context to move
  through the worklist quickly.

Button and feature changes:

- `Show source` should be consistently available from the selected row and
  panel.
- `Approve` appears inline only for confident, non-gating items.
- Gating rows open the panel first. Do not expose one-click approval for them.
- Add or clarify row-level actions: `Comment`, `Assign`, `Flag`, `Show source`.
- Bulk action copy should describe the scope, for example `Approve 12 confident
  non-gating drafts`.

Acceptance criteria:

- Gating items stand out before the user reads the text.
- Confidence is visible as a glanceable signal, never as a raw number.
- Comments and ownership are visible at the work surface.
- A user can approve, flag, source-check, and comment without losing their place.

### 4. Requirement Panel and Source Proof

Primary files:

- `src/components/RequirementPanel.tsx`
- `src/components/SourceVerifyOverlay.tsx`
- `src/components/PdfSourceView.tsx`
- `src/components/DocxSourceView.tsx`
- `src/components/SheetSourceView.tsx`
- `src/components/CommentThread.tsx`

UI treatment:

- Make the panel the focused working sheet.
- Use the ruled-margin idea for source refs, page refs, confidence, timestamps,
  and audit metadata.
- The main prose area should hold requirement text, drafted answer, gap state,
  and evidence.
- `Show source` should become a visually recognisable proof action across the
  app.
- Exact source matches should feel more confident than approximate matches, but
  both should be honest.
- The source overlay should preserve context and return focus to the same
  requirement when closed.

Button and feature changes:

- Primary action: `Approve`.
- Secondary actions: `Edit`, `Flag`, `Show source`, `Comment`, `Assign`.
- Gating approval should use explicit confirmation copy:
  `This is a deal-breaker requirement. Confirm the answer is accurate.`
- Comments should sit beside the decision history, not below all core work.

Acceptance criteria:

- The panel makes provenance feel obvious: tender source, evidence source,
  human decision, and team comments are separate but connected.
- Keyboard users can open and close source proof without losing position.
- Approximate source matches are labelled honestly.

### 5. Bid Response Workspace

Route:

- `/answers`

Primary files:

- `src/components/AnswersBody.tsx`
- `src/components/AnswerFilterBar.tsx`
- `src/components/AnswerWorkspace.tsx`
- `src/components/AnswerCard.tsx`
- `src/components/ReadinessLedger.tsx`
- `src/components/GapInterview.tsx`
- `src/components/CapabilityUpload.tsx`
- `src/components/AutofillButton.tsx`
- `src/components/ExportMenu.tsx`

UI treatment:

- Make `/answers` feel like a response production workspace, not a second matrix.
- Lead with the readiness ledger as a work summary:
  `8 need your input, 12 to verify, 40 ready to approve`.
- Answer cards should show requirement ref, answer state, evidence ref, gap
  state, source proof, owner, and comments.
- Evidence references should look pressed into the page, not like decorative
  cards.
- Gap questions need a calmer form treatment than matrix review. This is where
  the user is thinking, not scanning.
- Export state should be visible but quiet until the bid is ready enough.

Button and feature changes:

- Primary action changes by state:
  - `Answer next gap`
  - `Review next draft`
  - `Export`
- `Autofill` should state its scope, for example `Draft from uploaded evidence`.
- `Upload capability docs` should read as evidence intake, not a generic file
  uploader.
- `Export` should show blockers when unresolved deal-breakers or unanswered gaps
  remain.
- Export menu should separate artifact intent:
  - `Compliance matrix`: internal review tracker, XLSX first, CSV fallback.
  - `Bid response draft`: clean editable response draft, DOCX first.
  - `Audit/evidence pack`: internal proof trail, PDF or DOCX appendix.
  - `All files`: convenience bundle only when the above are available.
- Client-ready output should stay clean and lightly branded. Internal exports
  can show citations, blockers, comments, actors, timestamps, and audit trail.
- Unresolved gaps should appear as explicit prompts, not disappear from the
  exported artifact.

Acceptance criteria:

- The bid page clearly separates drafting, reviewing, gaps, evidence, and export.
- The user can see which answers are backed by which capability documents.
- The user can choose the right artifact for internal review, editable drafting,
  or proof/audit.
- Collaboration markers appear on answers that need teammate input.

### 6. Marks and Structure

Route:

- `/graph`

Primary files:

- `src/components/StructureView.tsx`
- `src/components/MarksView.tsx`
- `src/components/GraphView.tsx`
- `src/components/RequirementDrawer.tsx`

UI treatment:

- Rename visible navigation from `Graph` to `Marks` or `Marks & structure`.
- Treat this page as bid strategy, not visual novelty.
- Use a clear segmented control: `Split`, `Ledger`, `Map`.
- `MarksView` should make criteria weights and deal-breakers easier to scan.
- If award criteria are missing, show an honest fallback: deal-breaker clusters,
  dependency chains, source-pack structure, and `No published award criteria
  found yet`.
- `GraphView` should use relationship emphasis sparingly: selected requirement,
  connected criterion, dependencies, and dimmed rest.
- The same selected requirement should be shared across ledger and map.

Button and feature changes:

- Requirement actions: `Open details`, `Show source`, `View in matrix`, `Open
  answer`.
- Criteria actions: `Show related requirements`, `Prioritise bid work`.
- Use the drawer for details instead of ejecting the user to another page unless
  the user explicitly asks to open the matrix.

Acceptance criteria:

- A non-technical bid manager understands why this page exists: where marks live
  and where effort should go.
- The map never becomes decoration. Every visual relationship answers a work
  question.

### 7. Teams and Collaboration

Route:

- `/teams`

Primary files:

- `src/components/TeamsManager.tsx`
- `src/components/ShareControl.tsx`
- `src/components/ActivityFeed.tsx`
- `src/components/CommentThread.tsx`
- `src/lib/collaborators.ts`

UI treatment:

- Keep `/teams` as the management surface, but put collaboration indicators into
  `/review` and `/answers`.
- Use simple shipped labels first: `Owner` and `Member`. Future role labels can
  become `Can edit`, `Can comment`, and `View only` once the backend permission
  model supports them.
- Invited, pending, and inactive states should be visually distinct.
- Activity feed should read like an audit trail: person, action, object, time.
- Comments should stay tied to the object they discuss: requirement, answer,
  source excerpt, or gap question.
- Comments should feel conversational by default. Use a distinct blocker state
  only when a comment prevents approval, answer completion, or export.

Button and feature changes:

- `Invite teammate`
- `Copy invite link`
- `Share tender`
- `Mention teammate`
- `Assign requirement` only after explicit assignment is part of the workflow
- `Resolve comment`
- `View activity`

Acceptance criteria:

- Collaboration is visible before the user opens the Teams page.
- A user can tell who owns a requirement or gap.
- Comments do not feel like generic chat. They feel like part of the tender
  record.

## Component Priority Table

| Priority | Component | UI issue | Planned treatment |
|---|---|---|---|
| P0 | `DocumentHeader.tsx` | Header does not yet fully carry workspace context | Add tender state, view state, people/share, and contextual next action |
| P0 | `SectionNav.tsx` | Route labels need to match work model | Use `Tender`, `Matrix`, `Bid`, `Marks`; strengthen active state |
| P0 | `ShareControl.tsx` | Collaboration can feel peripheral | Move compact share/presence into the workspace header |
| P0 | `ComplianceMatrix.tsx` | Rows need a clearer state grammar | Strengthen deal-breaker, confidence, approval, source, comment, and owner signals |
| P0 | `RequirementPanel.tsx` | Provenance and collaboration need clearer hierarchy | Ruled margin, proof action, comment/assignment zone, approval stamp |
| P0 | `NoTenderLoaded.tsx` | Empty state should recover user momentum | Offer recent tenders, upload, and pick-tender paths |
| P1 | `UploadDropzone.tsx` | Upload can feel separate from the workspace | Raised sheet, document-pack preview, clear success actions |
| P1 | `ProcessingView.tsx` | Progress needs a more useful story | File-to-register progress states and recovery actions |
| P1 | `AnswersBody.tsx` | Bid workflow needs stronger visual grouping | Worklist, selected answer, evidence, gaps, export state |
| P1 | `ReadinessLedger.tsx` | Ledger should guide attention, not act as stat tiles | One-line work summary with clear status grammar |
| P1 | `AnswerCard.tsx` | Answer state needs source, owner, and comment visibility | Ref, evidence, gap, source proof, approval/comment markers |
| P1 | `SourceVerifyOverlay.tsx` | Source proof should feel first class | Consistent source action, exact/approx state, return focus |
| P2 | `StructureView.tsx` | Marks page needs clearer purpose | Split/Ledger/Map modes and shared selection |
| P2 | `MarksView.tsx` | Criteria weights need stronger hierarchy | Criterion lanes, weight bars, deal-breaker indicators |
| P2 | `ActivityFeed.tsx` | Audit trail could be more product-defining | Compact record voice: actor, action, object, time |
| P2 | `TeamsManager.tsx` | Team management should match tender permissions | Clear roles, pending state, invite recovery |

## Visual Token and Pattern Plan

Reuse the existing system first:

- Paper background
- Paper-raised sheets
- Ink and ink-muted text
- Forest for primary actions and human approval
- Pine and moss for forest-led arrival, demo, upload/processing, and selected
  brand moments
- Oxblood, amber, yellow, and light-green for status only
- Hairline, section rule, and strong rule
- Fraunces headings, Chillax body, IBM Plex Mono record text

Add or formalise patterns only when they remove ambiguity:

- `forest-guidance`: environmental surface or accent for arrival, demo, upload,
  activity, and primary action.
- `workspace-header`: compact tender identity plus workflow state.
- `record-badge`: small mono state badge for role, page, clause, activity, and
  ownership.
- `source-action`: consistent visual treatment for `Show source`.
- `confidence-dot`: four-tier confidence signal with word label.
- `approval-stamp`: forest tick plus audit line.
- `comment-marker`: quiet count and people indicator on rows/cards.
- `owner-marker`: initials or name where work is assigned.
- `gap-marker`: explicit needs-input state for answers and requirements.

Avoid:

- Raw hex values inside components.
- New generic blue, purple, or teal accents unless tied to the established
  source-traceability meaning.
- Green-tinted decoration that does not clarify guidance, action, collaboration,
  or arrival.
- Nested cards.
- Rounded pill overuse.
- Decorative shadows.
- Landing-page scale typography inside dense app surfaces.

## Motion And Microinteractions

Motion should clarify state changes, give Bidframe continuity, and make the app
feel more finished. It should not decorate the app or slow the work.

The full app-wide specification lives in [MOTION.md](MOTION.md). This UI plan
should follow that document rather than inventing one-off timing per component.

Motion principle:

Forest motion guides. Record motion proves. Serious places stay still.

P0 motion:

- Tokenise duration and easing in `globals.css`.
- Add button press, loading, disabled, hover, focus, and saved feedback within
  100ms.
- Make drawer, share dialog, comment thread, source overlay, and requirement
  panel open/close consistently at roughly 180ms to 240ms.
- Make approval, comment posted, tender shared, gap answered, and export started
  visibly settle once.
- Respect `prefers-reduced-motion` globally.

P1 motion:

- Turn processing into a forest-guided file-to-register story: tender pack
  accepted, files indexed, requirements extracted, matrix ready.
- Add an approval stamp settle that feels like a record action, not celebration.
- Transition the source overlay from the `Show source` trigger, then highlight
  the exact or approximate source line with a restrained record motion.
- Give collaboration updates a single moss/forest pulse in rows, cards, and the
  activity feed, then return them to the record surface.
- Add export readiness and export-start motion that feels like sheets being
  gathered into a filed response.

P2 motion:

- Bring the forest-led motion language into `/`, `/demo`, upload, processing,
  collaboration presence, and success states.
- Add `/demo` scrolly choreography that connects forest arrival to source proof,
  deal-breaker triage, marks, collaboration, and export.
- Add Marks selection traces that reveal related requirements and criteria
  without making the map feel ornamental.
- Add high-trust empty, error, and recovery microinteractions.

Avoid:

- Looping decorative leaf motion inside matrix, source proof, evidence, marks,
  or export review surfaces.
- Confetti, bouncy celebration, or playful easing on legal/proof actions.
- Fade-up-on-scroll inside the actual app.
- Decorative loading animations that hide slow work.
- Animating width/height in ways that shift layout.
- Long transitions that delay review, approval, source checking, commenting, or
  export.

## Accessibility Requirements

- All icon-only buttons need accessible names.
- Touch targets should be at least 44px where the app is used on touch devices.
- The source overlay, comment drawer, share dialog, and requirement drawer must
  trap focus while open and return focus on close.
- Status must survive greyscale and screen reader output.
- Error messages should sit near the affected field or action.
- Keyboard users should be able to review a row, open source, comment, approve,
  and move to the next item.
- Do not disable zoom.
- Do not rely on hover-only previews for critical information.

## Staged UI Rollout Plan

The UI pass should now be staged because the visual work, collaboration polish,
and motion system are large enough to create risk if shipped as one sweep.

Stage rules:

- Each stage must leave Bidframe better and complete if the next stage slips.
- Each stage must ship the motion needed for its own surfaces.
- Each stage should use existing data and APIs unless explicitly noted.
- Do not expose dead controls, placeholder role pickers, fake presence, or
  unfinished motion.
- Do not let forest styling outrun UX clarity. Forest leads guidance and
  continuity; the record still leads proof and decisions.

### Stage 1: UI Foundation And Motion Tokens

Promise:

Every control feels responsive, accessible, and consistent before heavier visual
changes begin.

Why this comes first:

The app already has several high-value surfaces. If motion, focus, loading,
dialogs, and button states stay inconsistent, later forest-led work will feel
like decoration over rough interaction basics.

Primary scope:

- Add or prepare motion duration and easing tokens from [MOTION.md](MOTION.md).
- Add global reduced-motion handling.
- Standardise hover, focus, active, disabled, loading, and saved states.
- Check source overlay, share dialog, comment thread, and drawers for focus
  return and keyboard escape.
- Capture baseline screenshots for `/upload`, `/review`, `/answers`, `/graph`,
  `/teams`, `/`, and `/demo`.
- Mark every current button/state before restyling so nothing silently loses
  affordance.

Motion scope:

- Button press feedback within 100ms.
- Panel, drawer, overlay, and dialog timings at 180ms to 240ms.
- No forest animation yet except where it already exists.
- Reduced-motion behaviour works from the start.

Out of scope:

- Large layout changes.
- New forest-led surfaces.
- Landing or `/demo` choreography.
- New collaboration behaviour.

Likely files:

- `src/app/globals.css`
- `src/components/AppMain.tsx`
- `src/components/SiteHeader.tsx`
- `src/components/DocumentHeader.tsx`
- `src/components/SourceVerifyOverlay.tsx`
- `src/components/ShareControl.tsx`
- `src/components/CommentThread.tsx`
- `src/components/RequirementDrawer.tsx`

Definition of done:

- Common controls have visible press, focus, loading, disabled, and saved
  states.
- Reduced motion can be enabled without broken transitions.
- Keyboard users can open and close core overlays without losing focus.
- Screenshots exist for before/after comparison.

Acceptance test:

- A user clicks, saves, comments, opens source, and opens share without wondering
  whether the app heard them.

### Stage 2: Workspace Header And Navigation

Promise:

The user always knows the loaded tender, current view, team access, and next
useful action.

Why this comes second:

This stage ties the multipage app together without changing the core work
surfaces yet. It makes every later UI change easier to understand.

Primary scope:

- Turn the top of the app into the Tender Workspace Header.
- Align app navigation around `Tender`, `Matrix`, `Bid`, and `Marks`.
- Make active route state visible in greyscale.
- Replace generic `Next` with contextual primary actions.
- Add compact people/access and activity indicators where real data exists.
- Keep `/teams` as utility/admin while making collaboration visible in the
  workspace header.

Motion scope:

- Active nav rule moves or changes in 120ms to 180ms.
- Primary action has immediate press/loading feedback.
- New activity or member change gets one restrained moss/forest pulse.

Out of scope:

- Deep comments redesign.
- Team role picker beyond shipped owner/member meaning.
- Matrix row redesign.
- Landing and `/demo` work.

Likely files:

- `src/components/SiteHeader.tsx`
- `src/components/SectionNav.tsx`
- `src/components/DocumentHeader.tsx`
- `src/components/ControlPanel.tsx`
- `src/components/ShareControl.tsx`
- `src/components/ActivityFeed.tsx`
- `src/lib/collaborators.ts`

Definition of done:

- Tender title, source-pack count, current view, people/access, and next action
  are visible or one click away.
- The header stays compact on desktop and usable on narrow screens.
- The active route does not rely on colour alone.

Acceptance test:

- In five seconds on any app route, a client can say what tender is loaded, what
  page they are on, and what the next action will do.

### Stage 3: Matrix Review And Source Proof

Promise:

The review surface clearly separates risk, confidence, source proof, decisions,
and human attention.

Why this stage matters most:

The matrix is the product's trust core. If this stage ships by itself, Bidframe
already feels substantially stronger in demos and real review work.

Primary scope:

- Strengthen deal-breaker, low-confidence, needs-input, approved, flagged,
  commented, and owner states in the matrix.
- Standardise `Show source` as a recognisable affordance.
- Refine `RequirementPanel` into a focused working sheet.
- Show exact, approximate, and missing source-match states honestly.
- Add approval stamp and flagging treatment with audit context.
- Keep row density high without making rows feel cramped.

Motion scope:

- Row hover/focus and selected state stay under 120ms.
- `Show source` opens the overlay consistently and returns focus.
- Exact/approx source highlights use record motion, not forest motion.
- Approval stamp settles once; flag state applies immediately.
- No row-height or column-width animation.

Out of scope:

- Answer-workspace redesign.
- Full collaboration activity feed polish.
- Landing and `/demo` choreography.
- New source matching logic.

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

Definition of done:

- Every important matrix state is distinguishable in greyscale.
- `Show source` is visually consistent from row, panel, and overlay.
- Exact and approximate source proof do not imply the same certainty.
- Approval and flagging feel official, not playful.

Acceptance test:

- A user can find the first deal-breaker, open its source, decide what to do,
  and explain why that decision is recorded.

### Stage 4: Tender Intake And Processing

Promise:

Uploading a tender pack feels transparent, guided, and trustworthy from file
drop to matrix ready.

Why this can ship independently:

Even if later review surfaces are unchanged, a better intake flow increases
confidence before the user sees results and makes mixed-pack support legible.

Primary scope:

- Make `/upload` read as `Tender library` plus pack intake.
- Improve `UploadDropzone` with per-file rows, source-format badges, file size,
  remove actions, and clear accepted/rejected states.
- Make `ProcessingView` show file-to-register progress.
- Use backend per-file progress when available.
- Improve upload success actions: `Open matrix`, `Review deal-breakers`,
  `Open bid`.
- Keep `NoTenderLoaded` recovery-oriented.

Motion scope:

- Dropzone hover/focus gets forest guidance without becoming decorative.
- File accepted/rejected states give immediate feedback.
- Processing advances through document stages with forest-guided motion.
- Success resolves into the record/register and offers the next action.
- Errors stop motion and show recovery.

Out of scope:

- Matrix redesign beyond links into it.
- New backend progress fields.
- Landing and `/demo` choreography.

Likely files:

- `src/components/UploadDropzone.tsx`
- `src/components/ProcessingView.tsx`
- `src/components/TendersList.tsx`
- `src/components/NoTenderLoaded.tsx`
- `src/components/RegisterPreview.tsx`
- `src/context/RequirementsContext.tsx`
- `src/lib/source-doc.ts`

Definition of done:

- Loose files and ZIP packs are visibly staged before upload.
- Mixed PDF, Word, Excel, and CSV sources read as a tender pack.
- Processing states name what is happening.
- Upload success points to the next useful workflow step.

Acceptance test:

- A user can upload a mixed pack and tell whether Bidframe is reading files,
  extracting requirements, reconciling, or ready.

### Stage 5: Bid Response And Export Readiness

Promise:

The bid response surface clearly shows what is drafted, what is evidenced, what
needs input, and what blocks export.

Why this follows review:

The answer workspace is valuable only when the source and decision grammar is
already clear. This stage makes auditable autofill feel like a serious response
workflow rather than a second matrix.

Primary scope:

- Reframe `/answers` as `Bid` or `Bid response`.
- Lead with a readiness ledger that guides work instead of acting like stat
  tiles.
- Group answer cards by state: needs input, needs review, backed by evidence,
  ready.
- Make evidence references feel pressed into the record.
- Make gaps calmer and more form-like than matrix decisions.
- Make export blockers visible before the user starts export.
- Separate export artifact types: Compliance Matrix, Bid Response Draft,
  Audit/Evidence Pack, and All Files if supported.
- Preserve uncertainty in exports with explicit input-needed prompts and proof
  references.

Motion scope:

- Readiness ledger updates with record-style settle.
- Evidence upload and `backs N` updates give clear feedback.
- Gap answered state saves and updates counts once.
- Export blocker list appears immediately.
- Export start uses filed-page or sheet-gather motion, never celebration before
  readiness.

Out of scope:

- New answer-generation model behaviour.
- Heavy assignment workflow for every gap.
- Landing and `/demo` choreography.

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

Definition of done:

- The user can distinguish draft, evidence-backed, needs-input, and export-ready
  answer states.
- Export never implies readiness while deal-breakers or gaps remain unresolved.
- Evidence and source proof stay connected to answers.
- Export artifacts are clearly separated by intent: internal tracker, editable
  response, and audit/evidence proof.

Acceptance test:

- A user can answer one gap, see which answer changed, identify remaining export
  blockers, and start an export only when the response is ready enough.

### Stage 6: Collaboration Presence And Audit

Promise:

Teamwork is visible at the work item, and the activity record feels like proof,
not generic chat.

Why this is its own stage:

Collaboration now exists, but it can easily become scattered. This stage gives
it a cohesive UI grammar after the main work surfaces can already stand alone.

Primary scope:

- Add row/card/panel markers for teammate decisions, comments, and ownership.
- Polish `ShareControl` as a focused dialog with success/error states.
- Make `ActivityFeed` read as an audit trail: actor, action, object, time.
- Keep comments tied to requirement, answer, source excerpt, or gap.
- Use `Owner` and `Member` labels first; do not expose fake role controls.
- Add blocker-comment treatment only where it directly blocks approval, answer
  completion, or export.

Edge-case UI states:

- Invite states: pending, failed, expired, already accepted, and no permission to
  invite.
- Access states: view-only, can comment but not approve, removed access while
  the page is open, and team deleted or unavailable.
- Conflict states: simultaneous decision, comment save retry, stale activity
  event, and refresh needed because another teammate changed the item.
- Actor states: unknown actor, former teammate, very long name, many teammates,
  and sample/demo actor.
- Export states: unresolved blocker comment, unresolved assignment, non-blocking
  FYI comment, and activity still syncing.

UI rule:

Collaboration edge states use the record voice first: actor, action, object,
time, and recovery. Forest motion can acknowledge success or new activity, but
errors, conflicts, and permission changes should be still, plain, and close to
the affected control.

Motion scope:

- New activity event gets one moss pulse, then becomes static record.
- Comment posted inserts and settles once.
- Member added appears once, then rests.
- Do not imply live presence unless backed by realtime data.

Out of scope:

- Full task management.
- Fake typing indicators.
- Complex permission redesign.
- New notification centre.

Likely files:

- `src/components/ShareControl.tsx`
- `src/components/ActivityFeed.tsx`
- `src/components/CommentThread.tsx`
- `src/components/TeamsManager.tsx`
- `src/components/ComplianceMatrix.tsx`
- `src/components/RequirementPanel.tsx`
- `src/components/AnswerCard.tsx`
- `src/lib/collaborators.ts`

Definition of done:

- Collaboration appears in the workspace before the user opens `/teams`.
- A user can tell who acted, what changed, and where the discussion belongs.
- Comments do not feel like loose chat.
- Failed invite, lost permission, reconnecting, and conflicting-decision states
  are designed, even if backed by mock or simulated data at first.

Acceptance test:

- In a two-person walkthrough, one user can share a tender, the other can
  comment or decide, and the first user can see the named update in context.

### Stage 7: Forest-Led Continuity, Landing, And `/demo`

Promise:

The public surfaces, guided demo, and app now feel like one Bidframe product:
forest-guided on arrival, record-solid during proof.

Why this comes last:

Landing and `/demo` should sell the product truthfully. They should inherit the
stable app language rather than inventing a prettier product that the app does
not yet match.

Primary scope:

- Tune `/` landing motion and microinteractions against the forest-led civic
  record language.
- Tune `/demo` scrolly choreography so it teaches real app interactions:
  upload, deal-breaker, source proof, collaboration, marks, and export.
- Ensure landing product shots and `/demo` proof moments use the same state
  grammar as the app.
- Run final cross-route visual QA for `/upload`, `/review`, `/answers`,
  `/graph`, `/teams`, `/`, `/demo`, and `/pack`.
- Confirm `/showcase` is not treated as the main product target.

Motion scope:

- Forest motion carries arrival, guidance, processing, collaboration, and
  success.
- Record motion carries source proof, approval, marks, audit, and export.
- Landing and `/demo` can use more choreography than the app, but source proof
  and decision states remain disciplined.
- Reduced motion leaves landing and `/demo` polished and static.

Out of scope:

- New pitch mechanics.
- Restyling `/showcase` as a primary product surface.
- Major new app workflows.

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

Definition of done:

- A prospect moving from landing to `/demo` to app sees the same product logic.
- Forest-led motion makes the product feel guided without softening proof
  surfaces.
- `/demo` makes the multipage app easier to understand.
- Reduced-motion mode is acceptable on landing and `/demo`.

Acceptance test:

- A client on a video call can watch `/demo`, enter the app, and recognise the
  same source proof, collaboration, review, and export behaviours.

### Stage Dependency Summary

- Stage 1 should happen first. It creates the motion/accessibility foundation.
- Stage 2 should happen before stages 3 to 6 where possible, because the header
  and navigation frame every work surface.
- Stages 3, 4, and 5 can ship independently after stages 1 and 2.
- Stage 6 can ship after stage 2, but it gets better once stages 3 and 5 have
  the row/card/panel state grammar in place.
- Stage 7 should come last so landing and `/demo` reflect the real app.

## Validation Plan

Use the same lightweight tests as the UX brief, but judge the UI separately.

Five-second orientation test:

- Show `/review` with a loaded tender.
- Ask: what tender is this, what screen are you on, what needs attention, and
  who else is involved?

First-click test:

- "Find the next deal-breaker to review."
- "Show me where this requirement came from."
- "Ask a teammate to check this answer."
- "Find what still blocks export."

State recognition test:

- Show rows/cards in greyscale.
- Ask users to identify approved, needs input, low confidence, deal-breaker,
  commented, and assigned states.

Demo readiness test:

- In a five-minute video call, the presenter should not have to explain where
  source proof, collaboration, or next action lives.

## Design Rationale

### Decision 1: Move To Forest-Led Civic Record

Context:

Bidframe sells trust, but also needs to be remembered by potential customers.
The forest-led landing and demo already feel more ownable and emotionally right
than a purely document-led app. A generic SaaS polish pass would make the
product more familiar but less credible; a pure Civic Record pass would make it
credible but potentially too institutional.

Options considered:

- Rebrand into a modern SaaS dashboard.
- Make the UI highly minimal and neutral.
- Preserve pure Civic Record across the app.
- Move to forest-led Civic Record: forest for feeling and guidance, record for
  proof and decisions.

Decision:

Move to forest-led Civic Record. Use forest for first impression, product
continuity, primary action, upload/processing, demo momentum, and collaboration
presence. Keep Civic Record for matrix review, source proof, evidence, approval,
audit trail, marks/criteria, and export readiness.

Trade-off:

The system has more nuance than a single visual rule. That is acceptable because
Bidframe has two jobs: make customers feel guided before they buy, and make
users feel the work is solid once they inspect it.

Validation:

Prospects should describe Bidframe as memorable and guided. Users should
describe the work surfaces as trustworthy, clear, official, and useful.

### Decision 2: UI Polish Should Follow UX Structure

Context:

The biggest product risk is not that Bidframe lacks visual flair. The risk is
that users do not understand how upload, matrix, answers, marks, and teamwork
connect.

Decision:

Keep the UI work to roughly 25 percent of the effort and use it to clarify the
UX overhaul.

Trade-off:

Some visual refinements will wait until the workflow is stable.

Validation:

Users should complete core tasks faster and with fewer "where do I go now?"
moments before the app receives any heavier visual polish.

### Decision 3: Collaboration Belongs At The Decision Point

Context:

The app now has collaboration, but team value is not obvious if share, comments,
and activity live away from matrix and answers.

Decision:

Surface collaboration markers in the matrix rows, requirement panel, answer
cards, bid gaps, and workspace header.

Trade-off:

The UI will carry more small metadata. The solution is careful density, not
hiding collaboration.

Validation:

A user should be able to tell who owns an item, whether there are comments, and
what changed recently without opening `/teams`.

### Decision 4: Source Proof Needs A Recognisable Affordance

Context:

Trust in AI output depends on seeing where a requirement and answer came from.

Decision:

Make `Show source` visually consistent across matrix, panel, answers, marks,
and source overlays.

Trade-off:

This creates one more recurring control in dense surfaces. The control earns its
space because source proof is central to the product promise.

Validation:

In a demo, users should instinctively click `Show source` when they want proof.

## Final Acceptance Checklist

- `/review`, `/answers`, `/upload`, `/graph`, and `/teams` share one workspace
  visual model.
- Forest leads guidance/customer feeling; the record leads proof and decisions.
- The current tender is visible or one click away everywhere.
- The active view is obvious without colour.
- Every screen has one primary action.
- `Show source` is visually consistent.
- Deal-breakers, low confidence, needs input, approved, flagged, commented, and
  assigned states are distinguishable in greyscale.
- Collaboration is visible on the work item, not only in `/teams`.
- Empty, loading, error, and success states have clear next actions.
- Motion follows [MOTION.md](MOTION.md): forest guides arrival, processing,
  collaboration, and success; record motion proves source, approval, audit,
  marks, and export states.
- No raw confidence numbers appear.
- No generic dashboard cards, decorative gradients, pure white, pure black, or
  decorative shadows are introduced.
- Keyboard and screen reader flows work for source proof, comments, share, and
  approval.
- The app still feels like Bidframe: guided by forest, verified by the record.
