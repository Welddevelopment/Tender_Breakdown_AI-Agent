# Demo Narrative & Conduct Thesis-Bridge

> Owned by J. The story judges hear. Two jobs: (1) make a non-engineer *get it* in 90 seconds,
> (2) bridge explicitly to Conduct's thesis so the "Make Legacy Move" judges lean in.
> ✅ **LOCKED (Day 3, 2026-06-30).** Build is demo-solid; numbers are the locked honest set. Rehearse to this; only edit the *wording*, not the beats or the numbers.

---

## The one-liner

**Bidframe turns a 150-page tender into a verified, source-linked compliance checklist in minutes —
catches the requirement that would have disqualified the bid, flags what it's unsure about, and drafts
your response from your own evidence. The human approves every call.**

## The 90-second demo script (the spine)

> Beat = what we click. (Narration) = what J says. Keep it to ~90s; the catch + the click-to-source
> are the two moments that must land.

1. **The before.** *(One sentence, no screen.)* "A bid manager spends about three weeks reading a tender
   like this by hand. Miss one mandatory requirement and the whole bid is thrown out — weeks of work, gone."
2. **Upload.** Drag the tender PDF in. (Let the judge pick it if we're confident.) "We drop in a real
   public-sector tender. 13 pages."
3. **The matrix populates.** "In under a minute, every requirement — pulled out, classified, scored."
4. **🦸 The catch (hero moment).** Point at the red deal-breaker banner. "This one's a pass/fail gate.
   Miss it and you're disqualified. It's the first thing you see — not buried on page 61."
5. **Click-to-source (trust).** Click the row → source panel, exact clause highlighted. "And we don't ask
   you to trust us. One click shows the exact sentence on the exact page it came from. Every line is checkable."
6. **Honesty (the flag).** Point at an amber `needs_review` item. "Where we're not sure, we say so — we
   flag it for you instead of guessing. On this tender we caught **every disqualifier** and flagged the
   rest — measured against a hand-labelled answer key, with **zero dangerous misses.**"
7. **Autofill + the interview.** Approve a few requirements → answers draft from the bidder's capability
   docs, each with its evidence linked. Then the question list: "It drafts your response from your own
   documents — every claim cites the exact evidence behind it, or says *needs your input*. **It never
   bluffs.** And it asks you only the handful of things it genuinely can't answer — a few questions, not a
   blank page."
8. **The after.** "Three weeks of reading and a disqualifier risk — down to minutes, with the killer
   requirement caught, every line verifiable, and a drafted response. The human approved every step."

## The before / after (the legibility anchor)

| | Before | After (Bidframe) |
|---|---|---|
| Time | ~3 weeks of expert reading | minutes |
| Disqualifier risk | a missed pass/fail = whole bid void | caught + surfaced first |
| Trust | hope the checklist is complete | every requirement → its source clause, one click |
| Uncertainty | invisible | flagged honestly (`needs_review`) |
| Response | blank page | drafted from your evidence, gaps asked as questions |
| Control | — | human approves/edits/flags every requirement |

## The Conduct thesis-bridge (say this to the judges)

> "Conduct captures the **context of an expert's decisions** so legacy knowledge moves with the work.
> Bidframe does exactly that for the bid manager. Every tender forces dozens of judgment calls — *is this
> really mandatory? do we meet it? is this a no-bid risk? how do we interpret this clause?* — and today
> those decisions evaporate the moment the bid is sent. **We capture them.** Each approve / edit / flag,
> each answer to a gap question, each piece of evidence linked to a requirement becomes reusable context
> that compounds across every future bid. We're not replacing the expert — we're moving their decisions
> out of their head and into something the next bid, and the next teammate, inherits."

**Why this is the strongest possible framing:** it reframes Bidframe from "a document tool" to "a
decision-and-context-capture tool" — Conduct's own category. The matrix is the surface; the captured
decisions are the moat.

## Positioning guardrails (carry into every sentence)

- **Auditable autofill, never "we write your bid."** We're the trust + control layer, not AutogenAI-lite.
  (See `autofill-scope-decision.md`.) If a judge pushes on generation quality, pivot to traceability:
  "the difference is you can verify every claim back to your own evidence."
- **Honesty is the brand.** The flag for uncertainty isn't a weakness to hide — it's the proof we're not
  guessing. Lead with it.
- **The human is in control** — say it out loud at the approve step. That's the "user in control" score (20%).

## Build status (locked) + the numbers to quote

- [x] **The catch is visually unmissable** — the gating "deal-breaker" hero, shipped.
- [x] **Click-to-source** highlights the exact clause/page — shipped.
- [x] **Autofill is real + honest** — grounded answers, evidence citations, gap interview; live in the API.
- [x] **Robustness proven** — 7/7 of the ugliest real tenders survive ingest→extract→reconcile→autofill (incl. a 66pp NHS framework, 472 reqs, no crash).
- [x] **The numbers (locked, honest):** **gating recall 1.0 · 0 dangerous misses · 0 bluffs (42/42 citations verified).**
  Overall extraction recall wiggles **~0.79–0.95** run-to-run (gpt-4o noise) → **quote the disqualifier catch +
  groundedness, NOT a single recall %.** (Same discipline in outreach + README.)

> **⚠️ Demo run = PRE-BAKED (key resilience).** We don't have a standing LLM key, so run the real
> extract+autofill on the hero tenders **once** and serve the demo from the **cached real output** — no live
> API on stage (no cost, latency, or flakiness). **Hero = SPSO** (clean 13pp); **messy proof = NHS 66pp
> framework.** Live "judges upload" is a *backup*, run locally on a machine that has the key. (Generalist owns
> the bake — see J-020. Claude is our live fallback: `LLM_PROVIDER=anthropic`.)

### Changelog
- **2026-06-28 (Day 1)** — v1 draft by J. Incorporates autofill. Lock by Day 4.
- **2026-06-29 (Day 2)** — Updated to the **locked, honest numbers** (gating recall 1.0 · 0 dangerous · 0
  bluffs; stop quoting a single recall %); autofill beat is now real (groundedness/0-bluffs); added the
  pre-baked-demo + key-resilience plan. Build is essentially demo-complete.
- **2026-06-30 (Day 3)** — **Script LOCKED.** Beats + numbers frozen; rehearse to this spine. Pre-baked
  demo is the on-stage path (no standing LLM key) — the bake (J-020) is the one dependency before recording.
