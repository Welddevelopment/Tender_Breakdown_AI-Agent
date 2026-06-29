# Bidframe — Progress Log

> **A steady, timestamped log of how Bidframe got built.** Updated ~hourly (or whenever something
> ships). The point is twofold: keep a heartbeat of momentum during the sprint, and — at demo time —
> cherry-pick the milestones into a **"how we built it" progression beat** (4 people, async over git,
> zero → working tool in days).
>
> **This is the timeline. The pitch is [demo-narrative.md](demo-narrative.md); current state is
> [STATUS.md](STATUS.md).** Don't duplicate those here — this is the running story.
>
> **How to add an entry (do this ~hourly):** append one line under today's date —
> `**HH:MM** — what changed *(why it matters)*`. Keep it to a line. Update the Snapshot block when the
> top-line moves. Owner: J; any role can add a line for their own lane.

---

## Snapshot (kept current)

- **Where we are:** end-to-end spine proven on a **real** tender on Day 2; **auditable autofill
  wired end-to-end** (98 tests green) — live API returns grounded answers, "Autofill with AI" UI
  button fires POST /draft, groundedness eval proves 0 bluffs (42/42 citations verified). Backend
  pipeline live on Render; full frontend live on Vercel; eval harness stress-tested on a 66pp NHS ITT.
- **Headline number:** SPSO tender (pp.1–6), OpenAI extractor → **recall 0.947 (18/19), gating
  recall 1.0 · gating accuracy 1.0 (both disqualifiers caught, zero over-flagging), 0 dangerous
  misses.**
- **Next up:** flip `render.yaml` rootDir + set `OPENAI_API_KEY` on Render (G-009) to make the
  full stack live on the hosted site; finish SPSO gold set + expand to 2+ tenders.

---

## Day 1 — Sun 28 Jun 2026

- **Kickoff + decisions locked:** name **Bidframe**; niche = **UK public-sector, SME bidders + small
  consultancies**; requirement schema locked; agent comms channel (`comms/`) + first standup; LLM
  provider = **OpenAI**. *(The coordination scaffolding that let 4 people build in parallel without
  colliding.)*
- **Prompts written** (extraction, classification, answer-generation, gap-interview) + the
  backend→generalist **raw-extraction contract** + mock. *(The spec everyone built against.)*
- **Auditable-autofill scope ratified** + schema extended additively on `main` (answer / open_questions
  / capability_docs) — extends Bidframe from "compliance matrix" to "drafts your response," without
  breaking the matrix.
- **🟢 Hour-one risk retired:** a real tender (SPSO Cleaning ITT) parsed clean — 13pp, page numbers
  intact. *(The single biggest silent engine risk, gone on Day 1.)*
- **Backend pipeline scaffolded + tested end-to-end** (J covering while backend's laptop was down):
  ingest → chunk → extract → SQLite → all 3 REST endpoints. 20 requirements pulled from SPSO + persisted.
- **Frontend: whole product wireframed + deployed to Vercel** — compliance matrix, the gating
  "deal-breaker" hero, click-to-source drawer, relationship graph, upload flow, autofill answer/evidence
  panel, gap-interview; Bidframe rebrand; Bidframe colour + typeface system; wired to the live API
  (mock by default so the demo is zero-surprises). *(Carries ~40% of the score and it's already live.)*

## Day 2 — Mon 29 Jun 2026

- **~00:30 — Generalist shipped the `engine/`:** reconcile/dedupe + the eval harness (60 tests green);
  the closed reconcile→eval loop scores 1.0 on the mock. Raw-extraction format signed off.
- **~00:40 — 🟢 First REAL number on a real tender** (SPSO pp.1–6, OpenAI extractor):
  **recall 0.947 (18/19) · gating recall 1.0 (both disqualifiers caught) · 0 dangerous misses.**
  *(The whole thesis — measured recall + catch the disqualifier — demonstrated on real data, Day 2.
  This is effectively a Day-4-gate dry run, passed early.)*
- **~00:30 — Backend deployed live to Render** (`bidframe-api.onrender.com`, verified) → frontend's
  hosted-demo blocker cleared.
- **~01:10 — Glue pass (J):** STATUS refreshed for Day 2; `source_clause` made nullable across the
  frontend; **confirmed the 0.947 is the OpenAI path** (the no-key heuristic scores ~0.32 and misses
  both disqualifiers → any real demo must run the OpenAI path). Personal OpenAI credits for now;
  hackathon credits coming.
- **01:19 — Started this progress log.**
- **03:03** — Gating prompt tightened (`is_gating` defaults false, true only for confirmed disqualifiers) to fix G-003 over-flagging; traction research dossier built overnight (8 cycles → named UK bid-writing consultancy targets, competitor intel, 5 paste-ready LinkedIn outreach variants) *(re-eval pending: gating accuracy expected to rise while recall 1.0 holds; GTM legwork pre-done for Day 3)*
- **04:03** — Traction dossier extended to cycle 11 + full QA pass: warm-intro paths mapped, 60-second live-demo script drafted, first live ITT identified, SME education-IT MSPs named *(Day-3 outreach playbook is production-ready; opening GTM move can land today)*
- **05:03** — Traction dossier extended with 5 named care-sector SME bidders (Care at Home Group, Lumina Care, Able Support, Yes Care, Bluebird Care St Helens) sourced from St Helens Domiciliary Care Approved List 2025/26 + Ian Evans LinkedIn handle identified *(real named-target CRM now ready for cold outreach — contacts from public data, not invented)*
- **06:04** — Traction dossier finalised: thin sectors filled (named SME caterers + grounds firms), bid-writing consultancy contacts pinned — Amanda Goode (Think Tenders) + Robin Clarkson (BidRight) *(CRM now spans all target segments; Day-3 outreach playbook is production-ready across every lane)*
- **08:04** — Traction dossier bench deepened: Chris Hugo (GovData), Mike Baron (BWS), Matt Smith (Complete Tenders, verified) + SME cleaner Garioch (Aberdeenshire win) pinned *(bid-consulting lane now has 5 named verified contacts — the highest-leverage Day-3 outreach segment)*
- **13:05** — Generalist verified J-019 gating fix (G-004): gating accuracy **0.39 → 1.0**, gating recall holds at **1.0** (both SPSO disqualifiers still caught) *(the over-flagging of ordinary mandatory items is gone — demo can now show both a clean gating signal AND a perfect disqualifier catch)*
- **15:04** — Generalist lane complete: reconcile wired into live backend pipeline, aggregate eval harness stress-tested on 66pp NHS ITT (no crash), `needs_review` calibrated at 0.70, **auditable autofill** shipped (`engine/answer.py`, 79 tests) *(all 4 generalist items shipped; autofill is honest — grounds 3/19 SPSO reqs from capability docs, flags the rest `needs_input`, never bluffs)*
- **16:04** — Demo-hardening batch (G-010–G-012): autofill wired into the live API + UI ("Autofill with AI" button → `POST /draft`), `/draft` parallelised + `?limit` for snappy demos, groundedness eval proves 0 bluffs (SPSO: 32 grounded · 42/42 citations verified), sharper gap questions via J's prompt, capability-doc upload for two-sided traceability (98 tests green) *(the end-to-end autofill demo path is complete — upload → grounded answers → click to re-draft → evidence citations live)*
- **19:03** — Frontend layout system settled (F-009): `frontend/layout.md` + DESIGN-SYSTEM §12 + SLOP-CHECK updated — no global left rail, three-zone "Next" header, one-line matrix rows, split open state, friction scales with stakes *(every frontend component now has a concrete spatial contract to build to; no layout debates mid-sprint)*
