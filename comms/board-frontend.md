# Board — Frontend (Jawad) (compliance matrix · source panel · decision controls · graph view · demo)

*Jawad (frontend) writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

### [F-029] @j @backend @generalist · ANSWER · OPEN · 2026-07-04
**J-093 cut-line UI is done.** Mixed packs are now visible in the product:
matrix rows and graph nodes show PDF/DOC/XLS/CSV source badges, `ControlPanel` renders a Tender pack
strip from `sourceDocs` with per-file requirement counts, CSV export + XLSX export include
`source_filename`, and the mock tender now includes a CSV-derived row so screenshots cover PDF/Word/Excel/CSV.
No PDF proof behavior changed. `npm run lint` green with the existing TanStack Virtual warning; `npm run build`
green after allowing Google Fonts fetch.

### [F-028] @backend @generalist @j · ANSWER · RESOLVED · 2026-07-04
**F-026 mixed-pack frontend lane verified on `main`.** Upload already accepts `.pdf/.docx/.xlsx/.csv`,
the live path sends the `File[]` unchanged, the copy says tender pack/documents, `source-doc.ts` formats
PDF vs Word/Excel/CSV source labels, and `RequirementPanel` only shows PDF proof controls when a real PDF
source exists. Follow-up guard: non-PDF requirements never resolve a PDF proof URL, non-PDF labels fall
back to filename when there is no locator, and the verification fallback says extracted text rather than
inventing a page highlight. Mock data includes DOCX/XLSX-derived requirements for no-backend checks. I also
blocked the Bradwell demo PDF in `robots.txt` alongside SPSO. `npm run lint` green with the existing TanStack
Virtual warning; `npm run build` green after allowing the usual Google-font fetch.

### [F-027] @all · INFO · OPEN · 2026-07-04
**Pitch deck arrow flow fixed on `main` (`8d63f37`).** `/pitch` no longer hands Competitors off to
`/showcase`; right arrow now stays inside the deck and advances through the Competitors reveal to the Ask.
The global right-arrow shortcut back to `/pitch#6` is gone, and `/showcase` no longer receives a stage
return target, so ArrowRight does not unexpectedly teleport out of the product surface. `npm run lint`
green with the existing TanStack Virtual warning; `npm run build` green.

### [F-026] @frontend @backend @generalist @j · ACTION · RESOLVED · 2026-07-04
**16-hour mixed-pack sprint: frontend has the light lane.** Start with
[`ops/mixed-pack-03-frontend-light.md`](../ops/mixed-pack-03-frontend-light.md). No client-side Word or
Excel parsing, no Office preview, no Microsoft integration. Just broaden upload acceptance/copy to
"tender pack", make source labels format-aware, and keep the PDF proof overlay visible only for real
PDF-derived requirements. Build against mocks if backend is still in flight.

### [F-025] @all · INFO · OPEN · 2026-07-04
**Pitch trail-map rule straightened.** The `/pitch` footer navigation now uses a true horizontal SVG rule
for the main route and field-notes branch, so the stop diamonds sit on one clean baseline at stage width.
`npm run lint` is green with the existing TanStack Virtual warning; `npm run build` is green after allowing
the usual Google-font fetch.

### [F-024] @all · INFO · OPEN · 2026-07-03
**Ask-slide QR/scan tag removed per Jawad's call.** `/pitch` keeps the simple typed URLs (`bidframe.org`
and `/demo`) and the next frontend work is now polish + confidence: browser visual QA, rehearsal timing,
proof wording, and fallback paths. No more net-new stage mechanics unless something blocks the demo.

### [F-023] @all · INFO · OPEN · 2026-07-03
**Second `/pitch` polish pass ships the four approved improvements.** Added a Product-slide
source proof peek, an Ask-slide scan/short-link tag for bidframe.org, a compact proof-ledger field-note
appendix, and a shared cinematic grade over the deck. `npm run lint` is green with the existing
TanStack Virtual warning; `npm run build` is green after the usual networked Google-font fetch.

### [F-022] @all · INFO · OPEN · 2026-07-03
**Picked off four pitch-stage improvements from `pitchimprovements.md`.** `/pitch` now survives refresh
and deep links via `sessionStorage` + hashes (`#1`, `#notes-1`), shows a quiet elapsed timer, hides the
cursor after 2s in fullscreen, adds Home/End recovery shortcuts, and makes the GBP 341bn proof figure
count up on the Use Case slide. `npm run lint` is green with the existing virtualizer warning; `npm run
build` is green.

### [F-021] @all · INFO · OPEN · 2026-07-03
**Search-ready FAQ patch is on `main` (`577a30f`).** Added `/faq` as a separate public answer page,
plus canonical metadata, homepage software/org JSON-LD, FAQPage JSON-LD on `/faq`, `robots.txt`,
`sitemap.xml`, and `/llms.txt`. The homepage and its navbar are unchanged: no FAQ link. `npm run lint`
is green with the existing TanStack Virtual warning; `npm run build` is green and statically emits
`/faq`, `/robots.txt`, and `/sitemap.xml`.

### [F-020] @all · INFO · OPEN · 2026-07-03
**Pitch improvement backlog is now structured in `pitchimprovements.md`.** I turned the latest stagecraft
tips into a triaged doc: P0 pre-demo safety, audience-facing wins, appearance-only polish, and major
swings like the in-deck product portal, scrollytelling twin, presenter console, and live-ingest finale.
Best near-term cut: refresh survival, Ask QR, timer/cursor hide, animated GBP 341bn + draw-on trail,
product source peek, and an eval field-note appendix. Please add more tips directly there or reply here.

### [F-019] @all · INFO · OPEN · 2026-07-03
**Pitch storyboard now locks the required 7-slide structure.** Updated `storyboard.md` so the short deck explicitly contains Problem, Use Case, Solution, Product, Demo Flow, Tech, and Ask. The forest journey stays, but the judges get clear pitch categories; deal-breaker detection remains the hero, the tech slide covers the auditable pipeline/eval harness, and the demo flow has a 30-second route through `/demo` and `/answers`. Use this as the Canva build spec; appendix/Q&A slides can sit behind it, but the main pitch should stay snappy.

### [F-018] @j · ANSWER · OPEN · 2026-07-02
**J-072 done — WLWA Acton held-out deal-breaker key filled from my manual read.** I added 33
human-labelled deal-breaker rows to `gold-set/wlwa-acton.labels.csv` (`g1`-`g33`), all
`mandatory` / `is_gating=yes`, with numeric PDF pages and clause headings. I did not use the tool's
output. Formatting is checked with the repo loader: ids contiguous, 33 rows parse cleanly, all pages
numeric. I left `gold-set/eval-manifest.json` as `draft:true` so you can decide the scoring step;
note this is a **deal-breaker-only** gold file, so it should feed the gating/deal-breaker recall
claim rather than normal full precision/recall as if it were a complete requirement key.

### [F-017] @j · BLOCKER · OPEN · 2026-07-02
**Joel, launch gate before outreach: deploy the GitHub repo on Vercel and attach a real domain.** Vercel needs to build directly from the GitHub repo so every push ships the app cleanly, then buy/connect a credible domain, ideally `bidframe.com` if available. We should not start outreach from a throwaway preview URL: prospects need a stable branded domain to trust Bidframe.

### [F-016] @generalist · ANSWER · RESOLVED · 2026-07-01
**G-021 done — the pre-baked SPSO run now drives `/demo`.** Wired `frontend/src/data/spso-prebake.json` into the read-only showcase in place of the fabricated `mockTender`: `/demo` mounts its **own** `RequirementsProvider`, seeded via a new optional `initialTender` prop (inner context wins — every other screen is untouched). The seeded provider is **frozen** — it skips the sessionStorage live-tender restore and exposes `title` for the header — so the hosted build's live/mock state can't leak in and the demo stays key-independent on stage. The 183 raw reqs collapse to unique rows via your `collapseDuplicates` (matrix + hero). Verified the `/demo` prerender carries the real SPSO title + requirement text; tsc + lint + `next build` green, `/demo` still static. Landed the pending landing-polish branch in the same push, reconciling cleanly over your oxblood-token retune (kept `signal-oxblood-frame`, added `card-live`). On `main` now. **NHS 66pp prebake is ready too** if we want a second demo tender. @generalist — clear to flip **G-021 → RESOLVED** on your board (can't touch it from my lane). Still parked from G-016 #2: `?limit` threading (low priority — the pre-bake sidesteps the live draft path).

### [F-015] @all · INFO · OPEN · 2026-06-30
**Graph view rebuilt, and the civic record swept across the rest of the app.** The **graph** (`/graph`) is no longer default React Flow: its generic nodes, default controls, dotted background and attribution are replaced wholesale with a bespoke relationship map. Requirements are **register cards** on warmed paper (the shared confidence bead, a 2px oxblood reading edge + "Deal-breaker" on gating, the mono clause ref, the page ref); award criteria are **recessed mono tabs** (the document's fixed structure, pressed into the page) carrying their requirement count and an oxblood mark when they hold a deal-breaker. A centroid layout turns the old spaghetti into clean roll-ups; edges are token-coloured (quiet pencil = scored against, oxblood = deal-breaker link, forest dashed = depends on) with arrowheads; the canvas is a recessed drafting surface under a graph-paper ledger grid, with a bespoke mono zoom control and a drawing-style **legend key**. Nodes carry initial dimensions so they render on first paint without waiting on measurement.
The **rest of the app** got the same material pass: the **masthead** (`DocumentHeader`, shared by all four app screens) is now a proper nameplate, a running head "BIDFRAME", the Fraunces title at the 24 size, a **real reference line** (requirement count, plus the tender id when a live tender is loaded), and the one **2px ink rule** beneath. The **upload dropzone** is the lifted, grained sheet it should be (`--depth-sheet` + grain, a recessed icon well). The **requirement panel** (so both the split and the mobile drawer) gains the lifted grainy sheet, the **ruled margin** (a hairline between the 64ch prose and the mono margin), **pressed evidence blocks** (`--paper-recessed` + `--depth-pressed` on the expanded source/evidence excerpts), and the **approval stamp on approve** (settles at -3°, replacing the plain status line). `ApprovalStamp` is promoted to a shared `src/components/ApprovalStamp.tsx` used by both the landing and the panel. No new hues, forest stays the one earned accent, signal stays on status carriers. tsc + lint + `next build` all green, every route still static. Note: the React Flow graph's edges + fit need a real browser to render (the headless preview here has no `ResizeObserver`); structure and node coordinates verified programmatically.

### [F-014] @all · INFO · OPEN · 2026-06-29
**Status-system richness pass on the shared matrix components, lands everywhere including the hero.** Touches `ConfidenceIndicator`, `GatingHero`, `ComplianceMatrix`, `RequirementSpine`, so the matrix, `/review`, the spine, and the landing hero all upgrade together (the hero renders the real components). The richness comes only through the status system, never sprayed onto chrome: the **confidence dot is now a dimensional glossy bead** with a greyscale-safe fill LEVEL (oxblood 30% to confident 100%) via the shared `.conf-dot` material + `sm`/`md` sizes; the **deal-breaker callout** is a lifted grainy sheet with a 2px oxblood reading edge and glossy oxblood dots; the matrix gains the **register** (each row's real clause ref down a quiet mono margin), a **gating oxblood edge** on gating rows, **depth-on-focus** (only the open row lifts), and a **forest approve tick** so approval never relies on colour alone. The landing honesty scale now uses the same shared indicator. No new hues, forest stays the one earned accent. tsc + lint + `next build` green.

### [F-013] @all · INFO · OPEN · 2026-06-29
**Landing page overhauled to hi-fi, the civic record pushed.** Replaces the F-012 placeholder at `/`. The static hero placeholder is gone: the showpiece is now the **real product** (`ComplianceMatrix` + `GatingHero` over the mock tender) resolving on a **tilted sheet** (supabase-style perspective, tilts toward the cursor, settles on load). Hero hierarchy fixed per the build calls: a centred two-line headline ("Never lose a bid" / "to a deal-breaker you missed."), a one-line subhead, enlarged CTAs. Art direction (a sanctioned push past the product's restraint, landing only): warm paper throughout with **two ink bands** (the proof ledger and the closing), a **faint ledger grid** site-wide for texture, **forest botanical sprigs** framing the hero and the 3D sheet, **dimensional confidence beads**, the **approval stamp**, grain on raised surfaces only. Slop + layout pass: left-aligned editorial body, **no eyebrow kickers**, **one 2px ink rule** (masthead), stakes-driven weight (the deal-breaker catch is heavy and lifted, the calm copy is light), varied sections, passes SLOP-CHECK + layout.md. Two cold-traffic additions: a **worked-example entry** (the product shot is clickable and a "See a worked example" CTA, both into `/review`, no upload) and a **waitlist email capture** in the closing card. New under `src/components/landing/`: `Landing`, `HeroResolve`, `BookDemoButton`/`SeeItRunLink` (size + tone variants), `WaitlistForm`, `ApprovalStamp`, `BotanicalSprig`; motion + material tokens in `globals.css`. `tsc` + `lint` + `next build` all green; routing unchanged (`/` landing, `/review` demo). **@j / @all, two env vars to set before outreach:** `NEXT_PUBLIC_BOOKING_URL` (the Cal.com/Calendly "Book a demo" destination) and `NEXT_PUBLIC_WAITLIST_ENDPOINT` (or `NEXT_PUBLIC_WAITLIST_EMAIL`). Until set, Book a demo is a placeholder anchor and the waitlist falls back to mailto; both swap with no code change. Spec stays `frontend/landing-page-brief.md`.

### [F-012] @all · INFO · CLOSED · 2026-06-29
**Landing page built and deployed.** The civic record landing page is now live at `/` following the spec in `frontend/landing-page-brief.md`. Routing changes: the matrix moved from `/` to `/review`, SectionNav updated accordingly. All 12 sections implemented (masthead, hero, before, catch, how it works, trust, honesty, answers, proof, before/after table, CTA, footer). Design language tokens (warmth at 45%, rule hierarchy) added to globals.css. SEO metadata and analytics data attributes in place. Build passes, lint passes, codemap regenerated. Hero resolve animation is currently a static placeholder (to be implemented as follow-up using real ComplianceMatrix components). Dev server running on localhost:3000.
**The design language is locked: "the civic record".** New `frontend/design-language.md` (the deep
manual), summarised as DESIGN-SYSTEM section 13, folded into SLOP-CHECK. On `main` now. The bid is
presented as an official record in progress: brutalist and editorial over warmed paper at **45%**. Three
ingredients in order of authority: editorial structure (the form), brutalist honesty (the discipline, the
form is the function = auditability), warmed paper (the material). Holding rule: **warmth is the material,
the record is the form, the form leads.** Device kit, all restyles of shipped components, not rewrites: a
**masthead** (DocumentHeader as a letterhead), a **three-weight rule hierarchy** (one 2px ink masthead
rule per screen, a section rule, a hairline), a **register** (each matrix row carries its real
`source_clause` down a quiet mono left margin), a **ruled margin** in RequirementPanel, the **mono record
voice** (mono = refs/IDs/timestamps/audit line), and an **approval stamp** (a clean forest mark, slightly
off-axis, that settles). Concrete material tokens (the 45% values for `--depth-sheet` etc.), the grain
rule (raised surfaces only, never the scanning rows), and the civic-record check are all in the file.
@frontend this becomes a code pass after review; @backend/@generalist if you add UI, build to it.
Note: DESIGN-SYSTEM section 10 revised off "near-flat"; the old "skeuomorphism deferred" notes in layout.md
now point here.

### [F-010] @all · DECISION · OPEN · 2026-06-29
**Copywriting guide is in: `frontend/copywriting.md`. Read it before you write or change any user-facing
string.** On `main` now. The principle: copy is where trust is won or lost, so every line either shows its
work (names the source: "Drafted from your Capability Statement, p.4") or refuses to overclaim (it is a
draft you approve, never a finished answer). The guide sets **fixed vocabulary** everyone must use:
confidence words (Can't answer this / Low confidence / Fairly sure / Confident, matching the four dot
tiers), answer-state words, and decision-status words. It also bans hype, exclamation marks, emoji
(including the sparkle on AI features), developer language in the UI ("Day 1", "mock data"), and jargon a
non-expert won't parse ("grounded", "auditable"). **@all heads-up, the audit found live issues to fix in
the next copy pass:** (1) a grammar bug on the upload page ("we're pull out the requirements" should be
"we'll"); (2) six live em dashes across the UI (em dashes are banned, see SLOP-CHECK); (3) the confidence
labels in `ConfidenceIndicator.tsx` say High/Moderate/Low/Uncertain, which contradicts the four-tier dot
model. Full before/after for every live string is in the file. Headline call for review: "Autofill with
AI" → "Draft my answers" (honest verb, no overclaim). @frontend I'll do the code copy pass separately;
@backend/@generalist if you add UI strings, build to this.

### [F-009] @all · DECISION · OPEN · 2026-06-29
**The layout is settled.** Full structure is now `frontend/layout.md`, summarised as section 12 of
`DESIGN-SYSTEM.md`, with the layout bans folded into `SLOP-CHECK.md`. On `main` now. The principle: calm
by default, friction by stakes, and the layout itself carries the stakes (slop is uniform, we are
deliberately unequal in a way that maps to risk). Headline calls: no global left rail (one tender fills
the screen, navigation is contextual in the header); a three-zone header whose one action is **Next**
(always routes to the highest-priority unresolved item, becomes Export when done); the matrix is a
one-line contents page grouped by the ask, with the answer preview on hover/focus only; row
interactivity scales with stakes (confident non-gating items approve from the list, gating/low-confidence
force the panel open); and a **split open state** (opening a row shrinks the matrix to a ~300px index
spine and gives the panel the room, drawer below ~1100px). Skeuomorphic paper treatment is planned but
deferred; we commit now only to "depth means focus". @backend/@generalist no action; @frontend build to
these. Stale fix: SLOP-CHECK no longer says "Typeface: TBD".

### [F-008] @all · DECISION · OPEN · 2026-06-28
**Typeface is locked: Fraunces for headings, Chillax for body, IBM Plex Mono for evidence.** Both
display faces are free (Fraunces on Google Fonts, Chillax on Fontshare). On `main` now. Reasoning:
calm warmth over loud warmth, distinctive without looking vibe-coded, sits inside Paper and Forest.
Setup for the build: three tokens `--font-head` / `--font-body` / `--font-mono`, defined next to the
colour tokens in `frontend/design/colours.html`. Full system with the scale shown in context is
`frontend/design/typography.html` (open in a browser); the spec is now section 11 of `DESIGN-SYSTEM.md`.
Six sizes only, two weights of Fraunces, three of Chillax. Numbers go in the mono evidence style. If
Chillax reads soft in the densest matrix rows, swapping `--font-body` to Hanken Grotesk is a one-line
change. @backend/@generalist no action; @frontend build to these.

### [F-007] @all · INFO · OPEN · 2026-06-28
**Design system is merged to `main` (PR #3 squashed) and deployed.** Three files in `frontend/`:
`DESIGN-SYSTEM.md` (the intent), `SLOP-CHECK.md` (the gate you run wireframes past), and
`design/colours.html` (a click-to-copy hex reference, open it in a browser). I merged without waiting
for sign-off to keep us moving; I'm leading frontend design decisions, so feedback is still welcome but
build to these now. Colours and typeface stay provisional. Headline calls: two separated palettes
(brand vs signal), and a two-axis status model (4-tier confidence dot, separate forest approval tick).

### [F-006] @all · REQUEST · OPEN · 2026-06-28
**The Bidframe design system is written up: `frontend/DESIGN-SYSTEM.md`** (in [PR #3](https://github.com/Welddevelopment/Tender_Breakdown_AI-Agent/pull/3), alongside the slop check).
**Please read it and tell me what you think.** Highlights: two strictly separated colour palettes (brand chrome
vs status signal); a two-axis status model (confidence dot on a 4-tier oxblood/amber/yellow/light-green scale,
approval as a separate forest-green tick); the AI-suggested field as a review surface, not an input surface;
a triage-first work summary; and risk-proportional friction on approvals (no bulk-approving gating items).
Feedback on the PR or tag @frontend here. Exact colours and the typeface are still provisional.

### [F-005] @all · DECISION · OPEN · 2026-06-28
**Anti-slop design protocol is in the repo: `frontend/SLOP-CHECK.md`** ([PR #3](https://github.com/Welddevelopment/Tender_Breakdown_AI-Agent/pull/3)).
**If you add a wireframe of a screen, run it past this first.** It is a short gate (greyscale test, name one
intentional choice, banned-list scan, real content) plus a hard banned list: no blue/teal/purple, no em dashes
in copy, no eyebrow labels, no numbered website sections, no ugly pills, no really long headlines, and more.
Following it makes the frontend handoff faster and means less rework on my side. Palette is locked to Paper and
Forest; typeface is still mine to pick. Exceptions or edge cases: tag @frontend.

### [F-004] @backend · INFO · OPEN · 2026-06-28
**Live integration smoke-tested green locally — your contract holds, no frontend changes needed.** Ran your
scaffolded backend end-to-end (heuristic, no key) and pointed the real frontend at it (`localhost:3000` →
`localhost:8000`). Results: `spso-cleaning.pdf` → **21 requirements**; `GET /tenders/{id}/requirements`
matches the locked schema **field-for-field** (all requirement keys + `capability_docs` on the response);
`PATCH /requirements/{id}` persisted a decision across a re-GET; **CORS passes from the real browser origin**
incl. the `PATCH` preflight (`access-control-allow-origin: http://localhost:3000`). So when you're back and
swap heuristic→OpenAI, the UI just lights up — nothing to coordinate on shapes. **One note for the demo:**
heuristic returns thin content (0 gating, no `answer`/`open_questions`), so the live path currently renders
my honest empty states — expected, matches your J-011. We keep the **mock as the hero showcase** until the
OpenAI key lands; live path proves the pipeline. Full detail in `Jawad's progress day 1.md`.

### [F-003] @j · REQUEST · OPEN · 2026-06-28
**I need the deployed backend's public URL** (Render, per `backend/DEPLOY.md`) to make the *hosted* site
show live data. Frontend is already wired to the live API (see F-002) — the moment you post the URL here,
I'll set `NEXT_PUBLIC_API_BASE_URL` in Vercel and the hosted demo goes live. Matches your
`frontend-integration.md` note (Vercel's mine, backend hosting's yours). No rush for local — that already
works against `localhost:8000`; this is purely for the deployed demo. Ping me back with the URL when it's up. 🙏

### [F-002] @all · INFO · OPEN · 2026-06-28
**Frontend↔backend integration is merged** ([PR #2](https://github.com/Welddevelopment/Tender_Breakdown_AI-Agent/pull/2)).
`src/lib/api.ts` calls all three endpoints; it's **env-gated on `NEXT_PUBLIC_API_BASE_URL`** — unset = mock
+ wireframe upload (demo-safe default, so the hosted site is unchanged today); set = real
upload→extract→matrix + decisions persisted via `PATCH`. The autofill UI renders `answer` /
`open_questions` / `capability_docs` when the pipeline produces them and **degrades gracefully if they're
absent**, so the heuristic-only path is fine for now. @backend/@generalist: no shape changes needed — you
emit the locked schema, the UI adapts.

### [F-001] @all · INFO · OPEN · 2026-06-28
**Frontend now ships via PR + merge** (not direct-to-`main`) for visibility — expect PRs on the
Welddevelopment repo from here on. Also live this session: answer + evidence panel + gap-interview UI
(new `/answers` route), Bidframe rebrand, and the autofill schema mirror — all on `main` + deployed. Current
frontend state is in `STATUS.md`; my detailed log is `Jawad's progress day 1.md`.
