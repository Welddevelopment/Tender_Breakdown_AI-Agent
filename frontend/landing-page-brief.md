# Bidframe Landing Page Brief

The build spec for the public landing page. This is the single source of truth for what the page says,
how it looks, how it behaves, and what it must clear before it ships. It does not introduce a new visual
identity: it applies the ones already locked. Where this brief and the system docs disagree, the system
docs win and this file is wrong (raise it).

It inherits, and must obey, all four:

- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) — the look and behaviour rules (sections 1 to 14).
- [design-language.md](design-language.md) — the Civic Record (masthead, rules, register, mono record voice, stamp).
- [copywriting.md](copywriting.md) — how Bidframe talks. Every string on this page passes the copy check.
- [SLOP-CHECK.md](SLOP-CHECK.md) — the banned list and the pre-build gate.

Supporting context, for the people writing copy and wiring the CTA:
[positioning-and-traction.md](../positioning-and-traction.md) (the buyer and the wedge),
[demo-narrative.md](../demo-narrative.md) (the page mirrors this spine),
[STATUS.md](../STATUS.md) (the live proof numbers).

> **Status:** spec, ready to build. Owned by Frontend. Headline and section copy below are final unless a
> teammate flags a copy-check fail. The one external dependency (the demo booking link) is listed in
> "Open items".

---

## 1. The one idea

**The landing page is itself a civic record.** It is an official-looking document about an official
document. Same paper, same masthead, same rules, same mono record voice as the product. When a bid writer
lands, the medium has already made the credibility argument before they read a word. Page and product
speak one language, with no separate "marketing skin" that the product would then contradict.

The page has exactly one job: **get the right person to book a demo.** Everything else serves that.

## 2. Who it is for

One reader, the same one `copywriting.md` writes for: **a bid writer at a small company or a small
bid-writing consultancy, not a procurement expert, working against a deadline.** Capable but stretched,
and nervous about getting a public-sector bid wrong. The primary commercial target is the small
bid-writing consultancy; the regularly-bidding SME is the secondary lane (see
[positioning-and-traction.md](../positioning-and-traction.md)). Write every line for that person: calm,
specific, never talking down, never hyped.

## 3. Goal and the calls to action

- **Primary CTA: "Book a demo".** One forest button. It is the only saturated colour above the fold and
  the only primary action in the hero. Repeated once more at the foot of the page.
- **Secondary CTA: "See it run".** A quiet text link beside the primary button. It routes into the live
  product preloaded with the demo tender (see section 6 and the routing in section 5), so a cold visitor
  watches it work with zero friction and zero risk of an ugly upload breaking the moment.
- The secondary line "See it run on a tender you already know" doubles as the outreach hook: the killer
  move is running Bidframe live on a tender the prospect recognises.

Success metric: **demo bookings**, not visits. Keep one analytics event on each CTA (see section 14); do
not instrument anything else.

## 4. Voice and copy rules (non-negotiable)

This page is held to `copywriting.md` in full. No marketing exemption.

- **British spelling throughout** (organise, colour, licence, recognised).
- **No em dashes anywhere.** Use a comma, a colon, or a full stop. For a number range use "to".
- **No exclamation marks, no emoji, no hype words** (supercharge, seamlessly, unlock, effortlessly,
  streamline, instantly, powerful, smart, and any three-word hype tagline).
- **Provisional verbs** when describing what the tool does: reads, finds, flags, drafts, checks, suggests.
  Never "autofill" as a verb, never "generate", never "complete".
- **Count facts, never score judgement.** Real counts are encouraged (every deal-breaker, 18 of 19, 0
  answers invented). Never a confidence percentage or a quality score on the page.
- **No developer language** in any visible string ("mock data", "Day 1", "the extractor", "grounded" as
  jargon, "compliance matrix" as a heading is acceptable only because it is the product's real name for
  the view).

Run every string on the page past the four-question copy check in `copywriting.md` section "The copy
check". Any "no" is a rewrite.

## 5. Where it lives, and the routing change it forces

The page lives **inside the Next.js app as the new root route `/`**, so it inherits `globals.css`, the
Civic Record tokens, and the `next/font` faces for free, and the CTA can flow straight into the live
product.

This relocates the current home. Today `frontend/src/app/page.tsx` renders the demo matrix
(`MatrixView` over `mockTender`). The build must:

1. **Move the current matrix home to `/review`.** Create `frontend/src/app/review/page.tsx` with the exact
   body that `app/page.tsx` has now (`<MatrixView title={mockTender.title} />`). This is the preloaded
   demo the "See it run" link points at. Data source rules are unchanged: mock by default, live when
   `NEXT_PUBLIC_API_BASE_URL` is set (`src/lib/api.ts`).
2. **Replace `app/page.tsx` with the landing page** described in this brief.
3. **Leave `/upload`, `/answers`, `/graph` unchanged.** The in-product `SectionNav` (Upload / Matrix /
   Answers / Graph) keeps working; update the "Matrix" destination in `SectionNav` and `DocumentHeader`
   from `/` to `/review` so in-product navigation still lands on the matrix, not the marketing page.
4. **The landing page has its own masthead and footer, not `SectionNav`.** It is not a product screen and
   must not show the product's section tabs.

Verify after the move: `/` is the landing page, `/review` is the demo matrix, `/upload` still uploads,
and no in-product link points back at `/`.

## 6. The showstopper: the hero resolve

This is the page's one animated moment and the centrepiece. It reuses **the single hero transition the
design system already names** (DESIGN-SYSTEM section 9, design-language "the upload-to-matrix resolve"):
a raw tender resolves into the ruled register, and the deal-breaker settles first.

- **Build it from the real components**, not a bespoke mockup: render the actual matrix
  (`ComplianceMatrix` / `RequirementSpine` / `GatingHero`) over the demo tender data, and animate it into
  place. The showstopper is the real product resolving, which is both more honest and less work than a
  faked graphic.
- **The beat:** a plain document (a few ruled grey lines suggesting a PDF page) **files into the
  register**, rows landing into place on the shared grid with their clause references appearing down the
  mono left margin. Then the **oxblood deal-breaker row settles last and heaviest** (2px oxblood edge,
  more room, oxblood dot), drawing the eye. That settle is the catch.
- **The landing page stays selective.** The hero can carry the cinematic resolve, and lower proof
  surfaces may settle in as placed documents, but the page must not add a second reading-pass section.
  The heavier end-to-end motion belongs on `/demo`, where the visitor has chosen to watch the product
  run.
- **The `/demo` reading pass may go further.** Its pinned stage can show the tender being scanned,
  clauses locking, requirement rows forming, the deal-breaker lifting out, answers receiving receipts,
  and the graph drawing. Keep it tied to real product states, never a decorative animation reel.
- **Timing** belongs to the motion pass (not specced here), but the transition is named so it is not
  invented from scratch. Keep it under ~2.5s, ease to a settle, play once on load, do not loop.
- **Reduced motion and no-JS fallback:** when `prefers-reduced-motion: reduce` is set, or before/without
  JS, render the **final resolved state** as a static image of the register with the deal-breaker already
  settled. No motion, no loss of meaning. The page must read fully with the animation never playing.

## 7. The page, top to bottom

Final copy is given as block-quoted strings. Type roles in brackets refer to DESIGN-SYSTEM section 11
(Fraunces head, Chillax body, IBM Plex Mono record). Keep headings short: Fraunces earns its warmth in a
few words.

### 7.1 Masthead (the page header)

Purpose: establish "official record" in the first glance. Reuses the Civic Record masthead device, not
the product `DocumentHeader`.

- A mono running head, uppercase, tracked: `BIDFRAME` (mono record).
- One `--rule-strong` (2px ink) full-width rule beneath the whole masthead. At most once on the page.
- No nav tabs. A single quiet "Book a demo" text link may sit top-right, mirroring the hero button.

### 7.2 Hero

Purpose: land the promise and the one action above the fold.

> # Never lose a bid
> _(Fraunces 600, the hero line, the 34 size)_
>
> ### to a deal-breaker you missed.
> _(Fraunces 500, quiet sub-head, the 24 size)_
>
> Bidframe reads a public-sector tender, finds every requirement, and flags the ones that would
> disqualify you. Each links back to the exact clause, so you can check it yourself.
> _(Chillax body, capped at 64ch)_
>
> **[ Book a demo ]**  ·  See it run on a tender you already know.
> _(the one forest button, then a quiet mono/Chillax secondary link to `/review`)_

The hero resolve (section 6) sits beside or beneath this block, depending on the layout the builder
chooses within the width caps (section 10). Above the fold, the forest button is the only saturated
colour.

### 7.3 The before (the cost of the status quo)

Purpose: name the pain in the reader's own terms, plainly, no fear-selling.

> ## Three weeks of reading, and one missed line voids it
> _(Fraunces head)_
>
> A bid writer spends weeks reading a public-sector tender by hand. The requirements are scattered across
> a hundred pages, and the ones that disqualify you if you miss them look just like the ones that do not.
> _(Chillax body)_

### 7.4 The catch (the hero feature, anchored to the resolve)

Purpose: the disqualifier catch is the product's reason to exist. If the resolve animation does not sit
here, this section restates it in words and a still.

> ## The one that loses you the bid, first
> _(Fraunces head)_
>
> Public tenders have hard pass or fail gates. Bidframe puts those deal-breakers at the top, not buried on
> page 61, so you see the bid-killer before you read anything else.
> _(Chillax body)_

### 7.5 How it works (three plain steps)

Purpose: make the mechanism legible in three beats. Provisional verbs only. No numbered decorative
kickers (SLOP-CHECK); these are real ordered steps, so a small mono "1 / 2 / 3" tied to the step is fine,
but keep it quiet.

> ## How it works
>
> **1. Upload the tender.** Drop in the PDF. Bidframe reads it and finds every requirement, with its
> source.
>
> **2. Review the worklist.** Each requirement comes with its confidence and its clause reference. The
> deal-breakers and the uncertain ones are flagged for a closer look. You approve, edit, or flag each one.
>
> **3. Draft your answers.** Bidframe drafts each answer from your own documents and shows where it came
> from. It asks you only the handful of things it cannot find. You approve every line.

### 7.6 Every line, back to its clause (trust)

Purpose: the traceability proof, the wedge against generative tools.

> ## Every line, back to its clause
> _(Fraunces head)_
>
> We pulled these from the tender. One click shows the exact sentence on the exact page, so you never take
> our word for it.
> _(Chillax body)_

Treatment: show a single requirement row with its `source_clause` in the mono margin, and a small still of
the source excerpt highlighted. Real-looking data, the schema's fields, no invented reference format.

### 7.7 It tells you when it is not sure (honesty)

Purpose: honesty is the brand. The flag is a feature, not a weakness, and leads here.

> ## It tells you when it is not sure
> _(Fraunces head)_
>
> Where the tool is unsure, it says so and flags it for you to check. It does not guess, and it does not
> dress a rough draft up as a finished one.
> _(Chillax body)_

Treatment: one row carrying an amber confidence dot with the word "Low confidence" beside it (never a
number). The dot follows the four-tier model exactly (DESIGN-SYSTEM section 4).

### 7.8 Answers, with receipts (auditable autofill)

Purpose: the autofill payoff, messaged as "auditable", never "we write your bid".

> ## Answers, with receipts
> _(Fraunces head, this exact heading is blessed in copywriting.md)_
>
> Bidframe drafts each answer from your own documents and shows which one it came from. You approve every
> line before it goes in the bid.
> _(Chillax body)_

Guardrail: never imply the tool writes a finished, submittable bid on its own. It drafts; the human
approves. The button verb in any screenshot is "Draft my answers", never "Autofill".

### 7.9 Measured on a real tender (proof, plain counts)

Purpose: turn the eval numbers into plain, honest counts. This is the page's hardest evidence and its
strongest section for a skeptical buyer.

> ## Measured on a real tender
> _(Fraunces head)_
>
> We ran Bidframe on a live public-sector cleaning contract and checked every line by hand.
>
> Every deal-breaker caught.
> 18 of 19 requirements found. The one it was unsure of, flagged for you.
> 0 answers invented. Every claim links back to your own document.
> _(the three counts set in IBM Plex Mono, the record voice; the labels in Chillax)_

Source of these counts (do not put the raw figures on the page; they live here for the team and the
README): the SPSO cleaning ITT eval, gating recall 1.0, recall 0.95 (18 of 19), 0 dangerous misses,
groundedness 0 bluffs with every citation verified to source (STATUS.md). Showing "18 of 19" rather than
rounding to a percentage is deliberate: it is "honesty over polish" used as a sales asset, and it obeys
"count facts, never score judgement". Tie any future change in these counts to a re-run, never inflate
them.

### 7.10 Before and after (the legibility anchor)

Purpose: one compact table that makes the value legible at a glance. Mirrors demo-narrative.md.

> ## Before, and with Bidframe
>
> | | Before | With Bidframe |
> |---|---|---|
> | Time | Weeks of expert reading | Minutes |
> | The deal-breaker | A missed gate voids the whole bid | Caught and shown first |
> | Trust | You hope the checklist is complete | Every requirement links to its clause |
> | Uncertainty | Invisible | Flagged for you to check |
> | Your response | A blank page | Drafted from your own documents |
> | Control | | You approve, edit, or flag every line |

Set in the page's type, hairline rules between rows (the rule hierarchy), no per-cell boxes.

### 7.11 Closing call to action

> ## See it on a tender you already know
> _(Fraunces head)_
>
> The quickest way to judge Bidframe is to watch it read a tender you have already bid. Book fifteen
> minutes and bring one.
> _(Chillax body)_
>
> **[ Book a demo ]**
> _(the one forest button, repeated)_

### 7.12 Footer

Minimal, mono record voice. The product name, a contact email, and nothing that overclaims. No social
proof we do not have, no fake logos, no testimonials we cannot attribute. A quiet link to `/review` ("See
the demo") is fine.

## 8. Design language application (the Civic Record on the page)

Apply [design-language.md](design-language.md) directly:

- **Masthead** leads (section 7.1), with the one 2px ink rule beneath it.
- **Rule hierarchy, three weights by meaning:** the 2px ink masthead rule once; `--rule-section` between
  major page sections; `--rule-hair` for the smallest dividers and the before/after table rows. Lines do
  the structural work, not boxes.
- **Mono is the record voice:** the running head, the proof counts, any clause reference, any page number.
  Chillax is the human body copy. Fraunces is the section heads. Three voices, three jobs, never blurred.
- **Warmth at the 45% tokens, capped.** Paper background (never pure white), one soft ink-tinted shadow
  language on raised surfaces only (the hero resolve card, any lifted panel). Paper grain only on raised
  surfaces, never on the page or on scanning rows.
- **One forest button per viewport.** Forest is the only brand accent and it means "primary action".
  Signal hues (oxblood, amber, yellow, light-green) appear only on their status carriers in the embedded
  product visuals, never on page furniture.
- **Light paper only. No dark mode**, no theme toggle. The document is paper.
- **No nostalgia costume:** no drop caps, no sepia, no faux-newsprint, no halftone, no rules everywhere.
  The civic look is structure and restraint.

## 9. Motion and interaction

- **One animated moment only:** the hero resolve (section 6). It plays once on load.
- Everywhere else, motion only on a genuine state change (a button hover state, a focus ring). No
  scroll-triggered reveals, no parallax, no auto-playing carousels, no count-up number animations on the
  proof section.
- Respect `prefers-reduced-motion: reduce` (section 6 fallback).

## 10. Responsive and width caps

- **Two width caps**, as in layout.md: a centred container around 1160px holds the page; prose blocks are
  capped tighter (around 64ch) and left-aligned. The space beside the prose is the margin, the home for
  mono references in the embedded product visuals.
- **Below about 1100px:** the hero resolve simplifies to its final static state (the spine-only / drawer
  rules of the product do not apply here, this is marketing layout, but the animation must not become
  cramped or janky on small screens, so prefer the still).
- **Mobile (single column):** everything stacks in source order, the hero headline first, then the
  resolve still, then the body. The forest button is full-width-comfortable, not edge to edge. Tap
  targets at least 44px. The before/after table reflows to stacked rows, not a side-scroll.

## 11. Accessibility

- **Greyscale test:** the page must read with colour switched off. Hierarchy comes from the masthead,
  rules, and type, never from colour alone. Run it.
- **Contrast:** body and headings clear WCAG AA on paper. The forest button text clears AA on forest.
  Signal hues in embedded visuals never appear as bare low-contrast fills (the dot carries a 1px ink ring,
  per DESIGN-SYSTEM section 4).
- **Semantics:** one `<h1>` (the hero line), section heads as `<h2>`, real landmark regions
  (`header`, `main`, `footer`). The before/after table is a real `<table>` with headers.
- **Keyboard:** both CTAs are focusable in order with a visible focus ring; the page is fully operable
  without a mouse.
- **Images:** the hero resolve still and the source/excerpt stills carry honest alt text describing what
  they show (for example, "A tender requirement linked to its source clause on page 14").
- **Reduced motion:** honoured (section 6).

## 12. SEO and metadata

Set in `app/page.tsx` metadata, in voice, British spelling, no hype:

- **Title:** `Bidframe — never lose a bid to a deal-breaker you missed`
- **Description:** `Bidframe reads a public-sector tender, finds every requirement, flags the deal-breakers that would disqualify you, and links each to its source clause. Built for SME bidders and small bid-writing consultancies.`
- **Open Graph / Twitter:** same title and description; the OG image is the hero resolve still (the
  register with the deal-breaker settled), not a logo on a gradient.
- One `<h1>` only (the hero line). Canonical URL set to the deploy root.

## 13. Build notes

- **Route:** new `app/page.tsx` is the landing page; current home body moves to `app/review/page.tsx`
  (section 5). Update `SectionNav` and `DocumentHeader` matrix links from `/` to `/review`.
- **Reuse, do not rebuild:** the hero resolve uses the real `ComplianceMatrix` / `RequirementSpine` /
  `GatingHero` over `mockTender`. The masthead reuses the Civic Record masthead treatment (it may be a
  trimmed variant of `DocumentHeader`, or a small dedicated `LandingMasthead`, builder's call, but it
  shares the tokens).
- **Tokens and fonts are already wired:** Civic Record material tokens in `globals.css` `@theme`, the
  three faces via `next/font`. Do not introduce new fonts, new colours, or off-token shadows.
- **Copy lives in the component**, in the exact strings above. If any string is reused from the product,
  import it rather than retyping, so the two never drift.
- **Keep `main` runnable:** run `npm run build` and `npm run lint` before pushing; do not push a broken
  build. Regenerate the codemap in the same change if files are added or moved
  (`python scripts/gen_codemap.py`).

## 14. Analytics

One event per CTA: `demo_cta_click` (hero and footer can share it with a `location` property) and
`see_it_run_click`. Nothing else. Do not add a cookie banner's worth of tracking to a page whose whole
brand is restraint and honesty.

## 15. Out of scope (do not build these now)

- No pricing page or pricing numbers on the page (pilot pricing is a conversation, not a published tier).
- No testimonials, customer logos, or "trusted by" strip until we have real, attributable ones.
- No blog, no docs site, no newsletter signup.
- No live chat widget.
- No dark mode, no theme toggle.
- No self-serve signup. The only conversion is "Book a demo".

## 16. Open items (decisions or assets needed before ship)

1. **The demo booking link.** "Book a demo" needs a real destination: a scheduling link (for example
   Cal.com or Calendly) or a `mailto:` to the team's outreach address. J or Jawad to provide the URL. The
   button is built with a single, easily swapped href.
2. **The `/review` demo tender.** Confirm the preloaded demo uses a clean tender that always renders well.
   Mock by default is demo-safe; if `NEXT_PUBLIC_API_BASE_URL` points at live before outreach, confirm the
   key is on so the live catch does not miss (the headline raises the stakes on this).
3. **Confirm the proof tender description.** The page says "a live public-sector cleaning contract" (the
   SPSO ITT). Confirm we are happy naming it that generically, or whether to name the body.

## 17. The landing-page check (run before ship)

Any "no" is a blocker, not a nitpick. This is the page's gate, in the spirit of the civic-record check and
the copy check.

1. **One job.** Does every section move the reader toward "Book a demo", with one primary action per
   viewport?
2. **Civic record.** Does it read as an official record at a glance: masthead, one firm rule, mono record
   voice, real references?
3. **Copy check.** Does every string pass `copywriting.md` (source named where the tool acts, no
   overclaim, plain language, British spelling, no em dash, no hype, no exclamation, no emoji)?
4. **Honesty.** Does the proof use real counts, not scores? Does "Answers, with receipts" avoid implying
   the tool writes the bid? Is the flag shown as a strength?
5. **Slop and greyscale.** Does it pass SLOP-CHECK and read fully with colour switched off?
6. **Motion.** One resolve, plays once, with a static fallback under reduced motion. Nothing else moves.
7. **No dark mode, no decorative numbering, no nostalgia costume, no invented data.**
8. **Build green.** `npm run build` and `npm run lint` pass; `/` is the landing page and `/review` is the
   matrix; no in-product link points back at `/`.

## 18. Landing departures (forest uplift)

The forest uplift deliberately relaxes five constraints, on this page only. Each is named here so it is a
documented departure, not drift. The product screens keep the original rules in full; where a rule below
conflicts with an earlier section of this brief, this section wins for the landing page and nowhere else.

**Forest family as band ground.** The landing's dark bands (the proof band, the closing band, the footer)
stand on pine (`--color-pine`, `--color-pine-deep`) instead of the product's near-black ink. Reason: the
page's heaviest surfaces should carry the brand's own hue rather than a generic dark, so the record reads
unmistakably as Bidframe even in a screenshot. Paper on pine clears AAA (11.1:1); body text on pine stays
at 70% paper opacity or above, small mono at 60% or above. The product's `bg-ink` bands are untouched.

**A sanctioned engraved-botanical illustration programme.** The page carries one illustration language,
grown from the existing hero sprig: stroke-based line art in `currentColor`, `aria-hidden`, faint
`fillOpacity` leaf bodies, round linecaps. Ferns, pine branches, pressed leaves, a treeline and a seal all
speak this single grammar. Reason: the page needed visual warmth beyond two buttons and four ghost sprigs,
and one coherent engraving language adds it without importing a marketing skin the product would
contradict. Anything outside this grammar (photography, 3D, flat colour blobs) stays banned.

**Draw-on stroke animation.** Section 9 allowed one animated moment, the hero resolve. The botanicals are
now also allowed to draw themselves in: strokes trace on, then the faint fill washes in, once per piece.
Reason: an engraving that draws itself reads as the record being inked, the same metaphor as the resolve,
so the added motion deepens the one idea instead of decorating around it. It remains motion-safe: reduced
motion, no-JS and SSR all render the finished engraving, and nothing loops.

**Poster-scale typography moments.** A small number of sections (the deal-breaker head, the proof figures)
step up to poster scale, well past the type ramp the product uses. Reason: the page's spine is one catch
and three counts, and at reading size they carried no more weight than the copy around them. Poster scale
gives the page's two decisive beats the emphasis they earn. It stays rationed: a handful of moments, never
a default, and the counts remain plain counts, never animated.

**The moss third surface.** Between paper and pine the page gains moss (`--color-moss`, with
`--color-moss-line` as its hairline), a pale green-grey surface for the honesty band and the "With
Bidframe" table column. Reason: the middle of the page was a monotone beige corridor, and a third surface
tone lets sections alternate ground without reaching for boxes, borders or gradients. Moss is a landing
surface only; the product keeps its two-surface paper system.

---

*Changelog*
- *2026-06-29 — v1, Frontend. Headline and section copy locked, routing change to `/review` specified,
  hero resolve reuses the named design-system transition, proof translated to plain counts. Open items:
  booking link, live-key confirmation, proof-tender naming.*
- *2026-07-01 — v1.1, Frontend. Added section 18, the landing departures for the forest uplift: pine and
  moss as landing surfaces, the engraved-botanical illustration programme, draw-on stroke motion,
  poster-scale moments. Tokens and motion CSS landed in `globals.css`; components follow.*
