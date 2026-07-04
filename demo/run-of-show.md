# Run of Show — Bidframe, Demo Day

> 🚨 **Demo Day is SAT 4 JUL (TODAY) per every official source** — Luma, DoraHacks, aiagentslab.uk —
> with **Bidframe pitching LAST, 3:55–4:00pm** (running-order sheet). Internal notes said Sun 5 Jul.
> **Confirm in Discord now.** If today: prep compresses to this morning (see `final-checklist.md`).

> Builds on Pranav's [`demo-day/run-sheet.md`](../demo-day/run-sheet.md) (now Bradwell-reconciled) and
> the locked [`demo-narrative.md`](../demo-narrative.md) spine. Numbers come ONLY from
> [`demo-claim-ledger.md`](../demo-claim-ledger.md) — if a number isn't in the ledger, it isn't said.
> Stage surfaces (verified in code 2026-07-04): **`/pitch`** = the deck (Bradwell prebake mounted),
> **`/demo`** = cinematic scrolly + frozen Bradwell worked example. `/demo`'s matrix is read-only
> (no row clicks); its one interactive proof is the **"See a deal-breaker in the document"** button —
> which only appears once the Bradwell PDF is committed (see Blockers, bottom).

**Driver for everything: Jawad.** One driver, no laptop handoffs. Everyone else points and talks.
**Stage line-up, left to right: Joel — P — Bobby — Jawad** (Jawad nearest the keyboard).
**Timekeeper: Joel** (phone on silent, visible only to team).

---

## The 90-second version (no deck — product only)

Use when the slot is tight or judges walk the room. Screen: `/demo`, pre-scrolled past the title card.

| Time | Who | Beat | Screen / click (Jawad) | Line (compressed from cue cards) |
|---|---|---|---|---|
| 0:00 | **Joel** | The before | none — eyes on Joel | "A bid manager spends ~3 weeks reading a tender like this by hand. Miss one mandatory requirement and the whole bid is thrown out. Bidframe turns that into a verified, source-linked checklist in minutes." |
| 0:15 | **P** | The read | scroll to the Bradwell worked example — matrix + row count | "A real public-sector tender — Bradwell grounds maintenance, 34 pages, through our real pipeline: ingest, chunk, extract, classify, reconcile. Every requirement pulled out, scored — twelve deal-breakers, on top." |
| 0:30 | **Bobby** | THE CATCH 🦸 | point at the oxblood `GatingHero` wall | "Pass/fail gates: £5m insurance, 'automatically disqualified', a pricing landmine on page 31. This tender was our **held-out test** — the pipeline had never seen it and caught **all ten** labelled deal-breakers; **12/12 deterministically** on our gold tenders." |
| 0:50 | **Jawad** | Click-to-source | click **"See a deal-breaker in the document"** → PDF overlay, exact line highlighted *(fallback if PDF not committed: point at the source clause + page on the hero card and say the same line)* | "One click — the exact sentence, on the exact page. Every line is checkable. We're not asking you to trust a black box." |
| 1:05 | **Bobby** | Honesty flag | point at a `needs_review` bead (2 of the 12 gates are deliberately lower-confidence) | "Where it's less sure — even among deal-breakers — it says so instead of guessing. And when it drafts answers from your own documents, it cites the evidence or asks: 42/42 citations verified on our eval run, zero bluffs." |
| 1:20 | **Joel** | Close + bridge | matrix at rest | "Three weeks down to minutes, the killer requirements caught, every line verifiable — and the human approved every step." → **thesis-bridge, near-verbatim** (cue card) → "We capture the bid manager's decisions so they compound across every future bid." |

**Hard rule:** never cut the catch (0:30) or click-to-source (0:50). Cut the ask, then the honesty flag's second sentence, first.

---

## The 3-minute version (the locked deck — `/pitch`)

This is the storyboard's locked 7-slide structure, owners per `storyboard.md` (unchanged — it still works):

| Time | Slide | Bucket | Owner | Watch-out |
|---|---|---|---|---|
| 0:00–0:20 | 1 — "One missed deal-breaker kills the bid" | Problem | **Joel** | Land the disqualification stake before any product talk. |
| 0:20–0:42 | 2 — The bid manager's first read | Use Case | **Bobby** | The 3-weeks-by-hand story; no numbers yet. |
| 0:42–1:02 | 3 — A marked trail through the tender | Solution | **Joel** *(storyboard says Joel; the slide's speaker notes say Pranav — agree once at rehearsal)* | Two-beat slide: read the clause into the pause, THEN keypress stamps "caught". The stop-sign card is the real Bradwell **insurance gate**. |
| 1:02–1:32 | 4 — Deal-breakers first, every line checkable | Product | **Jawad** | Product proof surface; say "the human approves every step" here. |
| 1:32–2:06 | 5 — PDF → matrix → proof → answer | Demo Flow | **Jawad / Bobby** | Bobby lands the eval numbers exactly as in the ledger. |
| 2:06–2:36 | 6 — A trust layer, not a PDF chatbot | Tech | **P** | Pipeline + proof ledger; the "deterministic, without the model" line is P+Bobby's strongest 10 seconds. |
| 2:36–3:00 | 7 — Help us scale the first-read layer | Ask | **Joel** | QR → bidframe.org; "pilots and design partners", never "customers". |

Deck mechanics (verified/shipped): refresh + deep-link survival, Home/End recovery, cursor auto-hide,
quiet elapsed timer. If the deck dies mid-flow: **F5 restores the slide**; if it stays dead, switch to
the 90-second `/demo` version above — Joel bridges with "let me just show you the product."

---

## The 5-minute version (deck + live product interlude)

Run the 3-minute deck, but at **slide 5 (Demo Flow)** Jawad flips to the `/demo` tab for ~90 seconds:
worked example → Bobby's catch beat → the PDF proof click → honesty flag → back to slide 6 (Tech).
Transitions: "Rather than tell you this — thirty seconds of the real thing." / returning: "That's the
product; here's why you can trust the numbers." Everything else identical. If time runs long, the
interlude is the first thing to compress (drop back to slide 5's screenshots) — never the ask.

---

## Who clicks what (single source of truth)

- **Jawad clicks everything.** Tabs pre-opened in order: (1) `/pitch`, (2) `/demo` scrolled to the
  worked example, (3) `/review` ONLY if a live approve-click is rehearsed (see below).
- The ONLY interactive moments: deck keypresses, the `/demo` scroll, the **"See a deal-breaker in the
  document"** button, and (optional, rehearsed) one approve on `/review`.
- **Do not** click matrix rows on `/demo` (read-only by design), and **do not** open `/answers` on
  stage (auth-gated, shows the mock/live tender, NOT Bradwell).
- The "human in control" criterion is carried by SAYING "the human approves every step" (Jawad, slide 4;
  Joel, close) + the deck's approval-stamp visual. A live approve click on `/review` is a bonus only if
  rehearsed — its tender is the mock/live one, so don't present it as Bradwell.

## Fallback ladder (updated from `demo-day/backup-plan.md`)

1. **Default:** hosted `/pitch` + `/demo` — the Bradwell prebake is **baked into the static build**: no
   backend, no key, no Render, immune to everything except the venue projector.
2. **Wifi dies:** `cd frontend && npm run dev` locally — same prebake, same routes, zero network.
   (Set up + tested on the demo laptop the night before; it's in the checklist.)
3. **Laptop dies:** second-most-rehearsed laptop (Jawad's build). 4. **Everything dies:** recorded
   video, then screenshots + Joel narrating. The honest recovery line for anything visible: "This is
   the thing we built — when we're not sure, we say so. Here's the same beat from the cached run."
   **Never demo the heuristic extractor as if it were the model.**
5. **Judge offers their own tender:** only on a tested live key. Otherwise: "On stage we run the fixed
   tender so you see the measured run — and that tender was itself a held-out test the pipeline had
   never seen. Happy to run yours after, live."

## Blockers / must-do-before-stage (see `demo/final-checklist.md`)

1. ⚠️ **Commit the Bradwell PDF** (`cp data/tenders/bradwell-grounds-itt.pdf frontend/public/demo/` +
   push) or the `/demo` proof button doesn't exist — Joel's call (repo rule: never commit tender PDFs;
   SPSO precedent says it's fine for the public demo copy). Without it, use the narrate-the-source
   fallback in the 90s table.
2. ⚠️ **Scrolly still says SPSO** (`sample.ts` `DEMO_FACTS`: "SPSO Cleaning Services ITT", 13pp/183/9)
   directly above the Bradwell worked example — Jawad to re-flavor or genericize (G-040).
3. Agree slide-3 owner (Joel vs Pranav) once, at rehearsal.
