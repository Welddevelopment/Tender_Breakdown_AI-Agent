# Stage 4 Plan — Pilot Reliability & Trust (fonts, bundle, token)

Owner: Jawad · Drafted 2026-07-08, immediately after Stage 3 shipped (`b1a6a58`).
Reads with: `pilot-roadmap/frontend-jawad.md` (this is its Part A + B1, verbatim scope),
`pilot-roadmap/stage-3-plan.md` (what just shipped).

Stage 3 delivered the feel (the in-place resolve, forest arrival, device-kit trueing,
/graph polish). Stage 4 is the other half of the lane brief: the reliability and trust
items that gate a pilot deploy. No visual redesign in this stage.

## Workstream A — Self-host the fonts (P0, deploy risk)

**Current state:** `src/app/layout.tsx:12-31` loads Fraunces (500/600/700), Newsreader
(400) and IBM Plex Mono (400/500) via `next/font/google` — a remote fetch that can hang
a production build when the Google CDN is unreachable in CI. Chillax is already local
woff2 under `src/fonts/` via `next/font/local` (`layout.tsx:34-42`) — the exact pattern
to copy.

**Tasks:** download the latin woff2 instances for exactly the weights in use (no
extras), place under `src/fonts/`, swap the three `next/font/google` calls for
`localFont` with the same `variable` names and `display: "swap"`. No CSS or component
changes — the `--font-head/--font-hero/--font-mono-ibm` variables are the contract.

**Done when:** `grep next/font/google src/` returns nothing; build green; glyphs
visually unchanged on `/`, `/review`, `/demo`.

## Workstream B — Auth token out of document URLs (High severity, trust)

**Current state:** `src/lib/api.ts` embeds `?token=<bearer>` in `tenderPdfPageUrl`
(:133-145), `sourceDocUrl` (:161-177), `sourceDocRawFileUrl` (:184-196), and
`tenderEventsUrl` (:557-562). Tokens in query strings land in history, access logs,
and proxies. **The backend already accepts `Authorization: Bearer` on both
`/tenders/{id}/pdf` and `/tenders/{id}/source` (`backend/app/main.py:570-650`)** — the
query param is only the iframe fallback — so this is a frontend-only change; no
contract coordination needed.

**Consumers and their fixes:**
1. `PdfSourceView` loads via pdf.js `getDocument` — pass `httpHeaders` with the bearer
   for live-backend URLs; static `/demo/*.pdf` copies need none. Token comes OFF the URL.
2. Office viewers (`DocxSourceView`/`SheetSourceView`) fetch the raw file — send the
   header on the fetch.
3. The two "open the PDF at this page" links (`SourceVerifyOverlay.openPageHref`,
   `RequirementPanel` source ref) are browser navigations that can't set headers —
   replace with a click handler that opens a window synchronously, fetches the PDF with
   the header, and points the window at a blob URL + `#page=` fragment.
4. **Recorded exception:** `tenderEventsUrl` (SSE) keeps `?token=` — `EventSource`
   cannot set headers. Fixing it needs a backend change (short-lived stream ticket or
   cookie). Raised on the frontend board for Pranav; out of Stage 4 scope.

**Done when:** no *document* URL contains a token (grep `params.set("token"` leaves
only the SSE helper); source preview works for all four formats live; demo/static
paths unchanged.

## Workstream C — Demo data out of the shared bundle (P1, activation)

**Current state:** `src/context/RequirementsContext.tsx` imports
`bradwell-prebake.json` at module top level and seeds `useState` with it, so the demo
tender ships in the RequirementsProvider chunk on every authed route. `review/page.tsx`
also imports it (server-side, route-scoped — acceptable).

**Tasks:** capture the route-size table from `next build` before touching anything
(the baseline the roadmap asks for); then make the mock seed lazy — the provider
starts empty in mock mode and dynamic-imports the prebake in an effect, with a
`seedLoading` flag so gated surfaces (NoTenderLoaded and friends) don't flash a false
empty state; `UploadDropzone`'s mock-replay constants and `UploadWorkspace`'s title
move to the same lazy source. Scope discipline per the lane brief: no cosmetic
refactors, split only what moves the number.

**Risk note:** this touches the live demo's first paint. If the lazy seed causes any
visible flash on `/review` or `/demo` that a loading guard can't hide cleanly, ship A+B
and park C with the baseline numbers — reliability P0s must not wait on a P1.

## Sequencing & models
A (Sonnet agent, mechanical) ∥ B (Fable — trust-critical viewer code) → C (Fable,
riskiest last, behind a fresh baseline). One commit per workstream; build+lint per
commit; push to main per repo trunk rules.

## Verification
- Build + lint green per commit; final full build with route-size table captured
  before/after in this doc's changelog.
- B: two-account privacy check unaffected; PDF/DOCX/XLSX/CSV preview each open live;
  `#page` deep-link still lands; demo static paths untouched.
- C: `/demo`, `/review`, `/graph`, `/answers` render the Bradwell tender with no
  empty-state flash; first-load JS of the main authed routes drops vs baseline.
- Boundary + SLOP gates unchanged (no visual work this stage).

## Changelog
- 2026-07-08 — plan drafted; backend header-auth confirmed at `main.py:570-650`.
- 2026-07-08 — implemented, same day:
  - **A done.** Fraunces (variable, 500–700), Newsreader 400, IBM Plex Mono
    400/500 self-hosted as latin woff2 under `src/fonts/`; `next/font/google`
    fully removed; build no longer touches the Google CDN.
  - **B done.** Document URLs carry no token. pdf.js loads with `httpHeaders`
    (`PdfSourceView.getCachedDocument`), the Office viewers fetch with
    `docRequestHeaders`, and both "Open the page" links became authenticated
    blob-opens (`openAuthedDocument`). Grep check: the only remaining
    `?token=` is `tenderEventsUrl` (SSE — EventSource cannot set headers;
    raised on the frontend board for a backend stream ticket).
  - **C done.** Prebake JSON moved behind `src/data/demo-tender.ts`
    (lazy loader + static title). Shared provider chunk: **80K → 45K** (the
    45K retains only the title string; the 42K payload now loads as its own
    chunk on demand). A `seeding` flag holds MatrixView/StructureView/
    AnswersBody on a calm shell for the load window so no false-empty state
    flashes and the matrix's one-shot entrance isn't burnt against zero rows.
    Tradeoff: the mock /review prerender now ships a shell instead of inline
    matrix HTML (content arrives at hydrate + one small chunk).
