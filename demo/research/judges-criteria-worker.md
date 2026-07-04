# UKAI Hack — Judging Criteria & Judges: Evidence Report

Worker research, 2026-07-04. Evidence only. Every claim carries a URL. Anything not publicly confirmed is marked **UNCONFIRMED**.

**Event identified:** the hackathon is officially titled **"UK AI Agent Hackathon Ep5 x Conduct"** (also styled "UK AI Agent Hack Ep5. x Conduct.AI"), 28 Jun – 4 Jul 2026, Imperial College London, run by UK AI Agents Lab + Imperial AI Society + Imperial Blockchain & FinTech Society. Submission platform: DoraHacks hackathon #2272.

---

## 1. Search log

| Query / fetch | Result |
|---|---|
| WebSearch: "UKAI hackathon London judging criteria 2026", ""ukaihack" OR "UKAI hack"" | Failed — only hit UKAI trade association (ukai.co), unrelated. |
| WebSearch: ""Make Legacy Move"" alone | Failed — Pokémon GO results only. The track name is not indexed as free text anywhere public. |
| WebSearch: Conduct AI legacy startup | Worked — identified Conduct (conduct.ai), ex-Palantir founders, $12M seed. |
| WebSearch: sponsor combo (Fetch.ai + Bittensor + Kaspa + Coral) → "UK AI Agent Hackathon" 2026 | **Worked** — surfaced aiagentslab.uk/hackathon/ep5. |
| Fetch: aiagentslab.uk/hackathon/ep5 | Worked — event basics, sponsor tiers, prize pool, link to DoraHacks. No criteria, no judges. |
| Fetch: dorahacks.io/hackathon/2272 (bounties + detail pages, via curl — WebFetch blocked with 405) | **Worked (best source)** — full official track/bounty JSON incl. the verbatim Conduct track brief. Every `judgingCriteria` field is empty. |
| Fetch: luma.com/knoymap5 (official Luma listing) | Worked — schedule, venue, hosts. No judges, no criteria. |
| Fetch: fetch.ai ep5 hackpack | **Worked** — full weighted rubric + 2 named judges, but for the Fetch.ai bounty only. |
| Fetch: Manila Times PR Newswire (ep4 judge press release) | Worked — precedent for who judges these events and what they scored (Morningstar & ttownmedia mirrors returned 403/429). |
| Fetch: conduct.ai, conduct.ai/blog/the-conduct-mission, tech.eu profile | Worked — Conduct's own thesis language. |
| Searched for: ep5 judge announcements (LinkedIn/X/press), conduct.ai/hackathon page, aiagentslab.uk/hackathon/ep5/judging | Failed — no public ep5 judge list exists as of 4 Jul 2026. conduct.ai/hackathon = 404. Conduct track "more details" live only in Discord (https://discord.gg/xyrUj2XFv), which I cannot access. |

---

## 2. Official judging criteria

### Overall event criteria — NOT PUBLISHED
- DoraHacks page metadata: the single track is `[DEFAULT_TRACK]` with `judgingCriteria: ""`; all 8 bounties also have `judgingCriteria: ""`; `isPublicTrackJudging: false`, `trackJudgingMaxScore: 100`, `bountyJudgingMaxScore: 100`. Source: https://dorahacks.io/hackathon/2272/bounties (data embedded in page JSON).
- **Precedent from Ep4 (March 2026), same organizers** — official press release: "Teams were evaluated on technical execution, product quality, real-world applicability, and long-term impact." Source: https://www.manilatimes.net/2026/03/19/tmt-newswire/pr-newswire/anyway-ceo-jims-young-judges-imperial-colleges-high-stakes-ai-agent-hackathon/2303126/amp — **precedent, not confirmed for Ep5**.

### Conduct track "Make Legacy Move" — official brief (verbatim), rubric NOT published
Official DoraHacks bounty: **"Conduct Track: Make Legacy Move" — £8,000 GBP** (token "GBP (POUNDS)", `numberOfWinners: 1`, `distributionType: "custom"`). Full description, quoted verbatim from https://dorahacks.io/hackathon/2272/bounties:

> "Large enterprises run on custom software built up over decades. When the business needs to change (a new pricing model, a new regulation, a new market) the software has to change too. But that software is millions of lines deep, with little documentation and few people who still understand how it works.
>
> So a change that should take days takes months. Teams of consultants are hired, budgets run into the millions, and a few specialists become the bottleneck for the whole company. Closing this gap is what Conduct does. For this track, we want you to take it on, too.
>
> Your mission:
>
> Pick a slow, inefficient process that happens at large enterprises today, and build a tool that lets a user do it far faster with AI, while staying in control. Start with the process. Use your knowledge of an industry, articles, or people who've worked in it to identify a specific task that enterprise teams spend weeks on. Then build something that does it in hours."

> "More details check: https://discord.gg/xyrUj2XFv" — the scored rubric, if any, lives in Discord, not on any indexed public page.

**On the team's internal four criteria (real process · real speed-up · user in control 20% · clear demo): UNCONFIRMED as a formal rubric.** I could not find any public page stating these as scored criteria or the 20% weight. However, three of the four themes are literally present in the official track brief above: "Pick a slow, inefficient process" (real process), "do it far faster … spend weeks on … does it in hours" (real speed-up), "while staying in control" (user in control). "Clear demo" is consistent with the demo-day format ("Live demos in front of judges, sponsors, and VCs" — https://www.aiagentslab.uk/hackathon/ep5) but is not stated as a criterion. Treat the internal list as plausible and thematically validated, the weights as unverified.

### Fetch.ai bounty (only fully published rubric at this event)
Source: https://www.fetch.ai/events/hackathons/uk-ai-agent-hack-ep5-x-conduct-ai/hackpack — Functionality & Technical Implementation 25% · Use of Fetch.ai Technology 25% · Innovation & Creativity 20% · Real-World Impact & Usefulness 20% ("Does the project solve a clear and meaningful problem?") · User Experience & Presentation 10%. Useful as a signal of how sponsors at this event weight things: real problem + working execution dominate; presentation is 10%.

### Date discrepancy worth noting
All official sources put **Demo Day on Saturday 4 July 2026** (Luma: "4 July — Demo Day & Project Showcase", https://luma.com/knoymap5; DoraHacks endTime = 4 Jul 22:59 UTC; aiagentslab.uk same). The team's internal notes say Sunday 5 July — re-check internally.

---

## 3. Judges

**No official judge list for Ep5 is public** (checked DoraHacks, Luma, aiagentslab.uk incl. /about, LinkedIn, X, press). What is confirmed or inferable:

**Confirmed (bounty-level):**
- **Sana Wajid** — Chief Development Officer, Fetch.ai — named judge for the Fetch.ai bounty. Source: https://www.fetch.ai/events/hackathons/uk-ai-agent-hack-ep5-x-conduct-ai/hackpack
- **Attila Bagoly** — Chief AI Officer, Fetch.ai — same source. (Both also judged the March 2025 edition: https://fetch.ai/events/uk-ai-agent-hackathon)

**Likely (INFERENCE, labeled):** the organizers' pattern is sponsor executives judging their own tracks — Ep4's judging panel included the title-ish sponsor's CEO (Jims Young, Anyway; https://www.manilatimes.net/2026/03/19/tmt-newswire/pr-newswire/anyway-ceo-jims-young-judges-imperial-colleges-high-stakes-ai-agent-hackathon/2303126/amp). Conduct is Ep5's **Title Sponsor** and gave the opening keynote (https://www.aiagentslab.uk/hackathon/ep5). So the Conduct track is very likely judged by Conduct's founders/team:
- **Jan Philipp Haas** — Co-founder & CEO, ex-Palantir (https://uk.linkedin.com/in/janphilipphaas/en; https://tech.eu/2025/09/18/conduct-emerges-from-stealth-to-transform-legacy-it-with-ai-agents/)
- **Henry Thompson** — Co-founder & CTO, ex-Palantir; previously led sponsorship for Hack Cambridge (£90k raised) so knows the hackathon-judging game from the organizer side (https://uk.linkedin.com/in/henryithompson)
- **Philipp Hoefer** — Co-founder & Chief Product Officer, ex-Palantir (https://techfundingnews.com/ex-palantir-founders-raise-12m-to-transform-legacy-erp-with-ai/)

Also plausible on the overall panel: reps from headline sponsors Microsoft and Fetch.ai (both keynoted the opening — https://www.aiagentslab.uk/hackathon/ep5), plus "VCs" per the demo-day description; no names public.

---

## 4. What likely judges value / would punish (grounded inference)

**Conduct founders (Haas / Thompson / Hoefer — ex-Palantir):**
- *Value:* real enterprise processes with named pain ("a specific task that enterprise teams spend weeks on" — their own track text); quantified speed-up (their marketing is metric-dense: "80% faster manual system analysis", "3x faster change implementation" — https://www.conduct.ai); traceability to source systems ("reads the underlying code and reveals dependencies"); the human staying in the loop ("while staying in control"); capturing knowledge that lives in a few experts' heads ("institutional knowledge no longer sits with few expers [sic]" — conduct.ai). The Palantir background implies bias toward forward-deployed, workflow-shaped tools for real institutions over consumer gloss.
- *Punish:* bolt-on/track-tourism projects that don't start from a process; thin chatbot/API wrappers (echoed in Fetch's rubric: "rather than functioning as a basic chatbot or API wrapper"); unverifiable AI output with no audit trail (their whole pitch is making black boxes legible); fake or hand-waved enterprise context.

**Fetch.ai judges (Wajid, Bagoly)** — only relevant if entering the Fetch bounty: value Agentverse/ASI:One registration and genuine multi-step agent behaviour; punish non-functional demos and unregistered agents (hackpack rubric, URL above).

**Organizer/VC panel (inference from Ep4 press release language):** "technical execution, product quality, real-world applicability, and long-term impact" — i.e. does it work live, is it a product, would anyone use it, does it survive past the weekend.

---

## 5. Conduct's own thesis language (for mirroring)

From **https://www.conduct.ai** (verbatim):
- "AI OPERATING SYSTEM for enterprise SOFTWARE" / "Unlock the systems that power your business."
- "Conduct lets IT teams understand, modernise, and run their enterprise systems with AI"
- "Capture institutional knowledge. Conduct continuously documents and learns from the landscape so that institutional knowledge no longer sits with few expers." [typo theirs]
- "Understand your systems. Conduct reads the underlying code and reveals dependencies and downstream effects"
- "System changes that once took months now take hours." · "80% faster manual system analysis" · "50% faster delivery times for new features" · "3x faster change implementation" · "83% faster S/4HANA migration planning"

From **"The Conduct Mission"**, Jan Philipp Haas (https://www.conduct.ai/blog/the-conduct-mission):
- "Mission-critical systems had become far too complex to understand."
- "Business logic is scattered, knowledge is siloed, and IT is forced into the role of translator rather than innovator."
- "Everyday change requests can be delivered in minutes instead of weeks."
- "When you can see your systems clearly, you can act decisively."

From press (https://tech.eu/2025/09/18/conduct-emerges-from-stealth-to-transform-legacy-it-with-ai-agents/): "We believe that IT should be the core growth engine of every enterprise but today CEOs repeatedly tell us that IT is becoming a blocker to business outcomes: 3-4 per cent of enterprise revenue is spent on system maintenance." — Haas. Backers: Creandum (lead), Lucid Capital, Booom, angels from Palantir, Google DeepMind, Workday, a senior SAP leader. Customers Daimler Truck and Rittal (https://www.eu-startups.com/2025/09/london-based-conduct-secures-e11-2-million-to-modernise-enterprise-it-systems-with-ai/).

Their DoraHacks sponsor blurb (https://dorahacks.io/hackathon/2272/bounties): "Conduct AI is building agentic AI for enterprise systems — helping teams understand, modernise, and transform complex legacy software systems, starting with SAP. Their platform reads underlying code, maps dependencies, captures institutional knowledge, and helps teams plan, develop, and test system changes faster and with more confidence."
