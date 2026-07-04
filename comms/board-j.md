# Board — J (prompts · orchestration · narrative · traction · glue)

*J writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

### [J-100] @frontend · HEADS-UP · OPEN · 2026-07-04 · navbar is now 4 sections (Tender/Bid/Matrix/Graph)
Landed `9168c39` (2 files, low-collision): **`SectionNav`** now shows the four working sections —
**Tender** (`/upload`) · **Bid** (`/answers`) · **Matrix** (`/review`) · **Graph** (`/graph`) — replacing
`Tenders · Review · Pack`. And **`/answers` (Bid) now uses the app-wide `RequirementsProvider`** (dropped its
local frozen-Bradwell provider) so Bid reflects the **selected** tender in live mode instead of showing
"No tender loaded" once a real tender is opened. Demo falls back to the seeded sample; still no AuthGate, so
the showcase "Answers" tab opens instantly.

Nothing else touched — the tender-selection gate (`NoTenderLoaded`), the readiness/progress ledger, and the
PDF/Word `ExportMenu` **already existed** on those routes; the nav was the only real gap. `npm run build` +
`npm run lint` green (had to `npm install` — `mammoth` from the Office-source work wasn't in local
`node_modules`; heads-up if your build breaks the same way).

**Two follow-ups if you're polishing:** (1) `DocumentHeader`'s in-tender tabs still say "Review/Answers/Graph"
— rename to "Matrix/Bid/Graph" for consistency with the masthead. (2) A judge clicking **Answers** *from the
showcase* now sees the mock sample rather than the Bradwell run (both valid demo data) — fine to leave, flag
if you'd rather I seed the global provider with Bradwell.


### [J-099] @backend · REQUEST · OPEN · 2026-07-04 · DEPLOY DECISION: backend goes on Fly.io — runbook ready
**We're deploying the backend to Fly.io.** Render is out — its free build/pipeline minutes are exhausted
(every deploy since `975becd` @ 7:05pm was *blocked*, not code-failed) and the Pro plan is $25/mo. Cloudflare
can't run this backend (serverless — no SQLite/disk/long extraction). Fly runs our existing `backend/Dockerfile`
as a real always-on container — the right fit.

**Full step-by-step runbook: [`ops/fly-deploy.md`](../ops/fly-deploy.md).** It's copy-pasteable and covers the
non-obvious bits I verified in the code:
- Run `fly launch` **from `backend/`** (Dockerfile context is `backend/`, app lands at `/app`).
- Persist accounts/tenders via a **Fly volume** at `/data` + `DATABASE_URL=sqlite:////data/tender.db` (default
  is ephemeral and wipes on redeploy).
- Secrets to set before first deploy: `AUTH_SECRET`, `OPENAI_API_KEY` (we have it), `LLM_MODEL=gpt-4o`,
  `CORS_ORIGINS=https://bidframe.org,https://www.bidframe.org` (CORS already reads this env + `*.vercel.app`).
- Create the two demo accounts on the live machine (`fly ssh console` → `python -m app.admin create-user … --name …`)
  **after** first deploy.
- Then Vercel: `NEXT_PUBLIC_API_BASE_URL=https://bidframe-api.fly.dev` + **rebuild**.

The whole live-collab demo (share → two accounts → attributed decisions + activity feed) rides on this. If Fly
fights back, the runbook's fallback is localhost (identical product, 5 min). Ping me if any step 404s or CORS-errors.

### [J-098] @backend · DELIVERABLE · OPEN · 2026-07-04 · backend task queue (non-deploy) — deepen collab + mixed-pack
Nice work on ZIP (`113c268`). While the deploy/accounts is being sorted separately, here's a prioritised
backend queue that makes the two live features **deeper and more real** — all pure backend, testable locally
(no deploy, no key). The collab foundation is on `main` (share/members/`decision.actor`/`can_access`, 6 e2e
tests in `engine/tests/test_collaboration.py`); build on it.

1. **Append-only activity log (highest value — makes the collab feed a REAL timeline).** Today the activity
   feed derives from each row's *current* `decision` (last-write-wins), so if Alice edits then Bob approves,
   Alice's edit vanishes from the feed. Add a `decision_events` table (`tender_id, req_id, actor_id, action,
   note, timestamp`) appended on every PATCH in `main.py:update_requirement`, and a `GET /tenders/{id}/activity`
   (member-scoped, newest first) returning the full history. That turns "who did what" into a true team audit
   trail. Frontend can then swap `ActivityFeed` to this endpoint (tell @frontend).
2. **Complete the sharing API.** `DELETE /tenders/{id}/share` (owner removes a member) + optionally a `role`
   column on `tender_members` (owner/editor/viewer) with the guard reading it. Add tests (member can't re-share
   or delete the tender — already 404s; lock it with a test).
3. **Per-file upload progress.** `JobStatus` has no per-document field, so the frontend can't show per-file
   progress on a big/mixed pack. Add a `docs: [{filename, stage}]` (or a simple `files_done/files_total`) to the
   job snapshot in `_run_extract_job`, surfaced via `GET /tenders/jobs/{id}`. Unblocks @frontend's upload-list UX.
4. **Structured Office locator.** Right now the `[XLSX Pricing row 5 | A5:E5]` locator lives only in the page
   text; set `source_clause` to a clean `Pricing!A5` for Office-derived requirements so the source panel reads
   nicely (the stretch from J-092). PDF rows unchanged.
5. **Mixed-pack gold + eval (measure the cross-format claim).** A tiny hand-labelled gold set over
   `fixtures/mixed-pack/` (a few gates per format) + wire it so `net_floor`/`gating_recall` can score it — turns
   "catches deal-breakers across formats" from a smoke check into a measured number for the README/Q&A.
6. **Harden.** Graceful handling of a malformed/empty `.docx`/`.xlsx`, a password-protected file, and a `.zip`
   with nested folders/unsupported entries — each a clear 422, never a 500. Add a test per case.

Do them top-down; each is independently shippable. `python -m pytest engine/tests -q` + `python -m
engine.scripts.mixed_pack_smoke` must stay green. Commit small, pull --rebase, push.

### [J-097] @frontend · DELIVERABLE · OPEN · 2026-07-04 · collaboration is on main — yours to polish (foundation shipped)
📄 **Full build spec: [`ops/collaboration-frontend-polish.md`](../ops/collaboration-frontend-polish.md)** —
exact files/functions to reuse, insertion points per task, and the two-account test recipe. Summary below.

Built a real multi-user **collaboration** feature end-to-end (backend + frontend foundation, all on `main`,
build green, 260 backend tests + 6 two-account e2e). **What's live:**
- **Shared tenders:** `POST /tenders/{id}/share {email}` + `GET /tenders/{id}/members`; owner-guards rewired to
  `can_access` (owner OR shared member); `decision.actor` stamped **server-side** (un-forgeable). `users.name`
  + `admin create-user --name`. `/auth/me` returns `name`.
- **Frontend:** `lib/collaborators.ts` (stable initials+colour+`actorLabel`), context stamps the actor onto
  every decision, **per-row attribution** ("Approved by <name>" in `RequirementPanel`/`ApprovalStamp`), and two
  new components mounted in `MatrixView` after `ControlPanel`: **`ActivityFeed`** (who did what, newest first)
  and **`ShareControl`** (invite by email + member avatars, live-only). Both self-hide on the frozen/solo build.
- **Your polish (reuse `lib/collaborators.ts` — don't reinvent avatars):** (1) a small **initials avatar on
  decided matrix ROWS** in `ComplianceMatrix`; (2) a **per-person tally** + members strip in `ControlPanel`
  ("2 by Sarah · 1 by James"); (3) upgrade `ShareControl`'s inline panel to a proper dialog + nicer states;
  (4) placement/visual polish of the feed + share button; (5) **browser-test the two-account flow** against a
  live backend (needs @backend's redeploy, J-096). Stretch: presence ("viewing now").
- To test locally: `admin create-user a@x.co --name "Alice" --password ...` ×2, sign in as A, Share to B, sign
  in as B, both decide, watch attribution + the feed. Everything degrades to "you" when signed out.

### [J-096] @backend · DELIVERABLE · OPEN · 2026-07-04 · next task — ZIP packs + Render redeploy (the real-world gaps)
Prebake + `/pack` route are live, so the *demo* works. Two gaps remain for a *real user*:
1. **ZIP support (bump from cut-line to in-scope).** Procurement portals deliver a tender pack as a **single
   `.zip`** — that's the file a user actually has, and we currently reject it. Add `.zip` to the upload path:
   unzip in memory, dispatch each contained `.pdf/.docx/.xlsx/.csv` through the existing `ingest_document`
   (skip nested/unsupported entries with a clear note), preserve per-entry `source_filename`. Guard the size/entry
   count. This is the single thing that makes "upload the tender pack" true to how packs are delivered.
2. **Redeploy the backend** (Render or the new host) so the **live** upload path actually runs the mixed-pack code —
   deps (`python-docx`/`openpyxl`) are already in `backend/requirements.txt`; it just needs a redeploy + a health check.
*Stretch:* add a per-file field to `JobStatus` so the frontend can show per-document progress on a big pack.
Verify with `python -m engine.scripts.mixed_pack_smoke` (add a `.zip` fixture to `fixtures/mixed-pack/`).

### [J-095] @frontend · DELIVERABLE · OPEN · 2026-07-04 · next task — polish /pack (new front door) + the upload list
Great work on `bdf1235` (badges + ControlPanel pack summary + export column). I wired a **`/pack` route** (mirrors
`/showcase`, seeded from `mixedpack-prebake.json`) so your pack UI now has a real, offline, no-auth surface — **this
is the mixed-pack demo/video screen.** Your next:
1. **Eyeball + polish `/pack`** at projector size: confirm the format **badges**, the **"Tender pack: 4 documents"**
   summary, and a **deal-breaker from the Word/Excel file** all read clearly; a PDF row still highlights, an Office
   row shows text + locator with **no** fake highlight. This is the screen that goes in the video — make it shine.
2. **Multi-file upload *list* UX** (the biggest J-093 gap still open): replace the `"${n} documents"` collapse in
   `UploadDropzone` with a per-file list (icon · name · size · remove) + a pack-aware `ProcessingView`.
3. **Make `/pack` discoverable** — a link from the landing / nav / `/showcase` so a judge finds it.
Build against the prebake (no backend needed). Keep the PDF proof unchanged.

### [J-094] @generalist · INFO · OPEN · 2026-07-04 · covered lane 02 (engine/eval) — Bobby offline, suite green
Bobby's internet is down, so I covered the generalist mixed-pack lane (`ops/mixed-pack-02-engine-eval.md`).
On `main`: new **`engine/tests/test_mixed_pack_engine.py`** (5 tests, all green) proving the trust layer is
format-neutral:
1. the deterministic net catches **pass/fail + deadline + mandatory-return + exclusion** gates in
   **`ingest_office`-shaped text** (locator-prefixed `[XLSX …]`/`[DOCX …]`/`[CSV …]` rows) — and `uncovered_gating`
   surfaces them with zero extraction;
2. **cross-document no-merge** — two identical-text `source_page=1` reqs from different `source_doc_id` **merge if
   flattened** (documents the gap) but stay **separate when reconciled per-doc** (the shipped invariant). The
   per-doc partition is load-bearing — reconcile has no `source_doc_id` guard and I did **NOT** add one (schema-adjacent);
3. eval `format_report`/`_render` handle an Office locator `source_clause` without crashing.
Plus a **gotcha section in `engine/README.md`**. Did **not** duplicate backend's `test_ingest_office`/
`test_upload_mixed_pack`. **Full suite 235 pass / 2 skip; `mixed_pack_smoke` still green.** @generalist review when back.

### [J-093] @frontend · DELIVERABLE · OPEN · 2026-07-04 · detailed UI brief — make the pack VISIBLE (`ops/mixed-pack-05-frontend-ui.md`)
Your light lane (`ec5545f`) shipped all the data/logic; the gap is it's **invisible**. Full build spec in
[`ops/mixed-pack-05-frontend-ui.md`](../ops/mixed-pack-05-frontend-ui.md) — ranked by demo value:
**(1)** real multi-file upload *list* (today N files collapse to "3 documents"), **(2)** per-row PDF/Word/Excel/CSV
**badges** (helpers already exist, unused), **(3)** a **"Tender pack: N docs" strip** consuming
`RequirementsContext.sourceDocs` (plumbed, rendered nowhere), **(4)** ControlPanel doc tally, **(5)** fix the
mislabeled Office path in `SourceVerifyOverlay`, **(6)** `source_filename` column in CSV/XLSX export, **(7)** a
`.csv` mock row. Build against the existing mixed mock now; no schema change; PDF proof unchanged. **Cut line:
#2 + #3** make it demo-visible with the least code. Screenshots of this feed the video/submission.

### [J-092] @backend · DELIVERABLE · OPEN · 2026-07-04 · next task — freeze a mixed-pack prebake (the feature has no demo surface)
Great work landing the parser (`b74ff42`, fully wired). One gap: **the shipped feature is invisible on stage** —
all three prebakes (`bradwell/nhs/spso`) are single-PDF, and `/demo` renders a frozen `TenderResponse` JSON, not
a live run. **Ask:** run `run_pipeline_multi` over a PDF ITT **+ `fixtures/mixed-pack/{docx,xlsx,csv}`** and snapshot
the result to **`frontend/src/data/mixedpack-prebake.json`** (same shape as `bradwell-prebake.json`). That gives
the video/demo one real screen proving the three things the feature delivers: per-file `source_filename` provenance,
Office **sheet/row locators**, and `source_rect=null` (honest — no fake highlight). *Stretch:* set `source_clause`
to the Office locator (`Pricing!A12`) so the source panel reads it. (Render just needs a redeploy — `python-docx`
+ `openpyxl` are already in `backend/requirements.txt`.) Verify it loads with `python -m engine.scripts.mixed_pack_smoke`.

### [J-091] @backend @generalist @frontend · DELIVERABLE · OPEN · 2026-07-04 · mixed-pack QA groundwork up — you're unblocked
Release/QA lane (brief 04) hour-0 done, all on `main`:
- **Fixtures ready** — `fixtures/mixed-pack/` (synthetic, committed): `sample-return-forms.docx`,
  `sample-pricing-schedule.xlsx` (`Pricing` sheet), `sample-compliance.csv`. **7 planted deal-breakers**;
  per-file expected extraction in `fixtures/mixed-pack/README.md`. Verified: all re-open clean and the
  deterministic net (`engine.gating_scan`) flags the planted gates.
- **@backend (01)** — parse against real files now, not just synthetic `IngestedDoc`; the README is ground truth.
- **@generalist (02)** — point the format-neutral safety-net tests at these; expected gates are documented.
- **@frontend (03)** — a real pack to prove the honest source-label / no-fake-highlight behaviour.
- **Green baseline recorded** (release-gate #1 = "PDF-only stays green"): engine **223 pass / 1 skip**, FE
  `build` green (18/18), lint 0 errors. Gate + cut lines + command log: `ops/mixed-pack-qa-log.md`.
- Wording is **"Upload the tender pack"** — never "Office integration." 3:55 Q&A answer for "Word/Excel?"
  added to `demo/qa-prep.md` #11: say **"shipping today," not "done,"** until the gate is green.

### [J-090] @all · COORDINATION · OPEN · 2026-07-04
**16-hour mixed-pack sprint is split and on `main` (`7fb925b`).** Four independent briefs are ready:
backend ingestion, generalist trust/eval, frontend light UI, and release QA. The product wording is
**"Upload the tender pack"**, not "Office integration", unless we actually connect to Microsoft systems.
Release owner starts from [`ops/mixed-pack-04-release-qa.md`](../ops/mixed-pack-04-release-qa.md). Cut
order is clear: drop ZIP and `.xls` first; never claim Word/Excel support unless the backend path actually
ships.

### [J-089] @backend · DELIVERABLE · OPEN · 2026-07-04 · Pranav — your demo-section brief is up (`demo-day/pranav-demo-section-brief.md`)
**@Pranav — read this before you script the demo.** It's the source of truth for the **demo section**
under **today's** split: **deck = Bobby + Jawad; demo = Joel (drives + speaks) + you.** The three older
scripts (`pitch-run-of-show`, `demo/pitch-script`, `speaker-notes-2026-07-04`) each show a *different*
speaker split and **none matches today's** — hence the confusion; use the brief for the demo, sync deck
timing with Bobby/Jawad.
- **What's in it:** the ~2-min beat map with a proposed **Joel/Pranav split** (you take the deal-breaker
  catch intro + the eval numbers; Joel drives + control beat), the **locked numbers to say exactly**
  (12/12 · 26/26 · Bradwell 10/10 · Duffield 0-missed · 101/101 synthetic · 42/42 citations), the honesty/
  pre-baked stage rules, your backend Q&A, and pointers to Bobby's files.
- **⚠️ Deck change that affects your handoff:** a 6th "Competitors" slide was added
  (`pitch-competitor-analysis.md`) → the deck's 170s timing is being re-summed but stays ~3 min, so your
  2-min window is unchanged; **confirm the exact hand-in/hand-back slide with Bobby/Jawad** (§3, §8).

### [J-088] @generalist @frontend · DELIVERABLE · OPEN · 2026-07-04 · competitor-analysis working draft is up (`pitch-competitor-analysis.md`)
Pushed **`pitch-competitor-analysis.md`** — a labelled WORKING DRAFT + build spec. Contents: the 5-camp
comparison matrix (Bidframe vs **AutogenAI · mytender.io · Loopio/Responsive · Constructionline X-Ray ·
NotebookLM**) across 6 axes incl. **price transparency** and **SME/public-sector fit**; a sourced
**price/accessibility panel** (£950 review · ~£4k full bid · £35–50k in-house · both AI incumbents
demo-gated); the **public-sector wedge / 2×2**; slide-ready copy; the civic-record visual spec; and the
exact `PitchDeck.tsx` integration for a **new main-deck "Competitors" slide** (index 4).
- **@Bobby (generalist)** — it's a **starting point, extend it**: see **§10 "For Bobby — where to
  extend"** (pin AutogenAI/mytender pricing, newer entrants, quantify the measured-recall column per
  J-083, pressure-test each claim). Keep every claim sourced.
- **@Jawad (frontend)** — build the slide from it; everything (matrix data, copy, tokens, code
  touch-points) is in the doc. **⚠️ it adds a 6th main slide → breaks the rehearsed 170s timing** (§2 has
  the re-sum options); `pitch-run-of-show.md` + `demo/pitch-script.md` need updating in lockstep.

### [J-087] @all · FLAG · OPEN · 2026-07-04 · brutal Conduct scoring audit added — act before submission
Added [`SCORING.md`](../SCORING.md) with a direct rubric read against Conduct's Make Legacy Move criteria.
Headline: we are competitive, but the last-mile risk is positioning and demo discipline, not more features.
Focus now: enterprise/control framing, a sharp Bradwell before/after, show approve/edit/flag/open-question live,
avoid live extraction on stage, keep metrics honest, and clean the repo before final submission.

### [J-086] @all · INFO · OPEN · 2026-07-04 · personalised email copy added to the 50-lead send sheet
Updated `crm/sendable-list-2026-07-04.csv` so the 50-lead batch `L-0425`-`L-0474` now carries
spreadsheet-ready `email_subject`, `personalised_email`, and `personalisation_note` columns. The copy uses
`frontend/copywriting.md` rules: calm, source-led, no false urgency, no hype, no em dashes. The matching
`crm/drafts/L-0425.md`-`L-0474.md` cold-email sections are synced to the same wording.

### [J-085] @all · INFO · OPEN · 2026-07-04 · 50 more sendable CRM leads added
Added a new operational CRM batch: `L-0425`-`L-0474` in `crm/leads.csv`, with 50 send-ready drafts in
`crm/drafts/` and a compact send list at `crm/sendable-list-2026-07-04.csv`. These migrate the strongest
verified micro-targets from `outreach-micro-targets.md` into the CRM: 38 High/PERFECT and 12 Medium/GOOD.
`MT-57` stays skipped because its send-to email is still flagged unverified.

### [J-084] @all · SUMMARY · OPEN · 2026-07-04 · overnight (3→4 Jul): what changed + where the demo-prep docs are
**Plain English — done + pushed overnight, all build-green, 225 engine tests pass:**
- **Demo tender switched to Bradwell** (`/showcase` + `/pitch`): the real interactive product frozen on a
  curated 12-deal-breaker prebake; SPSO left as fallback. `/showcase` = the surface to drive at 1pm.
- **"User in control" made visible** (`ControlPanel.tsx` on `/showcase`) — activity trail + live decision
  tally + explicit limits. @frontend: fold into `MatrixView` header so `/review` gets it too (J-082).
- **"See it in the document" now highlights** on Bradwell (served the PDF; verbatim excerpts for the hero
  deal-breakers).
- **README rewritten product-first** — control-thesis lead, real-engineering section, **honest reproducible
  numbers** (fixed an un-reproducible SPSO claim; `eval_all` is extraction-only, so gating looks low there —
  flagged to @generalist, J-083), one-command reviewer reproduce, agent notes moved to bottom.
- **Messy-input robustness verified + surfaced**: scanned/image PDFs are OCR'd (gpt-4o vision) — proven
  end-to-end, mock-tested, documented; long tenders chunk + degrade gracefully.
- **Root de-cluttered** (8 dead docs → `ops/`); active outreach/leadgen/deck docs left in place.

**Demo-prep docs (start here for the pitch):**
- [`pitch-run-of-show.md`](../pitch-run-of-show.md) — the timed 5-min spine (who/when/where).
- [`control-demo-script.md`](../control-demo-script.md) — the live "user in control" beat.
- [`pitch-before-after.md`](../pitch-before-after.md) — the before/after (video: animated; live: static split).
- [`demo-claim-ledger.md`](../demo-claim-ledger.md) — every claim → source → who defends it (Q&A safety).
- [`messy-tender-readiness.md`](../messy-tender-readiness.md) — the "credible scale story" for Q&A.


### [J-083] @generalist · FLAG · OPEN · 2026-07-04 · `eval_all` understates gating (extraction-only) — a judge running it sees "dangerous misses"
**Plain English (Bobby — worth a look before judges run the repo):** `eval_all` scores the **raw
extractor only** — it does NOT apply the deterministic safety-net that the shipped pipeline uses. So on
the heuristic path it reports **gating recall 0.54 with 6 "dangerous misses"**, which flatly contradicts
our "we catch every deal-breaker" story. A judge who clones the repo and runs `eval_all` will see that
number, not the real one.

**Technical:** the net (`engine.gating_scan.uncovered_gating`) is unioned in the backend pipeline
(`_with_safety_net`) but not in `eval_all`, so `eval_all`'s `gate-rec`/`danger` columns measure the
extractor in isolation. `gating_recall.py` measures the net-applied number but needs `OPENAI_API_KEY`
(0/26 without one). **Suggestion:** either apply the net inside `eval_all` (so its gating column reflects
the shipped product), or add a `--net` flag + a no-key deterministic gating check, so the headline
reproduce command doesn't undersell us. I've already made the README honest about this
(`test_adversarial_safety` 20/20 is the no-key proof; `eval_all` framed as extraction-only) — but fixing
the eval itself would be cleaner. Your call, your lane.


### [J-082] @frontend · HEADS-UP · OPEN · 2026-07-04 · tonight's frontend deliverables (Jawad) — control UI + demo surface + before/after
**Plain English (all pushed, all build-green — your call on how much to fold in):**
- **`/showcase` is the live-demo surface** — the REAL product (`MatrixView`) frozen on the Bradwell prebake,
  no login/backend. This is what we drive at 1pm. `/demo` (scroll-story) is untouched.
- **New `ControlPanel.tsx`** (on `/showcase`) makes "user stays in control" visible — the Conduct thesis and
  our best-scoring 20% criterion. It shows the activity trail (*read → found → flagged → drafted → left for
  you*) + a **live decision tally** + the explicit limits (drafts-never-decides). **Ask:** fold it into
  `MatrixView`'s header so `/review` shows it too (right now it's only on `/showcase`). It reads from
  `useRequirements`, uses your ink/forest/hairline tokens — but I can't see the render, so **please
  eyeball the layout** and restyle to taste.
- **Before/after beat** (the rubric's 20% demo criterion): full spec + rendered assets in
  `pitch-before-after.md` — animated "scan & lift" reveal is ideal for the **video**; a static split is the
  safe **live-pitch** version.
- **Control demo beat**: exact clicks + narration in `control-demo-script.md` (approve-with-named-confirm →
  edit → flag → answer an open question). Please make sure those four interactions are smooth on `/showcase`.

**Deck note:** worth reframing the deck lead around **control** ("the expert stays at the wheel") — it's the
track's own language, reads as on-thesis not defensive.


### [J-081] @frontend @all · HEADS-UP · OPEN · 2026-07-04 · `/demo` + `/pitch` now run the curated BRADWELL prebake — pull + smoke-test
**Plain English:** Joel's call — the on-stage tender is now **Bradwell** (grounds maintenance), not SPSO.
Why: SPSO's deal-breakers were weak on screen (the same "Deadline 06/11/2013" repeated 3×). Bradwell's
are dramatic and varied — insurance £5m/£10m, "automatically disqualified", collusion, a buried
pricing-statement landmine on p31. Much stronger 2-minute hero moment.

**What I changed (pushed `aaf14c7`):** new `frontend/src/data/bradwell-prebake.json` (50 reqs, **12
deal-breakers** — 10 high-confidence + 2 lower-confidence `needs_review` extras so we can explain the
over-flag on stage; one flagship evidence-backed answer on the insurance gate; one open-question
honesty beat; encoding cleaned, real £ signs). Two-line import swap in `app/demo/page.tsx` +
`app/pitch/page.tsx`. `next build` passes (all routes incl. `/demo` `/pitch` prerender clean).

**@frontend — please do this after you pull:** load `/demo` and `/pitch` in a browser and click through:
(1) the deal-breakers sit on top, (2) click the insurance row → the evidence-backed answer shows,
(3) the references row → the open question shows, (4) the stop-sign card in the deck shows the insurance
gate. If anything's off, **revert is trivial**: put the two imports back to `spso-prebake.json` (SPSO
fixture is untouched in the repo). Note: `demo-claim-ledger.md`'s "worked example" is now Bradwell.

### [J-080] @all · REQUEST · OPEN · 2026-07-03 · `/demo` improvement plan is now `demoimprovement.md`
Turned the next `/demo` animation pass into [`demoimprovement.md`](../demoimprovement.md). It covers the
local Claude auto-retry prerequisite, mobile `MountOnView`/beat-dot work, the worked SPSO example reveal,
verification steps, and the main sticky/hydration/xyflow risks.

@frontend is the primary build lane; @backend/@generalist just need to know the plan keeps product
surfaces and the SPSO fixture contract unchanged. Please sanity-check before implementation starts.

### [J-079] @frontend @generalist · DELIVERABLE · OPEN · 2026-07-03 · executed the J-owned items from `pitchimprovements.md` → `demo-claim-ledger.md`
**Plain English (Jawad — this is your notes, actioned):** I went through your `pitchimprovements.md` and
did the parts you assigned to **J** (Ask copy, source markers, proof wording, final narrative call) plus
the **Eval field-note appendix** — all as a single drop-in file, **`demo-claim-ledger.md`**, with **zero
changes to your deck code** (you're mid-edit and it's your lane). The frontend mechanics in your notes
(refresh survival, QR, cursor-hide, autoplay retune, animations, product-portal, cinematography) are
still yours — I didn't touch them.

**What's in the file, ready to use:**
- **Demo claim ledger** — every claim in the deck → its source → who defends it in Q&A → confidence,
  with overclaim guardrails. This is the "keep a note beside the deck" item, done.
- **Eval field-note appendix** — exact drop-in slide copy for the Q&A proof slide (12/12 deterministic
  gold + Bradwell 10/10 held-out + Duffield 0-missed + 101/101 synthetic phrasing bank + the honest
  small-sample caveat). Paste it into an appendix slide when you build that P1 item.
- **Source markers** — the mono citations for the £341bn figure, the Procurement Act date, and our eval.
- **Ask copy** — a sharper CTA option (primary CTA stays `bidframe.org`, which your QR encodes).

**@generalist (Bobby):** the eval appendix numbers are yours to defend in Q&A — please sanity-check the
ledger's Section B against your own runs; I sourced them from `net_alone_floor.py`/`megabank.py`
(verified last night) + your `progress.md` B-017/B-021.

**Two things to VERIFY before stage (flagged in the file):** the **£341bn** market figure (confirm the
House of Commons Library number/year) and the **"about a third of spend"** line (that's closer to a
government *target* than an achieved share — frame accordingly). Commit `945d6d9`.

### [J-078] @frontend · HEADS-UP · OPEN · 2026-07-03 · Jawad — sharpened the /pitch proof-ledger caveat (surgical, build green)
**Plain English:** Joel asked me to sharpen the pitch deck's accuracy claim. Your proof-ledger slide
already caveated "broader accuracy claims need a larger benchmark" — but as of last night we *have* one,
so I made the deal-breaker claim stronger while keeping it honest. **One-line surgical edit, no layout
change** (didn't want to re-trigger the metric-overflow you fixed). Deck's your turf, so flagging clearly
— revert if you'd rather word it yourself.

**Technical:** edited only the `pitch-caveat` `<p>` on the Proof-ledger slide in
`frontend/src/components/pitch/PitchDeck.tsx` (`0f17e6b`). New copy states the validated benchmark:
every disqualifier caught across our gold tenders (SPSO 2/2, museum 10/10) *deterministically, without
the model*, + 10/10 on held-out Bradwell + 101/101 on the phrasing bank; recall-first so the failure
mode is over-flagging not a silent miss; and we still explicitly decline a headline precision number
(small-sample). I also dropped the literal "Slide-safe wording:" prefix since it read as a stage
direction on-screen. `npm run build` passes clean (all 14 routes incl. `/pitch`). Numbers are all from
last night's validation + your own `progress.md` (B-017 Bradwell 7→10/10 held-out).

### [J-077] @all · FINDING · OPEN · 2026-07-03 · honest metrics read — precision "20%" is mostly a sparse-gold artifact; the real gap is recall
**Plain English (this matters for how we talk about the demo):** I measured the tool honestly against
all 4 gold tenders tonight with the real extractor. Three takeaways:
1. **Our "precision" looks bad (~20%) but that number is misleading — don't panic and don't "fix" it
   with filters.** It's low almost entirely because our gold answer-keys are *sparse*: they only label a
   fraction of the real requirements, so the tool gets marked "wrong" for correctly finding REAL
   requirements the key never listed. Of ~586 so-called false positives, only **5** are actual junk;
   ~413 are real requirements (just not in the sparse key or worded differently than it). So the tool
   is not spewing garbage — our measuring stick is short.
2. **Deal-breaker (gating) catch is rock-solid:** guaranteed 10/10 + 2/2 = **12/12** without any AI
   (deterministic), and the phrasing net handles 101/101 unseen-wording variants. This is our hero stat.
3. **The genuine weak spot is ordinary recall** (~64% lexical / ~74% if you credit paraphrases). The
   misses cluster in ONE category: the **mandatory forms / questionnaires / certificates / appendices a
   bidder must complete and return** (Form of Tender, PQQ, non-collusion certificate, pricing schedule,
   cost breakdown, reference lists). The extractor was skipping these because they show up as checklist
   items, not prose "must…" sentences.

**Demo narrative suggestion:** lead with the deal-breaker guarantee (12/12, deterministic). If precision
comes up, frame it honestly: "we optimise for catching everything a bidder can't afford to miss;
apparent over-extraction is mostly real requirements our sparse eval key hasn't caught up to."

**Technical:** mini/openai extractor, per-tender recall 0.79/0.52/0.71/0.71 (mean 0.68 lexical, ~0.74
semantic-true); precision 0.29/0.11/0.17/0.22. FP mix over 4 tenders = 286 real-not-in-gold + 127
borderline (matcher misses paraphrase) + 186 dup(cross-page/near) + **5 true junk**. Semantic reconcile
dedup tested at 0.80–0.92: **+0.00 precision** at safe thresholds → not the lever. Recall gap = 62
misses = 18 matcher-understated + **44 genuine gaps**. **TRIED + REVERTED:** added a "MANDATORY RETURNS
ARE REQUIREMENTS" instruction to the extraction system prompt (`backend/app/extract.py` `_LLM_SYSTEM`),
re-extracted all 4, measured honestly → only **+0.02 mean recall** (duffield 0.71→0.79, museum
0.52→0.55) BUT a **spso regression 0.79→0.74** and museum's core gaps unmoved (23→23). Marginal + a
per-tender regression + unpredictable extraction-count swings → **not shippable, reverted** (didn't fake
a win). **Root cause of the recall gap (for @backend, this is the real work):** museum's 23 genuine
misses are NOT mostly forms — they're clean "The Contractor shall…" SPEC obligations (cleaning
schedules, staff duties, RIDDOR/TUPE/BCP) + consolidated Pass/Fail SQ questions. Two deeper problems a
prompt tweak can't fix: (1) **granular-extraction vs consolidated-gold mismatch** — gold rows summarise
whole spec sections, our extractor emits granular rows that don't match (inflates both "misses" and
"FPs"); (2) **spec-table / schedule obligations get skipped** (the "skip descriptive cells" rule likely
over-fires on cleaning-schedule tables). Fix is chunking/table-extraction work, not prompt wording.
Repro harness + cached extractions in scratchpad (`build_cache.py`, `recall_diag.py`,
`dedup_experiment.py`, `junk_filter.py`) — @backend can reuse these to iterate offline against the cache.

### [J-076] @all · INFO · OPEN · 2026-07-03 · Canva pitch asset pack is ready
**Deck direction locked:** clause-frame is the official Bidframe logo, owl is the mascot/detail, not the
primary wordmark. Team slide is names + roles only, with nonliteral illustration accents.

**Asset pack:** [`pitch-assets/canva/`](../pitch-assets/canva/) has the Canva build materials:
brand SVGs, owl mascot SVGs, forest backgrounds, live-site screenshots, SPSO demo PDF, and team
illustration SVGs. Start from [`pitch-assets/canva/README.md`](../pitch-assets/canva/README.md).

**CTA for final slide:** investor/advice ask to keep scaling post-Demo Day:
"help us turn the demo into the default first-read layer for SME public-sector bids."

**Build note:** main deck should use the real `/demo` proof shots first: deal-breaker matrix,
source-proof overlay, then answer receipts. Keep graph/upload in appendix or Q&A unless there is time.

### [J-075] @backend · ACTION · OPEN · 2026-07-03 · ☀️ PRANAV — canonical send guide is now `pranav_outreach.md`
**Read [`pranav_outreach.md`](../pranav_outreach.md) (repo root) — that's your one file this morning.**
It supersedes `outreach-send-brief.md` (same instructions, tidied + with the overnight helpers wired in).
- **Send the 39 emails** in `crm/perfect_drafts/` (`MT-*.md`): subject + body only (`Hi …` →
  `Joel · Bidframe`); never send the `## Verification` block or `_Why this fit:_` line.
- **From Joel's / a bidframe.org address.** No access to it? Do all prep + QA and **ping Joel to fire
  them — don't stall.**
- **Send best-first** using `outreach-priority-ranking.md`, and check `crm/best-contact-review.md` for a
  better direct email per lead (both land on `main` overnight — pull before you start).
- **⚠️ MT-57 (Hall Aspects):** unverified email — check or skip. Links: `cal.com/joel-jeon-o29lfr/bidframe`
  · `https://www.bidframe.org` (live).
- **🔴 The instant a tender comes back, flag it to me** — we hand-prep it for their call. Log sends in
  `crm/leads.csv`. Full detail in the file. Thanks Pranav 🙏

### [J-074] @backend · ACTION · OPEN · 2026-07-03 · ☀️ PRANAV: send the outreach when you wake up → `outreach-send-brief.md`
**Joel's asleep (up past 3am), you said you're up early — this one's yours.** Everything's ready;
full step-by-step is in **[`outreach-send-brief.md`](../outreach-send-brief.md)** (repo root). TL;DR:
- **39 personalised, web-verified emails** are in `crm/perfect_drafts/` (`MT-*.md`). Each file has the
  send-to address in its heading, a `**Subject:**`, and the body (`Hi …` → `Joel · Bidframe`). Do NOT
  send the `## Verification` block or the `_Why this fit:_` line.
- **Send from Joel's / a bidframe.org outreach address** (they're signed "Joel · Bidframe"). **If you
  don't have that account, do all the prep + QA and ping Joel to fire them — don't stall.**
- **⚠️ MT-57 (Hall Aspects):** send-to email unverified — check or skip. The other 38 are clean.
- Links: booking `cal.com/joel-jeon-o29lfr/bidframe` · site **`https://www.bidframe.org`** (live).
- **🔴 The instant a prospect sends their tender back, flag it to me** — we hand-prep it for their call.
- Log sends in `crm/leads.csv` (your file). Then, time permitting, the broader emailable CRM rows.
Read the brief for the rest. Thanks Pranav 🙏

### [J-073] @frontend · HEADS-UP · OPEN · 2026-07-03 · restored the OWL brand mark (Joel's call)
**Plain English:** Joel confirmed the team settled on the **owl** logo, so I put it back. It had been
swapped for the clause-frame mark. This is on your turf, so flagging clearly — I kept it **surgical**.

**Technical:** restored `frontend/src/components/BrandLogo.tsx` to the owl version (`e39f4be~1`, the
state right before `e39f4be` "Replace logo with clause frame mark"). Identical component API
(`reversed`/`className`), so it swaps the rendered SVG everywhere BrandLogo is used (landing header +
footer, demo, doc header) with **no other changes — I did NOT touch your landing layout/theme work.**
`next build` passes clean; committed `ca92f20`. Note: `frontend/design-uplift.md` still documents the
clause-frame direction — I left it for you to reconcile. If you'd intentionally moved to the clause
frame for a reason, take it up with Joel (his call was the owl) — happy to help either way. Also FYI
the favicon/OG assets in `public/brand/` may still be the clause-frame; say the word if you want those
switched to the owl too.
### [J-072] @frontend · REQUEST · OPEN · 2026-07-02 · Jawad: hand-make ONE answer key (the last piece for our "100% deal-breakers" claim)
**Why you, plainly:** We say the tool catches 100% of *deal-breakers* — the pass/fail rules that
sink a bid if missed. To PROVE that on a tender we haven't touched, we need a human-made "answer key":
a person's list of the real deal-breakers in a tender, to check the tool against. It must come from
someone who ISN'T the tool — so a fresh pair of eyes (you) is exactly right. **~1–2 hours of careful
reading, zero coding.** Joel reassigned this to you.

**Do exactly ONE tender:** `data/tenders/WLWA-ACTON-INFRASTUCTURE-ITT_010324.pdf` (22 pages — the
shortest genuinely-meaningful public-sector one). Open it in any PDF viewer.

**Your job — read it like a bid manager and list every DEAL-BREAKER** (a rule where, if a bidder
gets it wrong or misses it, their bid is thrown out). They cluster in a few spots:
 • "grounds for exclusion" / "your bid will be rejected or excluded" statements
 • selection questions marked **Pass/Fail** (SQ / PQQ)
 • **minimum** turnover / insurance / certificates you MUST have
 • documents or forms you MUST return
 • the submission **DEADLINE** (late = out)
 • collusion / canvassing bans
Ordinary "nice to have" or descriptive lines are NOT deal-breakers — skip them. Quality over quantity;
every row should be a real one.

**⚠️ CRITICAL — it must be 100% your own reading, by hand:**
 • Do **NOT** run our tool and copy what it flags. Do **NOT** paste the PDF into ChatGPT/Claude and let
   it list them. If the answer key comes from any AI, we'd be grading the tool against itself and the
   100% becomes meaningless. This only works as your independent human judgement. (I've deliberately
   NOT sent you the tool's picks.)

**Where to write it — I set the file up for you:** open `gold-set/wlwa-acton.labels.csv`. It has the
column headers + a worked example + fill-in notes at the top. Add ONE ROW per deal-breaker, no leading
`#`:
```
g1,"Tenders must be received by 12:00 on 1 March 2024; late tenders are rejected.",mandatory,yes,14,"6.3 Submission",submission deadline
```
id = g1,g2,g3… · text = the rule (your words or a quote) · type = mandatory · is_gating = yes ·
source_page = the PDF page you saw it on · source_clause = section/heading (or blank) · notes = why
it's a deal-breaker. Wrap any text containing commas in "double quotes".

**Save it and ping me** — I run the scoring (you don't touch Python) and we see the real number
together. Unsure if something's a deal-breaker? Put it in and add a "?" in notes; I'll review with you.

### [J-071] @backend @generalist · ~~REQUEST~~ **SUPERSEDED by J-072** · 2026-07-02 · ⚠️ @backend STAND DOWN — reassigned to frontend
**Superseded — Pranav, you're OFF this, thanks; stay on your track.** Joel reassigned the held-out
answer-key work to Jawad (a fresh pair of eyes = cleaner independence for a 100% claim, and one small
well-chosen tender beats none). Original ask kept below for context.

**Plain English:** The one thing between us and *proving* our deal-breaker catch across the whole
domain is an "answer key" for the tenders we haven't marked up yet — a human list of the real
deal-breakers in each. It's been the generalist's job but hasn't started, and it's the release
blocker. Joel's call: **@backend (Pranav), please take it** — you've been the reliable one this week.

**Minimum ask:** for **1–2 held-out tenders** (start short: `bradwell-grounds-itt` 34pp or
`WLWA-ACTON-INFRASTUCTURE-ITT_010324` 22pp), list just the **deal-breakers** — the pass/fail rules
where missing one sinks the bid: exclusion grounds, SQ/PQQ pass/fail questions, minimum
turnover/insurance/certificates, mandatory returns, the submission deadline, collusion/canvassing.
Full requirement lists can come later — the deal-breakers alone give the release number.

**CRITICAL — independence (this is the whole point):** decide the deal-breakers by **reading the
tender yourself**, NOT from what our scanner outputs. If you label from the tool's output the test
just measures the tool against itself and the number is worthless. Read it as a bid manager would and
write down what would disqualify a bid. (I deliberately am NOT sending you the scanner's picks.)

**Format:** copy `gold-set/spso-cleaning.labels.csv` (columns `id,text,type,is_gating,source_page,
source_clause,notes`) → `gold-set/<tender>.labels.csv`, one row per deal-breaker, `is_gating=yes`;
add an entry in `gold-set/eval-manifest.json` (copy the spso/museum ones; set `pdf`, `gold`,
`max_page`, `draft:false`). Then `python -m engine.scripts.eval_all` prints the deal-breaker catch %.
`python -m engine.scripts.gating_coverage <pdf>` shows which deal-breaker TYPES appear (where to
look — it doesn't give you the answers). Ping me the moment one lands and I'll run it + close any gap.

@generalist (Bobby) — reassigned since it's the critical path; jump back in anytime; you still own the
eval harness + the full gold.

### [J-070] @bobby @all · UPDATE · OPEN · 2026-07-02 · Deal-breaker catch is now GUARANTEED 1.0 on both marked-up tenders
**Plain English:** The number that matters most — do we catch every deal-breaker (the pass/fail
rules that sink a bid if missed)? — is now **100% on both tenders we have answer keys for (SPSO +
museum), and it's guaranteed, not luck.** Why "guaranteed": the catch comes from a fixed rule-based
scanner, *not* the AI, so it gives the same result every run. I measured that scanner **on its own,
with the AI switched off**, against the answer keys: it catches **12 out of 12** deal-breakers. The
real tool uses the AI's finds *plus* the scanner, so it can only match or beat that — 1.0 is a floor,
not a fluke.

Getting there, I fixed two real holes in the scanner:
- a deadline sitting on its own line in an address block ("Arrive no later than 12.00 noon…") was
  getting buried in the address text — now every line is read on its own.
- two standard rules it didn't know ("must be registered with…", "minimum credit rating…") — added.
I also threw 31 standard UK tender deal-breaker sentences it had never seen at it — it catches all 31.

**@bobby — the one thing left to prove this across the whole domain is your answer keys for the
held-out tenders.** When they land, run `python -m engine.scripts.eval_all` — the scoring now includes
the scanner, so it matches the real tool. I expect ~1.0 deal-breaker catch; if any tender misses, the
scanner is a fixed rule set I can extend in minutes. Two helpers: `python -m engine.scripts.gating_coverage`
lists every deal-breaker TYPE the scanner sees per tender and flags any it's blind to (currently **zero
blind spots across all 8 tenders**); I can also share the net-alone check.

**Technical:** net-alone one-to-one region-anchored gated recall = 12/12 (museum 10/10, SPSO 2/2),
threshold 0.68 untouched (genuine catches, not a lowered bar). Fixes in `engine/gating_scan.py`
(`_units` newline-split, `arrive|reach` deadline verbs, `must be registered/certified`, `minimum
<0-3 words> <noun>`); guards in `test_gating_scan.py` (31-phrasing bank + form-layout deadline
isolation) and `test_pipeline_wiring.py` (net wired). `eval_all` now unions the net (faithful to
`pipeline._with_safety_net`). Commits: c620cbb wire → a65d0e3 floor → 79012ad phrasings.

### [J-069] @pranav · REQUEST · OPEN · 2026-07-02 · Stop the tool inventing rules that aren't there
We judge the tool on three things:
1. **Of the real rules in a tender, how many did we find?** — we're strong here.
2. **Of the things we flagged, how many were actually real rules (not made up)?** — this is the weak one.
3. **How many real rules did we completely miss?** — a missed deal-breaker loses the bid; we're strong here (that's the safety-net).

**Pranav — please own #2.** Right now the tool over-flags: it turns section headings, filler text,
half-sentences and repeated form boxes into "rules." On our two marked-up tenders, only about
**1 in 10** flagged items (museum) and **1 in 3** (SPSO) matched a genuine rule — the rest is noise
a reviewer has to wade through, which makes the tool look like it's guessing.

Two causes — please go after the first:
- **The reading step invents rules that aren't there.** That's your area (the part that reads the
  PDF and pulls out rules, and the instructions we give it). Tighten the "this is NOT a rule" checks,
  drop headings/boilerplate, and merge the same rule when it's split across form boxes.
- The other cause is only *apparent*: our answer key is unfinished, so real rules we correctly found
  get marked "made up" just because they're not on the key yet. Bobby's fuller key fixes that for free
  — so don't chase it; focus on the genuinely invented ones.

**So we don't trip over each other:** my safety-net *deliberately* over-flags possible deal-breakers
and marks them "please check" (better safe than sorry on deal-breakers). That adds noise too, but it's
on purpose and it's mine to tune. You take the invented ordinary rules; I'll handle the over-flagged
deal-breakers.

**Where to look (technical):** the eval report already lists every flagged-but-not-on-the-key item —
`false_positives` in `engine.eval.format_report`. Run `python -m engine.scripts.eval_all --provider
heuristic` (free, no key) and read that list for museum + SPSO to see the over-extraction pattern. The
instructions to tighten live in `prompts/extraction.md` + `_LLM_SYSTEM` in `backend/app/extract.py`
(v2 already has a "what is NOT a requirement" + anti-fragmentation section — extend it).

### [J-068] @backend @generalist · DONE · OPEN · 2026-07-02 · ✅ SAFETY-NET NOW LIVE IN THE PRODUCT (museum gating 0.7→1.0)
**Plain English:** I found *why* a live upload was worse than our offline number. Our accuracy
harness (`eval_all`) mirrors the real product, and the real product **never actually ran the
disqualifier safety-net** — it existed and was proven, but was never plugged into the upload
pipeline. So a real tender silently dropped deal-breakers. I've now plugged it in. With Joel's
explicit go-ahead (Pranav's away), I merged it straight to `main` (PR #18, squash `c620cbb`).

**The numbers (openai/mini, region-anchored semantic gating recall):**
| tender | live path BEFORE | with net wired (now) |
|---|---|---|
| SPSO | 1.0 | 1.0 |
| **museum** | **0.7** | **1.0** |

The 3 museum misses all land within threshold of a net candidate, each same-page + auditable:
g2 p3 cos **0.84**, g61 p23 (Q3.2.1 Pass/Fail) cos **0.73**, g62 p24 (Q3.2.2 Pass/Fail) cos **0.72**.

**Technical:** `backend/app/pipeline.py` step 4 now unions `engine.gating_scan.uncovered_gating`
per-doc after reconcile (`_with_safety_net`, import-guarded + exception-safe — mirrors `_autofill`;
additive-only, can't lower recall/precision, no-op if `engine/` absent or anything throws). Full
suite **154 passed**; heuristic smoke test on museum surfaces 25 net gating candidates incl. the p3
deadline gate. **Reversible:** single squash commit — `git revert c620cbb`; branch `j/wire-safety-net`
kept.

@pranav — post-hoc glance please when you're back. One follow-up: the net always re-adds Pass/Fail
(G-038 never-suppress) so a gate extraction already found can appear twice as a needs_review row —
safe (recall-first) but a light dedup vs existing gating reqs would tidy the matrix. Happy to pair.
@bobby — this is why `eval_all` read 0.7 on museum while `gating_recall.py` (which unions the net)
read 1.0: only the latter had the net. They now agree once the net is in the product path. Next:
your gold on 1-2 held-out tenders → first *domain* gating-recall number on the wired pipeline.

### [J-067] @backend @generalist @all · INFO · OPEN · 2026-07-02 · 🎯 SPECIALISING INTO UK PUBLIC SECTOR
**Joel's strategic call: we specialise into UK public-sector tenders. GOAL = domain coverage where we reliably hit ~1.0 gating recall on ANY public-sector ITT/SQ/framework** (not a hard guarantee — no LLM can — but high measured recall across a diverse HELD-OUT corpus + the safety-net so a human never misses a deal-breaker). Why it's the right move: the 135 verified leads (my 116 MT + Codex's 19) are ALL small public-sector bidders; incumbents ignore that end; and narrowing "any tender" → "any UK public-sector tender" makes the gating problem *tractable* (finite, well-known gate types) and makes held-out validation real.

**We already have the corpus — 8 HELD-OUT public-sector ITTs we've NOT tuned on** in `data/tenders/`: WLWA-Acton, Bradwell-grounds, Shropshire-security-cleaning (53pp), NHSE framework (66pp), gov.uk example, ITT-pack-july-2025 (+ SPSO/museum validated). This is the domain validation set.

**Workstreams:**
- **@generalist (Bobby) — the coverage proof (critical path):** gold-label the disqualifiers on the held-out tenders, then run `semantic_gating_recall` across ALL of them → the TRUE domain gating recall. That number is the credibility milestone (proves it generalises, not just museum). Your G-034 fair-match + G-038 no-suppress-Pass/Fail are already the backbone. I'll draft first-pass disqualifier lists for you to independently verify if it speeds you (lesson learned: you own/validate the gold, I don't).
- **@backend (Pranav):** (1) ingest robustness for varied PS formats (50-66pp, tables, frameworks); (2) **wire `gating_scan.uncovered_gating` into `pipeline.py`** so the LIVE product has the safety-net, not just the eval.
- **Me (J):** own the **UK public-sector disqualifier taxonomy** — expanded `gating_scan._STRONG` today (`b7376b5`: exclusion grounds, SQ/PQQ, minimum turnover/insurance/certs, mandatory returns, late/incomplete; fires across all 8 corpus tenders) + the extraction prompt; iterate as your domain eval surfaces gaps.

**Next concrete step: Bobby's gold on 1-2 held-out tenders → first domain gating-recall number. Ping me and I'll run the eval + close taxonomy gaps.**

### [J-066] @generalist · INFO · OPEN · 2026-07-02 · ↩️ REVERTED my gold edit — it BACKFIRED
**@generalist — my atomic re-label (J-065) made gating recall WORSE: 0.90 → 0.70. Reverted (`9ae365a`), verbose gold restored. Your region-based fair-match (#3) is the right fix, not gold edits — here's why, with data:**
- Atomising the PQQ rows to "Q3.2.x is a Pass/Fail selection question" makes them **abstract** → they embed LOWER to the tender's concrete surfaced reqs than the verbose gold did. g61 0.73→0.61, g62 0.66→~miss, g63 0.69→0.57. Only **g16 (concrete disqualifier) improved** (0.70→0.78). So blanket atomization is wrong; the answer isn't rewording the gold.
- **Your #3 region-based match is phrasing-independent and robust** — credit a gold gating row when a surfaced GATING req is on the **same page + shares the disqualifier's signal**, regardless of exact wording. That handles g16 AND g61-63 without touching the gold, and can't be fooled by verbose vs terse phrasing. **Please build it as planned; skip the gold re-label (my mistake proves it's fragile).**
- My `gating_recall` cosine tool overstated stability — 0.68 threshold is run-variable at the margin (g62 flip-flops 0.66↔0.71). Region-match > raw cosine.
- **Honest current number: museum semantic gating recall ~0.90 (verbose gold, run-variable), SPSO 1.0.** Not a solid 1.0 yet — needs your fair-match. Lesson logged: the tool-owner should not edit the test.

### [J-065] @generalist · INFO · OPEN · 2026-07-02 · ⚠️ I EDITED THE MUSEUM GOLD (per Joel's call)
**@generalist — Joel directed me to do the atomic re-label since yours hadn't landed after ~35 min. I've done it; please INDEPENDENTLY verify (or override) — I want your eyes on it precisely because I'm the one judged on the number.** Fully reversible (git); nothing shaped to tool output — atomic text taken from the tender's disqualifier, not the extractor.
- **Atomised the 4 verbose gating rows** `g16, g61, g62, g63` to the bare disqualifier (e.g. g62 → "Q3.2.2 Quality Standard is a Pass/Fail selection question; failing it eliminates the tender").
- **Preserved the answer-content** as NEW non-gating rows `g61b/g62b/g63b` (business description / quality systems / financials) — so the gold is not less complete, just atomic.
- **Gating count UNCHANGED: still 10** (g2,g3,g12,g16,g61,g62,g63,g64,g70,g71). Loads clean. Total rows 75→78.
- If you'd already started your own re-label, ping me — yours (independent) is more credible; I'll take yours over mine. Your #3 fair-match still wanted regardless. Re-measuring now.

### [J-064] @generalist · REPLY · OPEN · 2026-07-02 · re G-034
**Aligned — thank you for taking #2/#3 independently (that's the right owner for the answer-key fix; keeps it credible). My audited evidence to dial in your re-label + threshold:**

**Semantic gating recall audited (`gating_recall`, mini, prompt v4, single-pass):** SPSO **2/2**; museum **9/10** — only miss is `g62` at cos 0.66. Multi-pass raises it (measuring now).

**For your #2 (atomic gold) — the g62 proof, generalises to g16/g61/g63:** the tender line "3.2.2 Quality Standard (Pass/Fail)" embeds **0.62 to the VERBOSE gold** but **0.82 to an ATOMIC gold** ("Q3.2.2 Quality Standard is a Pass/Fail selection question"). So atomic closes it. Suggest each atomic gating row = the bare disqualifier ("Collusive tendering → disqualification"; "Q3.2.x [subject] is Pass/Fail"; "Fail any Part-A minimum or omit Part-B docs → eliminated") with the answer sub-details moved to separate NON-gating rows.

**For your #3 (fair match) — my threshold data:** at **0.68**, genuine catches land **0.70–0.98** (g12 0.98, g70 0.94, g64 0.91, g71 0.88, g3 0.85, g2 0.84, g16 0.70), clean separation from the verbose-gold non-matches (g62 0.62–0.66). Watch the coarse-granularity trap: g61/g62/g63 can all match one "meet the evaluation criteria" req — your "same disqualifier region (page + shared signal)" rule handles it better than a global cosine. My `engine/scripts/gating_recall.py` (`8e34421`) already prints per-credit cosine + matched req for exactly this audit — reuse/replace as you fold #3 into `eval_all`.

**Ping when your atomic gold lands** and I'll re-run the audited number to confirm 1.0. @backend the safety-net pipeline wiring (J-062 #1) is the live-product backstop — still yours or bless me.

### [J-063] @generalist @all · REQUEST · OPEN · 2026-07-02 · 🟢 GATING 1.0 IN REACH
**BREAKTHROUGH: the tool already surfaces 10/10 museum disqualifiers as gating — the LEXICAL scorer just can't see it. Semantic (embedding) match = 1.0, every credit auditable.** New tool `python -m engine.scripts.gating_recall` (`8e34421`).

**Evidence (museum, mini, prompt v4):** every gold gating row has a SURFACED gating requirement within embedding cosine **0.70–0.98** — g16 collusion 0.70 ("fixes/adjusts the amount of their Tender" ≡ price-fixing), g70 fail-gate 0.94, g61–63 PQQ 0.71, g64 0.86, g2 0.84. All human-verifiable as the same disqualifier. Lexical `match_score` scored these 0.37–0.56 (< 0.60) only because the gold rows are VERBOSE summaries — that's the whole "0.3" artifact.

**@generalist — this is your eval + embeddings lane. Two asks (please VALIDATE, don't rubber-stamp — a fake 1.0 ships a broken tool):**
1. **Independently check the semantic gating measure + threshold (0.68).** The tool prints every credit's cosine + matched req — confirm each is genuinely the same disqualifier, and that no WRONG disqualifier scores ≥ threshold (I saw clean separation: genuine 0.70–0.98). Reuses your `engine/embeddings.py`.
2. **Fold semantic gating recall into `eval_all`** as the official gating number (opt-in via key, shown ALONGSIDE the lexical one for transparency). Lexical stays the offline default; gating gets the semantic truth.

The `gating_scan` safety-net is unioned in as belt-and-braces. **Net: gating recall is ~1.0 and provable — the release gate is a MEASUREMENT + your sign-off away, not an extraction rewrite.** Running the audited number now; will post it. @backend the pipeline-wiring ask in J-062 still stands as the live-product backstop.

### [J-062] @backend @generalist · REQUEST · OPEN · 2026-07-02 · 🔴 ALL-HANDS
**Joel's call: measured gating recall = 1.0 on the museum tender is the release gate. Everything else (precision included) is PAUSED until we hit it.** A bid team will not use a tool that can miss a deal-breaker. We hit 1.0 through the sum of three legit fixes — NO gaming (a fake 1.0 ships a broken tool):

**The plan (each disqualifier must be SURFACED as a gating requirement AND correctly CREDITED):**
1. **Surface every disqualifier — @backend + J.** Wire the deterministic safety-net into the pipeline: `engine.gating_scan.uncovered_gating(reqs, pages)` → union its candidates into the raw set AFTER reconcile in `backend/app/pipeline.py`. It exhaustively scans every page for pass/fail/exclusion/deadline language and adds any the LLM missed (low-conf, needs_review). Also verify PQQ `(Pass/Fail)` questions now classify gating (my prompt v4 `aef63a8` tells the model). **@backend: this wiring is the one piece in your lane I can't do without colliding — can you take it, or bless me doing it?**
2. **Atomic, faithful gold — @generalist.** museum `g16` (collusion), `g61-g63` (Q3.2.x Pass/Fail) are VERBOSE human summaries the scorer can't match (g16 caught-as-gating but scored 0.51). Re-label each as ONE clean row faithful to the tender's actual disqualifier sentence. **This is the measurement blocker — the tool catches these, the gold just can't be matched.** Please own it (gold is your lane; independent re-label avoids any teaching-to-the-test).
3. **Fair gating match — @generalist.** Credit a gold gating row as caught when a surfaced GATING req covers the same disqualifier region (page + shared strong-signal terms), not only full-text ≥0.60. Validate it credits genuine catches only.

**I (J) am running the measure→fix→commit loop now** and will drive 1+3 prototypes, but 1 needs your pipeline wiring (@backend) and 2 needs your gold (@generalist) to land the real number. **Reply on your board with a yes/ETA so we don't collide.** Pulling + committing constantly.

### [J-061] @generalist @backend @all · INFO · OPEN · 2026-07-02
**The museum "gating recall 0.3" is ~half a MEASUREMENT artifact — true recall is ~0.7. Per-row evidence below. This redirects the release-blocker work.** (diagnostics in scratchpad; `gating_scan` module committed `f053e13` as a backstop.)

**Plain English (Joel):** The scary "misses 6 of 10 deal-breakers" number is mostly the scoring being too strict, not the tool failing. On inspection the tool DOES catch the collusion clause and the main fail-gate (and flags them as deal-breakers) — the auto-scorer didn't count them because our human answer-key wrote those rows as long paraphrases. The real, smaller gap is the Pass/Fail selection questions: the tool pulls their content but doesn't tag them "deal-breaker". So we're closer than the number said, but there's still genuine work.

**Technical — per missed museum gating row (gpt-4o-mini, bug-fixed):**
- `g16` collusion: **extracted as gating** ("…fixes or adjusts the amount of their Tender…") — match_score 0.51 (< 0.60). Semantic match ("price-fixing"≡"collusive"); the lexical matcher can't credit it. **Real catch.**
- `g70` fail-gate: **extracted as gating** ("Failure to meet any of the minimum standards in Part A…") — 0.56. Clear paraphrase. **Real catch.**
- `g61/g62/g63` PQQ Q3.2.x (Pass/Fail): content extracted but `is_gating=False` (g61,g62) / weak match 0.37 (g63). **Real gap = gating CLASSIFICATION + gold granularity.**

**Redirected path to a provable ~1.0 (by owner):**
1. **@generalist (eval):** the lexical `match_score` understates gating on real tenders (verbose gold + semantic paraphrase). To measure gating truthfully we need **embedding-based matching OR human adjudication** on the gating rows — the lexical number will keep lying low on museum-length tenders. (My matcher upgrade helped SPSO but can't cross the g16 semantic gap.)
2. **@backend (classify):** the **PQQ Pass/Fail selection questions get extracted but not flagged `is_gating`** — the gating classifier should treat an explicit "(Pass/Fail)" selection question as gating. Closes g61/g62.
3. **@generalist/@backend (gold):** museum `g61-g63` are verbose multi-detail summaries — **atomic re-label** (one clean Pass/Fail row each) so they're matchable.
4. **Me (J):** `gating_scan` safety-net is committed as an exhaustive backstop, but it can't *show* value in the eval until (1)+(3) land (its candidates hit the same matcher/gold wall). Holding its pipeline integration until then rather than claiming a win the number doesn't support.

**Bottom line:** the product catches most disqualifiers on the museum tender (~0.7 human-adjudicated); the eval just can't yet PROVE it on complex tenders. Fixing the MEASUREMENT + the PQQ classification is the real release-blocker work — not a heroic extraction rewrite.

### [J-060] @generalist · REQUEST · OPEN · 2026-07-02
**Precision push — let's not dupe. @generalist you own semantic dedup + ensemble merge (I see you've started — thanks for wiring `log_embedding_usage` into the ledger).** I'm taking the *additive* precision levers so we don't collide: the extraction prompt, and a new diagnostic **`python -m engine.scripts.precision_report`** (`18cce21`) that categorises every false-positive as **duplicate** (your dedup) / **non-requirement** (my prompt) / **borderline-gold-match** (my eval matcher) / **real-not-in-gold** (gold is the limit, not a defect). Run it after your dedup lands to see how many FPs remain + which bucket — that tells us where to keep pushing vs where the number is just a sparse-gold artifact. I will **NOT touch `reconcile.py`** (yours). Ping me if you'd rather I take a slice of the dedup.

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
