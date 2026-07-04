# Competitor Analysis — through the YC lens

> Builds **on top of** [prior-art.md](prior-art.md) (the honest incumbent table) and
> [positioning-and-traction.md](positioning-and-traction.md) (the wedge). Those stay the short,
> demo/README-facing versions. **This** is the deep version: the landscape laid out honestly, then run
> through the framework a YC partner would actually use to pressure-test it — *unique insight, why-now,
> "why won't the incumbent just do this," the wedge, the grid, the market, the moat,* and an honest audit
> of the red flags they'd raise about **us**.
>
> **Companion to [pitch-competitor-analysis.md](pitch-competitor-analysis.md)** (J's doc), which is the
> *pitch-slide build spec* — the six-camp matrix, sourced £ pricing wall, and the exact `PitchDeck.tsx`
> touch-points. **This file is the strategic layer J's §10 asks the Generalist to add on top**: the YC
> pressure-test, deeper defensibility, the moat, and the self-audit. Read J's for what goes *on stage*;
> read this for *why the wedge holds*. Sourced figures below are pulled from J's `incumbent-pricing-research.md`
> / `traction-research.md` / `demo-claim-ledger.md` so the two docs never disagree on a number.
>
> Cross-lane note: positioning is normally J's lane. Written at the Generalist's request; J owns edits.
> Every incumbent claim below is marked ✅ verified / ⚠️ verify-before-demo so nobody quotes a guess to a judge.

---

## TL;DR — the one screen a YC partner would want

- **We are not first, and we say so.** Two funded camps already sell into this space — *generative* bid
  writers (AutogenAI) and *answer libraries* (Loopio / Responsive). Claiming "no competitors" is the red
  flag that says "no market." We have competitors *because* the market is real.
- **Nobody owns our wedge:** making the **reading of the tender auditable** — every requirement traceable
  to its exact clause, the disqualifier caught loudly, and *measured* completeness (scored against a
  hand-labelled key on a held-out tender, and honest about what it flags). Both incumbent camps treat
  "read the tender → figure out the requirements" as a
  solved black box. It isn't, and it's the step where a single miss voids the whole bid.
- **Our real competitor is Word + Excel + a highlighter** — the status quo the SME long tail actually uses.
  That's who we have to be 10× better than, not AutogenAI.
- **The insight:** the value isn't the extraction — it's **capturing the bid manager's decisions** as
  reusable, compounding context. That's Conduct's own thesis, and it's the moat incumbents structurally
  can't copy without becoming a different product.
- **Why now:** the 2024–25 UK Procurement Act + the collapse in cost of grounded, structured LLM extraction
  made an *auditable* (not generative) tender tool buildable for the first time. Two years ago the trust
  layer wasn't possible; the black-box generators are the pre-trust generation of this market.

---

# Part 1 — The landscape, honestly (the base)

YC rule #1 on competition: **name them, respect them, then show the structural reason you win.** Partners
distrust a founder who's never heard of the incumbent far more than one who says "yes, AutogenAI is good,
here's the slice they can't serve."

## The six camps

| # | Camp | Who | What they nail | The slice they leave open (our wedge into it) |
|---|------|-----|----------------|-----------------------------------------------|
| 1 | **Generative bid writers** | **AutogenAI** (enterprise), **mytender.io** (SME-facing) | Drafting polished prose fast; mytender.io targets our *exact* segment | The *reading/verification* step is assumed done; black-box output; **no measured recall**; both **demo-gated on price** (no self-serve compare) |
| 2 | **RFP answer libraries** | **Loopio**, **Responsive** (ex-RFPIO), Ombud | Reusing curated past answers at scale; sales-proposal workflow | Needs a maintained content library you build first; doesn't *extract or verify the tender's* requirements |
| 3 | **Construction extraction** | **Constructionline "X-Ray"**, takeoff/drawing tools | Requirement + missed-item extraction on drawing-heavy construction packs (~10k firms) | Construction niche, drawing parsing — a *different, harder* document problem; we deliberately chose text-based public sector |
| 4 | **Horizontal LLM / doc-QA** | **NotebookLM**, ChatGPT, Claude, Copilot | Cheap/instant "ask a PDF"; huge distribution | Closed + unmeasurable; no structured output we control, no grounding we can prove, no decision capture, no recall guarantee |
| 5 | **Tender *discovery* / market intel** | **Stotles**, **Tussell**, Tracker/BiP, Oscar, gov Find-a-Tender | Finding *which* contracts to bid on; pipeline intelligence | Stops at "here's an opportunity." Silent on "what does *this* document require and do we comply." Adjacent — and a real threat vector (see below) |
| 6 | **The status quo (the real one)** | **Word + Excel + PDF highlighter + the bid manager's brain** | Free, trusted, universal, in-control | 3 weeks of reading; disqualifier risk sits entirely on one human; zero completeness guarantee; knowledge walks out the door |

## Deep dive — the two camps that matter, and *why they won't just do this*

**AutogenAI (Camp 1) — the incumbent judges will name.** ✅ UK-founded generative bid-writing platform,
venture-backed, sold to established bid teams at large organisations. It is genuinely good at *writing*.
- **Why it's not us:** it starts *after* the requirements are known — it treats "read the 150-page ITT and
  figure out what's actually being asked" as a pre-step the customer already did. Its output is prose you
  trust or you don't; there's no "click this sentence to see the exact clause it answers." And its price and
  motion target orgs with a dedicated bid function — not the SME care provider or the two-person consultancy.
- **⚠️ "Why won't AutogenAI just add auditable extraction?"** — the killer YC question, answered in Part 2 §6.
  Short version: it cuts against their pricing, their positioning ("we write it for you"), and their customer
  (big teams who *want* the black box). Adding "here's everything we might have missed, flagged honestly" is
  off-brand for a generator selling confidence.

**mytender.io (Camp 1, SME-facing) — our closest direct competitor.** ⚠️ SME-facing AI bid-writing
platform ("Win More Bids") — the one rival that shares our *segment* (SMEs, not just enterprise).
- **Why it's not us:** it's a *generative* drafting tool, not an *auditable-extraction / disqualifier-catch*
  tool. It doesn't read the tender and prove — clause by clause — what it found, and it doesn't measure
  what it might have missed. And like AutogenAI, its pricing is **demo-gated** (`/pricing` 404s), so an SME
  can't even self-serve-compare. It attacks our segment on the *generative* axis; we own the *verifiable*
  one. This is the sharpest single contrast to rehearse, because it's the competitor a judge is most likely
  to say "isn't that the same thing?" about — and the answer is *"same buyer, opposite promise: they write,
  we verify."*

**Loopio / Responsive (Camp 2) — the answer-library camp.** ✅ Mature RFP-response platforms centred on a
maintained **content library** of past Q&A that sales/proposal teams reuse.
- **Why it's not us:** the model assumes you *already have* a library and the discipline to curate it — an
  enterprise sales-ops behaviour. It optimises *answering repeated questions*, not *extracting and verifying a
  novel tender's requirements*. An SME bidding its third-ever NHS framework has no library to reuse.

**NotebookLM / generic chat (Camp 4) — the "why not just use ChatGPT?" objection.** The honest answer isn't
"it's worse" — it's **"it's unmeasurable."** We can state a recall number; a chat window can't. We ground every
claim to a clause and prove zero-bluff on an eval set; a chat window will confidently hallucinate a
requirement and you'll never know which. For a document where one miss voids the bid, *unmeasurable* = unusable.
This is our sharpest 10×-vs-free argument and it's a *trust* argument, not a feature argument.

## The competitor that will actually beat us if anyone does: **the status quo**

YC partners force this reframe constantly: *your competitor is not the other startup, it's the customer
doing nothing / doing it in Excel.* 90% of SME bidders today use Word, a spreadsheet, and a highlighter.
They are not evaluating AutogenAI vs Bidframe — they are evaluating **Bidframe vs the way they've always
done it.** So the bar is not "beat AutogenAI on features"; it's **"be so obviously better than a highlighter
that a busy non-technical bid manager switches after one demo."** Every design decision (the loud catch,
one-click source, the honest flag) is aimed at *that* comparison, not the incumbent grid.

## The adjacent threat vector (name it before a judge does)

**Camp 5 — tender-intelligence players (Stotles, Tussell) moving downstream.** They already own the top of the
funnel ("which contracts should you bid on") and the customer relationship. The plausible attack is: they bolt
a "requirement extraction" feature onto an opportunity they already surface. ⚠️ This is our most credible
competitive risk — more than AutogenAI. Our answer: they'd be entering *our* trust/verification game late,
with no eval harness, no grounding infrastructure, and no decision-capture moat — and their business model
(market intelligence subscriptions) doesn't reward the deep per-document accuracy work that is our whole spine.
But we should say this out loud rather than pretend the funnel doesn't connect.

---

# Part 2 — Built on top: the YC framework applied

The base above is the *what*. This is the *pressure test* — the framework a YC partner (Kevin Hale on
evaluating ideas, Michael Seibel on positioning, the standard office-hours interrogation) would run it
through. Each section is a question they'd ask and the answer we can defend.

## 1. The one-liner (Michael Seibel's test: a smart stranger gets it in one sentence)

> **Bidframe turns a 150-page public-sector tender into a verified, source-linked compliance checklist in
> minutes — catches the requirement that would have disqualified the bid, flags what it's unsure about, and
> drafts your response from your own evidence. The human approves every call.**

Passes the test: no jargon, names the pain (150 pages, disqualification), names the output (checklist),
names the guardrail (human approves). A partner can repeat it back. ✅

## 2. Who desperately needs this (specific, not "SMEs")

YC: *"who is the one person whose hair is on fire?"* Not "SMEs who bid." Precisely:
- **The bid manager at a small consultancy** running 5–15 public-sector responses a month, personally liable
  if a mandatory gate is missed. **This is the tip of the spear** — one consultancy that adopts runs *every*
  client bid through us (value compounds), decides in one conversation, and is reachable on LinkedIn.
- **The ops/commercial lead at an SME** (care, facilities, cleaning, catering, IT/managed services, training)
  bidding an NHS/council framework once a quarter — under-tooled, terrified of the pass/fail gate, no bid function.

Both feel a **specific, recurring, expensive, mandatory** pain — which is exactly Kevin Hale's checklist:

## 3. Is this a good problem? (Kevin Hale's "is the problem real" grid)

| Test | Bidframe | Verdict |
|------|----------|---------|
| **Popular** — do many have it? | Every org bidding UK public contracts (tens of thousands; SME target = 33% of public spend) | ✅ |
| **Growing** | Procurement Act 2023 (live 2025) *increases* compliance surface + SME emphasis | ✅ |
| **Urgent** | A live tender has a hard deadline; a missed gate = instant disqualification | ✅✅ (rare "hair on fire") |
| **Expensive** | ~3 weeks of expert reading per bid; a lost bid = £10k–£millions of pipeline | ✅ |
| **Mandatory** | You *cannot* submit a compliant bid without doing this work | ✅ (not a vitamin) |
| **Frequent** | Consultancies: weekly. SMEs: quarterly | ✅ for the beachhead |

This scores unusually well — the pain is mandatory *and* frequent *and* urgent, the trifecta YC looks for.
The weakest cell is "frequent" for the SME segment, which is exactly why the **consultancy** is the beachhead.

## 4. The unique insight — our "secret" (Thiel's question: what important truth do few agree with you on?)

> **"The valuable thing to automate in bidding isn't writing the answer — it's capturing the reading and the
> decisions. Everyone is racing to generate prose; the durable product captures the judgment."**

Most of the market believes the AI value is in *generation* (write my bid). We believe the generation is the
commoditising, black-box part, and the defensible value is **the audited extraction + the captured decisions**
— which is *also* the part that builds trust *and* compounds into a moat. This is a genuinely
non-consensus bet: we are deliberately *not* competing on prose quality, in a market where everyone else is.

## 5. Why now (the tailwind — a YC partner's favourite question)

Three things had to be true, and only recently all are:
1. **Grounded, structured extraction got cheap and reliable.** JSON-schema/function-calling + citation-grade
   grounding at scale is a 2024→ capability. Two years ago you *couldn't* build the trust layer — which is
   why the incumbents are *generative* (the pre-trust generation of this market).
2. **The UK Procurement Act (2023, in force 2025)** raised the compliance/transparency surface and re-stressed
   SME access — more documents, more gates, more anxious under-tooled bidders. ⚠️ (verify exact provisions before quoting)
3. **The trust backlash against black-box AI in high-stakes work.** Buyers now *ask* "can I verify this?"
   The market has shifted from "does it generate?" to "can I trust what it extracted?" — the exact axis we own.

If a partner asks "why didn't this exist 3 years ago?" — the honest answer is "the auditable version wasn't
buildable, and the market hadn't yet been burned enough by black boxes to demand it." That's a real why-now.

## 6. "Why won't AutogenAI / Google just do this?" (the defensibility question)

The single most-asked YC question. Three structural reasons, not "we'll move faster":
- **It fights their positioning.** A generator sells *confidence* ("we write your bid"). Our headline feature
  is *honesty about uncertainty* ("here are the 2% we're not sure about"). A market leader can't lead with
  "here's what we might have missed" without undercutting the product they already sell.
- **It fights their price and customer.** Their economics need large accounts with bid teams. Our wedge is the
  SME/consultancy long tail they've priced out. Serving it means a cheaper, self-serve, lower-touch product —
  a different company. Incumbents rarely knife their own margin to chase the tail.
- **It fights their data model.** The moat (below) is *captured decisions per bidder*, accumulated bid over
  bid. That's earned over time from the workflow; it can't be bought or bolted on in a sprint. Whoever starts
  capturing it first compounds a lead.

For **Google/NotebookLM**: horizontal players won't build a public-sector-procurement-specific eval harness,
gold set, and decision-capture graph — it's a vertical trust problem, not a model problem, and it's beneath
their altitude.

## 7. The wedge → land-and-expand (come for the tool, stay for the context)

YC loves a narrow wedge with an expansion story. Ours:

- **Wedge (land):** the *auditable requirement breakdown + disqualifier catch* — the single most painful,
  most verifiable, most demo-able job. Narrow, sharp, 10× better than a highlighter.
- **Expand (stay):**
  1. Auditable **autofill** — draft each answer from the bidder's own evidence (already built; never bluffs).
  2. **Decision capture** compounding across bids → the reusable context graph.
  3. Requirement → **award-criterion → weighting** mapping ("where do the most marks live").
  4. Team/portfolio memory: the next bid and the next teammate *inherit* the last one's judgment.

The tool gets you in; the accumulating decisions are why you never leave. That's the "come for the tool,
stay for the network" pattern YC partners recognise instantly.

## 8. The positioning grid (the classic 2×2)

Axes chosen to be the ones the **customer** cares about — **Auditable/verifiable (Y)** × **Serves the SME
long tail (X)**. (The trick, per YC/April Dunford: pick axes where *you* are alone in the top-right.)

|                              | **Enterprise-only / high-touch** | **SME long tail / self-serve** |
|------------------------------|----------------------------------|--------------------------------|
| **Auditable & verified**     | *(mostly empty)*                 | **◆ Bidframe** |
| **Black-box / unverifiable** | AutogenAI, Loopio, Responsive    | **mytender.io**, NotebookLM / ChatGPT, "do it in Word" |

We are deliberately alone in the top-right. The revealing cell is **bottom-right**: **mytender.io** shares our
*segment* (SME) but sits on the black-box axis — it is the clean, single-square contrast that proves our win is
the **Y-axis (verifiability)**, not the X-axis. Against the *enterprise* incumbents our win is the X-axis (the
segment they won't serve). We don't claim to beat everyone on every axis — we claim the one quadrant that matters
for a document where a miss voids the bid, and we can point at exactly why each rival is not in it.

> **Candidate 7th axis (per J's §10-#6) — "deterministic guarantee."** Our disqualifier catch has a
> non-model safety net: gates are caught by deterministic rules even if the LLM misses them. No generative
> rival has this — their whole product *is* the model. If it doesn't overcrowd the on-stage matrix, it's a
> column only Bidframe can fill. (Keep it for this strategic doc; J decides whether the slide has room.)

## 9. Market — how big can this get? (bottom-up, assumptions labelled)

YC hates top-down "1% of a £341bn market." Use the sourced top line, then a bottom-up SOM (top figures ✅ from
J's `demo-claim-ledger.md` / `traction-research.md`; the per-seat ARR math is ⚠️ my estimate — validate in calls):

- **The market is real and SME-winnable (sourced):** UK public procurement ≈ **£341bn/yr** (2023/24, House of
  Commons Library). SMEs won **£45.2bn of direct public-sector spend in 2025 — a 21% share, a six-year high**;
  **local government alone spent £29.1bn with SMEs (34%)**. These aren't unwinnable mega-contracts — the SME
  share is large and rising, which is the demand signal under the wedge.
- **Where they live — a ready distribution channel (per J's §10-#4):** the **G-Cloud / Digital Marketplace**
  lists **~4,000 suppliers, ~90% of them SMEs** ⚠️(verify current count). That's a concentrated, addressable
  pool of exactly our buyer — and no competitor above owns it as a channel. A real go-to-market on-ramp, not
  just a TAM number.
- **Beachhead — bid consultancies:** est. **hundreds** of small UK bid-writing firms. If ~300 are reachable and
  each would pay ~£200–500/mo for a tool used on every client bid → an **£0.7–1.8M ARR** beachhead before
  touching a single direct SME. Small, but "small market you can own entirely," which is the *right* YC shape
  for a wedge.
- **Expansion — SMEs bidding regularly:** tens of thousands across care/FM/cleaning/catering/IT/training.
  Even low single-digit % penetration at £50–150/mo is a materially larger second ring.
- **The honest read:** this is a *"start in a market small enough to dominate, expand into an adjacent large
  one"* story — not a "£10bn TAM" story. Present it that way; partners respect the narrow-and-ownable framing
  over an inflated TAM slide.

## 10. The moat over time (why the lead compounds — the Conduct bridge)

Features get copied; **accumulated context doesn't.** Every approve / edit / flag, every answer to a gap
question, every piece of evidence a bidder links to a requirement becomes reusable context that compounds
across their future bids. Bid 50 is dramatically faster and safer than bid 1 *for that bidder* — a switching
cost that grows with use and can't be transferred to a competitor who starts from zero. This is Conduct's exact
thesis ("capture the context of an expert's decisions so legacy knowledge moves with the work") and it's why
the demo framing is *"the matrix is the surface; the captured decisions are the moat."*

## 11. Traction as the proof (do things that don't scale)

YC: *the only real validation is users who want it.* Henry's framing matches — *"if the product is good you'll
get traction."* So traction is not a tiebreaker, it's **evidence of quality** for the highest-weighted scores a
90-second demo can't fully prove. The plan (per [positioning-and-traction.md](positioning-and-traction.md)):
run it **live on a tender a real bid manager recognises**, capture the reaction, tier the asks honestly
(interest → pilot → micro pre-commit). One consultancy saying "I'd run every bid through this" outweighs any
feature-grid argument in this document. Gate it behind a demo-solid build — a stumbling demo produces the
*opposite* of proof.

---

# Part 3 — Red flags a YC partner would raise about US (honest self-audit)

Partners trust founders who see their own weaknesses. Here are the ones they'd hit, and our current answer:

| Red flag they'd raise | Honest status | Our answer / mitigation |
|---|---|---|
| **"So it's AutogenAI-lite?"** | Real risk — we *do* draft answers now | No: **auditable autofill** — grounded in the bidder's own evidence, traceable, asks instead of bluffs. We compete on *trust*, not prose. Lead with the flag, not the generation. |
| **"Extraction is a feature, not a company."** | Fair for the wedge alone | The company is the **decision-capture moat** (§10), not extraction. Extraction is the wedge that earns the right to accumulate the context. |
| **"Incumbents will copy it."** | They *could* build extraction | But not without fighting their positioning, price, and data model (§6) — and the moat is earned over time, not shipped in a sprint. |
| **"Tender-intel players (Stotles) own the funnel."** | Most credible threat | They'd enter our trust game late, with no eval/grounding/decision-capture, and a business model that doesn't reward per-doc accuracy (Part 1, threat vector). |
| **"Market's too small."** | The beachhead *is* small | On purpose — "small enough to own, adjacent to something large" (§9). Right shape for a wedge, not a weakness. |
| **"Non-technical buyer, long sales cycle."** | Public sector is slow | Beachhead = **consultancies** (fast one-conversation decision, weekly usage), not direct-to-council. |
| **"Can you actually prove the accuracy?"** | This is the whole game | Yes — the **eval harness** scores recall vs a hand-labelled key. Sanctioned numbers (from `demo-claim-ledger.md`, scoped to the examples — **not** a blanket "98%"): deal-breaker benchmark **12/12**, held-out tender **10/10**, phrasing bank **101/101**, **0 dangerous misses**. ⚠️ Per J-083, quote the *net-applied* gating figure (`eval_all` understates it). Turn every trust claim into a measured number; that's the spine, not marketing. |

---

# Part 4 — Competitor Q&A cheat sheet (for the demo)

Fast, defensible one-liners when a judge names a competitor:

- **"Why not AutogenAI?"** → "They *write* the bid for big teams at enterprise prices. They assume you've
  already read the tender. We make the *reading* auditable, for the SME they price out — and we draft from
  *your* evidence, traceably, instead of a black box."
- **"Why not just ChatGPT / NotebookLM?"** → "Because a chat window is *unmeasurable*. We can tell you our
  recall and prove zero bluffs on an eval set. For a document where one miss voids the bid, unmeasurable is
  unusable."
- **"Why not Loopio?"** → "That's a library of your *past answers* you have to build and maintain. An SME on
  its third NHS bid has no library — and it still doesn't read *this* tender's requirements for you."
- **"Won't Stotles just add this?"** → "They own *which* bid to chase; we own *can you comply and can you
  prove it*. They'd be entering our trust game late with no eval harness and no decision-capture moat."
- **"Isn't this just extraction?"** → "Extraction gets you in the door. What you *keep* is every decision the
  bid manager makes, captured and compounding across bids — the part that gets faster and safer every time,
  and the part nobody can copy from zero."

---

### Changelog
- **2026-07-04** — v1.1 by Generalist. Reconciled with J's `pitch-competitor-analysis.md` after discovering
  its §10 "For Bobby" ask. Addressed those threads that fit the YC lens: **#2** added **mytender.io** (the
  closest direct competitor, previously missing) across the table, deep dive, and 2×2; **#3** swapped the
  banned "98% accuracy" for the sanctioned scoped eval numbers (12/12 · 10/10 · 101/101, J-083 caveat);
  **#4** added the G-Cloud/Digital Marketplace distribution angle; **#6** added the deterministic-safety-net
  as a candidate 7th axis. Replaced hand-waved market figures with J's sourced ones (£341bn · £45.2bn ·
  £29.1bn). Still open for J/Bobby: **#1** pin a real AutogenAI/mytender.io price, **#5** pressure-test each
  claim in the traction calls.
- **2026-07-04** — v1 by Generalist (at user request; J owns positioning). Builds on `prior-art.md` +
  `positioning-and-traction.md`; adds the YC-framework layer, the 2×2, bottom-up market sizing, and the
  self-audit. ⚠️ **Before quoting to a judge:** verify AutogenAI funding/pricing, Constructionline X-Ray
  scope, Loopio/Responsive model, Stotles/Tussell scope, and the Procurement Act provisions on their own
  pages — claims here are marked ✅ verified / ⚠️ verify-first and several still need the second check.
