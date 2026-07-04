# Q&A Prep

Conduct's "Make Legacy Move" track scores on **real process · real speed-up · user in control · clear
demo** (per `tender-master-plan.md`), with the engineering bar — surviving messy real tenders and flagging
uncertainty instead of guessing — underneath. Route each question to whoever actually owns the answer;
don't let one person try to cover all four lanes.

## Product & trust

**"Isn't this just an LLM wrapper / AutogenAI-lite?"** — **Joel**
> "The difference is auditable autofill, not generation: every claim links back to a specific piece of
> your own evidence, and where it can't find evidence, it asks instead of guessing. We're the trust and
> control layer on top of the model, not a black-box generator."

**"How do you know your numbers (deal-breaker catch, 0 bluffs) are real and not cherry-picked?"** — **Bobby**
> Deterministic eval harness (no LLM grading its own homework), scored against hand-labelled gold sets, plus
> an 18-test adversarial suite specifically designed to break each of the four trust claims. The strongest
> answer to "cherry-picked": **the on-stage tender (Bradwell) was a held-out test — 10/10 deal-breakers
> caught on a tender the pipeline had never seen**, and 12/12 on gold is deterministic (no model, re-runnable).
> Every stage claim, its source, and its defender: `demo-claim-ledger.md` — if a number isn't in the ledger,
> don't say it. Mention the one honestly-documented limitation (lexical reconcile could, in theory, merge two
> distinct requirements that share the exact same page *and* clause) if asked for a weakness — having one
> documented, tested-for limit is more credible than claiming none.

**"What about hallucination in the drafted answers?"** — **Bobby**
> Groundedness eval purpose-built to catch fabricated citations; 42/42 verified on the demo tender; the
> detector has been tested against a planted fake citation and caught it.

**"How is a bid manager actually 'in control' here, concretely?"** — **Jawad**
> Approve / edit / flag on every single requirement — nothing auto-applies to the final bid. Say "the human
> approves every step" explicitly; it's close to a direct quote of the scored criterion.

## Engineering depth

**"What happens with a scanned / image-only / huge / corrupt PDF?"** — **P**
> OCR flagging for image-only PDFs, graceful 422 errors (not crashes) for corrupt/encrypted/empty files,
> a 50MB size cap with a clean rejection. Can cite the 7/7 ugliest-real-tenders-survive number (that's
> Bobby's eval, but it's testing your pipeline — fine for either of you to use).

Follow-up if they push: the backend treats this as a product requirement, not an exception. A bad PDF gets
a clear API response the frontend can show; sparse/image-only pages carry warnings so the extractor and the
human both know the evidence may be incomplete.

**"Walk me through the pipeline."** — **P**
> Ingest → chunk → extract → classify → (generalist's) reconcile/dedupe → confidence routing → API. Go as
> deep as the room wants; this is backend's home turf.

30-second version: PyMuPDF/pypdf gets page-numbered text; chunking preserves page/source context; extractor
returns raw requirement candidates; graph enrichment adds criteria/dependency hints; the engine reconciles
duplicates and routes confidence; FastAPI serves the locked schema to the UI and persists decisions in
SQLite.

**"Is the demo live or pre-baked?"** — **P**
> The default stage path is pre-baked output from a real prior backend run, because we are not going to bet
> the core claim on venue wifi or a public API key. If the Render key is live and tested that day, we can
> run the same path live. The important thing is that the schema, API, and UI path are identical either way.

**"What happens if the key is missing?"** — **P**
> The backend falls back to a heuristic extractor so the plumbing still works, but we do not use that path
> for the disqualifier claim. The measured claim comes from the OpenAI/pre-baked run. That distinction is
> deliberate and honest.

**"What's reconcile actually doing, and why does it matter?"** — **Bobby**
> Conservative AND-gate merge (text similarity + token overlap + same page + same clause) — collapses
> genuine cross-chunk duplicates but never silently merges two distinct requirements, because a wrong merge
> is a silent miss, which is the one failure mode the whole product exists to prevent.

**"Why does the recall number wiggle / why isn't it a clean 0.95+?"** — **Bobby**
> Run-to-run gpt-4o noise on overall extraction recall (~0.79–0.95). Deliberately don't lead with this
> number — lead with gating recall (1.0, stable) and groundedness (0 bluffs, stable), because those are the
> numbers that actually matter for the failure mode being solved (missing a disqualifier, fabricating a
> claim). Naming this directly, unprompted if needed, reads as rigour rather than weakness.

## Design & UX

**"Why does it look like this (the 'civic record' aesthetic)?"** — **Jawad**
> The product *is* an official record in progress, so the form mirrors the function — editorial structure,
> brutalist honesty (the discipline = auditability), warmed paper as the material. Oxblood = gating/danger,
> forest = approved, confidence shown as a greyscale-safe bead scale (never relies on colour alone, so it
> still reads under a bad projector or for a colourblind judge).

**"What's the graph view for — isn't that scope creep?"** — **Jawad**
> Relationship graph over `criteria_ref` + `depends_on` — shows how requirements connect to each other and
> to award criteria, not just a flat list. It's deliberately *not* part of the core 90-second pitch (a
> stated guardrail was not to over-build the graph) — good to have it ready if asked, bad to lead with it.

## Business & go-to-market

**"Who would actually pay for this? Do you have any real interest?"** — **Joel**
> Own the traction dossier (`traction-research.md`: ~19 verified CRM targets across care, cleaning,
> catering, IT/MSP, training, security, grounds, waste, transport, plus small bid consultancies) and the
> live outreach CRM (`crm/`) with independently-verified contacts (no invented emails) and personalised
> outreach drafts. Be honest about stage — "starting those conversations now," not "we have signed
> customers" unless that's literally become true by demo day.

**"Why this niche (UK public-sector SME bidders) and not [construction / a bigger market]?"** — **Joel**
> Niche was locked Day 1 deliberately — focus drove both the tender-sourcing strategy and the framing. Can
> speak to why public-sector ITTs specifically (consistent structure, mandatory/disqualifying requirements
> are a real, named failure mode bid managers already worry about).

**"What's different from [competitor X]?"** — **Joel**
> Owns the prior-art note in the README — "similar tools exist, here's how we differ" framing, centred on
> auditability/traceability rather than generation quality.

## If nobody on stage knows the answer

Better to say "good question — that's not something we've tested/built yet, but here's how we'd approach
it" than to guess. It's consistent with the product's entire pitch (flag uncertainty instead of guessing) —
judges scoring "real process" will likely respect the consistency more than a confident wrong answer.
