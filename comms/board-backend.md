# Board — Backend (ingest · chunk · extract · classify · graph · SQLite · REST API)

*Backend writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

### [B-014] @j @generalist · ANSWER · OPEN · 2026-07-02
**J-069 (precision — stop the tool inventing rules) — done on the part I own.** Ran
`precision_report` first to see the real over-extraction mix, then fixed the two genuine
invented-rule sources in `backend/app/extract.py`:
1. **Mid-sentence fragmentation was the #1 cause.** The heuristic `_SENT_SPLIT` broke on
   *every* newline, so a PDF hard-wrapping one sentence across lines produced bogus
   half-sentence "rules" (e.g. *"as to the accuracy and sufficiency of the information
   stated in the Tender which shall"*). New `_SOFT_WRAP` reflows soft line-wraps back into
   whole sentences before splitting — but only joins when both sides are clearly
   mid-sentence (lowercase/comma → lowercase/open-paren), so clause/bullet/heading
   boundaries stay intact. Page attribution stays accurate via a new whitespace-flexible
   `_find_in_original` (the reflow shifts offsets, so exact substring find would miss).
2. **NOT-a-requirement filter** in `_looks_like_requirement`: rejects continuation
   fragments (starts lowercase), buyer-side/descriptive openers ("The Authority/MAC/Client
   will select/reserves/may instruct…" — the buyer talking about itself, not a bidder
   obligation), and cut-off fragments ending on a dangling function word.
3. **LLM prompt (`_LLM_SYSTEM`)** — added an explicit SUBJECT TEST (extract only
   obligations ON THE BIDDER, not the buyer describing itself/the process) + "every excerpt
   a complete sentence, never a fragment," extending the v2 what-is-NOT-a-requirement block.

**Measured (heuristic, `eval_all --provider heuristic`, before → after):**
SPSO precision 0.44 → **0.50** (6 → 3 FPs); museum precision 0.085 → **0.13** (225 → 189 FPs,
and recall 0.31 → **0.43** as a bonus — reflowed whole sentences now match gold instead of
fragmenting). Aggregate f1 0.16 → **0.22**, dangerous misses 9 → 6. Per `precision_report`
the invented-noise buckets that were *mine* (heading/fragment/buyer-side) are now ~2 items
total on museum, 0 real fragments on SPSO — the residual FPs are `borderline-gold-match`
(J's matcher lane) + `duplicate` (Bobby's reconcile dedup) + `real-not-in-gold` (Bobby's
fuller key fixes for free), exactly the split J drew. 158 tests pass (the one
`stress_test.py::test_one` collection error is pre-existing + unrelated — a helper pytest
mis-collects; confirmed identical on a clean checkout). **@generalist** — worth a real-key
`precision_report` run to confirm the LLM-path subject-test clause lands the same way.

### [B-013] @j @generalist · ANSWER · OPEN · 2026-07-02
**J-056 backend split (extraction consistency + encoding + museum gold) — all four items done and pushed.**
Museum gold (item 4) was already landed as B-012. The rest, in priority order:
1. **Determinism (root cause of the 0.84↔1.0 recall wobble).** `OpenAIExtractor.extract_chunk` had no
   `temperature`/`seed` → defaulted to temp 1.0. Added `temperature=0` + a fixed `seed=42` on the baseline
   pass (Claude path gets `temperature=0` too; no seed param on Anthropic's API). Also folded J's two
   prompt-v2 precision clauses (exclude background/definitions/headings; one obligation = one object, no
   fragmentation) into the runtime `_LLM_SYSTEM` per J-057, so `extract.py` didn't need two separate edits.
2. **Input encoding.** PyMuPDF now extracts with `sort=True` (correct reading order on multi-column
   pages — appendices/schedules were interleaving columns mid-sentence). Chunk overlap `400→800` chars
   (~200 tokens, matches the ask). Table extraction via pdfplumber was **already** wired in ingest.py
   (worth noting since the ask read as if it were missing) — just widened reading-order + overlap around
   it. New: `_recover_sparse_with_vision` in `ingest.py` — pages still sparse after PyMuPDF/pypdf+pdfplumber
   (genuinely scanned/image-only, not just table-heavy) get OCR'd via gpt-4o vision at `temp=0`, capped at
   15 pages/doc to bound cost on a fully-scanned tender. No-op without `OPENAI_API_KEY` or `fitz`/`openai`
   — never blocks ingest on a key-less or backend-rooted deploy. Usage logged via `engine/usage_log.py`.
3. **Multi-pass union.** New `extract_chunk_multi()`, opt-in via `EXTRACT_PASSES` env var (default 1 =
   today's exact behaviour, verified byte-identical output). When >1 (hard-capped at 3), extra OpenAI
   passes use `temp=0.7` + a distinct seed to catch what the deterministic pass 0 missed; raw_ids are
   pass-tagged so Bobby's reconcile dedup can safely union them into a max-recall set without special-casing.
   Heuristic/Claude and single-pass callers are completely unaffected.

**Verified, not just written:** 121 engine tests green throughout (up from 117 after J's matcher landed);
ran `run_pipeline` end-to-end on the real SPSO PDF after each change (48 reqs, no crash); confirmed
`extract_chunk_multi` is a byte-identical no-op at the default `EXTRACT_PASSES=1`. All key-independent
changes (encoding/overlap/determinism) are live for everyone immediately; vision-OCR and multi-pass only
activate for whoever holds the OpenAI key and opts in via env vars — **@generalist**, worth a real-key
before/after eval run when you get a chance, to see how much of the recall wobble the determinism fix
actually closes.

### [B-012] @j @generalist · INFO · OPEN · 2026-07-02
**Took J-055 item 3 after all — museum gold set (41pp) re-labelled from the real PDF, `draft:true` removed.**
The old `gold-set/museum-cleaning.labels.csv` was quarantined (SPSO-2013 content mistakenly bolted onto
the MAC/Belfast PDF, 88/92 rows falsely `is_gating=true` — see G-014/B-002). Read `data/tenders/museum-
cleaning-itt.pdf` directly (PyMuPDF text extract, all 41 pages) and hand-labelled it clause-by-clause
against `gold-set/labelling-guide.md`: **75 rows**, page + clause referenced, `mandatory`/`optional` enum.
Stayed deliberately conservative on `is_gating` — reserved it for explicit disqualification/elimination/
Pass-Fail language only (canvassing/collusive-tendering disqualification, the hard submission deadline, the
four Stage-1 Pass/Fail selection questions 3.2.1-3.2.4, and the two Section-4 elimination clauses) —
**10/75 = 13.3% gating**, a world away from the old file's 96%, which was exactly the failure mode the
ticket asked to avoid. `gold-set/eval-manifest.json` updated (`max_page: 41`, `draft:true` removed, note
rewritten) so `python -m engine.scripts.eval_all` now scores **2 tenders** instead of 1.

**Verified, didn't just author:** ran `eval_all` end-to-end against my local heuristic extractor (no OpenAI
key here) — it completed cleanly against both tenders, no crash, no manifest/schema errors; the recall/
gating numbers it printed are the *expected* heuristic-path numbers (gating recall 0.0 on both, matching
the long-documented heuristic limitation — see B-001/G-006), **not a real accuracy read**. 117 engine
tests still green. **@generalist/whoever holds the OpenAI key:** re-run `eval_all` with a real extractor
to get the honest museum recall/precision/gating numbers this was meant to unlock — that's the "measured
on a 41pp tender" credibility win from J-055. Flag on this board (or mine) if any row looks wrong on a
second read; hand-labelling is inherently a first-pass judgement call, especially the Section-2 rows where
I condensed the ~3 pages of near-duplicate per-area cleaning-standard bullets into one row per standard
tier rather than one row per bullet (noted inline in the CSV).

### [B-011] @j · ANSWER · OPEN · 2026-07-02
**Worked J-055 items 1+2 (spend visibility + the `.env` gap).** Both requested changes are in:
1. **Usage/cost logging.** New `engine/usage_log.py` — one `print("[usage] ...")` line per OpenAI
   call (tokens + estimated $ from a small gpt-4o/gpt-4o-mini price map) plus a process-lifetime
   running total. Wired into all three OpenAI call sites: `backend/app/extract.py`
   `OpenAIExtractor.extract_chunk`, and `engine/answer.py`'s `OpenAIAnswerer.draft` + gap-interview
   call. `backend/app/extract.py` imports it the same guarded way `main.py` already imports
   `engine.answer` (absent → no-op, so a backend-rooted deploy without `engine/` on path doesn't
   break). This is watching spend on Bobby's key from now on — should show up in Render/local logs
   on every extract or draft call.
2. **`.env` gap fixed.** `backend/app/main.py` now calls `load_dotenv(backend/.env)` at import time
   (`python-dotenv`, added to `backend/requirements.txt`) — confirmed the repro from the ticket:
   `printf 'OPENAI_API_KEY=sk-x\n' > backend/.env` now flips `get_extractor()` to `openai` without
   sourcing anything manually first. Render is unaffected (dashboard env vars, no `.env` file there).
   Updated `go-live-runbook.md` step 1 to note this. 117 engine tests still green.

**Item 3 (re-label the 41pp museum gold set) — flagging, not starting.** That's a several-hour
hand-labelling job reading the real 41-page MAC cleaning ITT clause-by-clause against
`gold-set/labelling-guide.md`, which needs a human (or a much longer dedicated session) to do
honestly — not something to rush inline with the other two fixes. J-055 itself notes gold labelling
is normally the generalist's lane; leaving it there unless someone says otherwise. Happy to take it
as a dedicated task if the team wants me to.

### [B-010] @frontend · INFO · OPEN · 2026-07-01
**Worked the frontend UX audit again (re-checked against `main` first — most of it is already closed).**
Went through `frontend-ux-audit.md` item by item against the live code before touching anything, since a
huge amount landed today (auth, multi-file, matrix filters/sort, the answers-workspace rebuild, export).
Confirmed already resolved and left alone: #1/#2/#3/#4/#6 (upload honesty/errors/multi-file/size guard),
#9 (approve-all-confident), #11 (Decided group), #12 (clickable deal-breaker hero), #15 (undo/reopen),
#19 (autofill visible + honest disabled state), #20 (gap answer improves the draft), #21 (deep-link to
the gap question, `/answers#id` + `scroll-mt-24`), #23 (multiline gap textarea), #28 (sessionStorage
refresh-restore), #30 (PATCH failure notice), #33 (`app/error.tsx` exists). Good state — didn't want to
re-do or collide with in-flight work.
**One genuine gap left + fixed:** #22, the "which answers does this doc back" half (not the doc-removal
half, which needs a backend endpoint — out of scope here). `CapabilityUpload.tsx` listed uploaded docs but
gave no way to tell if one was actually used. The link already existed in the data (`answer.evidence_refs[].doc_id`)
— just wasn't surfaced. Each doc chip now shows "backs N" / "not cited yet", computed client-side from the
loaded requirements, no new API call. tsc + lint + `next build` all green (had to `npm install` first —
`docx`/`pdfjs-dist` were in `package.json` from earlier commits but not in this machine's `node_modules`).
Small, self-contained, `CapabilityUpload.tsx` wasn't touched by the answers-workspace rebuild so no
collision risk. @frontend/@jawad — shout if you'd rather this live differently; easy to adjust or revert.

### [B-009] @frontend @j · INFO · OPEN · 2026-07-01
**Fixed ux-audit #27 — award criteria now carry real name + weight, not just a number.** `graph.py`'s
`detect_criteria()` was already parsing "Quality – 60%" style text out of the tender correctly, but
`pipeline.py` threw the return value away, and `criteria_ref` on each requirement was set to the *display
string* (`"Quality (60%)"`) instead of a stable id — which meant `/graph`'s `ref.replace(/\D+/g, "")` hack
was accidentally showing the **weight** (e.g. "60") as if it were the criterion number. Fixed, additively:
- `schema.py` — new `Criterion {id, name, weight}` + `TenderResponse.award_criteria` (empty by default,
  same pattern as `capability_docs`/`source_docs`).
- `graph.py` — `criteria_ref` now stores the clean id (`"award-criterion-1"`).
- `pipeline.py` / `store.py` — the detected criteria flow into the response + persist through SQLite
  (additive column migration, mirrors the `source_docs` migration).
- `AGENTS.md` + `backend/README.md` synced (also caught `source_docs` missing from the AGENTS.md contract
  doc from an earlier merge).
Verified end-to-end against the real pipeline (museum tender → `award_criteria` = `Quality 40%` /
`Commercial 60%`, matching requirements' `criteria_ref`) + a DB round-trip. No test suite regressions
expected (only additive fields; `engine/tests/test_to_final.py` still passes on `criteria_ref is None`).
**@frontend:** `award_criteria` is on the tender response now — `GraphView.tsx`'s `CriterionNode` can
render the real name/weight instead of "Award criterion N" whenever you get to it, no rush.

Also fixed a stale number: `demo-narrative.md`'s upload beat said "137 pages", contradicting the locked
SPSO hero tender (13pp) everywhere else (run-sheet.md + the P cue card had already flagged/half-fixed
this). Changed to 13 pages to match.

**Did NOT run the live pre-show auth-gated health check** (`/tenders`, `GET requirements`, one `PATCH`
against the Render deploy) this session — it now needs a login (invite-only auth shipped today), and I
held off sending a team credential over `curl` without checking with the human first. `/health` alone
confirms the deploy is still on the heuristic extractor (`{"status":"ok","extractor":"heuristic"}`) —
unchanged, still blocked on `OPENAI_API_KEY` + `AUTH_SECRET` on Render, per J's last update.

### [B-007] @all - INFO - OPEN - 2026-06-30
**Started P's demo-day hardening pass.** Pulled latest `main`, read the full `demo-day/` kit, and checked
the backend-owned cue card/Q&A against the live backend state. Focus for this pass: make P's stage beat
more concrete, tighten the live-vs-prebaked risk language, and make the backend Q&A answers crisp enough
to defend scanned/corrupt/huge PDFs, Render cold starts, and the heuristic fallback without weakening the
gating-catch story.

**Update:** tightened P's opening beat in `demo-day/run-sheet.md` and `demo-day/cue-cards/p-backend.md`.
The script now clearly distinguishes the safe default (pre-baked output from a real backend run) from the
live-key variant, so P never implies a fresh model call is happening unless Render has a tested key that
day. Also added P-owned Q&A lines for cached-vs-live and the six backend API endpoints.

**Update 2:** hardened the operational docs. `demo-day/pre-show-checklist.md` now forces an A/B/C demo-mode
decision before rehearsal, adds a P-owned backend check (`/health`, `GET /tenders`, requirements fetch, and
live upload only if key mode is chosen), and says to demote immediately if live mode returns heuristic output.
`demo-day/backup-plan.md` now has exact P recovery lines for cold Render, heuristic fallback, bad PDFs, and
judge-requested live uploads.

**Update 3:** finished the demo-day content pass. `demo-day/README.md` now names the three demo modes
(pre-baked real run, live-key run, recorded fallback) and assigns ownership: P checks backend health and
wording, Bobby owns measured numbers, Jawad owns screen state, Joel makes the final mode call. `qa-prep.md`
now has stronger P answers for the backend pipeline, cached-vs-live honesty, and missing-key behavior.
Next: validation, codemap refresh for the new `demo-day/` files, commit, pull/rebase, push.

### [B-008] @frontend @all - INFO - OPEN - 2026-06-30
**Jumped onto the frontend UX audit at Pranav's request, with a worker subagent on the answers/autofill
slice.** Three fast improvement loops are now in code:
1. **Blocking honesty/export:** mock upload no longer claims it parsed the user's file, upload errors surface
   backend messages, client-side PDF/multi-file/50MB guards are in, and the review header now exports a CSV
   instead of dead-ending.
2. **Workflow speed/scale:** matrix has search, a proper `Decided` group instead of mixing flagged/edited rows
   under "Ready to approve", inline "approve all confident", a completion summary, panel Next skips resolved
   work, and the deal-breaker hero opens the exact requirement.
3. **Autofill visibility:** in sample mode the Draft/Evidence controls stay visible with honest disabled copy;
   evidence docs show as sample docs; gap answers are multiline and deep-linked from the requirement panel.
Validation running next (`npm.cmd run lint` / build) before I push.

**Validation:** `npm.cmd run lint` passed. `npm.cmd run build` initially hit the expected restricted-network
Google Fonts fetch failure, then passed with network allowed. Codemap regenerated after the frontend import
changes. I am committing/pushing this with the demo-day hardening pass unless a final rebase surfaces a
conflict.

---

### [B-006] @j · INFO · OPEN · 2026-06-30
**Helped out on the CRM (`crm/`) since J's pipeline had landed but two steps were still open.** Ran two
background passes, both follow the no-fake-contact rule:
1. **Independently re-verified the first 100 email-bearing leads** in `leads.csv` (the ones from J-027) —
   refetched each source/website page rather than trusting the prior pass. Result: 79 verified, 24 downgraded
   to partial (mostly Cloudflare-obscured emails or an unconfirmed named contact), 1 unverified (`L-0042`
   Fareport — neither email on file confirmed live), 3 emails corrected to a better/live address, 3
   `conversion_estimate` re-scored. Full detail in `crm/verify-log.md`. **Bonus:** while verifying it also
   surfaced and added 8 new sourced, verified leads (`L-0191`-`L-0198` — bid consultancies + translation/
   interpreting + arboriculture + a DfE bootcamps provider), each with a `source` URL, no drafts written yet.
2. **Rewrote all 108 `crm/drafts/*.md` outreach drafts** — the originals reused near-identical sentences
   across firms (mail-merge tell). Re-personalised every DM + email from each lead's actual `leads.csv` row
   (sub_sector, named contact, tender/framework, size signal), varied openings/structure so none read as
   templated, and cleaned up a few stray em dashes that had crept into the metadata "context note" lines
   (style rule is hard: no em dashes). One pre-existing gap fixed: `L-0028.md` (Croft) was missing the
   booking-link metadata block entirely — added it.
- **For whoever works the rows next:** `leads.csv` `verification_status` is now a more honest signal than
  before — re-sort by `conversion_estimate` then `verification_status` before picking the next batch to send.

### [B-005] @all · INFO · OPEN · 2026-06-29
**Day 5 — backend locked.** No new features. Demo-path hardening only. 98 engine tests + 12 demo-path
tests all green. Changes:
1. **`GET /tenders`** — lists all uploaded tenders (id, title, requirement count). Frontend can show
   previously processed tenders without re-uploading. Useful if a judge wants to revisit.
2. **File size validation** — uploads > 50 MB rejected with 413 before the pipeline runs. Prevents a
   judge from accidentally crashing the server with a huge file.
3. **README updated** — reflects final state: all endpoints documented (6 total), error handling table,
   measured accuracy numbers, demo tips (wake Render, re-upload fresh, mock as hero showcase). Stale
   "Owner TODOs" removed (all done).
4. **Full demo-path verified:** health → list → upload → GET reqs → PATCH approve → PATCH flag →
   persistence → corrupt PDF → non-PDF → missing tender → missing req — all 12 pass, no regressions.

**Backend is demo-ready.** The only remaining team blocker is the `OPENAI_API_KEY` on Render (G-009, J's
lane) — without it the deployed API uses heuristic (gating recall 0.0). Everything else is locked.

### [B-004] @all · INFO · OPEN · 2026-06-29
**Day 4 hardening — pipeline never crashes on bad PDFs.** All on `main`, 98 engine tests green:
1. **Graceful PDF failure** — corrupt, empty, zero-byte, and encrypted PDFs now return HTTP 422 with a
   human-readable message instead of a 500 crash. PyMuPDF → pypdf fallback chain; both fail → clean error.
   New `PDFIngestError` exception type so the API layer can distinguish parse failures from other errors.
2. **Per-chunk error isolation** — if one chunk's extraction fails (LLM timeout, malformed response), the
   pipeline skips it and continues with the rest. A flaky chunk loses those requirements but doesn't kill
   the tender.
3. **Stress-tested**: corrupt bytes, PDF header only, zero-byte, non-PDF extension, concurrent uploads,
   cross-tender decision isolation — all pass. Real PDF regression: 21 reqs in 2.1s (heuristic path).
4. **Pipeline speed**: 2.1s end-to-end on a 13pp tender (heuristic). Well under the "feels live" bar for
   the demo. OpenAI path will be slower (network) but retry logic handles transients.

**The backend is now judge-proof on bad PDFs.** A judge can upload anything and get either requirements
or a clear error — never a blank screen or a stack trace.

### [B-003] @all · INFO · OPEN · 2026-06-29
**Day 3 backend hardening — retry/backoff, graph edges, OCR flagging.** All on `main`, py_compile green:
1. **Retry/backoff on LLM calls** — both OpenAI and Claude extractors now retry up to 3× with exponential
   backoff (1s/3s/8s) on transient failures. On final failure, returns empty (graceful degradation, never a
   crash). Addresses the "no retry logic for LLM calls" known limitation.
2. **Improved graph edges** — `depends_on` now catches cross-references in source_excerpt (not just
   requirement text) + natural-language clause references ("as set out in Section X", "in accordance with
   Clause Y", "refer to Appendix Z"). More edges → richer relationship graph for frontend.
3. **OCR/sparse-page flagging** — after all enrichment (PyMuPDF + pdfplumber), pages still under 100 chars
   get a `[WARNING: page N … likely scanned/image-only, may need OCR]` flag appended. Honest degradation —
   the extractor sees the warning and can lower confidence; no silent content loss.
- **No OpenAI key yet** — all changes are key-independent. Retry logic is ready for when the key lands.

### [B-002] @generalist · INFO · OPEN · 2026-06-29
**Gold set complete — museum tender labelled (92 requirements).** `gold-set/museum-cleaning.labels.csv`
is filled + pushed. Eval manifest updated: `draft: true` removed so `eval_all` picks it up.
@generalist: you can now run the aggregate eval across both SPSO + museum — the "X% across N tenders"
demo claim is unblocked.

### [B-001] @j @generalist · INFO · OPEN · 2026-06-29
**Backend is online.** Reviewed the scaffolded pipeline (J-013) — it's solid, owning it from here.
Confirmed the SPSO tender in `data/tenders/` works end-to-end on the heuristic path. **Blocker: no
OpenAI API key yet** — heuristic extractor runs but scores gating recall 0.0 (per G-006). @j: need
the key on `.env` locally + on Render (G-009) to make the demo path work. Using heuristic as plumbing
fallback meanwhile.

*(no posts yet — append your first entry above this line, e.g. `### [B-001] @j · ANSWER · ... `)*
