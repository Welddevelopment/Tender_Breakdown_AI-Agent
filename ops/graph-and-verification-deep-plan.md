# Bidframe — deep design plan: the graph, and claim/source verification

> Planning only — nothing built. Two hard problems, worked through widely to find the
> optimal shapes. Each part: an honest diagnosis of why the current thing doesn't land,
> the questions it must actually answer, a broad menu of options (with effort + trade-offs),
> then a recommended shortlist and a phased path. Grounded in the real code
> (`GraphView.tsx`, `RequirementPanel.tsx`/`SourceRef`, the schema, the Civic Record system).

Effort key: **S** ≈ hours · **M** ≈ 1–2 days · **L** ≈ 3+ days / needs backend or a dependency.

---

# PART A — The relationship graph

## A.1 Why the current graph doesn't land

The current `/graph` is a bespoke React-Flow map: requirement "register cards" stacked in a
left column (in criterion order), award criteria as recessed tabs on the right placed at the
vertical centroid of their group, edges for *scored-against* (req→criterion) and *depends-on*
(req→req, dashed forest), deal-breakers in oxblood. It's beautifully dressed. It still doesn't
*feel* good, and I think these are the reasons:

1. **It doesn't answer a question.** A bid manager opens it wanting one of: *where do the marks
   live?*, *what's at risk?*, *what do I have to answer before what?*, *did it miss anything?*
   The current map shows *structure* (everything wired to everything) but doesn't privilege any
   of those questions. Structure ≠ insight.
2. **It doesn't survive scale.** On the 527-requirement tender it's a wall. Even at a readable
   zoom (now fixed) it's hundreds of near-identical cards — high ink, low signal. The value of a
   graph is seeing *shape*; at this density there's no shape, just density.
3. **The dependency edges make local spaghetti.** req→req arrows inside the tall left column
   cross each other and the criterion edges.
4. **It reads as "a node graph," despite the styling.** Nodes + edges + zoom is the most generic
   data-viz gesture there is. For a product whose whole personality is the restrained civic
   record, a node soup is off-voice.
5. **Interaction is thin.** Click a node → jump to the matrix. No focus, no path-tracing, no
   filtering as the primary mode. A 500-node graph is only ever legible through focus, and there
   is none.

**The reframe worth holding onto:** the most valuable relationships in a public tender aren't
"everything to everything." They're (a) **how marks distribute across award criteria** (where to
spend effort), (b) **which requirements are deal-breakers and where they cluster**, and (c) **the
few genuine dependency chains** (answer order). Most requirements have *no* dependencies; forcing
them all into one graph buries the signal.

## A.2 What the graph must actually answer (evaluation criteria)

- **Q1 Marks:** which award criteria carry the most requirements / weight? Where do I spend time?
- **Q2 Risk:** where are the deal-breakers, and do they cluster in one area?
- **Q3 Order:** what must be answered before what (the real dependency chains)?
- **Q4 Coverage/gaps:** is every requirement mapped to a criterion? Any orphans/holes?
- **Scale:** legible at 20 *and* 500 requirements.
- **Glance-then-explore:** a strong first read in 2 seconds, depth on demand.
- **On-voice:** paper/ink restraint; status carries the stakes; feels like an instrument or a
  formal register, not a dashboard widget.

## A.3 The options

### Group 1 — Keep a graph, fix the layout/density
1. **Criterion-hub clustering (collapse/expand).** Criteria become hubs; their requirements
   cluster around them; a cluster shows a count and collapses to a single puck, expanding on
   click. Turns 527 cards into ~6 legible clusters. *Fit: good. Effort: M. Pro: scales, keeps the
   graph metaphor. Con: still a node graph; force layouts wobble and feel "physics-y," slightly
   off-voice.*
2. **Sugiyama layered DAG for dependencies.** `depends_on` is a DAG — lay it out in topological
   layers so answer-order reads left→right (roots left, dependents right). Makes Q3 the star.
   *Fit: strong for Q3. Effort: M (needs a layering pass; dagre or hand-rolled). Con: only
   meaningful for the minority of requirements that have dependencies.*
3. **Hierarchical edge bundling (radial).** Criteria on an arc, requirements grouped, edges
   bundled into rivers. Tames spaghetti and looks striking. *Fit: gorgeous but abstract. Effort:
   L. Con: a bid manager won't "get it" in 2s; reads as data-art, not a tool.*
4. **Criterion swimlanes.** Horizontal lanes, one per award criterion; requirement chips inside
   their lane; deal-breakers marked; dependency arrows drawn *between* lanes only. Reads as "the
   tender, organised by what it scores." *Fit: strong, on-voice (ledger-like). Effort: M. Scales
   by collapsing lanes. A quiet favourite.*

### Group 2 — Reframe: stop drawing a node graph (the strongest direction)
5. **"Where the marks live" — award-criteria bar-ladder / treemap.** The graph's real job as a
   single glance: award criteria sized by requirement count (or by scored weight if we can parse
   it), each bar segmented to show its deal-breakers in oxblood. One look answers Q1 + Q2. Click a
   bar → its requirements. *Fit: excellent, deeply on-voice (a ruled ledger of where the marks
   are). Effort: S–M. This is probably the highest value-per-effort idea in the doc.*
6. **Dependency "critical path" rails.** Don't graph all requirements — extract just the
   `depends_on` chains and render them as a few ordered rails ("answer these in order: req-7 →
   req-3 → req-12"). Most requirements have no chain and don't appear. Pure Q3 signal, no noise.
   *Fit: strong, actionable. Effort: M. Pairs naturally with #5 (marks) as a second panel.*
7. **Coverage heatmap (criteria × category).** A grid: rows = award criteria, cols = categories
   (certification / financial / experience / service-levels …), cells = count, oxblood tint if a
   deal-breaker sits there. A compliance *coverage map* — concentrations and holes at a glance
   (Q1, Q2, Q4). *Fit: excellent and maximally civic-record (it's a ledger/grid). Effort: M.*
8. **Sankey flow (requirements → criteria → score).** Ribbons flow from requirements into the
   criteria that score them; widths = counts/weight; deal-breakers as oxblood ribbons. One elegant
   picture of how the tender's demands distribute across the marks. *Fit: good, more "designy"
   than the ledger options. Effort: M–L (a Sankey layout). Con: can still get busy at 500.*
9. **The formal "schedule of cross-references" (a register, not a picture).** Lean all the way
   into the metaphor: render relationships as an indexed legal-style schedule — each criterion,
   its requirements listed with page/clause refs and deal-breaker marks, dependencies noted as
   "see req-7." Sortable, scannable, *printable*. *Fit: possibly the most on-brand and the most
   useful — bid managers live in tables. Effort: S–M. Con: not "a visualisation," which may
   disappoint the instinct that the graph should be visual; best paired with one visual (#5/#7).*

### Group 3 — Interaction as the fix (layer over any layout)
10. **Focus + context.** The full graph is never meant to be read at once. Click/hover a
    requirement → light its criterion and its full dependency chain, dim everything else to a
    ghost. The wall becomes an instrument you interrogate. *Fit: essential companion to any
    node-graph option. Effort: M.*
11. **Lens/filter as the primary mode.** You always view a *slice*: deal-breakers only · one
    criterion · one category · has-dependencies · needs-review. (There's already a category
    filter — promote filtering to the main interaction so the full graph is never the resting
    state.) *Fit: strong, cheap. Effort: S–M.*
12. **Search-to-focus.** At 500 nodes, navigation is search, not pan/zoom: type a requirement or
    criterion → the view pans/zooms/highlights it and its neighbourhood. *Fit: good utility.
    Effort: S–M.*

### Group 4 — Alternative metaphors
13. **Small multiples: one tidy constellation per criterion.** Instead of one giant graph, a grid
    of cards, each a small self-contained cluster (a criterion + its requirements + their internal
    deps). Each is legible; you page through them. *Fit: strong, scales by paging, very "register
    of sections." Effort: M.*
14. **Sunburst / radial hierarchy (tender → criteria → category → requirement).** Concentric
    rings sized by count, deal-breakers in oxblood, drill in by clicking a wedge. Whole structure
    in one shape. *Fit: good glance, familiar hierarchy read. Effort: M. Con: radial text is
    fiddly; slightly less on-voice than a ledger.*
15. **Document mini-map.** A vertical scale of the tender's pages with requirements pinned at
    their true page position; a side rail links each to its criterion; deal-breakers glow. The
    "graph" becomes *where in the 100 pages everything sits* — fuses structure with provenance
    (and sets up Part B beautifully). *Fit: distinctive, ties the two problems together. Effort:
    M. A dark-horse favourite.*

### Group 5 — The meta-question
16. **Does the graph earn a standalone tab at all?** Its two real insights (criterion grouping,
    dependency order) can live *in the matrix*: group/sort the matrix by award criterion; show a
    dependency badge inline ("answer after req-7"). Then `/graph` becomes an optional "map" rather
    than a headline feature. Worth honestly asking before investing in a rebuild. *Effort: S to
    fold into matrix.*

## A.4 Recommended shortlist (the optimal ones)

The instinct to make the *node graph* nicer is the trap. The win is **reframing the graph around
the three questions**, with the ledger/marks framing as the spine:

- **Primary: #5 "Where the marks live" (criteria bar-ladder/treemap)** + **#7 coverage heatmap** —
  together they answer Q1/Q2/Q4 in one glance, at any scale, dead on-voice. This is the new
  headline of `/graph`.
- **Secondary panel: #6 dependency critical-path rails** — answers Q3 with zero noise.
- **If you keep a spatial graph at all: #4 swimlanes + #10 focus + #11 filter** — the least
  node-soupy spatial option, made legible by focus/filter, rather than the current free layout.
- **Wildcard worth prototyping: #15 document mini-map** — because it doubles as the bridge to Part
  B (verification) and is the most "Bidframe" idea here.
- **Honest check: #16** — decide whether the standalone tab survives, or whether the graph's value
  folds into the matrix + a small "marks" panel.

**Optimal combination:** rebuild `/graph` as a *"Marks & structure"* page = a marks-ladder (#5) +
coverage heatmap (#7) + dependency rails (#6), with filter/focus throughout — and drop or demote
the free node graph. Keep #15 (mini-map) as a candidate hero for the demo.

---

# PART B — Claim & source verification

## B.1 Why the current verification doesn't land

Today a source is a mono ref ("p.14, Section 4.2.1") that expands *in place* to the verbatim
excerpt, plus an **"Open the page"** link that opens the raw PDF **in a new tab** at `#page=14`.
Answers show their evidence as citation lines ("Backed by your Capability Statement, p.4"). The
problems:

1. **It's a context switch, and you lose the claim.** A new tab, a whole page, and you're now
   hunting for the sentence yourself. The claim you were verifying is gone from view.
2. **No highlight = no proof.** `#page=14` lands on the page but doesn't point at the line. The
   product's entire promise is *"never take our word for it — every claim links to its clause."*
   The current moment makes you do the work; it doesn't *show* you the proof.
3. **The excerpt is shown, but not in situ.** Seeing the AI's excerpt next to the claim doesn't
   prove the AI didn't paraphrase or mis-locate it. Seeing it *highlighted inside the real
   document* is the trust payoff — and it's missing.
4. **Two provenance types, one weak treatment.** Requirements point into the **tender**;
   answers' `evidence_refs` point into the **bidder's capability docs**. Both are "claim → source"
   and both deserve the same crisp verification surface.

The user's instinct — *click a claim → split screen → the document on one side, scrolled to and
highlighting the exact part* — is exactly right. It's the paradigm of serious document-review
tools (Kira, Luminance, Relativity, Hebbia, Casetext). Below I widen it and find the sharpest form.

## B.2 Goals + criteria

- **In-context, no loss:** see the source *without* leaving the claim.
- **Point at it:** the exact sentence highlighted, not just the page.
- **Effortless trust:** the proof should feel instant and convincing (this is the emotional core
  of the product).
- **Both directions:** requirement↔tender and answer↔capability-doc.
- **Scale + speed:** verifying many claims in a session shouldn't be N tab-opens.
- **On-voice + honest:** if the excerpt doesn't exactly match the doc, *say so* (ties to the
  "it tells you when it's not sure" brand).

## B.3 The technical fork that governs everything (how do we highlight in a PDF?)

This decides feasibility and quality. Four plumbing approaches, cheapest → richest:

- **P1 — Native PDF `#page`, no highlight.** What we do now. Land on the page; show the excerpt
  beside it. *Effort: S. Quality: weak (no pointing).* Fine as a stopgap only.
- **P2 — PDF.js render + text-layer search highlight (client-side).** Render pages with PDF.js,
  read the text layer, `find` the excerpt string on the page, draw a highlight over the matches.
  **No backend/schema change.** *Effort: M (+ a PDF.js dependency). Quality: good when the excerpt
  text matches the PDF text (usually true — we extracted it from there); degrades on OCR'd/fuzzy
  text.* **This is the sweet spot.**
- **P3 — Stored bounding boxes from extraction (server-side truth).** At extract time, PyMuPDF
  `page.search_for(excerpt)` (or the span rects we already touch during ingest) → store
  `source_rect`/quads on the requirement + on each `evidence_ref` (additive, nullable schema
  change). Frontend overlays a pixel-accurate highlight on the rendered page. *Effort: L (backend
  + schema + frontend). Quality: best; robust to fuzzy text; also enables previews/thumbnails.*
- **P4 — Server-rendered highlighted page image.** Backend renders page N to an image with the
  highlight burned in (PyMuPDF can draw a rect + rasterise) and serves it. Frontend just shows an
  image — no client PDF lib, printable, demo-proof, works offline. *Effort: M–L (backend). Quality:
  great visually; less interactive (can't select/scroll the live doc).*

Recommendation on plumbing: **ship P2** (best quality-per-effort, no backend change), and **add P3
coordinates** as the robustness upgrade once the pipeline can afford it (it also unlocks previews,
thumbnails, and the honest "exact-match?" signal). P4 is a strong *demo/offline* complement.

## B.4 The options (UX shapes, mostly independent of the plumbing above)

1. **Split-screen provenance (the user's idea), MVP form.** Click a claim → the surface splits:
   claim + excerpt on the left, the tender PDF on the right at the page. With P1 no in-doc
   highlight; with **P2** the exact line is highlighted. *Fit: the core ask. Effort: M (P2).*
2. **Persistent "reader" workspace.** Two panes as a *mode*, not a modal: left = the list of
   claims/answers, right = the document, always open; selecting any claim scrolls+highlights the
   doc. The document is a permanent companion for a verification session. *Fit: best for a real
   audit pass; the Kira/Relativity paradigm. Effort: M–L.*
3. **Inline "source proof" expansion (proof comes to the claim).** Click a claim → it expands in
   place to a *cropped* slice of the page around the highlighted excerpt (not the whole doc). Low
   commitment, great for scanning dozens of claims without a full split. *Fit: excellent for the
   answers list. Effort: M (needs P2/P3/P4 to crop+highlight).*
4. **Hover-preview popover.** Hover a source ref → a small popover with the page thumbnail and the
   excerpt highlighted; click to open the full split for deep verification. Peek → open.
   *Fit: superb low-friction glance. Effort: M. Pairs with #1/#2.*
5. **Overlay lightbox.** Click → a focused lightbox over the app (page + highlight + claim);
   Esc back. Less layout disruption than a persistent split, more focus than a popover. *Fit: good
   middle ground. Effort: M.*
6. **Citation chips → source drawer.** In an answer, each cited claim is a chip; click → a drawer
   slides in with the source doc scrolled+highlighted, answer stays the home base. *Fit: keeps the
   answer central. Effort: M.*
7. **Bidirectional / dual-source split.** In the split, toggle (or three-pane) between the
   **tender** (why this requirement exists) and the **capability doc** (what backs our answer) —
   one surface for both provenance types. *Fit: strong; handles the whole trust story. Effort: L.*
8. **Match-confidence overlay (the honest trust signal).** When highlighting, show how well the
   AI's excerpt matches the doc text: exact = green tick, fuzzy/paraphrase = amber "approximate
   match — check wording." Surfaces extraction quality and flags the rare bluff. *Fit: uniquely
   on-brand (the honesty pillar). Effort: S–M on top of P2/P3.*
9. **Document-first view with claim pins (invert it).** Show the *tender* as the primary surface
   with requirements pinned as margin annotations at their exact locations (PDF-comment style);
   click a pin → the claim/answer. You verify by reading the doc with the AI's findings laid over
   it. *Fit: distinctive; doubles as a jaw-dropping demo ("look how thorough"). Effort: L (needs
   P3 coordinates). Ties to graph option #15.*
10. **"Verify all" audit mode.** A guided pass: step through every claim, the doc auto-scrolls and
    highlights each in turn, you tick "verified"; produces an auditable *"every claim checked
    against source"* artifact. *Fit: matches the compliance/audit ethos and the buyer's real need
    to defend the bid. Effort: M on top of a highlight surface.*
11. **Keyboard-driven verification.** j/k through claims, Enter opens the source, Esc back, v =
    mark verified — a power-audit flow. *Fit: great for heavy users. Effort: S over an existing
    surface.*
12. **Pre-rendered evidence "receipt" cards.** At draft time (P4), render a static
    cropped+highlighted image of each source region and store it; show it beside each claim — no
    live PDF needed, instant, printable, demo-proof. *Fit: brilliant for the demo + exports; less
    interactive. Effort: M–L backend.*
13. **Synced-scroll side-by-side.** In the persistent reader, scrolling the claims list scrolls
    the document to keep the current claim's source in view (and vice-versa). *Fit: premium feel.
    Effort: M on top of #2.*
14. **Provenance in the graph mini-map (cross-link to Part A #15).** Selecting a claim also lights
    its position on the document mini-map, giving a spatial "where in the 100 pages" sense
    alongside the highlight. *Fit: unifies the two problems. Effort: M (with #15).*
15. **Excerpt-only "quiet" upgrade (no PDF at all).** If PDF rendering proves heavy, at least make
    the *excerpt* the proof: show it verbatim, in the doc's context (the sentence before/after),
    with the matched phrase emphasised, and keep "Open the page" as the escape hatch. *Fit: cheap
    fallback that still improves trust. Effort: S (needs a little more context text stored).*

## B.5 Recommended shortlist (the optimal ones)

The user's split-screen instinct is the right spine. The sharpest version:

- **Core: #1/#2 split-screen (persistent reader) on plumbing P2** — click any claim → document on
  one side, **exact line highlighted**, claim on the other. Start as a summ-on-click split; grow
  into the persistent reader for audit sessions.
- **Scanning: #4 hover-preview + #3 inline proof** — so verifying *many* claims isn't N heavy
  opens; you peek, and only open the full reader when you want to dig.
- **Trust differentiator: #8 match-confidence overlay** — the honest "exact vs approximate" signal.
  Small effort, very on-brand, and it turns verification into a feature no competitor markets.
- **Both directions: #7** — one surface for tender↔requirement and capability-doc↔answer.
- **Robustness upgrade + demo: #9 document-first pins and/or #12 receipts on P3/P4** — once
  coordinates exist, these become possible and are the strongest *demo* material.

**Optimal path:** P2 + split-screen with text-layer highlight (#1→#2) + hover-preview (#4) +
match-confidence (#8), then invest in P3 coordinates to unlock document-first pins (#9), inline
proofs (#3), and printable receipts (#12).

---

# PART C — Cross-cutting notes

- **The two problems want to converge.** Graph option #15 (document mini-map) and verification
  option #9 (document-first pins) are the same surface seen from two sides: *the tender document as
  a first-class, navigable object with the AI's findings laid over it.* If one idea from this whole
  doc is worth prototyping first, it may be that shared surface — it reframes the graph **and**
  nails verification.
- **Schema additions to keep in mind (all additive/nullable, so no break):** for P3, a
  `source_rect`/quads on `Requirement` and on `EvidenceRef` (page-relative bounding boxes); for
  #8, an `excerpt_match` enum/score; for #15, per-doc `page_count` (already on `SourceDoc`). None
  of these block the P2 path.
- **Design-system fit:** highlights should use the signal palette honestly — forest for a verified
  match, amber for approximate, oxblood only where a deal-breaker's own source is shown. The reader
  panes are paper/paper-raised with the one 2px ink rule between them; the PDF sits on the recessed
  drafting surface (same language as the graph canvas).
- **Dependencies:** P2/P3 imply adding **PDF.js** (`pdfjs-dist`) — the first real frontend runtime
  dep beyond React Flow. Worth it for verification; note it against the repo's dependency-light
  instinct. P4 avoids it entirely at the cost of interactivity.
- **Effort snapshot:**
  - Graph headline (#5 marks + #7 heatmap + #6 rails, with filter/focus): ~**M–L**, no backend.
  - Verification core (P2 split + highlight + hover + match-confidence): ~**M–L**, +PDF.js, no
    backend.
  - The converged document surface (#15/#9) with precise pins: **L**, needs P3 backend coordinates.
- **Prior art to look at for specifics:** Kira Systems / Luminance / Relativity (legal doc review
  split + highlight), Hebbia and Casetext (answer-with-source-highlight), Adobe/PDF.js viewer text
  layer, Observable/D3 for the marks-ladder + Sankey, dagre for the dependency DAG layout.

## The one-line recommendations
- **Graph:** stop polishing the node graph; rebuild `/graph` around *"where the marks live"* (a
  ledger/marks-ladder + coverage heatmap + dependency rails), with filter/focus — and seriously
  consider the document mini-map as the hero.
- **Verification:** build the split-screen the user described, but make it *point at the line*
  (PDF.js text-layer highlight, P2), add a hover-peek and an honest exact-vs-approximate signal,
  and let it grow into a persistent reader / document-first surface.
