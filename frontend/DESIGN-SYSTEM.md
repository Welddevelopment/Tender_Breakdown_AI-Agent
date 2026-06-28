# Bidframe Design System

Bidframe turns weeks of specialist tender work into an afternoon for a normal person. The job
of this design system is to make a non-expert feel confident and unstuck at every step: calm,
guided, and honest. This document is the source of truth for how Bidframe looks and behaves.
[SLOP-CHECK.md](SLOP-CHECK.md) is the enforceable subset: the banned list and the gate you run a
wireframe against.

**Status:** living draft, open for team feedback. Exact color values are provisional and will be tuned
by frontend. The typeface is locked: Fraunces for headings, Chillax for body (see section 11).

## 1. Philosophy: confident calm

- One primary action per screen. The user always knows the next step.
- Progressive disclosure. The compliance, legal, and audit depth exists one click away, never on
  the default view.
- Honesty over polish. The tool says what it is sure of and what it is not. It never guesses
  silently.
- The AI is a helpful colleague, not a black box. Every suggestion is a draft you approve, and it
  shows where it came from.
- Warmth comes from softness and space, not decoration.

## 2. Voice

Plain, specific, calm. Written for a busy non-expert under deadline. Say the real thing, not the
benefit.

- Good: "We drafted this from your Capability Statement, p.4. Check it before it goes in the bid."
- Not: "Effortlessly autofill your tender responses."

Product copy uses **British spelling** (UK public-sector audience). No em dashes in any copy, ever.

## 3. Color: two palettes, strictly separated

Bidframe uses two color sets that never mix. This is the single most important rule for not looking
like a noisy AI dashboard.

### Brand palette (the app's furniture)

Everything structural: backgrounds, text, buttons, navigation, headings.

| Token | Role | Provisional |
|---|---|---|
| Paper | App background, never pure white | `#F6F2E9` |
| Paper-raised | Lifted surface (a panel) | `#FBF8F1` |
| Ink | Primary text, warm near-black | `#211D17` |
| Ink-muted | Secondary text | `#6B6358` |
| Forest | Primary actions, brand accent, approval signature | `#2C5640` |
| Forest-hover | Hover and pressed shade of Forest | `#21412F` |
| Hairline | Dividers, thin borders | `#E4DDCE` |

### Signal palette (status only)

Used ONLY on status carriers: the confidence dot, a thin (max 2px) answer edge, a status cell in the
matrix. Never on a button, background, heading, or nav. At most one signal hue per row or panel.

| Token | Meaning | Provisional |
|---|---|---|
| Oxblood | Critical: unanswerable, or gating and unresolved | `#8A2D2A` |
| Amber | Low confidence: treat as a rough draft | `#BC6B2E` |
| Yellow | Minor caution: glance before trusting | `#D2A435` |
| Light-green | Confident: quick read and approve | `#6F9A57` |

Light-green (AI confidence) and Forest (human approval) do two different jobs and must stay clearly
apart in tone. Approval always carries a tick and a settled style as well, so the two greens are never
confused, including in greyscale.

**Copy-paste reference:** [design/colours.html](design/colours.html) renders every swatch with
click-to-copy hex and a "copy all as CSS variables" button. It is the single source of truth for the
exact values; keep it and this table in sync.

These hex values passed a contrast and greyscale audit. Yellow and light-green are too low-contrast as
bare fills on paper, which is why signal never appears as a bare block: see the dot in section 4.

## 4. The status model: two axes, never one ramp

Two different questions, shown with two different devices.

### Axis 1: Confidence (how sure is the AI?)

The **confidence dot**, on a four-tier scale, worst to best:

1. **Oxblood** - could not answer, or a deal-breaker with no good answer. Stop and look.
2. **Amber** - unsure. Rough draft, check it properly.
3. **Yellow** - fairly sure, minor caution. Glance before trusting.
4. **Light-green** - confident. Quick read and approve.

The dot always carries a **1px Ink ring** and **fills by tier** (quarter, half, three-quarter, full),
so the level reads with color switched off and every dot clears the 3:1 graphical contrast floor on
paper regardless of its hue. A word always sits beside it ("Low confidence", "Confident"). Never a raw
number like 0.92.

### Axis 2: Approval (has a human signed off?)

A separate device: a **solid forest-green tick** plus a settled style. Maps to `status`:
pending / accepted / edited / flagged. Approval can sit on top of any confidence tier. Approving a
yellow answer is honest and recorded as exactly that: signed off despite medium confidence.

When you approve, the light-green dot gives way to the solid forest tick under your hand. That small
settle is the only celebration the moment needs.

## 5. The signature component: the AI-suggested field

For each requirement, Bidframe shows a drafted answer to review, not a blank field to fill. **It is a
review surface, not an input surface.** The default action is approve, not type. Typing (edit, or
filling a gap) is the exception, which is why it can look distinct.

Anatomy, top to bottom, mapped to the schema:

1. **Requirement** (`text`) with a quiet gating/mandatory marker, and its source (`source_clause`,
   `source_page`) as a subtle link to the verbatim tender excerpt.
2. **Drafted answer** (`answer.text`), provisional until approved, with a 2px accent edge, never a
   slab.
3. **Confidence dot + word** (`answer.confidence`).
4. **Evidence** (`evidence_refs`): "Backed by your Capability Statement, p.4", expandable in place to
   the highlighted verbatim excerpt. Two-sided traceability: the tender clause it answers, and your
   document that backs it.
5. **Controls**: Approve (leads, the one forest button), Edit, Flag. Below them an audit line that
   writes itself: "Approved by you, 14:32" or "Edited by you. Original AI draft kept."

### States (from `answer.state` + `status` + `needs_review`)

- **Drafted (confident)** - calm, provisional, light-green dot. Glance and approve.
- **Low confidence** - visibly hesitant, amber or oxblood dot. Pulls you in to verify.
- **Needs you** (`needs_input` + `open_questions`) - not a draft. Shows the question read-only with a
  single link into the gap review (section 7).
- **Edited** - your words now, the AI draft kept in history for audit.
- **Approved** - settled, forest tick, your name and timestamp recorded.
- **Flagged** - parked for a teammate or for later.

## 6. The side panel

Clicking a requirement opens a **focused side panel** (one task at a time), not an in-row expand.
Inside, it is flat: a paper-raised surface, hairline dividers between zones, hierarchy from type and
space. No nested cards, no chunky bezels. The four zones match the component above (requirement,
answer, evidence, decision), with controls and the audit line pinned to the bottom. Only one thing is
emphasized at a time.

## 7. Triage and the work summary

The top of the matrix always shows the shape of the work, not a fake "all done":

> 8 need your input · 12 to verify · 40 ready to approve

The metric Bidframe optimizes for is **attention-routing, not answer-count.** Even a weak AI run
becomes a clear worklist. This is a first-class component, not a footnote.

### Gap review (`/answers`)

Open questions are pulled into a focused `/answers` pass, because one answer (an ISO expiry date, say)
can re-draft several requirements at once, and answering is a slower, brain-on headspace than
reviewing. The side panel only surfaces a gap read-only with a link into this flow. Exception: a
single trivial open question may be answered inline.

## 8. Interaction principles

- **Review, don't type.** Approve is the main verb.
- **Friction is a feature, placed by stakes.** The "approve all confident answers" sweep only touches
  non-gating, high-confidence items. Gating and low-confidence items are always confirmed one at a
  time. Bulk approve is reviewable and undoable, and shows exactly what it touched. Gating approval
  needs a named confirm: "This is a deal-breaker requirement. Confirm your answer is accurate."
- **The audit trail writes itself** from ordinary actions (approve, edit, flag), recording who, what,
  when, and bulk vs individual.

## 9. Motion

Calm and still almost everywhere. **One hero transition:** upload to extract to triaged matrix, where
raw PDF resolves into the structured matrix and the triage summary lands. That is the demo showpiece.
Everywhere else, motion only on a genuine state change (a suggestion appearing, light-green settling
to forest on approval).

## 10. Surfaces and shape

- Backgrounds are warm paper, never pure white or pure black.
- Flat or near-flat. One soft shadow language, used sparingly.
- Modest radii. No oversized bezels or chunky rounded accent bars (see SLOP-CHECK).
- Accent edges are thin (hairline up to 2px) and near square.

## 11. Typography

Calm warmth, not loud warmth. **Fraunces** (soft serif) for headings, **Chillax** (rounded sans) for
body, **IBM Plex Mono** for evidence and source references. Both display faces are free: Fraunces from
Google Fonts, Chillax from Fontshare. The pairing is distinctive without looking like every other tool,
and it sits inside Paper and Forest.

| Role | Face | Weights | Sizes |
|---|---|---|---|
| Heading | Fraunces | 600 (500 for quiet sub-heads) | 34 / 24 / 19 |
| Body | Chillax | 400 (500 labels and buttons, 600 rare emphasis) | 16 / 14 |
| Label | Chillax | 500 | 12.5 |
| Evidence | IBM Plex Mono | 400 | 12.5 |

Six sizes, no more. A short scale is what keeps it from looking templated. Headings stay short (Fraunces
earns its warmth in a few words, never a long headline, see SLOP-CHECK). Serif is used sparingly:
headings and the odd hero number only, never in dense UI. No thin Chillax weights on paper.

**Numbers live in the mono evidence style.** Confidence is never a number, so almost every digit in
Bidframe is a page or clause reference. Setting those in mono aligns columns, sidesteps any
figure-rendering worry in Chillax, and reinforces "this is the document talking."

Tokens: `--font-head` (Fraunces), `--font-body` (Chillax), `--font-mono` (IBM Plex Mono), defined next
to the colour tokens in [design/colours.html](design/colours.html). If Chillax ever feels soft in the
densest rows during the build, swapping `--font-body` to Hanken Grotesk is a one-line change and nothing
else moves. Full reference with the scale shown in context:
[design/typography.html](design/typography.html).

## 12. Relationship to the slop check

`SLOP-CHECK.md` is the enforceable subset of this system: the banned list and the pre-wireframe gate.
If this document is the intent, the slop check is the gate. When the two disagree, fix one to match
the other and say which.
