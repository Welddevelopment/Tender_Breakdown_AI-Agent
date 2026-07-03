# Codex — continue lead-gen (demo-day expansion, 3 Jul)

**Why now:** outreach went live today. The 39 PERFECT fits are being personalised + sent this morning.
We want **more targets** — keep your pipeline running. Joel: "39 is a decent start but I'd like more."

## The bar — emphasise the PERFECT-fit philosophy from yesterday
Volume is welcome (add more leads), **but the PERFECT label stays STRICT and honest.** A lead is
**PERFECT only if it clears ALL THREE:**
1. **Genuinely tiny** — family-owned / owner-operator, the founder is on the tools *and* does the bidding
   (sole trader, husband-and-wife, 2–3 person, small family Ltd). Outer bound ~≤30 staff; **smaller is
   always better.**
2. **A NAMED public-sector client** or hard, verifiable public-sector bid evidence (a specific council /
   NHS trust / school / housing association / framework / approved-supplier list / award notice — not
   "we work with the public sector" self-claims).
3. **A real, publicly-listed EMAIL** on the firm's own site. **No email → skip. Never fabricate one.**

Anything short of all three is **GOOD** (still add it — it's volume) or skip. **Do NOT inflate PERFECT —
when in doubt, label GOOD.** Under-labelling is fine; over-labelling is not. Zero fabrication of names,
emails, clients, or facts — ever, only publicly-verifiable info.

## Task
- Continue IDs from **L-0419+** in `crm/leads.csv` (you own it; Claude never writes it).
- Push into **fresh seams** you haven't mined yet; **dedupe every candidate** against the existing CRM
  (~365 rows) + Claude's 116 MT targets + your own prior rows.
- Verify each lead (public source for the email + the public-sector evidence). Mark `verification_status`
  honestly.
- Write a **same-day draft per lead** in `crm/drafts/` using the **demo-day angle** below.
- **No upper cap** — keep finding genuine fits. Prioritise more PERFECT; GOOD fits welcome as volume.

## Draft angle (use for every new draft — see `outreach-demo-day.md` for full tone)
Free pilot, with two strong asks in every message:
1. **Book today** — a few free pilot slots this week. Link (exactly): https://cal.com/joel-jeon-o29lfr/bidframe
2. **Send their tender when they book** (a public one / a recent pack) so we pre-run it and the call is a
   prepared walkthrough of THEIR tender, not a generic demo.
Bidframe = reads a UK public-sector tender, flags the pass/fail deal-breakers with the exact clause,
drafts answers where there's evidence. Built for tiny firms that bid occasionally + can't afford a bid
writer. Signature: Joel · Bidframe.

## Autonomy (Joel may be asleep / heads-down)
- If you hit a network / rate-limit / tool error: **wait a few minutes and retry**, then keep going.
  Don't stall the whole run on one flaky call.
- Do **not** stop for anything that needs Joel's direct permission — note it in your run log and move on.
- **Hygiene:** `git pull --rebase` before every push; commit small + often; keep `main` clean. You own
  `crm/leads.csv` + `crm/drafts/` — conflict-free as long as you rebase.
- Log the run (mirror `crm/leadgen-run-2026-07-02.md`): batches, seams, counts, PERFECT vs GOOD split.
