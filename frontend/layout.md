# Bidframe Layout

How Bidframe arranges a screen. This is the structural companion to
[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) (the intent) and [SLOP-CHECK.md](SLOP-CHECK.md) (the gate). Colour
and type are settled elsewhere; [QA.md](<UI/UX/Motion Overhaul/QA.md>) measures whether the layout
works, and [delete.md](<UI/UX/Motion Overhaul/delete.md>) catches surfaces that should be removed or
merged. This file is about where things sit, how the screen reacts, and why.
Every rule is given twice: the technical version a builder works to, and the plain version so anyone on
the team can hold us to it.

## The principle: the layout carries the stakes

Calm by default, friction by stakes, and the layout itself is one of the things that carries the stakes.

AI slop is uniform. Every element gets equal weight, equal spacing, equal interactivity, so nothing tells
you where to look. Bidframe is deliberately *unequal* in a way that maps to risk: a confident, low-stakes
item is light and quick to clear, a gating or low-confidence item is heavier and makes you stop and open
it. The structure tells you how hard to look before you have read a word. This extends section 8 of the
design system ("friction is a feature, placed by stakes") from interaction into layout, and it is the one
idea the rest of this document serves.

## 1. The shell: no global rail

**Technical.** No persistent left sidebar. The product has two shell levels. The *app level* is a tenders
list on its own screen. The *document level* is one tender, with no standing nav. Inside a tender the only
navigation is a contextual back link to the tenders list, in the header. Other modes (the `/answers` gap
pass, the graph view) are reached contextually, from the triage line or a row, not from a permanent menu.
If a view switcher is ever genuinely needed, it lives in the header, never in a left rail.

**Plain.** No standing menu down the side. One bid fills the screen. The way "out" is a back link at the
top, because mid-review there is nowhere else you would want to jump.

A persistent left rail is the number one dashboard tell, and it is wrong here: there is nothing to
navigate to while you work. Killing it reclaims the whole column for the work.

## 2. The document header: three zones, one action

**Technical.** A thin header, not a marketing bar. Three zones:

- **Left:** the tender title (the one place Fraunces appears in the header) plus the back breadcrumb.
- **Centre:** the triage line (`8 need your input · 12 to verify · 40 ready to approve`). Each segment is
  a quiet button that filters and scrolls the matrix to that group. This is navigation *within* the page,
  not to another page.
- **Right:** exactly one primary action, "Next", which routes to the highest-priority unresolved item
  (see the priority order below). When nothing is unresolved it becomes "Export" and opens the artifact
  choices: compliance matrix, bid response draft, audit/evidence pack, and all files if supported.

Priority order for Next: (1) gating, unresolved, (2) needs you (`open_questions`), (3) low confidence to
verify, (4) anything else still pending. When all are resolved, Next becomes Export.

The bulk "approve all confident" sweep does **not** live in the header. It lives scoped at the head of the
Ready group, where it can be honest about exactly what it touches.

**Plain.** Up top: what bid this is, a map of the work, and one button that always knows what you should
look at next. Never a toolbar of ten buttons. The big "approve everything safe" action is not up here; it
sits with the safe items where it belongs.

**Rule.** One primary action in the header, ever.

## 3. The resting matrix: a contents page, not a table

**Technical.** Each requirement is one row on a shared grid:
`grid-template-columns: [dot] ~28px [text] 1fr [status] auto`. Every row shares the grid, so two clean
vertical edges form: a left reading edge where requirement text starts, and a right edge where the status
word sits. Rows are grouped by the ask (Needs you / To verify / Ready to approve), and the group label is
the only recurring heading in the list, set in Chillax 500 label style (12.5), not Fraunces. Gating items
carry a quiet gating marker in the row and are weighted so they stand out (per the frontend visual rules
in AGENTS.md), and they never get the inline approve of section 4.

**Plain.** The list reads like the contents page of the bid. The requirement text carries each line, a dot
on the left says how sure the AI is, the status sits in a tidy column on the right. Items are grouped by
what they need from you, with a small quiet label over each group. The scary gating ones look heavier.

**Rule (rows are one line).** One line per item so it scans. The drafted-answer preview is a second muted
line shown only on hover or keyboard focus, never a permanent two-line wall on every row. The preview is
an aid, not the only way to see the answer: the full answer always lives one click away in the panel, and
the row stays fully usable by keyboard with no hover at all.

## 4. Row interactivity scales with stakes

**Technical.** The controls a row exposes are a function of confidence and gating.

- **Confident, non-gating** rows expose a single quiet approve affordance, revealed on hover or focus at
  the row's right end. The item can be approved straight from the list. This is the single-item form of
  the section 8 sweep, and it is recorded in the audit trail exactly like any approval.
- **Low-confidence, gating, or needs-you** rows expose *no* inline action. Clicking does one thing only:
  open the panel. The friction is the layout.

This is a single control, not an in-row expand, so it stays consistent with section 6 ("not an in-row
expand").

**Plain.** The safe stuff you can wave through straight from the list. The risky stuff gives you no
shortcut: it makes you open it and look it in the eye. The shape of the row tells you which kind it is.

## 5. The open state: split, with the matrix as a spine

**Technical.** Opening a row does not modal over the matrix. The matrix collapses to a narrow index column
(~300px: dot plus one-line requirement, current row marked), and the panel takes the remaining width as
the focus. This is the split open state. Clicking another spine entry moves the panel without closing it,
so you flow through the worklist: approve, next, approve, next. A "next" within the panel advances to the
next item in the current triage group; at the end of a group it rolls to the first item of the next group.

Below roughly 1100px of width the split is not viable: the panel becomes a drawer over the matrix and the
spine drops. The spine is *content* (this document's own items), not a nav rail (links to other features),
which is what keeps it clear of the slop gate in section 1.

**Plain.** When you open an item, the full list shrinks to a slim table of contents down the left so you
never lose your place, and the thing you are reading gets the room. You step to the next item from that
spine. On a small screen the panel just slides over the list instead.

## 6. The panel internals: zones, measure, and a real margin

**Technical.** Flat zones separated by hairlines, top to bottom: requirement, drafted answer, evidence,
decision, with the controls and the self-writing audit line pinned to the bottom (section 6). The body
text column is capped at about 64ch regardless of how wide the panel is. The space to the right of that
column is the margin and it has a job: evidence chips, source and page references, and the audit line live
there, set in IBM Plex Mono.

**Plain.** The panel is one sheet read top to bottom. The warm body text stays in a comfortable reading
column. Everything machine-ish, the citations, page refs, the "approved by you, 14:32" line, runs quietly
down the margin like footnotes. The margin is where "the document talking" lives, so the mono has a home
and never gets scattered through the warm text as noise.

This also pre-builds the place where skeuomorphic margin annotations will sit later (section 9 below).

## 7. Hierarchy without boxes: the spacing rule

**Technical.** Hairlines (`border-top: 1px hairline`) separate *kinds* of content (the panel zones).
Whitespace separates *peers* (matrix rows get padding and a hover background, no per-row border).
Group-to-group spacing is large, row-to-row spacing is small and even.

**Plain.** Hairlines divide different kinds of thing. Space divides things of the same kind. That one rule
is how we get hierarchy from type and space instead of from drawing boxes, which is what keeps Bidframe
off the "everything in cards" slop.

## 8. Width and measure: two different caps

**Technical.** App content sits in a centred container capped around 1160px
(`max-width: 1160px; margin-inline: auto`) on Paper that bleeds to the window. Prose inside the panel is
capped tighter, about 64ch. The container is centred, but the *content within it is left-aligned to the
reading edge*, never centre-aligned. All pixel and ch figures here are targets for the build to tune, not
hard law.

**Plain.** The whole app has a sensible maximum width so the status column is not a metre from the
requirement on a big monitor. Inside, reading text is held to a narrow, comfortable line length. Centring
the container is fine. Centring the actual text and buttons is the slop sin, and we do not.

## 9. Entry, the hero transition, and the skeuomorphic bridge

**Technical (entry).** The upload state occupies the same spatial frame the matrix will fill: one calm
upload surface, no oversized headline, no twin pills. The single showpiece transition (section 9 of the
design system) plays in place: the header fades in, the raw document resolves into rows, the triage line
lands. No page swap.

**Technical (the material identity).** This layout commits to a *depth grammar*: depth means focus and
nothing else. The panel sits above the matrix, nothing else floats. The mental model is surfaces on a
desk: the matrix is the open folder, the panel is the lifted sheet, approval settles it back down. The
visual treatment that builds on this grammar is now defined as the forest-led civic record in
[design-language.md](design-language.md) and DESIGN-SYSTEM section 13. Forest guides arrival, momentum,
and continuity; the record proves source, evidence, and approval. It adds texture, real lift, and weight
to these same relationships, so it is a change of volume, not a U-turn.

**Plain.** You start by dropping the tender in, and it resolves in the same spot into the worklist. That
resolve is the one bit of theatre and it earns it. Think of the whole thing as a guided approach into a
desk with one folder open and one sheet pulled out to read. The forest-led record look
([design-language.md](design-language.md)) reuses these same relationships, so nothing has to be undone.

## 10. Accessibility and honesty checks

**Technical.** Hover is never the only channel: every hover affordance (the answer preview, the inline
approve) also appears on keyboard focus, and every row and control is reachable and operable by keyboard.
Status never relies on colour alone: the confidence dot carries a tier fill and a word, so the matrix and
panel pass the greyscale test (SLOP-CHECK). Confidence is never shown as a raw number.

**Plain.** Anything you can do with a mouse you can do with a keyboard, and nothing important is hidden
behind a hover. Turn the colour off and the screen still reads correctly.

## 11. Relationship to the current build

This file is the target structure, not a rewrite order. A working compliance matrix and the autofill
wiring already exist in `src/`. The intent is that those components evolve toward this layout as we go, not
that anyone tears out working code to chase it. Where this document and the current build disagree, treat
it as design intent to grow into, and raise anything that looks expensive on the frontend comms board.

## 12. The slop-layout gate

The layout subset of SLOP-CHECK.md. Any hit is a blocker, not a nitpick.

- Persistent left sidebar or nav rail on what is a single-document app. Navigation is contextual, in the
  header.
- A bento grid or a card grid of equal-weight boxes. Cards nested inside cards.
- A row of summary stat tiles standing in for the honest triage worklist.
- Prose (requirements, drafted answers) stretched to full container width. Hold reading text to a
  comfortable measure.
- Equal weight and equal interactivity on every row regardless of stakes. The risky and the safe must not
  look or behave identically.
- Centre-aligned content (text, headings, buttons). Centring the container is fine, centring the content
  is not.
