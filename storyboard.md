# Bidframe Pitch Deck Storyboard

> 3-minute investor presentation for Bidframe.
> Goal: make non-procurement judges understand the tender workflow quickly, show that deal-breaker detection is the sharpest wedge, then make the product feel like a guided path through a dense tender forest.

## Core Pitch

Bidframe turns a UK public-sector tender into a verified, source-linked compliance matrix in minutes. It surfaces the deal-breakers that can disqualify a bid, flags uncertainty instead of guessing, and drafts answers only from evidence the bidder can cite. The human approves every call.

## Story Feeling

The deck should feel like a journey through dense woodland, not a flat civic filing cabinet.

**Metaphor:** a tender is a thick forest of clauses. Bidframe is the marked trail: it finds the red danger markers, opens a clearing around the source evidence, and leaves the bid manager with a map they can trust.

**Visual rhythm:**

1. **Trailhead:** define the tender and the stakes.
2. **Dense woods:** show the long PDF and manual bid-work mess.
3. **Red marker:** the deal-breaker emerges in oxblood.
4. **Clearing:** source clause and evidence become visible.
5. **Canopy map:** requirements connect to scoring and future bids.
6. **Summit / ask:** bring us your tender.

Keep the official-record structure, but let the forest carry the emotional arc: pine, moss, fern edges, paper as a field notebook, oxblood as the trail warning.

## Audience Assumption

The room may include investors who understand enterprise software but not procurement language. Do not assume they know what an ITT, compliance matrix, pass/fail gate, or evidence pack is. Define the workflow before showing the product.

## Plain-English Terms

Use these definitions in the deck and script.

| Term | Plain-English Explanation |
|---|---|
| Tender / ITT | The instruction pack a public buyer publishes when it wants to buy something. It says what they need, what suppliers must prove, and how bids will be scored. |
| Bid | The supplier's response to that tender. This is how they try to win the contract. |
| Requirement | One thing the supplier must do, prove, return, price, or answer. |
| Deal-breaker / pass-fail gate | A mandatory rule where getting it wrong can disqualify the whole bid before the good parts are read. |
| Compliance matrix | The checklist bid teams build to track every requirement and whether the supplier can meet it. |
| Evidence | The supplier's own documents: certificates, policies, method statements, case studies, insurance, references. |
| Source traceability | Every requirement links back to the exact page and clause in the tender. |
| Auditable autofill | Drafted answers that cite the bidder's own evidence. If there is no evidence, Bidframe asks a question instead of inventing an answer. |

## Statistics To Weave In

Use only 2 or 3 statistics on stage. Keep the rest for Q&A or backup slides.

### Market Stats

| Stat | Why It Matters | Suggested Wording |
|---|---|---|
| UK public bodies spent about **GBP 341bn** on procurement from the private sector in 2023-24, around **32% of public spending**. | This is a real, enormous workflow, not a niche admin task. | "This is not a tiny paperwork problem. UK public procurement is a GBP 300bn-plus market." |
| The new UK Procurement Act regime went live on **24 February 2025**. | Fresh regulation means suppliers need help understanding rules and compliance. | "The rules are changing now, which makes compliance tooling timely." |
| Crown Commercial Service material reported that **72% of suppliers available through its commercial agreements were micro, small, or medium-sized enterprises**. | Supports the SME wedge. | "This is not only a big-prime market. SMEs are all over the supplier base." |
| G-Cloud reached **GBP 2.91bn** annual sales in 2024-25, and has historically been SME-heavy. | Public-sector frameworks can create big software and services markets. | "Frameworks like G-Cloud show how large these public-sector routes can become." |

**Source notes to verify before final deck:** market figures are from public procurement summaries citing House of Commons Library / Cabinet Office / Crown Commercial Service materials. Before submission, replace this note with primary links if the slides quote these numbers directly.

Useful starting links:

- UK public procurement overview and current headline spend figure: https://en.wikipedia.org/wiki/Government_procurement_in_the_United_Kingdom
- Procurement Act 2023 primary legislation: https://www.legislation.gov.uk/ukpga/2023/54/contents
- G-Cloud overview and sales history: https://en.wikipedia.org/wiki/UK_Government_G-Cloud

Do not leave Wikipedia as the final slide source if there is time to chase the House of Commons Library / Cabinet Office primary references.

### Product Stats

| Stat | Where It Comes From | How To Say It |
|---|---|---|
| **Every deal-breaker caught** on the hero tender. | `demo-narrative.md`, `STATUS.md`, pre-baked SPSO run. | "On our worked example, every disqualifying gate is surfaced." |
| **Zero dangerous misses** on the hero tender. | Eval harness and hand-labelled gold set. | "The eval does not just count matches. It flags missed deal-breakers as dangerous." |
| **0 invented answers** in groundedness checks. | `engine/eval_answers.py`; demo docs cite evidence. | "If Bidframe cannot cite evidence, it asks. It does not bluff." |
| **18 / 19 requirements found** on first measured tender. | README and demo narrative. | "We measured against a hand-labelled answer key, not vibes." |
| **183 requirements, 109 grounded answers, 0 bluffs** in the pre-baked SPSO demo fixture. | `STATUS.md` and `/demo` fixture notes. | "The stage demo is a real prior pipeline run, not fabricated sample data." |

**Honesty rule:** product stats are worked-example proof, not a universal guarantee. Use "on the hero tender" or "in our worked example" when quoting them.

## Narrative Spine

1. Public tenders are high-stakes instruction packs.
2. They feel like a dense forest of rules, forms, deadlines, certificates, and scoring criteria.
3. Bid teams manually turn that forest into a compliance matrix.
4. The expensive failure is missing the red marker: a deal-breaker.
5. Bidframe reads the tender and builds the path automatically.
6. Every line is checkable against the source.
7. Answers are drafted only when backed by evidence.
8. The user's decisions become reusable context for the next bid.

## Required 7-Slide Structure

This is the locked main deck. The forest journey is the visual language, but the slide jobs must stay explicit for the judges: Problem, Use Case, Solution, Product, Demo Flow, Tech, Ask.

| Slide | Required Bucket | Short Title | Job In The Pitch | Core Visual |
|---|---|---|---|---|
| 1 | Problem | One missed deal-breaker kills the bid | Define tenders and the disqualification risk | Dark forest trailhead, clause-frame logo, oxblood warning marker |
| 2 | Use Case | The bid manager's first read | Show the real workflow before Bidframe | Tender PDF turning into a manual checklist |
| 3 | Solution | A marked trail through the tender | Explain Bidframe in one sentence | Forest path resolving into a compliance matrix |
| 4 | Product | Deal-breakers first, every line checkable | Show the power features and credibility | Product screenshot with `GatingHero`, source proof, answer receipts |
| 5 | Demo Flow | PDF to matrix to proof to answer | Choreograph the live or recorded demo | Four-step path with screenshots from `/demo` and `/answers` |
| 6 | Tech | A trust layer, not a PDF chatbot | Explain why it is accurate, auditable, and defensible | Pipeline diagram plus eval proof ledger |
| 7 | Ask | Help us scale the first-read layer | Close with investor/adviser ask and pilots | Summit view, Bidframe URL, owl mascot as guide |

## 3-Minute Timing

| Time | Required Bucket | Screen / Slide | Owner |
|---|---|---|---|
| 0:00-0:20 | Problem | Slide 1: "One missed deal-breaker kills the bid" | Joel |
| 0:20-0:42 | Use Case | Slide 2: tender PDF -> manual compliance matrix | Bobby |
| 0:42-1:02 | Solution | Slide 3: Bidframe as the marked trail | Joel |
| 1:02-1:32 | Product | Slide 4: deal-breaker-first matrix and proof surface | Jawad |
| 1:32-2:06 | Demo Flow | Slide 5: PDF -> matrix -> source proof -> answer receipts | Jawad / Bobby |
| 2:06-2:36 | Tech | Slide 6: pipeline, eval harness, no-bluff answer drafting | Pranav |
| 2:36-3:00 | Ask | Slide 7: invest/advice, pilots, and scaling after Demo Day | Joel / all |

## Slide-by-Slide Storyboard

### Slide 1 - Problem / Trailhead

**Title:** One missed deal-breaker kills the bid.

**Subtitle:** Public-sector bids can be rejected before the buyer reads the good parts.

**Visual:** Woodland trailhead over warm paper: pine-dark top band, faint clause text as the "forest floor", Bidframe clause-frame logo, one oxblood trail marker. Keep the owl small as a guide, not the main logo.

**Speaker note:**

> "A tender is how a council, NHS trust, or school buys services. Suppliers respond with a bid. Miss one mandatory rule, and the bid can be rejected before anyone reads the good parts."

**Purpose:** Teach the tender definition and the stakes in one sentence before showing software.

**Forest cue:** The viewer has arrived at the edge of the forest. The tender looks dense but navigable.

### Slide 2 - Use Case / The Bid Manager's First Read

**Title:** Before a supplier can bid, someone has to read the forest.

**Visual flow:**

`Public buyer publishes tender -> Supplier reads rules -> Bid team builds compliance matrix -> Deal-breakers checked -> Bid submitted`

Add one small market figure in the corner:

> UK public procurement: GBP 300bn-plus annual private-sector spend.

**Use labels:**

- Tender: the buyer's instruction pack.
- Compliance matrix: the bidder's checklist.
- Deal-breaker: miss it and you may be out.

**Speaker note:**

> "Today this is mostly manual. A bid manager reads a long PDF, extracts every requirement into a spreadsheet, works out which ones are pass/fail, and then coordinates evidence and answers. That can take days or weeks."

**Purpose:** Make the product legible to investors who do not speak procurement.

**Forest cue:** This is the dense part of the forest: many paths, hidden deadlines, forms, certificates, and scoring rules.

### Slide 3 - Solution / The Marked Path

**Title:** Bidframe turns the tender into a verified worklist.

**Visual:** Forest path resolving into the product. Use a screenshot from `/demo` showing the pre-baked SPSO compliance matrix and the deal-breaker hero.

**On-screen callouts:**

- Every requirement extracted.
- Deal-breakers shown first.
- Uncertain items flagged.
- Human approves, edits, or flags.

**Speaker note:**

> "Bidframe reads a tender into a compliance matrix: every requirement, its source, its confidence, and its status. The deal-breaker is not buried in row 84. It is the first thing you see."

**Purpose:** Deliver the hero moment quickly.

**Forest cue:** The confusing forest becomes a marked path. The oxblood deal-breaker is the red trail warning.

### Slide 4 - Product / Deal-Breakers First

**Title:** Deal-breakers first. Every line checkable.

**Visual:** Product collage with three real surfaces: the matrix `GatingHero`, the source panel, and the answer receipt card. Keep one main screenshot large and use two smaller detail crops.

**Power features:**

- Deal-breaker detection is the hero feature.
- Source-linked requirements show exact page, clause, and excerpt.
- Confidence appears as a glanceable signal, not a raw score.
- Answer drafts cite supplier evidence or ask questions when evidence is missing.
- Human decisions stay in the record.

**Proof ledger:**

- Every deal-breaker caught on the hero tender.
- Zero dangerous misses.
- 0 invented answers in groundedness checks.
- 18 / 19 requirements found on the first measured tender, with the missing/uncertain item surfaced for review.

**Speaker note:**

> "The point is not to make the AI sound confident. The point is to make the bid manager confident. One click shows the exact sentence and page, and the product is built around the fear that matters most: a missed disqualifier."

**Honesty note:** If asked, do not overclaim a broad benchmark. Say the strongest numbers are from measured worked examples and the validation set is expanding.

**Forest cue:** The product opens a clearing around the clause. The viewer can finally see the exact line, page, and evidence without pushing through the document.

### Slide 5 - Demo Flow / PDF To Proof

**Title:** PDF to matrix to proof to answer.

**Visual:** Four-step horizontal trail using the Canva asset screenshots:

1. Upload tender PDF.
2. See deal-breakers and requirements in the matrix.
3. Open the source proof for exact page and clause.
4. Draft answers with evidence receipts and gap questions.

**Demo script:**

- Start on the live trusted demo link.
- Open the deal-breaker first.
- Show the source excerpt.
- Jump to answer receipts.
- End by saying the bid manager approves every step.

**Speaker note:**

> "The demo is deliberately simple: tender in, matrix out, source proof one click away, answer receipts only where evidence exists. If evidence is missing, Bidframe asks instead of bluffing."

**Purpose:** Give the team a clear 30-second live demo route if the deck becomes too abstract.

**Forest cue:** The trail has visible waymarks: upload, red marker, clearing, evidence footprint.

### Slide 6 - Tech / Trust Layer

**Title:** A trust layer, not a PDF chatbot.

**Visual:** Simple pipeline diagram:

`PDF ingest -> requirement extraction -> reconcile/dedupe -> deal-breaker classification -> source-linked matrix -> evidence-backed answers -> eval harness`

**Tech proof points:**

- Python/FastAPI backend for ingest, extraction, and API.
- Python engine for reconcile/dedupe, confidence routing, and evals.
- Next.js product surface for the compliance matrix, source panel, graph, and answer receipts.
- Demo-safe data path for stage reliability.
- Eval harness measures dangerous misses, especially missed deal-breakers.

**Speaker note:**

> "The technical bet is structured extraction plus auditability. We parse the tender, reconcile duplicates, classify deal-breakers, attach source evidence, and only draft answers from supplier documents. The eval does not just reward plausible text. It punishes dangerous misses."

**Purpose:** Show credibility without turning the pitch into an engineering walkthrough.

**Forest cue:** The forest trail becomes a map legend. The audience sees the system underneath the journey.

### Slide 7 - Ask / Summit

**Title:** Help us scale the first-read layer for public-sector bids.

**Visual:** Pine closing band, warm paper record, Bidframe URL, clause-frame logo, and the owl mascot as the guide at the edge of the map. This should feel like reaching the top of the trail and seeing the route clearly behind you.

**Close line:**

> "Three weeks of reading and disqualifier risk becomes a verified worklist in minutes, with the expert still approving every step."

**Ask:**

- Investment or advice to keep scaling after Demo Day.
- Warm intros to SME public-sector bidders and bid consultancies.
- Bring us a public-sector tender and we will prepare the deal-breaker checklist before the call.

**Forest cue:** The audience leaves with a clear next path: bring a tender, get the map.

## Optional Live Demo Choreography

Use the pre-baked `/demo` path by default. It is a real prior pipeline run and avoids venue wifi, public API key, and rate-limit risk.

1. Start on slide 1 or landing hero.
2. Move to `/demo` or `/review` for the matrix.
3. Point to the oxblood deal-breaker hero.
4. Click "See a deal-breaker in the document" or open the source drawer.
5. Move to `/answers` for evidence-backed draft answers.
6. Return to final slide for market and ask.

**Honest wording for the pre-baked path:**

> "For stage reliability, this is the cached output from our real backend pipeline. The same schema and UI are used for live uploads."

Do not say the model is running live unless the Render key has been tested that day.

## Visual Direction

Blend the product's civic-record identity with the landing/demo woodland world. The civic record gives credibility; the forest gives movement and memory.

**Colours:**

- Paper: `#F6F2E9`
- Paper raised: `#FBF8F1`
- Ink: `#211D17`
- Forest: `#2C5640`
- Hairline: `#E4DDCE`
- Oxblood: `#B42D24`
- Oxblood frame: `#8A2D2A`
- Pine: `#1D3A2B`
- Pine deep: `#16301F`
- Moss: `#E8EBDD`
- Accent/source teal: `#2F5D63`

**Type:**

- Fraunces for titles.
- Chillax for body.
- IBM Plex Mono for page refs, clause refs, metrics, and proof ledgers.

**Slide rules:**

- Use real product screenshots, not abstract AI imagery.
- One firm 2px ink rule per slide.
- Oxblood appears only for deal-breakers or danger.
- Forest appears only for approval, action, or brand accent.
- Pine and moss can carry the journey atmosphere: section bands, forest edges, closing ground.
- Use fern, pine, paper grain, and faint ledger grids as edge texture, not decoration in the content path.
- Do not show raw confidence scores like `0.92`.
- Avoid generic pitch-deck gradients, purple/blue AI styling, and oversized vague icons.

## Journey Motifs By Slide

| Slide | Motif | What It Communicates |
|---|---|---|
| 1 | Trailhead sign | The viewer is entering a high-stakes workflow. |
| 2 | Dense clause forest | Manual tender review is hard because the important line is hidden among ordinary lines. |
| 3 | Oxblood trail marker | Bidframe finds the danger first. |
| 4 | Clearing around the source | Trust comes from visibility, not blind faith. |
| 5 | Evidence footprints | Draft answers must leave a trail back to documents. |
| 6 | Canopy map | This is a repeatable market, not a one-off demo. |
| 7 | Summit / open route | The ask is simple: bring a tender, get the map. |

## Backup Stat Slide

If the judges want market scale, add one optional slide after Slide 6.

**Title:** The forest is huge.

**Three proof cards:**

1. **GBP 341bn** - UK public procurement from the private sector in 2023-24.
2. **32%** - share of UK public spending represented by that procurement figure.
3. **72% SME supplier base** - CCS commercial agreements reported a majority micro, small, or medium supplier base.

**Speaker note:**

> "We are starting narrow, with SME bidders and bid consultancies, but the workflow sits inside one of the largest document-heavy markets in the country."

**Caution:** verify primary source links before putting this slide in the final deck.

## Q&A Anchors

**"What is a tender?"**

> "It is the buyer's instruction pack for a public contract. It tells suppliers what they must provide, what documents they must submit, and how they will be scored."

**"Is this just ChatGPT on PDFs?"**

> "No. Chat gives a summary. Bidframe produces structured requirements, source links, confidence routing, human decisions, grounded answers, and deterministic evaluation against hand-labelled tenders."

**"Is this AutogenAI?"**

> "AutogenAI is a generative bid-writing suite for larger organisations. Bidframe starts earlier: the auditable compliance matrix, deal-breaker catch, source traceability, and evidence-backed autofill for SME bidders."

**"How do you know it works?"**

> "We built an eval harness. It scores output against human-labelled tender answer keys and highlights dangerous misses. On the hero tender, the deal-breakers are caught and the drafted answers do not invent citations."

**"Why public sector?"**

> "Public-sector tenders have a consistent pain: hard mandatory gates, transparent scoring, and a long tail of SME bidders who cannot afford enterprise bid software."

**"Who pays?"**

> "Frequent SME bidders and small bid consultancies. Consultancies are especially strong because they process many bids, so every saved first-pass review compounds."

## Do Not Say

- "We write your bid for you."
- "Fully automated submission."
- "Guaranteed to catch every possible requirement."
- "The model is running live" unless it is actually live.
- "Customers" unless there are signed or paying customers. Use "pilots", "targets", or "outreach" honestly.

## One-Sentence Version

Bidframe is the source-linked compliance matrix and auditable autofill layer for SME public-sector bidders: it finds the deal-breakers, shows the evidence, and keeps the expert in control.
