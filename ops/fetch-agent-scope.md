# Fetch.ai Stack — scoping (decide Day 3)

> Owned by J as a **parallel task**. Per `tracks-decision.md`: Fetch is the **only clean stack**, and we do
> it **only if** the extraction core is solid by ~Day 3 **and** J/generalist have genuine slack. It must
> **never** pull engineers off the Conduct build. This doc pre-scopes it so Day-3 is a fast yes/no, not a research dive.

---

## The idea

Register a **"TenderAnalyzer" agent on Agentverse** that, given a tender (or a chunk / a URL), returns the
extracted requirements with the mandatory/gating ones flagged — discoverable + callable inside **ASI:One**
chat. It reuses our existing extraction engine directly; the only new work is wrapping it in the **uAgents
Chat Protocol** and registering it. **No custom frontend** (the agent replies in chat), so it doesn't fight
the Conduct controlled-UI build — it's a parallel *exposure* of the same engine.

## Why it stacks cleanly (passes the bolt-on test)

Our core already satisfies the track — "agent that does a useful thing, discoverable on Agentverse." We are
not stapling on an unrelated capability for eligibility. The engine is the product; this is a second doorway to it.

## What it would take (the half-day estimate — verify Day 3)

1. A thin **uAgents** wrapper: an agent that implements the **Chat Protocol**, receives a message (tender
   text / a link / "analyse this"), calls our extraction pipeline, returns a formatted requirement summary
   (mandatory + gating flagged).
2. **Register on Agentverse** + make it discoverable to ASI:One; grab the badges.
3. A **short separate demo video** + its own **Devpost submission** (Fetch is judged separately).

## Real costs (don't kid ourselves)

- Separate Devpost entry + its own demo video — **not free**, a real slice of time.
- Needs the extraction engine callable as a clean function (it will be, if backend's API is solid by Day 3).
- **Deadline + "is the demo video really half a day" must be confirmed** before committing.

## Real draw

- The **internship interviews** (matter for J's path).
- A credibility line for the Conduct pitch: "our core also runs as a discoverable Agentverse agent."

## Decision rule (Day 3 checklist — all must be true to proceed)

- [ ] Extraction core is solid + the backend exposes it as a callable function/endpoint.
- [ ] J (and/or generalist) has genuine slack — Conduct build needs no extra hands.
- [ ] Fetch submission deadline confirmed + comfortably makeable.
- [ ] The wrapper + register + video is genuinely ~half a day, not a rabbit hole.

**If any box is unchecked → drop it without a second thought.** Conduct is the £8k primary.

### Changelog
- **2026-06-28 (Day 1)** — pre-scoped by J. Revisit Day 3 against the checklist.
