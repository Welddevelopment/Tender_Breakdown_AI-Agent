# UI Improvement — Stage 7: Forest-Led Continuity, Landing, And `/demo`

Owner: Jawad (frontend) · Drafted 2026-07-11, after UI Stage 6 shipped. The final UI-improvement stage.
Reads with: `frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md` (§"Stage 7"), `MOTION.md` (§"Landing Page", §"/demo").

## Promise

Landing, `/demo`, and the app feel like one Bidframe: forest-guided on arrival, record-solid during proof — and the demo teaches the *real* app grammar, including the collaboration it just gained.

## Step 0 — Audit (done). Stage 7 is PARTIAL; no backend needed.

Already DONE, leave alone: reduced-motion leaves every landing/demo surface polished + static (all gated, static fallbacks); `/showcase` is `robots: noindex` and not the public target; landing/demo already reuse the real product components (ComplianceMatrix, GatingHero, ApprovalStamp, ConfidenceIndicator, GraphView).

Genuine remaining work (all frontend):

1. **The demo doesn't teach collaboration.** `/demo` covers deal-breaker → source proof → confidence → answer+receipt → approval → relationships, but never the Stage 6 collaboration grammar (comment/blocker markers, blocker-gates-export). A prospect watching `/demo` then entering the app wouldn't recognise the collaboration behaviour (DoD acceptance test names it explicitly).
2. **~30 hardcoded motion durations** in landing + demo choreography don't use the shared `--motion-*` / `--ease-*` vocabulary (globals.css hero-*/proof-* keyframes, HeroResolve, DemoScrolly, ScrollyStage, useScrollTimeline, DemoTitleCard) — the "forest-led continuity" is architecturally there but not spoken in the token language.
3. **Cross-route visual QA** across `/`, `/upload`, `/review`, `/answers`, `/graph`, `/teams`, `/demo`, `/pack` (+ reduced motion) — explicitly in scope, and a chance to catch any regression from Stages 4–6.

## Workstreams

**A · Demo collaboration beat.** Add a "collaboration" beat to `steps.ts` (between "control"/approval and "map") and render it in `ScrollyStage.tsx` using the real `CollaborationMarkers` (CommentCountMarker + BlockerMarker): a requirement carrying a team comment and an unresolved blocker, with the honest line that a blocker holds the bid until it's resolved — teaching the Stage 6 grammar in the app's own components. Tokenise ScrollyStage's own hardcoded durations while there. Model: **Sonnet**.

**B · Motion tokenisation (landing + demo, safe pass).** Replace hardcoded durations with `--motion-*` / `--ease-*` where they map cleanly (exact or ≲12% delta); leave hand-tuned cinematic values (e.g. the 1.05s sheet-file reveal) as *documented* exceptions rather than forcing a token that would change the feel. Files: globals.css (landing/demo keyframe blocks), HeroResolve.tsx, DemoScrolly.tsx, useScrollTimeline.ts, DemoTitleCard.tsx. Model: **Sonnet**.

**C · Cross-route visual QA (lead).** Headless screenshots of all eight routes, motion-on and reduced-motion, checking the app grammar reads consistently and nothing regressed from Stages 4–6; fix anything broken.

## Boundary / constraints

- **Truthful continuity.** Landing/demo inherit the app's grammar; don't invent a prettier product. Proof numbers don't count up; no ambient loops behind reading text.
- **Record discipline holds in proof.** Landing/`/demo` may choreograph more, but source proof / approval / collaboration-blocker states stay disciplined (still, greyscale-legible).
- **Reduced motion stays whole** — already done; keep it that way (new beat must have a static composed fallback via the existing demo static mode).
- **No backend.** Stage 7 is pure frontend. The demo collaboration beat uses literal sample props, not live data. Backend-blocked collaboration features (per-requirement assignment/ownership; invite lifecycle states) stay deferred and are flagged to `@backend` on `comms/board-frontend.md`.
- **`/showcase` stays internal** (noindex); don't promote it.

## Sequencing & verification

A / B on disjoint files (A: steps.ts + ScrollyStage.tsx; B: globals.css + HeroResolve + DemoScrolly + useScrollTimeline + DemoTitleCard) via two Sonnet subagents, integrated by the lead. C is the lead's cross-route QA pass. `npm run build` + `npm run lint` green; headless-browser check of the new demo beat + all eight routes + reduced motion; trunk to `main` over the codemap bot. Backend deferrals posted to the comms board.

## Changelog

- 2026-07-11 — **Stage 7 shipped (A/B + QA).** Demo collaboration beat (A) — a "Together / Your team, in the margin" beat teaching the Stage 6 comment/blocker grammar with the real `CollaborationMarkers` and the blocker-holds-export line, on the same insurance-gate requirement as the answer/approval beats; downstream beat indices re-aligned, static-mode safe. Motion tokenisation (B) — landing/demo durations now source from `--motion-*`/`--ease-*` where they map within ~12%; hand-tuned cinematic values left as commented exceptions, no feel change. Cross-route QA (C) — headless check of all eight routes (`/`, `/upload`, `/review`, `/answers`, `/graph`, `/teams`, `/demo`, `/pack`) with **zero console/page errors**, landing + demo verified clean in normal AND reduced motion, and the new demo beat verified rendering. Build + lint green. **No backend** — pure frontend; backend-blocked collaboration features (per-requirement assignment/ownership; invite lifecycle) flagged to @backend in comms F-040. **This completes the UI-improvement track (Stages 1–7).**
- 2026-07-11 — plan drafted; Step-0 audit folded in (reduced-motion + /showcase already done; landing/demo already reuse real components). Real work: a demo collaboration beat (teaching Stage 6), a safe motion-tokenisation pass for forest-led continuity, and cross-route visual QA. No backend — Stage 7 is pure frontend; backend-blocked collaboration features flagged to @backend.
