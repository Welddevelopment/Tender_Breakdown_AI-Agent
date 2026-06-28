# Standup — Day 1 (2026-06-28)

> Run by J. 10 minutes, standing. Format each day: **done / doing / blocked / Day-4 gate on track?**
> Newest standup at the top of this file as days go. For *current* state any time, read [STATUS.md](STATUS.md).

## Decisions locked today

- **Name: Bidframe.** ✅
- **Niche: UK public-sector, SME bidders + small bid consultancies.** ✅ (per `positioning-and-traction.md`; supersedes the construction-vs-public-sector placeholder — treat as settled, don't reopen.)
- **Schema: locked** (AGENTS.md data contract). Any change = branch + PR + team sign-off.
- **Raw-extraction format (backend→generalist): PROPOSED v1** at `prompts/raw-extraction-format.md`. **Need backend + generalist to sign off today.**
- **LLM provider: deferred** — cheapest-and-best, evaluate Day 2+. Prompts are provider-agnostic.
- **Fetch.ai stack: deferred to Day 3.**

## 🟠 Needs a team decision today — autofill scope

J + product call: extend Bidframe from compliance/extraction into **end-to-end bid drafting**, framed as
**"auditable autofill"** (grounded answers per requirement + a short gap-question interview). Full write-up:
[autofill-scope-decision.md](autofill-scope-decision.md). Prompts drafted (`prompts/answer-generation.md`,
`prompts/gap-interview.md`). **Decide as a team:** (1) are we in? (2) it changes the locked schema →
who owns the schema PR? (3) confirm it ships only *after* the extraction Day-4 gate is green — extraction
stays the spine. Ratify or push back before anyone builds against it.

## The Day-1 finish line (master plan §7)

1. **Schema + raw-extraction format locked** — schema done; raw format needs 2 sign-offs.
2. **Sourcing sprint** — all four grab a few real UK public-sector tenders (Contracts Finder / Find a Tender, full-pack-attached). Target 10–15 between us in an hour. **Confirm ONE downloads + parses cleanly in hour one** (backend tests it through PyMuPDF).
3. **Gold-set labelling started** — each person hand-labels ONE tender end-to-end by EOD Day 2.

## Per-role Day-1 asks

| Role | Day-1 deliverable |
|------|-------------------|
| **Backend** | PyMuPDF spike: one real tender → text + accurate page numbers; show where it breaks (tables/multi-column). FastAPI skeleton + mock `/requirements`. Sign off raw-extraction format. |
| **Generalist** | Sign off raw-extraction format. Start reconcile/dedupe vs `prompts/mock-raw-extraction.json`. Pick a tender to label. |
| **Frontend** | Compliance matrix over mock requirements: gating rows stand out, `needs_review` looks uncertain, confidence as bar/dot (never a number). Mock-first — not blocked by anyone. |
| **J** | ✅ name, raw-extraction spec+mock, v1 prompts. Next: sourcing share + label one tender; start narrative notes. |

## Blocked / watch

- Backend + generalist both need to **eyeball the raw-extraction format today** so it locks — that's the one thing gating their parallel work.
- **Hour-one risk:** confirm a full tender pack actually downloads + parses. If the first one is image-only/OCR-needed, grab another — flag in STATUS.

## Day-4 gate reminder

End of Day 4 = end-to-end on a **fresh** tender. If it's not working by then, Day 5 **cuts scope, doesn't add**. Keep that bar visible all week.

## Today's focus list (from the Day-1 progress check)

**The two cross-team blockers — clear these first:**
1. **Backend + generalist: sign off the raw-extraction format** (`prompts/raw-extraction-format.md`) → unblocks generalist's whole day. Reply on your comms board.
2. ✅ **DONE — a real tender downloads + parses cleanly** (SPSO cleaning ITT, 13pp clean via `parse_check.py`). Biggest silent risk retired. Now: grab a few more for the gold set + ugly-tender tests (`tenders.md`, direct-download links).

**Per role, what's missing for Day 1:**
- **Backend** 🟡 (long pole): PyMuPDF spike → text+page numbers on a real tender; make `GET /requirements` return sample objects (unblocks frontend); one extraction call via `prompts/extraction.md`.
- **Generalist** 🔴 (nothing pushed): reconcile/dedupe vs `prompts/mock-raw-extraction.json` (merge the seeded ISO-9001 dupe); pick a tender to label.
- **Frontend** 🟢 (~done): source panel (click → excerpt+page) next; mirror new schema fields into `types/requirement.ts`.
- **J** 🟢: sourcing share + label one tender; narrative/sourcing/outreach/prior-art/Fetch-scope all drafted ✅.

## Round-the-table (fill in live)

- **Backend:** done … / doing … / blocked …
- **Generalist:** done … / doing … / blocked …
- **Frontend:** done … / doing … / blocked …
- **J:** done: name + prompts + raw-extraction contract / doing: sourcing + narrative / blocked: none
