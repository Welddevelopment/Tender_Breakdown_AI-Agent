# Bidframe Delete List

## Principle

Use the adapted five-principle gate before removing anything:

1. Question: what decision, trust signal, or user recovery does this element support?
2. Delete: if it does not help the bidder review, prove, decide, export, or recover, remove it.
3. Simplify: if it is useful but repeated or over-explained, merge it into the nearest real workflow.
4. Accelerate: once the surface is smaller, make the remaining workflow faster and clearer.
5. Automate last: automation should enter only after the manual proof path is visible and trusted.

Guardrail: trust-critical source proof, the audit trail, export blockers, accessibility affordances, collaboration attribution, and reduced-motion support are not bloat. A feature can be complex and still be a Do-not-delete item if it protects Bidframe's promise: every requirement, decision, answer, and export must be checkable.

## Priority Key

- P0 delete before build: likely to mislead, create unsupported claims, bypass blockers, or confuse a judge in the demo.
- P1 simplify in stage: real value, but currently duplicated, over-promoted, or named inconsistently.
- P2 later cleanup: polish debt, stale comments, secondary labels, or low-risk copy cleanup.
- Do-not-delete: central to proof, review safety, accessibility, collaboration, or export integrity.

## Route-by-route findings

### /

- Keep because trust-critical: the public narrative, source-proof promise, real product states, deal-breaker framing, and demo booking path are the top of the buyer funnel.
- Delete: P2, UI Stage 7 - delete any decorative trail, pressed-leaf, pine, or seal motion that does not point attention toward a product state or proof claim.
- Merge/consolidate: P1, UI Stage 7 - consolidate the three hero actions ("Book a demo", "See it run", "See a tender pack") into one primary and one secondary action when analytics show split attention.
- Demote/deprioritise: P2, UI Stage 7 - demote the comparison table or proof scrolly length if the first viewport no longer leaves enough hint of the product below.
- Rename/reword: P1, UX Stage 7 - align CTA language across landing, FAQ, demo, and thank-you. Prefer "See worked example" or "Open demo" consistently instead of rotating between "See it run", "See a tender pack", and "worked example".
- Needs evidence before deleting: keep the forest identity and product-shot sections unless scroll depth, heatmap, or user sessions prove visitors are not reaching the demo/book actions.

### /demo

- Keep because trust-critical: the frozen Bradwell walkthrough, proof band, real source overlay, and read-only matrix show the promise without requiring an account or backend.
- Delete: P1, UI Stage 7 - delete ghost-cursor or cinematic beats that do not teach a real action, especially if they make the demo feel more like theatre than product inspection.
- Merge/consolidate: P1, UI Stage 7 - merge repeated "book demo" links inside the scrolly, intro, and closing into one primary CTA per visible section.
- Demote/deprioritise: P2, UI Stage 7 - demote graph annotations if the worked matrix already makes the same point on the same screen.
- Rename/reword: P1, UX Stage 7 - replace "showcase" language in comments and any exposed copy with "demo" or "worked example"; replace "See a deal-breaker in the document" with the canonical "Show source" pattern where possible.
- Needs evidence before deleting: do not delete the scrolly itself without evidence that users prefer the static worked example; it is the main cold-visitor education path.

### /upload

- Keep because trust-critical: tender intake, staged multi-file rows, per-file rejection, processing progress, and the tender library are the start of the real product.
- Delete: P0, UI Stage 4 - remove or conditionally hide the processing step "Draft first answers from your evidence" when no capability evidence has been uploaded. It overclaims during a tender-only upload.
- Merge/consolidate: P1, UX Stage 1 and UI Stage 4 - keep upload and library together, but merge `/tenders` promotion into `/upload`; `/upload` is the tender register.
- Demote/deprioritise: P1, UI Stage 4 - demote sample cards in preview builds to one current worked example unless both samples are maintained.
- Rename/reword: P1, UI Stage 4 - change "View extracted requirements" and "View sample matrix" to a single product action such as "Open matrix"; replace em dash copy in rejection and empty states with commas or sentence breaks.
- Needs evidence before deleting: keep no-API scripted replay unless live deployments never need offline demo mode. It is valuable if clearly labelled as sample playback.

### /review

- Keep because trust-critical: the compliance matrix, gating hero, source panel, decision controls, keyboard navigation, focus mode, and gating approval confirmation are the core product.
- Delete: P1, UX Stage 2 - delete the visible keyboard shortcut sentence from the main matrix surface and move shortcut discovery into the command palette or help affordance.
- Merge/consolidate: P1, UX Stage 1 and UI Stage 2 - merge the global section nav and per-tender view switcher into one clear workspace navigation model. Do not make users choose between "Bid/Matrix/Graph" in two places.
- Demote/deprioritise: P1, UX Stage 1 - collapse or move `ControlPanel`, `ShareControl`, and `ActivityFeed` into an expandable tender record/header area so the matrix starts closer to the work.
- Rename/reword: P1, UX Stage 2 and UX Stage 3 - replace generic "Next" with the next action, for example "Review next deal-breaker" or "Export matrix"; standardise proof actions on "Show source".
- Needs evidence before deleting: `FocusMode` and `CommandPalette` add complexity, but they may be high-value for repeated review. Demote before deleting and measure use.

### /answers

- Keep because trust-critical: answer drafting, evidence receipts, open questions, readiness ledger, and export blockers are central to the bid-response promise.
- Delete: P0, UI Stage 5 - delete or gate any export entry point that can bypass readiness blockers. The export menu in the filter bar and the ledger completion export must have one source of truth.
- Merge/consolidate: P1, UX Stage 5 - merge readiness, filter, and export controls so the response workflow has one obvious "ready to export" area.
- Demote/deprioritise: P1, UI Stage 5 - demote Markdown and plain-text export formats until there is evidence they matter; Word/PDF are the likely buyer-facing formats.
- Rename/reword: P1, UX Stage 5 - rename the route surface from "Answers, with receipts" to "Bid response" in visible navigation; replace visible "autofill" copy with "draft answers" or "draft from evidence".
- Needs evidence before deleting: the route intentionally lacks `AuthGate` so the seeded demo opens instantly. Confirm the live build cannot expose customer data before changing this.

### /graph

- Keep because trust-critical: marks, award criteria, dependency order, and structure are useful when they help bidders decide what to answer first.
- Delete: P1, UX Stage 6 - delete "Graph" as the public label. It sounds like a feature demo; "Marks" or "Marks & structure" sounds like bid work.
- Merge/consolidate: P1, UX Stage 6 - keep ledger and map linked, but consider defaulting to ledger and making map a secondary lens for tenders with real dependencies.
- Demote/deprioritise: P1, UI Stage 6 - demote mini-map, graph key, split/ledger/map mode switch, and animated edge intro when the tender is small or dependencies are absent.
- Rename/reword: P1, UX Stage 6 - replace "Ledger", "Map", and "Split" labels with bid-language labels if testing shows they read as tool internals.
- Needs evidence before deleting: do not delete the map wholesale until large or dependency-heavy tenders are tested. The graph may be low value on Bradwell but high value on bigger packs.

### /teams

- Keep because trust-critical: teams, member roles, and attribution support collaboration and the audit trail.
- Delete: P2, UI Stage 6 - delete mock-preview team explanations once the live product is the only target, but keep honest preview copy while no-API builds exist.
- Merge/consolidate: P1, UX Stage 4 and UI Stage 6 - merge team creation and tender sharing language so users understand the flow: create team once, share a tender from the tender.
- Demote/deprioritise: P1, UX Stage 4 - keep `/teams` as an account/admin utility rather than a primary tender workflow section.
- Rename/reword: P1, UI Stage 6 - replace "Your teams" with "Teams" or "Team access" if it appears beside tender-specific language.
- Needs evidence before deleting: do not remove the route because it looks administrative. Multi-user access is part of the collaboration promise and activity attribution.

### /pack

- Keep because trust-critical: the frozen mixed-pack walkthrough proves PDF, Word, Excel, CSV, and ZIP provenance without a backend.
- Delete: P1, UI Stage 7 - delete stale references that describe `/pack` as "the same interactive product as /showcase"; the user-facing story should not depend on excluded/internal routes.
- Merge/consolidate: P1, UI Stage 4 and UI Stage 7 - merge `/pack` and `/demo` entry points if users cannot tell which public example to open.
- Demote/deprioritise: P1, UX Stage 1 - demote `/pack` from primary navigation once live upload can demonstrate mixed packs reliably.
- Rename/reword: P1, UI Stage 4 - call it "Mixed-pack example" or "Tender pack example"; avoid generic "pack walkthrough" if linked from product UI.
- Needs evidence before deleting: keep the route while upload is still demo-risky or source rendering for Office files needs an offline proof path.

### /tenders

- Keep because trust-critical: keep the redirect for old links, browser history, and external references.
- Delete: P1, UX Stage 1 - delete `/tenders` as a promoted product surface. `/upload` is now the tender library.
- Merge/consolidate: P1, UX Stage 1 - merge all tender-list language, docs, and CTAs into `/upload`.
- Demote/deprioritise: P2, UX Stage 1 - leave the redirect quietly in place rather than designing a separate page.
- Rename/reword: P2, UX Stage 1 - if any visible copy still says "Tenders", use "Tender library" or "Tender register" consistently.
- Needs evidence before deleting: do not remove the redirect until logs show no traffic or bookmarks use it.

### /login

- Keep because trust-critical: invite-only sign-in, internal `next` redirect validation, preview-build errors, and Google sign-in gating protect customer access.
- Delete: P2, UI Stage 7 - delete duplicate booking CTA treatment if the header and login page compete visually.
- Merge/consolidate: P1, UI Stage 7 - use the shared booking component or shared booking copy rather than a hard-coded Cal.com link inside login.
- Demote/deprioritise: P2, UI Stage 7 - keep "No account yet?" quiet; this page's primary job is access, not conversion.
- Rename/reword: P1, UX Stage 1 - "Bidframe is available to invited accounts" is clear. Keep it, but avoid any registration language elsewhere.
- Needs evidence before deleting: do not delete Google sign-in affordance just because it is hidden in some configs. It is correctly gated by configuration.

### /faq

- Keep because trust-critical: FAQ supports trust, SEO, and buyer objections around control, source checking, uncertainty, and public-sector tender packs.
- Delete: P2, UI Stage 7 - delete FAQ questions that duplicate landing sections verbatim once SEO value is known.
- Merge/consolidate: P2, UI Stage 7 - merge the FAQ closing CTA vocabulary with landing and demo CTAs.
- Demote/deprioritise: P2, UI Stage 7 - keep FAQ out of product navigation; it belongs in public/marketing navigation.
- Rename/reword: P2, UI Stage 7 - "Questions before you trust the record" is on-brand but abstract. Test "Questions before you use Bidframe" or "Questions about Bidframe" if clarity drops.
- Needs evidence before deleting: do not delete FAQ items before search and support-question evidence exists.

### /thank-you

- Keep because trust-critical: the post-booking page confirms the demo and gives visitors a calm next step.
- Delete: P2, UI Stage 7 - delete decorative hero-enter motion if it feels theatrical on a utility confirmation page.
- Merge/consolidate: P2, UI Stage 7 - merge its two next actions with global CTA language: "See worked example" and "Back to Bidframe".
- Demote/deprioritise: P2, UI Stage 7 - keep it short; do not add proof bands, product shots, or extra conversion copy here.
- Rename/reword: P2, UI Stage 7 - replace "Bring one tender you have already bid and we'll read it live" only if sales wants a softer ask.
- Needs evidence before deleting: do not delete the page itself. Cal.com redirect closure prevents a dead end after booking.

## Component-level deletion candidates

| File path | Candidate | Priority | Stage |
|---|---|---:|---|
| `frontend/src/components/SectionNav.tsx` | Delete the "Graph" label and replace with "Marks" or "Marks & structure". | P1 | UX Stage 6 / UI Stage 2 |
| `frontend/src/components/DocumentHeader.tsx` | Delete or merge the second per-tender switcher (`Matrix`, `Bid`, `Graph`) if the global section nav remains. | P1 | UX Stage 1 / UI Stage 2 |
| `frontend/src/components/DocumentHeader.tsx` | Delete generic "Next" as a primary action label. Use the next real action. | P1 | UX Stage 2 |
| `frontend/src/components/MatrixView.tsx` | Delete the visible keyboard shortcut line from the matrix surface; keep shortcuts discoverable elsewhere. | P1 | UX Stage 2 |
| `frontend/src/components/MatrixView.tsx` | Delete `stageReturnHref` and the "Live walkthrough" strip only if `/showcase` and pitch handoff are retired. | Needs evidence | UI Stage 7 |
| `frontend/src/components/MatrixView.tsx` | Delete the mixed-pack explainer as a permanent top-of-matrix panel after Stage 4 proves file provenance in rows and source panels. | P1 | UI Stage 4 |
| `frontend/src/components/ControlPanel.tsx` | Delete duplicate stat-card presentation; merge tender pack, people, and decision log into a compact tender record. | P1 | UX Stage 1 / UI Stage 2 |
| `frontend/src/components/ActivityFeed.tsx` | Delete default-open activity placement below the header; keep activity collapsed or integrated into the tender record. | P1 | UX Stage 4 / UI Stage 6 |
| `frontend/src/components/ShareControl.tsx` | Delete vague button label "Share"; rename to "Share tender". | P1 | UX Stage 4 |
| `frontend/src/components/ShareControl.tsx` | Delete confusing "Teams in the header" copy if Teams remains in account controls rather than the visible header nav. | P1 | UX Stage 4 |
| `frontend/src/components/ComplianceMatrix.tsx` | Delete duplicate group-level "Approve all confident" affordance if `BulkActionBar` owns bulk approval. | P1 | UX Stage 2 |
| `frontend/src/components/RequirementPanel.tsx` | Delete competing proof labels ("See it in the document") and use "Show source" consistently. | P1 | UX Stage 3 |
| `frontend/src/components/RequirementPanel.tsx` | Demote the full explainability block into progressive disclosure for non-gating rows; do not delete source, confidence, evidence, or gating rationale. | P1 | UX Stage 3 |
| `frontend/src/components/RequirementPanel.tsx` | Delete generic panel "Next"; rename based on group or remaining priority. | P1 | UX Stage 2 |
| `frontend/src/components/SourceVerifyOverlay.tsx` | Do not delete. It is the source-proof loop. Fix focus return/trap issues rather than removing it. | Do-not-delete | UX Stage 3 / QA |
| `frontend/src/components/PdfSourceView.tsx` | Do not delete exact/approx highlighting. It is trust-critical proof, even when imperfect. | Do-not-delete | UX Stage 3 |
| `frontend/src/components/DocxSourceView.tsx` | Do not delete Office source rendering. It prevents fake PDF proof on non-PDF rows. | Do-not-delete | UX Stage 3 / UI Stage 4 |
| `frontend/src/components/SheetSourceView.tsx` | Do not delete sheet/CSV source rendering. It supports mixed-pack trust. | Do-not-delete | UX Stage 3 / UI Stage 4 |
| `frontend/src/components/NoTenderLoaded.tsx` | Delete generic dead-end copy; replace with a recovery state that can upload, reopen recent tenders, or open a worked example. | P1 | UX Stage 1 |
| `frontend/src/components/UploadDropzone.tsx` | Delete unsupported tender-upload copy that implies evidence-based answer drafting before evidence exists. | P0 | UI Stage 4 / UI Stage 5 |
| `frontend/src/components/UploadDropzone.tsx` | Delete stale sample language and align sample route/counts with the current mixed-pack example. | P1 | UI Stage 4 |
| `frontend/src/components/ProcessingView.tsx` | Delete or conditionally hide the "Draft first answers from your evidence" pipeline step during tender-only ingest. | P0 | UI Stage 4 / UI Stage 5 |
| `frontend/src/components/TendersList.tsx` | Delete duplicate stale sample cards or reduce to one maintained worked example. | P1 | UX Stage 1 |
| `frontend/src/components/AnswersBody.tsx` | Delete em dash copy and replace with shorter response-workflow copy. | P2 | UI Stage 5 |
| `frontend/src/components/AnswerFilterBar.tsx` | Delete always-visible export if it bypasses readiness; otherwise show the same blockers as the ledger. | P0 | UI Stage 5 |
| `frontend/src/components/ReadinessLedger.tsx` | Do not delete export blockers or readiness counts. They protect submission trust. | Do-not-delete | UX Stage 5 |
| `frontend/src/components/ExportMenu.tsx` | Demote or delete Markdown/plain-text formats until demand is proven. Keep Word/PDF. | Needs evidence | UI Stage 5 |
| `frontend/src/components/AutofillButton.tsx` | Delete visible sample "autofill" vocabulary and em dash copy; use "draft answers from sample evidence". | P1 | UX Stage 5 |
| `frontend/src/components/AnswerPanel.tsx` | Delete "Run autofill" wording. Use "Draft answers" or "write this answer yourself". | P1 | UX Stage 5 |
| `frontend/src/components/CapabilityUpload.tsx` | Delete em dash sample copy; keep evidence upload and library counts. | P2 | UI Stage 5 |
| `frontend/src/components/StructureView.tsx` | Demote the map mode when no dependencies or criteria exist; keep the marks ledger as the default. | P1 | UX Stage 6 |
| `frontend/src/components/GraphView.tsx` | Delete decorative graph build-in/edge motion if it slows comprehension or fails reduced-motion QA. | P1 | UI Stage 6 |
| `frontend/src/components/GraphView.tsx` | Delete standalone instructional line "Click a requirement..." if embedded drawer affordances make it redundant. | P2 | UI Stage 6 |
| `frontend/src/components/MarksView.tsx` | Do not delete award criteria grouping or dependency ordering. They are the useful part of `/graph`. | Do-not-delete | UX Stage 6 |
| `frontend/src/components/TeamsManager.tsx` | Do not delete team membership and role controls. They support collaboration attribution. | Do-not-delete | UX Stage 4 |
| `frontend/src/components/demo/DemoScrolly.tsx` | Demote repeated booking CTAs and delete any beat that does not teach the real product flow. | P1 | UI Stage 7 |
| `frontend/src/components/demo/ScrollyStage.tsx` | Delete decorative cursor or flourish motion if it reads as fake automation instead of guided product state. | P1 | UI Stage 7 |
| `frontend/src/components/landing/Landing.tsx` | Consolidate duplicate public CTAs and delete decorative sections that do not increase demo or booking intent. | P1/P2 | UI Stage 7 |
| `frontend/src/components/landing/TrailDescent.tsx` | Needs evidence before deleting. It is decorative by design, but may support brand continuity. | Needs evidence | UI Stage 7 |
| `frontend/src/components/landing/ProductShots.tsx` | Do not delete product shots. Replace static/fake-looking states with real app states if needed. | Do-not-delete | UI Stage 7 |

## Cross-route/global deletion candidates

- Duplicate CTAs: the public flow repeats booking, demo, worked example, and tender-pack CTAs. Keep one primary action per viewport and one clear secondary.
- Confusing labels: "Graph", "Ledger", "Map", "Next", "Share", "autofill", "See it in the document", and "Export response" compete with the planned product language.
- Dead states: generic "No tender loaded" states should become recovery states, not dead ends.
- Decorative motion: graph build-ins, hero-enter on utility pages, ghost cursor moments, botanical draw-ons, and trail motion should remain only where they guide attention or brand memory.
- Redundant panels: `ControlPanel`, `ActivityFeed`, `ShareControl`, readiness/export, and tender-view navigation repeat information that belongs in one workspace header or tender record.
- Stale `/showcase` references: keep excluded `/pitch` and `/showcase` untouched, but clean shared comments/copy that describe active routes as showcase when those routes are demo, pack, or live product.
- Low-value badges: "live UI", "Sample", generic source badges, and count badges should stay only when they disambiguate real, sample, PDF, Word, Excel, CSV, or ZIP provenance.
- Over-explained copy: matrix shortcut text, long mixed-pack explanation, repeated demo proof explanations, and source-proof paragraphs should become progressive disclosure.
- Fake or unsupported states: never show source highlights for Office rows as if they were PDF pages; never imply evidence-backed answers before evidence exists; never show collaboration presence or activity without a real actor or clear sample mode.
- Collaboration recovery states are not clutter: invite failure, pending access, lost permission, reconnecting, simultaneous edit, former teammate, and blocker-comment states protect the record and should be simplified before they are deleted.
- Accessibility and reduced motion: delete motion, not accessibility. Focus management, keyboard paths, ARIA labels, print styles, and reduced-motion CSS are protected.

## Stage Mapping

| Stage | Delete/simplify work |
|---|---|
| UX Stage 1 - Workspace Orientation | Merge `/upload` and tender-library language, retire `/tenders` as a promoted surface, simplify app navigation, improve no-tender recovery states. |
| UX Stage 2 - Matrix Review Flow | Remove shortcut copy from the main matrix, rename generic next actions, consolidate bulk approval affordances, keep gating confirmation. |
| UX Stage 3 - Source Proof Loop | Standardise on "Show source", collapse over-explained proof blocks, keep PDF/Office/sheet source rendering and exact/approx proof. |
| UX Stage 4 - Collaboration At The Work Item | Collapse activity/share into the tender record, rename share actions, keep teams, members, roles, comments, and attribution. |
| UX Stage 5 - Bid Response Workflow | Gate duplicate exports behind readiness, rename autofill language, keep open questions, evidence receipts, and blockers. |
| UX Stage 6 - Marks And Strategy | Rename Graph to Marks, default toward the ledger, demote decorative map controls on small/simple tenders, keep criteria and dependency insight. |
| UX Stage 7 - UI Improvement / Forest-Led Continuity | Consolidate public CTAs, remove stale showcase language from active routes, trim decorative motion, keep real product shots and demo proof. |
| UI Stage 1 - Foundation and motion tokens | Delete motion that lacks workflow meaning; preserve reduced-motion support. |
| UI Stage 2 - Workspace header/navigation | Resolve duplicate navigation and tender-view switchers. |
| UI Stage 3 - Matrix/source proof | Unify proof labels and prevent proof UI from becoming decorative. |
| UI Stage 4 - Tender intake/processing | Remove unsupported evidence-drafting claims from tender-only upload. |
| UI Stage 5 - Bid response/export | Create one blocker-aware export path. |
| UI Stage 6 - Collaboration/audit | Keep attribution, demote noisy placement. |
| UI Stage 7 - Landing/demo continuity | Simplify public route CTAs, stale names, and ornamental motion. |

## Default Decisions And Remaining Questions

- `/answers`: keep the current demo-safe exception for now. Do not wrap it in
  `AuthGate` during UX Stage 1 unless live customer data can be exposed.
- `/pack`: keep as a public worked example until mixed-pack upload is reliable
  in the live product, then demote it from primary navigation.
- `/tenders`: keep the redirect quietly for legacy links. `/upload` is the
  promoted tender library.
- Export formats: Stage 5 defaults are DOCX for bid response, XLSX/CSV for the
  compliance matrix, and PDF or DOCX for the audit/evidence pack. Markdown and
  plain text stay demoted until a user asks for them.
- `FocusMode` and `CommandPalette`: keep them, but hide persistent shortcut copy
  from the main matrix surface until usage proves it belongs there.
- Teams: keep `/teams` as account/admin utility. In-workspace `People` and
  `Share tender` become the primary collaboration entry points later.
- `TendersList` samples: preview builds should point to one maintained worked
  example, preferably the mixed-pack example.
- `/graph`: rename the visible scent to `Marks`; keep the map as a secondary
  lens until larger dependency-heavy tenders prove whether it should lead.
- Public CTA phrase: use `Open demo` for the public demo route and `See worked
  example` for the product example. Avoid rotating labels in the same flow.
