# UI Improvement — Stage 6: Collaboration Presence And Audit

Owner: Jawad (frontend + a scoped additive backend change) · Drafted 2026-07-10, after UI Stage 5 shipped.
Reads with: `frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md` (§"Stage 6", §"7. Teams and Collaboration"), `MOTION.md` (§"Collaboration").

## Promise

Teamwork is visible at the work item — not only on `/teams` — and the record reads as proof: who acted, what changed, where the discussion belongs.

## Step 0 — Audit (done). Stage 6 is mostly built.

Already DONE, leave alone: ShareControl focused dialog with success/error + member moss-pulse; ActivityFeed/ActivityControl as an audit trail (actor · action · object · time); comments tied to a requirement (CommentThread + live SSE); Owner/Member labels with no fake role controls; the collaboration attribution grammar (`collaboratorFor` / `actorLabel`, decision actor chips + "Approved by {actor}" on rows).

Genuine remaining work — the Stage 3 deferral + the blocker treatment:

1. **Comment presence isn't in the workspace.** The matrix and answer cards don't show that a requirement has comments — you only see them by opening the panel. Stage 3 deferred this because "the matrix does not load comment counts today." Fix: load counts and mark discussed rows/cards.
2. **No blocker-comment treatment** (DoD item 6). A comment can't be raised as something that blocks export.

## Workstreams

**Backend (additive, verified locally) — comment counts + blocker comments.**
· `Requirement` gains `comment_count` + `open_blocker_count`, stamped at read time from the comments table (not stored in the blob). Comments gain `is_blocker` + `resolved_at` columns; `POST …/comments` accepts `is_blocker`; new `POST /comments/{id}/resolve`. All additive — existing rows/comments read unchanged. Verified: a requirement with 2 comments (1 blocker) reports `comment_count=2, open_blocker_count=1`; resolving the blocker drops it to 0.

**A · Matrix row markers.** `ComplianceMatrix.tsx` — a quiet "N comments" bead and an oxblood "Blocked" bead in the row's signal cluster (shared `CollaborationMarkers`), null at zero so comment-free rows are unchanged. Model: **Sonnet**.

**B · Answer card + panel markers.** `AnswerCard.tsx` + the `RequirementPanel` "Team comments" zone title — the same markers, so /answers and the open panel show discussion at a glance. Model: **Sonnet**.

**C · Blocker comments in the thread.** `CommentThread.tsx` — a "Mark as blocker" toggle on the composer, an oxblood (still, not alarming) treatment + "Resolve" on an open blocker, and an SSE replace-by-id so a resolve propagates live. Model: **Sonnet**.

**D · Export gate.** `export-readiness.ts` + `ExportReadinessSummary.tsx` — an unresolved blocker comment becomes a high-severity client-ready export blocker with honest copy, rendered in oxblood. So a raised blocker "directly blocks export." Model: **Sonnet**.

## Boundary / constraints

- **Apply the existing grammar.** Reuse the attribution helpers, `moss-pulse`, oxblood/forest tokens, the record voice. No new colours (SLOP-CHECK).
- **Honesty holds.** Markers derive from real server counts; in mock/pre-Stage-6 they're absent and nothing renders. No fabricated presence, no fake "viewing now", no per-requirement *assignment/ownership* marker — the backend has no assignment model, and the plan puts `Assign requirement` behind "explicit assignment is part of the workflow." Deferred honestly.
- **Blockers are still, not celebratory.** New activity/comments may moss-pulse once; blocker/error/permission states stay plain and close to the control.
- **ShareControl invite-lifecycle edge states (pending/expired) deferred** — the backend models share-success/error but not an invite lifecycle; simulating pending/expired would imply data we don't have. Noted, not faked.

## Sequencing & verification

Backend first (verified locally). Then A/B/C/D on disjoint files (ComplianceMatrix; AnswerCard+RequirementPanel; CommentThread; export-readiness+ExportReadinessSummary) via four Sonnet subagents, integrated + verified by the lead. `npm run build` + `npm run lint` green; live-backend + headless-browser check (a blocker comment marks the row, gates client-ready export, and clears on resolve); trunk to `main` over the codemap bot.

## Changelog

- 2026-07-11 — **Stage 6 shipped (backend + A/B/C/D).** Additive backend: `Requirement.comment_count`/`open_blocker_count` stamped at read time, `is_blocker`/`resolved_at` on comments, `POST /comments/{id}/resolve`. Frontend: shared `CollaborationMarkers` on matrix rows (A), answer cards + panel zone title (B); raise/resolve blocker comments in the thread with SSE replace-by-id (C); an unresolved blocker comment gates client-ready export (D). Built by four Sonnet subagents on disjoint files over the additive backend, integrated + verified by the lead. **Verified live end-to-end** (seeded backend + authed headless browser): a requirement with a blocker comment shows "● Blocked · 🗨 2 comments" on the matrix row and answer card, the export readiness shows the blocker-comment gate, and resolving the comment clears the row marker AND the export gate while the comment count stays. Build + lint green. Per-requirement assignment/ownership and invite-lifecycle edge states deferred honestly (no backend model).
- 2026-07-10 — plan drafted; Step-0 audit folded in (Stage 6 mostly built: ShareControl, ActivityFeed, comments, Owner/Member, attribution grammar). Real work: comment-presence markers in the workspace (the Stage 3 deferral) + blocker-comment treatment with an export gate, on a small additive backend change. Per-requirement assignment and invite-lifecycle edge states deferred honestly (no backend model to back them).
