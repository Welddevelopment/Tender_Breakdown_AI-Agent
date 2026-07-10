# UI Improvement — Stage 2: Workspace Header And Navigation

Owner: Jawad (frontend) · Drafted 2026-07-10, after UI Stage 1 (foundation + motion tokens) shipped.
Reads with: `frontend/UI/UX/Motion Overhaul/UI-IMPROVEMENT-PLAN.md` (§"Stage 2: Workspace Header And Navigation", §"1. Shared App Shell", §"7. Teams and Collaboration"), `frontend/UI/UX/Motion Overhaul/MOTION.md` (§"App Shell And Workspace Header"), `frontend/{DESIGN-SYSTEM.md,design-language.md,SLOP-CHECK.md}`.

> **Track note:** the *UI Improvement Plan's own* Stage 2 (its Stages 1–6 track), not the product roadmap's Stages 1–7 (complete through 7). "Stage 2" here = **Workspace Header And Navigation**.

## Promise (from the plan)

The user always knows the loaded tender, current view, **team access**, and next useful action — on **any** app route, in five seconds.

## Step 0 — Audit first (done; folded in). Stage 2 is ~40% built.

What already satisfies the spec:

- **Navigation — DONE.** `SectionNav.tsx` reads `Tender · Bid · Matrix · Marks`; the active section is marked by **font weight + a 2px forest underline** (`SectionNav.tsx:41-48`) — legible in greyscale, no colour-only state, no dashboard tab bar. Teams correctly lives in the account control, not the switcher (per Product Assumption 1).
- **Contextual primary action — DONE on `/review`.** `triage.ts:173-209` yields `Review next deal-breaker` / `Answer next gap` / `Review next draft` / `Approve next draft` / `Export`, wired into `DocumentHeader`'s Next button via `MatrixView.tsx:627-640`. No generic "Next" remains on the matrix.
- **Tender identity — DONE everywhere.** `DocumentHeader.tsx:74-97` renders the Bidframe running head, the Fraunces title (never truncated), and the mono reference line (tender id · N source docs · N requirements) on every app route.

**The genuine remaining Stage-2 work:**

1. **Team access is absent from the header, and only exists on `/review`.** `ShareControl` and `ActivityFeed` render in the **`MatrixView` page body** (`MatrixView.tsx:670-677`), so `/answers`, `/graph`, and `/upload` show **no people/access and no activity**. The promise ("team access visible on any route") fails there. This is the core of Stage 2.
2. **No people/access strip in the workspace header title row.** People are only in `ControlPanel`'s body aside (`/review`-only) and inside the `ShareControl` modal.
3. **The header primary action lacks the Stage-1 press affordance.** `DocumentHeader`'s Next button (`DocumentHeader.tsx:110-117`) uses `transition-colors` only — no `.ui-btn` focus ring / press tap that Stage 1A standardised.
4. **Active nav state has no settle motion.** MOTION.md §"App Shell" asks the active nav rule to move in 120–180ms; the underline currently just swaps instantly.

## Boundary / constraints

- **Header, not a dashboard.** No persistent left rail, no stat tiles, no filled tabs (UI-IMPROVEMENT-PLAN §Non-Goals; `SectionNav` design intent).
- **Real data only — no fake presence.** The collaboration cluster self-gates on `isApiEnabled() && tenderId` (the same gate `ShareControl` already uses), so the frozen worked-example, hero embed, and `/demo` (API off) render **unchanged** and nothing implies live presence without a backend (UI-IMPROVEMENT-PLAN §"Do not expose … fake presence").
- **Keep it compact.** The matrix stays the main object; header collaboration is secondary to the loaded tender and current task (MOTION.md §"App Shell": "Keep all header motion secondary").
- **No new colours/tokens.** Reuse `moss` chrome, `collaboratorFor` avatars, `.ui-btn`, `.panel-enter`, `moss-pulse`.
- **`/teams` stays the management surface.** This stage surfaces access *at the point of work*; it does not touch `TeamsManager` or add role pickers (that's Stage 6 / Product Assumption 2).
- **No layout jump.** Header must not reflow when member/activity counts load in (MOTION.md §"App Shell": "Header layout should not jump when counts change").

## Workstreams

**A · Workspace-header collaboration cluster — the core.**
· Current state: `ShareControl` + `ActivityFeed` live in the `/review` body only (gap §1–2).
· Scope: introduce a compact **presence cluster** in `DocumentHeader`'s title-row right zone, shown on every app route when a tender is loaded + API is on:
  - **People / Share:** reuse `<ShareControl/>` — it is already a people-strip (member avatars + count) *and* the Share trigger + modal. Relabel its trigger `Share` → `Share tender` when a tender is loaded (UI-IMPROVEMENT-PLAN §1 "Share becomes Share tender").
  - **Activity:** a new compact `<ActivityControl/>` — a header button reading `Activity` with a quiet count, opening a popover that shows the audit trail (actor · action · object · time). Reuses `ActivityFeed`'s data + moss-pulse logic (extracted to a `useTenderActivity` hook, moved not rewritten), so the tested gate/pulse behaviour is preserved. Esc closes; focus returns to the trigger (`ShareControl`/overlay a11y parity); popover opens with `.panel-enter`.
· Then **remove the now-duplicated `ShareControl` + `ActivityFeed` from the `MatrixView` body** (promoted to chrome — Delete-delete gate). `ControlPanel` (the `/review` decision-log dashboard) stays; it is review data density, not header chrome, and Stage 3 owns the matrix.
· Model: **Sonnet**. Done when: on `/review`, `/answers`, and `/graph` with a live tender, the header shows who has access and lets the user share + read activity without scrolling into the body; API-off embeds render unchanged.

**B · Header interaction + nav motion polish.**
· Scope:
  - Apply `.ui-btn` (Stage-1 focus ring + press tap) to `DocumentHeader`'s primary action button; keep it the single primary action in the row.
  - Give the active `SectionNav` state a 120–180ms settle (`--motion-standard`/`--ease-standard`) on the underline, reduced-motion-safe. **Deliberate non-goal:** no sliding tab rail — a moving rail would turn the middot text switcher into the dashboard nav the component explicitly avoids; the settle is on the active mark's appearance, not a rail slide (same principled restraint as Stage 1C's CommentThread).
  - Ensure the header does not reflow when counts/members load (stable right-zone width; the presence cluster reserves its footprint or self-hides cleanly).
  - Confirm the header cluster gets the one `moss-pulse` on a new activity/member event (via the extracted hook), then rests.
· Model: **Sonnet**. Done when: the primary action presses/focuses like every Stage-1 control; the active nav settles rather than snapping; no header jump on data load; reduced-motion collapses press/settle to instant while the focus ring and active mark remain.

## Sequencing & models

**A** (header collaboration cluster) → **B** (interaction + nav motion). One commit per workstream; `npm run build` + `npm run lint` green per commit; trunk to `main` (rebase over the codemap bot). No backend — reuses `listMembers` / `listTenderActivity` / `shareTender`. **Fable: not needed** — this is application of the existing header/chrome/motion vocabulary, not visual exploration.

## Verification

- Build + lint green per commit; SLOP-CHECK + greyscale on the header.
- **Five-second orientation:** on `/review`, `/answers`, `/graph` with a live tender, a user can name the tender, the current view, who has access, and the next action — without opening the body. Screenshot-verified per route.
- **Greyscale:** active route still legible (weight + underline), presence avatars distinguishable (palette is luminance-separated).
- **API-off parity:** the frozen worked-example / hero embed / `/demo` header is byte-for-byte unchanged (cluster self-gates to null). Screenshot-compared.
- **Keyboard:** open + close the Activity popover and Share modal from the header without losing focus; focus returns to the trigger.
- **Reduced motion:** press/settle become instant; focus ring, active mark, and the moss-pulse's end state remain; no broken transition.
- **No jump:** header does not reflow when members/activity load in.

## Changelog

- 2026-07-10 — plan drafted; Step-0 audit folded in. Nav (labels, greyscale active state) and the `/review` contextual next-action are already built; Stage 2's real work is promoting collaboration (people/access + Share + Activity) from the `/review` body into the shared workspace header so team access is visible on every route, plus header press/nav-settle polish. No backend; no Fable.
