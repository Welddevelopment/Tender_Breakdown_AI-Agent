# UI Improvement — Stage 3: Matrix Review And Source Proof

Owner: Jawad (frontend) · Drafted 2026-07-10, after UI Stage 2 (workspace header & nav) shipped.
Reads with: `frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md` (§"Stage 3: Matrix Review And Source Proof", §"3. Matrix Command Centre", §"4. Requirement Panel and Source Proof"), `frontend/UI/UX/Motion Overhaul/MOTION.md` (§"Matrix Review", §"Requirement Panel And Source Proof"), `frontend/{DESIGN-SYSTEM.md,design-language.md,SLOP-CHECK.md}`.

> **Track note:** the *UI Improvement Plan's own* Stage 3 (its Stages 1–6 track). "Stage 3" here = **Matrix Review And Source Proof** — the product's trust core.

## Promise (from the plan)

The review surface clearly separates risk, confidence, source proof, decisions, and human attention. Every important matrix state is distinguishable in greyscale; `Show source` is a recognisable first-class affordance; exact and approximate proof never imply the same certainty; approval and flagging feel official; keyboard users open and close source proof without losing position.

## Step 0 — Audit first (done; folded in). Stage 3 is ~80% built.

Two read-only audits mapped the matrix row grammar and the panel/source-proof flow. **Most of the trust core already passes:**

- **Deal-breaker rows — DONE (greyscale).** Left reading edge (`border-l-2 border-signal-oxblood-frame`), a pennant silhouette, `font-medium` text, and a tier wash — legible without colour (`ComplianceMatrix.tsx:325-326,381-392,418`).
- **Confidence — DONE.** Four tiers with **word labels** ("Can't answer this / Low confidence / Fairly sure / Confident") and an evidence-stamp whose **line count** (0-slash → 3 lines) carries the tier in greyscale; **never a raw number** (`ConfidenceIndicator.tsx:12-17,71,79-135`).
- **Approved rows — DONE.** Forest tick + "Approved by {actor}" on the row (`ComplianceMatrix.tsx:196-214`); `ApprovalStamp` with a rotated tick + "Approved by {who}, {time}." audit line in the panel (`ApprovalStamp.tsx:11-46`).
- **Source proof honesty — DONE.** `SourceVerifyOverlay` + a persistent `EvidencePane` (wide split) both read from one canonical `matchSignalLabel()` — **exact** ("Matches the tender, p.N", ✓ forest), **approximate** ("Close match, check the wording", amber dot), **unlocated** ("Shown from the extracted text", muted) — with matching highlight colours (`SourceVerifyOverlay.tsx:187-239`, `text-match.ts:29-58`, `MatrixView.tsx` MATCH_CHIP). The highlight is rendered statically (no animation), so reduced motion already gets an immediate static highlight.
- **Gating approval — DONE.** Typed `CONFIRM` gate before a deal-breaker can be approved (`RequirementPanel.tsx:723-771`); decisions record actor + timestamp server-stamped (un-forgeable) (`RequirementsContext.tsx:447-460`).

**The genuine remaining Stage-3 work:**

1. **Flagged rows have no greyscale marker.** Approved rows get a tick + "Approved by X"; flagged rows render only the word **"Flagged"** in ink (`ComplianceMatrix.tsx:190-191,217`) — no glyph, no actor, no rule. In greyscale a flagged row is indistinguishable from an edited/decided one. MOTION.md §Matrix: "flag state should apply an oxblood rule or marker immediately."
2. **`Show source` is not one recognisable affordance.** The split header says **"Show source"** (ink-muted, toggles the ambient evidence pane, `MatrixView.tsx:726-732`); the panel margin and the gating block say **"See it in the document"** (forest link, opens the focused overlay, `RequirementPanel.tsx:334-341,405-411`). Different words, different weight, no shared source glyph — it doesn't read as one first-class product action.
3. **The source overlay does not return focus on close.** `SourceVerifyOverlay` focuses its sheet on open but never restores focus to the triggering control on close (`SourceVerifyOverlay.tsx:42-52`) — keyboard users lose their place. Plan DoD: "return focus to the same requirement when closed."
4. **Row hover/focus is instant, not a token emphasis.** The row transitions `background-color,box-shadow` with **no duration utility**, so hover snaps at 0ms; MOTION.md §Matrix wants an 80–120ms emphasis. A one-token touch.

## Boundary / constraints

- **Apply the existing grammar; don't re-architect the matrix.** The state system, confidence tiers, source overlay, and audit stamping exist; this stage fills the flagged-state gap, unifies the source affordance, and closes the focus-return hole. No schema change; no new colours (SLOP-CHECK).
- **Greyscale is the bar.** Every touched state must survive greyscale on more than colour (word, glyph, weight, rule).
- **Record motion only on proof surfaces.** No forest/decorative motion in matrix rows, source proof, or evidence. Flag applies **immediately** (an oxblood marker, no celebration). No row-height or column-width animation (MOTION.md §Matrix).
- **Reduced-motion stays whole.** Row emphasis and overlay open collapse to instant via the existing token override; the source highlight stays a static, greyscale-legible mark; focus rings and match labels remain.
- **Deferred by design (not this stage):** **comment markers** and **owner/assignment markers** on rows are Stage 6 (Collaboration Presence), which owns row/card/panel collaboration grammar and the API plumbing for per-item comment counts. The matrix does not load comment counts today; adding markers here would be premature. The `/answers` `AnswerEvidenceOverlay` focus-return parity lands with Stage 5. Noted, not silently dropped.

## Workstreams

**A · Flagged row grammar (greyscale + audit).**
· Current: flagged row = the bare word "Flagged" in ink; no glyph, no actor (`ComplianceMatrix.tsx:190-191,217`).
· Scope: give the flagged status word an **oxblood flag glyph + "Flagged by {actor}"**, mirroring the approved row's tick + "Approved by {actor}" so flagged is distinguishable in greyscale and carries its human owner. Immediate (no motion). The panel already shows the "Flagged by {who}, {time}." audit line, so this aligns the row with the panel.
· Model: **Sonnet**. Done when: a flagged row is distinguishable from approved/edited/pending rows in greyscale, and names who flagged it.

**B · `Show source` as one recognisable affordance.**
· Current: "Show source" (ink-muted pane toggle) vs "See it in the document" (forest overlay opener) — inconsistent (audit §2).
· Scope: introduce one shared **source-action** treatment — a small consistent source/locate glyph + the forest source-action colour — applied to every "look at the source" trigger (panel margin, gating block, and the split-header pane toggle), so source proof reads as one first-class action wherever it appears. Labels stay honest to each action (the overlay openers keep "See it in the document"; the ambient-pane control reads "Show source" / "Hide source" since it toggles) but share the glyph + weight. No behaviour change.
· Model: **Sonnet** (+ **Haiku** for the tiny glyph). Done when: a user recognises the source action on sight across row-panel-overlay; the treatment is consistent; labels remain truthful to what each control does.

**C · Source overlay focus-return + row-hover token + a11y/motion verification.**
· Scope:
  - `SourceVerifyOverlay`: capture the previously-focused element on open and **restore focus on close** (self-contained, fixes all three triggers at once) — keyboard users return to the requirement they came from.
  - Add an 80ms token emphasis (`--motion-instant`) to the matrix row hover/focus transition so it reads as a gentle emphasis, not a hard snap; collapses to instant under reduced motion.
  - Verify: overlay opens on `--motion-panel` and the source highlight is static + greyscale-legible under reduced motion; no decorative motion added to matrix/source surfaces.
· Model: **Sonnet**. Done when: open + close the source overlay by keyboard from a matrix row without losing position; reduced motion leaves an immediate static highlight; row emphasis is token-timed.

## Sequencing & models

**A** (flagged grammar) → **B** (source-action affordance) → **C** (focus-return + motion). One commit per workstream; `npm run build` + `npm run lint` green per commit; trunk to `main` (rebase over the codemap bot). No backend. **Fable: not needed** — the state grammar, source overlay, and motion tokens exist; this is application + one gap-fill, not visual exploration.

## Verification

- Build + lint green per commit; SLOP-CHECK + greyscale on the matrix and source overlay.
- **Greyscale state read:** approved, flagged, needs-input, low-confidence, and deal-breaker rows are each distinguishable with colour removed (screenshot in greyscale).
- **Source affordance:** the source action is visually consistent across the split header, the panel margin, and the gating block; labels are truthful to each action.
- **Exact vs approximate:** the overlay + evidence pane still read the same canonical labels; exact and approximate look different (no false equivalence).
- **Keyboard:** from a matrix row, open the source overlay and close it — focus returns to the source trigger / requirement; Esc closes.
- **Reduced motion:** row emphasis and overlay open become instant; the source highlight stays a static, greyscale-legible mark; focus rings and match labels remain.
- Live check against Alice's shared tender where practical (matrix rows, decided states, source overlay); demo/embed surfaces unchanged.

## Changelog

- 2026-07-10 — **Stage 3 shipped (A/B/C).** Flagged-row greyscale marker + "Flagged by {actor}" (A), one recognisable `Show source` affordance across row/panel/overlay (B), source-overlay focus-return + token row-hover emphasis (C). Focus-return verified end-to-end in a headless browser: from a matrix row the source overlay opens by keyboard and, on both Esc and the Close button, focus returns to the "See it in the document" trigger. Fixed a real layering bug found in that verification — the overlay's Esc was cascading into the split panel's own Esc handler and deselecting the whole panel (unmounting the trigger), so focus-return had nothing to land on. The overlay now consumes Esc in the capture phase (`preventDefault` + `stopPropagation`), matching the panel's "one Esc, one close, top layer first" contract; a second Esc still closes the panel. Focus restore is caller-owned (RequirementPanel captures the trigger at open, restores it via double-rAF after unmount) — the previous unmount-cleanup approach was unreliable. Build + lint green.
- 2026-07-10 — plan drafted; Step-0 audits folded in. The trust core is ~80% built (deal-breaker/confidence/approved grammar, exact/approx source honesty with a persistent evidence pane, typed-CONFIRM gating, audit stamping). Stage 3's real work is the flagged-row greyscale marker + audit, one recognisable `Show source` affordance, and source-overlay focus-return, plus a token row-hover emphasis. Comment/owner markers deferred to Stage 6; `AnswerEvidenceOverlay` focus-return to Stage 5. No backend; no Fable.
