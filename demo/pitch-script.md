# Pitch Script — Bidframe (spoken, judge-facing)

> The 3-minute deck script, word-for-word, mapped to the locked 7-slide structure (`storyboard.md`) and
> the locked spine (`demo-narrative.md`). Numbers per `demo-claim-ledger.md` §B only. Wording may flex
> on stage; the beats, the numbers, and the opener/closer should not. Speaker per slide as agreed at
> rehearsal (defaults below).

---

## EXACT OPENER (Joel, slide 1 — deliver before touching the keyboard)

> **"Last year the UK public sector bought over three hundred billion pounds of goods and services —
> and the small firms bidding for that work lose it in the stupidest possible way: one mandatory
> requirement, buried on page 31 of a tender, missed. The whole bid — three weeks of expert work —
> thrown out, unread. Bidframe exists so that never happens again."**

*(Beat. Then:)* "Let me show you what a tender actually looks like to the person who has to answer it."

## Slide 2 — Use Case (Bobby)

> "This is the job: a thirty, sixty, sometimes hundred-and-fifty-page document, and a bid manager
> reading it line by line, building a checklist by hand, hoping they didn't miss the one line that
> voids everything. Three weeks of senior time per bid — and the scary part isn't the time. It's that
> 'hope' is the quality control."

## Slide 3 — Solution (Joel *(or Pranav — agree at rehearsal)*)

*(The slide lands with the clause alone. Read it aloud into the pause:)*
> "'The tenderer must hold Public Liability insurance of at least five million pounds… tenderers who
> cannot guarantee the mandatory requirements will be automatically disqualified.'"

*(Keypress — the green "caught" stamp. Then:)*
> "Bidframe reads the tender first. Every requirement extracted, classified, and linked to its exact
> clause and page — deal-breakers surfaced first, uncertainty flagged honestly. A marked trail through
> the document, not a summary you have to trust."

## Slide 4 — Product (Jawad)

> "This is the real product on a real tender. Deal-breakers sit at the top in oxblood — you cannot
> scroll past them. Click any line and it shows you the exact sentence on the exact page it came from.
> Where it drafts an answer, it drafts from your own capability documents, with the citation attached —
> and where it can't, it asks you a question instead of guessing. And nothing ships without a human:
> approve, edit, or flag, on every single requirement. **The human approves every step.**"

## Slide 5 — Demo Flow (Jawad narrates flow, Bobby lands numbers)

**Jawad:** "PDF in → matrix → proof → answer. On stage today it runs on the Bradwell grounds-maintenance
tender — thirty-four pages, fifty requirements, twelve deal-breakers — cached output of a real pipeline
run, because we don't bet your attention on venue wifi."

**Bobby:** "And Bradwell matters for one reason: it was our **held-out test**. The pipeline had never
seen it — and it caught **all ten** hand-labelled deal-breakers. On our gold tenders it's **twelve for
twelve, deterministically — no model in the loop**, so it's re-runnable, not luck. We threw a synthetic
bank of a hundred and one worst-case phrasings at it: a hundred and one caught. And the drafted
answers never bluff — forty-two out of forty-two citations verified, zero fabrications."

## Slide 6 — Tech (P)

> "Under the hood this is a pipeline, not a prompt: ingest, chunk, extract, classify, then a
> conservative reconcile that would rather show you two similar rows than silently merge away a
> requirement — because a wrong merge is a silent miss, and a silent miss is the one failure this
> product exists to kill. Around it we built the part most hackathon demos skip: a deterministic eval
> harness, four hand-labelled gold tenders, an adversarial test suite that tries to break our own
> claims. We're honest about what's still small-sample — broader recall doesn't get a headline number
> until it deserves one. **It's a trust layer, not a PDF chatbot.**"

## Slide 7 — Ask + EXACT CLOSER (Joel)

> "Where this goes: every approve, every edit, every flag, every answered question is a bid manager's
> judgment — captured, structured, reusable. Conduct's thesis is that legacy moves when you capture the
> **context of an expert's decisions**. That's literally what this is. The matrix is the surface; the
> decision record is the moat — and it compounds with every bid."

*(The ask:)* "We're looking for pilot SMEs and design partners — the outreach list is built and the
conversations are starting. bidframe.org — the demo's live right there."

> **CLOSER — final two sentences, verbatim:**
> **"Three weeks of expert reading, a disqualifier risk, and a blank page — down to minutes, with the
> killer requirement caught, every line checkable against the document, and a human approving every
> step. We didn't build an AI that writes bids; we built the layer that makes it safe to use one."**

---

## The 90-second solo version (Joel, if the slot collapses)

Opener (above, compressed to two sentences) → "watch it read one" → `/demo` worked example: point at
the deal-breaker wall ("twelve on this tender — held-out, ten out of ten caught") → the proof click
("the exact sentence, on the exact page") → the flag ("where it's unsure, it says so — and its answers
cite your own documents or ask; zero bluffs, forty-two of forty-two verified") → closer (verbatim,
above).

## Delivery notes

- The two moments that must land: **the catch** (slide 3 stamp / the oxblood wall) and **the proof
  click** (exact line in the real PDF). Pause after each — let the room read.
- Say "synthetic" with the 101/101. Say "pilots", never "customers". Never a headline recall %.
- The thesis-bridge (slide 7, first paragraph) is near-verbatim from `demo-narrative.md` — don't
  paraphrase it away; it mirrors Conduct's own language back at the judges.
- If a number gets challenged mid-flow: "every claim on this stage is in our claim ledger with its
  source — happy to walk any of them after." Then continue.
