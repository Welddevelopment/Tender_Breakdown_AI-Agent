# Pilot Roadmap — GTM, Outreach & CRM (Joe Jeon)

Owner: Joe Jeon (planner / GTM / orchestration)
Scope: ~80% GTM, outreach, CRM & pilot operations · ~20% backend glue (env verification, demo readiness)
Last updated: 2026-07-08
Reads with: [`ops/pilot-readiness-roadmap.md`](../ops/pilot-readiness-roadmap.md), `positioning-and-traction.md`, `traction-research.md`, `traction-outreach.md`, `incumbent-pricing-research.md`, `gtm-plan.md`, `yc-story.md`, and the demo scripts (`control-demo-script.md`, `demo-claim-ledger.md`).

---

## Why this document exists

Everyone else on the team is closing *product* risk on the road from 64 to 75. Your job is different: **turn that product readiness into the first real pilot conversations this week**, and build the CRM + pilot operating system so the learning compounds instead of evaporating in DMs.

Two hard truths frame everything:

1. **The product is at ~64/100 — concierge-discovery band.** That means founder-led, supervised, public-tender demos. It does **not** mean unsupervised accounts or confidential packs from strangers yet. Your outreach promise must not outrun the product's measured behaviour. (This is the non-negotiable product principle in the master roadmap — honesty is our wedge, so honesty in outreach is a product feature.)
2. **Your point on the scorecard is Operations & team process (of 15).** The "Pilot Operating System" you build is worth ~1 of the 5 points that take us from 70 to 75. It's not admin — it's a scored deliverable.

Three lenses on your role:

- **Business lens** — you own the top of the funnel and the pricing narrative. Every outreach send is a bet on a channel; every pilot is a data point on willingness-to-pay. Read the funnel as a P&L, not a to-do list.
- **UX lens** — the *demo* is a designed experience with a script. Your job is to make the prospect reach the click-to-source trust moment within 10 minutes, every time.
- **Engineering lens (your 20%)** — you're the glue that verifies the hosted backend is on the *real* extractor (not thin-heuristic fallback) before any call. A pilot run on fallback extraction is a silent failure.

---

## Where we are (the assets already built)

You are not starting cold. The traction dossier is done:

- **312 verified, ready-to-send leads** — `crm/sendable-list-2026-07-04.csv` (emails, personalised copy, subject lines).
- **Master CRM** — `crm/leads.csv` (450+ rows, verification status, conversion estimates) + per-lead drafts in `crm/drafts/L-*.md`.
- **19 ranked consultancy targets, 14 with verified handles** — top tier Vicki Stewart (Tender Victory), Dave Thornton (Thornton & Lowe), Ian Evans (BFT Consult), Neil Capstick (Executive Compass) — `traction-research.md`.
- **Positioning locked** — "AutogenAI writes bids for big firms at enterprise prices. We give the SME bidder an *auditable* requirement breakdown — every requirement traceable to its source clause, the disqualifying ones flagged, the human approving each — so they can *trust* it, not just generate text."
- **Pricing frame** — £149 / £399 tiers, consultancy-first; positioned against £950 outsourced tender review, £375/day bid-writer, £35–50k/year in-house salary.
- **Demo proof points (sanctioned numbers)** — 12/12 gating recall on Bradwell, 0 dangerous misses, 0 bluffs. Use these exactly; do not inflate. Caveat to remember: `eval_all` scores *extraction only* and shows a lower gating recall — the *shipped* pipeline applies the safety net and catches them all. Never quote the raw `eval_all` number.

---

## Part A — Land the first pilot demo THIS WEEK

This is your P0. The goal is **one booked, founder-led demo call on a public tender the prospect recognises**, run cleanly end-to-end.

### A1. Pre-flight the demo surface (your backend 20%)  *(do this first — a broken demo wastes every lead)*

Before you send a single email, confirm the demo can actually run:

- [ ] **Hosted backend healthy on the real extractor.** Hit `/health` on the deployed API and confirm `{"status":"ok","extractor":"openai"}` (or the intended provider) — **not** the heuristic fallback. The extractor is selected by which key is present; if `OPENAI_API_KEY` is missing in prod, it silently drops to thin heuristic extraction and quality collapses. This is the single most important pre-call check. (See backend doc + `ops/fly-deploy-status.md`.)
- [ ] **Frontend deployed** with `NEXT_PUBLIC_API_BASE_URL` pointing at the live API.
- [ ] **Fallback ready:** `/demo` runs the frozen Bradwell prebake (key-independent, stage-safe) in case live upload is slow on the call. Never let a slow upload become dead air.
- [ ] **Two demo accounts** exist if you plan to show live collaboration.
- [ ] Walk the `control-demo-script.md` clicks once yourself the morning of.

### A2. Send the outreach (throttled, verified, personalised)

- **Start with the highest-reply-odds tier**, not the whole 312 at once — protect deliverability. Send the fire-first consultancy leads first; expand to the sector SME batches once the domain is warm.
- **Every send:** verified email (never guessed — `not_found` is a valid outcome), line 1 personalised to their firm/sector and a recent framework or win, the Cal.com booking link, and the product/demo link.
- **Channel mix:** LinkedIn DM warm-ups (comment genuinely on their posts 1–2 days before) → first-touch DM/email → booking. The consultancy DM template is in `traction-research.md` — keep it under 500 chars, calm, no hype.
- **The honest ask** (use verbatim — it *is* the pitch): *"I'm offering a free pilot in return for blunt feedback; if it genuinely helps, I'd also ask for a one-sentence testimonial we can quote. 10 minutes, no pitch — I genuinely want your read."*

### A3. Run the demo to the trust moment

The script (from `control-demo-script.md`), timed to land the value in <10 min:

1. **Upload beat** (15s) — drag the tender in, watch the matrix populate.
2. **The catch** (30s) — gating deal-breaker highlighted first: *"This one's pass/fail — miss it, you're disqualified."*
3. **Click-to-source** (15s) — click the row → exact clause highlights on the exact page: *"We don't ask you to trust us — one click to the sentence."* **This is the moment.**
4. **Honesty** — show a `needs_review` / low-confidence item: *"We flag what we're unsure of instead of guessing."*
5. **Headline** (5s) — *"12 of 12 deal-breakers caught. Zero bluffs."*

### A4. Capture everything (this is where the CRM earns its keep)

For every conversation, log immediately (see Part B for the template):
- name, role, firm, sector; the tender used; verbatim quote; permission status for quoting; and **which rung of the ask ladder** they reached.
- **Ask ladder, tiered honestly:** floor = "I'd use this"; middle = "send it, I'll run my next bid through it"; ceiling = micro pre-commit or paid pilot (£50–100 = real signal).
- If a prospect sends **their own tender back**, flag it to the team on `comms/board-j.md` immediately and hand-prep it before the call — do not run an unseen confidential pack live.

**Realistic weekly target:** 5–8 conversations · 3–4 statements of interest · 1–2 pilots · ideally 1 micro pre-commit.

---

## Part B — The Pilot Operating System (your +1 point toward 75)

The master roadmap's 70→75 stretch includes making pilots **repeatable and learnable**. That's the "Ops & team process" line, and it's yours. Without this, three pilots produce three anecdotes; with it, they produce a comparable dataset that decides the next build priorities.

### B1. Pilot intake template
Company · role · tender type · tender source (public / approved) · file sensitivity · desired outcome. Fill *before* the call.

### B2. Pilot results template
Requirement count · deal-breakers found · misses · false positives · answer quality · time saved · user quote · **permission status** · ask-ladder rung reached.

### B3. Go / no-go checklist (run before every call)
The A1 pre-flight list above, plus: is the tender public or explicitly approved? Does the user know this is an early free pilot for blunt feedback? Is the pilot-notes template open?

### B4. Feedback loop (24-hour rule)
After every pilot, within 24 hours write "what they tried / what worked / what broke / what they asked for / what we'll change." Tag each item **product / engine / UI / backend / pricing / messaging** and decide **now / later / no**. Serious misses become eval fixtures (hand to Bobby for `gold-set/`). Real proof gets logged with `/proof` into the append-only log in `yc-story.md` — permissioned and sourced only.

**Evidence this stage is done (scorecard credit):** at least three pilot notes exist in the templates; at least one pilot miss became a regression/eval item; at least one positioning change came from a user's own words; every quote has a permission status.

---

## Business lens — read the funnel as a P&L

Map each activity to the line it moves, so you can defend where your time goes:

| Activity | Line it moves | Signal to watch |
|---|---|---|
| Consultancy DMs | Top-of-funnel / conversion | reply rate, demo-booked rate |
| Personalised sector pairing (their ITT in the demo) | Conversion quality | "that's exactly my problem" moments |
| The click-to-source beat | Activation / trust | do they lean in and ask to click another row? |
| Ask-ladder capture | Willingness-to-pay evidence | how many reach middle/ceiling rung |
| Pilot feedback loop | Retention & roadmap | misses that recur across users |

Pricing discipline: anchor to the **cost of the missed deal-breaker** (a wasted £4k+ bid), not to our £149/£399 sticker. The tool's job is to save the £400–950 first-read *and* catch the disqualifier that voids the whole bid. That framing is in `incumbent-pricing-research.md` — lead with it when price comes up.

---

## Guardrails (do not cross while at ~64/100)

- **No** unsupervised prospect accounts, broad "try it yourself" links, or confidential tender packs from strangers.
- **No** paid pilots without the buyer explicitly understanding the product is early and hand-held.
- **No** traction claim in the pitch that isn't in the sanctioned-numbers list and backed by a receipt a YC partner could verify in 5 minutes (`yc-story.md` rule).
- **Pause outreach/pilots** if: source access behaves inconsistently, the hosted backend is in fallback extraction mode, or a user reports a possible privacy issue. (These are exactly the items Pranav/Bobby are closing for 75 — coordinate.)

---

## Definition of done for your lane at 75

- [ ] First founder-led pilot demo booked and run this week on a public/approved tender
- [ ] Outreach sending from verified CRM, throttled, personalised, with booking link — deliverability protected
- [ ] Every conversation captured with tier-honest ask-ladder status and permission state
- [ ] Pilot OS live: intake + results templates, go/no-go checklist, 24-hr feedback loop
- [ ] ≥3 pilot notes, ≥1 miss → eval fixture, ≥1 positioning change from user language
- [ ] Pre-call `/health` extractor verification is a standing habit, logged before each call

---

## Reference map

| Need | File |
|---|---|
| Master scoring & bands | `ops/pilot-readiness-roadmap.md` |
| Niche, wedges, outreach motion | `positioning-and-traction.md` |
| 19 targets + verified handles + sectors | `traction-research.md` |
| Templates, ask ladder, demo motion | `traction-outreach.md` |
| Pricing context & defensible £ claims | `incumbent-pricing-research.md` |
| Pricing + channel | `gtm-plan.md` |
| Founder story + proof-point log | `yc-story.md` |
| Ready-to-send leads | `crm/sendable-list-2026-07-04.csv` |
| Demo clicks + narration | `control-demo-script.md` |
| Every claim → source → owner | `demo-claim-ledger.md` |
| Deploy checklist | `ops/fly-deploy-status.md` |
