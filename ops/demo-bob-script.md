# Demo video — full script + context (for Bob / the team)

**Full two-person script for the collaboration demo.** Both roles are here so whoever plays **Bob** has
the whole flow and knows exactly when to come in. **Bob's lines and actions are marked `▶ BOB`.**

---

## Context — what this demo proves and why two people

The video pitches Bidframe as a **real, working product**, not a mock. Its standout feature is **live
multi-user collaboration**: two people work the *same* tender at once, and every approve / edit / flag /
comment is **attributed to who did it, in real time, server-side (so it can't be faked)** — plus reusable
**teams** and per-requirement **comments**.

You can't prove that with one person, so the shoot uses **two real people on two machines**:

- **Alice** — the bid manager. **Drives and records her own screen**, narrates the walkthrough.
- **Bob (you)** — signed in on a **separate account, your own laptop**, on the **same shared tender**.
  When you approve a row or leave a comment, it lands **live on Alice's recorded screen**, stamped
  *"by Bob."* That live hand-off is the money shot.

You **speak throughout** (two narrators), but you only **touch the product in Part 4**, where your live
actions are the proof. Everything is genuinely saved and streamed — nothing is staged.

---

## Setup — before recording (mostly done for you)

The tender is **already pre-loaded in Alice's account** — a real mixed pack extracted end-to-end,
answers drafted from the capability docs, and **already shared to Bob** via the team. Nothing to
upload on camera.

- **Accounts** (created; passwords are ≥8 chars):
  - **Alice:** `alice@bidframe.io` / `alice1234`  (display name *Alice Chen*)
  - **Bob (you):** `bob@bidframe.io` / `bob12345`  (display name *Bob Ellis*)
  - *(spare: `demo@bidframe.io` / `demo1234`)*
- **The tender:** **"Landscape Maintenance Services 2026-2029 - Bradwell Parish Council"**
  (`tnd-9da46fbf`) — **205 requirements, 32 deal-breakers**, a 4-file mixed pack
  (PDF · Word · Excel · CSV). Team **"Verdant Landscapes - Bid Team"** (Alice owner, Bob member).
- **Where to film:**
  - **Hosted (for two real recorders):** deploy the backend per `ops/deploy-runbook.md`
    (Hugging Face Space), point Vercel at it, then both open the Vercel URL. *(Backend deploy is
    prepared but not yet live — do this before the shoot.)*
  - **Local check / same-machine dry run:** frontend `http://localhost:3000`, backend on `:8000`.
    Alice in a normal window, Bob in an **Incognito** window (tokens live in localStorage, so a
    second tab won't do — use Incognito or a second browser).
- **Nav:** the top bar has **Tender** (library), **Bid** (`/answers`), **Matrix** (`/review`),
  Graph, Teams. Open the tender from the library → lands on the **Matrix**.
- Land on the **Matrix** and wait. Don't click anything until Part 4. Mic on from the start.

**The three hero deal-breakers are real and sourced** (call them out in Part 2 / Part 4):
- **£10,000,000 public-liability minimum** → from the **Word** return form (*Appendix D*)
- **"price every line or be rejected"** → from the **Excel** pricing schedule (*Appendix E*)
- **Certificate of Non-Collusion** → from the **CSV** compliance checklist (*Appendix F*)

The **Bid** view has **14 grounded answers with evidence receipts + 34 open questions**, backed by
3 Verdant Landscapes capability docs — enough for Part 3.

---

## The full script (≈3½ min)

Legend: **ALICE** = drives + records · **`▶ BOB`** = you (speak throughout, act in Part 4) · *italics* = stage direction.

### Part 1 — the problem & the read
**ALICE:** "Win a public-sector bid and you've won weeks of work. Miss one disqualifying rule buried in the pack, and all of it is wasted."

**`▶ BOB`:** "And it never arrives as one clean PDF. It's a **pack** — the ITT, return forms in **Word**, a pricing schedule in **Excel**, a compliance checklist in **CSV**, usually **zipped**."

*Alice shows the source-documents list — the four formats side by side.*

**ALICE:** "I dropped the whole pack into Bidframe. It read every file — weeks of manual combing, done in minutes."

### Part 2 — deal-breakers, first and proven
**ALICE:** "205 requirements — and the 32 **deal-breakers** sit right at the top, because those are what kill a bid."

**`▶ BOB`:** "That's the first thing I check as compliance lead. This £10m public-liability minimum came out of the **Word** return form; this 'price every line or be rejected' rule out of the **Excel** schedule; this anti-collusion certificate out of the **CSV**."

**ALICE:** "One buried in a spreadsheet is caught exactly like one deep in the PDF."

*Alice clicks a PDF-sourced row → source panel highlights the clause; then an Excel-sourced row → shows sheet + row.*

**ALICE:** "Every line ties back to its source — page and clause for the PDF, **sheet and row** for the spreadsheet — so we check before we trust."

**`▶ BOB`:** "And the deal-breaker net is **deterministic** — not just the model. On our validated tenders it catches **every** disqualifier. The AI reads; it never decides."

### Part 3 — answers, from our evidence
*Alice clicks into **Bid**.*

**`▶ BOB`:** "Now the answers. Bidframe drafts them from our **capability documents** — and that just means our *own* evidence: our insurance certificates, past case studies, client references, the proof we've done this work before."

*Alice shows a drafted answer with its evidence **receipt**, then an **open question**.*

**`▶ BOB`:** "Every drafted answer carries a receipt straight back to the document it came from. And where we have no evidence, it doesn't make one up — it asks me a direct question instead."

**ALICE:** "It tracks how complete the whole bid is — and when we're done, the full response exports straight to **Word or PDF**."

*Alice opens the export menu (Word / PDF).*

### Part 4 — one tender, a whole team, live *(your on-screen moment)*
**ALICE:** "But no bid is one person — it's compliance, commercial, the bid manager. So in Bidframe I set up my **bid team**."

*Alice opens the Teams page → "Bidframe — Bid Team": Alice + Bob. Then back to the matrix; Bob in the members strip.*

**ALICE:** "Every tender I open is shared with the whole team — no re-inviting. Here's Bob, from compliance, already on this one, on his own machine."

**`▶ BOB`:** "I've got the insurance line — we hold £10m cover, so I'm approving it."
> **▶ ACTION:** approve the **insurance deal-breaker** row. *(pause ~2s — it lands on Alice's screen)*

**ALICE:** "That just appeared on my screen — no refresh — stamped **'Approved by Bob'**, server-side, so it can't be faked."

**`▶ BOB`:** "This pricing rule I want finance to check — I'll flag it and drop a comment."
> **▶ ACTION:** **flag** the **pricing-schedule** row, then **comment:** *"Finance to confirm the annual total before submission."* *(pause ~2s)*

**ALICE:** "His flag, his comment, his initials on the row — live in the activity feed. The audit trail builds itself as we work."

*Alice approves the anti-collusion cert herself.*

**ALICE:** "And when I approve here, Bob sees it on his side the same way."

### Part 5 — the close
**ALICE:** "A tender pack in any format, read in minutes — not weeks. Every deal-breaker caught and sourced."

**`▶ BOB`:** "Answers drafted from our own evidence. A whole team working it together, live — every decision attributed."

**ALICE:** "The AI does the reading. We stay in control. That's Bidframe."

---

## Bob's live actions — Part 4 only (recap)

1. **Approve** the **insurance deal-breaker** (£10m liability row) — say your line, then click Approve.
2. **Flag** the **pricing-schedule** deal-breaker, then **comment:** *"Finance to confirm the annual total before submission."*

Two actions. Everything else is voice.

## Cues / do-nots
- **Wait for Alice's line, then speak** — don't talk over the screen action.
- In Part 4, **pause ~2 seconds** after each click so the live update registers on camera.
- **Don't refresh or navigate away** mid-take — just approve / flag / comment on the matrix.
- If a live update **doesn't** appear on Alice's screen, stop: check you're both on the **same tender**
  and the **new Vercel URL** (realtime only exists there).
- Counts are **205 requirements / 32 deal-breakers** — but glance at the screen before the take in case they've been curated further.
