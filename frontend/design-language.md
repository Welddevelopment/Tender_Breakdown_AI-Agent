# Bidframe Design Language: The Civic Record

The visual identity that sits on top of the layout. This is the deep manual behind section 13 of
[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md). [layout.md](layout.md) decides where things sit, this decides what
they feel like. [copywriting.md](copywriting.md) decides what they say. Colour values live in
[design/colours.html](design/colours.html), and the material tokens defined here are the companion to
those. Every rule is given twice: the technical version a builder works to, and the plain version anyone
on the team can hold us to.

## The one idea

**Bidframe presents your bid as an official record in progress.** A public document with a masthead, ruled
structure, numbered clauses, a margin of citations, and an approval stamp. It reads credible the instant a
procurement person sees it, because it looks like the official register it effectively is.

Three ingredients, in order of authority:

1. **Editorial structure** (the form): masthead, rules, columns, marginalia, a register.
2. **Brutalist honesty** (the discipline): exposed structure, the mono record voice, raw rules, no
   decoration. The form is the function, which is the same promise as auditability.
3. **Warmed paper at 45%** (the material): soft depth and a faint grain so it never feels machine-cold.

## The bet, and who it serves

This is a deliberate bet, recorded so it can be defended or revisited. It serves two readers at once:

- **The procurement buyer** reads it as credible immediately. It looks like a serious, submittable
  official document, not a startup dashboard.
- **The SME bid writer** (a nervous non-expert) is reassured that what they are producing looks legitimate.
  The civic structure lowers their anxiety, and the warmth keeps it from feeling forbidding.

## The tension, and the rule that holds it

Brutalism and warming pull in opposite directions. Brutalism is raw, stark, anti-decoration. Warming is
soft, paper, comfort. They are paired on purpose, because each fixes the other's failure mode:

- **Warmth stops the civic record going cold.** A pure brutalist document reads like a tax form: credible
  but forbidding, the last thing a nervous user needs.
- **The civic record stops the warmth going twee.** Paper and softness alone drift toward scrapbook-cosy,
  which wrecks credibility.

The holding rule: **warmth is the material, the civic record is the form, and the form leads by default.
Where they conflict, structure usually wins, but not always.** A surface with a reason to let warmth or
expression lead can take it, the way the landing page does (a sanctioned departure, below). That default
keeps this from becoming a cold form or a craft project. Watch for two failure modes, not one: the cold
tax-form, whose antidote is warmth at 45%, and the flat, timid screen that risked nothing, whose antidote
is a deliberate bold move. Restraint is a tool here, not the goal.

## The material: warmth at 45%

45% is the level chosen on the warmth dial in [design/warmth.html](design/warmth.html). It translates to
the concrete tokens below. These are the material tokens, the companion to the colour tokens in
colours.html, and they belong in `globals.css` as Tailwind `@theme` values during the build.

| Token | Value | Used on |
|---|---|---|
| `--depth-sheet` | `0 6px 19px rgba(33,29,23,0.10)` | The lifted sheet (the side panel), the upload card |
| `--depth-row` | `0 2px 7px rgba(33,29,23,0.07)` | The active matrix row only |
| `--depth-pressed` | `inset 0 1.5px 3px rgba(33,29,23,0.066)` | The evidence block, pressed into the page |
| `--depth-control` | `0 1.6px 2px rgba(33,29,23,0.13), inset 0 1px 0 rgba(255,255,255,0.13)` | The primary forest button |
| `--paper-recessed` | `#EFE7D6` | The ground under a pressed evidence block |
| `--grain` | `0.25` | Opacity of the paper-grain overlay on raised surfaces |

**The grain rule (no holes).** The paper grain appears **only on raised paper surfaces**: the lifted
sheet, the gating callout, the upload card. It **never** appears on the page background or on the scanning
matrix rows, which stay clean so they still scan. The grain is one shared CSS background utility (a data
URI of fractal noise at `--grain` opacity, `mix-blend-mode: multiply`), never a per-element canvas.

**The shadow rule.** One soft shadow language, ink-tinted (`rgba(33,29,23,...)`), never pure black, used
only on raised surfaces. Depth always means focus: if a surface is not the thing you are working on, it
does not lift. Nothing floats decoratively.

## The device kit

Six devices carry the identity. Each restyles something that already exists, it does not invent a new
component.

### 1. The masthead

**Technical.** The shipped `DocumentHeader` becomes a nameplate. Three stacked parts in the title zone: a
running head "BIDFRAME" in IBM Plex Mono, uppercase, ~11px, letter-spacing ~0.12em, ink-muted (faux
small-caps by tracking, since Plex Mono has no true small-caps); the tender title in Fraunces 600 at the
24 size; and a reference line in mono drawn from available tender metadata (the requirement count, and the
tender id if present), never an invented reference format. Beneath the whole header sits one
`--rule-strong` (2px ink) full-width rule. The existing triage line, the single Next action, and
`SectionNav` (the Upload / Matrix / Answers / Graph underline) stay exactly as shipped.

**Plain.** The top of the screen reads like an official letterhead: who this is, the document title, and a
reference line, with one firm line ruled underneath. It is the first thing the eye lands on.

### 2. The rule hierarchy

**Technical.** Three rule weights, used by meaning, never more:

- `--rule-strong`: `2px solid var(--ink)`, the masthead rule, at most once per screen.
- `--rule-section`: `1px solid #D9CFBB` (one step darker than hairline), used between triage groups and
  between major panel zones.
- `--rule-hair`: `1px solid var(--hairline)`, row lines and minor dividers.

**Plain.** Lines do the structural work. One firm line says "official document", a slightly darker line
separates sections, the faint line separates rows. The eye reads them as deliberate, not timid.

### 3. The register

**Technical.** In the full matrix, each row gains a quiet reference in a left margin column. The grid
becomes `[ref ~52px] [dot 22px] [text 1fr] [status auto]`. The reference is the real `source_clause` (for
example `4.2.1`), set in mono, ink-muted, ~12px, right-aligned in its column so the references form one
clean ledger edge. It stays subordinate to the requirement text and never competes with it. In the narrow
index spine (open state), the reference column drops, the spine stays dot plus one-line requirement per
layout.md.

**Plain.** The list reads like a numbered official register, each line carrying its clause reference down a
tidy left margin, the way a real compliance schedule does. The numbers are real data, not decoration.

### 4. The ruled margin

**Technical.** In `RequirementPanel`, a single `--rule-hair` vertical rule separates the 64ch prose column
from the mono margin. Citations, source and page refs, and the self-writing audit line live in that
margin, in mono.

**Plain.** The working sheet has a ruled margin like a ledger or a legal document. The warm body text sits
in its column, and everything machine-stated runs down the margin past the rule.

### 5. The mono record voice

**Technical.** Three type voices with three jobs: Fraunces is the official titles, Chillax is the human
draft, and IBM Plex Mono is **the record**: source refs, requirement ids, page and clause numbers,
timestamps, machine-stated status, and the audit line. This narrativises the mono role already set in
DESIGN-SYSTEM section 11, it does not add a fourth face.

**Plain.** Anything that is the official printed record, the references, the IDs, the timestamps, is in the
typewriter face. The warm draft you are reviewing is in the body face. The two never blur.

### 6. The approval stamp

**Technical.** On approval, the confidence dot is replaced by an approval mark presented as an official
stamp: a forest tick (or the word "Approved" in mono), set slightly off-axis at about 2 to 3 degrees, like
a hand stamp, landing with a settle (the motion pass specifies the timing). Beside it, in mono, "Approved
by you, 14:32." The slight rotation is the one earned imperfection, applied only to the mark container,
never to body text. It is a clean geometric mark, never a distressed or rubber-stamp texture.

**Plain.** Approving something stamps it, the way an officer stamps a form. A small forest mark lands
slightly askew and settles, with your name and the time beside it. That is the signature moment the screen
was missing.

## How this improves the composition (problem B)

The flat layout felt like a boring list because every element had equal weight and there was no focal
point. The device kit attacks exactly that: the masthead gives the eye an anchor, the rule hierarchy gives
rhythm, the register and ruled margin give the list editorial backbone, the stamp gives a focal payoff,
and the gating rows (a deep oxblood-frame reading edge, more room, the bright oxblood alarm dot) carry deliberate weight. So the civic
record is not decoration on top of warming, it is the answer to "the composition could be improved".

## Guardrails (so the docs have no holes and nothing slips into slop)

These stop the generic, they do not cap the ambition. Each is a default with a stated reason, so depart
from it deliberately when a surface is better for it. What you cannot do is drift past one by accident.
The test is the same throughout: can you name the reason.

- **Real data, not decorative numbering.** The register's clause references are the schema's `source_clause`
  and `id`. SLOP-CHECK bans decorative kicker numbers (01 / 02 / 03), not a real compliance register. The
  two are different things.
- **No nostalgia costume.** No drop caps, no halftone images, no sepia, no faux-newsprint, no rules
  everywhere. The civic look comes from structure and restraint, not period pastiche. This is what keeps
  "the civic record" from becoming "old newspaper" slop.
- **The stamp is a clean mark**, never a texture.
- **Warmth sits around the 45% tokens by default.** The brutalist discipline keeps depth from creeping up
  everywhere by habit. One soft shadow language on raised surfaces is the resting state, but a hero surface
  (a landing, the upload resolve) may push past it on purpose, as a named departure.
- **Grain only on raised surfaces**, never on the page or the scanning rows.
- **Light paper only. There is no dark mode**: the document is paper.

## Relationship to the current build

This restyles the components the layout pass already shipped, it does not re-architect them.
`DocumentHeader` becomes the masthead. The matrix grid (in the matrix and `RequirementSpine`) gains the
reference column and the rule hierarchy. `RequirementPanel` gains the lifted sheet, the ruled margin, the
pressed evidence block, and the stamp on approve. The deal-breaker rows and the flattened `GatingHero`
gain weight; the reading edge is the deep `oxblood-frame` tone (the `GatingHero` spine at 3px) while the
bright `oxblood` carries the dots and the bead — a fill/frame two-tone. `SectionNav` is unchanged. The material tokens above go into
`globals.css` `@theme`. Where this document and the build disagree, treat it as intent to grow into, and
raise anything expensive on the frontend comms board.

## What motion will animate (named here, specced later)

Two hero moments belong to the motion pass, but the design language names them so they are not invented
from scratch later:

1. **The upload-to-matrix resolve**: the raw document being filed into the register.
2. **The approval stamp settle**: the mark landing and settling onto the sheet.

## The civic-record check

Run a screen past these. Treat a "no" as a prompt to check your intent, not an automatic veto: a
deliberate, nameable departure can answer "no" and still be right. An accidental "no", or a sixth "the
screen is flat and safe", is the real blocker.

1. Does it read as an official record at a glance (a masthead, one firm rule, references present)?
2. Are depth and grain earning their place, kept off the scanning rows so they still scan?
3. Is every official flourish backed by real data, with no decorative numbering and no nostalgia costume?
4. Is the warmth deliberate rather than crept-up, with one coherent shadow language?
5. Does it still pass the base slop check and the greyscale test?
6. Did the screen take at least one real swing, or did it play flat and safe?
