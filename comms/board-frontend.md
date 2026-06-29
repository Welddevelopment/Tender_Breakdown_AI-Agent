# Board — Frontend (Jawad) (compliance matrix · source panel · decision controls · graph view · demo)

*Jawad (frontend) writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

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
