# Pilot Roadmap — Frontend & Design (Jawad)

Owner: Jawad (frontend + design lead)
Scope: 100% frontend / design system / demo & landing surfaces
Last updated: 2026-07-08
Reads with: [`ops/pilot-readiness-roadmap.md`](../ops/pilot-readiness-roadmap.md) (master), the frontend design set (`frontend/design-language.md`, `DESIGN-SYSTEM.md`, `layout.md`, `SLOP-CHECK.md`, `design-uplift.md`), and the pitch/demo plans (`overhaulplan.md`, `demo-scrolly-design-pack.md`).

---

## Why this document exists

The master roadmap scores the *whole* product on a 0–100 production-readiness scale and lays out the path from concierge demos to free pilots. This document is the **frontend slice of that plan, for you** — what your lane owns on the road to 70, then the extra 5 points to 75, tied to the design system you already wrote and the overhaul stages already in flight.

It is written through three lenses, because your role sits on all three:

- **Business lens** — the frontend *is* the product's trust surface. Every design decision moves a line: conversion (does a consultancy book a demo?), activation (does a pilot user reach the "click-to-source" moment?), or support cost (does a broken state generate a founder rescue?). Design work here is not decoration; it is the thing prospects judge us on in the first 10 minutes.
- **UI/UX lens** — the "forest-led civic record" identity is our differentiation. Slop kills credibility with procurement buyers faster than a missing feature. The `SLOP-CHECK.md` gate is your pre-commit contract.
- **Software-engineering lens** — the frontend has real, verified reliability gaps (bundle weight, remote-font build fragility) that block a *reliable* pilot deploy. These are yours to close.

---

## Current position (honest audit refresh)

The master roadmap froze the score at **62/100** on 2026-07-06. Since then, several things shipped that the score hasn't been updated for:

- **Stage 1 UX uplift is live** on `/demo` and `/thank-you` (deal-breaker oxblood alarm, completion "record filed" payoff, booking return flow, status-column clarity via `pendingStatusWord()`).
- **Upload-failure UI is already comprehensive** — `UploadDropzone.tsx` has typed error kinds (`type` / `size` / `zip-size` / `server` / `unknown`), inline per-file rejections, full-screen server errors, and 700ms job polling. This was listed as a *gap* in the roadmap; it is effectively **done**. Credit it.

Net: the honest current score is **~64/100**, not 62. Two frontend line items on the master scorecard:

| Area (frontend-relevant) | Roadmap 62 | Honest now | At 70 | At 75 |
|---|---:|---:|---:|---:|
| Product workflow (of 15) | 11 | 12 | 12 | 12 |
| Frontend reliability & performance (of 15) | 9 | 9 | 11 | 12 |

Your two frontend-owned points to reach 70 are **font build fragility** and **bundle weight**. Your point to reach 75 is the **motion + civic-record depth pass** that makes the pilot demo feel inevitable rather than nice.

---

## The non-negotiable design principle (unchanged)

Bidframe is a **controlled first-read layer, not an autopilot**. Every screen must keep these true, and the frontend is where they become visible:

- requirements, risks, citations, and draft answers are *surfaced*, never asserted as final
- the user decides — approve / edit / flag per requirement (your decision controls)
- uncertainty is visible (confidence bead + word, greyscale-safe — never a raw `0.92`)
- source proof is one click away (the click-to-clause moment is the whole pitch)
- no answer claims evidence that isn't present

If a design change would blur any of these, it fails the gate regardless of how good it looks.

---

## Part A — Work to reach 70 (the pilot gate)

These are the two frontend P0/P1 items from the master roadmap. They are reliability, not polish.

### A1. Remove remote-font build fragility  *(P0 · +~1 pt · closes a deploy risk)*

**What's real:** `frontend/src/app/layout.tsx:2–42` pulls **Fraunces, IBM Plex Mono, and Newsreader** through `next/font/google` (remote), with Chillax already local. The remote fetch can stall a production build when the Google CDN is blocked in CI, then "magically" pass on retry. `display: "swap"` mitigates runtime CLS but not *build-time* fragility.

- **Business framing:** a build that hangs before a pilot call is a founder-rescue event. Cost line: your time, and the credibility hit of "the deploy is stuck."
- **Tasks:** self-host Fraunces, IBM Plex Mono, and Newsreader as local `woff2` (same pattern as Chillax); drop unused weights/subsets (Fraunces currently loads 500/600/700 — keep only what the type scale in `DESIGN-SYSTEM.md §11` actually uses); verify no visual regression on landing, `/demo`, `/review`.
- **Done when:** a clean `npm run build` succeeds with the network to Google Fonts blocked; build time recorded before/after in an ops note; no CLS or glyph regression on the main routes.

### A2. Stop demo data leaking into every product route  *(P1 · +~1 pt · faster first load)*

**What's real:** `frontend/src/context/RequirementsContext.tsx:16,38` imports `bradwell-prebake.json` at module top level, so the demo tender ships in the `RequirementsProvider` chunk on **every authed route**. `components/demo/sample.ts` (~137 lines) is bundled into the demo chunk. PDF.js is *already* correctly dynamic-imported (`PdfSourceView.tsx:106`) — leave it.

- **Business framing:** first-load JS is time-to-value. A heavier bundle is a slower "upload → matrix" moment on the exact call where a prospect decides. Moves the activation line.
- **Tasks:** capture a route bundle baseline first (`next build` output — save the numbers, this is the P1 "baseline" item); lazy-load `bradwell-prebake.json` behind a dynamic import used only where the demo/prebake path actually mounts; keep live product state (`RequirementsProvider`) free of fixture imports; leave the auth + requirements providers themselves in place (they're genuinely app-wide).
- **Done when:** route bundle stats captured before/after; the main app route and upload route show lower first-load JS; source viewer still opens for PDF/DOCX/XLSX/CSV; `/demo` still runs the frozen Bradwell prebake.

> Scope discipline: **do not** cosmetic-refactor the matrix/review components for neatness. The roadmap is explicit — split only where it measurably lowers route weight (`ops/pilot-readiness-roadmap.md`, band 60–69 §3).

---

## Part B — The extra 5 points (70 → 75): what your lane contributes

The +5 to 75 comes from three hardening stages (detailed in the master §"70→75" below and in the backend/generalist docs). **Frontend owns roughly one of those five points**, through two pieces:

### B1. Kill the query-string token on the client  *(part of the Security stage · shared with Pranav)*

**What's real & why it matters (High severity):** `frontend/src/lib/api.ts` builds source/PDF URLs with `?token=<bearer>` (`:131–145` for PDF, `:184–196` for source files). Bearer tokens in query strings land in browser history, server access logs, and proxy logs; the token is also in `localStorage` (`:23–53`) and valid for 7 days. This is the single highest-severity trust gap in the product — and trust is our entire wedge.

- **Business framing:** this is the one item that could *end* a pilot ("your tool leaked my auth token into the URL"). Procurement buyers ask this question. It moves the risk line, not a feature line.
- **Frontend tasks (paired with backend):** switch source/PDF fetches to `fetch()` with an `Authorization: Bearer` header into a blob URL (or a short-lived signed URL the backend mints), instead of embedding the token in the `<iframe>`/`<img>` `src`. Coordinate the contract change on `comms/board-frontend.md` so Pranav flips the endpoints in the same window.
- **Done when:** no document URL contains a token; source preview still works for all four formats; two-account privacy check still passes.

### B2. Motion + civic-record depth pass — the demo's dynamic range  *(the frontend half of the "pilot-ready feel")*

This is where the design system stops being a doc and becomes the thing that wins the room. The overhaul plans already name every beat — you're implementing, not inventing.

- **The one hero transition** (`DESIGN-SYSTEM.md §9`, `layout.md §9`): upload → extract → triaged matrix. Raw document resolves into rows, the triage line ("8 need your input · 12 to verify · 40 ready") lands. One showpiece, calm everywhere else. Reduced-motion users get the composed end state.
- **`/demo` scrollytelling** (`demo-scrolly-design-pack.md`): 6 beats + close, IntersectionObserver only, no scroll libraries, `prefers-reduced-motion` and mobile fallbacks required. Beat 3 (the deal-breaker rising into the oxblood card) is the emotional core.
- **Deal-breaker stop-sign** carried into `/pitch` (`overhaulplan.md §5`): the darkest, sharpest beat — "This is the clause that would kill the bid." One poster-scale moment.
- **Civic-record depth on proof surfaces**: masthead, register, ruled margin, mono record voice deepened on `/review` and evidence panels — the "official document" feeling that makes a buyer trust it over generic AI output.

- **Business framing:** motion here is not delight-for-delight. The upload→matrix resolve *is* the value proposition made visible in 3 seconds; the click-to-source proof is the trust moment. This is the frontend's contribution to conversion (demo → "I'd run my next bid through it").
- **Done when:** the hero transition runs on the live demo; `/demo` scrolly passes reduced-motion and mobile fallbacks; `/pitch` has the slide-3 stop-sign beat; `SLOP-CHECK.md` gates pass on every new surface.

---

## Your pre-commit gate (every push)

From `SLOP-CHECK.md` — run this before you push anything customer-facing:

1. **Greyscale test** — does hierarchy/rank still work with no colour? (Confidence = bead + word, never colour alone.)
2. **Name one intentional choice** — point to one deliberate, slightly-unexpected decision on the screen.
3. **Tier-1 hard-nos absent** — no blue/teal/purple generic primary, no gradients/glass/neon, no bento or stat-tile grids, no em dashes, no "Supercharge/Unlock/Elevate", no lorem, no undesigned empty/error states.
4. **Real content** — no three identical demo rows.

Plus the build gate (non-negotiable, from `AGENTS.md`): `npm run lint` and `npm run build` green before every push. Never push a broken build to `main` — it's the live demo branch.

---

## Definition of done for your lane at 75

- [ ] Production build succeeds with Google Fonts network blocked (fonts self-hosted)
- [ ] Route bundle baseline captured; demo fixtures no longer in the global product chunk
- [ ] No auth token in any document URL (source/PDF fetch via header or signed link)
- [ ] Upload-failure states verified for large / bad / good / mixed-ZIP (already built — just re-verify)
- [ ] Hero upload→matrix transition live; `/demo` scrolly + `/pitch` stop-sign shipped with reduced-motion + mobile fallbacks
- [ ] Every new surface passes `SLOP-CHECK.md` and `npm run lint`/`build`

---

## Reference map

| Need | File |
|---|---|
| Master scoring & bands | `ops/pilot-readiness-roadmap.md` |
| Visual system (14 sections) | `frontend/DESIGN-SYSTEM.md` |
| "Forest-led civic record" identity | `frontend/design-language.md` |
| Structure / layout / split state | `frontend/layout.md` |
| Pre-commit quality gate | `frontend/SLOP-CHECK.md` |
| What Stage 1 shipped | `frontend/design-uplift.md` |
| Pitch deck overhaul | `overhaulplan.md` |
| `/demo` scrollytelling spec | `demo-scrolly-design-pack.md` |
| Copy-paste tokens (hex/type) | `frontend/design/colours.html`, `warmth.html`, `typography.html` |
| Demo run-of-show | `control-demo-script.md` |
