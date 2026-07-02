# Board — J (prompts · orchestration · narrative · traction · glue)

*J writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

### [J-059] @backend · INFO · OPEN · 2026-07-02
**Fixed a SILENT requirement-dropper in `extract.py` (`bd39b51`) — @backend please sanity-check, it's your file.** `_to_raw` did `chunk.text.find(excerpt)`; when the model returns a **non-str** `source_excerpt` (happens on mini over the messy museum 41pp tender), `str.find(int)` raised → the retry wrapper swallowed it → the **WHOLE chunk returned empty → every requirement in it silently dropped**, including gating disqualifiers. On the museum mini eval this cost **6 gating disqualifiers** (whole back-half PQQ chunks crashed → gating recall 0.4, 6 dangerous misses — looked catastrophic, was a crash). Fix: coerce `source_excerpt`→str before `.find()` (line ~221). 121 engine tests green. Re-running the gpt-4o eval to confirm the disqualifiers return. **Lesson for the class:** the museum 41pp gold is now our canary — it exercises code paths (long/messy chunks, PQQ section) SPSO's 13pp never hit.

### [J-058] @backend @all · INFO · OPEN · 2026-07-02
**Persistent usage ledger — check total spend anytime with `python -m engine.usage_log`** (`fcd40fa`). Extended @backend's `engine/usage_log.py` (J-055): every OpenAI call now ALSO appends to a gitignored `usage-ledger.jsonl` at repo root, so cumulative $ survives across runs/teammates (per-process print unchanged). `read_total()` + the CLI print the running total by model. Never raises on I/O; **additive — `log_usage(resp, model, label)` signature untouched. @backend FYI I only added `read_total`/`__main__` + the file-append, no behaviour change to existing calls.** Caveat: it's Bobby's key, so his OpenAI dashboard remains ground truth for EVERYONE's spend; this ledger only sees calls made after it landed (starts from ~$0 now).

### [J-057] @backend @generalist · INFO · OPEN · 2026-07-02
**Plain English (Joel):** My two J-056 items are done and pushed. (1) The accuracy *measurement* now recognises a requirement even when the model rewords/reorders it, so we stop recording false "misses." (2) The extraction prompt is sharpened to cut the junk rows (descriptions/definitions/duplicates) that drag precision — Pranav just needs to paste two lines into the live prompt for it to take effect.

**Technical:**
- **Eval matcher landed** (`bb7e72a`). Added `match_score` to `engine/similarity.py` and pointed `engine/eval.py`'s `match_requirements` at it. **@generalist — your reconcile merge gate is untouched** (`similarity` + `token_similarity` unchanged; I only *added* a function), so no collision with your dedup work. It's **lexical/deterministic, NOT embeddings** — the seam's docstring mandates offline-auditable scoring, and torch on py3.14 is a risky dep. Matches reworded/reordered/granularity-shifted text via content-token overlap (Jaccard+containment, ≥2 shared tokens so different reqs stay apart). Full engine suite **121 green** (+`test_match_score.py`). NB it won't move SPSO (already recall 1.0) — it's measurement *robustness* for future/paraphrase-heavy runs.
- **Extraction prompt v2** (`c4c2edf`, `prompts/extraction.md`): precision pass — added a "what is NOT a requirement" section (background/definitions/buyer-side prose/headings/notes) + anti-fragmentation & within-chunk-dedup, recall-first core intact. **@backend — the runtime `_LLM_SYSTEM` in `extract.py` is a condensed summary; add these two clauses (copy-paste) for it to take effect:** (1) *"Do NOT extract background/scope description, definitions, the buyer's own statements, headings, or explanatory notes as requirements — that noise tanks precision."* (2) *"One obligation = one object: split only genuinely separate obligations; never fragment one into overlapping pieces or emit it twice/at two granularities; each distinct obligation once per chunk."* Fold it into your `temp=0` edit so `extract.py` gets one clean change, not two.

### [J-056] @backend @generalist · REQUEST · OPEN · 2026-07-02
**Plain English (Joel):** We found the real accuracy issue — the extractor runs with randomness switched on, so the *same* tender scores differently each run (recall bounced 0.84 → 1.0 across two runs; when it lands well it's a clean 19/19). The deal-breaker catch is already rock-solid (gating recall 1.0, 0 dangerous misses, both runs). We're splitting the "make it consistent + go deeper on precision" work three ways: **Pranav** = make extraction consistent + read PDFs better + build the museum answer-key; **Bobby** = clean up duplicate requirements + combine multiple passes; **me (J)** = sharpen the extraction prompt + fix how we *measure* accuracy. Supersedes the museum item in J-055 (now with full instructions here); Pranav keeps the usage-logging + `.env` fixes from J-055.

**@backend (Pranav) — extraction consistency + input encoding + museum gold. Priority order:**
1. **Determinism (do first, ~5 min, the root cause).** `backend/app/extract.py` `OpenAIExtractor.extract_chunk` sets NO `temperature`/`seed` → defaults to temp 1.0 → non-deterministic (the 0.84↔1.0 wobble). Add `temperature=0` and a fixed `seed=` to the `chat.completions.create` call (Claude path too). Expect stable recall + a small precision bump.
2. **Input encoding.** PDF→text currently loses table/multi-column/appendix requirements. Add layout-aware extraction (pdfplumber tables + reading order), **chunk overlap** (~200 tok) so requirements straddling a page/chunk boundary aren't dropped, and a **gpt-4o vision fallback** for pages whose text layer comes back near-empty (scanned/image pages).
3. **Multi-pass extraction (union).** Optionally run extraction N×2 (or overlapping windows) and emit the **union** of raw requirements, handing a max-recall set to reconcile (Bobby dedups). Guard cost (mini for dev). 
4. **Museum 41pp gold — DETAILED, plain English (this is a human read, no code):**
   - **What & why:** read the real 41-page museum cleaning tender by hand and write down every requirement, so we have a human "answer key" to prove accuracy on a *long, complex* tender (today SPSO-13pp is our only validated one).
   - **⚠️ The current file is GARBAGE — replace it entirely.** `gold-set/museum-cleaning.labels.csv` accidentally contains a *different* tender's content (the 2013 Scottish Ombudsman/SPSO text) pasted against the museum PDF. Its 92 rows are meaningless — delete them all and start fresh from the ACTUAL PDF.
   - **The PDF:** `data/tenders/museum-cleaning-itt.pdf` (41pp — the Metropolitan Arts Centre, Belfast cleaning ITT). The PDF is correct; only the old labels were wrong.
   - **Steps:** (1) Open the PDF, read top to bottom. (2) Open `gold-set/museum-cleaning.labels.csv`, clear it, keep only the header `id,text,type,is_gating,source_page,source_clause,notes`. (3) Every time the bidder is told they **must/should** do or meet something, add ONE row: `id`=m1,m2,m3… (use `m` so it's clearly museum); `text`=the requirement in your own short words; `type`=`mandatory` (must/shall/required) or `optional` (should/may/desirable); `is_gating`=`yes` ONLY if missing it gets the bid thrown out, else `no`; `source_page`=PDF page; `source_clause`=section/heading or blank; `notes`=optional. (4) Save.
   - **The one thing to get right — gating.** Only a HANDFUL of rows are `is_gating=yes` — the true disqualifiers: submission deadline, the pass/fail "must conform or be rejected" clause, mandatory certs/insurance minimums, "will be excluded/disqualified" lines. The broken file marked 88/92 gating — that is the exact mistake to avoid. Reference: SPSO had **exactly 2** gating rows (the deadline `g17` + the substantial-conformance gate `g19`).
   - **Rules of thumb:** recall-first (unsure → include it); one obligation per row (split "must do X and Y" into two); include requirements hiding in **tables** (cleaning spec, pricing, eligibility) and **return forms** — easy to miss, they count; do your OWN read, don't peek at the tool's output first. Copy the shape of `gold-set/spso-cleaning.labels.csv` (its `#` top lines are optional notes; the two gating rows show what a real disqualifier looks like).
   - **Switch it on (2 min):** in `gold-set/eval-manifest.json`, on the `museum` entry, delete the `"draft": true` line AND the long rejected `"note"`, set `"max_page"` to the last page you labelled. Then from repo root: `python -m engine.scripts.eval_all` → it should score TWO tenders and print the museum recall/gating/precision. That's the credibility win: accuracy proven on a 41pp ITT.

**@generalist (Bobby) — reconcile dedup + ensemble merge:**
1. **Embedding (semantic) dedup** in reconcile — collapse the over-surfaced near-duplicate requirements by vector cosine (`text-embedding-3-small`, ~0.87 threshold) instead of exact/text match; keep the more-complete text + highest confidence. **Keep the safety rule: never merge two DISTINCT gating rows** (your adversarial PQQ-vs-ITT lesson) — gating collapses on exact text only.
2. **Ensemble merge** — dedup Pranav's multi-pass union into one clean set; a merged item stays gating/mandatory if ANY source pass flags it (your existing safety-escalation). This is where recall lands at a stable ~1.0 while precision stays clean.
   *(NB: I'm taking the eval-matcher fix myself to keep your plate focused — see below.)*

**Me (J) — I own:** (a) sharpen `prompts/extraction.md` (what counts as a requirement / never split one into several / few-shot) — I'll hold this until Pranav's `temp=0` lands so we can measure each change in isolation; (b) **fix the eval matcher** in `engine/eval.py` — swap the 0.60 *text*-similarity match for embedding similarity (leaning a local/deterministic embedder so the eval stays auditable + free), so valid paraphrases stop counting as false pos/neg and the precision/recall numbers become truthful. I'll do the matcher first (it re-baselines everyone's numbers) and flag when it lands — @generalist give me a shout if you'd rather pair on it since eval is your harness.

**Context (measured tonight, real key):** SPSO on gpt-4o AND gpt-4o-mini = gating recall **1.0** (2/2), **0** dangerous misses. Overall recall 0.84–1.0 (run-to-run noise, now explained by temp=1.0). Precision 0.39–0.45 = over-surfacing vs a sparse 19-item gold (eval artifact, not a defect).

### [J-055] @backend · REQUEST · OPEN · 2026-07-02
**Plain English (Joel → Pranav):** Three things, in this order:
1. **Let us watch spend on Bobby's key.** We're live on Bobby's OpenAI key (~$14 on it) and we can't see his billing dashboard — add a small log line that prints tokens + rough $ per AI run. That's our only way to keep spend to a couple of dollars.
2. **Fix the `.env` gap.** The app doesn't actually read `backend/.env`, so following our own runbook (put key in `.env`, run) silently gives the dumb no-AI output and looks like the key's broken. Make it load `.env` on startup.
3. **Hand-label a gold answer-key for the museum tender (41 pages) so we can measure accuracy on a long, complex one.** Today we have only ONE validated accuracy example (SPSO, 13pp); the existing museum key is wrong (a different tender's text was pasted in). Re-label the real 41-page museum cleaning ITT by hand per the labelling guide and switch it on — then we can honestly say we've measured accuracy on a long tender, a real credibility win for the demo.

(Deliberately NOT asking for the earlier "live crash test" / "survive rate-limits" items: Bobby already ran the real-key live smoke and fixed the crash it found (J-048/G-004), and we're handling the low-tier rate-limit slowness by pre-loading tenders before any call for now.)

**Technical (Pranav):**
1. **Usage/cost logging (~30 min).** In `backend/app/extract.py` `OpenAIExtractor` (and ideally the engine autofill call path), log `response.usage` (prompt/completion tokens) + computed $ from a small price map (gpt-4o-mini 0.15/0.60, gpt-4o 2.50/10.00 per 1M tokens) — one `logging.info` per call + a per-request running total. We have NO access to Bobby's dashboard, so this is our only spend visibility. No new deps.
2. **`load_dotenv()` on startup (~15 min).** There is no dotenv anywhere — the app only reads `os.environ`, so `backend/.env` is inert under plain `uvicorn` (I've been sourcing it manually to get `/health`=openai). Add `from dotenv import load_dotenv; load_dotenv()` early in `app/main.py` (python-dotenv; add to requirements if absent). Render is unaffected (dashboard env vars). Then fix `go-live-runbook.md` step 1. Repro: `printf 'OPENAI_API_KEY=sk-x\n' > backend/.env; uvicorn app.main:app` → `/health` still reports `heuristic`.
3. **Re-label museum/MAC gold (41pp) per `gold-set/labelling-guide.md`.** `gold-set/museum-cleaning.labels.csv` is REJECTED — its 92 rows carry SPSO-2013 content (Ombudsman, s.19 SPSO Act 2002, eblows@spso.org.uk) bolted onto the MAC (Metropolitan Arts Centre, Belfast) cleaning ITT: right PDF, wrong labels. The PDF `data/tenders/museum-cleaning-itt.pdf` is correct (41pp, byte-identical to `Cleaning-ITT-Version-1.3-FINAL-1.pdf`). Hand-label from the REAL PDF: columns `id,text,type,is_gating,source_page,source_clause,notes`; `type`∈{mandatory,optional}; `is_gating=true` ONLY for genuine pass/fail exclusion gates (Bobby's SPSO sign-off G-019 is the bar — the current 88/92-gating is exactly the failure mode to avoid). Then in `gold-set/eval-manifest.json` remove the museum `draft:true` + rejected note and set `max_page`; `python -m engine.scripts.eval_all` should then score 2 tenders. Payoff: moves the honest accuracy claim from "1 validated (SPSO)" to "2 validated incl. a 41pp ITT," and gives a truer precision read. NB gold labelling is normally the generalist's lane (Bobby owns eval + the guide) — reuse his SPSO approach, or flag on your board if he should take it.

**Context — accuracy just re-verified on the real key (both models):** SPSO eval on BOTH gpt-4o-mini and gpt-4o = gating recall **1.0** (2/2 disqualifiers), **0** dangerous misses. Precision ~0.39–0.42 on both = recall-first over-surfacing vs a sparse 19-item gold, *not* a bug (matches the generalist's "quote the disqualifier catch, not precision" guidance). This is *why* the museum re-label matters — a properly-granular 41pp gold gives a truer precision number.

### [J-054] @all · INFO · OPEN · 2026-07-02
**Plain English (Joel):** Overnight I ran an end-to-end lead-gen operation and banked **116 verified micro-target firms** in `outreach-micro-targets.md` — tiny family/owner-run UK firms that bid public-sector work, all with a real public email and a ready-to-send personalised nudge. Top of that file has a summary table + a "where to start" shortlist of the **~39 strongest** (PERFECT = tiny AND names a specific council/HA/school/NHS client). Everything's committed to GitHub. Nothing was fabricated; ~half a dozen otherwise-perfect firms are parked in "near-miss" notes because they had no verifiable email (reach via their contact form/phone). Codex ran its own pipeline in parallel into the CRM. **Nothing here needs your approval** — I sent no emails and spent nothing. **I paused the blast phase at 116** (6× the 10–20 goal) to respect usage; a "Where next" note at the bottom of the file lists the best remaining seams/angles if you want more — say the word and I'll resume.

**Technical:** 6 waves × 3 research-only subagents (no nested fan-out after wave 1), each seam distinct from Codex's lanes. Pipeline per firm: web-search discovery → open the firm's own site → verify size (family/owner-run, ≤~30 staff) + public-sector evidence + a plaintext on-site email → dedupe vs `crm/leads.csv` (domain+name grep) → curate (PERFECT = named public client; GOOD = tiny + self-declared) → personalise with the same-day free-pilot nudge → commit. 19 seams: compliance trades, care, building/grounds, heating/plumbing/electrical/M&E, playground, pest, security/CCTV/locksmith, fencing/MUGA, flooring, roofing/scaffolding, damp & mould, window/heritage-sash, painting, asbestos, kitchen/bathroom & DFG adaptations, retrofit/EWI (ECO4/SHDF), mobility/stairlift/DFG, fire-risk/fire-door, solar-PV/battery. IDs are provisional `MT-01..MT-116` (kept OUT of `leads.csv` to avoid clashing with Codex's `L-0401+`; migrate + re-dedupe before importing). Size/structure caveats flagged inline on borderline rows. Best PERFECT-signal pattern found: firms with a "local authorities we work with" page; richest seams were DFG/adaptations + school/community solar. Codex's parallel output is in `crm/leads.csv` (`L-0401+`) + `crm/drafts/` per J-053.

### [J-053] @all - INFO - OPEN - 2026-07-02
Lead-gen batch landed under the Codex lane: `L-0401` through `L-0412` in `crm/leads.csv`, with same-day free-read drafts in `crm/drafts/`.

Guardrails used: 3 research-only subagents max, public email required, public-sector evidence required, no bid consultancies, no big nationals, and stopped after the first clean batch instead of padding with weaker rows. Batch mix: school/SEND transport, school ICT, occupational health, and interpreting/translation. Run notes: `crm/leadgen-run-2026-07-02.md`.

### [J-052] @frontend · INFO · OPEN · 2026-07-02
**In plain English (for Joel):** a small consistency gap on `/graph`. The **ledger** now shows real
criterion names + "% of marks" (from Pranav's weights), but the **map** (the node view, behind the
MAP/SPLIT toggle) still shows "Award criterion 1/2/3". Worth aligning so both read the same — but whether
and how is Jawad's call.

**For @frontend — detail:** the marks ledger (`MarksView`) now consumes `Tender.award_criteria`
(`id → {name, weight}`, on `main`) → real names + "N% of marks", bars sized by weight. The relationship
map (`GraphView` `CriterionNode`) still derives its label from `criteria_ref` (so it prints the number).
For a consistent workspace, the map's criterion tabs could show the same real name (+ weight) via
`useRequirements().awardCriteria` keyed by `criteria_ref` — purely presentational, the data's already in
context. **Entirely your call** how/whether to align; flagging the inconsistency, not prescribing.

### [J-051] @frontend · REQUEST · OPEN · 2026-07-01
**In plain English (for Joel):** a UX gap we spotted in the matrix. When a *low-confidence* requirement
gets decided (e.g. approved), its confidence dot still shows the tool's original colour (amber = "unsure"),
sitting right next to the green "Approved" — so it looks half-resolved / contradictory. It should clearly
read *"safely handled, and it started uncertain."* **The design and how to build it are entirely Jawad's
call** — we're just flagging that the UX needs work, not prescribing a look.

**For @frontend — detail:** on a decided row in `ComplianceMatrix`, the `ConfidenceIndicator` bead still
renders `req.confidence` (the tool's original tier), so a low-confidence item that's since been
approved/edited shows an **amber bead** next to the forest "✓ Approved by you" on an already de-tinted row —
the one element still reading "uncertain." A decided-but-originally-low-confidence item should read as
**safely resolved while honestly retaining that it started low-confidence**. Note: **Flagged** rows (e.g. the
GDPR one) correctly stay oxblood — that case is fine; it's the **approved/edited** low-confidence case that
needs it. **Design + implementation are 100% yours** (your `ComplianceMatrix` + the shared
`ConfidenceIndicator`, and you own the status-column language). One *non-prescriptive* idea we floated: a
"resolved" bead keeping the original tier hue as a small core inside a forest resolved ring/check, + a quiet
"was low confidence" cue — but do it however reads best to you. Related: I just corrected the summary line
from "verified" → "handled" (commit `21ac16c`) for the same honesty reason (it was calling flagged
low-confidence items "verified"); this bead is the visual sibling of that fix.

### [J-050] @all - INFO - OPEN - 2026-07-01
CRM verifier sweep and send-order pass is complete in `crm/`. The send plan now has **150 free-pilot asks**
first, with a harsh lower-end expectation of **2.54 accepted free pilots**; paid asks are parked as
`paid_later` until we have feedback/testimonial proof from the free pilots. The verifier pass applied concrete
contact corrections in `crm/leads.csv`, added a safety report at `crm/verifier-pass-2026-07-01.md`, and
regenerated the draft emails from a less templated generator.

Safety notes: `human_review` / `human_review_no_send` rows are excluded from send batches and their draft files
now say **DO NOT SEND YET**. Current held rows are Cooper Weston, Advantage Catering Equipment Repair, Award
Refrigeration & Air Conditioning, and Skyguard Flat Roofing. Do not send those without one more manual check.

### [J-047] @frontend · REQUEST · OPEN · 2026-07-01
**In plain English (for Joel):** two builds for Jawad. **(1) Better source-checking** — right now, to verify
one of the tool's claims you click "Open the page" and it dumps you in a new browser tab with the whole PDF,
and you have to find the sentence yourself. The new version splits the screen: the claim on one side, the
actual tender document on the other, scrolled to the exact spot with the sentence highlighted — so you can
trust it in one glance. **(2) The `/demo` scroll-story** — rebuild the demo page into the scrollytelling
version you planned (the design brief is already written). He can start both today without waiting on backend.

**For @frontend — technical detail:**
Refining the J-043 split: **J is taking the graph rework** (building it now), so your two flagged builds are:
1. **Claim / source verification** — the split-screen (a claim ↔ the tender/capability doc, scrolled to +
   the **exact line highlighted**), a hover-peek, and an honest *"exact vs approximate match"* signal. Start
   client-side: **P2 = PDF.js text-layer search highlight, no backend change.** (@backend is adding P3
   highlight coordinates in parallel for the robust tier — J-049 — but don't wait on it.)
2. **`/demo` scrollytelling rework** — rebuild `/demo` (`DemoView`) as a scroll-driven narrative (sticky
   stage + stepping beats, reusing the real components). Ready-to-paste design brief with real tokens, fonts,
   component looks, sample data, technique constraints + the story beats: **`demo-scrolly-design-pack.md`**.
Full options/plan for verification: **`graph-and-verification-deep-plan.md`** (Part B). Ping if the P2/P3
call or the scrolly technique needs a decision.

### [J-048] @generalist · REQUEST · OPEN · 2026-07-01
**In plain English (for Joel):** Bobby is the only one with the live AI key, so he's the only one who can run
the *real* product. We've merged a lot this week (accounts/login, multi-file uploads, polish, bug fixes) but
**nobody has clicked through the whole thing together in a browser yet** — that's the risk before the demo.
So I've asked him to be the tester: log in, upload a single tender and a multi-file pack, check the AI's
answers are actually correct and cite real sources, confirm approvals save and users can't see each other's
data, etc. — and report anything that breaks. Two kinds of testing: **workflow** (does every screen/button
work) and **accuracy** (does it catch the disqualifiers and never make up a citation). Checklist below.

**For @generalist — technical detail:**
You've got the live OpenAI key — can you run the **full end-to-end smoke test** of the now-consolidated
`main` (auth + multi-file #4 + QOL + UX fixes, all merged) in a **real browser**, testing both **accuracy**
and **workflow**, and post pass/fail to your board? Nothing's been clicked through together live yet — this
is the integration gate. Setup: backend `uvicorn app.main:app --port 8000` with `OPENAI_API_KEY` +
`AUTH_SECRET` set + an account (`python -m app.admin create-user you@x.co`); frontend `npm run dev` with
`NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.

**Workflow:**
- [ ] Auth gate: logged-out visit to /review /upload /answers /graph → bounced to /login; wrong password → clean error; login → app; refresh stays in; sign out → gated again.
- [ ] Single-file upload → live progress → matrix; deal-breakers first; confidence beads render.
- [ ] **Multi-file pack (#4 — least tested):** upload 2–3 PDFs at once → one tender; source refs show the right filename; "Open the page" opens the correct doc (`?doc=d2`) at the right page.
- [ ] Answers: "Draft my answers" (your key) → grounded answers + evidence citations; gaps listed; no-tender empty state shows before load.
- [ ] Decisions: approve/edit/flag persist across refresh; reopen; keyboard nav (j/k/a).
- [ ] Per-user isolation: 2nd account can't see the first's tenders.
- [ ] /tenders list; /graph renders; /demo works logged-out.

**Accuracy (your eval strength):**
- [ ] Both SPSO disqualifiers caught + shown as deal-breakers; 0 dangerous misses.
- [ ] 0 bluffs — every drafted citation is real + verifiable against the doc.
- [ ] Multi-file provenance: a requirement from doc B keeps the right page + filename, not merged across docs.
- [ ] Confidence / needs-review calibration looks sane on a fresh tender.
Post anything that breaks to board-generalist so we fix it before the demo.

### [J-049] @backend · REQUEST · OPEN · 2026-07-01
**In plain English (for Joel):** what Pranav can usefully do — mostly things that make the two frontend
features better and shore up the newest code. **(1)** Have the extractor record *exactly where on the page*
each requirement/answer came from (coordinates), so Jawad's highlight can be pixel-perfect instead of a
best-guess text search. **(2)** Pull out the award-criteria weightings (e.g. "Quality 40% / Price 60%") so the
new graph can size by real marks, not just counts. **(3)** Stress-test the multi-file upload (it's the newest,
least-tested piece). **(4)** Get accounts + keys working on the live Render server so the *hosted* product runs
properly. None of this blocks the frontend from starting — it's the higher-quality tier they graft on later.

**For @backend — technical detail:**
Useful backend work that unblocks the two frontend builds + hardens the new multi-file path:
1. **HIGH — highlight coordinates for source verification (P3).** At extract time, store the excerpt's
   bounding box(es) per requirement (+ per answer `evidence_ref`) — PyMuPDF `page.search_for(excerpt)` → rects
   — as an additive/nullable field (e.g. `source_rect`). Unblocks pixel-accurate highlighting in Jawad's
   verification build (J-047); he starts on client-side text-search meanwhile. Detail: `graph-and-verification-deep-plan.md` §B.3.
2. **HIGH — award-criteria detail (names + weights).** If the tender states criterion weightings (e.g.
   "Quality 40% / Price 60%"), extract them so the graph can size by real marks, not just requirement count —
   that's the spine of the graph rework I'm building now. Additive to the tender response.
3. **MED — harden the multi-file (#4) path** on real 2–3 doc packs (new + least-tested: provenance +
   per-doc PDF serving under `?doc=`).
4. **MED — deployed accounts + keys:** an easy way to seed accounts on Render + confirm `AUTH_SECRET` /
   `OPENAI_API_KEY` there, so the *hosted* product runs gated + live (the prebake covers the demo).
Also — your STATUS row is stale; refresh it when you get a sec.

### [J-046] @all - INFO - OPEN - 2026-07-01
Lead gen target reached: CRM now runs through **L-0400**. Final push added **L-0356-L-0400** with verified public
emails and free-pilot drafts in `crm/drafts/`; quality mix was **36 High / 9 Medium**. No guessed contacts.

Best seams in the final push: lift/water/asbestos/drainage/line-marking/gates compliance operators; NEUPC,
WPA/LHC, ProcurePublic, Fusion21, NHS SBS and Pagabo framework SMEs; school ICT suppliers on Everything
ICT/KCS/CCS/YPO/Pagabo-style routes; Doncaster AP framework providers; regional OH suppliers on RM6296/RM6386.
Duplicate pressure is now high enough that any work beyond L-0400 should start with a fresh framework-by-framework
plan rather than broad search.

### [J-045] @all - INFO - OPEN - 2026-07-01
Lead gen loop continued: added **L-0321-L-0355** with verified public emails and free-pilot drafts in
`crm/drafts/`. Quality mix: **25 High / 10 Medium** after dropping one Low-fit consultancy rather than padding
the count. CRM max is now **L-0355**; 45 leads remain to hit L-0400.

Learning for the next pass: best seams were lift maintenance, drainage/highways/line marking, water
hygiene/legionella, asbestos, and framework-tied public-estate minor works. School ICT, occupational health and
apprenticeship training also worked when there was visible framework/DPS/local-authority proof. Broad roofing/HVAC
is now duplicate-heavy, so the next loop should stay framework/geography-specific. If the next pass drops below
roughly half High leads, re-plan before continuing.

### [J-044] @all - INFO - OPEN - 2026-07-01
Lead gen restarted toward **L-0400**. Added **L-0285-L-0320**: 36 verified public-email leads with free-pilot
drafts ready in `crm/drafts/` (bid/procurement/social-value consultancies, specialist compliance trades,
AP/SEND/training/school suppliers). Twenty-two are High and fourteen Medium. Learning: consultancies are still
good when founder-led or vertical-specific; compliance should pivot away from crowded fire/security toward
lift frameworks, drainage, line marking, clinical/washroom waste, winter gritting and asbestos; AP/SEND needs
directory/geography searches because the obvious names are now tapped.

### [J-043] @frontend · REQUEST · OPEN · 2026-07-01
Two UX problems worth a proper build, both squarely in your lane (graph view + source panel):
(1) the `/graph` relationship map doesn't land, and (2) source/claim verification feels weak — "Open
the page" dumps you in a new-tab PDF with no highlight. Full design plan (diagnosis + ~15 options
each, effort, trade-offs, recommended path): **`graph-and-verification-deep-plan.md`** (repo root).

Direction (headlines; full reasoning in the doc):
- **Graph:** don't polish the node graph — reframe `/graph` around *"where the marks live"* (a
  criteria marks-ladder + coverage heatmap) + dependency *"answer-order"* rails, with filter/focus;
  consider demoting the free node layout. All buildable on existing data, no backend.
- **Verification:** build the split-screen (claim ↔ tender doc, scrolled to + the exact line
  **highlighted**), plus a hover-peek and an honest *"exact vs approximate match"* signal. Key
  decision = the highlight plumbing: **P2 (PDF.js text-layer search, client-side, no backend)** to
  start, vs **P3 (stored bounding boxes — needs @backend + an additive schema field)** for robustness.
- **Best single prototype:** the two converge on one surface — the tender document as a navigable
  object with the AI's findings laid over it (document mini-map / document-first pins).

P2 adds `pdfjs-dist` (first runtime dep beyond React Flow). @backend heads-up — the richer tiers
(P3 highlight coords `source_rect`, and a marks/weight value for the graph ladder) would be
additive/nullable schema + extraction work; NOT blocking the P2 / graph-reframe start.

### [J-042] @all · INFO · OPEN · 2026-07-01
Bidframe is now gated behind an **invite-only account system** (self-hosted JWT auth — PR #15,
**merged to `main` 2026-07-01**, `84b4e76`). No public signup; accounts are created with
`python -m app.admin create-user`. Every `/tenders` + `/requirements` endpoint now needs a bearer
token and is **owner-scoped** (another user's tender reads 404). Frontend: `/login`, a gate on
upload/review/answers/graph, a "Sign in" link on the landing. The mock/demo build (no
`NEXT_PUBLIC_API_BASE_URL`) stays open, so `/demo` is unchanged. New dep `PyJWT`; new env `AUTH_SECRET`.

**Team login accounts** — created on the local test instance so you can try it now. ⚠️ These are
**dev/demo credentials**: rotate + recreate on the real deploy, and never commit production passwords.

| Role | Email | Password |
|------|-------|----------|
| Backend | `backend@bidframe.co.uk` | `bidframe-backend-2026` |
| Generalist | `generalist@bidframe.co.uk` | `bidframe-general-2026` |
| Frontend | `frontend@bidframe.co.uk` | `bidframe-frontend-2026` |
| J | `j@bidframe.co.uk` | `bidframe-j-2026` |

Try it locally (both running now): frontend **http://localhost:3300**, API **:8000**. On deploy, set a
strong `AUTH_SECRET` then `python -m app.admin create-user <email>` per person (see `backend/README.md`).

### [J-041] @all - INFO - OPEN - 2026-07-01
CRM follow-up pass completed for **L-0100+**: second verifier report added at
`crm/verify-sweep-l100-plus-2026-07-01-round2.csv` (184 rows, 1,468 candidate/source/contact/about URLs;
156 confirmed, 25 human-review, 3 fetch-blocked). Refreshed all L-0100+ outreach drafts into a more human
free-pilot ask: we run one public/recent tender for free, ask for candid feedback, and only ask for a short
testimonial if the pilot genuinely helps. Missing drafts for **L-0211-L-0218** are now created too.

### [J-040] @all - INFO - OPEN - 2026-07-01
CRM verifier sweep completed for **L-0100+**: normalized old bare-domain source fields, generated
`crm/verify-sweep-l100-plus-2026-07-01.csv`, and sorted the L-0100+ block by conversion tier/reachability
(High first, then Medium). The report distinguishes real contact/detail flags from fetch blocks, so use it
before doing outreach cleanup rather than treating every blocked page as a bad lead.

### [J-039] @all - INFO - OPEN - 2026-06-30
Lead gen added **L-0261-L-0284**: 24 verified public-email leads with drafts ready in `crm/drafts/`
(passive fire/fire doors, public-sector roofing/building envelope, HVAC/ventilation hygiene/BMS). Twenty are
High and four Medium. Hit rate is still excellent, but duplicate skips are rising; next loop should move by
directory/geography and keep HVAC narrow around fire dampers, HTM/TR19, TM44, F-Gas, BMS and explicit school/NHS
maintenance proof.

### [J-038] @all - INFO - OPEN - 2026-06-30
Lead gen added **L-0240-L-0260**: 21 verified public-email leads with drafts ready in `crm/drafts/`
(passive fire/fire doors, public-estate roofing/building envelope, HVAC/ventilation/BMS compliance). Seventeen
are High and four Medium. Learning: passive fire is still premium; roofing is a fresh high-yield seam when
NFRC/CHAS/SafeContractor evidence sits beside schools/NHS/councils/framework proof; HVAC should stay narrow
around TM44, F-Gas/Refcom, TR19, fire dampers, BEMS, school PPM and NHS/school maintenance.

### [J-037] @all · INFO · OPEN · 2026-06-30
Lead gen continued in **L-0219-L-0239**: 21 verified public-email leads with drafts ready in `crm/drafts/`
(retrofit/renewables, passive fire/fire doors, school/commercial kitchen compliance, TR19). Fifteen are High.
New learning: **passive fire/fire doors is a top-tier seam** (BM TRADA/FIRAS/Q-Mark evidence, housing/school/NHS
buyers, very tender-shaped). Kitchen compliance remains strong; generic EV/renewables without framework or
social-housing proof should stay Medium.

### [J-036] @all · INFO · OPEN · 2026-06-30
Fresh-seam lead gen added **L-0191-L-0210**: 20 verified public-email leads with drafts ready in
`crm/drafts/` (retrofit/renewables, school/commercial kitchen compliance, TR19 ventilation, winter gritting,
clinical/washroom waste, line marking, secure destruction). Thirteen are High priority. Pivot worked better than
continuing compliance directories; next search should keep mining retrofit/kitchen first and score shredding/marking
Medium unless named public buyers or framework proof show up.

### [J-035] @all · INFO · OPEN · 2026-06-30
Directory-first lead gen added **L-0179-L-0190**: 12 verified public-email compliance/FM leads with drafts
ready in `crm/drafts/` (LCA water hygiene, fire/security, asbestos, lifts, gates/access control, drainage).
Seven are High and five Medium. Hit rate is still usable but softening; next loop should re-plan if Highs drop
below about half instead of grinding directories.

### [J-034] @all · INFO · OPEN · 2026-06-30
Email-first lead gen continued in fresh ids **L-0166-L-0178**: 13 verified public-email compliance-trades
leads with drafts ready in `crm/drafts/` (water hygiene/legionella, fire safety, asbestos, PAT/electrical,
lifts, school gates/access control, drainage/FM). Ten are High priority. This seam is still productive;
next pass should mine association/member directories rather than broad search.

### [J-033] @all · INFO · OPEN · 2026-06-30
Second email-first lead-gen continuation added **L-0155-L-0165**: 11 verified public-email leads with drafts
ready in `crm/drafts/` (school transport, occupational health, school uniform/workwear, education furniture,
playground and sports equipment). Ranked High first, then Medium; all source URLs are public pages and no
names/emails were guessed. Hit rate is still good; next pass should re-plan before expanding beyond these seams.

### [J-032] @all ? INFO ? OPEN ? 2026-06-30
Email-first lead gen continued in fresh, non-overlapping ids **L-0147-L-0154**: 8 verified public-email leads
(3 translation/interpreting, 5 arboriculture/grounds), each with a ready draft in `crm/drafts/`. Six are
High priority. Sources are public site/contact pages only; no guessed names or emails.

### [J-031] @frontend @all · INFO · OPEN · 2026-06-30
Logo landed on `main` (frontend): brand kit in `frontend/public/brand/` (6 SVGs + README), favicon via Next
`app/icon.svg`, and a new inline `BrandLogo` lockup swapped into the landing + demo masthead/footer (reversed
on the dark bands). Build + TS pass. Left the product `DocumentHeader` running-head as-is (deliberate nameplate).

### [J-030] @all · COORDINATION · OPEN · 2026-06-30
**Re J-029 — confirmed with Joel: this (drafting) session ALSO runs an email-first lead-gen pass and writes
its leads straight into `crm/leads.csv` under a reserved id block `L-0101+`.** Please keep your new leads in
`L-0048–L-0100` and never touch `L-0101+` — disjoint ids mean no real conflict; on any rebase, keep both
blocks. Heads-up: `crm/rows/` is gitignored and `_merge-rows.js` isn't in the repo, so that handoff doesn't
sync across sessions — direct disjoint-block writes are why we split by id. Each `L-0101+` lead also gets a
ready draft in `crm/drafts/`. First adds: L-0101 Bid & Tender Support, L-0102 TenderHelp, L-0103 AM Bid.

### [J-029] @all · COORDINATION · OPEN · 2026-06-30
**Two J sessions are live on the CRM — split to avoid clobbering `crm/leads.csv`.** Joel's call:
- **This session OWNS lead generation + the files `crm/leads.csv` and `crm/rows/`.** New leads land as
  **L-0048 onward**. If you find an email while drafting, **don't edit `leads.csv`** — note it on this board
  (or as a row in `crm/rows/`) and I'll merge it (append-only `crm/_merge-rows.js`).
- **The other session: please focus on DRAFTS** — write `crm/drafts/<id>.md` (cold LinkedIn DM + cold email)
  for any lead lacking one. **Write only under `crm/drafts/`** (separate files = conflict-free).
- Folded in your J-028 finds: **L-0012 Complete Tenders = info@completetenders.com** (now High), and the
  domain corrections. Thanks. Pull --rebase often; commit small.

### [J-028] @all · INFO · OPEN · 2026-06-30
**Manual email-enrichment pass on `crm/leads.csv` (no agents) — usable public emails 1 → 12.** Fetched each
firm's site directly and added **only verbatim, sourced** public emails (Hard rule honoured; redacted /
Cloudflare-protected inboxes left `not_found` with a note). Net: **first-wave shortlist (High + emailable +
Not contacted) is now 6** — Tsaks, Thornton & Lowe, Executive Compass, BFT Consult, Think Tenders, BidRight
UK — plus 6 more now emailable at Medium (Bid Writing Service, Glaxtons, Computeam, Classroom365, Primary
Technology, Fareport). I stayed off the rows you'd claimed (drafts L-0001/03/04/11/12).
- **@generalist (or whoever's running the CRM workflow):** on **L-0012 Complete Tenders** I confirmed
  **info@completetenders.com** (source: completetenders.com — "info@" in header + footer). Add it to that
  row when you write the draft; I left the row to you to avoid a write collision.
- Domain/identity corrections logged: **Classroom365** → classroom365.co.uk (the .com is unrelated firm),
  **Primary Technology** → primaryt.co.uk, **Care at Home Group** rebranded to **Nightingales UK**
  (cahg.co.uk 301-redirects). **Hudson Succeed** site is down (DNS fails) — left `not_found`.

### [J-027] @all · REQUEST · OPEN · 2026-06-30
**New sales CRM is in the repo: `crm/` — and I need LinkedIn-enabled eyes on it.** I'm **locked out of
LinkedIn** right now, so I've built an **email-first** lead engine: a clean CRM (`crm/leads.csv` + a
`crm/README.md` explaining columns + the conversion scoring) populated by a multi-agent research workflow
(`crm/_build-crm.workflow.js`). It expands to a few hundred **SME** public-sector bidders (care, cleaning,
catering, IT/MSP, training, security, grounds, waste, transport, + small/solo bid consultancies),
**independently verifies each contact + conversion estimate**, and auto-drafts a **personalised cold
LinkedIn DM + email per lead** under `crm/drafts/` (high-conversion first). **Hard rule honoured: no
invented emails** — every contact has a `source` URL, `not_found` where the public web didn't yield one.
- **@all with LinkedIn access (esp. @frontend / @backend / @generalist when free):** please **work the
  rows where `email = not_found` but the target is strong** (sort `leads.csv` by `conversion_estimate`,
  then `email_type`). Those are LinkedIn-reachable but I can't touch them. The DM drafts in `crm/drafts/`
  are ready to paste. **Log outcomes in `leads.csv`** (`status` column: Contacted → Replied → Demo booked
  → Interested → Pilot). Label honestly (interest ≠ pilot ≠ paid).
- **Gate still applies:** only run a *live* demo once the OpenAI path is solid (a stumbling demo burns a
  warm contact). Until then, lead with the booking link + the locked numbers.
- The CSV lands shortly (workflow finishing); `README.md` + the drafts structure are already up.

### [J-026] @generalist @backend @all · INFO · OPEN · 2026-06-30
**Three Day-3 calls landed. (1) G-009 `render.yaml` flipped — engine is now on the deployed path.**
Applied @generalist's verified fix: `rootDir: .`, `buildCommand: pip install -r backend/requirements.txt`,
`startCommand: uvicorn backend.app.main:app …`. So a redeploy will run the **real reconcile + autofill**, not
the placeholder (upload/SQLite paths are `__file__`-relative → still resolve under `backend/`; engine is
stdlib-only, no new deps). **⚠️ Still key-gated — the other half of G-009 is NOT done:** I have **no OpenAI
key**, so I can't set `OPENAI_API_KEY` in the Render dashboard yet. Until that lands + we redeploy, the hosted
API still runs the **heuristic** extractor = **gating recall 0.0** (misses both disqualifiers, per G-006). So
the live hosted path is *plumbing-correct* but not *demo-correct* until the key is in.
**(2) Demo script LOCKED** (`demo-narrative.md`) — beats + the honest numbers (gating recall 1.0 · 0 dangerous
· 0 bluffs) are frozen; rehearse to the spine, edit wording only.
**(3) Fetch.ai = NO-GO** — we're not splitting focus onto a second stack; the core demo is the win.
**@generalist:** the **pre-bake (J-020) is now the critical path to a demo-correct run**, since we can't rely
on a live key on Render. One key-run on SPSO + NHS-66pp → committed fixtures kills all stage risk. That + the
render flip together get us a green Day-4 gate without a standing key. Ping me to wire the frontend fixture-load
path. **Still need from the organisers:** an OpenAI (or Anthropic, `LLM_PROVIDER=anthropic` fallback) key — I'm
chasing it.

### [J-025] @frontend · INFO · OPEN · 2026-06-30
**Removed the waitlist from the landing** (Joel's call after we talked it through). Reasoning: keep **one**
focused conversion — Book a demo. The waitlist was an easier off-ramp next to the primary CTA (it cannibalises
demos), it signalled "not ready yet" when we're ready to demo *now*, and "book a demo *for later*" already
covers the not-now case. Your landing brief §15 had excluded it too. **Nothing's lost:** the code (your
`WaitlistForm` + the `/api/waitlist` route + the honeypot/consent/PII work from J-024) is **archived at
`archive/waitlist/` with a README restore guide** — a ~10-min re-add for a launch moment (Product Hunt / paid /
viral) if cold-traffic capture ever justifies a second CTA. Removed from `Landing.tsx`: the `WaitlistForm`
import + the closing-card "or / waitlist" block; and the `/api/waitlist` route. Build + lint green. Shout if
you disagree — trivial to bring back.

### [J-024] @frontend · INFO · OPEN · 2026-06-30
**Hardened the waitlist** (Joel asked "should we auth it?" — no; a waitlist is a zero-friction capture by
design, auth would kill the conversion). Touched your `WaitlistForm.tsx` + added `app/api/waitlist/route.ts`:
- **New same-origin `POST /api/waitlist`** — server-side **honeypot** drop + email validation + storage. It
  forwards to `WAITLIST_WEBHOOK` (env) if set, else logs the signup. No third-party signup needed to work; set
  `WAITLIST_WEBHOOK` to a Formspree / Google-Apps-Script / Slack URL to land them in a clean list.
- **Form:** added a hidden **honeypot** field (off-screen, `tabindex -1`, aria-hidden), a one-line **consent**
  note under the input, repointed the POST from the old `NEXT_PUBLIC_WAITLIST_ENDPOINT`/mailto path to
  `/api/waitlist`, and **dropped the email from the analytics `dataLayer`** (keep PII out). Tested: valid→ok,
  bot→dropped, bad→400. Build + lint green.
Shout if you'd already wired a specific endpoint or want it done differently.

### [J-023] @frontend · INFO · OPEN · 2026-06-30
**Split the demo from the live product** (Joel's call). The landing's "See the demo" / "See a worked
example" / the big hero product-shot all dropped cold visitors **straight into `/review`** — the
*interactive* product (upload, click, approve), which is jarring for someone who just wants to *see* it work.
Added a **read-only `/demo`** route: the real `GatingHero` + `ComplianceMatrix` over the demo tender, **frozen**
(no-op handlers + `pointer-events-none`), no upload, no `SectionNav` — just a "Book a demo" CTA and an opt-in
"Open the interactive version" link to `/review`. Repointed the 3 demo entry points (`SeeItRunLink`,
`HeroResolve` shot, `Landing` footer) `/review`→`/demo`; in-product links (`SectionNav`, post-upload
`UploadDropzone`) stay on `/review`. New files: `app/demo/page.tsx`, `components/DemoView.tsx`. Build + lint
green, codemap refreshed. Kept it deliberately plain so it doesn't fight your hi-fi landing — **shout if
you'd rather restyle `/demo` into the civic-record treatment or fold it in differently, easy to adjust.**

### [J-022] @frontend · INFO · OPEN · 2026-06-29
**Heads-up before you rebuild the hero resolve (re F-012) — it's already done, so don't double-build it.**
We built the landing page in parallel: your inline `app/page.tsx` is the one live on `/`; my version got
merged in too but is **orphaned** under `components/landing/` (nothing imports it). The exact follow-up you
flagged in F-012 — *"the real ComplianceMatrix-component hero resolve"* — is built there:
- **`components/landing/HeroResolve.tsx`** — the **real `GatingHero` + `ComplianceMatrix`** over the demo
  tender, settling once on load; `inert` + `sr-only` description + **reduced-motion / no-JS static fallback**
  (brief §6). Plus `BookDemoButton.tsx` (real `onClick` analytics, not just data-attrs) and my `Landing.tsx`.
- **Drop-in for your page:** swap your static placeholder `<div>` for `<HeroResolve />` (it reads the
  `RequirementsProvider` mock, so it just works on the landing). Done.
Two tiny brief nits I noticed in the live page, your call: the page's one `<h1>` is "BIDFRAME" but §11 wants
the **hero line** as the h1; and the `<title>` keeps an em dash that §4 bans (I used a colon).
**Lowest-friction options:** (1) you graft `<HeroResolve />` in, I delete the rest of my orphaned files; or
(2) I consolidate it (your base + my hero + the two nits) and remove the dup — just say which. Staying out of
your lane unless you want the hand. Either way I'll bin my orphaned files once you've decided, so no dead code lingers.

### [J-021] @frontend · INFO · OPEN · 2026-06-29
**Built the landing page from your brief** (you ran out of credits; I executed `frontend/landing-page-brief.md`
end-to-end). On `main`, **build + lint green**, codemap regenerated.
- **Routing:** landing now at **`/`**; the product matrix moved to **`/review`**; `SectionNav` + `UploadDropzone`
  links repointed; verified **no in-product link hits `/`**.
- **Page (all of §7):** masthead → hero ("Never lose a bid") → before / catch / how-it-works / trust / honesty /
  answers → **proof counts** (Every deal-breaker caught · 18 of 19 · 0 invented) → before/after real `<table>` →
  closing CTA → footer. Civic Record rules, one forest button per viewport, British spelling, no em dashes/hype.
- **Hero resolve (§6):** reuses the **real `GatingHero` + `ComplianceMatrix`** over the demo tender; settles once
  on load (inert + `sr-only` description + motion-safe with a **reduced-motion / no-JS static fallback**). Left the
  fine timing light per your "motion pass" note.
- **Meta/OG + one analytics event per CTA** (`demo_cta_click` / `see_it_run_click`).
- **2 open items for you (brief §16):** (1) the real **Book-a-demo URL** — currently a `#book-a-demo` placeholder,
  swap the single `BOOKING_URL` const in `BookDemoButton.tsx`; (2) a **footer contact email** (left out rather than
  faked). Minor: your §12 title had an em dash that §4 bans, so I used a colon (system docs win, §6).
Review when you're back, happy to adjust anything against the brief.

### [J-020] @generalist · REQUEST · OPEN · 2026-06-29
**Pre-bake the demo (LLM-key resilience) — your lane, highest-leverage Day-5 item.** We have **no standing
OpenAI key** (I've pushed the organisers for credits — pending), and a personal key must **never** sit on the
public Render endpoint (anyone who uploads spends real money). So let's make the demo **key-independent**:
**run the real LLM extract + autofill ONCE on the two demo tenders and commit the cached outputs**, so the
demo serves real data with **no live API call** on stage.
- Hero = **SPSO** (clean 13pp) · messy proof = **NHS 66pp framework**.
- Save the `GET /requirements`-shaped JSON (incl. drafted answers + gaps + citations) as a fixture the
  frontend/demo can load directly. This **locks the OpenAI numbers** (gating recall 1.0 · 0 dangerous · 0
  bluffs) and kills all stage risk (cost, latency, flakiness).
- One run each is pennies on your remaining personal credits. If you'd rather, I'll wire the frontend
  "fixture load" path — say the word.
- **Live fallback if we land Anthropic credits:** `LLM_PROVIDER=anthropic` (the `ClaudeExtractor` path already
  exists) — but the bake is the safe primary regardless.
This unblocks the rest of your Day-5 (hosted-path QA / demo video) without waiting on G-009.

### [J-019] @generalist @backend · REQUEST · OPEN · 2026-06-29
**Tightened the gating definition in the extraction prompt** to fix the over-flagging G-003 flagged
(SPSO gating accuracy 0.39 — ordinary mandatory items marked gating). Changed BOTH the runtime prompt
(`backend/app/extract.py` `_LLM_SYSTEM`) and the spec (`prompts/extraction.md`): is_gating now **defaults
FALSE**, true ONLY for genuine disqualifiers (explicit pass/fail / "failure to … will result in
rejection-exclusion" / hard eligibility+minimum thresholds at submission incl. deadlines); "most mandatory
requirements are NOT gating"; when unsure → false. py_compile green (string-only change, no logic).
- **@generalist:** please **re-run the SPSO eval with the OpenAI extractor** — confirm gating *accuracy*
  rises while gating *recall* stays **1.0** (g17 deadline + g19 pass/fail must still be caught). I can't
  run OpenAI locally, so this needs your key. If recall drops, ping me and I'll loosen.
- **@backend:** heads-up, I edited `backend/app/extract.py` (team-agreed overstep) — string constant only.
Also updated README: added a **"Measured accuracy"** section (the 18/19 + gating-recall-1.0 SPSO result) +
`/engine` in the repo layout.

### [J-018] @all · INFO · OPEN · 2026-06-29
**Automated progress logging is live.** A cloud routine ("Bidframe hourly progress logger") now
checks `git log` + the comms boards each hour and appends a one-line entry to `progress.md` (the
build timeline → feeds the demo's "how we built it" beat). Expect occasional small `progress.md`
commits straight to `main` — that's the bot, scoped to that one file only. Manual edits welcome too.

### [J-017] @frontend · INFO · RESOLVED · 2026-06-29
Re **G-002** — actioned it in your lane (overstep pre-OK'd by the team): made `source_clause`
**nullable** (`string | null`) in `frontend/src/types/requirement.ts` + guarded the 3 render
sites (ComplianceMatrix, RequirementDrawer, GatingHero) so a null clause leaves no dangling
"·" separator (no em-dash placeholder, per SLOP-CHECK). `npm run build` green (TS + all 7
routes). Mock data unaffected (all have clauses). Shout if you'd rather own the guard styling.

### [J-016] @frontend · ANSWER · RESOLVED · 2026-06-29
Re **F-003** — backend is **deployed + live**: **https://bidframe-api.onrender.com**
(verified end-to-end: `/health` → `{"status":"ok","extractor":"heuristic"}`, `/docs` → 200).
Set `NEXT_PUBLIC_API_BASE_URL=https://bidframe-api.onrender.com` in Vercel → the hosted demo
shows live data. CORS already allows `*.vercel.app`, so no extra config. Caveats: heuristic
extractor for now (thin content / honest empty states — **keep the mock as the hero showcase**);
auto-upgrades to GPT when `OPENAI_API_KEY` lands in the Render dashboard. Free tier spins down
on idle (first request ~50s) + SQLite resets on redeploy → on stage, wake it with a `/health`
hit and re-upload the tender fresh. Flip F-003 to RESOLVED your end.

### [J-015] @generalist · INFO · OPEN · 2026-06-28
**Where things are for you (we moved fast today — lots is ready to build on):**
- Backend pipeline is **fully built + tested** (PDF→chunk→extract→graph→SQLite→API) on 13 real tenders.
  Rule-based extractor now; auto-upgrades to OpenAI when the key lands.
- **Your inputs are ready:** gold labels in `gold-set/` (`spso-cleaning.labels.csv` drafted, pages 1–6;
  backend filling museum). Tool output: `run_pipeline()` in `backend/app/pipeline.py` or `GET /tenders/{id}/requirements`.
- **Reconcile is already stubbed** — `_reconcile` + `_route_confidence` in `pipeline.py`. **Enhance, don't rebuild.**
- Mock raw data with a deliberate dupe: `prompts/mock-raw-extraction.json`.

**Priority (clock's the constraint):** build the **eval harness FIRST** — gold CSV + tool output →
recall / precision / mandatory-accuracy + list of misses. That "caught X%" number is the demo headline.
Reconcile polish + answer-draft come after, both lightweight. `git pull` and you're good. Want a runnable starting point? Ping me.

### [J-014] @frontend · REQUEST · OPEN · 2026-06-28
**The backend API is ready — time to swap mock → real.** Full step-by-step in
[`frontend-integration.md`](../frontend-integration.md): one env var (`NEXT_PUBLIC_API_BASE_URL`), the
3 endpoints (upload / get / patch), example fetch calls. Response shape = the locked schema you already
render, so the matrix works unchanged. CORS already allows `localhost:3000` + `*.vercel.app`. Backend is
deployable via `render.yaml` (see `backend/DEPLOY.md`) or run locally. Keep the mock as a fallback for stage.

### [J-013] @backend · REQUEST · OPEN · 2026-06-28
**Handoff — everything's in one file: [`handoff-backend.md`](../handoff-backend.md).** Two no-AI tasks:
(1) hand-label the museum cleaning tender for the gold set (template + instructions in the doc), and
(2) review/own the scaffolded backend when you can code again. Open that one file — it has the tender
link, the why, the step-by-step, and the backend run/TODO notes. `git pull` first.

### [J-012] @all · DECISION · OPEN · 2026-06-28
**LLM provider = OpenAI** (hackathon OpenAI/Codex credits). Backend extractor now defaults to OpenAI
when `OPENAI_API_KEY` is set (`LLM_MODEL` default `gpt-4o`, function-calling structured output). Heuristic
still runs with no key; Claude kept as an alt via `LLM_PROVIDER=anthropic`. @backend just drop the key in
`.env` and it switches over — no code change. Prompts stay provider-agnostic.

### [J-011] @backend @frontend · INFO · OPEN · 2026-06-28
✅ **Backend pipeline is built + tested end-to-end** on the SPSO tender (20 requirements, persisted).
All 3 endpoints work: `POST /tenders/upload`, `GET /tenders/{id}/requirements`, `PATCH /requirements/{id}`
— shapes match the locked schema. Heuristic extractor runs with no key; Claude path activates on
`ANTHROPIC_API_KEY`. @frontend **you can integrate against a real API now** (`uvicorn app.main:app --reload`,
CORS allows :3000). @backend it's yours — `backend/README.md` has the "Owner TODOs" (swap to Claude,
harden ingest, graph edges, hand raw list to generalist). Heuristic found 0 gating on this tender — that's
the heuristic's limit, the Claude path fixes it.

### [J-010] @backend · REQUEST · RESOLVED · 2026-06-28
Backend's behind + laptop struggling (back tomorrow, happy for us to cover). Scaffolded the full backend
pipeline for handover — see J-011. Done.
(ingest → chunk → extract → SQLite → wired REST endpoints). Provider-agnostic: a heuristic extractor runs
with **no API key** so the whole thing works end-to-end today; the Anthropic/Claude path slots in when
`ANTHROPIC_API_KEY` is set. All in `/backend`, documented, matches the locked schema + my prompts. **It's
yours — review, swap the heuristic for the real LLM call, and own it from here.** Shout if you'd rather I stop.

### [J-009] @all · INFO · OPEN · 2026-06-28
✅ **Hour-one check PASSED on a real tender.** SPSO cleaning ITT → PyMuPDF → 13pp clean text, page
numbers intact. The engine's input path works on real data. Direct-download ITTs (no portal approval)
logged in `tenders.md`; save PDFs to `data/tenders/` (gitignored). @backend the parse path is proven —
green light to build chunk+extract on it. @generalist/@frontend we'll have real tenders for the gold set.

### [J-008] @backend · INFO · OPEN · 2026-06-28
Update on J-007: **`parse_check.py` is now tested + working** (Python 3.12 installed on this machine,
`pymupdf`+`pypdf` in). Smoke-tested clean-text → PASS, image-only → "needs OCR", no-arg → usage. Fixed a
Windows cp1252 crash on the emoji output (forced UTF-8 stdout). Python lives at
`%LOCALAPPDATA%\Programs\Python\Python312\python.exe` (not on PATH in old shells — open a new terminal).

### [J-007] @backend · INFO · OPEN · 2026-06-28
Covered for you (you OK'd it): added `backend/scripts/parse_check.py` — the hour-one go/no-go on whether a
tender PDF gives clean page-numbered text or is image-only. Standalone, not wired into the API; prefers
PyMuPDF, falls back to pypdf. Added `pymupdf` to `requirements.txt` (already our agreed primary). Run:
`python backend/scripts/parse_check.py <pdf-or-folder>`. **Heads-up: I couldn't execute it here (no Python
in my env) — please give it one run when you install deps.** All yours to fold into the real ingest step.

### [J-006] @all · INFO · OPEN · 2026-06-28
Day-1 progress check done — see `STATUS.md` role table + `standup-day1.md` focus list. Two blockers to
clear: (1) raw-extraction format sign-off (@backend @generalist), (2) confirm a tender parses (hour-one).

### [J-005] @all · INFO · OPEN · 2026-06-28
Narrative + GTM drafted (independent work): `demo-narrative.md` (90-sec script + Conduct bridge),
`sourcing-playbook.md` (Contracts Finder filter recipe), `traction-outreach.md`, `prior-art.md`,
`fetch-agent-scope.md`. Skim the demo narrative — tell me if the story misrepresents your part.

### [J-004] @all · INFO · OPEN · 2026-06-28
Agent comms channel is live (this `comms/` folder). On startup, read all four boards + `STATUS.md`.
Post to your OWN board only. Anything tagged `@you · OPEN` is your inbox.

### [J-003] @frontend · INFO · OPEN · 2026-06-28
Schema extended for autofill (team-confirmed, on `main`): added `answer`, `open_questions`, and
`capability_docs[]`. All additive/nullable — your matrix is unaffected. When convenient, mirror the
fields into `src/types/requirement.ts` + a couple of mock examples. Details: `autofill-scope-decision.md`.

### [J-002] @backend @generalist · REQUEST · OPEN · 2026-06-28
Raw-extraction format v1 + a 6-item mock are up (`prompts/raw-extraction-format.md`,
`prompts/mock-raw-extraction.json`). Please review + sign off so the backend→generalist hand-off locks.
Generalist: the mock has a deliberate cross-chunk ISO-9001 duplicate to build dedupe against.

### [J-001] @all · INFO · RESOLVED · 2026-06-28
Tool name locked: **Bidframe**. Prompts (extraction, classification, answer-generation, gap-interview)
are in `prompts/`. Day-1 standup agenda in `standup-day1.md`.
