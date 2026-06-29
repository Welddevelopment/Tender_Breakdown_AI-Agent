# Bidframe

> **First thing — humans and AI agents both read [AGENTS.md](AGENTS.md) before doing anything.**
> It holds the locked data contract and the git workflow every teammate (and their agent) must follow.
> For *where the project is right now*, read [STATUS.md](STATUS.md).

**Bidframe turns a 150-page public-sector tender into a verified, source-linked compliance checklist
in minutes** — it catches the requirement that would have disqualified the bid, flags what it's unsure
about, and drafts your response from your own evidence. The human approves every call.

Built for the **Conduct "Make Legacy Move"** hackathon (7-day build). Niche: **UK public-sector
procurement**, for the **SME bidders + small bid consultancies** that enterprise tools price out.

> Deal-breakers jump out, uncertain items look hesitant, confidence is shown visually — not as raw numbers.

## Why it's different (the wedge)

The incumbents are either **generative** ("AI writes your bid", enterprise-priced) or **answer
libraries** you have to maintain. Both treat *reading the tender* as a black box. Bidframe makes that
step **auditable**:

1. **Traceability** — every requirement links to the exact clause/page it came from. One click to verify.
2. **The disqualifier catch** — hard pass/fail gates surfaced loudly, not buried in a flat list.
3. **Measured completeness** — "found 98%, here are the 2% we flagged," not a list you just *hope* is complete.
4. **Human in control** — approve / edit / flag every requirement.
5. **Auditable autofill** — drafts each answer from *your* capability docs, every claim traceable, and
   asks you only what it genuinely can't answer. (We draft; we never claim to ghost-write a black box.)

**The context-graph framing (the Conduct bridge):** Conduct captures the *context of an expert's
decisions* so legacy knowledge moves with the work. Bidframe does that for the bid manager — every
approve/edit/flag, every answer to a gap question, every piece of evidence linked to a requirement
becomes reusable context that **compounds across future bids**. The matrix is the surface; the captured
decisions are the moat. (Full story: [demo-narrative.md](demo-narrative.md), [prior-art.md](prior-art.md).)

## Measured accuracy — the proof, not a promise

Most tools hand you a requirement list and you *hope* it's complete. We measure ours. An eval harness
(`engine/eval.py`) scores the tool's output against a **hand-labelled gold set** per tender — recall
(did we catch every requirement), precision, and the safety headline **gating recall** (did every
disqualifier survive). It's deterministic — no LLM-as-judge — so the score is itself auditable.

**First real tender (SPSO Cleaning ITT):** the extractor caught **18 of 19** requirements and **every
disqualifier (gating recall 1.0), with zero dangerous misses** — and flags what it's unsure of rather
than guessing. Early, on one tender, and broadening as we add gold-labelled tenders — but it's a *real*
number on a *real* document. That's the wedge: we quantify what we might have missed instead of asking
you to trust a black box.

## Repo layout

```
/frontend     Next.js 16 + React 19 + Tailwind 4 — compliance matrix, source panel, gating hero, graph, upload
/backend      Python + FastAPI — ingest → chunk → extract → SQLite → REST API (pluggable LLM: OpenAI / heuristic)
/engine       Python — reconcile/dedupe + the eval harness (the measured-accuracy machine)
/comms        Async agent message boards (one per role)
/prompts      Extraction · classification · answer-generation · gap-interview prompts + the raw-extraction contract
*.md          Plan, status, narrative, positioning, per-role briefs
```

## Read first

| Doc | What it is |
|-----|------------|
| [STATUS.md](STATUS.md) | Live current state — where each role is right now |
| [AGENTS.md](AGENTS.md) | Locked data contract + git workflow + agent comms |
| [tender-master-plan.md](tender-master-plan.md) | Source of truth: pipeline, schema, scoring |
| [demo-narrative.md](demo-narrative.md) · [positioning-and-traction.md](positioning-and-traction.md) | The story + the market wedge |
| `role-*.md` | Per-person day-by-day briefs |

## Run the frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

## Run the backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                 # optional — add OPENAI_API_KEY for the LLM extractor
uvicorn app.main:app --reload                        # http://localhost:8000  ·  docs at /docs
```

Extraction is **pluggable**: runs a heuristic extractor with no key, and auto-upgrades to **OpenAI**
when `OPENAI_API_KEY` is set. See [backend/README.md](backend/README.md).

## The one rule

The **requirement schema is locked** (see [AGENTS.md](AGENTS.md)). Frontend builds against mock data in
that exact shape; backend produces it for real. Don't change it without team agreement.

*Built at the Conduct "Make Legacy Move" hackathon, 2026.*
