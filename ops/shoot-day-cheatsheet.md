# Shoot-day cheat sheet — collaboration demo, solo (incognito)

One page for the person recording. You play **both accounts** (Alice + Bob) from **one machine**
using separate **Incognito** windows, screen-record, and do the **voiceover** for both voices.
Everything is already seeded — nothing to upload on camera.

Full script this pulls together: **[`ops/demo-bob-script.md`](demo-bob-script.md)** — follow it verbatim.

---

## 1. Links

| What | URL |
|---|---|
| **Live site (record here)** | **https://www.bidframe.org** |
| Backend health (warm it first) | https://yonnie-tsenta-bidframe-api.hf.space/health → `{"status":"ok",...}` |

> **"Wake up the server" ~1 min before you record.** The server that feeds the site goes to sleep
> when no one's used it for a while, and the very first time you open the site after that, it's slow
> for 30–60 seconds while it wakes up. So: **a minute before recording, open the health link above in
> a browser tab.** Wait until it shows `{"status":"ok",...}`. That means it's awake. Now open the
> site and it'll be fast — no slow, awkward loading on camera. (Just visiting the link is all it
> takes; you don't have to do anything with what it shows.)
>
> If the site loads fine but shows the wrong tender (not the Bradwell one), that's a different issue —
> see [`deploy/HOME-DEPLOY.md`](../deploy/HOME-DEPLOY.md).

## 2. Accounts (passwords ≥8 chars)

| Role | Email | Password | Display name |
|---|---|---|---|
| **Alice** — bid manager (main narrator) | `alice@bidframe.io` | `alice1234` | Alice Chen |
| **Bob** — compliance (acts live in Part 4) | `bob@bidframe.io` | `bob12345` | Bob Ellis |
| _spare_ | `demo@bidframe.io` | `demo1234` | — |

**Sign in each account in its own Incognito window** (auth tokens live in localStorage, so a second
*tab* shares Alice's session — you need a separate Incognito window, or a second browser, per account).

## 3. The tender (pre-loaded, already shared to Bob)

- **"Landscape Maintenance Services 2026-2029 – Bradwell Parish Council"** (`tnd-9da46fbf`)
- **205 requirements · 32 deal-breakers**, 4-file mixed pack (PDF · Word · Excel · CSV)
- Team **"Verdant Landscapes – Bid Team"** (Alice owner, Bob member)
- Open the tender from the library → lands on the **Matrix**. Don't click until the script says to.
- _Glance at the live counts before each take in case they've been curated._

**Three hero deal-breakers (real + sourced):**
- **£10,000,000 public-liability minimum** → **Word** return form (Appendix D)
- **"price every line or be rejected"** → **Excel** pricing schedule (Appendix E)
- **Certificate of Non-Collusion** → **CSV** compliance checklist (Appendix F)

---

## 4. Recording plan — the collaboration demo (≈3½ min)

Record **Alice's** window as the main screen. Because you're solo, do Bob's two live actions in his
Incognito window, then cut back to Alice's screen to catch the live update landing, stamped "by Bob."

**Do the VO for both voices** (Alice narrates throughout; speak Bob's marked lines too). The full
script is in **§5 below** — follow it verbatim.

Bob's only on-screen actions (Part 4):
1. **Approve** the **insurance deal-breaker** (£10m liability) → pause ~2s → it lands on Alice's
   screen stamped **"Approved by Bob."**
2. **Flag** the **pricing-schedule** deal-breaker, then **comment:**
   *"Finance to confirm the annual total before submission."* → pause ~2s.

> Pause ~2s after each Bob click so the live update registers on Alice's recording. Don't refresh or
> navigate away mid-take. If an update doesn't appear on Alice's side, both windows must be on the
> **same tender** and the **live site URL**.

---

## 5. The full script (≈3½ min) — verbatim

Legend: **ALICE** = drives + records · **`▶ BOB`** = the second account (speak throughout, act in Part 4) · *italics* = stage direction. _(You do both voices.)_

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

### Part 4 — one tender, a whole team, live *(the on-screen moment)*
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

## 6. Voiceover notes
- **Alice** = calm, drives the walkthrough, narrates throughout.
- **Bob** = compliance lead; only touches the product in Part 4, but speaks his marked lines.
- Wait for the on-screen action, **then** speak — don't talk over a reveal.
- If you blank: say what's on screen. The section title tells you the beat.

## 7. If something breaks
- **Login 500 / can't sign in** → backend `AUTH_SECRET` may be missing; site may be cold. Warm
  `/health`, retry. Details: [`deploy/HOME-DEPLOY.md`](../deploy/HOME-DEPLOY.md) → Troubleshooting.
- **Shows mock/demo data** → frontend not pointed at backend (Vercel env var / redeploy).
- **Live update doesn't cross windows** → both must be on the same tender on the live URL (realtime
  only exists on the deployed site, not a same-machine localhost pair unless backend is running).
