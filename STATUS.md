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
**Last updated:** 2026-06-29 (Day 2) by J.

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
| **Backend** | PDF ingest · chunk · extract · classify · graph · SQLite · REST API | 🟢 **pipeline built + tested** (J covering, backend's laptop down till tomorrow) — ingest→chunk→extract→SQLite, all 3 endpoints live, tested on SPSO (20 reqs). Heuristic extractor (no key); Claude path ready | **Backend, when back:** swap heuristic→Claude, harden ingest (tables/OCR), graph edges, hand raw list to generalist. See `backend/README.md` "Owner TODOs" | nothing |
| **Generalist** | reconcile/dedupe · confidence routing · eval harness · answer-draft | 🟢 **REAL number on SPSO** — `engine/` on main, 64 tests green; full PDF→extract→reconcile→eval loop (`engine/scripts/run_tender.py`) scores SPSO pp.1-6 at **recall 0.95 (18/19), gating recall 1.0, 0 dangerous misses** | Triage SPSO false positives (gold completeness vs noise); flag gating over-classification to backend; confidence calibration + answer-draft (Day 3) | not blocked |
| **Frontend** | compliance matrix · source panel · decision controls · graph view · demo | 🟢 **autofill UI + live-backend wiring** — Bidframe wireframes + answer/evidence panel + gap-interview (`/answers`); **wired to the live API** (`src/lib/api.ts`): env-driven (`NEXT_PUBLIC_API_BASE_URL`), **mock by default**, upload→extract→matrix on the real backend, decisions persisted via PATCH; deployed on Vercel | Design-system pass (ideating separately); capability-doc upload mode; **set `NEXT_PUBLIC_API_BASE_URL` → the live Render URL in Vercel** so the *hosted* site shows live data (backend now deployed — see J-016) | nothing blocking |
| **J** | prompts · orchestration · narrative · traction · glue | 🟢 **ahead** — name, 4 prompts, raw-extraction spec+mock (signed off), autofill scope+schema, comms channel, standup; scaffolded the backend pipeline + **deployed it live to Render** (`bidframe-api.onrender.com`, verified) | Lock demo narrative/thesis-bridge (real number now exists: SPSO recall 0.95); hand-label SPSO (human); route generalist's gating-over-classification flag to backend; Fetch.ai go/no-go (Day 3) | nothing |

---

## Open decisions / watch list

- **Autofill scope** — ✅ **ratified + schema merged to `main`** (`answer`/`open_questions`/`capability_docs`); prompts drafted (`prompts/answer-generation.md`, `prompts/gap-interview.md`). The answer-draft pipeline step is **Day-3** work (generalist + J). **Must not delay the extraction Day-4 gate.**
- **LLM provider** — ✅ **OpenAI** (hackathon OpenAI/Codex credits). Backend extractor defaults to OpenAI when `OPENAI_API_KEY` is set (`LLM_MODEL` default `gpt-4o`); heuristic runs without a key; Claude kept as an alt. Prompts stay provider-agnostic.
- **Sourcing sprint (Day 1, all four)** — grab 10–15 real UK public-sector tenders. ✅ **Hour-one check DONE**: SPSO cleaning ITT sourced + parsed clean (13pp). Use direct-download ITTs (no portal approval) — see [tenders.md](tenders.md). Save PDFs to `data/tenders/` (gitignored). Still want more for the gold set + ugly-tender stress tests.
- **Gold set (by EOD Day 2)** — each person hand-labels ONE tender end-to-end.
- **Fetch.ai stack** — revisit Day 3; only if extraction core is solid + J has slack.

## Recently shipped (newest first)

- **2026-06-29** — J: **backend deployed live to Render** — public API at `https://bidframe-api.onrender.com` (Render Blueprint from `render.yaml`; heuristic extractor, no key needed). Verified end-to-end (`/health` → `{"status":"ok","extractor":"heuristic"}`, `/docs` → 200). Answered frontend's F-003 with the URL + Vercel env step (comms **J-016**); frontend sets `NEXT_PUBLIC_API_BASE_URL` to make the *hosted* demo show live data. Free tier sleeps on idle + SQLite resets on redeploy (fine for demo); auto-upgrades to GPT when `OPENAI_API_KEY` is added in the Render dashboard.
- **2026-06-29** — Generalist: **`engine/` shipped — reconcile/dedupe + eval harness** (pure-Python, **60 tests green**). Conservative AND-gate merge (char-sim + token-Jaccard + page + clause) with anti-transitivity guard + noisy-OR confidence; 6 raw → 5 final on the mock (cross-chunk ISO-9001 dupe merges). Closed reconcile→eval loop scores recall/precision/gating **1.0 on the mock gold**; eval flags missed gating reqs as DANGEROUS (no LLM judge — deterministic, auditable). Signed off the raw-extraction format (G-001). **Then (same day):** ran the full PDF→extract→reconcile→eval loop on real SPSO pp.1-6 (`engine/scripts/run_tender.py`, 64 tests) → **recall 0.95 (18/19), gating recall 1.0, 0 dangerous misses** — the first real headline number.
- **2026-06-28** — Frontend: **applied the locked typeface across the UI** (typography-only pass, shipped via PR). Wired the §11 type system via `next/font`: **Fraunces** headings, **Chillax** body (self-hosted from Fontshare under `src/fonts/`), **IBM Plex Mono** for evidence + source references (page/clause refs, IDs, matrix column headers, kicker labels). Tokens are `--font-head`/`--font-body`/`--font-mono` mapped to Tailwind `font-serif`/`font-sans`/`font-mono`; the six-size scale applied to headings. No colour/layout/motion changes. Build + lint green; `@font-face` + tokens verified in the compiled CSS.
- **2026-06-28** — Frontend: **applied the Bidframe colour system across the UI** (colours-only pass, shipped via PR). The 11 tokens from `design/colours.html` are now Tailwind v4 `@theme` tokens in `globals.css` (brand chrome vs status signal, kept strictly apart); every component moved off the placeholder slate/red/amber/emerald/blue palette. Confidence dot now maps the 4-tier signal scale; gating = oxblood; no off-palette colour or pure white/black surfaces remain. Build + lint green. Type / layout / motion / anti-slop are still to come; the design-system docs + typography specimens are Jawad's in-progress work (not in this PR).
- **2026-06-28** — Frontend: **wired to the live backend** (first frontend↔backend integration; shipped via **PR**, not direct-to-main, for visibility). New `src/lib/api.ts` calls `POST /tenders/upload`, `GET /tenders/{id}/requirements`, `PATCH /requirements/{id}`. Env-driven via `NEXT_PUBLIC_API_BASE_URL` — **mock by default** (deployed demo stays zero-surprises), real data when the env is set (local `:8000` or the Render URL). Upload flow now does a real upload→extract→load into the matrix (with an error state); approve/edit/flag persist via PATCH. Added `frontend/.env.example`. Build + lint green. **Backend API confirmed reachable per `frontend-integration.md`.**
- **2026-06-28** — Frontend: **answer + evidence panel + gap-interview UI** shipped — the auditable-autofill payoff. The requirement drawer now renders each drafted **answer with its capability-doc evidence citations** (filename · page · verbatim excerpt) + visual confidence + inline edit; new **`/answers`** route + nav item is the **gap-interview to-do list** (open questions answerable inline, with an autofill summary + progress bar). Mock enriched with 3 more drafted answers (2 `needs_input` with real open questions). Build + lint green; the matrix visual language is untouched. **Next:** design-system pass + swap to the live backend API (`frontend-integration.md`).
- **2026-06-28** — Frontend: **GitHub auto-deploy wired** — Vercel now builds on every push (the Welddevelopment org couldn't grant the Vercel app, so deploys mirror via a personal `cosmosmarkets/TenderBreak` repo with Root Directory `frontend`). My local `origin` push-mirrors to both the team repo **and** the deploy repo, so one `git push` ships code + triggers the deploy. Team source of truth stays Welddevelopment.
- **2026-06-28** — Frontend: **rebranded UI to Bidframe** (locked Day-1 name) + **mirrored the additive autofill schema** (`answer`/`open_questions`/`capability_docs`) into `types/requirement.ts` with worked mock examples (one auto-drafted answer, one `needs_input` + gap question). Build green; matrix unaffected.
- **2026-06-28** — Frontend: **wireframed + deployed the remaining sections** (separate routes + persistent navbar; source+decision slide-over drawer with approve/edit/flag; gating "deal-breaker" hero; React Flow relationship graph over `criteria_ref` + `depends_on`; drag-drop upload flow). Decisions held in in-memory context (no localStorage, per brief) and survive navigation. Mock enriched (dependency edges + 2 decided sample states). Live on Vercel. **Next:** rebrand UI to Bidframe + mirror the additive autofill schema fields.
- **2026-06-28** — J (covering for backend, with their OK — laptop down till tomorrow): **full backend pipeline built + tested end-to-end** (`backend/app/`: ingest, chunk, extract, pipeline, store, schema, wired endpoints). 20 reqs extracted from SPSO + persisted via API. Pluggable extractor (heuristic now, Claude on key). Frontend can integrate against the real API.
- **2026-06-28** — ✅ **Hour-one parse check PASSED on a real tender** (SPSO cleaning ITT, 13pp clean). Biggest Day-1 engine risk retired. Sourcing log started: [tenders.md](tenders.md).
- **2026-06-28** — J (covering for backend, with their OK): `backend/scripts/parse_check.py` — hour-one tender parseability gate (PyMuPDF→pypdf fallback); added `pymupdf` to requirements. **Tested + working** (installed Python 3.12; clean→PASS, image-only→needs-OCR, no-arg→usage). Fixed a Windows cp1252 emoji crash.
- **2026-06-28** — J: **agent comms channel** (`comms/`) — per-role boards, conflict-free; wired into AGENTS.md + STATUS startup reads. Role table refreshed to real progress.
- **2026-06-28** — Schema extended for autofill (`answer`, `open_questions`, `capability_docs`) — team-confirmed, merged to `main`. Per-lane mirror tasks listed in "The locked contract" above.
- **2026-06-28** — J: **autofill scope decision** + `prompts/answer-generation.md` + `prompts/gap-interview.md` (auditable autofill: grounded per-requirement answers + deduped gap questions). Pending team ratification + schema PR.
- **2026-06-28** — J: v1 extraction + classification prompts (`prompts/extraction.md`, `prompts/classification.md`) — provider-agnostic, recall-first, structured-output schemas inline.
- **2026-06-28** — J: raw-extraction format spec + 6-item mock (`prompts/raw-extraction-format.md`, `prompts/mock-raw-extraction.json`) — backend→generalist contract.
- **2026-06-28** — J: cleaned up stray global config; locked tool name **Bidframe**; created this `STATUS.md`.
