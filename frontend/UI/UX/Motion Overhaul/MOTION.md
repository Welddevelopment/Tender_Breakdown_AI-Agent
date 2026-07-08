# Bidframe Motion System

Local planning draft. Created 2026-07-05. No commit or push has been made.

This document defines motion and microinteractions for the whole Bidframe
frontend: the app, landing page, and `/demo`. It should be read with
[UI-IMPROVEMENT-PLAN.md](UI-IMPROVEMENT-PLAN.md),
[UX-OVERHAUL-BRIEF.md](UX-OVERHAUL-BRIEF.md),
[design-language.md](../../../design-language.md), and
[DESIGN-SYSTEM.md](../../../DESIGN-SYSTEM.md). QA and measurement live in
[QA.md](QA.md).

Motion is not decoration in Bidframe. It is how the product shows progress,
proves state changes, makes collaboration feel live, and connects the
forest-led brand world to the serious tender record.

## One Rule

Forest motion guides. Record motion proves. Serious places stay still.

Use forest motion when the user is arriving, uploading, progressing, sharing,
or succeeding. Use record motion when the user is verifying, approving,
commenting, reviewing evidence, or exporting. If a surface carries legal,
source, audit, or answer truth, motion must be restrained and useful.

## Motion Goals

- Make the landing page, `/demo`, upload, and app feel like one product.
- Make state changes obvious without relying on colour alone.
- Give users immediate feedback for clicks, saves, errors, comments, and
  collaboration updates.
- Make upload and processing feel transparent rather than like waiting.
- Make source proof, approval, and export feel official and trustworthy.
- Make forest-led moments memorable without weakening serious work surfaces.
- Respect reduced-motion preferences at the system level.

## Non-Goals

- No decorative animation in the matrix, source proof, evidence, marks, or
  export review surfaces.
- No confetti, fireworks, bouncy celebration, or playful legal-state motion.
- No looping leaf, particle, sparkle, or ambient animation inside the product
  workspace.
- No motion that hides latency or makes a slow task feel fake.
- No page-wide transitions that delay navigation.
- No motion that makes dense rows shift size while the user is scanning.
- No animated raw confidence numbers. Confidence remains a glanceable status
  signal, never a count-up.

## Five-Principle Motion Gate

Motion must pass the same product filter as UX and UI.

1. **Question every motion requirement.** What state, relationship, progress, or
   trust signal does this motion clarify?
2. **Delete motion that does not clarify.** Remove loops, flourishes, parallax,
   or transitions that only make the app feel animated.
3. **Simplify choreography.** Prefer one clear state change over several
   competing movements.
4. **Accelerate perceived progress.** Give immediate feedback, name long-running
   work, and make upload/export states understandable. Do not fake progress.
5. **Automate feedback carefully.** Automate microinteractions for real events:
   saved, approved, commented, shared, matched, exported. Do not animate events
   the system cannot prove happened.

Trust rule:

If the motion appears in matrix review, source proof, evidence, marks, audit, or
export review, record discipline wins. Forest motion belongs in arrival,
guidance, processing, collaboration presence, and success.

## Motion QA Summary

Use [QA.md](QA.md) for the full QA layer. Motion is successful when it improves
feedback and continuity without slowing the work.
Use [delete.md](delete.md) to remove motion that does not clarify a real state
change.

Required motion checks:

- Input feedback appears within 100ms.
- Panels, overlays, dialogs, and drawers use consistent timing.
- Matrix rows do not shift height.
- Source highlights are restrained and clear.
- Approval, comment, share, gap, evidence, and export feedback happens once and
  then settles.
- Upload and processing motion names real progress.
- Reduced motion disables parallax, slide, scale, rotation, shimmer, and trail
  drawing.
- No decorative looping motion appears in proof surfaces.

## Motion Layers

### 1. Forest Guidance Motion

Purpose:

Guide the user through arrival, upload, processing, collaboration, and success.

Where it belongs:

- Landing page hero, transitions, CTAs, product shots, and closing.
- `/demo` title cards, scrolly momentum, and CTA arrival.
- `/upload` dropzone, pack acceptance, processing progress, and success.
- Workspace header primary action and live people/activity presence.
- Collaboration updates that should feel human and current.
- Export start and export success.

Visual metaphors:

- Trail draw.
- Canopy drift.
- Treeline reveal.
- Moss pulse.
- Growth-ring settle.
- Filtered-light sweep.
- Branch-line draw.

Rules:

- Keep it abstract and restrained. Do not animate literal leaves across work
  surfaces.
- Forest motion may be slower than utility motion on landing and `/demo`, but
  not in work-critical app interactions.
- Forest motion should carry direction: toward the next useful action, through
  a process, or into a resolved state.

### 2. Civic Record Motion

Purpose:

Prove that something has been checked, filed, linked, cited, approved, or
exported.

Where it belongs:

- Matrix row selection and state changes.
- Requirement panel transitions.
- Source overlay open, exact highlight, approximate highlight, and return.
- Evidence excerpts, answer citations, approval stamps, audit feed entries.
- Marks selection traces and export readiness.

Visual metaphors:

- Sheet align.
- Rule draw.
- Ink settle.
- Stamp settle.
- Source line highlight.
- Filed-page stack.
- Register mark.

Rules:

- Keep transforms tiny: 1px to 6px motion, or none.
- Use opacity, line draw, highlight, and state settle before large movement.
- Avoid bounce. If a stamp uses a tiny overshoot, it must be short and sober.
- Never make source proof feel theatrical.

### 3. Utility Motion

Purpose:

Make controls feel responsive and prevent uncertainty.

Where it belongs:

- Buttons, tabs, segmented controls, toggles, filters, selects, dialogs,
  drawers, toasts, focus rings, inline validation, copy/download controls.

Rules:

- User input gets visible feedback within 100ms.
- Utility motion should usually last 80ms to 180ms.
- It should be interruptible. A second click, Esc, route change, or keyboard
  move should cancel or complete the current animation cleanly.

## Motion Tokens

Define these as CSS custom properties in `src/app/globals.css` when the motion
implementation pass begins.

| Token | Value | Primary use |
|---|---:|---|
| `--motion-instant` | 80ms | Pressed states, check marks, focus emphasis, tiny state changes |
| `--motion-fast` | 120ms | Hover, active route underline, chip state, inline validation |
| `--motion-standard` | 180ms | Most component transitions, row selection, panel content settle |
| `--motion-panel` | 240ms | Drawers, overlays, dialogs, source proof entry |
| `--motion-process` | 360ms | Upload and processing step transitions, export gather |
| `--motion-feature` | 520ms | Landing and `/demo` feature choreography |
| `--motion-hero` | 700ms | Landing hero arrival and major `/demo` scene change only |

Do not add more duration tokens unless a new interaction cannot honestly fit
the scale above.

## Easing Tokens

| Token | Curve | Primary use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default UI transitions |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering or becoming active |
| `--ease-exit` | `cubic-bezier(0.3, 0, 1, 0.3)` | Elements leaving or becoming inactive |
| `--ease-forest` | `cubic-bezier(0.16, 1, 0.3, 1)` | Guided forest motion, progress, CTA sweeps |
| `--ease-record` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Source highlight, line draw, sheet settle |
| `--ease-stamp` | `cubic-bezier(0.34, 1.2, 0.64, 1)` | Approval stamp only, no playful bounce |
| `--ease-linear` | `linear` | Progress indicators only |

## Movement Limits

| Movement | Limit | Use |
|---|---:|---|
| Press depth | 1px to 2px | Button press, icon button press |
| Utility slide | 4px to 8px | Menus, chips, inline validation |
| Panel slide | 12px to 20px | Drawers, overlays, source panel |
| Hero parallax | 8px to 24px | Landing only, reduced on small screens |
| Scale down | 0.98 | Button press, selected card press |
| Scale up | 1.02 | Landing product shot hover only |
| Rotation | 1deg to 3deg | Approval stamp, landing botanical line only |

Do not animate matrix row height, table columns, dense card height, source text
line height, or anything that causes scanning content to jump.

## Reduced Motion

Reduced motion is a system-level requirement.

When `prefers-reduced-motion: reduce` is active:

- Set all duration tokens to `1ms` except essential progress indicators.
- Remove parallax, slide, scale, rotation, shimmer, and trail drawing.
- Keep opacity changes only where they clarify state.
- Preserve progress updates as static step changes.
- Replace approval stamp settle with an immediate static stamp.
- Replace source highlight sweep with an immediate highlighted line.
- Replace export gather with an immediate filed/export-ready state.
- Keep focus rings and validation messages visible.

Implementation target:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-instant: 1ms;
    --motion-fast: 1ms;
    --motion-standard: 1ms;
    --motion-panel: 1ms;
    --motion-process: 1ms;
    --motion-feature: 1ms;
    --motion-hero: 1ms;
  }

  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```

## Choreography Rules

- Lead with the most important element.
- Related items may stagger by 30ms to 50ms.
- Product app sequences should finish within 500ms.
- Landing and `/demo` feature sequences should finish within 900ms unless the
  user is controlling progression through scroll.
- Motion must not block input.
- Motion must be cancelable by route change, Esc, second click, keyboard
  navigation, or reduced-motion preference.
- Elements in the same semantic group use the same duration and easing.
- Entry generally decelerates. Exit generally accelerates.
- Loading loops are allowed only when work is genuinely in progress.

## Route Motion Map

| Route | Motion role | Forest level | Record level |
|---|---|---:|---:|
| `/` | Brand arrival, product trust, CTA momentum | High | Medium |
| `/demo` | Guided story from risk to proof to collaboration | High | High |
| `/upload` | Tender pack intake and processing transparency | Medium | Medium |
| `/review` | Matrix triage, source proof, decisions, comments | Low | High |
| `/answers` | Draft readiness, evidence, gaps, export | Low | High |
| `/graph` or `Marks` | Relationship focus and bid strategy | Low | High |
| `/teams` | Team setup and access confidence | Medium | Medium |
| `/pack` | Mixed-pack proof and source-format confidence | Medium | High |
| `/showcase` | Walkthrough aid only, not the main product target | Medium | High |

## Landing Page

Primary files:

- `src/components/landing/Landing.tsx`
- `src/components/landing/ForestHeroLayers.tsx`
- `src/components/landing/HeroResolve.tsx`
- `src/components/landing/ProductShots.tsx`
- `src/components/landing/ProofScrolly.tsx`
- `src/components/landing/BookDemoButton.tsx`
- `src/components/landing/ClosingArrival.tsx`
- `src/components/landing/TrailDescent.tsx`
- `src/components/landing/DrawOn.tsx`
- `src/components/landing/art/*`

Landing motion should be the fullest forest-led expression because this is
where potential customers form the emotional read of Bidframe.

Required motion:

- Hero forest layers arrive as a slow guided reveal, then settle.
- Primary CTA gets a subtle filtered-light sweep on hover and press feedback on
  click.
- The hero product surface may settle into position once, then remain still.
- Product proof moments can reveal with rule draw, sheet settle, and source-line
  highlight.
- Botanical or treeline art can draw on, but must not loop.
- The closing CTA can use forest arrival and filed-record success language.

Rules:

- Proof numbers may settle or fade in, but do not count up unless the landing
  brief is updated to allow count-up for verified real numbers.
- Do not use motion to make unsupported claims feel bigger.
- Do not add ambient loops behind text that users need to read.
- On mobile, reduce parallax and keep the product surface legible.

Acceptance test:

- A prospect should feel Bidframe is guided, calm, and memorable.
- The product itself should still be visible and inspectable.
- Reduced motion should leave a polished static landing, not a broken one.

## `/demo`

Primary files:

- `src/components/DemoView.tsx`
- `src/components/demo/DemoScrolly.tsx`
- `src/components/demo/ScrollyStage.tsx`
- `src/components/demo/DemoTitleCard.tsx`
- `src/components/demo/GhostCursor.tsx`
- `src/components/demo/MountOnView.tsx`
- `src/components/demo/StageChrome.tsx`
- `src/components/demo/useScrollTimeline.ts`
- `src/components/demo/steps.ts`

The `/demo` page should use motion to teach the product, not merely decorate a
showcase. It can be more choreographed than the actual app because it is a
guided client walkthrough.

Story rhythm:

1. Forest arrival: the user enters a guided path, not a blank SaaS screen.
2. Tender appears: document pack resolves into a working register.
3. Deal-breaker lifts: the risky requirement becomes the visual focus.
4. Source proof opens: the exact line is highlighted with record discipline.
5. Collaboration appears: another person acts on the same tender.
6. Marks connect: effort and scoring become visible.
7. Export resolves: the response is ready or the blockers are clear.

Required motion:

- Scrolly steps should advance with a clear stage change, not random fade-up.
- Ghost cursor movement should be used sparingly and only to show a click path.
- The matrix should stay readable while the demo highlights a row.
- Source overlay should use the same motion as the app, so the demo teaches the
  real interaction.
- Collaboration updates can use a moss pulse and activity-feed settle.
- Closing CTA can return to forest guidance.

Rules:

- Do not animate every beat. Let dense proof moments breathe.
- Never hide row text behind overlays or motion.
- The demo can have cinematic pacing, but source proof and legal states still
  use record motion.

Acceptance test:

- A viewer on a video call should understand what happened without narration
  filling in missing UI.
- The motion should make the multipage product easier to understand, not make
  `/demo` feel like a separate product.

## Upload And Tender Library

Primary files:

- `src/components/UploadDropzone.tsx`
- `src/components/ProcessingView.tsx`
- `src/components/TendersList.tsx`
- `src/components/NoTenderLoaded.tsx`
- `src/components/RegisterPreview.tsx`

Upload is where forest motion should do the most app-work. The user is handing
over a tender pack and waiting for structure to emerge.

Microinteractions:

- Dropzone idle: still, with a clear affordance.
- Dropzone hover/focus: 120ms forest edge and pressed-paper lift.
- File accepted: file row slides in 4px and settles in the pack list.
- File rejected: inline error appears immediately with no shake unless the
  input itself needs attention.
- Remove file: row fades/collapses after confirmation of intent.
- Upload started: CTA press moves into a determinate or staged progress state.
- Processing: documents move through states such as `Queued`, `Reading`,
  `Extracting`, `Reconciling`, `Ready`.
- Success: forest-guided trail resolves into a record register, then offers
  `Open matrix`.
- Failure: no flourish. Show the failed file, reason, and recovery action.

Processing story:

Use file-to-register progress. Each source document should have its own stage
when backend progress exists. The visual should say "Bidframe is indexing this
pack" rather than "wait for a spinner".

Acceptance test:

- The user can tell whether the system is uploading, reading, extracting,
  reconciling, or ready.
- On a mixed pack, per-file progress should make Word, Excel, CSV, and PDF
  sources feel trustworthy without pretending non-PDF files have PDF
  highlights.

## App Shell And Workspace Header

Primary files:

- `src/components/SiteHeader.tsx`
- `src/components/SectionNav.tsx`
- `src/components/DocumentHeader.tsx`
- `src/components/AppMain.tsx`
- `src/components/ShareControl.tsx`
- `src/components/ActivityFeed.tsx`

Motion here should orient, not perform.

Required motion:

- Active nav underline or rule moves in 120ms to 180ms.
- Primary next action has immediate press feedback and loading state.
- People strip updates with one moss pulse when a teammate joins or acts.
- Activity count can pulse once when a new event arrives.
- Header layout should not jump when counts change.

Rules:

- Avoid page-level route transitions across app screens.
- Do not animate tender title changes with large movement.
- Keep all header motion secondary to the loaded tender and current task.

## Matrix Review

Primary files:

- `src/components/MatrixView.tsx`
- `src/components/ComplianceMatrix.tsx`
- `src/components/GatingHero.tsx`
- `src/components/RequirementSpine.tsx`
- `src/components/ControlPanel.tsx`
- `src/components/ConfidenceIndicator.tsx`
- `src/lib/matrix-derive.ts`

The matrix is a scanning surface. Motion must preserve row stability.

Required motion:

- Row hover/focus: 80ms to 120ms background/rule emphasis.
- Row selected: subtle record-edge emphasis and no row height change.
- Filter or group change: preserve scroll position where possible, and use
  instant or 120ms opacity changes rather than moving rows across the screen.
- Confidence state change: dot fill settles, label updates immediately.
- Deal-breaker hero click: focus transfers to the related row or panel with a
  small source-of-attention highlight.
- Decision saved: row state updates once, then settles.

Approval:

- Non-gating approval can show a small forest tick settle.
- Gating approval uses a record-first confirm state and a restrained approval
  stamp. It should feel official, not celebratory.

Flagging:

- Flag state should apply an oxblood rule or marker immediately.
- If a note is required, focus should move to the note field without delay.

Collaboration:

- A teammate decision chip appears with one moss pulse and then becomes part of
  the static row record.

Rules:

- Do not animate table column widths.
- Do not animate every row after filtering.
- Do not use forest motion for risk states. Oxblood and record grammar carry
  risk.

## Requirement Panel And Source Proof

Primary files:

- `src/components/RequirementPanel.tsx`
- `src/components/RequirementDrawer.tsx`
- `src/components/SourceVerifyOverlay.tsx`
- `src/components/PdfSourceView.tsx`
- `src/components/DocxSourceView.tsx`
- `src/components/SheetSourceView.tsx`
- `src/lib/text-match.ts`
- `src/lib/dom-highlight.ts`

Source proof is the trust core. It should feel fast, precise, and serious.

Panel motion:

- Open panel or drawer in 180ms to 240ms.
- Return focus to the triggering row or button on close.
- Keep the requirement text readable throughout.
- Evidence blocks can settle 2px into a pressed-paper state.

Source overlay motion:

- Trigger: `Show source`.
- Rule: overlay opens from the source action context, not as a random modal.
- Feedback: document area appears, then exact or approximate highlight resolves.
- Exact match: source line highlight draws or fades in within 180ms.
- Approximate match: highlight uses a quieter style and copy confirms it is an
  approximate location.
- No match: show extracted text and recovery copy without highlight animation.
- Close: overlay exits quickly and focus returns.

Rules:

- No forest motion in source proof, except the originating primary button if it
  sits in a broader forest-guidance surface.
- Do not animate PDF, DOCX, or sheet text layout.
- Highlight must be visible in greyscale.
- Reduced motion gets an immediate static highlight.

Acceptance test:

- In a client demo, a viewer should understand that Bidframe is not merely
  showing text. It is locating the claim in the source.

## Bid Response And Answers

Primary files:

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

This surface is slower and more thoughtful than matrix review. Motion should
support comprehension and reduce anxiety around evidence.

Required motion:

- Readiness ledger updates with a record-style count change, not a dashboard
  bounce.
- Answer cards update their state with a 120ms to 180ms settle.
- Evidence uploaded: document chip appears and then shows `backs N` when cited.
- Gap answered: textarea saves, card state changes, and affected answer/gap
  counts update once.
- Autofill started: button enters a grounded drafting state with clear scope.
- Autofill complete: answered/gap groups update without shuffling the whole
  page unnecessarily.

Rules:

- Do not make answer drafting feel magical. Use record language: evidence,
  citation, gap, draft, review.
- Do not loop a decorative AI animation while drafting.
- If the server is slow, show the current phase and preserve user control.

## Collaboration

Primary files:

- `src/components/ShareControl.tsx`
- `src/components/ActivityFeed.tsx`
- `src/components/CommentThread.tsx`
- `src/components/TeamsManager.tsx`
- `src/lib/collaborators.ts`

Collaboration motion should make the app feel live, but the record must remain
authoritative.

Required motion:

- Share dialog opens in 180ms to 240ms and traps focus.
- Invite submitted: button enters loading state within 100ms.
- Invite success: new member row or chip appears with a one-time moss pulse.
- New decision event: activity feed entry highlights once, then settles.
- Comment posted: comment appears at the end of the thread and focus returns to
  the composer or next action.
- Mention or assignment later: owner marker updates once.
- Presence later: viewing-now pulse must be slow, rare, and non-distracting.

Rules:

- Activity is an audit trail, not chat confetti.
- Comments are conversational unless marked as blockers.
- Avoid typing indicators unless real realtime presence is implemented.
- Do not imply someone is live unless the data proves it.
- Do not pulse stale activity after reconnect. Mark it as refreshed, then rest.
- Permission loss, invite failure, and conflicting edits should not bounce or
  celebrate. Use a still warning state near the affected control.
- Unsynced comments or decisions can show a quiet pending state, but only a
  confirmed save gets the settle motion.

## Marks And Structure

Primary files:

- `src/components/StructureView.tsx`
- `src/components/MarksView.tsx`
- `src/components/GraphView.tsx`
- `src/components/GraphView.module.css`
- `src/components/RequirementDrawer.tsx`

The marks surface helps the user understand bid strategy. Motion should explain
relationships without making the map decorative.

Required motion:

- Segmented mode change (`Split`, `Ledger`, `Map`) uses 120ms to 180ms
  indicator movement.
- Selecting a requirement highlights the connected criterion, dependencies, and
  related rows.
- Unrelated graph elements dim rather than fly away.
- Relationship trace can draw once along the relevant edge, then become static.
- Drawer open uses the same panel timing as requirement review.
- Missing award criteria fallback appears as a static record state with a clear
  next action.

Rules:

- No animated force-layout drift after the page is usable.
- No perpetual edge movement.
- No graph motion that competes with requirement text.

## Export

Primary files:

- `src/components/ExportMenu.tsx`
- `src/lib/export-response.ts`
- `src/lib/export-matrix-xlsx.ts`

Export is a trust moment. The user needs to know whether the response is ready
and what remains blocked.

Exported artifacts are record-led, not forest-led. The app can guide the user
with forest motion, but the file leaving the product should feel official,
editable, and honest.

Artifact types:

- `Compliance Matrix`: internal review tracker, XLSX first, CSV fallback.
- `Bid Response Draft`: clean editable response draft, DOCX first.
- `Audit/Evidence Pack`: internal proof trail, PDF or DOCX appendix.
- `All Files`: convenience bundle only when the individual artifacts exist.

Required motion:

- Opening the export menu is fast and utility-grade.
- If blockers remain, blocker list appears immediately with record emphasis.
- When export starts, use a filed-page or sheet-gather motion in 240ms to 360ms.
- When download begins, show a quiet success state and keep the recovery path.
- If export fails, stop motion and show the failure reason plus retry.

Rules:

- No celebration before the file is actually ready.
- No forest flourish when blockers remain.
- Export success can use a forest seal or filed-record mark once.
- Never animate away unresolved gaps or missing evidence. The artifact must keep
  those visible as input-needed prompts or blocker notes.

## Loading, Empty, Error, And Success States

Loading:

- Prefer skeletons for known content.
- Use step progress for known pipeline stages.
- Use spinner only for tiny unknown waits under 1 second.
- If wait exceeds 2 seconds, name the current task.

Empty:

- Empty states should show the next useful action.
- Forest guidance is allowed when the user is at an arrival or recovery moment.
- Work-surface empty states should still look like records.

Error:

- Errors should appear near the cause.
- Use a quick inline reveal, not a dramatic shake.
- Preserve the user's staged files, answers, comments, or filters wherever
  possible.

Success:

- Success motion should confirm state, not celebrate wildly.
- Approval, comment posted, evidence uploaded, tender shared, and export started
  each get a small one-time settle.

## Microinteraction Specs

| Name | Trigger | Rules | Feedback | Timing | Reduced motion |
|---|---|---|---|---|---|
| Primary button press | Pointer, Enter, Space | Press immediately, then loading if async | 1px to 2px press, label or spinner state | 80ms | Immediate state |
| Secondary button hover | Hover or focus | Emphasise affordance only | Rule, underline, or icon shift up to 2px | 120ms | Static emphasis |
| Nav active change | Route change | Move active state to current view | Underline/rule and label weight | 120ms to 180ms | Instant |
| Dropzone focus | Drag enter or keyboard focus | Show valid target | Forest edge, paper lift, file-type hint | 120ms | Static focus |
| File accepted | Valid file added | Insert into pack list | Row appears, format badge settles | 180ms | Instant row |
| File rejected | Invalid file added | Keep file out of staged list | Inline error near dropzone | 120ms | Instant error |
| Processing step advance | Backend job update | Update one step at a time | Stage marker moves, previous step files | 240ms to 360ms | Static step |
| Matrix row focus | Hover, keyboard, click | Emphasise selected row | Rule/background emphasis, no height shift | 80ms to 120ms | Static row |
| Deal-breaker focus | Hero click or filter | Move attention to risky item | Oxblood edge and row focus | 180ms | Static focus |
| Show source | Button click | Open overlay, locate source | Overlay entry, source line highlight | 240ms + 180ms | Instant overlay/highlight |
| Exact highlight | Source located exactly | Mark exact text | Rule/highlight draw or fade | 180ms | Static highlight |
| Approx highlight | Partial source match | Mark approximate area | Quieter highlight plus label | 180ms | Static highlight |
| Approve requirement | Save succeeds | Mark as approved and record actor | Forest tick or stamp settle | 180ms to 240ms | Static stamp |
| Flag requirement | Save succeeds | Mark risk and request note if needed | Oxblood marker appears | 120ms | Static marker |
| Comment posted | Submit succeeds | Append comment and update marker | Thread insert and row/comment count pulse | 180ms | Static comment |
| Activity event | SSE or refresh event | Add event once | Moss pulse on feed row, then settle | 240ms | Static event |
| Share tender | Invite succeeds | Add member or success copy | Member chip appears with moss pulse | 180ms | Static chip |
| Gap answered | Save succeeds | Update gap and readiness state | Field save settle, ledger updates | 180ms | Static update |
| Evidence uploaded | Upload succeeds | Add document chip and citation count | Chip appears, `backs N` updates | 180ms | Static chip |
| Autofill started | User starts draft | Enter drafting state | Button loading, phase text | 80ms | Static loading |
| Autofill complete | Draft returns | Update cards and gaps | Group counts settle | 240ms | Static update |
| Marks select | Node/row selected | Reveal relationships | Edge trace once, unrelated dim | 240ms | Static dim/highlight |
| Export blockers | Export opened while blocked | Show blockers before action | Blocker list appears | 120ms | Static list |
| Export started | Valid export click | Gather response | Filed-page motion, then download state | 240ms to 360ms | Static success |
| Error recovery | Async failure | Stop loading and show action | Inline error reveal, retry focus | 120ms | Static error |

## Event Language

Motion should attach to real product events. These are the events worth
designing for:

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

Do not animate fake events. If the system cannot prove that something happened,
the UI should not perform as if it did.

## What Must Stay Still

- Matrix row height and column layout.
- Source document text.
- Evidence excerpt text.
- Legal decision copy.
- Raw tender metadata.
- Dense answer text.
- Export blocker list after it appears.
- Any control while a keyboard user is moving focus through a list.

## Implementation Notes

Implementation should be lightweight:

- Start with CSS custom properties in `src/app/globals.css`.
- Prefer CSS transitions and keyframes for small UI motion.
- Avoid adding a new animation library for basic app microinteractions.
- Use `motion-safe` and `motion-reduce` patterns where Tailwind supports them.
- Keep JS-driven animation limited to scrolly/demo choreography or measured
  source/graph transitions where CSS alone is not enough.
- Use `transform` and `opacity` for moving elements.
- Avoid animating layout properties in dense surfaces.
- Keep focus management explicit for dialogs, source overlays, and drawers.

Suggested CSS token block:

```css
:root {
  --motion-instant: 80ms;
  --motion-fast: 120ms;
  --motion-standard: 180ms;
  --motion-panel: 240ms;
  --motion-process: 360ms;
  --motion-feature: 520ms;
  --motion-hero: 700ms;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --ease-exit: cubic-bezier(0.3, 0, 1, 0.3);
  --ease-forest: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-record: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-stamp: cubic-bezier(0.34, 1.2, 0.64, 1);
  --ease-linear: linear;
}
```

## Rollout Plan

### Stage 1: Foundation

- Add motion tokens and reduced-motion overrides.
- Standardise button, icon button, nav, dialog, drawer, and focus feedback.
- Add immediate loading/disabled states to async controls.
- Check keyboard flows for source overlay, share dialog, comment thread, and
  requirement drawer.

### Stage 2: Work-Surface Microinteractions

- Add row focus, approval, flag, comment, activity, gap answered, evidence
  uploaded, and source highlight motion.
- Add processing step motion for tender packs.
- Add export blocker and export-start motion.

### Stage 3: Forest-Led Continuity

- Bring forest-guidance motion into upload, processing, collaboration presence,
  export success, and workspace primary actions.
- Keep matrix/source/evidence/marks in record discipline.

### Stage 4: Landing And `/demo`

- Tune landing hero, CTA, product shots, proof sections, and closing arrival.
- Tune `/demo` scrolly choreography around deal-breaker, source proof,
  collaboration, marks, and export.
- Verify that `/demo` teaches the real app interaction rather than a separate
  animated story.

### Stage 5: QA And Performance

- Test at 375px, 768px, 1440px, and wide desktop.
- Test reduced motion.
- Test low-powered device or throttled browser.
- Test keyboard-only operation.
- Check that text never overlaps during motion.
- Check that no animation delays review, approval, commenting, source checking,
  or export.

## Acceptance Checklist

- Motion tokens exist and are used consistently.
- Reduced motion works globally.
- Buttons, dialogs, drawers, overlays, and panels feel responsive.
- Upload and processing show useful progress.
- Source proof opens and highlights clearly.
- Approval, flagging, commenting, sharing, gap answering, and export all give
  immediate feedback.
- Collaboration feels live without becoming chatty.
- Forest motion is visible in arrival, guidance, processing, collaboration, and
  success.
- Record motion dominates matrix, source proof, evidence, approvals, marks, and
  export review.
- Landing and `/demo` feel connected to the multipage app.
- No serious work surface gains decorative looping motion.
