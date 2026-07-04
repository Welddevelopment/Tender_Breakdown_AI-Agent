# Q&A Battlecard — Bidframe, Demo Day

> Extends Pranav's [`demo-day/qa-prep.md`](../demo-day/qa-prep.md) (route questions to their owner;
> full versions there). Numbers ONLY from [`demo-claim-ledger.md`](../demo-claim-ledger.md). This file
> adds the sharper, judge-facing short forms + the strategic questions qa-prep doesn't cover.
> House rule: if nobody knows — "Good question. We haven't tested that yet; here's how we'd approach
> it." (Consistent with the product's own flag-don't-guess pitch.)

## The on-stage arithmetic question (rehearse this — it's visible on the screen)

**"Your screen shows 12 deal-breakers but you said 10/10 — which is it?"** — *Bobby*
> Both, and the difference is the product working as designed. Ten are the hand-labelled gold
> deal-breakers — all ten caught. The other two are lower-confidence candidates the system surfaced
> and **flagged for review instead of silently deciding** — that's the honesty mechanism on screen.
> Our failure mode is a visible over-flag, never a silent miss; for a bid, that's the only safe way
> round. *(J-081 put those 2 `needs_review` rows there deliberately so we can say exactly this.)*

## The five they will almost certainly ask

**"What did you actually build this week?"** — *P, then Bobby*
> A full pipeline, not a wrapper: PDF ingest → chunk → extract → classify → reconcile/dedupe →
> confidence routing → REST API → the review UI. Plus the part most teams skip: a deterministic eval
> harness with four hand-labelled gold tenders, an 18-test adversarial suite, and a groundedness
> checker for drafted answers. ~216 backend tests, 116+ engine tests, live deploy. The eval harness IS
> the product story: we can measure the claim we make on stage.

**"Isn't this just ChatGPT/NotebookLM on a PDF?"** — *Joel*
> Three differences. One: we're deterministic where it matters — the deal-breaker catch runs
> **without the model** (12/12 on gold, re-runnable). Two: everything is auditable — every requirement
> links to its exact clause and page, every drafted answer cites the bidder's own evidence or asks
> instead of guessing. Three: it's measured — hand-labelled gold sets, held-out tenders, an adversarial
> suite. A chat window gives you none of those.

**"How do I know your numbers aren't cherry-picked?"** — *Bobby*
> The tender on screen — Bradwell — was a **held-out test**: the pipeline had never seen it and caught
> all ten labelled deal-breakers. The 12/12 on gold is deterministic, no model, re-runnable. And we
> publish the limitation: broader requirement recall is promising but small-sample, so we don't put a
> headline percentage on it. (If pushed: the ~20% "precision" figure is a sparse-gold artifact — only
> 5 of ~586 flagged items were actual junk; the gold keys under-label.)

**"What about hallucination?"** — *Bobby*
> Purpose-built groundedness eval: 42/42 citations verified on our eval run, zero bluffs, and the
> detector catches a deliberately planted fake citation. Where there's no evidence, the product asks a
> question instead of writing an answer. It never bluffs — that's tested, not aspirational.

**"Who pays for this?"** — *Joel*
> SME bidders in UK public procurement — hundreds of billions a year in spend, with government policy
> actively pushing SME share (~33% target), and the Procurement Act 2023 live since Feb 2025 changing
> the rules everyone bids under. We've built a verified CRM of ~19 targets across care, cleaning,
> security, IT, grounds — outreach is starting, honestly framed as pilots, not customers.

## Conduct / track-fit questions

**"How is this 'Make Legacy Move'?"** — *Joel (the thesis-bridge, near-verbatim)*
> Conduct captures the context of an expert's decisions so legacy knowledge moves with the work.
> Bidframe does exactly that for the bid manager: every approve/edit/flag, every gap answer, every
> evidence link is a captured judgment call that today evaporates when the bid ships. The matrix is
> the surface; the decision record is the moat.

**"Where's the human in control, concretely?"** — *Jawad*
> Approve / edit / flag on every requirement; nothing auto-applies. Decisions persist via the API with
> a timestamped note. "The human approves every step" — literally the scored criterion, and we say it
> on stage because it's true in the schema (`decision`, `status`, `needs_review`).

**"Regulatory/compliance risk of AI-drafted bids?"** — *Joel, pivot to Bobby*
> We deliberately never submit anything: Bidframe produces a *reviewed* compliance record and drafted
> answers with citations a human approves. The audit trail is the point — arguably it makes the
> process MORE defensible than the status quo (no record of why a clause was read a certain way).
> Procurement Act 2025 transparency direction favors exactly this kind of traceability.

## Technical depth (owners)

- **Pipeline walk-through** → *P* (30s version in qa-prep; go as deep as asked).
- **Scanned/corrupt/huge PDFs** → *P*: OCR flagging, clean 422s, 50MB cap; 7/7 ugliest real tenders
  survive end-to-end (66pp NHS, 472 reqs, no crash).
- **Reconcile/dedupe** → *Bobby*: conservative AND-gate merge; a wrong merge is a silent miss, so it
  errs toward keeping rows separate; gating rows never fuzzy-merge; numeric-conflict guard (£5m ≠ £10m).
- **"Why does recall wiggle?"** → *Bobby*: gpt-4o run-to-run noise on ordinary requirements
  (~0.79–0.95); the stable numbers are the deal-breaker catch and groundedness — the failure modes
  that actually kill bids. Naming this unprompted reads as rigor.
- **"Is the demo live?"** → *P*: cached output of a real pipeline run, by choice — we don't bet the
  core claim on venue wifi. Same schema, same API shape, live path exists and runs after the pitch.
- **"One honest limitation?"** → *Bobby*: lexical reconcile could in theory merge two distinct
  requirements sharing the exact same page AND clause — documented, tested-for, not yet hit. Having a
  named, tested limitation beats claiming none.

## Strategy questions

**"Why now?"** — *Joel*
> Procurement Act 2023 went live 24 Feb 2025 — new rules, new transparency duties, everyone re-learning
> the process. LLMs finally read 30-plus-page documents reliably enough to draft — but not reliably
> enough to trust unaudited. The gap between those two facts IS the product: the trust layer.

**"Why you?"** — *Joel*
> In seven days, four people built the pipeline, the review UI, a live deploy, AND the measurement
> apparatus to prove the one claim that matters. We didn't build a demo that looks right; we built an
> eval harness that shows it IS right on tenders it had never seen. That discipline is the company.

**"What's defensible?"** — *Joel*
> Not the LLM call. Three compounding assets: (1) the eval/gold-set apparatus — every tender we label
> makes the catch guarantee stronger and is expensive to copy honestly; (2) the captured decision
> graph — every reviewed bid becomes reusable context for the next one (switching cost); (3) the
> niche wedge — deal-breaker detection for UK public ITTs is a named, felt failure mode, not generic
> "document AI".

**"What happens after the hackathon?"** — *Joel*
> Outreach list is built and verified (~19 CRM targets); we're booking pilot conversations now. Next
> milestone: 2–3 SMEs running a real tender through it with us in the room, expanding the gold set and
> the decision graph as we go. The ask on the last slide is pilots and design partners.

**"Why public procurement, not contracts generally?"** — *Joel*
> Public ITTs have a consistent structure, a published legal framework, and a *named* catastrophic
> failure mode — the missed mandatory requirement that voids weeks of work. That's a wedge you can
> measure (we do), a buyer who already fears it, and documents that are public so we can build gold
> sets without NDAs. Generic contract AI has none of those advantages.

## Do NOT say (ledger guardrails)

- ❌ "100% accurate" / "never misses anything" → ✅ "catches every deal-breaker on our tested tenders."
- ❌ any headline recall/precision % for all requirements → ✅ deal-breaker numbers + honest caveat.
- ❌ "101/101 on real tenders" → ✅ "a synthetic worst-case phrasing bank."
- ❌ "customers" → ✅ "pilots / targets / outreach."
- ❌ "the model is running live" (on the prebake) → ✅ "cached output of a real pipeline run."
- ❌ an uncited market figure → ✅ "hundreds of billions a year" (House of Commons Library for £341bn).
