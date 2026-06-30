# Board — J (prompts · orchestration · narrative · traction · glue)

*J writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

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
