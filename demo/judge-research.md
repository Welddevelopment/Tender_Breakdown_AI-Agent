# Judge Research — synthesis

> From [`research/judges-criteria-worker.md`](research/judges-criteria-worker.md) (all URLs there).
> Confirmed facts vs labeled inference kept strictly apart.

## 🚨 FIRST: the date (verify in Discord/with organizers NOW)

**Every official source says Demo Day = SATURDAY 4 JULY — TODAY:**
- Luma (luma.com/knoymap5): "4 July — Demo Day & Project Showcase"
- DoraHacks #2272: event endTime 4 Jul 22:59 UTC
- aiagentslab.uk/hackathon/ep5: same
- The pitch running-order sheet: 3 sessions today, **Bidframe last at 03:55–04:00 pm**

Team-internal notes said Sunday 5 July. If the official sources are right, rehearsal + remaining fixes
must compress into this morning. **One person confirms in the event Discord immediately.**

## The event, precisely

**"UK AI Agent Hackathon Ep5 x Conduct"**, Imperial College London, 28 Jun – 4 Jul 2026. Organizers:
UK AI Agents Lab + Imperial AI Society + Imperial Blockchain & FinTech. Platform: DoraHacks #2272.
**Conduct is Title Sponsor** (gave the opening keynote). Conduct track prize: **£8,000, one winner.**

## Judging criteria — what's actually known

- **No public rubric exists** for the event or the Conduct track (DoraHacks `judgingCriteria` fields
  are empty; details live in the event Discord).
- **The official Conduct track brief (verbatim, DoraHacks):** *"Pick a slow, inefficient process that
  happens at large enterprises today, and build a tool that lets a user do it far faster with AI,
  while staying in control. Start with the process… identify a specific task that enterprise teams
  spend weeks on. Then build something that does it in hours."*
- Our internal four criteria (**real process · real speed-up · user in control · clear demo**) map
  almost word-for-word onto that brief ("slow, inefficient process" / "far faster… weeks→hours" /
  "while staying in control"), so keep building to them — but **the 20% weight is unconfirmed**; treat
  weights as unknown.
- **Ep4 precedent** (same organizers, official press release): teams judged on "technical execution,
  product quality, real-world applicability, and long-term impact."
- The event's only fully published rubric (Fetch.ai bounty, a useful sponsor-weighting signal):
  execution 25% · sponsor tech 25% · innovation 20% · real-world impact 20% · **presentation only 10%**.

## Judges

- **Confirmed (Fetch bounty only):** Sana Wajid (CDO, Fetch.ai), Attila Bagoly (Chief AI Officer,
  Fetch.ai). Only relevant if entering that bounty — we are not.
- **Likely Conduct-track judges (INFERENCE, from the Ep4 sponsor-execs-judge precedent + Conduct being
  Title Sponsor):** the Conduct founders, all ex-Palantir —
  **Jan Philipp Haas** (CEO), **Henry Thompson** (CTO, ex-Hack Cambridge organizer — knows judging
  from the inside), **Philipp Hoefer** (CPO). Plus probable organizer/VC/Microsoft panelists, unnamed.

## What the likely judges reward (grounded in their own language)

Conduct's public thesis (conduct.ai, quoted): "capture institutional knowledge [so it] no longer sits
with few experts" · "reads the underlying code and reveals dependencies" · "system changes that once
took months now take hours" · metric-dense marketing ("80% faster analysis", "3x faster change
implementation"). Backers: Creandum; customers: Daimler Truck, Rittal. Founder line: "IT should be the
core growth engine… 3–4% of enterprise revenue is spent on system maintenance."

**Therefore they likely reward:** a named, specific enterprise process with weeks→hours compression
(their brief's literal ask) · quantified claims with sources · traceability/auditability (their whole
product is making black boxes legible) · knowledge capture that outlives individual experts · a
working tool over a concept. **Ex-Palantir bias:** forward-deployed, workflow-shaped tools for real
institutions; unimpressed by consumer gloss.

**Red flags they likely punish:** thin chatbot/API wrappers · unverifiable AI output with no audit
trail · hand-waved enterprise context ("track tourism") · overclaimed accuracy · demos that don't work.

## Positioning consequences for Bidframe

1. **Mirror the brief's sentence shape in the open:** "Bid managers spend three weeks on a first read;
   Bidframe does it in minutes, with the human in control" IS their mission statement instantiated.
2. **The thesis-bridge is judge-native language** — Conduct says "institutional knowledge no longer
   sits with few experts"; our decision-capture close says exactly that for bid managers. Keep it
   near-verbatim.
3. **Quantify like they do:** they market in percentages and multiples; our 12/12, 10/10 held-out,
   42/42 numbers match their communication culture. Say numbers, cite sources.
4. **Expect the Palantir-grade probe:** "how do you KNOW?" — the eval harness + claim ledger is the
   answer they'll respect. No other team in the field has one (see team-landscape.md).
5. **Weights are unconfirmed** → don't over-index on any single criterion; the safe allocation is the
   official brief's own emphasis: process specificity, speed-up, control.
