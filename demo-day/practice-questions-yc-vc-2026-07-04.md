# Practice Questions - Audience, YC, and VC-style Judges

> Demo Day: 4 July 2026. Use this for warm-up drills before the Bidframe pitch.
> Current stage split: Jawad slides 1, 2, and close; Bobby slides 3 and 4; Joe drives `/showcase`;
> Pranav narrates the live demo over Joe's clicks.
>
> Agent note for today only: pull with rebase before editing, and during active demo work pull about
> every 5 minutes so the script stays aligned with Bobby/J/Jawad changes.

## How To Use This

- Do one fast round: each person answers only their owned questions.
- Do one hostile round: answer in 20 seconds, no caveats spiral.
- Keep `demo-claim-ledger.md` open. If a number is not in the ledger, do not invent it.
- Prefer this shape: direct answer, proof, honest boundary, return to the product.

## Five Questions Most Likely From Any Judge

1. **What did you actually build this week?**
   - Owner: Pranav, then Bobby.
   - Good answer: "A full pipeline, not a wrapper: PDF ingest, chunking, extraction, classification,
     reconcile/dedupe, source traceability, evidence-backed drafting, open questions, and the review UI.
     The key difference is that we also built the eval harness to measure the claim we make."

2. **Is this just ChatGPT or NotebookLM on a PDF?**
   - Owner: Joel or Bobby.
   - Good answer: "No. A chat tool summarizes. Bidframe turns the tender into a source-linked compliance
     matrix, catches deal-breakers with a deterministic floor, cites evidence for answers, asks when it
     cannot prove something, and captures the human decision trail."

3. **How do you know your accuracy claims are real?**
   - Owner: Bobby.
   - Good answer: "The strong measured claim is deal-breaker catch. We have 12/12 deterministically
     across SPSO and museum, 26/26 hand-labelled disqualifiers across four validated gold sets, Bradwell
     held out at 10/10, Duffield with zero missed, and 101/101 on a synthetic worst-case phrasing bank.
     Broader requirement recall is promising, but we do not headline a percentage yet."

4. **Is the demo live?**
   - Owner: Pranav.
   - Good answer: "On stage, it is cached output of a real pipeline run so the measured result is
     repeatable and not dependent on venue Wi-Fi or API limits. The live path exists; for the pitch, we
     freeze Bradwell because reliability is part of the product story."

5. **What happens if the AI is wrong?**
   - Owner: Joel.
   - Good answer: "The human reviews every row. Deal-breakers require explicit confirmation. A draft can
     be edited or flagged. Missing evidence becomes an open question, not a fabricated answer. The agent
     proposes; the bid manager decides."

## YC-style Questions

1. **Who is the user, exactly?**
   - Owner: Joel.
   - Answer: "Bid managers and SME teams bidding into UK public-sector tenders. The beachhead is small
     firms that cannot afford specialist bid teams but still face the same pass/fail tender rules."

2. **What is the painful urgent problem?**
   - Owner: Jawad.
   - Answer: "The first read of a tender is slow and high-stakes. Before writing starts, someone must
     find mandatory rules, pass/fail clauses, evidence gaps, and source references. Missing one can bin
     weeks of bid work."

3. **Why now?**
   - Owner: Joel.
   - Answer: "Procurement rules changed recently, the documents are still long and manual, and LLMs are
     now good enough to read and draft but not safe enough to trust unaudited. Bidframe is the control
     layer between those two facts."

4. **How do you get your first ten users?**
   - Owner: Joel.
   - Answer: "We already have targeted outreach lists and pilot conversations starting. The wedge is
     simple: bring us one public-sector tender and we will have the deal-breaker checklist ready before
     the call."

5. **What is the narrow wedge?**
   - Owner: Bobby.
   - Answer: "Deal-breaker detection for UK public-sector ITTs. It is a named failure mode, it is
     measurable, and it creates the trust to expand into the full compliance and response workflow."

6. **Why will users switch from spreadsheets?**
   - Owner: Jawad.
   - Answer: "Spreadsheets are a private memory aid. Bidframe gives the same matrix shape, but with
     source proof, evidence-backed drafts, open questions, and an audit trail that persists beyond one
     person's spreadsheet."

7. **What is your unfair advantage?**
   - Owner: Joel.
   - Answer: "The domain-specific eval loop and decision record. Every labelled tender improves the
     benchmark, and every reviewed bid creates reusable context. That is harder to copy honestly than a
     generic PDF prompt."

8. **What would make this a big company, not a feature?**
   - Owner: Joel.
   - Answer: "The first-read layer can expand from tenders into controlled review workflows across
     enterprise documents: compliance packs, contract schedules, supplier questionnaires. The common
     asset is expert decision context captured while the work happens."

## VC-style Questions

1. **How big is the market?**
   - Owner: Joel.
   - Answer: "UK public procurement alone is hundreds of billions a year. We start with SME bidders
     because the pain is acute, but the workflow also exists inside larger bid, commercial, and
     compliance teams."

2. **What budget do you replace or unlock?**
   - Owner: Joel.
   - Answer: "The first-read layer: outsourced tender review starts around GBP 950, in-house review is
     one to two days of bid-writer time, and a full bid can cost around GBP 4,000 over weeks. We do not
     claim to replace the full bid writer; we protect the work from a missed deal-breaker."

3. **What is the business model?**
   - Owner: Joel.
   - Answer: "Pilot-first. The natural pricing is per seat or per tender pack for bid teams, with a
     higher team plan once evidence libraries and reusable decision history become central."

4. **Why would incumbents not copy this?**
   - Owner: Bobby.
   - Answer: "They can add AI summaries, but the wedge is measured trust: source-linked extraction,
     deterministic deal-breaker floor, groundedness checks, and a growing labelled tender benchmark.
     That eval discipline is the product, not decoration."

5. **What are your competitors?**
   - Owner: Bobby or Jawad.
   - Answer: "AutogenAI and mytender.io are bid-writing tools; Loopio/Responsive are response-library
     systems; Constructionline X-Ray is supplier-risk oriented; NotebookLM is generic document chat.
     Bidframe is the controlled first-read layer: deal-breakers first, every line to source, human
     decisions captured."

6. **What is defensible over time?**
   - Owner: Joel.
   - Answer: "Three things compound: labelled tender gold sets, bidder-specific evidence and decision
     history, and the domain workflow around pass/fail risk. Generic models do not own that."

7. **What is the biggest risk?**
   - Owner: Joel.
   - Answer: "Distribution and trust. We solve trust by showing source proof, human confirmation, and
     measured deal-breaker catch. Distribution starts with pilots where we run one tender with the team
     and prove the first-read value immediately."

8. **What is the next milestone after today?**
   - Owner: Joel.
   - Answer: "Two or three design-partner pilots using their real tenders, plus a larger labelled gold
     set. The goal is to turn the demo into a repeatable first-read workflow with measurable outcomes."

## Audience Questions

1. **Can I upload my own tender?**
   - Owner: Pranav.
   - Answer: "Yes after the pitch. On stage we use a frozen Bradwell run so the measured result is
     repeatable. For a live upload we would use the tested backend path and avoid venue-Wi-Fi risk."

2. **Does it write the whole bid for me?**
   - Owner: Joel.
   - Answer: "No, and that is deliberate. It drafts answers only where it has evidence, and asks where
     evidence is missing. The bid manager reviews and approves every line."

3. **Will it work on scanned PDFs?**
   - Owner: Pranav.
   - Answer: "Within bounded cost, yes: multiple parsers, sparse-page detection, OCR fallback, retries,
     and graceful failure. We flag hard cases instead of silently dropping pages."

4. **Can it handle a 150-page tender?**
   - Owner: Pranav.
   - Answer: "The architecture chunks long packs and degrades gracefully. For stage we avoid live
     extraction because large tenders can take minutes and hit API limits, but the pipeline is built for
     long real tenders."

5. **Can it integrate with our current bid process?**
   - Owner: Joel.
   - Answer: "Yes. The compliance matrix is already the familiar shape bid teams use. Bidframe adds
     source proof, evidence citations, decision status, and exportable review history."

6. **What happens to confidential bidder evidence?**
   - Owner: Joel or Pranav.
   - Answer: "For the demo we use mock evidence. In a real product, capability documents need secure
     storage, scoped access, and clear retention controls. The principle is that answers cite only the
     bidder's own evidence and the human approves what is used."

## Technical Judge Questions

1. **How does the pipeline work?**
   - Owner: Pranav.
   - Answer: "PDF ingest, text/table extraction, chunking, requirement extraction, classification,
     deterministic gating scan, reconcile/dedupe, confidence routing, answer drafting from evidence,
     then API persistence into the review UI."

2. **Where does determinism enter?**
   - Owner: Bobby.
   - Answer: "The deal-breaker floor is deterministic and no-key. It catches the pass/fail language we
     cannot afford to miss. The LLM helps extract broader requirements, but the hero safety claim does
     not ride on sampling luck."

3. **How do you prevent hallucinated answers?**
   - Owner: Bobby.
   - Answer: "The answerer is retrieval-gated: draft only from evidence snippets, cite them, otherwise
     produce an open question. The groundedness eval verified 42 of 42 citations and zero fabrications,
     and it catches a planted fake citation."

4. **How does dedupe avoid hiding requirements?**
   - Owner: Bobby.
   - Answer: "It is conservative. A wrong merge is a silent miss, so gating rows do not fuzzy-merge,
     numeric conflicts block merges, and same-page/null-clause fallback is guarded. Over-showing is safer
     than hiding a bid-killer."

5. **Why does eval_all sometimes look worse than your pitch claim?**
   - Owner: Bobby.
   - Answer: "Some commands score extraction only, while the shipped product includes the deterministic
     safety net. We are explicit about that. The claim we make on stage is the deal-breaker catch from
     the net-applied, reproducible checks in the claim ledger."

6. **How do you test source traceability?**
   - Owner: Pranav.
   - Answer: "Requirements carry page, clause, excerpt, and source rectangles where available. The UI
     can jump back to the exact evidence line; when exact rectangles are not available, it falls back to
     source text and page reference."

## Hostile / Investor Pressure Drills

1. **"This is a services business disguised as software."**
   - Best response: "The first pilots may be high-touch because trust is the product. But the repeated
     workflow is software: ingest, matrix, source proof, decision capture, evidence-backed answers, and
     reusable context."

2. **"Your precision is low. Why should anyone trust this?"**
   - Best response: "We do not headline overall precision because the gold sets are sparse. The product
     is recall-first for bid-killers, and that is the measured claim: every tested deal-breaker caught.
     The UI makes over-flags visible for human review."

3. **"A procurement consultant could just do this."**
   - Best response: "Yes, slowly and expensively. Bidframe gives them the first-read matrix in minutes,
     with source proof and a decision trail. It is leverage for the expert, not a replacement for them."

4. **"What if the buyer changes tender format?"**
   - Best response: "That is why we anchor on source evidence and the review workflow, not one brittle
     template. The extraction layer can improve over formats; the core product is the controlled review
     matrix and measured deal-breaker safety."

5. **"Why not sell to government buyers instead?"**
   - Best response: "Buyers are possible later, but bidders feel the immediate pain and can adopt without
     changing procurement systems. The bidder wedge gets us data, feedback, and urgency."

6. **"What is the one thing you have not proven yet?"**
   - Best response: "Scale of broad requirement recall across many tender families. We have a strong
     deal-breaker claim and honest early broader recall. The next milestone is more labelled tenders
     from design partners."

7. **"Could a model provider wipe you out?"**
   - Best response: "Better models help us. The value is not the raw model call; it is the workflow,
     source proof, eval harness, domain-specific gating floor, and accumulated decision context."

8. **"What would you do with funding or YC?"**
   - Best response: "Turn pilots into a repeatable product: ship secure evidence libraries, expand the
     gold benchmark, harden live ingestion at scale, and prove ROI on real bid teams."

## Rapid-Fire Rehearsal

- **One sentence product:** "Bidframe turns a tender's first read into a source-linked compliance matrix
  with deal-breakers first and the human in control."
- **One sentence why now:** "LLMs can read the pack, but regulated work needs proof, control, and an eval
  harness before teams can trust them."
- **One sentence wedge:** "Missed mandatory requirements kill bids; we catch and prove those first."
- **One sentence traction:** "The CRM and outreach list are built; we are asking for pilots and design
  partners with real tenders."
- **One sentence moat:** "The decision record and labelled tender eval set compound with every reviewed bid."
- **One sentence limitation:** "We do not headline broad accuracy yet; we headline the measured deal-breaker catch."
