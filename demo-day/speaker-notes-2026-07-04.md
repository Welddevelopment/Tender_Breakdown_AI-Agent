# Bidframe Speaker Notes - Demo Day, 4 July 2026

Use this as the live presenter sheet beside `/pitch` and `/showcase`. Target is 5 minutes. The product beat matters more than another proof sentence.

## Tabs To Open

1. `/pitch` - stage deck.
2. `/showcase` - live product walkthrough, frozen Bradwell tender.
3. `/demo` - backup guided version if `/showcase` misbehaves.
4. `demo-claim-ledger.md` - Q&A numbers and safe wording.
5. `pitch-before-after.md` - backup wording for the before/after beat.

## One-Sentence Thesis

Bidframe does the first read of a public-sector tender, puts bid-killing deal-breakers first, traces every line to source, drafts only from evidence, and keeps the bid manager in control.

## Timing

| Time | Speaker | Beat | Say |
|---|---|---|---|
| 0:00-0:35 | Jawad | Problem | "A public-sector tender is 100-plus pages of legal text. Hidden inside are pass/fail rules that disqualify a bid outright. Miss one after days of work, and the whole bid is binned." |
| 0:35-1:05 | Bobby | Wedge | "The painful part is the first read, before you write a word. Bidframe turns that first read into a checkable matrix, with the expert still at the wheel." |
| 1:05-1:35 | Pranav | Before/after | "This is one real clause with five ways to lose. Bidframe finds them in the source and lifts them into the matrix." |
| 1:35-3:30 | Joel | Product | Drive `/showcase`: 12 deal-breakers, insurance row, source proof, evidence-backed answer, open question, control beat. |
| 3:30-4:20 | Bobby | Proof | "The deal-breaker catch is engineered, not hoped for: deterministic net, model pass, tests, held-out tenders. Broader recall is still small-sample, so we do not overclaim it." |
| 4:20-5:00 | Joel | Close | "The goal is not to replace the bid manager. It is to make them 10 times faster while their judgement stays in the work. We are looking for pilots." |

## Product Walkthrough - Exact Order

1. Start at `/showcase`.
2. Point at the ControlPanel: read pages, found requirements, flagged deal-breakers, drafted answers, left questions.
3. Say: "Zero approved. Nothing is decided or submitted."
4. Click the insurance deal-breaker.
5. Show source trace: page, clause, excerpt, PDF.
6. Show the evidence-backed answer and citation.
7. Go to approval: type `CONFIRM` when prompted.
8. Edit one answer.
9. Flag one requirement.
10. Open the references/open-question row.
11. Say: "Where it could not back an answer, it did not invent one. It asked me."
12. Point back to the tally.

## Control Beat Script

"Before we touch anything, notice what the tool has and has not done. It read the tender, flagged the deal-breakers, drafted answers where it had evidence, and left the rest for me. Zero approved. Nothing here is decided or submitted. I am at the wheel."

"When I approve a deal-breaker, it stops me. I have to explicitly confirm before a bid-killer is signed off. The agent never rubber-stamps one for me."

"Every draft is mine to correct. The AI proposes; I decide the wording."

"Where it cannot back an answer, it does not guess. It asks. That is the difference between a tool you can trust and one you cannot."

## Safe Numbers

Say:

- "12 out of 12 deal-breakers across SPSO and museum, caught deterministically without the model."
- "Bradwell held out: 10 out of 10 deal-breakers."
- "Duffield held out: zero deal-breakers missed."
- "101 out of 101 on a synthetic adversarial phrasing bank."
- "We do not headline an all-requirement accuracy percentage yet."

Do not say:

- "100 percent accurate."
- "Never misses anything."
- "Every requirement across every tender."
- "The 101-case bank is real tenders."

## Q&A Answers

**How do you know it works?**
The strongest measured claim is deal-breaker catch. We test it against hand-labelled gold tenders and a deterministic safety net. Ordinary requirement recall is promising, but we are not pretending a small benchmark is a universal number.

**Is this just a prompt wrapper?**
No. The product has PDF ingest, chunking, extraction, reconcile/dedupe, a deterministic deal-breaker net, source rectangles, evidence-grounded answer drafting, persistence, tests, and an eval harness.

**What happens if the AI is wrong?**
The human reviews every row. Deal-breakers require explicit confirmation. Low-confidence rows are marked. Missing evidence becomes an open question rather than a fabricated answer.

**Can it handle messy PDFs?**
Yes, within bounded cost: multiple PDF parsers, table recovery, sparse-page detection, OCR fallback via vision, chunk retries, and graceful failure. Fully scanned long tenders past the cap are flagged, not silently dropped.

**Why public-sector tenders first?**
Because the deal-breaker taxonomy is finite enough to make reliability measurable, and small firms are underserved by existing bid tooling.

## If Time Runs Short

Cut first: detailed proof slide.

Keep at all costs:

1. Before/after.
2. Source trace.
3. Confirm-before-approve.
4. Open question instead of guessing.

## Fallback Lines

If `/showcase` fails:
"This is the same pre-baked tender run, shown in the guided demo. We froze it deliberately so the stage version does not depend on Wi-Fi, a backend, or an API key."

If asked to upload a judge tender live:
"We can do that after the pitch on a non-stage machine. For the judged demo, we are showing the frozen real run so the result is inspectable and repeatable."

