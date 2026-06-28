# Jawad's Progress — Day 1 (Frontend)

> Living log of what **I (Jawad, frontend)** have built for **Bidframe**. Newest section at the bottom of "Shipped".
> Source of truth for *team-wide* state stays [STATUS.md](STATUS.md); this is just my personal lane.
> **Role:** compliance matrix · source panel · decision controls · graph view · demo. **Lane:** `/frontend`.

**Started:** 28 Jun 2026 (Day 1) · **Demo:** 4 Jul 2026
**Live site:** https://frontend-alpha-neon-w699itcsq5.vercel.app (auto-deploys on every push)

---

## TL;DR

The whole front-end is wireframed, branded **Bidframe**, and **live on Vercel** — built mock-first against the locked requirement schema, so it's never blocked on the backend. A bid manager can open a tender, see the deal-breakers shout, click any requirement to read its source and approve / edit / flag it, view the relationship graph, and walk the upload flow. Decisions persist in-memory as you move around (no browser storage — the brief forbids it).

---

## Shipped — Day 1

### 1. Compliance matrix (the Day-1 core)
- Table over `mock-requirements.ts` shaped exactly like the locked API schema (`AGENTS.md` §Data contract).
- **Gating / deal-breaker rows stand out** (badge + row highlight); `needs_review` items deliberately look *hesitant* — the tool is honest, not guessing.
- **Confidence is visual only** (bar/dot), never a raw number like "0.92" — a hard judge-facing rule.
- Columns: requirement text · mandatory? · source · confidence · status.

### 2. Multi-page product shell (wireframes for the remaining sections)
Shipped as functional, mock-driven wireframes (polish pass comes later):
- **Persistent navbar** — `Upload · Matrix · Graph`, mounted in the root layout, active link highlights per route.
- **Source + decision slide-over drawer** — click a row → panel slides in from the right with the verbatim `source_excerpt`, page, and clause, plus **Approve / Edit / Flag** controls (Edit & Flag reveal a note field). Esc / scrim-click to close.
- **Gating "hero" banner** — red callout atop the matrix: "N deal-breakers — miss any one and the bid is disqualified," listing them. This is the demo gut-punch moment.
- **Relationship graph** (`/graph`) — React Flow (`@xyflow/react` v12) diagram: requirement nodes → award-criteria nodes (`criteria_ref`) and req → req (`depends_on`). Gating nodes red, `needs_review` amber, readable two-column layout (not a hairball).
- **Upload flow** (`/upload`) — drag-and-drop "drop a tender PDF" shell with a fake "extracting…" state → link back to the matrix. Wireframes the Day-4 live-upload moment.

### 3. In-memory decision state
- `RequirementsProvider` (React Context) in the root layout, seeded from the mock. Approve / edit / flag update `status` + a `decision { action, note, timestamp }`.
- Decisions survive navigation (App-Router layouts don't re-mount) — **no `localStorage`**, per the brief. This is the stand-in for the future `PATCH /requirements/{id}` call; swapping to the real API later only touches the provider.

### 4. Rebrand to **Bidframe**
- Renamed all UI strings (`Tender Breakdown` → `Bidframe`) and the `TB` → `BF` monogram across Header, NavBar, and every page's `metadata` title.

### 5. Mirrored the additive autofill schema
- Added `answer` `{ text, state, evidence_refs[], confidence }`, `open_questions[]`, and `capability_docs[]` to `src/types/requirement.ts` (additive/nullable — the matrix renders unchanged).
- Seeded two worked mock examples: one **auto-drafted** answer with an evidence citation, one **`needs_input`** answer with a gap question. Kept `draft_answer` as a deprecated alias so nothing breaks.

### 6. Deploy pipeline (live + automatic)
- App deployed to **Vercel** (monorepo, Root Directory = `frontend`).
- **GitHub auto-deploy wired**: every `git push` builds and ships the live site. (Routed through a personal `TenderBreak` mirror repo because the Welddevelopment org couldn't authorize the Vercel app — one push updates both the team repo and the deploy mirror.) CLI deploy kept as a fallback.

### 7. Answer + evidence panel & gap-interview (auditable autofill)
- **Answer + evidence panel** (in the requirement drawer): renders the drafted `answer` with a state badge (Auto-drafted / Needs your input / Edited by you), **visual** confidence (no raw numbers), an inline **Edit answer** affordance, and the **Evidence** list — each citation resolves the `doc_id` to the real capability-doc filename and shows page + verbatim excerpt in an emerald "receipts" card. Honest empty states (no draft / no evidence linked).
- **Gap-interview UI**: per-requirement open questions answerable inline in the drawer, **plus** a dedicated **`/answers`** route + nav item — an autofill summary (drafted / auto / needs-input / gaps remaining), a progress bar, and the full open-question to-do list grouped by requirement, answerable inline. All persists in-memory across navigation.
- Context extended with `capabilityDocs`, `editAnswer()`, `answerOpenQuestion()`. Mock enriched with 3 more drafted answers (2 `needs_input` + open questions). Build + lint green.

### 8. Live-backend wiring (env-driven, mock by default) — *first cross-lane integration, shipped via PR*
- `src/lib/api.ts`: `uploadTender()`, `getTender()`, `patchRequirement()` against the FastAPI endpoints; base URL from `NEXT_PUBLIC_API_BASE_URL`.
- **Mock by default** (env unset) so the deployed demo + local dev are zero-surprises; set the env (local `:8000` or the Render URL) to go live.
- Upload flow now uploads the real PDF → `loadTender()` swaps the extracted tender into the shared context → matrix/graph/answers all render real data; added an error state if the API is unreachable.
- Approve/edit/flag persist via `PATCH /requirements/{id}` (optimistic, best-effort) when the API is on. Added `.env.example`.

---

## Tech stack
- **Next.js 16** (App Router, Turbopack) · **React 19** · **Tailwind CSS v4** · **TypeScript 5** · `@/` → `src/`.
- **`@xyflow/react` v12** (React Flow) for the graph.
- Mock-first: `src/data/mock-requirements.ts`. Types: `src/types/requirement.ts`. Components: `src/components/`.

## Run it locally
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # must pass before every push
npm run lint
```

## Key files (my lane)
- `src/app/layout.tsx` · `src/app/page.tsx` · `src/app/graph/page.tsx` · `src/app/upload/page.tsx`
- `src/components/` — `NavBar`, `MatrixView`, `ComplianceMatrix`, `RequirementDrawer`, `GatingHero`, `GraphView`, `UploadDropzone`, `Header`
- `src/context/RequirementsContext.tsx`
- `src/data/mock-requirements.ts` · `src/types/requirement.ts`

---

## Next up (priority order)
1. **Design-system pass** — typographic + spacing polish over the wireframes (ideating separately, then implementing).
2. **Capability-doc upload mode** — a second upload lane for the bidder's own evidence docs (`capability_docs`), so gaps can be closed by uploading evidence.
3. **Make the *hosted* site show live data** — deploy the backend to a public URL (`backend/DEPLOY.md`, needs Pranav/Joel to stand up Render) and set `NEXT_PUBLIC_API_BASE_URL` in Vercel. Until then the live path works locally / on upload.

_Done: ✅ answer + evidence panel · ✅ gap-interview UI · ✅ live-backend wiring (see changelog)._

## Blocked on / waiting
- Nothing hard-blocking. Real-data swap can start any time — backend API is up (heuristic extractor; Claude/OpenAI path lands when the key is in).

---

## Changelog
- **2026-06-28 (Day 1)** — Initial log. Shipped items 1–6 above: compliance matrix, multi-page wireframes (navbar, drawer, gating hero, graph, upload), in-memory decision state, Bidframe rebrand, autofill schema mirror, Vercel deploy + GitHub auto-deploy.
- **2026-06-28 (Day 1, cont.)** — Shipped item 7: **answer + evidence panel** (drawer renders each requirement's drafted answer with capability-doc evidence citations, visual confidence, inline edit) and the **gap-interview UI** (`/answers` route + nav item: open-question to-do list, answerable inline, with autofill summary + progress). Context extended (`capabilityDocs`, `editAnswer`, `answerOpenQuestion`); mock enriched with 3 more drafted answers. Build + lint green.
- **2026-06-28 (Day 1, cont.)** — Shipped item 8: **live-backend wiring**, shipped via **PR** (first frontend↔backend integration). `src/lib/api.ts` + env-driven swap (`NEXT_PUBLIC_API_BASE_URL`), mock by default, real upload→extract→matrix + decision PATCH. Switched our workflow to **PR + merge** from here on (Joel can review).
- **2026-06-28 (Day 1, cont.)** — **Live integration smoke-tested end-to-end locally** (ran Joel's scaffolded backend, heuristic/no-key, with the real frontend on `:3000` → `:8000`). ✅ `spso-cleaning.pdf` → 21 requirements; `GET` response matches the locked schema **field-for-field** (incl. `capability_docs`); `PATCH` persists a decision across a re-GET; **CORS green from the browser origin** incl. the `PATCH` preflight. Posted to the team as comms **F-004** (@backend). **Finding:** heuristic content is thin (0 gating, no `answer`/`open_questions`) so the live path renders the honest empty states — keep the **mock as the demo showcase** until the OpenAI key lands; the live path proves the pipeline flows. No frontend changes needed for the OpenAI swap. _(append new days below)_
- **2026-06-28 (Day 1, cont.)** — **Applied the Bidframe colour system across the whole UI** (colours-only pass; type/layout/motion/anti-slop come later). Pulled the 11 tokens from `design/colours.html` into `globals.css` as Tailwind v4 `@theme` tokens (brand: paper/paper-raised/ink/ink-muted/forest/forest-hover/hairline · signal: oxblood/amber/yellow/light-green), then remapped every component off the placeholder slate/red/amber/emerald/blue palette. Brand carries all chrome; signal stays on status carriers only (confidence dot 4-tier scale, gating=oxblood, status cells, graph). Removed all off-palette colour (no blue/sky/orange/indigo, no pure white/black surfaces). Shipped via PR; build + lint green. Did **not** touch the design-system docs/typography specimens (Jawad's in-progress design work).
- **2026-06-28 (Day 1, cont.)** — **Applied the locked typeface across the whole UI** (typography-only pass; colour/layout/motion untouched). Wired the §11 type system with `next/font`: **Fraunces** for headings (brand wordmark/monogram, page + section titles, gating hero, state screens, hero stat numbers), **Chillax** for body (self-hosted Fontshare woff2 in `src/fonts/`, weights 400/500/600), **IBM Plex Mono** for evidence + source references (page/clause refs, IDs, doc citations, matrix column headers, the uppercase kicker labels, graph criteria nodes). Tokens `--font-head`/`--font-body`/`--font-mono` → Tailwind `font-serif`/`font-sans`/`font-mono`; six-size scale on headings. Shipped via PR; build + lint green; `@font-face` + tokens verified in compiled CSS.
