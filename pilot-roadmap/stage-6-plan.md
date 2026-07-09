# Stage 6 Plan — Export & Handoff

Owner: Jawad (frontend export surface) · Drafted 2026-07-09, after Stage 5 shipped end-to-end (`a5c3e3e` + backend `911aba7`).
Reads with: `pilot-roadmap/stage-5-plan.md` (answer decisions this stage gates on), `frontend/UI/UX/Motion Overhaul/UX-OVERHAUL-BRIEF.md` (the export vision, lines 544–584), `frontend/design-language.md` (record-led rule for exports), `frontend/SLOP-CHECK.md` (gate).

## Why this is Stage 6

The product loop is **upload → review requirements → draft answers → export**. Stages 1–5 delivered the first three: the matrix, reliability, and the `/answers` review-and-fill flow. Stage 6 is the loop's last step — turn the reviewed requirements + drafted, now **approvable** answers into the artifacts the user carries into their real bid, and hand them off honestly.

**Why now, specifically:** Stage 5 introduced the answer-scoped verdict (`answer.decision`: approved / flagged). That is the missing input export always needed — it's what lets export be *honest* ("this answer is approved" vs "still needs input") instead of dumping whatever's on screen. Export before Stage 5 could only emit content; export after Stage 5 can emit **judgement**.

**Business framing:** the pilot ask is "would you run your next bid through it?" The answer produced here is the thing that leaves the tool. If export quietly emits unapproved drafts or hides an open deal-breaker, one bad client-facing pack destroys the trust wedge. Metrics to move: % of pilots that export at least one artifact, and — the real one — zero exports that misrepresent readiness.

**Naming note (avoid the collision):** the separate *UI Motion Overhaul* track also has a "Stage 6" (`frontend/UI/UX/Motion Overhaul/…`), but there it means **Collaboration Presence & Audit** — a motion/polish stage, unrelated. This doc is the **product** roadmap's Stage 6 = **Export & Handoff**.

## Step 0 — Audit first (done; folded into each workstream below)

Same lesson as Stage 2/5: **verify before building.** Export is **already substantially built** — this stage is *completion + honesty*, not from-scratch. Verified current state:

- **Bid Response Draft** — ✓ built. `lib/export-response.ts` builds Markdown / Plain-text / DOCX (docx dynamic-imported, code-split); `ExportMenu.tsx` offers PDF (browser print) / Word / Markdown / Plain text; mounted on `/answers` (`AnswerFilterBar.tsx:65`, `ReadinessLedger.tsx:102`).
- **Compliance Matrix** — ✓ built. `lib/export-matrix-xlsx.ts` emits the matrix as XLSX (matrix surface).
- **PDF path** — ✓ the browser's Save-as-PDF over the print stylesheet (`globals.css @media print`, "the print is the document"; `.no-print` / `hidden print:block` discipline already in place).
- **Audit/Evidence Pack** — ✗ **no dedicated builder.** The third artifact type in the brief doesn't exist yet.
- **Export honesty / blockers** — ✗ **absent.** `ExportMenu` exports unconditionally: no readiness check, no blocker surfacing, no approved-only filter. This is the central gap, and Stage 5's `answer.decision` is exactly what unblocks it.
- **Client-ready vs internal-detailed** — ✗ single output; no toggle.
- **Backend** — export is 100% client-side (backend `FileResponse`/`StreamingResponse` serve source docs + SSE only). **No backend work this stage** unless we choose server-rendered PDF (we don't — see Boundary).

## Boundary (record-led exports; honesty is the point)

Exports are **record-led** — `design-language.md`: *"The compliance matrix, bid response draft, and audit/evidence pack are record-led: official, editable, and honest. Forest can guide the export moment in the app, but the files themselves keep restrained branding and keep unresolved gaps visible."* So forest/chrome/motion stay off the emitted artifact (the print stylesheet already flattens to paper + ink). The brief's honesty rules are load-bearing this stage:

- Show blockers; allow export only when appropriate; **never imply the bid is complete without human approval.**
- Show unresolved gaps as explicit prompts, never as hidden omissions.
- Client-ready output stays clean; internal-review output stays detailed.

**Out of scope (from the brief):** no document editor, no proposal-writing wizard, no polished buyer-submission generator. We emit an honest internal/working artifact, not a finished proposal.

## The export-readiness model (state-machine lens)

Mirror Stage 5's approach: surface a first-class, derived readiness state rather than inventing UI ad hoc. Per tender, from data that already exists (`lib/answers.ts` readiness + the new `answer.decision`):

```
per requirement:  open-deal-breaker ─▶ blocks any client-ready export
                  open-gap (unanswered open_questions) ─▶ prompt, not omission
                  drafted · unapproved (answer.decision == null) ─▶ excluded from client-ready
                  approved (answer.decision == "approved") ─▶ client-ready
                  flagged (answer.decision == "flagged") ─▶ internal-only, shown as a blocker

tender export state:  blocked ─▶ gaps-open ─▶ unapproved ─▶ ready
```

This one derivation drives A (the blocker summary), C (what the menu enables), and D (approved-only filtering). Build it once, pure, in `lib/export-readiness.ts`.

## Workstreams

**A · Export readiness & honest blockers** — *the centerpiece; nothing else is trustworthy without it.*
· Current state: `ExportMenu` exports whatever's on screen with no readiness awareness.
· Scope: a pure `lib/export-readiness.ts` (open deal-breakers, open gaps, unapproved/flagged answers, unbacked answers) → a pre-export **readiness summary** shown before any download: what's ready, what's blocking, each blocker an explicit, clickable prompt (jump to the gap / the unapproved answer). Client-ready export is gated when gating items are open or unapproved; internal export is always allowed but stamps its own caveats.
· Model: **Opus** — honesty logic is where a wrong call breaks the wedge (a pack that reads "done" when it isn't).
· Done when: a tender with an open deal-breaker or unapproved gating answer cannot emit a "client-ready" artifact without the blocker shown first; nothing is hidden.

**B · The three artifacts, trued & completed.**
· Current state: Response Draft ✓ (DOCX/MD/TXT/PDF-print), Matrix ✓ (XLSX). **Audit/Evidence Pack ✗.**
· Scope: build the **Audit/Evidence Pack** (internal proof trail) — per requirement: status + requirement decision + audit line, the answer + its `answer.decision` verdict/audit line, evidence citations ("Backed by your {doc}, p.{page}" + excerpt), source ref. PDF (via print view) or DOCX appendix. **Carry `answer.decision` + audit lines into the Response Draft builders** (`export-response.ts` MD/TXT/DOCX predate Stage 5 and omit the verdict; the XLSX matrix already includes it as a column, so that one's a checkpoint, not a build). Add CSV fallback for the matrix if missing (brief: "XLSX first, CSV fallback").
· Model: **Sonnet** against the existing `export-response.ts` / `export-matrix-xlsx.ts` patterns; **Haiku** for token/label tables.
· Done when: all three artifact types emit; every export reflects the Stage 5 verdicts (approved/flagged) and audit lines, not just answer text.

**C · One confident ExportMenu (artifact-first).**
· Current state: `ExportMenu` is response-only and format-first (PDF/Word/MD/TXT); the matrix XLSX export lives on a different surface — the three artifacts aren't presented as one coherent choice.
· Scope: restructure to **artifact-first** — pick the artifact (Compliance Matrix · Bid Response Draft · Audit/Evidence Pack), then its format; show A's readiness summary inline before the download; consistent single placement. Keep DOCX/xlsx dynamic-imported (code-split).
· Model: **Sonnet** (restructure against device kit); **Haiku** for the format/label matrix.
· Done when: a user sees the three artifacts as clear choices with honest per-artifact readiness, one obvious place to export from.

**D · Client-ready vs internal-detailed.**
· Current state: single output shape.
· Scope: a toggle — **client-ready** (clean, approved answers only via `answer.decision`, no internal notes/flags/audit) vs **internal-review** (detailed: open gaps as prompts, flagged answers, the audit trail). Approved-only filtering reuses A's derivation.
· Model: **Sonnet** (filtering + copy; the "clean vs detailed" line is a small trust-critical call — Jawad/Opus review the client-ready omissions).
· Done when: client-ready output contains only approved, backed answers and never a flagged/unapproved one; internal output shows everything honestly.

## Motion

No new hero motion. Reuse Stage 3's approval stamp for the "export ready" beat (the readiness summary flipping to ready). `prefers-reduced-motion` composed end-state mandatory. Exports themselves carry no motion (record-led).

## Sequencing & models

**A** (readiness derivation + honest blockers — everything hangs on it) → **B** (artifacts, especially the missing Evidence Pack; carry verdicts into all builders) → **C** (unify the menu around the three artifacts) → **D** (client/internal toggle). One commit per workstream; `npm run build` + `npm run lint` green per commit; trunk to `main`. Export stays client-side — no backend/Pranav dependency this stage (the SSE `?token=` stream-ticket item is still the only open backend carry-over, unrelated).

**Fable? Likely No** — like Stage 5, this is record-led builders + honesty logic + a menu, inheriting the device kit and print stylesheet wholesale; no motion/brand-visual *exploration*. Net: mostly **Sonnet + Haiku**, **Opus** for the readiness/honesty logic and the client-ready omission call.

## Considered & deferred (kept out on purpose)

A wider audit surfaced heavier options. They're deferred, not forgotten — each adds cost or crosses the brief's out-of-scope line, and none is needed for a credible pilot export:

- **Backend export endpoint + server-side doc-gen** — the whole export path is client-side today and works; a `POST /tenders/{id}/export` only earns its keep for large async bundles or scheduled exports. Adds a backend dependency (Pranav) for no pilot gain. Defer until a file size or automation need is real.
- **Export audit log (who exported what, when)** — nice for compliance, but there's no server export to log yet, and it's a collaboration/audit concern that belongs with the motion track's own Stage 6, not here.
- **Multi-format ZIP bundle** — convenient, but a second gesture once the three artifacts each export cleanly; ship the artifacts first, bundle only if pilots ask.
- **A dedicated `/export` or `/handoff` route** — export lives on `/answers` (where the content is) and that's the right context; a separate route is navigation for its own sake until the flow demands it.
- **Handoff acknowledgment / "sent to portal"** — that's buyer-submission territory, explicitly out of scope per the brief.

## Verification

- Build + lint green per commit; SLOP-CHECK + greyscale on the export surface.
- All three artifacts emit and open cleanly (XLSX/CSV, DOCX/MD/TXT, PDF-print, Evidence Pack).
- A blocked tender (open deal-breaker / unapproved gating answer) cannot produce a "client-ready" artifact without the blocker shown; gaps appear as explicit prompts, never omissions.
- Client-ready output contains only approved, backed answers; internal output shows flags, gaps, and the audit trail.
- Every artifact reflects Stage 5 verdicts + audit lines, not just answer text.
- Print/PDF path unchanged; `.no-print` chrome still stripped; two-account isolation unaffected (export is client-side).

## Changelog

- 2026-07-09 — plan drafted; Step 0 audit folded in. Export is ~60% built (Response Draft + Matrix XLSX + print-PDF exist); the real Stage 6 work is **export honesty/blockers** (unlocked by Stage 5's `answer.decision`), the **Audit/Evidence Pack** artifact, a unified **artifact-first ExportMenu**, and the **client-ready vs internal** toggle. No backend dependency; likely no Fable.
