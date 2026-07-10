# UI Improvement — Stage 4: Tender Intake And Processing

Owner: Jawad (frontend) · Drafted 2026-07-10, after UI Stage 3 (matrix review & source proof) shipped.
Reads with: `frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md` (§"Stage 4", §"2. Tender Library and Upload"), `MOTION.md` (§"Upload And Tender Library").

## Promise

Uploading a tender pack feels transparent, guided, and trustworthy from file drop to matrix ready — and a user never wonders whether they're looking at sample data, an old tender, or the one they just uploaded.

## Step 0 — Audit (done). Stage 4 is ~65% built.

Already DONE, leave alone:
- **Per-file staged rows** — format badge (PDF/DOC/XLS/CSV/ZIP), size, remove, accepted/rejected states; loose files + ZIP staged together; mixed packs read as one (`UploadDropzone.tsx:577–627`, `source-doc.ts:57–72`).
- **NoTenderLoaded** — "Pick a tender" + recent tenders + upload, recovery-oriented (`NoTenderLoaded.tsx:13–107`).
- **Processing stages, mostly** — named steps (read → section → extract → merge → map → draft) advancing in turn, per-file stage badges from `job.docs`, deal-breaker flare (`ProcessingView.tsx:15–221`).

Genuine remaining work (3 commits):

## Workstreams

**A · Current-tender strip on `/upload`.** New `CurrentTenderStrip.tsx`, wired into `UploadWorkspace` above the library. When a real tender is loaded (`tenderId !== null`), a single raised, grained sheet shows title · source-doc count · requirement count · deal-breaker count · uploaded date (when present). When `tenderId === null` it reads explicitly as **sample data** (honest label, no fake counts dressed as real). No sharing/people state — the backend has no owner/shared field, so we don't invent one. Reads `useRequirements()` only. Model: **Sonnet**.

**B · Tender library grouping.** `TendersList.tsx`: group the flat card list into **Current** (the loaded tender, pulled up + marked), **Uploaded by me** (the rest), and **Samples** (the worked-example card). Omit "Shared with me" — no backend field to populate it honestly. Keep the existing `TenderRow`/`SampleCard` rendering; this is grouping + section headers only. Model: **Sonnet**.

**C · Upload success next-steps + file-level error recovery + dropzone forest guidance.** `UploadDropzone.tsx`:
  - Success screen: keep primary **Open the matrix**; add secondary **Review deal-breakers** (→ `/review`) and **Draft the bid** (→ `/answers`); keep "Upload another" as the tertiary reset. Points at the next useful step, not a dead end.
  - Error state: offer both **Try again** and **Upload a different file** (reset), so a bad file preserves momentum.
  - Dropzone hover/focus: forest edge + paper lift on `--motion-fast` (120ms), collapsing to instant under reduced motion — guidance, not decoration.
  Model: **Sonnet**.

## Boundary / constraints

- **Apply the existing grammar; don't re-architect intake.** Reuse `paper-raised`/`surface-grain`/`--depth-*`, the `--motion-*` tokens, forest/oxblood/accent colours. No new colours (SLOP-CHECK).
- **No new backend fields.** Only render optional signals (`uploadedAt`, `dealBreakerCount`, `job.docs`) when present; never fabricate sharing/owner/progress data.
- **Honesty over completeness.** Sample data says it's sample; absent metadata is omitted, not faked.
- **Reduced motion stays whole** — dropzone lift, success resolve, and per-file advance collapse to instant via the token override; states stay legible.

## Sequencing & verification

A / B / C touch disjoint files (new `CurrentTenderStrip.tsx`; `TendersList.tsx`; `UploadDropzone.tsx`) → built in parallel by Sonnet subagents, integrated + wired + verified by the lead. One commit per workstream; `npm run build` + `npm run lint` green per commit; headless-browser check of `/upload` (strip, grouping, success actions, error recovery) and reduced-motion; trunk to `main` (rebase over the codemap bot). No backend.

## Changelog

- 2026-07-10 — **Stage 4 shipped (A/B/C).** Current-tender strip on `/upload` (A) — title, source-doc/requirement/deal-breaker counts, "Sample data" tag when `tenderId === null`, Review → link. Tender-library grouping (B) — Current (forest-marked, pulled up) vs Uploaded by me, headings suppressed when there's nothing to distinguish; no "Shared with me" (no backend field). Upload success next-steps + error recovery + dropzone forest guidance (C) — success adds Review deal-breakers (→ /review) and Draft the bid (→ /answers) beside the untouched primary; error adds "Upload a different file"; idle dropzone gets a one-shot forest hover/focus lift on `--motion-fast`. Built in parallel by three Sonnet subagents on disjoint files, integrated + verified by the lead. Verified in a headless browser: the strip renders with the honest sample tag and live counts, and a mock upload resolves to a "Sample compliance matrix ready" screen showing all three next-step actions. Fixed one integration bug (a `React.ReactNode` type reference with no React import). Build + lint green.
- 2026-07-10 — plan drafted; Step-0 audit folded in (Stage 4 ~65% built: per-file rows, NoTenderLoaded recovery, and most of the processing narrative already ship). Real work: current-tender strip, library grouping, and success/error/dropzone-motion polish. No "Shared with me" / people state — no backend field to populate it honestly.
