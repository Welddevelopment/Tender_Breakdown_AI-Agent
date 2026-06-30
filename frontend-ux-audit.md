# Bidframe Frontend — UI/UX Audit

> **What this is:** a full walkthrough of every UI/UX gap in the current frontend, measured against
> how the product is *supposed* to work (see [`tender-master-plan.md`](tender-master-plan.md) §5 "What the
> user sees", [`AGENTS.md`](AGENTS.md) frontend rules, and [`frontend/layout.md`](frontend/layout.md)).
> **Who it's for:** J + Pranav to go through together and decide what to build before outreach.
> **Date:** 2026-06-30 (Day 3). **Scope:** `frontend/src/` as it stands on `main`.

## How to read this

Each issue has a severity tag, a one-line fix direction, and a file reference so you can jump straight to it.

- **BLOCKING** — breaks the user loop, or burns a warm lead during outreach.
- **HIGH** — materially hurts the demo or one of the four scored criteria (real process · real speed-up · user in control · clear demo).
- **MEDIUM** — a real product gap, defensible to defer past the 4 Jul demo.
- **LOW** — polish.

**Context that frames everything:** the deployed site defaults to **mock data** (no `NEXT_PUBLIC_API_BASE_URL`),
and the live backend still catches **zero deal-breakers** until `OPENAI_API_KEY` is set on Render (G-009).
So for outreach the site is effectively mock-only, which is why the mock path has to be honest and complete.

---

## Status update — 2026-07-01

Most of the frontend audit was implemented on `main` by **Pranav's `c17edb0` "Harden demo day and frontend
UX flow"** (worked straight from this doc). Verified here: `npm run lint` + `npm run build` green.

**Done in `c17edb0`:** #1 honest upload · #3 real upload errors (`ApiError` + `detail`) · #6/#9 bulk
"Approve all confident" · #7 CSV export · #8 completion summary · #10 matrix search · #11 the `decided`
group · #12 clickable deal-breaker hero · #13 in-panel Next skips resolved · #18 decided-count line ·
#19 autofill visible in sample mode · #20 answering a gap re-drafts the answer · #21 deep-link anchor on
questions · #23 multiline gap inputs · #32 matrix empty state.

**Review caught 5 render bugs** (HTML entities / a mojibake char inside JS string literals — `lint`/`build`
miss these, users see them); **fixed on `frontend/fix-ux-render-bugs`:** a stray `Â·` in the `/review`
header, plus `&rsquo;`/`&hellip;` showing literally in four upload strings.

**Done this session (`frontend/audit-gaps`):** #15 undo / reopen a decision · #25 clickable graph nodes
(→ `/review?req=`) · #28 (slice) deep-linkable, refresh-safe selection · #33 route error boundary.

**Deferred — frontend, with reason:** #2 resolve-in-place upload transition (large; the honest-upload copy
already removes the credibility risk) · #14 two "Next"s (acceptable as-is) · #16 keyboard shortcuts (LOW) ·
#22 capability-doc management, #29 tenders-list, #30 silent-PATCH surfacing (all **live-only** — no value
on the mock-only deploy) · #26 graph scale filter (only matters at real-tender size) · #31 nav to the
upload trap (now moot — #1 made upload honest) · #28 full tender-in-URL + decision persistence (larger
architectural change).

**Backend lane (not frontend):** #24 source-on-the-page (needs page images / bbox coords or a servable
PDF) · #27 criterion titles · #4 true multi-file tender-pack ingest (the UI already rejects multi-file
gracefully) · #5 streamed extract progress.

A printable **response pack** (print → PDF, beyond Pranav's CSV) sits on `frontend/close-the-loop` if the
team wants the document deliverable; otherwise that branch is superseded and can be closed.

---

## TL;DR — the outreach-blocking shortlist

If we only fix four things before sending leads, fix these:

1. **#1 — Mock-mode upload lies** (tells a lead it parsed their file, shows the sample). Credibility killer.
2. **#7 — There is no export.** The loop has a dead end where the deliverable should be.
3. **#19 — Autofill is invisible on the deployed site.** Half the pitch ("auditable autofill") can't be seen.
4. **#3 — Upload errors are generic.** Pranav's real `422`/`413` messages get thrown away.

The outreach *funnel itself* — landing → `/demo` worked example → book a demo — is solid and safe and
touches none of these. The danger is entirely in the live product a curious lead pokes at behind it.

---

## Upload (`/upload`)

- [ ] **1. BLOCKING — Mock-mode upload lies about what it did.** With no API set (the deployed default),
  uploading any file waits 1.8s then says *"Parsed {your filename} and built the compliance matrix"* — but it
  never loads the file; the matrix still shows the hard-coded IT-services sample. A lead who uploads their own
  tender is told it parsed theirs, then shown someone else's requirements and numbers.
  *Fix:* make mock upload honest (label it a sample / worked example) or load a believable sample flow that
  doesn't claim it read their file. `frontend/src/components/UploadDropzone.tsx:25-39`

- [ ] **2. HIGH — The signature "resolve in place" transition doesn't exist.** Design §9 calls for the PDF
  resolving into rows in the same frame. It's two routes (`/upload` → click → `/review`), a full page nav. The
  product's one earned piece of theatre is unbuilt.
  *Fix:* resolve into the matrix in place, or at minimum make the handoff feel like one motion.
  `frontend/src/app/upload/page.tsx`, `frontend/src/components/UploadDropzone.tsx:69-101`

- [ ] **3. HIGH — Upload errors are generic.** Pranav ships human-readable `422`s (corrupt / encrypted / empty
  PDF) and a `413` (>50MB). The UI throws all of them away and shows one flat *"Couldn't reach the server."* —
  the wrong message for a bad file, and it teaches a lead the tool is flaky when it isn't.
  *Fix:* surface the backend's real message; distinguish bad-file from server-down.
  `frontend/src/components/UploadDropzone.tsx:104-125`, `frontend/src/lib/api.ts:18-31`

- [ ] **4. MEDIUM — Single file only.** Real tender packs are multiple PDFs (the master plan says "PDF(s)").
  `handleFiles` takes `files?.[0]`; dropping several silently ignores the rest.
  `frontend/src/components/UploadDropzone.tsx:17-21`

- [ ] **5. MEDIUM — No real progress for a long extract.** A 150-page PDF could take a while on the live path;
  there's only an indeterminate spinner, no progress, no time hint. Risk of "is it frozen?" mid-demo.
  `frontend/src/components/UploadDropzone.tsx:127-147`

- [ ] **6. LOW — No client-side size/type guard.** Backend rejects >50MB; the client doesn't pre-check or
  pre-message it, so the user waits for a round-trip to learn the file is too big.

## Compliance matrix (`/review`)

- [ ] **7. BLOCKING — There is no export. The loop has no end.** The master plan ends at "export the matrix +
  decisions." When everything resolves the header button becomes "Export response" but `onNext` is a no-op
  (priorityId is null) — a dead button. The bid writer does all the work and walks away with no artifact.
  *Fix:* client-side export (print-to-PDF / CSV / copy) of requirements + decisions + answers + citations.
  `frontend/src/components/MatrixView.tsx:72-74`, `frontend/src/components/MatrixView.tsx:99`

- [ ] **8. HIGH — No completion moment.** Finish a 3-week job in minutes and nothing marks it: no
  "12 approved, 2 edited, 1 flagged" summary, no payoff, no home for the export. The emotional beat of the
  whole pitch is unmarked. *Fix:* a completion summary that doubles as the export surface.

- [ ] **9. HIGH — No bulk "approve all confident."** `frontend/layout.md` §2/§8 explicitly designs this at the
  head of the Ready group. Unbuilt. On a real tender (the NHS stress test hit 472 reqs) clearing confident items
  one-by-one is exactly the drudgery the tool claims to delete — this *is* the "real speed-up" criterion made
  visible. *Fix:* a scoped "approve all confident" at the head of the Ready group, honest about what it touches.

- [ ] **10. HIGH — Doesn't scale past the 10-item sample.** No search, no category filter, no virtualization. A
  "Ready" group with 300 items is an unbroken wall; the messy-proof NHS tender would be an endless scroll with no
  way to find anything. *Fix:* a text filter / jump-to-category at minimum.
  `frontend/src/components/ComplianceMatrix.tsx:202-233`

- [ ] **11. HIGH — Flagged and edited items are mislabeled "Ready to approve."** `groupOf` sends every
  non-pending item to the `ready` bucket, whose heading is "Ready to approve." So a *flagged* requirement (you
  raised a concern) sits under "Ready to approve" — semantically wrong, and it undercuts the control story.
  *Fix:* a separate "Resolved" / "Decided" group, or split out flagged/edited.
  `frontend/src/lib/triage.ts:22-37`

- [ ] **12. MEDIUM — The deal-breaker hero isn't actionable.** The most important thing on screen — the
  bid-killers — is a static list. You can't click one to open/act; you have to hunt it in the matrix below.
  *Fix:* make each hero item open/scroll-to its requirement. `frontend/src/components/GatingHero.tsx:30-47`

- [ ] **13. MEDIUM — In-panel "Next" walks back through resolved items.** It does `(index+1) % length` over all
  items, so late in a session "Next, Next" re-shows things you cleared, breaking the approve→next rhythm.
  *Fix:* skip resolved items. `frontend/src/components/MatrixView.tsx:79-88`

- [ ] **14. MEDIUM — Two competing "Next"s.** The header "Next" jumps to highest-priority unresolved; the panel
  "Next" steps sequentially. Same word, different behaviour, both visible when the split is open.
  `frontend/src/components/DocumentHeader.tsx:99-106`

- [ ] **15. MEDIUM — No undo / no "back to pending."** Once approved/flagged you can re-decide, but there's no
  explicit revert; a misclick approval of a gating item is only correctable by editing/flagging.

- [ ] **16. LOW — No keyboard shortcuts for the power loop** (`a` approve, `j/k` next/prev, `e`/`f`). For a tool
  whose entire value is speed, this is a natural, cheap win.

- [ ] **17. LOW — Header responsiveness.** Title + 3-filter triage nav + Next sit in one no-wrap flex row; on
  narrow widths they can overflow. Bid review is desktop, so low priority.
  `frontend/src/components/DocumentHeader.tsx:43`

- [ ] **18. LOW — No decision-progress indicator on the matrix** (the /answers page has a progress bar; the
  review loop doesn't).

## Answers / autofill (`/answers`)

- [ ] **19. HIGH — The whole autofill story is invisible on the deployed site.** Both "Draft my answers" and
  "Add evidence docs" `return null` without a live `tenderId` — i.e. on the mock default. The page header
  promises "Draft answers built from your own documents" but the two hero actions don't render. "Auditable
  autofill" is half the product's scope and a lead never sees it exists.
  *Fix:* make the draft action work against the sample data, or show an explanatory disabled state.
  `frontend/src/components/AutofillButton.tsx:13`, `frontend/src/components/CapabilityUpload.tsx:15`

- [ ] **20. MEDIUM — Answering a gap doesn't improve the answer.** You fill an open question, but on the sample
  nothing re-drafts; the loop "answer the gap → the draft gets better" isn't closed in the UI.
  `frontend/src/components/OpenQuestions.tsx:81-90`

- [ ] **21. MEDIUM — The panel's "Answer this in the gap review" doesn't deep-link.** It dumps you at the top of
  `/answers`, not the relevant question. On a long tender that's a lot of scrolling to find it.
  `frontend/src/components/RequirementPanel.tsx:250-255`

- [ ] **22. MEDIUM — Capability docs can't be managed.** You can add evidence (re-runs the draft) but can't
  remove a doc, see which answers a doc backs, or be told a doc failed to parse.
  `frontend/src/components/CapabilityUpload.tsx`

- [ ] **23. LOW — Gap answers are single-line inputs.** A turnover figure is fine; a policy statement isn't. No
  multi-line. `frontend/src/components/OpenQuestions.tsx:74-80`

## Source traceability (the trust claim)

- [ ] **24. HIGH — "View source" shows the excerpt, not the source.** The headline promise is "every line back
  to its exact clause on the exact page, highlighted." What's built expands the `source_excerpt` *text* inline —
  a quote with no way to confirm it's really on p.14. No PDF view, no page image, no highlight-in-context. The
  backend has the PDF; even an "open PDF at page 14" link would move this from "the sentence we extracted" to
  "the sentence on the page." Biggest depth gap vs the pitch.
  `frontend/src/components/RequirementPanel.tsx:190-219`

## Graph (`/graph`)

- [ ] **25. MEDIUM — Nodes aren't clickable.** No `onNodeClick`; clicking a requirement node does nothing. The
  obvious interaction — click → open that requirement / jump to it in the matrix — is missing. It's a picture you
  can't act from. `frontend/src/components/GraphView.tsx:287-484`

- [ ] **26. MEDIUM — Doesn't scale.** Every requirement stacks in one left column at ~104px each; 472 nodes ≈ a
  49,000px-tall canvas. No filter (gating-only, one-criterion focus) to tame it.

- [ ] **27. LOW — Criteria are numbers only.** Nodes show "Award criterion 1" + a count, no title/weight, so
  "where the marks live" is thinner than it sounds (depends on backend data carrying criterion names).

## Cross-cutting / structural

- [ ] **28. HIGH — No tender lives in the URL; refresh wipes everything.** `tenderId` is React state, routes are
  `/review` not `/tenders/{id}/...`. Reloading any screen resets to the sample and loses the human's in-session
  decisions. Can't bookmark or share a tender. `frontend/src/context/RequirementsContext.tsx:54`

- [ ] **29. MEDIUM — No tenders-list / app-level screen.** `frontend/layout.md` §1 describes it; unbuilt.
  Pranav's new `GET /tenders` is the backend half — the endpoint now exists, the UI doesn't.

- [ ] **30. MEDIUM — Silent PATCH failures in live mode.** Decision saves are optimistic and swallow errors. If
  the backend PATCH fails, the UI shows "Approved" but it never persisted, with no toast or reconciliation.
  Silent divergence. `frontend/src/context/RequirementsContext.tsx:92-98`

- [ ] **31. MEDIUM — The global nav routes a curious lead straight to the upload trap.** Every product screen
  exposes an "Upload" link; from the read-only `/demo` a lead can opt into `/review` and from there reach
  `/upload` (issue 1). `frontend/src/components/SectionNav.tsx:12-17`

- [ ] **32. LOW — No empty state on the matrix itself** when extraction returns zero requirements (header over a
  blank body). Lower risk — graceful empty states exist for the answer/gap surfaces (board F-004) and extraction
  usually returns something. `frontend/src/components/ComplianceMatrix.tsx:216-219`

- [ ] **33. LOW — No global error boundary** — an exception in any client component white-screens the app
  mid-demo.

---

## General thoughts

- **The craft is genuinely top-tier and a real edge.** The Civic Record system, honest triage, decision capture
  with self-writing audit lines, confidence-as-bead-not-number, the copywriting discipline — this is the opposite
  of slop, and the kind of thing judges remember. None of the above should read as "the frontend is weak." It
  isn't.
- **The gap is depth-of-function under a deep-polish surface.** The funnel we're about to send leads down
  (landing → `/demo` → book a demo) is solid and doesn't touch any blocking issue. The danger is entirely in the
  live product behind it: a lead who pokes past the showcase hits the upload trap (#1), finds no export (#7), and
  never sees autofill (#19).
- **Against the four scored criteria:** strongest on *user-in-control* (decisions, audit, honest confidence) and
  *clear demo* (the surface). Weakest on *real speed-up demonstrated* (no bulk approve, no scale handling, no
  export deliverable — #7/#9/#10) and on the *source depth* the trust claim leans on (#24).
- **The one thing outside the frontend that gates all of it:** the live backend catches zero deal-breakers until
  `OPENAI_API_KEY` is on Render (G-009). Today the deployed site is mock-only, which is why the mock path must be
  honest and complete.

## Appendix — issue count by severity

| Severity | Count | Numbers |
|---|---|---|
| BLOCKING | 2 | 1, 7 |
| HIGH | 9 | 2, 3, 9, 10, 11, 19, 24, 28, (8) |
| MEDIUM | 13 | 4, 5, 12, 13, 14, 15, 20, 21, 22, 25, 26, 29, 30, 31 |
| LOW | 9 | 6, 16, 17, 18, 23, 27, 32, 33 |

*(Note: #8 is HIGH; counts above are indicative, not exact — work the list, not the tally.)*
