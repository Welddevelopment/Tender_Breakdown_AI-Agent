# Bidframe — Live Team Status

> **Read this first, every session.** It's the single source of truth for *where the project is right now*.
> Owned + kept current by **J** (glue/standup), but **every role updates the line for their own area when they push.**
> For the *fixed* stuff — schema, git rules, pipeline — see [AGENTS.md](AGENTS.md) and [tender-master-plan.md](tender-master-plan.md). This file is the *moving* part.

**Tool name:** **Bidframe** (locked Day 1). _Auditable requirement breakdown + compliance matrix for SME public-sector bidders._
**Track:** Conduct "Make Legacy Move" (primary). Fetch.ai stack = **decide Day 3** (J's parallel task, never at engineers' expense).
**Timeline:** Day 1 = **28 Jun 2026** · Demo = **4 Jul** · **Day 4 = integration gate** (end-to-end on a fresh tender; not working by EOD4 → Day 5 cuts scope, doesn't add).
**Last updated:** 2026-06-28 (Day 1) by J.

---

## The one rule that keeps us fast

Work **directly on `main`**, in **your own folder**. Loop constantly:

```bash
git pull --rebase      # before you start AND before you push
# ...focused change in YOUR lane...
git add -A && git commit -m "clear message"
git pull --rebase
git push
```

**When you push a meaningful change, update your row in "Where each role is" below.** Pull often so you see others' updates. Branch+PR only for: (1) a schema change, (2) a big/risky refactor. Full rules: [AGENTS.md](AGENTS.md) / [CONTRIBUTING.md](CONTRIBUTING.md).

---

## The locked contract (do NOT change without team agreement)

The **requirement object** schema in [AGENTS.md](AGENTS.md) §"Data contract" is **locked**. Frontend builds mock data in it; backend + generalist produce it for real. Changing it breaks both sides at once → branch + PR + team sign-off only.

`{ id, text, source_page, source_clause, source_excerpt, type, is_gating, category, confidence, status, needs_review, decision, criteria_ref, depends_on, draft_answer }`

**Intermediate format (backend → generalist):** the *raw extraction list* — requirement objects pre-reconcile (cross-chunk duplicates allowed, raw confidence, ids not yet deduped). **Spec is up — `prompts/raw-extraction-format.md` (PROPOSED v1)** with a 6-item mock at `prompts/mock-raw-extraction.json`. **Backend + generalist: review + sign off in standup today**, build against the mock meanwhile.

---

## Where each role is (each owner edits their own row)

| Role | Owns | Status | Next | Blocked on |
|------|------|--------|------|-----------|
| **Backend** | PDF ingest · chunk · extract · classify · graph · SQLite · REST API | _not started_ | Day-1 spike: PyMuPDF → text+page numbers on one real tender; FastAPI skeleton + mock `/requirements` | needs a sample tender from sourcing sprint |
| **Generalist** | reconcile/dedupe · confidence routing · eval harness · answer-draft | _not started_ | Day-1: agree raw-extraction format; start reconcile vs mock raw data; label one tender | raw-extraction format spec (J, today) |
| **Frontend** | compliance matrix · source panel · decision controls · graph view · demo | _scaffold exists_ (`frontend/src/`) | Day-1: matrix over mock requirements; gating rows stand out; `needs_review` looks uncertain; confidence as bar/dot | nothing — mock-first, never blocked |
| **J** | prompts · orchestration · narrative · traction · glue | **in progress** | Day-1 ✅ name locked · raw-extraction spec+mock · v1 extraction+classification prompts (`prompts/`). Next: run standup, do sourcing share + label one tender | nothing |

---

## Open decisions / watch list

- **LLM provider** — undecided. Cheapest-and-best; **evaluate Day 2+**. Prompts written provider-agnostic (structured output via JSON-schema/function-calling, never free text). Pick once sponsor credits are known.
- **Sourcing sprint (Day 1, all four)** — grab 10–15 real UK public-sector tenders (Contracts Finder / Find a Tender, full-pack-attached). **Confirm one downloads + parses cleanly in hour one.** Never commit tender PDFs (`.gitignore`).
- **Gold set (by EOD Day 2)** — each person hand-labels ONE tender end-to-end.
- **Fetch.ai stack** — revisit Day 3; only if extraction core is solid + J has slack.

## Recently shipped (newest first)

- **2026-06-28** — J: v1 extraction + classification prompts (`prompts/extraction.md`, `prompts/classification.md`) — provider-agnostic, recall-first, structured-output schemas inline.
- **2026-06-28** — J: raw-extraction format spec + 6-item mock (`prompts/raw-extraction-format.md`, `prompts/mock-raw-extraction.json`) — backend→generalist contract.
- **2026-06-28** — J: cleaned up stray global config; locked tool name **Bidframe**; created this `STATUS.md`.
