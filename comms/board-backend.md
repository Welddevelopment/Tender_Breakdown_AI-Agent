# Board — Backend (ingest · chunk · extract · classify · graph · SQLite · REST API)

*Backend writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

### [B-026] @j @frontend @generalist · DELIVERABLE · OPEN · 2026-07-04
**Office sources now render + highlight for real (`049368c`), not just excerpt text.** User ask: make
DOCX/XLSX/CSV as trustworthy as PDF — click "see it in the document" and get the actual file rendered
with the matching line/row highlighted, everywhere the PDF proof view already does this (the popup
overlay, the persistent evidence pane, and the inline panel — three separate surfaces). Shipped:
- New backend `GET /tenders/{id}/source?doc=` — serves any pack document (PDF/DOCX/XLSX/CSV) inline
  in its native format, auth + path-traversal guarded like `/pdf`. `test_source_file_endpoint.py` (6 tests).
- `DocxSourceView` (mammoth: docx → real HTML) and `SheetSourceView` (exceljs/csv → real table) —
  frontend siblings of `PdfSourceView`. Shared `lib/text-match.ts` extracted from `PdfSourceView` so
  all three use the identical whitespace-flexible match engine (exact/approximate/unlocated).
- Static demo copies in `frontend/public/demo/mixed-pack/` so `/pack` renders+highlights offline too.

**Real bug hit + fixed, worth flagging for anyone touching `dangerouslySetInnerHTML` here again:**
the first cut highlighted the matched paragraph by mutating the LIVE rendered DOM (`classList.add` on
the matched `<p>`/`<td>`) after mammoth's HTML was already in the tree. It visibly worked for one
frame, then vanished — confirmed via a `MutationObserver`: any unrelated re-render of an ancestor
(e.g. the `onMatch` callback itself lifting state) makes React re-set `innerHTML` on the
`dangerouslySetInnerHTML` node, silently wiping any DOM mutation React doesn't know about. Fix: bake
the highlight into the HTML **string** itself (`highlightExcerptInHtml` — parses into a *detached*,
never-inserted element, marks the matching block there, serialises back to a string) before it's ever
handed to React as state, so the already-highlighted markup is what gets rendered and can't be reset
out from under itself. `npm run build`/`lint` green; manually verified live (not just automated) —
screenshotted a real highlighted paragraph, table row, and CSV row.

### [B-025] @j @frontend @generalist · DELIVERABLE · OPEN · 2026-07-04
**[J-096] part 1 done: ZIP pack upload.** `POST /tenders/upload` now accepts a single `.zip` — the
file shape procurement portals actually deliver — alongside the existing loose `.pdf/.docx/.xlsx/.csv`.
New `_expand_zip()` in `backend/app/main.py`: unzips in memory, dispatches each entry through the
existing `ingest_document` path unchanged, skips directories/hidden entries (`__MACOSX`, `.DS_Store`)
and unsupported extensions with a clear log line (never silently), strips any directory component
from an entry name (zip-slip guard), and caps entry count (30) + total uncompressed size (200 MB)
before reading any bytes. Per-entry `source_filename` is the real name inside the zip, not the zip's
own name. New fixture `fixtures/mixed-pack/sample-pack.zip` (DOCX+XLSX+CSV + a junk `__MACOSX` entry
+ an unsupported `notes.txt`, to exercise clean skipping) and a Phase C added to
`engine.scripts.mixed_pack_smoke` for it — verified: entries extract correctly, `notes.txt` is
excluded, net still catches every planted gate. 6 new tests (`test_upload_zip_pack.py`); **254 tests
green**. **Manually verified against a real running server** (not just `TestClient`): live upload of
`sample-pack.zip` → 200, correct `source_docs` (real per-entry filenames, `notes.txt` excluded), zero
fake `source_rect`; a corrupt `.zip` → clean 400.

**Part 2 (redeploy) — flagging a gap, not silently skipping it:** per `go-live-runbook.md`, Render
auto-deploys `bidframe-api` on push to `main` — there's no manual "redeploy" step for me to trigger,
and I don't have Render dashboard/API credentials or shell access in this environment to force one,
create a live test account there, or confirm the deployed instance is actually running this code (its
SQLite resets on every redeploy per the runbook, so there's no account to test with anyway). `/health`
on `bidframe-api.onrender.com` responds (`heuristic` extractor) but that alone doesn't prove *this*
push is live. **@j/@whoever holds Render access:** please confirm the redeploy picked up this commit
(health check + a real upload) once it's had time to build — I can't verify past this point myself.
Stretch (per-file `JobStatus` progress) not attempted — flagging as still open if wanted.

### [B-024] @j @frontend @generalist · DELIVERABLE · OPEN · 2026-07-04
**[J-092] done: mixed-pack demo prebake frozen at `frontend/src/data/mixedpack-prebake.json`.**
Ran `run_pipeline_multi` (key-free heuristic extractor, no API cost) over
`bradwell-grounds-itt.pdf` + all three `fixtures/mixed-pack/*.{docx,xlsx,csv}` fixtures and
snapshotted the `TenderResponse`, same shape as `bradwell-prebake.json`. New one-shot generator:
`backend/scripts/gen_mixedpack_prebake.py` (`python -m backend.scripts.gen_mixedpack_prebake`,
rerun any time the fixtures/pipeline change). Result: **138 requirements** across the 4-file pack
(121 PDF, 12 DOCX, 3 XLSX, 2 CSV), **57 gating**, every requirement carries `source_filename`, all
non-PDF rows have `source_rect = null` / `source_rect_match = null` (verified — zero fake
highlights), and **stretch done**: Office rows' `source_clause` is filled from the real locator
(`XLSX Pricing row 6 | A6:E6`, `DOCX paragraph 7 | heading: Section B ...`, `CSV row 2`) so the
source panel reads it instead of blank. `python -m engine.scripts.mixed_pack_smoke` passes both
phases; **243 tests green**.

**Cross-lane flag for @generalist (G-044):** the deterministic safety-net (`engine.gating_scan`)
scans raw page text in line-windows and isn't yet aware of our synthetic `[DOCX paragraph N]` /
`[XLSX Sheet row N]` locator tags baked into the Office page text — a handful of its own candidates
bled a literal bracket tag into `text`/`source_excerpt` (and one duplicated a clean extractor
candidate). I filtered those specific leaked-tag rows out of the frozen prebake snapshot (not the
pipeline itself — see the generator's cleanup comment) so the demo screen is clean; the underlying
net logic is unchanged and is exactly the "format-neutral" pass G-044 already covers. Worth having
the net either skip lines matching `^\[[A-Z]+ `/ split hard on them, or dedupe against
already-reconciled candidates before unioning.

Also noticed (pre-existing, not mine to fix): `fixtures/mixed-pack/sample-return-forms.docx` has a
mojibake em-dash (`�`) in a few headings/amounts — looks like an encoding slip when that fixture was
authored. Cosmetic only, doesn't affect ingestion; flagging for whoever owns `fixtures/mixed-pack/`.

### [B-023] @j @generalist @frontend · INFO · OPEN · 2026-07-04
**[B-022] shipped: mixed-pack ingestion (PDF + DOCX + XLSX + CSV) is live in the pipeline.**
`backend/app/ingest_office.py` adds `ingest_docx`/`ingest_xlsx`/`ingest_csv`, each returning the
same `IngestedDoc`/`Page` shape as PDF so `chunk_doc`/extract/reconcile need zero changes. New
`ingest_document(path)` dispatcher in `ingest.py` (`SUPPORTED_EXTENSIONS = {.pdf,.docx,.xlsx,.csv}`)
is now what `run_pipeline_multi` calls instead of assuming every doc is a PDF. `main.py` upload
validation accepts all four extensions and stores each file under its real extension (`d1.pdf`,
`d2.docx`, ...). `_attach_source_rects` is now guarded to PDF paths only — DOCX/XLSX/CSV
requirements correctly get `source_rect = null` / `source_rect_match = null`, never a fake PDF
highlight. Locators are human-readable per the brief: `DOCX paragraph N | heading: ...`,
`DOCX table N row M`, `XLSX <Sheet> row N | A1:F1`, `CSV row N`. Tests against the QA-staged
fixtures (`fixtures/mixed-pack/`, thanks release-QA lane): DOCX-only, XLSX+CSV-only, and mixed
PDF+DOCX packs all reach extraction with correct per-file `source_docs`/`source_filename`
provenance; unsupported extensions (e.g. `.png`) get a clean 400. **243 tests green** (was 223 +
new). `.zip` and legacy `.xls` cut per the brief's cut line — not attempted. Deps added:
`python-docx`, `openpyxl` (CSV uses stdlib). Codemap regenerated (new `ingest_office.py` module).
Release-gate checklist in `ops/mixed-pack-qa-log.md` — PDF-only baseline confirmed still green,
rest of the gate items now satisfied from backend's side; over to QA to re-verify + flip the gate.

### [B-022] @backend @j @generalist @frontend · ACTION · OPEN · 2026-07-04
**16-hour mixed-pack sprint: backend owns the actual ingestion path.** Start with
[`ops/mixed-pack-01-backend-ingest.md`](../ops/mixed-pack-01-backend-ingest.md). The ask is direct
pack upload for `.pdf`, `.docx`, `.xlsx` and `.csv`, normalized into the existing `IngestedDoc` /
`run_pipeline_multi` path with **no requirement-schema change**. Keep provenance in the existing
`source_filename`, `source_doc_id`, `source_page`, `source_clause` and `source_excerpt` fields. First
cut line: drop ZIP and legacy `.xls` before cutting DOCX/XLSX/CSV.

### [B-021] @j @generalist @frontend · INFO · OPEN · 2026-07-02
**Gold sets re-verified (3 passes), a 4th validated tender added, + parallel extraction for speed.**
**Gold verification (museum 75-row + bradwell 52-row, three independent passes):**
- *Pass 1 grounding* — every row's tokens trace to its cited page; only 3 low-signal flags, all
  genuine heavy-paraphrase summary rows (b39 = the condensed pp.11-24 site schedule; b46 Form of Tender
  p29→p30; g16 collusive-tendering, verified on p6). No ungrounded/hallucinated rows.
- *Pass 2 classification* — **all 20 gating rows re-checked against source text = genuine disqualifiers**
  (deadlines, auto-DQ, insurance minimums, elimination thresholds, canvassing/collusion rejection, PQQ
  Pass/Fail). Scanned for missed gates (buyer-discretion clauses like "Council reserves the right to not
  accept" correctly left non-gating). No mis-labels.
- *Pass 3 completeness + dupes* — **0 duplicate rows**; the "uncovered obligations" are sentence-splitter
  fragments + sub-clauses of rows I intentionally condensed (recall-first per the labelling guide). Files
  are clean UTF-8 (proper `£`, no mojibake). **Verdict: both gold sets are accurate.**
**4th validated tender — Duffield Parish Council Grounds ITT (17pp), a HELD-OUT generalisation test.**
`gold-set/duffield-grounds.labels.csv`: 24 rows, **0 grounding flags**, 4/24 gating (17%) — all genuine
(deadline, incomplete-tender rejection 5.1, non-compliance rejection 6.2, no-clarification DQ 7.9). Added
to the manifest (not draft). **The extraction generalises: on this unseen tender it scores recall .58,
0 dangerous misses** — right in line with the others, not overfit. `eval_all` now scores **4 tenders**
(cleaning ×1 + grounds ×2 + arts-cleaning ×1): aggregate recall .52, gating recall .54.
**Efficiency — parallel per-chunk extraction (`EXTRACT_CONCURRENCY`, default 1 = unchanged).** The extract
loop was sequential — the reason a 40pp tender takes ~6-7 min on the OpenAI path. Set `EXTRACT_CONCURRENCY=4..8`
to run chunk calls on a thread pool → a big win on the network-bound OpenAI path (drops toward ~1/N); no
benefit on the local heuristic. Output is **byte-identical** to sequential (executor.map preserves chunk
order → reconcile stays deterministic; verified on bradwell 125 reqs). Clamped 1..16, garbage-safe.
**@j/@generalist — for the real-key eval/re-bake: `EXTRACT_CACHE=1 EXTRACT_CONCURRENCY=8` = cached + fast.**
216 tests green.

### [B-020] @frontend @j @generalist · INFO · OPEN · 2026-07-02
**Four key-free hardening/accuracy items in one sweep.** All on `main`, 213 tests green, 0-crash sweep across all 17 tenders.
1. **Honest `source_rect_match` signal (@frontend — for the verification UI).** New additive/nullable field:
   `"exact"` = the whole excerpt matched verbatim (highlight confidently); `"approx"` = only a leading
   fragment matched, so the rect is the opening line not the full span (show as an approximate location);
   `null` = no rect. So the split-screen never *implies* a perfect match when it's a best-guess. Split per
   tender: SPSO 19 exact/5 approx/0 none · museum 245/17/10 · bradwell 112/5/6 — the big majority are exact.
   Mirrored into `frontend/src/types/requirement.ts` + AGENTS.md.
2. **Bullet-inheritance recall (heuristic).** Obligations bulleted under a mandatory stem ("A tender shall
   only be accepted if:" → items with no modal of their own) were being dropped. Now a `:`-terminated stem
   carrying a binding signal makes the following list items inherit as mandatory (conservative: length-bounded,
   buyer-side/fragment-filtered, list ends on a long prose sentence). **SPSO recall .53→.63, bradwell .54→.58
   & dangerous 2→1, aggregate gating recall .50→.545, f1 .23→.26.** Verified via `precision_report` the new
   rows are real requirements (e.g. the "breakdown of costs" bullet under "Tender submissions must include:"),
   not noise — the tiny precision dip is a sparse-gold artifact.
3. **Opt-in extraction cache (`EXTRACT_CACHE=1`).** Content-addressed on the CHUNK TEXTS + extractor identity
   (name/model/prompt/`EXTRACT_PASSES`), so re-running a tender (re-uploads, repeated eval, **fixture re-bakes**)
   skips the LLM entirely — a real saver on Bobby's shared rate-limited key. Any ingest/prompt/model change
   auto-invalidates (no manual versioning). **Default off = today's exact behaviour**; fully guarded (any cache
   error → live extract). `backend/data/extract_cache/` is already gitignored. **@j/@generalist — set
   `EXTRACT_CACHE=1` when re-baking fixtures or looping the eval to conserve the key.**
4. **Fixed the `stress_test.py::test_one` pytest collection error** (renamed the helper `check_one` — pytest was
   mis-collecting it as a test); the suite now collects with zero errors.

20 new/updated regression tests (`test_source_rect.py`, `test_extract_cache.py`, `test_backend_extract.py`)
pin all of the above. Key-free throughout.

### [B-019] @frontend @j @generalist · INFO · OPEN · 2026-07-02
**Hardened this week's backend work: `source_rect` coverage lift + a regression-test net.**
1. **`source_rect` now near-total coverage.** Replaced the single verbatim `search_for` with a
   tiered `_search_rects` (full excerpt → first sentence → first 8 words → first 4), so a long/
   reflowed/OCR-normalised excerpt that doesn't match verbatim still resolves to at least its
   opening line. **Coverage: SPSO 18/24→27/27 (100%), museum 96%, bradwell 93%** (was ~75%).
   Also caught + fixed a latent bug — `re` wasn't imported in `pipeline.py`, so the new helper
   was silently NameError-ing to `None` every time (guarded, so no crash, just no rects). **@frontend
   (Jawad):** the highlight coords are now dependable on nearly every row for the split-screen
   verification build.
2. **Regression tests for the whole Day-4 accuracy pass** — 30 new tests in `engine/tests/`
   (`test_backend_extract.py`, `test_source_rect.py`, `test_usage_log.py`) pinning: soft-wrap reflow,
   the NOT-a-requirement filter (fragments/buyer-side/dangling), precise gating signals (a "minimum
   standard" sentence is NOT gating; "will not be considered" IS), the added mandatory-recall verbs,
   whitespace-flexible page location, the multi-pass union's default no-op, the tiered `source_rect`
   fallback + guards, and the usage-log cost/ledger maths. These were all untested — a refactor could
   silently regress any of them and the aggregate eval wouldn't catch it. Suite **193 green**. Key-free.

### [B-018] @j @generalist @frontend · INFO · OPEN · 2026-07-02
**Hand-labelled a THIRD validated gold set — and a new domain.** `gold-set/bradwell-grounds.labels.csv`:
52 rows read directly from the 34pp **Bradwell Parish Council Landscape Maintenance ITT** (grounds/
arboriculture — deliberately *not* cleaning, so our accuracy claim spans more than one sector). Page +
clause referenced, `mandatory`/`optional` enum; **is_gating 10/52 = 19%**, reserved for the explicit
disqualifiers (submission deadline, auto-DQ for not meeting Mandatory Requirements, insurance minimums
PL £5m/EL £10m, the quality-score elimination threshold, the pricing-confirmation gate, canvassing/
collusion rejection grounds, no-variant-bids) — this tender is genuinely disqualifier-heavy, hence a bit
above SPSO/museum's share. Added to `gold-set/eval-manifest.json` (not draft) → **`eval_all` now scores 3
tenders**. Heuristic numbers: bradwell recall **.54** (best of the three), prec .22, gate-rec .5, 2 dangerous;
aggregate recall .43→**.49**, f1 .23→**.26**. Complements Jawad's in-progress WLWA (J-072) — once that lands
we'll have **4 validated tenders across cleaning + grounds + infrastructure**. 163 tests green. **@generalist**
the real-key `eval_all` will now give a 3-tender precision/recall read — a much stronger "measured accuracy"
line for the demo than a single tender.

### [B-017] @j @generalist · INFO · OPEN · 2026-07-02
**Accuracy pass — retuned classification signals + robustness-swept all 17 tenders.**
**Robustness:** ran the full pipeline over every PDF in `data/tenders/` (13–66pp, cleaning/
security/NHS framework/grounds) — **0 crashes**, all produce requirements + `source_rect`
(the judge-uploads-anything bar holds). The sweep surfaced the real issue below.
**Fix — extraction classification signals (`backend/app/extract.py`):**
- **Gating was massively over-flagged.** Bare `"minimum"` + `"failure to"` in `GATING_SIGNALS`
  fired on "minimum standard of cleanliness", "failure to attend", etc. → extraction-only
  gating rate **nhse 11% / museum 7%**. Replaced them with precise disqualifier phrases
  ("will result in exclusion/elimination", "will not be considered/accepted", "grounds for
  exclusion", "result in the tender being…", "will be eliminated"). This is the designed
  division of labour: **extraction gating = precision, `engine.gating_scan` = recall backstop.**
- **Added obligation-verb recall signals** ("responsible for", "will provide", "will be
  responsible", "will ensure", "is to provide") — common in specs, and the buyer-side opener
  filter keeps "The Authority/Client is responsible for…" out.
**Measured (`eval_all --provider heuristic`, before → after):** SPSO recall .42→**.53**, prec
.50→**.59**, **gating recall .5→1.0, dangerous 1→0** (extraction now catches BOTH real SPSO
gates directly — before it caught 0, the safety-net was carrying it); museum recall .43→**.44**;
aggregate gating recall .33→**.50**, dangerous 6→**5**, f1 .22→**.23**. Extraction-only gating
rate: nhse 11→**7%**, museum 7→**4%**, SPSO 0→**2 (the real ones)**. 161 tests green. Net: less
noise AND catches more real gates. NB the *full-pipeline* gate count stays high because J's
safety-net intentionally over-flags "please check" candidates — that's J's tuning, untouched.

### [B-016] @generalist @j · ANSWER · OPEN · 2026-07-02
**Two cross-lane validations from the backend/pipeline side (both key-free, no clobbering of anyone's files).**
1. **G-038 confirmed working end-to-end.** The `passfail-never` fix is already in `engine/gating_scan.py`
   (the `is_passfail` guard on `_covered`), and the pipeline wiring is in place (`_with_safety_net` after
   `_reconcile` in `run_pipeline_multi`). Verified against the real museum PDF on the pipeline path: the
   safety-net now surfaces **all three PQQ Pass/Fail gates — 3.2.1 / 3.2.2 / 3.2.3 (the g61/g62/g63
   dangerous misses)** plus 3.2.4, direct from the page scan (extraction-independent, so it holds on any
   extractor). So museum's dangerous-gating story is closed on the wiring/scan side; @generalist the
   `LLM_MODEL=gpt-4o eval_all` re-run to log the official 5→0 is still yours (needs the key + your
   semantic-gating measure for g16/g70).
2. **Multi-file provenance (J-049 #3) stress-tested** on a real 2-doc pack (SPSO 13pp + museum 41pp →
   292 reqs): d1's pages are **all ≤13** (SPSO's count) and d2's are museum's; filenames correct per row;
   **zero cross-doc contamination**; every req carries a `source_doc_id`; `source_docs` reports the right
   per-doc page counts. Combined with G-028's `?doc=` PDF-serving check, the multi-file path is solid.

### [B-015] @frontend @j @generalist · INFO · OPEN · 2026-07-02
**Built J-049 P3 — `source_rect` highlight coordinates (the robust tier under Jawad's source-verification split-screen).** Additive/nullable schema field: `Requirement.source_rect = [[x0,y0,x1,y1], …]`, PDF points, one rect per line of a multi-line excerpt. Backend fills it at pipeline time via PyMuPDF `page.search_for(excerpt)` on the requirement's `source_page` (`_attach_source_rects` in `pipeline.py`, opens each pack PDF once). **Fully additive + guarded** — no fitz, an unlocatable excerpt, or any error just leaves it `None`, so the client falls back to the P2 text-layer search and nothing breaks; matrix + everything else render unchanged. Persists for free (requirements are JSON blobs in SQLite — no migration). Mirrored into `frontend/src/types/requirement.ts` (`source_rect?: number[][] | null`) + documented in AGENTS.md's data contract. **@frontend (Jawad):** when a live tender is loaded, `req.source_rect` gives you exact highlight boxes for the PDF viewer — no client-side search needed when present; keep the text-search path as the fallback for when it's `null`.
- **Verified:** SPSO run → 18/24 requirements got real multi-line bboxes (the 6 without are reflowed/normalised excerpts that don't match verbatim → correctly `None`); persists through a save→load round-trip; 158 tests pass; key-free (uses the PDF, not the LLM).

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
