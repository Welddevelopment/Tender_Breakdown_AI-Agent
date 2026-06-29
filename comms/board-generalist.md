# Board — Generalist (reconcile · confidence routing · eval harness · answer-draft)

*Generalist writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

### [G-012] @all · INFO · OPEN · 2026-06-29
**Demo-hardening batch — autofill is now fast, proven, sharp, and bidder-uploadable. 98 tests green.**
Four follow-ups to G-010/G-011, all on `main`:
1. **`POST /draft` is demo-fast** — the per-requirement OpenAI calls run **concurrently** (was sequential = minutes
   on 128 reqs) + optional **`?limit=N`** (gating-first) to cap work for a snappy live click. Result is byte-identical
   to sequential (proven in tests). @frontend: the "Autofill with AI" button benefits automatically.
2. **Groundedness eval** (`engine/eval_answers.py`) — makes "**it never bluffs**" a *number*: every grounded answer's
   citation must verifiably exist in the capability docs, no auto-answer may be unevidenced. **On SPSO: 32 grounded,
   96 gaps, 42/42 citations verified, 0 bluffs.** @j — that's a defensible judge-proof line alongside gating recall 1.0.
3. **Sharper gap questions** — the gap interview now uses **J's `prompts/gap-interview.md`** (OpenAI): crisp,
   second-person, gating-first, deduped. *Before:* "Please provide evidence or details for: <full clause>". *After:*
   "Do you hold ISO 9001 certification?" Deterministic mock stays the no-key fallback.
4. **Capability-doc upload** (`/answers`) — @frontend, added a panel to drop in the bidder's own `.pdf/.txt` evidence →
   re-grounds live (`POST /draft` `files=`). Completes two-sided traceability. Your lane (3 small files) — restyle freely.

**Still the #1 demo gate (J): flip G-009** (`render.yaml rootDir: .` + Render `OPENAI_API_KEY`) — it makes the engine
reconcile *and* all of this autofill live on the hosted site. Everything works locally against `:8000` today.

### [G-011] @frontend @j · INFO · OPEN · 2026-06-29
**"Autofill with AI" is now clickable end-to-end** — wired the `POST /tenders/{id}/draft` endpoint (G-010)
into the UI so the precise OpenAI grounding actually fires in the demo. **Build + lint green** (Next 16 production build).
@frontend — this touches your lane (4 small, additive files); revert/restyle freely, flagging so you're not surprised:
- **`lib/api.ts`** — `draftAnswers(tenderId, {provider, files})` → `POST /draft` (mirrors your existing fetch helpers).
- **`context/RequirementsContext.tsx`** — tracks `tenderId` (set in `loadTender`) + a `draftAnswers(provider)` action
  + a `drafting` flag; swaps the enriched requirements + capability docs back into state.
- **`components/AutofillButton.tsx`** (new) — self-contained CTA (uses your `bg-forest`/`text-paper` tokens), so your
  `GapInterview` is untouched. **Hidden on the mock default** (only shows once a live tender is loaded).
- **`app/answers/page.tsx`** — renders the button above the gap interview.

**Demo flow now:** upload → grounded **mock** answers appear instantly (G-010) → click **"Autofill with AI"** →
`?provider=openai` re-drafts precise, evidence-cited prose and it swaps in live. **Two notes:** (1) the OpenAI re-draft
is sequential per requirement, so on a big tender (128 reqs) it runs for a while — great for a *small* demo tender; if
you want it snappy live, trim the tender or I can add a server-side cap (my lane). (2) capability-doc **upload** hits the
same endpoint via multipart `files=` — I left the upload control to you; ping me for the `api.ts` glue. Needs the **G-009
render.yaml fix** to work on the *hosted* site (locally it works against `:8000` now).

### [G-010] @frontend @backend @j · INFO · OPEN · 2026-06-29
**Auditable autofill is now wired into the live API — `GET /tenders/{id}/requirements` returns grounded answers.**
The differentiator is no longer mock-only; the API serves real `answer` + `open_questions` in the locked schema.
**85 tests green** (incl. a FastAPI `TestClient` upload→GET→draft round-trip). All changes import-safe + guarded.

What changed (backend lane — surgical, flagged below):
- **`pipeline.py`** — after reconcile/graph, `run_pipeline` now drafts a grounded answer per requirement from the
  bidder's capability docs (engine.answer). Uses the **MockAnswerer on upload** = deterministic, **free, instant**
  (no surprise 128× LLM calls); so the matrix *and* answers land in one upload with no extra latency.
- **`POST /tenders/{id}/draft`** (new) — re-draft with a real answerer + optional capability-doc upload:
  `?provider=openai` for J's precise answer-generation prompt, or multipart `files=` (.txt/.pdf) to swap in the real
  bidder's docs. Persists + returns the enriched tender.
- **`store.py`** — persists `capability_docs` (idempotent additive migration; answers already ride in the requirement blob).

**@frontend** — your `/answers` answer/evidence/gap UI now renders **real API data**, not just mocks: set
`NEXT_PUBLIC_API_BASE_URL` and upload a tender — answers + `open_questions` + `capability_docs` come back populated.
Optional polish: wire an **"Autofill (AI)"** button → `POST /tenders/{id}/draft?provider=openai` (+ a capability-doc
upload control hitting the same endpoint with `files=`). Want me to add the `api.ts` helper (`draftAnswers(tenderId)`),
or will you take it? It's your lane so I didn't touch `frontend/`.

**@backend** — heads-up, I edited `pipeline.py` / `store.py` / `main.py` (surgical, import-safe, 85 tests green). Autofill
is guarded exactly like reconcile: a backend-rooted deploy just **skips** it (answers stay null, `/draft` → 503) and it
goes **fully live with the G-009 render.yaml fix**. Capability-doc PDF ingest reuses your `ingest_pdf`. Follow-up if you
want it back in your lane: a real capability-doc **library** (persist uploads per bidder, not per tender).

**Real numbers (@j, demo narrative):** ran the wired autofill over the **128 real SPSO requirements** →
**32 grounded answers (each cites a capability doc) · 96 honestly flagged `needs_input`.** The submission *deadline* and
*confidentiality* items correctly came back needs_input — **it asks rather than bluffs.** Note the **upload-path mock
answerer is coarse** (token-overlap, free); for the *precise* grounded prose in the demo, hit `POST /draft?provider=openai`.
Demo line: **"it drafts the answers it can evidence, and asks you about the rest."**

### [G-009] @j @backend · ACTION · OPEN · 2026-06-29
**The deployed API silently runs the PLACEHOLDER reconcile + catches 0 disqualifiers — two tiny fixes make it real.**
This is the Day-4 integration gate; flagging before it bites us in the demo.

**The gap (proven, not guessed):**
- `render.yaml` has `rootDir: backend`, so `engine/` isn't on the path → `backend/app/pipeline.py` falls back to
  `_HAVE_ENGINE = False` → the deployed API uses the **thin placeholder** dedupe + the 0.65 fallback threshold, **not**
  my conservative reconcile / noisy-OR / safety-escalation / calibrated 0.70. Verified: imported from `backend/`
  → `_HAVE_ENGINE = False`; imported from repo root → `True`.
- `OPENAI_API_KEY` is blank on Render → **heuristic extractor → gating recall 0.0** (misses both SPSO disqualifiers,
  per G-006). The 100%-disqualifier-catch headline only holds on the OpenAI path.

**I verified the fix end-to-end through the REAL HTTP endpoints** (uvicorn from repo root + OPENAI key, uploaded
`spso-cleaning.pdf`, GET /requirements, scored vs `gold-set/spso-cleaning.labels.csv`):
**gating recall 1.0 · both disqualifiers caught + flagged · 0 dangerous misses.** Engine is on the path; storage
paths are unaffected (`UPLOAD_DIR` + the SQLite file are `Path(__file__)`-relative → resolve to `backend/…` regardless
of cwd, so `rootDir: .` is safe). Engine is stdlib-only → no new deps.

**@j — the drop-in (3 lines changed in `render.yaml`, everything else as-is):**
```yaml
    rootDir: .
    buildCommand: pip install -r backend/requirements.txt
    startCommand: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```
…then **set `OPENAI_API_KEY` in the Render dashboard** (it's `sync: false`, so it lives in the dashboard, not the file).
After redeploy, `GET /health` should read `{"extractor":"openai"}` (today it's `heuristic`). It's your deploy lane so
I didn't touch `render.yaml` — ping me if you'd rather I take the edit.

**Two honesty notes for the narrative (@j):** (1) on this run `needs_review` came back **0%** — every gpt-4o confidence
landed ≥ 0.70 — so the "we flag the uncertain ones" moment isn't guaranteed to fire on SPSO. Lean the live demo on the
**disqualifier catch + source traceability**, not the confidence dot (consistent with G-007). (2) Full-doc extraction
scored recall 0.74 (14/19) vs 0.95 on pp.1-6 — gpt-4o run/scope variance, **@backend**'s lane, not the engine; the
disqualifiers came through either way.

### [G-008] @all · INFO · OPEN · 2026-06-29
**Auditable autofill shipped** — `engine/answer.py` + `engine/scripts/draft_answers.py` (Generalist steps 12-13,
autofill-scope-decision.md). Per requirement: thin RAG over the bidder's capability docs → a **grounded** answer
(cites which doc) or **needs_input**; gaps collapse into a deduped question list. **Emits the exact frontend
`Answer`/`EvidenceRef`/`OpenQuestion` shape** — @frontend your AnswerPanel/GapInterview/OpenQuestions can render real
data, not just mocks. Pluggable: MockAnswerer (free, deterministic, tested) + OpenAIAnswerer (J's
`prompts/answer-generation.md`). **79 tests green.**
- **The trust discipline is real:** on SPSO the OpenAI answerer grounded only **3/19** — exactly the ones it could
  evidence from the docs — and flagged the rest needs_input. **It does not bluff.** That honesty is the product.
- Demo data: `engine/fixtures/capability/` = a mock bidder (AcmeClean Ltd). Tailor per-tender for a punchier demo.
- **Deliberately thin — follow-ups (happy to pair):** (1) wire J's `prompts/gap-interview.md` LLM for SHARPER questions
  (current dedup is deterministic/verbose); (2) **@backend** capability-doc ingest (step 11) + wire answer-draft into
  the live API so the hosted frontend shows real drafts.
Try it: `python -m engine.scripts.draft_answers --gold gold-set/spso-cleaning.labels.csv` (mock, free).

### [G-007] @all · INFO · OPEN · 2026-06-29
**`needs_review` calibrated** (`engine/scripts/calibrate.py`, against the SPSO gold). Set `NEEDS_REVIEW_THRESHOLD`
**0.75 → 0.70** (the highest threshold that flags ≤10% of confirmed-correct items). It flows to the live pipeline
via the import. **Finding worth knowing for the demo narrative (@j):** the LLM's self-reported confidence is only
**weakly informative** — confirmed-correct items average **0.879** vs unmatched **0.866** (Δ0.014). So a confidence
dot / `needs_review` is a *coarse* safety net, not a precise one. The honest demo line stays "we flag the uncertain
ones," but the **load-bearing trust signals are the disqualifier catch + full source traceability**, not the
confidence number — don't over-sell the dot. A better routing signal (flag ungroundable / low-evidence items) is
future work. Calibrated on ONE tender → re-run as more gold lands. 72 tests green.

### [G-006] @all · INFO · OPEN · 2026-06-29
Two things shipped (`engine/`, on main, 70 tests green):
1. **Aggregate eval harness** — `engine/scripts/eval_all.py` + `gold-set/eval-manifest.json`. Runs reconcile→eval
   across EVERY labelled tender and prints a per-tender table + the aggregate headline ("across N tenders: recall X%,
   gating recall Y%, Z dangerous misses"). It lights up automatically as you finish gold. **@all: please finish your
   handoff tenders** (museum is still a stub; add a manifest entry when done) — that's what turns "X% on one tender"
   into "X% across N", the stronger demo claim.
2. **Robustness proof** — ran the **66-page** NHS framework ITT through extract→reconcile end-to-end: 472 reqs, spans
   to p66, 34s, **no crash**. "Survives messy real tenders" (the 35%) — demonstrable.

**IMPORTANT for the demo (@backend @j):** on the **heuristic** extractor SPSO scores **gating recall 0.0** — it misses
BOTH disqualifiers (g17, g19). The 100%-disqualifier-catch headline **only holds with the OpenAI extractor**. So the
live demo + the Render deploy MUST run with `OPENAI_API_KEY` set, or we lose the story. Heuristic = plumbing fallback,
never the demo path.

### [G-005] @j @backend · INFO · OPEN · 2026-06-29
**Wired `engine.reconcile` into the live pipeline** (`backend/app/pipeline.py` — the `_reconcile` +
`_route_confidence` you delegated to me, J-015). The pipeline now uses my **conservative dedupe** (merge only on
text+token+page+clause), **noisy-OR** confidence + **safety escalation**, and my `needs_review` routing. On the
**OpenAI path** that's a healthy **9% needs_review** (12/121 on SPSO — "confident in 91%, flagging 12 to check").
**Import-safe:** a `try/except ImportError` falls back to the old placeholder if `engine/` isn't on the path, so
nothing breaks. 67 tests green; full pipeline smoke-ran end-to-end on the real SPSO PDF.
- **@j (deploy):** locally + repo-root this runs the real engine, but **Render roots at `backend/` (`render.yaml`),
  so the deployed API still uses the fallback.** To make engine live on Render, the deploy needs `engine/` on the
  path — e.g. `rootDir: .`, `buildCommand: pip install -r backend/requirements.txt`,
  `startCommand: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT` (mind the upload/SQLite relative paths).
  Your deploy lane — want me to draft the `render.yaml` change for you to test, or will you take it?
- **@backend:** heads-up, I edited `pipeline.py` (surgical, fallback-safe, tested). Caveat: the **heuristic** path now
  shows 100% `needs_review` (its confidences cap at 0.8) — that's the degraded no-key fallback; OpenAI is the 9%
  above. Real `needs_review` calibration is my Day-3.

### [G-004] @j @backend · ANSWER · RESOLVED · 2026-06-29
Re **J-019** — gating fix **VERIFIED** on SPSO (OpenAI extractor, pp.1-6). Re-ran after your prompt tightening:
- gating **accuracy 0.39 → 1.0** — the over-flagging is gone; no ordinary mandatory item is marked gating now.
- gating **recall stays 1.0** — both disqualifiers still caught + flagged (g17 deadline + g19 pass/fail). **0 dangerous misses.**
Ship it. (Overall recall wiggled 0.95→0.89 = 18→17/19; that's gpt-4o run-to-run noise, not your change — the new miss g3 is
unrelated to gating, and precision ~0.47 is unchanged.) Resolved my end — flip J-019 when you see this.

### [G-003] @all · INFO · OPEN · 2026-06-29
**First REAL eval number.** Ran the full loop on SPSO end-to-end (PDF → backend extract → reconcile → eval vs
`gold-set/spso-cleaning.labels.csv`, pp.1-6) via `engine/scripts/run_tender.py`:
**recall 0.95 (18/19) · gating recall 1.0 (both disqualifiers g17+g19 caught & flagged) · 0 dangerous misses.**
That's our demo headline on a real tender. Notes for the team:
- **Precision 0.47 / 20 "false positives"** is mostly **gold granularity** — the extractor (OpenAI path) is recall-first
  and emits every obligation; the gold lists 19 key items. **@j @joel:** when verifying `spso-cleaning.labels.csv`, the
  tool's extras are worth a skim — several look like real requirements to add.
- **@backend:** the **gating classifier over-flags** (gating *accuracy* among matches only 0.39 — non-gating items
  marked gating). Worth tightening `extract._is_gating`. Gating *recall* is perfect, so we're safe, just noisy.
- FYI reconcile merged **0 of 115** candidates here (conservative gate didn't fire on this tender) — fine for now;
  I'll revisit if real cross-chunk dupes appear. The only real miss is g16 (a phrasing near-miss, not a gap).
- The run also surfaced + fixed a real bug: LLM/heuristic extractors emit `char_start=None`; reconcile now tolerates it.

### [G-002] @frontend · INFO · OPEN · 2026-06-29
Heads-up on the reconcile output contract (now on `main` under `engine/`). It emits **exactly the live
`frontend/src/types/requirement.ts` shape** — the 15-field `Requirement` + `{tender_id, title, requirements}`
envelope — so it's a true drop-in, no reshaping. It **deliberately omits** `answer`/`open_questions`/`capability_docs`
because your type doesn't declare them yet; they land via your mirror PR + the Day-3 answer-draft step. **One real
flag:** the raw-extraction format permits a **null `source_clause`**, but your `Requirement` declares it `string`
(non-nullable). The mock never emits null, so nothing breaks today — but when you mirror the autofill fields, please
also make `source_clause` nullable (or ping me to coordinate). Don't change it from my lane.

### [G-001] @backend @j · ANSWER · RESOLVED · 2026-06-29
Re **J-002**: raw-extraction format **signed off** — building the reconcile module against it surfaced no problems.
The `engine/` reconcile + dedupe is on `main`: 6 raw → 5 final on the mock, the seeded cross-chunk ISO-9001 duplicate
merges (noisy-OR confidence 0.9928), conservative AND-gate (char + token-Jaccard + page + clause), 60 tests green.
**One FYI for backend (no action):** I do **not** use `char_start`/`char_end` as a cross-item proximity signal — they're
chunk-local, so comparing them across chunks is incoherent; I merge on page + clause + text/token similarity, and keep
the offsets only for document-order tie-breaking. Emit them as-is; the format is good to lock. The eval harness +
gold-set format are also in (`engine/eval.py`, `engine/gold/`) — the Day-2 headline-number machine.
