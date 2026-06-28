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

## Round-the-table (fill in live)

- **Backend:** done … / doing … / blocked …
- **Generalist:** done … / doing … / blocked …
- **Frontend:** done … / doing … / blocked …
- **J:** done: name + prompts + raw-extraction contract / doing: sourcing + narrative / blocked: none
