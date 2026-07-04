# Bidframe

**Bidframe turns a 150-page public-sector tender into a verified, source-linked compliance checklist in
hours, not weeks — and keeps the expert at the wheel the whole way.** It catches the requirement that
would have disqualified the bid, flags what it's unsure of instead of guessing, and drafts each response
from your own evidence. **The human approves every call.**

Built for the **Conduct "Make Legacy Move"** hackathon. Niche: **UK public-sector procurement**, for the
**SME bidders and small bid consultancies** that enterprise tools price out.

> **The track's thesis is "don't replace the expert — make them 10× faster while they stay at the
> wheel."** That's exactly Bidframe. The AI reads and drafts; **it never decides.** Every deal-breaker
> needs your explicit sign-off, every answer is drafted only from *your* evidence, it asks when it can't,
> and nothing is approved or submitted until you say so.

## What it does — in 90 seconds

1. **Reads the whole tender** through a real pipeline (ingest → chunk → extract → reconcile) — not a chat
   wrapper around one prompt.
2. **Surfaces the deal-breakers first** — the pass/fail rules that disqualify a bid even when everything
   else is perfect — each traced to the **exact clause and page** it came from.
3. **Drafts answers from your evidence** — every claim cited back to your own capability docs; where there
   is no evidence, it raises an **open question** instead of inventing one.
4. **Keeps you in control** — approve / edit / flag every line; approving a deal-breaker takes an explicit
   confirm; confidence is shown visually, never as a raw number you have to trust.

Try it: **`/showcase`** runs the real product on a frozen real tender (no login, no key). **`/demo`** is a
guided walkthrough. **`/review`** is the live tool.

## Why it's different (the wedge)

The incumbents are either **generative** ("AI writes your bid", enterprise-priced) or **answer libraries**
you maintain. Both treat *reading the tender* as a black box. Bidframe makes that step **auditable and
human-controlled**:

1. **Human in control** — the expert stays at the wheel: approve / edit / flag every requirement, an
   explicit confirm before any deal-breaker is signed off, and a live record of every decision.
2. **Traceability** — every requirement links to the exact clause/page it came from; one click opens the
   real PDF at that line.
3. **The disqualifier catch** — hard pass/fail gates surfaced loudly, not buried in a flat list.
4. **Measured completeness** — we tell you what we caught and flag what we're unsure of, instead of a list
   you just *hope* is complete.
5. **Auditable autofill** — drafts each answer from *your* capability docs, every claim traceable, and
   asks you only what it genuinely can't answer. We draft; we never ghost-write a black box.

**The Conduct bridge:** Conduct captures the *context of an expert's decisions* so legacy knowledge moves
with the work. Bidframe does that for the bid manager — every approve/edit/flag and every answered gap
becomes reusable context that **compounds across future bids**. The matrix is the surface; the captured
decisions are the moat.

## Measured accuracy — reproduce it in one command

Most tools hand you a requirement list and you *hope* it's complete. We measure ours **deterministically**
(no LLM-as-judge, so the score is itself auditable) against hand-labelled gold sets, across four real
public-sector tenders spanning cleaning, grounds-maintenance and arboriculture.

- **Deal-breaker (gating) recall: 100%.** Every disqualifier caught on all four gold tenders. It's
  guaranteed, not luck: a **deterministic net catches 12/12 with no LLM at all**, we hold **10/10 on a
  held-out tender the system had never seen**, and **101/101** on an adversarial bank of deal-breaker
  phrasings built to dodge our keywords. No unseen tender silently drops a bid-killer.
- **General requirement recall: ~0.7** across the four tenders (LLM extractor) — we catch the majority and,
  crucially, **flag what we're unsure of** rather than guessing. It's an early number on a small gold set,
  broadening as we label more — but it's a *real* number on *real* documents, not a promise.
- We deliberately **don't headline a precision figure**: our gold sets are sparse, so much of the apparent
  "over-extraction" is real requirements the key hasn't caught up to. We optimise for missing nothing that
  matters and being honest about the rest.

**Reproduce it yourself** (deterministic gating floor needs no key; the LLM recall path uses `OPENAI_API_KEY`):

```bash
python -m engine.scripts.eval_all        # scores extraction vs the gold sets, per tender
```

## Real engineering (not a wrapper around a prompt)

- **Two-stage deal-breaker engine** — a generous *deterministic* keyword net (recall-first) guarantees the
  floor, then a model precision-filter with full-page context removes false flags. The guarantee comes
  from code, not the model's mood.
- **Eval harness** — `engine/eval.py` + `engine/scripts/eval_all.py` score output against gold sets
  deterministically. **30+ test modules** across `engine/` and `backend/`.
- **Real ingest pipeline** — `POST /tenders/upload` → background extraction job → live progress → error
  handling; pluggable extractor (heuristic with **no key**, OpenAI when a key is set).
- **Traceability to the line** — `source_rect` bounding boxes highlight the exact line in the source PDF;
  two-sided evidence links tie each drafted answer to the capability doc that backs it.

## For reviewers — run it

```bash
# Frontend (the product UI — mock/demo data by default, no backend needed)
cd frontend && npm install && npm run dev          # http://localhost:3000  → /showcase

# Backend (the real pipeline + REST API)
cd backend && python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # optional: add OPENAI_API_KEY for the LLM extractor
uvicorn app.main:app --reload                       # http://localhost:8000 · API docs at /docs

# Reproduce the measured accuracy
python -m engine.scripts.eval_all
```

The frontend runs entirely on demo data with **no backend and no key** — `/showcase` is the fastest look.

## Repo layout

```
/frontend   Next.js 16 + React 19 + Tailwind — compliance matrix, source panel, gating hero, graph, upload
/backend    Python + FastAPI — ingest → chunk → extract → SQLite → REST API (pluggable LLM / heuristic)
/engine     Python — reconcile/dedupe + the eval harness (the measured-accuracy machine)
/prompts    Extraction · classification · answer-generation · gap-interview prompts + the schema contract
/gold-set   Hand-labelled gold requirements per tender (what the eval scores against)
```

The many `*.md` files at the repo root are our **working docs** (planning, status, comms, outreach) — a
7-day, four-person build in the open. If you're reviewing, start with this README and the code above.

---

### Contributing / for the team & agents

The **requirement schema is locked** ([AGENTS.md](AGENTS.md)) — frontend builds against mock data in that
exact shape, backend produces it for real; don't change it without team agreement. For current state see
[STATUS.md](STATUS.md); for the whole-repo map (auto-updated on every push) see [CODEMAP.md](CODEMAP.md);
the git workflow + agent comms protocol are in [AGENTS.md](AGENTS.md).

*Built at the Conduct "Make Legacy Move" hackathon, 2026.*
