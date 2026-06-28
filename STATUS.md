# Bidframe — Live Team Status

> **Read this first, every session.** It's the single source of truth for *where the project is right now*.
> Owned + kept current by **J** (glue/standup), but **every role updates the line for their own area when they push.**
> For the *fixed* stuff — schema, git rules, pipeline — see [AGENTS.md](AGENTS.md) and [tender-master-plan.md](tender-master-plan.md). This file is the *moving* part.

**Tool name:** **Bidframe** (locked Day 1). _Auditable requirement breakdown + compliance matrix → grounded autofill of the bid response, for SME public-sector bidders._

> ✅ **SCOPE: auditable autofill — RATIFIED + schema merged to `main` (2026-06-28).** Bidframe extends to **end-to-end bid drafting**, messaged as **"auditable autofill"** (never "we write your bid"). Write-up + role implications: [autofill-scope-decision.md](autofill-scope-decision.md). Extraction + the disqualifier catch stay the spine and the Day-4 gate; autofill rides on top, ships only once that gate is green. Per-lane mirror tasks are in "The locked contract" below.
>
> 💬 **Agent comms live:** read all four `comms/board-*.md` + this file on startup; post to your own board. Protocol: [comms/README.md](comms/README.md).
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

The **requirement object** schema in [AGENTS.md](AGENTS.md) §"Data contract" is **locked**. Frontend builds mock data in it; backend + generalist produce it for real. Changing it normally needs team sign-off (it breaks both sides at once).

`{ id, text, source_page, source_clause, source_excerpt, type, is_gating, category, confidence, status, needs_review, decision, criteria_ref, depends_on, draft_answer, answer, open_questions }` + `capability_docs[]` on the tender response.

> ✅ **SCHEMA EXTENDED — team-confirmed 2026-06-28, now on `main`.** Added (additive, nullable — the matrix UI is unaffected): `answer` `{ text, state, evidence_refs[], confidence }`, `open_questions[]`, and `capability_docs[]` on the tender response. `draft_answer` kept as a deprecated alias of `answer.text`. Rationale + field details in [autofill-scope-decision.md](autofill-scope-decision.md). *(Team waived the PR ceremony for this one — verbal sign-off was the point of the rule; see [CONTRIBUTING.md](CONTRIBUTING.md).)*
>
> **Each role's agent — mirror it in your lane:**
> - **Frontend:** add the fields to `frontend/src/types/requirement.ts` + a couple of `mock-requirements.ts` examples. Safe to ignore in the matrix until the answer UI is built.
> - **Backend:** add `answer` / `open_questions` / `capability_docs` to your request/response models + serializers (nullable/empty by default).
> - **Generalist/J:** wire the `prompts/answer-generation.md` + `prompts/gap-interview.md` prompts into the pipeline (after the extraction Day-4 gate).

**Intermediate format (backend → generalist):** the *raw extraction list* — requirement objects pre-reconcile (cross-chunk duplicates allowed, raw confidence, ids not yet deduped). **Spec is up — `prompts/raw-extraction-format.md` (PROPOSED v1)** with a 6-item mock at `prompts/mock-raw-extraction.json`. **Backend + generalist: review + sign off in standup today**, build against the mock meanwhile.

---

## Where each role is (each owner edits their own row)

| Role | Owns | Status | Next | Blocked on |
|------|------|--------|------|-----------|
| **Backend** | PDF ingest · chunk · extract · classify · graph · SQLite · REST API | 🟡 **skeleton only** — FastAPI + `/health`; upload/requirements/PATCH still `NotImplementedError` | **Long pole.** PyMuPDF spike → text+accurate page numbers on a real tender; report table/multi-col breakage; one extraction call (use `prompts/extraction.md`); make `GET /requirements` return sample objects so frontend can integrate; sign off raw-extraction format | needs ONE tender PDF in hand (sourcing) |
| **Generalist** | reconcile/dedupe · confidence routing · eval harness · answer-draft | 🔴 **nothing pushed** | Sign off raw-extraction format; build reconcile/dedupe vs `prompts/mock-raw-extraction.json` (merge the seeded ISO-9001 dupe); pick a tender to label | not blocked — mock raw data is ready |
| **Frontend** | compliance matrix · source panel · decision controls · graph view · demo | 🟢 **Day-1 ~done** — matrix + gating highlight + `needs_review` styling + visual confidence + 11 mocks | Source panel (click row → `source_excerpt`+page); mirror new schema fields into `types/requirement.ts`; decision controls (Day 3) | backend mock `/requirements` for real-data swap |
| **J** | prompts · orchestration · narrative · traction · glue | 🟢 **ahead** — name, 4 prompts, raw-extraction spec+mock, autofill scope+schema, comms channel, standup | Sourcing share + label 1 tender (human); demo narrative + thesis-bridge; chase the two blockers | nothing |

---

## Open decisions / watch list

- **Autofill scope (NEW, ratify at standup)** — extend to grounded bid drafting? Schema change + role impact in [autofill-scope-decision.md](autofill-scope-decision.md). J has drafted the prompts + proposal; needs backend/generalist/frontend buy-in + a schema PR. **Must not delay the extraction Day-4 gate.**
- **LLM provider** — undecided. Cheapest-and-best; **evaluate Day 2+**. Prompts written provider-agnostic (structured output via JSON-schema/function-calling, never free text). Pick once sponsor credits are known.
- **Sourcing sprint (Day 1, all four)** — grab 10–15 real UK public-sector tenders. ✅ **Hour-one check DONE**: SPSO cleaning ITT sourced + parsed clean (13pp). Use direct-download ITTs (no portal approval) — see [tenders.md](tenders.md). Save PDFs to `data/tenders/` (gitignored). Still want more for the gold set + ugly-tender stress tests.
- **Gold set (by EOD Day 2)** — each person hand-labels ONE tender end-to-end.
- **Fetch.ai stack** — revisit Day 3; only if extraction core is solid + J has slack.

## Recently shipped (newest first)

- **2026-06-28** — ✅ **Hour-one parse check PASSED on a real tender** (SPSO cleaning ITT, 13pp clean). Biggest Day-1 engine risk retired. Sourcing log started: [tenders.md](tenders.md).
- **2026-06-28** — J (covering for backend, with their OK): `backend/scripts/parse_check.py` — hour-one tender parseability gate (PyMuPDF→pypdf fallback); added `pymupdf` to requirements. **Tested + working** (installed Python 3.12; clean→PASS, image-only→needs-OCR, no-arg→usage). Fixed a Windows cp1252 emoji crash.
- **2026-06-28** — J: **agent comms channel** (`comms/`) — per-role boards, conflict-free; wired into AGENTS.md + STATUS startup reads. Role table refreshed to real progress.
- **2026-06-28** — Schema extended for autofill (`answer`, `open_questions`, `capability_docs`) — team-confirmed, merged to `main`. Per-lane mirror tasks listed in "The locked contract" above.
- **2026-06-28** — J: **autofill scope decision** + `prompts/answer-generation.md` + `prompts/gap-interview.md` (auditable autofill: grounded per-requirement answers + deduped gap questions). Pending team ratification + schema PR.
- **2026-06-28** — J: v1 extraction + classification prompts (`prompts/extraction.md`, `prompts/classification.md`) — provider-agnostic, recall-first, structured-output schemas inline.
- **2026-06-28** — J: raw-extraction format spec + 6-item mock (`prompts/raw-extraction-format.md`, `prompts/mock-raw-extraction.json`) — backend→generalist contract.
- **2026-06-28** — J: cleaned up stray global config; locked tool name **Bidframe**; created this `STATUS.md`.
