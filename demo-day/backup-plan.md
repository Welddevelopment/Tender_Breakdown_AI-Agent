# Backup Plan

Hackathon wifi and free-tier hosting both fail in predictable ways. Decide these responses *before* you're
on stage — the goal is nobody has to improvise a recovery in front of judges.

## Tiered fallback (pick the deepest tier that still works)

1. **Best: hosted site, pre-baked data.** The default plan — **`/demo`** served from the deployed
   frontend with the **Bradwell prebake baked into the build** (J-081): no backend, no API key, no
   network dependency beyond loading the page once. Strictly more robust than the old API-cached plan.
   This is what the [run-sheet.md](run-sheet.md) assumes.
2. **Good: hosted site, real key, live call.** Only if the `OPENAI_API_KEY` is confirmed live on Render
   *and* the team has explicitly tested it that day. Slower (real extraction takes longer than a cached
   response) — warn the room: "this is running the real model live, give it a few seconds."
3. **OK: local instance.** Run `frontend` (`npm run dev`) + `backend` (`uvicorn app.main:app --reload`)
   on the demo laptop against `localhost`, pre-loaded with the same pre-baked tender. Immune to venue wifi
   entirely. Needs the laptop to have both repos set up and dependencies installed *before* the day — test
   this the night before, not as a live improvisation.
4. **Fallback: recorded video.** A screen recording of the full run-sheet (ideally narrated by the actual
   four voices, or silent with live narration overlaid) queued up and ready to play full-screen, offline,
   from the demo laptop. This is the "the projector died, the wifi died, the laptop nearly died" option —
   you can still narrate over it live.
5. **Last resort: screenshots + the story.** A handful of static screenshots (gating banner, source panel,
   answer + citation, gap list) plus Joel narrating the run-sheet beats from memory. Worse than the video,
   better than nothing — keep a few key screenshots saved locally regardless of which tier you expect to use.

## Specific failure → specific response

| If this happens | Do this |
|---|---|
| Render is asleep / cold (upload hangs 30–50s) | Narrate through it once ("first request wakes the free-tier server, give it a moment") — don't panic-refresh. If it's still hanging past ~60s, switch to tier 3 (local) or tier 4 (video). |
| Venue wifi is congested / drops | Switch to phone hotspot immediately if pre-arranged, otherwise tier 3 (local) if the laptop has everything installed, otherwise tier 4 (video). |
| `OPENAI_API_KEY` turns out not to be live after all | Do **not** demo on the heuristic extractor (gating recall 0.0 — this would actively undercut the gating-catch claim). Use tier 1 (pre-baked) or drop to tier 4 (video) for that beat only, then resume live for the UI-only beats (source panel, design) which don't need a live model call. |
| A judge's own tender is offered for live upload | Only accept on tier 2 (confirmed live key, tested that day). Otherwise: "we run from a fixed pre-baked tender on stage for reliability — happy to run yours live afterwards on [whoever's machine has the key]." Frame this as a deliberate reliability choice (it is one — `demo-narrative.md` says so explicitly), not an excuse. Note the stage tender (Bradwell) is itself a **held-out** tender the pipeline had never seen — say that; it answers the real question behind the request. |
| A judge's PDF is scanned / malformed and chokes the pipeline | This is itself a legitimate answer, not just a failure: P explains the graceful-failure path (422 with a human-readable message, OCR flagging) rather than pretending it would have worked. Turning a near-failure into "here's how we handle exactly this" is a stronger answer than a clean run. |
| Someone's beat runs long and the demo is short on time | See "If a beat runs long" in [run-sheet.md](run-sheet.md) — cut order is pre-agreed, not negotiated live. |
| The presenting laptop itself fails | Whoever has the second-most-rehearsed laptop (ideally Jawad's, since they're the driver) takes over; tier 4 (video) on a phone/tablet is the absolute last resort if no second laptop is available. |

## P's recovery lines

Use these if the failure happens during the backend-owned upload/matrix beat:

- **Cold Render:** "This is the free-tier backend waking up, not the model thinking. We warmed it before
  the pitch, but if it takes more than a minute we'll switch to the cached run and keep the story moving."
- **Heuristic fallback appears:** "We are not going to demo the heuristic as if it is the real extractor.
  The heuristic proves plumbing only; the measured disqualifier claim comes from the OpenAI/pre-baked path."
- **Bad PDF:** "The honest output for a malformed or scanned PDF is a clean failure or an OCR warning, not
  a pretend matrix. That is deliberate: the product flags uncertainty instead of hiding it."
- **Judge asks for live upload:** "Happy to run yours after the pitch if the live key is available. On
  stage we are using the fixed tender so the judges see the measured run, not network luck."

## Owning the honest framing

If anything visibly goes wrong, the single best recovery line draws on the product's own positioning —
**honesty is the brand** (see `demo-narrative.md`'s guardrails). Something like:

> "This is actually a good demonstration of the thing we built — when we're not sure of something, we say
> so instead of pretending. Let me show you the same beat from a [pre-baked / recorded] run so you can see
> exactly what it produces."

That reframes a technical hiccup as on-message rather than off-message.
