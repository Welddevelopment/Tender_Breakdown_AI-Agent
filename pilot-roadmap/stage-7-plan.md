# Stage 7 Plan — Forest-Led Continuity, Landing, and /demo

Owner: Jawad (public surfaces) · Drafted 2026-07-09, after Stage 6 (Export) shipped.
Reads with: `frontend/landing-page-brief.md` (the landing's single source of truth), `frontend/UI/UX/Motion Overhaul/{UI-IMPROVEMENT-PLAN.md,MOTION.md,delete.md,QA.md}` (Stage 7 spec + gates), `frontend/design-language.md` (forest-led civic record).

## Why this is Stage 7

Stages 1–6 built the **app** (matrix, reliability, answers, export). Stage 7 is the first stage *after* the app overhaul: the **public surfaces** — the landing (`/`) and the guided demo (`/demo`) — and the visual continuity that makes landing → /demo → app read as one Bidframe. This is the "UI improvement / forest-led continuity" track, named in `UX-OVERHAUL-BRIEF.md:660` and `implementation.md:859`. (Note the collision: the *motion* track's own "Stage 6" is Collaboration Presence & Audit — unrelated; this is the product roadmap's Stage 7.)

**Business framing:** the landing has one job — get a bid writer to book a demo — and /demo is the zero-friction "watch it run" for a cold prospect. A prospect who watches /demo then enters the app must recognise the same product. Metric: demo bookings, and no dissonance between what the landing promises and what the app does.

## Step 0 — Audit first (done; folded in). Stage 7 is ~80% already built.

Two read-only audits (spec + current state) confirm the landing and /demo are **mature and largely complete**, so Stage 7 is **continuity + cleanup + a QA gate**, not a build:

- **One-product continuity — mostly present.** `HeroResolve`, `DemoView`'s worked example, and `ScrollyStage` all render the **real** `GatingHero` / `ComplianceMatrix` / `GraphView` / `ApprovalStamp` over the frozen Bradwell tender (`HeroResolve.tsx:8-9`, `DemoView.tsx:154-190`, `ScrollyStage.tsx:4,775,894`). `/showcase` is the live interactive matrix on the same data; `/demo` is the choreographed teaching surface. Grammar matches.
- **Reduced-motion — comprehensive.** Every landing + demo motion layer checks `prefers-reduced-motion` and falls back to composed/static (`ForestHeroLayers`, `HeroResolve`, `ProofScrolly`, `ClosingArrival`, `Reveal`, `DrawOn`, `TrailDescent`, `DemoScrolly`, `DemoTitleCard`, `MountOnView`). No gaps found.
- **Hero resolve** = the one animated moment, from real components, plays once, re-arms on re-entry, static under reduced-motion. Matches `landing-page-brief §6` and `§9`.

**Genuine gaps (the real Stage 7 work):**
1. **CTA sprawl.** The hero carries **three** actions (`Book a demo` · `See a worked example` → /demo · `See a tender pack` → /pack), but the brief §3 specs **two**. The secondary "watch it run" link is worded five ways across surfaces ("See it run" / "See a tender pack" / "See a worked example" / "See the worked example"). `delete.md:28-30,39` (P1) wants this consolidated and aligned.
2. **A copy-check violation on the landing.** `Landing.tsx:50` reads `"1–2 days"` — an en-dash range, banned by `landing-page-brief §4` ("For a number range use 'to'").
3. **QA gate not run** on the public surfaces as a set (greyscale, reduced-motion, responsive) since the Stage 6 changes.

**Recorded but NOT taken this stage (needs human visual review — the brief §17 gates the marketing page on it):**
- `ProductShots.tsx` (the landing feature-band cards `DealBreakerCard`/`ClauseCard`/`AnswerCard`) are **static hand-styled mocks**, not real component compositions. Recomposing them from real app components would tighten "same state grammar," but it materially changes the landing's tuned visual rhythm — a design call for the human reviewer, not a blind swap. Flagged, not done.
- Unifying the two proof surfaces (landing `ProofScrolly` vs demo `DemoProofBand`) — they measure different things on purpose; leave unless the owner wants one.

## Boundary / constraints (hard)

From the Stage 7 charter (`implementation.md:919-924`, `MOTION.md`, brief §9):
- **No new pitch mechanics; do not restyle `/showcase` as a primary surface; do not make `/demo` a prettier fake than the app.**
- **Do not animate proof numbers.** `landing-page-brief §9` and `MOTION.md:334-339` — counts settle or fade, never count up. No confidence percentages anywhere.
- **Copy is held to `copywriting.md` in full** (British spelling, no em dash, no exclamation, no hype, provisional verbs, count facts not scores).
- Forest motion carries arrival/guidance/success; record motion carries proof/approval/audit/export. Reduced-motion stays polished + static.

## Owner decisions (locked with Jawad)

- **Hero CTAs → two (brief-compliant):** keep `Book a demo` (primary) + `See it run` (secondary); **demote `See a tender pack`** out of the hero to a quiet footer/nav link to `/pack`.
- **Canonical secondary wording → `See it run`**, everywhere the "watch the demo" link appears (hero, FAQ, thank-you).

## Workstreams

**A · CTA consolidation + wording** — *the main concrete work.*
· Current state: three hero CTAs; five wordings for the secondary link.
· Scope: hero shows two CTAs; `SeeItRunLink` label → "See it run" (keep its `/demo` destination); align FAQ + thank-you secondary links to "See it run"; move "See a tender pack" to the footer. Keep the two analytics events (`demo_cta_click`, `see_it_run_click`) intact.
· Model: **Sonnet** (copy + small structural moves). Done when: one primary + one secondary per viewport; "See it run" is the single secondary wording across public surfaces; `/pack` still reachable from the footer.

**B · Copy-check fixes** — *rule-bound, objective.*
· Scope: `Landing.tsx:50` `"1–2 days"` → `"1 to 2 days"`; sweep landing/demo/faq/thank-you for any other em-dash, hype word, or exclamation in a visible string and fix.
· Model: **Sonnet/Haiku**. Done when: no banned punctuation or hype in public copy; the copy check passes.

**C · Cross-route QA gate** — *the acceptance gate; verify, don't invent.*
· Scope: screenshot `/` and `/demo` at desktop + mobile (375px), with and without reduced-motion, and greyscale; confirm continuity (same masthead `SiteHeader`, same state grammar), no text overlap, readable product shots. Fix only real breakage found. `npm run build` + `npm run lint` green.
· Model: **Sonnet** + Playwright. Done when: the `landing-page-brief §17` and `QA.md` gates pass on the public surfaces; a prospect recognises the same product landing → /demo → app.

## Sequencing & models

**A** (CTA cleanup) → **B** (copy fixes) → **C** (QA gate over both). One commit per workstream; build + lint green per commit; trunk to `main`. No backend. **Fable:** not needed — the motion/brand work is already built; this stage is cleanup + verification, not visual exploration.

## Verification

- Build + lint green per commit; SLOP-CHECK + greyscale on `/` and `/demo`.
- One primary + one secondary CTA per viewport; "See it run" is the single secondary wording; `/pack` reachable from the footer.
- No banned punctuation/hype in public copy; proof counts remain plain and un-animated.
- Reduced-motion: landing + /demo render polished + static (screenshot-verified).
- Continuity: landing hero, /demo worked example, and app share `SiteHeader` and real component state grammar.

## Changelog

- 2026-07-09 — plan drafted; two Step-0 audits folded in. Landing + /demo are ~80% built (continuity, real state grammar, reduced-motion all solid). Real Stage 7 work is CTA consolidation/wording (owner-decided: two hero CTAs, "See it run" canonical), one copy-check fix, and the cross-route QA gate. `ProductShots` real-component recomposition flagged for human review, not taken. No backend; no Fable.
- 2026-07-09 — **A+B shipped** (`de8ec76`): hero cut to two CTAs (Book a demo + See it run); "See a tender pack" demoted to the footer; "See it run" is now the single secondary wording across hero, FAQ, thank-you, and the hero aria-label; the "1–2 days" en-dash range fixed to "1 to 2 days"; public copy swept clean of dashes/hype/exclamations. **C — QA gate passed** (Playwright): landing verified at desktop + mobile (375px), greyscale, and reduced-motion; two-CTA hero confirmed; /demo renders with consistent wording; build + lint green. **Human-review items left open (per brief §17):** recomposing `ProductShots` from real app components, and any subjective motion-feel tuning — these need the frontend owner's eye, not an autonomous change. Stage 7's concrete, rule-bound scope is complete.
