# Judge Q&A Battlecard — learn it in under an hour

> Demo Day: 4 July 2026. This is the **internalization / cram layer** — you don't memorize 50 answers,
> you memorize **one formula, six numbers, and five sentences**, and every answer below is a
> recombination of those. Numbers come from `demo-claim-ledger.md` (the only sanctioned source).
>
> **Sibling docs (this doesn't replace them — it's the "learn it fast" front-end to them):**
> `demo/q-and-a-battlecard.md` (short-forms + strategy), `demo-day/qa-prep.md` (role-routed reference),
> `demo/qa-prep.md` (one-breath drill card), `demo-day/practice-questions-yc-vc-2026-07-04.md` (drills).
> Same sanctioned numbers across all; if any two disagree, the **claim ledger wins**.
>
> Stage split: **Jawad** slides 1, 2, close · **Bobby** slides 3, 4 · **Joel** drives `/showcase` ·
> **Pranav** narrates the live demo.

---

## PART 1 — THE SPINE (memorize this, nothing else is mandatory) — 15 min

### The answer formula (every single answer, no exceptions)

**1. Direct answer (first 5 words). 2. Proof (a ledger number). 3. Honest boundary. 4. Back to the product.**

Never open with context. Never end on a caveat. The caveat goes in the middle; the last sentence
is always ours. A 20-second cap per answer — if you're still talking at 25 seconds, stop.

### The six numbers (the only stats you may say on stage)

| # | Number | What it is | One-line defense |
|---|--------|-----------|------------------|
| 1 | **26/26** | Hand-labelled deal-breakers caught across all 4 validated gold sets (SPSO 2, museum 10, Bradwell 10, Duffield 4) | Reproducible offline: `python -m engine.scripts.net_floor`, no API key |
| 2 | **10/10** | Bradwell — a **held-out** tender the system never saw during development | First real unseen test |
| 3 | **0 missed** | Duffield, second held-out tender — zero deal-breakers missed | The claim held twice |
| 4 | **101/101** | **Synthetic** worst-case phrasing bank built to dodge our keywords | Always say "synthetic" — adversarial wordings we authored, not real tenders |
| 5 | **42/42** | Answer citations verified by the groundedness eval, zero fabrications | It also catches a deliberately planted fake citation |
| 6 | **£341bn** | UK public procurement, **2023/24** (HoC Library) — say the year | Latest is £434bn (2024/25); fallback: "over £340 billion a year" |

Money numbers if asked: outsourced first-read starts at **£950** (Glaxtons, published), in-house it's
**1–2 days of a bid writer (~£375/day)**, a full bid averages **~£4,000 over 2–8 weeks**. We *protect*
the £4,000 — we do not "save" it.

### The five sentences (positioning — say these nearly verbatim)

1. **Identity:** "Bidframe turns a tender's first read into a source-linked compliance matrix — deal-breakers first, every line traceable, human in control."
2. **Wedge:** "One missed mandatory clause voids weeks of bid work; we catch and *prove* those first."
3. **vs generative rivals:** "Same buyer, opposite promise — **they write, we verify**."
4. **The accuracy stance:** "The validated claim is deal-breaker catch — proven on gold *and unseen* tenders. Broader recall is promising but small-sample, so we don't headline a number we can't stand behind."
5. **The trust stance:** "Where it has evidence it drafts and cites; where it doesn't, it **asks instead of guessing**. The agent proposes; the bid manager decides."

### Never say (overclaim = instant credibility death)

- ❌ "100% accurate" / "never misses anything" → ✅ "catches every **deal-breaker** on our tested tenders"
- ❌ Any headline recall/precision % for *all* requirements → ✅ sentence 4 above
- ❌ Implying 101/101 is real tenders → ✅ "synthetic worst-case phrasing bank"
- ❌ "We save you £4,000" → ✅ "we protect the £4,000 bid from a missed deal-breaker"
- ❌ "We replace the bid writer" → ✅ "we replace the first read, we protect the writing"
- ❌ Any number not in `demo-claim-ledger.md` → downgrade to safe wording, never guess

### The universal escape hatch (when you genuinely don't know)

> "I don't want to guess that on stage — the honest answer is it's in our claim ledger and I'll show
> you after. What I *can* stand behind right now is: [nearest spine number]."

Judges reward this. They punish improvised statistics.

---

## PART 2 — THE QUESTION BANK, BY ATTACK VECTOR — 30 min
*(Deep-learn your owned block; skim the rest. Each entry: the question, why they're asking, the answer.)*

### Attack A: "You built nothing" — the wrapper attacks *(owners: Pranav, Bobby)*

**A1. "Isn't this just ChatGPT / NotebookLM with a PDF?"**
*Why: the default kill-shot for every LLM demo.*
→ "No — a chat window is **unmeasurable**. We can state a deal-breaker catch number and reproduce it
offline; a chat window will confidently hallucinate a requirement and you'll never know which. For a
document where one miss voids the bid, unmeasurable means unusable. That's a trust argument, not a
feature argument."

**A2. "What did you actually build this week?"**
→ "A full pipeline, not a wrapper: ingest, chunking, extraction, classification, a deterministic
deal-breaker floor, reconcile/dedupe, evidence-cited drafting, open questions, the review UI — **and
the eval harness that measures the claim we just made**. The harness is the part most teams skip."

**A3. "Your safety net is keyword matching. That's 1990s tech — where's the innovation?"**
*Why: they spotted the deterministic floor and think it's a gotcha.*
→ "That's deliberate engineering, not a limitation: the one claim that must never fail doesn't ride on
sampling luck. The LLM does the broad reading; the deterministic floor guarantees the bid-killers. We
stress-tested that floor against a 101-phrasing synthetic bank built to evade it — 101/101. Boring
technology for the safety-critical path is the innovation."

**A4. "So why do you need the LLM at all?"**
→ "The floor catches pass/fail language; the LLM extracts the hundreds of ordinary requirements, the
classifications, and the evidence-cited draft answers — work keywords can't do. Each layer does what
it's structurally good at. That division is the architecture."

**A5. "Which model? What happens when the model provider ships this feature?"**
→ "OpenAI today, provider-agnostic prompts — better models make us *better*. The value isn't the model
call; it's the gold-set eval harness, the deterministic floor, source-proof plumbing, and the captured
decision trail. A model launch ships none of those."

### Attack B: accuracy & eval — the deepest probing *(owner: Bobby)*

**B1. "How do you know your accuracy claims are real?"**
→ "Because we measure them reproducibly. 26/26 hand-labelled deal-breakers across four gold-set
tenders, including 10/10 on Bradwell and zero missed on Duffield — both **held out**, never seen in
development. It's deterministic and re-runnable offline in one command, no API key. Broader recall is
promising but small-sample, so we don't headline it."

**B2. "What's your recall on ordinary requirements? Give me the number."**
*Why: testing whether you'll blurt an indefensible stat under pressure.*
→ "I won't headline it, deliberately — the gold sets are still small-sample. The strong, validated
number is deal-breaker catch, because that's what a bid can't afford to miss. Broader recall is
promising, and growing the labelled set with design partners is the very next milestone."

**B3. "Your precision looks terrible / you over-flag."**
→ "It looks low because the gold sets are sparse — most 'extra' flags are real requirements the gold
set simply didn't label, not junk. And we're recall-first by design: an over-flag costs a human ten
seconds to dismiss **in a UI built to make that visible**; a miss costs the entire bid."

**B4. "Four tenders is nothing. Why does this generalize?"**
→ "Fair — four validated gold sets, and we're honest about that. But note *what held*: two of the four
were fully held-out and the deal-breaker claim survived both, plus a 101-phrasing synthetic bank built
to dodge our net. The pattern generalizes because pass/fail language in UK procurement is highly
convergent. More gold sets is exactly what pilots buy us."

**B5. "You wrote the 101 test phrasings AND the detector. Isn't that circular?"**
→ "The bank was authored adversarially — phrasings designed to *evade* the detector, and early
versions did fail it; that's how the net got stronger. It's synthetic and we say so. The non-circular
evidence is Bradwell and Duffield: real tenders, held out, 10/10 and zero missed."

**B6. "What about a deal-breaker in a table, a scanned page, or a referenced schedule not in the pack?"**
→ "Tables and scans: multiple parsers, sparse-page detection, OCR fallback — and hard cases get
*flagged*, never silently dropped. A document not in the pack is exactly what the open-questions
mechanism is for: the system says 'schedule X is referenced but missing,' and asks. Honest gaps beat
silent ones."

**B7. "If it over-flags, users get alarm fatigue and ignore it."**
→ "That's why gating rows are a separate, loud tier — a handful per tender, each requiring explicit
confirmation — while ordinary low-confidence items queue quietly for review. The hierarchy is the UI's
whole design: deal-breakers can't drown in noise because nothing else lives at their level."

### Attack C: trust, hallucination, human control *(owners: Joel, Bobby)*

**C1. "What happens when the AI is wrong?"**
→ "The human reviews every row — deal-breakers require explicit confirmation, drafts can be edited or
flagged, and every decision is captured with a timestamp. Missing evidence becomes an open question,
not a fabricated answer. The agent proposes; the bid manager decides."

**C2. "How do you prevent hallucinated answers?"**
→ "The answerer is retrieval-gated: it drafts only from evidence snippets in the bidder's own
documents and cites them; with no evidence it produces an open question instead. Our groundedness eval
verified 42 of 42 citations with zero fabrications — and it catches a deliberately planted fake."

**C3. "A missed deal-breaker in production ends a customer's bid. What's your liability story?"**
→ "We're decision support with source proof, not an autonomous filer — a human confirms every gating
row, which is stronger than today's baseline where one tired human under deadline *is* the whole
system, with no net. And we're the only tool in this space publishing a measured catch rate at all."

**C4. "What about confidential bidder documents? Security? GDPR?"**
→ "Demo uses mock evidence — no real client data on stage. The production principle is already in the
architecture: answers cite only the bidder's own uploaded evidence, humans approve what's used, and
pilots come with scoped access and clear retention. Public-sector suppliers expect that bar; it's
table stakes, and it's on the pilot roadmap, not retrofit."

### Attack D: demo integrity *(owners: Pranav, Joel)*

**D1. "Is this demo live?"**
→ "On stage it's the cached output of a real pipeline run, so the measured result is repeatable and
not hostage to venue Wi-Fi or API limits. The live path exists and is tested — freezing Bradwell was a
reliability decision, and reliability is part of the product story."

**D2. "Run it on MY tender, right now."**
→ "Yes — after the pitch, gladly, on the tested backend path. For the stage itself we froze a run so
what you judge is the measured result, not the venue network. Bring the PDF over."

**D3. "So the cached demo means it doesn't actually work end-to-end?"**
→ "It ran end-to-end to *produce* this output — Bradwell went through ingest, extraction,
reconciliation, and drafting for real; 10/10 deal-breakers on a tender it had never seen. The one
command that reproduces the safety claim runs offline and I can run it for you right now."

**D4. "How long does a real tender take? What does it cost per run?"**
→ "Minutes for a real pack, versus one to two days of a bid writer's first read — that's the
days-to-minutes claim. API cost per tender is pennies against a £950 outsourced first-read, so unit
economics aren't the constraint; trust is, which is why we built the eval harness first."

### Attack E: market, business, YC classics *(owners: Joel, Jawad)*

**E1. "Who exactly is the user?"**
→ "Bid managers at UK SMEs selling into the public sector — firms that can't afford a specialist bid
team but face the same pass/fail rules. The beachhead is the SME long tail doing this today with Word,
Excel and a highlighter."

**E2. "Why now?"**
→ "Three curves crossed: the Procurement Act went live February 2025 so the rules are fresh for
everyone; LLMs finally read long documents well; but regulated work can't trust them unaudited.
Bidframe is the control layer between the last two facts."

**E3. "£341bn is government spend, not your market. What's the real TAM?"**
*Why: classic VC trap — top-down number inflation.*
→ "Correct — £341bn is the *stakes*, not our revenue. Our market is bid-support spend: first reads at
£950 outsourced or a day-plus of writer time, across tens of thousands of SME bids a year, expanding
into the full compliance workflow. We use the big number to size the pain, not the pricing."

**E4. "Business model? Pricing?"**
→ "Pilot-first, then per-seat or per-tender-pack. The anchor is what the first read already costs —
£950 outsourced — so per-tender pricing under that is an easy yes, and the team plan grows as the
evidence library and decision history become the asset."

**E5. "How do you get your first ten users?"**
→ "Outreach lists are built and pilot conversations are starting — the wedge offer is: bring us one
live tender, we hand you the deal-breaker checklist before the call. That demo *is* the sales motion."

**E6. "Why won't users just stay in spreadsheets?"**
→ "The spreadsheet is a private memory aid — no source proof, no catch guarantee, and it walks out
the door with the person. Bidframe keeps the exact matrix shape they already trust and adds proof,
drafts, and an audit trail. We're 10× against the highlighter, not against another startup."

**E7. "What's the moat? Anyone can prompt an LLM to extract requirements."**
→ "Three compounding assets: labelled tender gold sets that make claims measurable, the bidder's own
evidence library, and the captured decision trail — every reviewed bid makes the next one faster.
Extraction is copyable; a measured trust record and accumulated decision context are not."

**E8. "Feature or company?"**
→ "The first-read control layer generalizes: contract schedules, compliance packs, supplier
questionnaires — anywhere an expert must verify a long document and their decisions are worth
capturing. Tenders are the wedge because the pain is acute and measurable."

**E9. "What haven't you proven yet?" (the honesty test)**
→ "Broad requirement recall at scale across many tender families — we have a strong deal-breaker
claim and honest early recall, and the fix is more labelled tenders from design partners. That's
exactly what we're asking for today."

### Attack F: competitor kill-shots *(owners: Bobby, Jawad)*

**F1. "Isn't mytender.io the same thing?"** *(most likely direct-comparison question)*
→ "Same buyer, opposite promise: **they write, we verify.** mytender.io drafts prose and assumes the
reading is done; we make the reading auditable — every clause traced, deal-breakers caught with a
measured, reproducible rate. Nobody in the generative camp publishes a catch number. Also, their
pricing is demo-gated; an SME can't even self-serve compare."

**F2. "Why won't AutogenAI just add this?"**
→ "It's off-brand and off-model for them: they sell confident generated prose to large bid teams —
'here's everything we might have missed, flagged honestly' undercuts the product they charge for. And
they'd start our game from zero: no eval harness, no gold sets, no deterministic floor."

**F3. "Loopio / Responsive already own RFP response."**
→ "They're answer libraries — they reuse curated past answers and assume you *have* a library and an
ops team. An SME on its third-ever framework bid has neither. They optimize answering repeat
questions; we extract and verify a novel tender. Different step of the workflow."

**F4. "Stotles or Tussell could bolt this on — they own the funnel."**
*Why: the most credible threat; naming it first earns trust.*
→ "That's the competitor we actually watch — they own discovery. But they'd enter the trust game
late: no eval harness, no grounding infrastructure, and a market-intelligence subscription model that
doesn't reward per-document accuracy work. Meanwhile their funnel position makes them a natural
partner channel too."

**F5. "You have no competitors slide / you have lots of competitors — pick one."**
→ "We have competitors *because* the market is real — two funded camps. But nobody owns our wedge:
the auditable first read. And honestly, the competitor that beats us if anyone does is Word, Excel and
a highlighter — that's who the demo is designed to be 10× against."

### Attack G: hostile drills — 20 seconds, no caveat spiral *(everyone)*

**G1. "This is a services business in disguise."**
→ "First pilots are high-touch because trust is the product. The repeated workflow is pure software:
ingest, matrix, proof, decisions, drafts. High-touch is the go-to-market, not the margin."

**G2. "A consultant does this better."**
→ "Slower and at £950 a read. We make that consultant — or the SME who can't afford one —
deal-breaker-complete in minutes with a decision trail. Leverage for the expert, not a replacement."

**G3. "Buyers change formats; your extraction breaks."**
→ "We anchor on source evidence and the review workflow, not a brittle template — and the safety
floor targets pass/fail *language*, which is convergent across UK procurement. Formats drift;
'disqualified if' doesn't."

**G4. "Why sell to bidders and not government buyers?"**
→ "Bidders feel the pain this week and adopt without procurement cycles. Buyers are a later
opportunity — the same matrix is a compliance-checking tool from the other side of the table."

**G5. "What do you do with the prize / with YC?"**
→ "Turn pilots into product: secure evidence libraries, a bigger labelled benchmark, hardened live
ingestion — and prove the ROI number on real bid teams instead of quoting industry estimates."

**G6. "You're four people who met this week. Why you?"**
→ "Because we built the unsexy parts first — the eval harness, the gold sets, the deterministic floor
— which is the discipline this domain actually needs. The demo you saw survives hostile questions
*because* of that choice; that's the team trait that matters here."

### Attack H: technical deep-dive *(owners: Pranav pipeline, Bobby engine)*

**H1. "Walk me through the pipeline."**
→ "PDF ingest with multiple parsers and OCR fallback → structure-aware chunking → LLM extraction to
structured JSON → classification → deterministic gating scan → conservative reconcile/dedupe →
confidence routing → evidence-gated answer drafting → REST API into the review UI. Each stage is
independently testable — that's why we can eval it."

**H2. "Where exactly does determinism enter, and why?"**
→ "At the deal-breaker floor: a no-key, offline scan for pass/fail language that runs regardless of
what the LLM does. The claim that must never fail doesn't depend on sampling. One command reproduces
it: `python -m engine.scripts.net_floor` — 26/26."

**H3. "How does dedupe avoid merging away a requirement?"**
→ "It's deliberately conservative because a wrong merge is a silent miss: gating rows never
fuzzy-merge, numeric conflicts block merges, and weak-signal fallbacks are guarded. We accept showing
a duplicate over hiding a bid-killer."

**H4. "How is source traceability actually tested?"**
→ "Every requirement carries page, clause, and verbatim excerpt — with bounding rectangles where the
PDF gives them — and the UI jumps to the exact line. The groundedness eval verifies citations point at
real text: 42/42, zero fabrications, and it flags a planted fake."

**H5. "Why do some eval commands print worse numbers than your pitch?"**
→ "Some score the LLM extraction *alone*; the shipped product includes the deterministic net on top.
The stage claim is the net-applied, reproducible number in the claim ledger — and the gap between
those two runs is exactly why the floor exists."

---

## PART 3 — DRILL & CLOSE — 15 min

### Rapid-fire (one breath each — go around the room twice)

- **Product:** "A tender's first read as a source-linked compliance matrix — deal-breakers first, human in control."
- **Proof:** "26 of 26 deal-breakers across four gold tenders, including two fully held-out — reproducible offline."
- **Why now:** "New procurement rules, capable LLMs, zero audited trust between them — we're the control layer."
- **Wedge:** "Missed mandatory clauses kill bids; we catch and prove those first."
- **vs rivals:** "They write, we verify."
- **Moat:** "Gold sets, evidence libraries, and decision history compound with every reviewed bid."
- **Honesty:** "We headline the measured deal-breaker catch, not a broad accuracy % we can't stand behind yet."
- **Ask:** "Design partners with real tenders — the first-read checklist before your next bid call."

### The three rules under fire

1. **Answer in the first five words.** ("No." / "Yes — after the pitch." / "26 out of 26.")
2. **One number per answer.** Two numbers is a lecture; zero is a dodge.
3. **Last sentence is always ours.** End on product or ask — never on the caveat.

### Pre-stage checklist

- [ ] Everyone re-reads the **six numbers** and **five sentences** (Part 1) — 5 min before walking on
- [ ] `demo-claim-ledger.md` open on a phone backstage
- [ ] One hostile round: 20-second answers, owner answers first, anyone may rescue after
- [ ] Agree the rescue signal (a nod = "I'll take it") so two people never answer at once
