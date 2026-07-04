# Demo Day Kit

> Live-demo materials for the Conduct "Make Legacy Move" hackathon presentation.
> 🚨 **Demo Day = SAT 4 JUL per every official source** (Luma "4 July — Demo Day", DoraHacks end-time,
> aiagentslab.uk), **Bidframe slot 3:55pm — last of the day** per the running-order sheet. Team notes
> said Sun 5 Jul — **confirm in the event Discord immediately** (see `demo/judge-research.md`).
> **Updated 2026-07-04:** reconciled to **J-081** — the on-stage tender is now the **Bradwell** grounds
> prebake (34pp, 12 deal-breakers) on `/demo` + `/pitch`, key-independent. SPSO stays as the revert path.
> This folder turns the locked [`demo-narrative.md`](../demo-narrative.md) (the 90-second solo script,
> the honest numbers, the positioning guardrails) into a **4-person tag-team run** with per-person scripts,
> screen-by-screen visual cues, a pre-show checklist and a backup plan.

**Do not change the beats or the numbers here without the same team sign-off `demo-narrative.md` requires.**
This folder only adds *who says it and what's on screen* — the spine stays the one in `demo-narrative.md`.

## The team (confirmed from `comms/board-*.md` + git history)

| Person | Lane | Owns | Cue card |
|---|---|---|---|
| **Joel** | J | prompts · orchestration · narrative · traction · glue | [cue-cards/joel-j.md](cue-cards/joel-j.md) |
| **P** | Backend | ingest · chunk · extract · classify · graph · REST API | [cue-cards/p-backend.md](cue-cards/p-backend.md) |
| **Bobby** | Generalist | reconcile/dedupe · confidence routing · eval harness · answer-draft | [cue-cards/bobby-generalist.md](cue-cards/bobby-generalist.md) |
| **Jawad** | Frontend | compliance matrix · source panel · decision controls · graph view | [cue-cards/jawad-frontend.md](cue-cards/jawad-frontend.md) |

## What's in here

- **[run-sheet.md](run-sheet.md)** — the master timeline: every beat, who speaks, what's on screen, the
  exact visual cue to point at, and timing. Print this for whoever's timekeeping.
- **[cue-cards/](cue-cards/)** — one pocket-sized script per person: your lines, your handoff cue, what
  to point at, and a pointer to your Q&A questions.
- **[pre-show-checklist.md](pre-show-checklist.md)** — T-minus checklist (night before / 30 min before /
  on stage), including the two **open risks** the comms boards flag (OpenAI key + the J-020 pre-bake).
- **[backup-plan.md](backup-plan.md)** — what to do live if Render is asleep, the wifi dies, a judge's
  PDF chokes, or the key still isn't live by the 4th.
- **[qa-prep.md](qa-prep.md)** — anticipated judge questions, routed to whoever actually owns the answer.

## The shape of the run (default assumption — adjust if your slot differs)

~2 min 30s scripted + Q&A buffer, one laptop/screen, mic passed hand-to-hand:

```
0:00 ── OPEN (Joel)                       the one-liner + the cost of missing a disqualifier
0:15 ── UPLOAD → MATRIX (P)               drag the tender in, watch it populate
0:35 ── THE CATCH (Bobby)                 the oxblood deal-breaker banner + the locked numbers
0:55 ── CLICK-TO-SOURCE (Jawad)           row → source panel, exact clause, one click
1:15 ── THE FLAG (Bobby)                  amber needs_review, honesty as the brand
1:35 ── AUTOFILL + GAPS (Jawad + Bobby)   drafted answers with evidence, the question list
2:05 ── CLOSE + THESIS-BRIDGE (Joel)      before/after, Conduct framing, the ask
```

Full detail, exact lines and screen states: [run-sheet.md](run-sheet.md).

## Before you treat this as final

1. Confirm the **live URLs** (Vercel frontend, Render API) are current — they aren't hardcoded here on
   purpose because they've moved before (see `comms/board-frontend.md`, `backend/DEPLOY.md`).
2. Confirm **J-020 (the pre-bake)** and the **OpenAI key on Render** are resolved — as of the last
   `STATUS.md` update (2026-06-30, Day 3) both were still open. The whole run-sheet assumes the
   **pre-baked path** (per `demo-narrative.md`'s "key resilience" note) unless those are confirmed green.
3. Rehearse the handoffs out loud at least twice — the tag-team handoff lines are the part most likely to
   wobble live, not the product.

## Demo mode

The folder now assumes a deliberate mode choice, not a vague "try it live" hope:

| Mode | Use this when | Default? |
|---|---|---|
| **A. Pre-baked real run** | Real LLM output has been generated once and served/cached for stage reliability. | Yes |
| **B. Live-key run** | `OPENAI_API_KEY` is live on Render and tested on the demo tender that day. | Stretch |
| **C. Recorded fallback** | Neither A nor B is confirmed, or the venue setup is shaky. | Backup |

P owns the backend health check and the honest wording for A vs B. Bobby owns the measured numbers. Jawad
owns the screen state. Joel owns the final call on which mode the team presents.
