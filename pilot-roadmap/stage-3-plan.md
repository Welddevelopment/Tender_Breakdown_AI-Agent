# Stage 3 Plan — Forest Push, Device-Kit Trueing, the Resolve, and /graph Polish

Owner: Jawad (frontend + design lead) · Drafted: 2026-07-08 by the planning pass
Reads with: `frontend/design-language.md` (canonical identity), `frontend/SLOP-CHECK.md`
(taste gate), `frontend/UI/UX/Motion Overhaul/MOTION.md` (motion spec),
`pilot-roadmap/frontend-jawad.md` (the lane brief).

> **Naming note.** The repo carries two unrelated stage ladders. This document uses the
> founder's ladder (Stage 1 = design uplift, Stage 2 = matrix review flow, **Stage 3 =
> this plan**). The overhaul folder's internal "Stage 0–7" pipeline
> (`UI/UX/Motion Overhaul/implementation.md`) is a different numbering; where relevant,
> founder-Stage-3 maps onto overhaul Stages 1 (tokens), 3/4 (record + intake), and 7
> (forest continuity).

---

## Headline from the audit (read this before anything else)

Four parallel code audits (2026-07-08, against `main` @ `2a2066e`) found Stage 3 is
**mostly smaller than scoped**:

- **/graph linked workspace: already shipped end-to-end.** Shared selection spine,
  segmented Split·Ledger·Map control, shared filter bar, swimlanes, minimap, path
  tracing with dimming, drawer-over-workspace — all live (`StructureView.tsx:20-28`
  says "rebuilt as one linked workspace"). What's left is a short polish list.
- **Device kit: 3 of 6 devices done** (ruled margin, mono record voice, approval stamp
  incl. settle + reduced-motion). The other 3 are partial with small, precise gaps.
- **Forest: landing and /demo are near-saturated already.** The real "more forest"
  headroom is in exactly three places: the upload→matrix **arrival moment** (today a
  paper card with a green button), the **moss chrome** (barely-green tint), and
  **collaboration presence** (a rainbow avatar palette, forest not leading).
- **The resolve transition is the one genuine build.** Both halves exist
  (RegisterPreview inking-in on `/upload`; a Motion-driven staged matrix entrance on
  `/review`) but they are two disjoint animations separated by a hard
  `router.push("/review")` after an arbitrary 1800ms — the spec's "plays in place, no
  page swap" (`layout.md §9`) is unmet.
- **No named motion tokens exist anywhere in `src/`.** ~60 inline duration/easing
  literals, dominated by two curves. `MOTION.md` already specifies the full token set;
  the token task is adoption + consolidation, not invention.

Consequence: Stage 3 re-sequences as **one small prerequisite (tokens), two parallel
restyle passes (record trueing, forest push), one real motion build (the resolve), and
one small polish PR (/graph)**.

---

## Workstream 0 (prerequisite) — Motion token layer

### Current state
- `MOTION.md:178-261` fully specifies 7 duration tokens (`--motion-instant` 80ms →
  `--motion-hero` 700ms), 7 easings (incl. `--ease-stamp` `cubic-bezier(0.34,1.2,0.64,1)`),
  movement limits, and a global reduced-motion override block.
- `globals.css` has **zero** named motion tokens. De-facto constants across ~40
  keyframes: `cubic-bezier(0.22,1,0.36,1)` (the settle/quint-out, 30+ uses) and
  `cubic-bezier(0.34,1.56,0.64,1)` (the stamp/spring overshoot). Duration ladder in use:
  150 / 220–300 / 360–480 / 500–550 / 600–740 / 900–1050ms.
- Reduced motion today is per-surface: animation lives inside
  `@media (prefers-reduced-motion: no-preference)` blocks and base classes encode the
  composed end state (e.g. the stamp's static `rotate(-3deg)` at `ApprovalStamp.tsx:25`).
  There is no global `1ms` blanket.

### Decisions (made here so the implementer doesn't re-litigate)
1. **Adopt the MOTION.md token names and values verbatim** into a `:root` block in
   `globals.css`, plus two mapping aliases for the curves the codebase already speaks:
   - `--ease-settle: cubic-bezier(0.22, 1, 0.36, 1)` — the existing dominant quint-out;
     name it explicitly since Stage 3 briefs reference an "ease-settle".
   - `--ease-stamp: cubic-bezier(0.34, 1.56, 0.64, 1)` — keep the **shipped** overshoot
     (1.56), not MOTION.md's softer 1.2. Reason: the stamp settle is live, approved, and
     re-timing it is churn with no gain. Note the divergence in a comment.
2. **Do NOT retro-time the 40+ existing keyframes.** New Stage 3 work uses tokens;
   existing animations migrate opportunistically when a task already touches their file.
3. **Do NOT adopt MOTION.md's global `* { animation-duration: 1ms }` blanket** for
   reduced motion. The codebase's composed-end-state pattern (opt-in `no-preference`
   gates + static base classes) is stricter and already correct; a blanket override
   risks re-enabling half-states in keyframes that were designed never to run. Instead:
   the token block gets a `prefers-reduced-motion: reduce` override setting the
   `--motion-*` durations to 1ms, so token-consuming animations degrade automatically,
   and every new animation must still ship its composed end state on the base class.
   This is a deliberate, nameable departure from MOTION.md:240-260; record it there.

### Tasks
| # | Task | Model | Size |
|---|------|-------|------|
| 0.1 | Add the token block (`--motion-*`, `--ease-*` incl. `--ease-settle`) + reduced-motion token override to `globals.css`; comment each with its MOTION.md use case | Sonnet | XS |
| 0.2 | Update `MOTION.md` implementation notes: record the 1.56 stamp curve and the composed-end-state reduced-motion policy as the adopted variants | Sonnet | XS |

**Forest/record call:** n/a — infrastructure. Everything downstream consumes it.

---

## Workstream 1 — Civic-record device-kit trueing (RECORD side)

### Current state (audit, per device)
| Device | Verdict | Evidence |
|---|---|---|
| 1 Masthead | PARTIAL | Fraunces 600/24 title ✅ (`DocumentHeader.tsx:77-79`), real-metadata mono ref line ✅ (`:82-84`, built `:51-63`), 2px ink rule ✅ via `SiteHeader.tsx:44` `border-b-2 border-ink`. **Missing: the mono "BIDFRAME" running head** (~11px, 0.12em tracking, ink-muted); today the lockup is a Fraunces SVG wordmark (`BrandLogo.tsx:37-47`). |
| 2 Rule hierarchy | PARTIAL | All three tokens defined correctly (`globals.css:60-62`) but **only the pitch deck consumes them**; proof surfaces use Tailwind equivalents (`border-b-2 border-ink`, `border-moss-line`, `border-hairline`). Visually consistent, structurally divergent. |
| 3 Register | PARTIAL | Ref margin column exists, mono, right-aligned ✅ (`ComplianceMatrix.tsx:347-385`). **Deviations:** 80/92px (98/112 selectable) vs spec's ~52px (`:127-132`); PDF rows show `p.{source_page}` not `source_clause` (`:234-237`, clause only in tooltip); `text-accent/85` 11px vs spec's ink-muted 12px. Spine correctly drops the column ✅ (`RequirementSpine.tsx:38-62`). |
| 4 Ruled margin | DONE | 64ch prose column (`RequirementPanel.tsx:47-51`), container-query `@2xl:border-l` hairline margin (`:70-73`), mono citations/audit line (`:309-322`, `:693-694`), pressed evidence `--depth-pressed` on `bg-paper-recessed` (`:370,464,501,705`). |
| 5 Mono record voice | DONE | Consistent `font-mono` on refs/ids/timestamps/status across matrix, panel, spine, header, ledger, stamp. |
| 6 Approval stamp | DONE | `ApprovalStamp.tsx`: forest tick + mono "Approved", static `rotate(-3deg)` base, `stamp-settle` 0.5s overshoot gated `no-preference` (`globals.css:340,531-540`), "Approved by you, 14:32" line, wired into panel/completion/demo/landing. |

### What's genuinely left
Three surgical fixes. Nothing here is a rebuild.

| # | Task | Detail | Model | Size |
|---|------|--------|-------|------|
| 1.1 | Masthead running head | Add the mono "BIDFRAME" running head (uppercase, ~11px, tracking 0.12em, ink-muted) to the app masthead per design-language.md device 1. Decide its seat against the existing SVG wordmark: the running head belongs in the **DocumentHeader title zone** (above the Fraunces title, forming the three-part nameplate), NOT as a SiteHeader logo replacement — the SiteHeader lockup stays. | Fable (placement is a taste call), then Sonnet to land | S |
| 1.2 | Rule-token migration | Swap proof-surface Tailwind borders to the semantic tokens: masthead 2px → `[border-bottom:var(--rule-strong)]`, triage-group and panel-zone dividers → `--rule-section`, row/minor lines → `--rule-hair`. Files: `SiteHeader.tsx`, `DocumentHeader.tsx`, `ComplianceMatrix.tsx`, `RequirementPanel.tsx`, `ControlPanel.tsx`. Mechanical; the pixels should not change. Enforce "one `--rule-strong` per screen" by grep during review. | Sonnet | S |
| 1.3 | Register trueing | (a) Ref cell shows real `source_clause` when present, falling back to `p.{page}` only when the clause is absent (invert today's PDF logic at `ComplianceMatrix.tsx:234-237`); keep the full-ref tooltip. (b) Colour to ink-muted, size to 12px — **decision:** the accent teal carries the "traceable to source" meaning, but design-language.md device 3 explicitly wants an ink-muted ledger edge that stays subordinate; teal on 50+ rows is louder than the device intends. Follow the spec; teal stays on the click-to-source *action*, not the passive register. (c) Narrow the ref column **toward** 52px, but validate against real Bradwell clause strings first (e.g. "Section 4.2.1" truncation behaviour) — if real refs need ~64px, take 64px and note the departure; the spec's number is a target, not scripture. | Sonnet (with Fable eyeballing the width call on real data) | M |

**Forest/record call:** pure record. No forest anywhere in this workstream. The stamp
(device 6) is the one sanctioned forest mark and is already correct.

**Note:** the approval-stamp SETTLE named in the Stage 3 brief is **already shipped** —
do not rebuild. Its only Stage 3 touch is token migration (`--motion-*`/`--ease-stamp`)
under task 0.1's opportunistic-migration rule if 1.x touches the file.

---

## Workstream 2 — The forest push (BRAND side)

### Current state (audit)
- **Landing (`Landing.tsx`): forest-LED, deep.** Woodland photo hero, pine proof/closing
  bands, treeline threshold, trail descent, pine-deep footer. Near-saturated.
- **/demo: forest-led, and the scrolly IS BUILT** — 7 beats in `demo/steps.ts:25-74`
  (problem→extraction→catch→honesty→autofill→control→map), oxblood deal-breaker beat
  present (`DemoView.tsx:207`, `bg-signal-oxblood` bead `:328`), pine title card, fern
  fronds. Little headroom.
- **Upload→arrival: TINTED only — the weakest brand moment.** Dropzone has forest
  accents (`UploadDropzone.tsx:481-540`); `ProcessingView` is a forest progress bar on a
  paper card; the **completion/arrival card is `bg-paper-raised` with a forest button**
  (`UploadDropzone.tsx:335-360`) — zero forest atmosphere at the exact moment
  design-language.md names as forest-led.
- **Chrome (the `2a2066e` moss frame): whisper-level.** `bg-moss` (#e8ebdd, barely
  green) + `border-moss-line` on SiteHeader/DocumentHeader/ControlPanel; forest itself
  only on actions.
- **Collaboration presence: NOT forest-led.** Avatar palette is a 7-hue hash rotation
  (forest is 1/7, `lib/collaborators.ts:15-23`); `ActivityFeed` is ink-neutral. MOTION.md
  specifies a one-time **moss pulse** for presence/activity events — none exists.
- **Leakage check: CLEAN.** Zero forest on matrix rows, confidence dots, register,
  spine, or panel body. All in-matrix forest is actions/status words (allowed).

### What's genuinely left — "more forest" lands in exactly three places
| # | Task | Detail | Model | Size |
|---|------|--------|-------|------|
| 2.1 | Forest arrival moment | Give the extraction + completion surface a forest-led ground: the ProcessingView/RegisterPreview frame and the "done" card move from `bg-paper-raised` onto a moss/pine arrival treatment (treeline or canopy motif is available in the existing landing asset/utility set — reuse, don't invent). This is the surface MOTION.md calls "where forest motion should do the most app-work". **Constraint:** the RegisterPreview miniature itself stays record-grammar (it *is* the register being written); forest is the ground around it — this IS the two-layer handoff made visible, and it feeds directly into Workstream 3's resolve. | Fable (this is the taste centrepiece of the forest push) | M |
| 2.2 | Deepen the moss chrome | One notch, not three: candidates are a stronger moss ground (`#e8ebdd` → a hue that still passes greyscale), a pine detail in the masthead (e.g. the rule zone or the wordmark seat), or a forest-tinted `--depth-control` on chrome buttons. Prototype 2–3 variants on the DocumentHeader stack and pick one. **Guardrail:** the ControlPanel moss band borders the matrix — whatever deepens must not read as forest bleeding into the worklist tallies (those stay paper). | Fable variants → founder eyeball → Sonnet lands | S |
| 2.3 | Forest-led presence | (a) Reorder `collaborators.ts` PALETTE so forest leads and the rotation stays within the earthy family (drop the plum/slate outliers if the greyscale test still separates actors). (b) Add the MOTION.md one-time **moss pulse** on new activity-feed entries and member-chip arrival (`ActivityFeed.tsx`, `ShareControl.tsx`) using `--motion-panel`/`--ease-forest`; settles to static, never loops, no pulse on stale events after reconnect (MOTION.md:617). | Sonnet | S |
| 2.4 | Landing//demo deepening | **Explicitly descoped.** Both surfaces are already the full brand expression; further forest there is spray, not push. If the founder wants visible motion on them, that budget belongs to Workstream 3's resolve instead. | — | — |

**Forest/record call:** forest leads all three targets; the boundary holds because none
of them touch matrix rows, dots, register, or panel body. The audit found zero existing
violations — Stage 3 must exit the same way (re-run the leakage grep in verification).

---

## Workstream 3 — The upload→matrix resolve (the one hero transition)

### Current state (audit)
- **Both halves exist; the bridge doesn't.**
  - `/upload` extracting state: `ProcessingView` (pipeline narration, forest progress,
    oxblood deal-breaker flare) + `RegisterPreview` (blank register inking in rows as
    `requirementCount` climbs — `UploadDropzone.tsx:452`, `RegisterPreview.module.css`).
  - `/review` arrival: Motion-driven staged entrance — groups then first 12 rows stagger
    (`ComplianceMatrix.tsx:851-929`), triage counters tick 0→real
    (`MatrixView.tsx:786-836`), fires once per tender via module-scope `seenRevealKeys`
    (`ComplianceMatrix.tsx:88`).
  - Between them: live path hard-navigates `router.push("/review")` after a fixed 1800ms
    (`UploadDropzone.tsx:203-207`); mock/demo path holds on the done card and the user
    clicks through. Two disjoint animations, a route swap in the middle.
- **Spec:** `layout.md §9` — "plays in place: the header fades in, the raw document
  resolves into rows, the triage line lands. **No page swap.**" DESIGN-SYSTEM §9 names it
  the single showpiece.
- **Tech:** `motion` v12 already in the bundle (matrix uses it). No View Transitions
  wiring. Grid geometries differ: RegisterPreview `[46px_30px_1fr]` vs matrix
  `[80px_22px_1fr_auto]` — same semantics (ref·bead·line), different widths.
- **Timing constraints:** extraction resolves via the 700ms poll loop (30–120s real,
  ~8s scripted demo replay); choreography must key off `status:"done"`, never a timer.

### The architecture decision (make it via throwaway prototype, per the hard rule)
Two candidate shapes; prototype both cheaply, keep neither:

- **Option A — in-place resolve (matrix mounts on /upload).** After `done`, the
  extracting frame animates: forest ground recedes, RegisterPreview's sketch rows
  hand off to the real matrix mounting in the same spatial frame, triage line lands;
  `router.replace("/review")` fires silently after composition (or `/review` becomes
  the canonical URL via history replacement mid-animation). Honest to "no page swap";
  cost: MatrixView must render inside the upload route's frame, and `seenRevealKeys`
  must not double-fire when the user later visits `/review`.
- **Option B — View Transitions cross-route morph.** Tag RegisterPreview rows and
  matrix rows as shared elements, let the browser morph across the
  `/upload → /review` navigation. Cheaper wiring, but Next 16 support is experimental,
  geometry must align (see below), and reduced-motion/fallback paths multiply.

**Recommendation to test first: Option A.** It matches the spec's language literally,
uses the Motion library already trusted on the matrix, works identically on the demo
(no-API) path that plays in front of judges, and degrades trivially (reduced motion =
compose the end state instantly, which is exactly today's behaviour). Option B is the
fallback if A's mount-on-upload cost turns out ugly.

**Geometry synergy:** task 1.3 (register column trueing) should land **before** the
resolve build and RegisterPreview's `[46px_30px_1fr]` should be re-cut to the matrix's
final geometry at the same time — then the sketch-to-real handoff is a near-overlay
rather than a morph.

### Tasks
| # | Task | Detail | Model | Size |
|---|------|--------|-------|------|
| 3.1 | Throwaway prototype | Timeboxed (a day, on a scratch branch, explicitly discarded): Option A in-place resolve on the mock replay path only. Answer three questions: does MatrixView mount cleanly inside the upload frame; can the RegisterPreview→matrix handoff read as "filed into the register" at `--motion-hero`/`--ease-settle`; does `seenRevealKeys` need a key change. If A fails taste or feasibility, spike B for half a day. | Fable (motion/taste) with Opus consulted on the routing/state architecture | M |
| 3.2 | Architecture decision record | 10-line note in this file's changelog: chosen option, key rename for the reveal, what happens to the 1800ms delay (it dies; the resolve keys off `done`), how live vs mock paths unify (both resolve in place; live replaces the URL, mock keeps the "Open matrix" button as the reduced-motion/manual fallback). | Fable | XS |
| 3.3 | Build the resolve | The real implementation on a branch (`frontend/upload-resolve`): two-layer handoff — forest arrival ground (from task 2.1) resolves out as the record composes in; ProcessingView's final state files itself; triage line lands last (it's the payoff, per DESIGN-SYSTEM §9). All timings from tokens; total choreography ≤ ~1.2s past `done` (MOTION.md hero budget); interruptible (route change/Esc cancels to composed state). | Fable | L |
| 3.4 | Reduced-motion + fallback pass | Composed end state with zero intermediate frames; the demo path's manual "Open matrix" button remains as the universal no-JS/reduced fallback; verify SSR hydration shows no flash of sketch rows. | Sonnet | S |

**Forest/record call:** this transition IS the boundary, performed. Forest owns the
ground and the departure; the record owns everything that persists. The moment a real
row exists, it obeys record discipline (no forest tint on rows, ever — including
mid-animation frames, which the greyscale test must be run against).

---

## Workstream 4 — /graph linked workspace (polish PR, not a build)

### Current state (audit) — the spec is shipped
| Spec element | Verdict | Evidence |
|---|---|---|
| One workspace, not tabs | DONE | `graph/page.tsx:8-17` mounts `StructureView` whole |
| Shared selection spine | DONE | `selectedId/hoveredId/selectedCrit` + shared `filter` predicate, one `paneProps` into both panes (`StructureView.tsx:56-99,158-166`) |
| Segmented Split·Ledger·Map, mono voice | DONE | `Segmented` `:351-394`, mono uppercase |
| Shared filter bar (search/deal-breakers/to-check/category) | DONE | `:170-218` |
| Ledger (MarksView) wiring | DONE | criterion groups, dep chains, pinning, auto-scroll |
| Map: swimlanes, minimap, trace+dim, zoom LOD | DONE | `GraphView.tsx:121-139,580-606,890-911,730-795` |
| Drawer over workspace | DONE functionally | `StructureView.tsx:241-249` → `RequirementDrawer` |
| Drawer uses `--depth-sheet` | **PARTIAL** | shell uses Tailwind `shadow-xl` (`RequirementDrawer.tsx:75`) |
| /demo deep-link preserved | **DORMANT** | demo mounts `interactive={false}` so no click at all; the deep-link branch (`GraphView.tsx:519-533`) exists but nothing triggers it |

### What's genuinely left
| # | Task | Detail | Model | Size |
|---|------|--------|-------|------|
| 4.1 | `--depth-sheet` on the drawer shell | One-line swap at `RequirementDrawer.tsx:75`; the drawer is shared with MatrixView's narrow fallback (`MatrixView.tsx:868`), so eyeball both mounts | Sonnet | XS |
| 4.2 | Demo graph click decision | Decide: keep the /demo graph read-only (current), or re-enable the `/review?req=` deep-link for the showcase. Founder call; the code path exists either way. Default if unasked: keep read-only (the demo is presenter-driven). | founder + Fable | XS |
| 4.3 | Segmented/trace motion token pass | The mode-change indicator and edge-trace timings move onto `--motion-fast`/`--motion-standard`/`--ease-record` per MOTION.md "Marks And Structure" | Sonnet | XS |
| 4.4 | Data-population flag (not frontend work) | The real Bradwell prebake has `criteria_ref: null` and `depends_on: []` on all 50 requirements and no `award_criteria` — swimlanes, criterion edges, and dependency tracing render empty on the only realistic dataset. Post on `comms/board-frontend.md` tagged `@backend`: extraction needs to populate these or /graph stays a mock-data showpiece. This is the single highest-leverage /graph item and it is not a UI task. | you (a comms post) | XS |
| 4.5 | Edge polish | `nextDrawerLabel` "Back to matrix" fallback when nothing selected (`StructureView.tsx:117`) — verify the walk UX | Sonnet | XS |

**Branch call:** the Stage 3 brief assumed /graph was a large change and mandated a
branch. The build is done; what remains is a small polish set. Keep it as one small
branch+PR anyway (`frontend/graph-polish`) since 4.1 touches a component shared with
the matrix — cheap insurance, fast merge.

**Forest/record call:** record leads (it's a proof surface); the shipped build already
honours this. No new forest here — "navigable and alive" is carried by the existing
trace/dim motion, now on record-easing tokens.

---

## Sequencing

```
0. Tokens (0.1–0.2)  ── half a day, blocks everything below
        │
        ├─► 1. Record trueing (1.1–1.3)      ─┐  parallel lanes,
        ├─► 2. Forest push (2.1–2.3)          ─┤  different files except
        │      (2.2 touches DocumentHeader —  │  DocumentHeader: land 1.1
        │       land after 1.1)               │  before 2.2
        │                                     │
        ├─► 4. /graph polish PR (4.1–4.5)    ─┘  independent, any time
        │
        └─► 3. Resolve: 3.1 prototype (throwaway) → 3.2 decision
                → 3.3 build on branch (needs 1.3's register geometry
                  and 2.1's forest arrival ground landed first)
                → 3.4 reduced-motion pass → PR → merge
```

Order of merges to main: 0 → (1, 2, 4 as they finish, small commits per repo
trunk-based rules) → 3 last, on its branch, because it restructures the upload route.
Commit small and often; `git pull --rebase` around every push (AGENTS.md).

**Model assignment summary:** Sonnet for every mechanical/spec-driven task (0.1, 0.2,
1.2, 1.3, 2.3, 3.4, 4.1, 4.3, 4.5); Fable for taste and motion (1.1 placement, 2.1,
2.2 variants, 3.1, 3.3); Opus consulted once, on the resolve routing/state architecture
(3.1/3.2). No task in this stage needs Opus-led implementation — the audit removed the
big-architecture work by finding it already built.

---

## Verification (every merge, plus stage exit)

**Per merge (non-negotiable, from AGENTS.md + SLOP-CHECK):**
1. `npm run lint` and `npm run build` green. Never push red to `main`.
2. SLOP-CHECK four-step: greyscale test (status = dot + word, never colour alone);
   name one intentional choice; tier-1 tells scan; real content.
3. Reduced-motion check on any surface the change animates: composed end state, no
   intermediate frames, no broken half-layout.

**Stage-exit checks (run once, before calling Stage 3 done):**
- **Forest/record boundary grep:** `grep -n "forest\|pine\|moss" src/components/{ComplianceMatrix,RequirementSpine,ConfidenceIndicator}.tsx`
  — hits must be actions/status words only, matching the audit baseline (no new hits on
  rows, dots, register, panel body).
- **One `--rule-strong` per screen:** visual pass on `/review`, `/upload`, `/graph`,
  `/answers` after task 1.2.
- **Resolve QA:** mock replay path AND live path (with `NEXT_PUBLIC_API_BASE_URL`);
  reduced-motion lands composed; interrupting mid-resolve (route change, refresh) never
  strands a half-state; `seenRevealKeys` doesn't double-fire or suppress on later
  `/review` visits; 375 / 768 / 1440px.
- **/graph PR:** drawer shadow correct in both mounts (workspace + matrix narrow);
  demo graph behaviour matches the 4.2 decision.
- **Register trueing:** real Bradwell clause refs render un-clipped at the chosen
  column width; tooltip still carries the full ref; greyscale ledger edge reads.
- **Bundle sanity:** the resolve must not regress the frontend-jawad.md A2 goal — no
  new heavyweight animation dependency (Motion is already in; nothing else gets added).

---

## Changelog
- 2026-07-08 — plan drafted from four parallel code audits against `main` @ `2a2066e`.
