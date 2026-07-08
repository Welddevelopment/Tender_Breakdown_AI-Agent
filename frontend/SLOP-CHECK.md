# Bidframe Slop Check

A subset of the Bidframe design system (see [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)). Read this
before you add a wireframe of any screen. It exists so the UI looks chosen by a person with taste, not generated. If your
screen passes this, the frontend handoff is faster and there is less for Jawad to redo. Use
[QA.md](<UI/UX/Motion Overhaul/QA.md>) for stage acceptance and
[delete.md](<UI/UX/Motion Overhaul/delete.md>) before adding another surface.

## Why this exists

AI slop is the absence of choices. It is what you get when every default is left
untouched. The whole Bidframe pitch is turning weeks of specialist tender work into an
afternoon for a normal person, so the product has to feel calm, warm, and credible. One
off palette, one generic layout, one hype headline, and procurement people stop trusting
it. This protocol turns "do not look like AI" into rules you can actually check.

But slop has a twin, and it is the one biting us now: **flat, timid design**. When every rule
reads as a prohibition, the safe move is to make nothing, and a screen where no choice was risked
is as much a tell as a generic one. So read this doc as a floor, not a ceiling. Its job is to kill
the generic, not to talk you out of a bold, deliberate move. A screen that took a real swing and is
a little rough beats a screen that played it flat. If you are unsure whether something is too much,
that usually means it is worth trying, then editing back.

## Foundation (the settled part)

- **Palette: Paper, Forest, and Pine.** Warm paper background, never pure white. Deep earthy
  forest green is the action and guidance colour, earned not sprayed. Pine/moss are the deeper
  forest-led grounds used for landing, demo, pack, upload resolve, and other arrival moments. Ink near
  black for text. No second generic brand colour.
- **Voice: calm and specific.** Plain language for a busy non expert. Say the real thing,
  not the benefit. Example: "We drafted this from your last bid. Check it before it is
  submitted."
- **Typeface: locked.** Fraunces for headings, Chillax for body, IBM Plex Mono for evidence and
  source references. Six sizes, two weights of Fraunces. Do not introduce Inter or Geist. See
  DESIGN-SYSTEM section 11.
- **Layout: settled.** One tender fills the screen with no left rail, a Next-led header, a one-line
  matrix that reads like a contents page, and a split open state (the matrix shrinks to an index spine,
  the panel takes the room). Interactivity scales with stakes. See DESIGN-SYSTEM section 12 and
  [layout.md](layout.md).
- **Design language: forest-led civic record.** Bidframe is guided by forest, verified by the record.
  Forest is the brand/emotional layer: memorable, protective, and continuous across landing, demo, upload,
  collaboration, and primary action. The civic record is the proof/work layer: masthead, three-weight
  rules, numbered register, ruled margin, mono record voice, approval stamp. Warm paper connects them.
  See DESIGN-SYSTEM section 13 and [design-language.md](design-language.md).

## The slop check (run before you commit a wireframe)

1. **Greyscale test.** View the screen with no color. Does the layout still read and rank
   correctly? If it only works because of color, the structure is lazy. Fix the structure.
   Status especially: every status must stay legible here through its dot fill and a word, so
   color only speeds the glance and is never the only channel.
2. **Name one intentional choice.** Point to a single deliberate, slightly unexpected
   decision on the screen (an off center anchor, a dense table that earns its density, a
   confident piece of whitespace). If you cannot name one, it is not done.
3. **Tells scan.** Run the screen against the two tiers below. A tier-1 hit (a genuine slop
   giveaway) is a blocker. A tier-2 default you have broken is fine if you can name why, and only
   a prompt to check yourself if you cannot.
4. **Real content.** No lorem, no three identical demo rows. Use real tender titles,
   awkward field names, answers long enough to wrap. Design the empty state and the error
   state too.

## Principles (short version)

- One primary action per screen. The user always knows the next step.
- Progressive disclosure. The compliance, legal, and audit complexity lives one click
  away, not on the default view.
- Density is allowed. This is a document tool, so tables and lists can be tight and that is
  good. Do not pad it out into a landing page.
- Warmth comes from softness and space, not decoration. Flat surfaces, one soft shadow
  language used sparingly.
- The AI reads as a helpful colleague, never silent automation. A suggestion is a draft you
  approve, and it shows where it came from.
- Explore, then edit down. Push a surface further than feels safe, find the one bold move it
  wants, then trim back to what earns its place. Flat is a failure mode, not a safe harbour.

## The tells, in two tiers

The old version of this list was one flat wall of "hard nos", and that is part of why screens went
flat: when everything is forbidden, the safe move is to make nothing. So it is split in two. Tier 1
is the genuine slop giveaways, the actual fingerprints of generated design. Catch one and it does not
ship. Tier 2 is the house style: strong defaults with a reason attached. Break a tier-2 default when
the screen is better for it and you can say why out loud. A broken default with intent is design. A
broken default by accident is slop. The test is whether you can name the reason.

### Tier 1 — real tells (hard nos)

Any hit is a blocker.

**Colour and surface**
- Blue, teal, purple, or indigo sprayed as a generic primary or accent. The number one tell. (Our
  cool accent teal is the one earned exception: it carries a single meaning, "traceable to source". A
  new cool colour with no meaning is the tell.)
- Gradients used as decoration. Glassmorphism. Neon on dark.
- Pure white (#fff) or pure black (#000).
- Gradient text.

**Layout**
- The three-column icon-card feature grid. Bento grids. A hero with a glowing blob. The stock
  generated layouts.
- A row of summary stat tiles standing in for the honest triage worklist.

**Copy**
- Em dashes. Banned from all product copy. Use a period, a comma, or a colon instead.
- "Supercharge", "Seamlessly", "Unlock", "Elevate", "Effortlessly", and three-word hype taglines.
- Exclamation marks and vague benefit speak. Say the specific, real thing.

**Content and motion**
- Lorem ipsum or suspiciously clean placeholder data. Undesigned empty and error states.
- Fade-up-on-scroll applied to everything. The same default shadow on every surface with no meaning.

### Tier 2 — strong defaults (break them on purpose)

The settled house style, with the reason for each. This is where the flatness has been creeping in,
so treat these as starting points, not walls. Depart deliberately, and be able to name why.

- **Status colour rides on status carriers.** By default the signal hues (confidence red, amber,
  yellow, green) stay off buttons, nav, headings, and backgrounds, so status reads clean and survives
  the greyscale test (see DESIGN-SYSTEM section 3). Explore other emphasis freely, just keep status
  legible without colour.
- **Forest must have a job.** It can carry first impression, guidance, primary action, live
  collaboration, upload/processing resolve, and demo momentum. It cannot be sprayed as a decorative green
  tint on every card, table, badge, or border.
- **Grain and depth on raised surfaces.** Default: grain and lift on the lifted sheet, gating callout,
  and upload card, kept off the scanning rows and the page so the rows still scan. A hero surface can
  carry more material as a named forest-led surface.
- **Depth means focus.** By default nothing floats decoratively and only the worked surface lifts. A
  deliberate focal moment (a hero, the upload resolve) can break this.
- **One heavy (2px ink) rule per screen.** A good default for rhythm; the masthead rule is the one. A
  screen with a different structural idea can rule differently.
- **Short, human headlines.** Keep them tight; if one runs to two long lines, look hard at it. A longer
  line can still earn its place.
- **Pills, eyebrows, kickers, header icons, accent bars, card wrappers.** None are banned outright.
  They are just what generators reach for by habit, so each has to earn its place rather than appear by
  default. An eyebrow that orients, a pill carrying real state, header icons that aid scanning, a
  register of real clause refs (`Section 4.2.1`, `req-0001`, which is data, not decoration): all fine.
  What to avoid is a card around every element, cards nested in cards, and a fat colour slab where a
  thin near-square accent (hairline up to ~2px) and the confidence dot would carry the status.
- **Hold reading prose to a comfortable measure** (about 64 characters). A readability default for
  requirements and drafted answers, not a cap on every text element.
- **The layout carries the stakes.** The risky and the safe should not look or behave identically; give
  gating rows more weight. This one is close to a rule, because it is the product's honesty.
- **Find one point of intentional tension.** Not everything centred and symmetric with equal padding.
  This is less a restriction than the whole invitation: an off-centre anchor, a dense table that earns
  its density, a confident asymmetry, a bold focal move. This is the exploration the doc wants.
- **Navigation stays in the header** on this single-document app, no persistent left rail (see
  DESIGN-SYSTEM section 12). One tender fills the screen. This one holds.
- **Nostalgia costume stays out.** No drop caps, halftone, sepia, faux-newsprint. The record look comes
  from structure, not period pastiche, and the approval mark stays a clean geometric stamp, never a
  distressed texture. This one holds too.

---

Got a case you think deserves an exception? Post on your comms board and tag @frontend.
Jawad owns the final call on the design system.
