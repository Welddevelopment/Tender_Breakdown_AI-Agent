# 15-minute live tender read — call script

The format prospects book from the outreach. Goal: they leave having **seen their own
deal-breakers caught**, and wanting a pilot. You drive; keep it to 15.

## Before every call
- Ask them to **send the tender ~30 min ahead**. Pre-run it through Bidframe (extraction takes a
  few minutes on the current key) so on the call you **present, not process**. No tender? Use the
  pre-loaded SPSO example.
- Have it open: Bidframe running locally with the key (see `go-live-runbook.md`), signed in, the
  tender loaded on `/review`.
- Backups ready: the **`/demo` prebake** (key-independent) + a 90-sec recording — in case anything's slow.

## The 15 minutes
- **0–1 · Frame it.** "I'll spend 15 minutes reading [your tender / a live public-sector one] and show
  you exactly what would disqualify the bid. At the end you tell me if it's useful — no pitch."
- **1–3 · The stakes (fast).** Public tenders bury pass/fail requirements across 100 pages; miss one and
  the whole bid is void. That's the fear you're removing.
- **3–8 · THE READ (the moment).** Open `/review`. Lead with the **deal-breakers block** — "every
  requirement that would disqualify you, surfaced first, each linked to its exact clause." Click one →
  **open it in the document** (the highlighted source): "never take our word for it." Let it land.
- **8–11 · Honesty + answers.** The **confidence flags** — "it tells you when it's unsure; it doesn't
  guess." An **autofill answer with its receipt** — "drafted from your own documents, every claim cites
  the source, nothing invented."
- **11–13 · Their turn.** "Would this have caught things you check by hand? Where would it save you most
  time?" Listen — this is the qualification *and* the testimonial material.
- **13–15 · Close (win either way).** "We're running these as free pilots this week — want to put your
  next live bid through it properly? I'll set you up." If not now: "no problem, I'll send a link; after
  this week it's a paid pilot." Either way: "mind if I quote how it went?"

## If something goes wrong
- **Tender too big / slow (throttle):** you pre-ran it → just present. Never extract a big doc live.
- **Extraction thin/off:** switch to the SPSO prebake — "here it is on a tender we know cold."
- **Anything breaks:** the 90-sec recording + `/demo`. Never debug live — pivot to the canned proof.

## The one rule
**Deal-breakers first, in *their* document, linked to the clause.** That's the whole pitch; everything
else is support.
