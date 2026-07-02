# Codex — end-to-end micro-lead generation (detailed brief)

**Operating model:** Codex *and* Claude each run the **full pipeline independently** — scan for NEW
leads → verify → personalise — so if one runs out of credits the other keeps producing. Resilience, not
division of steps.

**Avoid clashes:**
- **Ids:** you use the reserved block **`L-0401+`** in `crm/leads.csv`. (Claude does NOT write `leads.csv`
  — it writes its finds to a separate file — so your `leads.csv` writes are conflict-free. Still: `git
  pull --rebase` before every push, commit small + often.)
- **Seams (reduce duplicate firms):** Claude is working **family-run compliance/maintenance trades, small
  local care providers, and owner-operator building/grounds firms**. You take **other** seams: small
  **school ICT / AV / AP-SEND** providers, **occupational health** SMEs, **catering / cleaning / waste /
  grounds**, **transport / driver services**, **translation / interpreting**, **arboriculture**, small
  **surveying / architecture** micro-practices. Dedupe every candidate against existing `leads.csv` firms.

## The ICP — target the SMALLEST (this is narrow; be strict)
**Bullseye:** family-owned / owner-operator firms where the **founder is on the tools *and* does the
bidding** — sole traders, husband-and-wife, 2–3 person, small family Ltds. These are *desperate* for a
free tender read: no time, no budget, high stakes.
**Outer bound (include but not the priority):** up to ~<30 staff. **Smaller is always better.**
Every lead must also:
- **Bid UK public-sector work** occasionally (councils / NHS / schools / housing associations / public
  frameworks) — with public evidence.
- Have a **real, publicly-listed EMAIL** on the firm's own site — **CORE REQUIREMENT: no email → skip.**
- Clearly not afford enterprise bid tools.

**EXCLUDE:** bid consultancies (competitors); anything 100+ staff / £m revenue / "national/largest" /
1,000s of bids / has a procurement team. If it looks big, drop it.

## Hard rules (non-negotiable)
- **Never invent or guess an email, name, or fact.** Only publicly-verifiable info — the firm's own site,
  Companies House, Contracts Finder / Find a Tender, council approved-supplier lists, framework award
  notices. Can't verify the email → don't add the firm.
- Reserved ids `L-0401+`; match the `leads.csv` column shape; `conversion_estimate=High` only for
  small + clearly-public-sector + emailable.
- Add `crm/drafts/<id>.md` per lead using the same-day free-pilot nudge in `outreach-same-day-kit.md`
  (SME-bidder framing). Booking link: https://cal.com/joel-jeon-o29lfr/bidframe

**Goal:** 10–20 genuinely perfect micro-targets > a long mediocre list. Commit to GitHub every ~10 min.
