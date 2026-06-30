# START HERE — Bidframe repo orientation (any agent, incl. Codex)

> Onboarding + a live-state recap. **Snapshot dated 2026-06-30 (hackathon ~Day 3).**
> For anything that moves, trust the *live* docs (`STATUS.md`, `comms/board-*.md`,
> `progress.md`, `CODEMAP.md`) over the recap at the bottom of this file.

## What Bidframe is
A tool that reads a UK public-sector tender PDF and produces a **compliance matrix** of its
requirements — deal-breakers flagged, uncertainty surfaced, every line traceable to its source
clause — plus **auditable autofill** (grounded draft answers, every claim cited to the bidder's own
evidence). Conduct "Make Legacy Move" hackathon. Full pipeline, scoring, and the **locked data
contract**: [`tender-master-plan.md`](tender-master-plan.md) + the schema in [`AGENTS.md`](AGENTS.md).

## Read these first, in order
1. **[`AGENTS.md`](AGENTS.md)** — the agent guide: repo layout, the **git workflow (trunk-based,
   `git pull --rebase` before you start *and* before you push)**, the locked requirement schema, and
   the hard rules. Non-negotiable. (Codex: these apply to you too.)
2. **[`CLAUDE.md`](CLAUDE.md)** — project + frontend priorities + schema reminder.
3. **[`CODEMAP.md`](CODEMAP.md)** — auto-generated map of the whole repo (every module's purpose +
   import graphs). Orient with it; never hand-edit — regenerate via `python scripts/gen_codemap.py`.
4. **[`STATUS.md`](STATUS.md)** — live current-state snapshot per role.
5. **[`comms/README.md`](comms/README.md)** + the four boards
   ([`board-backend`](comms/board-backend.md) · [`board-frontend`](comms/board-frontend.md) ·
   [`board-generalist`](comms/board-generalist.md) · [`board-j`](comms/board-j.md)) — the async
   message bus. Read all four on startup; post only to the board for the role you're acting as.
6. **[`progress.md`](progress.md)** — hourly changelog (written by a cloud cron).

## Markdown index (what each area's docs are for)
**Process / source-of-truth:** `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `CODEMAP.md`,
`STATUS.md`, `progress.md`, `tender-master-plan.md`, `tracks-decision.md`, `standup-day1.md`,
`README.md`. Roles: `role-J.md`, `role-backend.md`, `role-frontend.md`, `role-generalist.md`.
Comms: `comms/README.md` + `comms/board-*.md`.

**Frontend** (`/frontend`): `frontend/AGENTS.md`, `frontend/CLAUDE.md`, `frontend/README.md`,
`frontend/DESIGN-SYSTEM.md`, `frontend/design-language.md`, `frontend/layout.md`,
`frontend/copywriting.md`, `frontend/SLOP-CHECK.md` (anti-slop bar), `frontend/landing-page-brief.md`,
`frontend/public/brand/README.md` (logo kit), `frontend-integration.md`.

**Backend** (`/backend`): `backend/README.md` (API + error codes), `backend/DEPLOY.md`,
`handoff-backend.md`.

**Engine** (`/engine`): `engine/README.md`, `docs/superpowers/plans/*` + `docs/superpowers/specs/*`
(reconcile/dedupe + eval-harness plans), `gold-set/labelling-guide.md`.

**Prompts** (`/prompts`): `extraction.md`, `classification.md`, `answer-generation.md`,
`gap-interview.md`, `raw-extraction-format.md`.

**CRM / traction (J's area, `/crm`):** `crm/README.md` (columns + conversion scoring + the
never-fake-a-contact rule), `crm/lead-gen-plan.md` (hit-rate strategy), `crm/leads.csv` (the data),
`crm/drafts/*.md` (one outreach draft per lead). Strategy/narrative: `traction-research.md`,
`traction-outreach.md`, `positioning-and-traction.md`, `sourcing-playbook.md`, `demo-narrative.md`,
`prior-art.md`, `fetch-agent-scope.md`, `autofill-scope-decision.md`. Misc: `tenders.md`,
`archive/waitlist/` (removed feature, kept for re-add), `Jawad's progress day 1.md`.

## Current situation (2026-06-30 snapshot — verify against STATUS.md/comms)
- **Frontend:** hi-fi public **landing** + a read-only **/demo** showcase + the product **compliance
  matrix** (`/review`), all in the "Civic Record" design system (paper/ink, Fraunces + Chillax).
  **Brand logo just added** — kit in `frontend/public/brand/`, inline `BrandLogo` lockup, favicon via
  `frontend/src/app/icon.svg`. Mock-data by default; live when `NEXT_PUBLIC_API_BASE_URL` is set.
- **Backend:** FastAPI live (`/health`, `/tenders`, upload, requirements, `/draft`, PATCH). Extractors:
  heuristic (no key, weak — misses disqualifiers), **OpenAI** (the demo-quality path), Claude (fallback).
- **Engine:** reconcile/dedupe + eval harness + auditable autofill.
- **CRM / traction (J):** email-first lead generation in progress. `crm/leads.csv` ≈ 70+ rows.
  ⚠️ **Two parallel "J" sessions are running** (see comms **J-029 / J-030**): one owns lead-gen +
  `leads.csv` rows **L-0048–L-0100**; the other owns id block **L-0101+** and `crm/drafts/`. If you
  act as J, **pick a disjoint id block, never clobber `leads.csv`, and `pull --rebase` constantly.**
- **Demo gate:** the OpenAI key is still pending. **Do not run a live demo on a warm lead** until the
  OpenAI path is solid — lead with the booking link / a pre-baked recording (see `traction-outreach.md`).

## Hard rules (do not violate — full text in AGENTS.md)
- **Trunk-based on `main`.** `git pull --rebase` before you start and before you push; commit small,
  push often. Never force-push `main`; never rewrite shared history.
- **Never push a broken build.** Frontend: `npm run build` + `npm run lint` from `/frontend` first.
- **Keep `main` runnable** (it's the live demo branch) and **keep `CODEMAP.md` current** — if you
  add/move/delete files, run `python scripts/gen_codemap.py` in the *same* commit.
- **Stay in your lane** (one folder per role). Don't edit another role's files without coordinating
  via their board.
- **Never commit** `.env`, secrets, `node_modules/`, `.venv/`, or tender PDFs.
- **CRM:** never invent an email/name/phone — `not_found` is valid; every real contact needs a
  `source` URL (`crm/README.md`).
- **Schema is locked** (the requirement shape in `AGENTS.md`) — changing it needs team agreement +
  a branch/PR.
