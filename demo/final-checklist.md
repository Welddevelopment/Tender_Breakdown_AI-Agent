# Final Checklist — Demo Day

> 🚨 **FIRST ITEM: confirm the date.** Every official source (Luma, DoraHacks end-time,
> aiagentslab.uk) says Demo Day = **SAT 4 JUL — TODAY**, Bidframe slot **3:55pm, last of the day**.
> Internal notes said Sun 5 Jul. One person asks in the event Discord NOW. If today, everything below
> ("Saturday" + "night before") happens THIS MORNING, in the order listed.
>
> Extends Pranav's [`demo-day/pre-show-checklist.md`](../demo-day/pre-show-checklist.md) (now
> Bradwell-reconciled — read it too). This is the exact-commands version.

## Saturday morning — decisions + fixes (do in this order)

- [ ] **Joel decides: commit the Bradwell PDF.** Without it, `/demo`'s "See a deal-breaker in the
      document" proof button does not render (verified in code — G-040). The mapping is already in
      `frontend/src/lib/api.ts`; the one command:
      ```bash
      cp data/tenders/bradwell-grounds-itt.pdf frontend/public/demo/
      git add frontend/public/demo/bradwell-grounds-itt.pdf && git commit -m "demo: ship Bradwell PDF for the /demo proof overlay" && git push
      ```
      (Repo rule says never commit tender PDFs; the SPSO copy in `frontend/public/demo/` is the
      accepted precedent — hence Joel's call, 30 seconds.)
- [ ] **Jawad: fix the scrolly's SPSO narration** — `frontend/src/components/demo/sample.ts`
      `DEMO_FACTS` still says "SPSO Cleaning Services ITT" / 13pp / 183 reqs / 9 deal-breakers, right
      above the Bradwell worked example (34pp / 50 / 12). Re-flavor or genericize (G-040).
- [ ] **Jawad (lower priority): landing `ProofNumbers.tsx:28`** also still reads "SPSO Cleaning
      Services ITT · 13 pages · 183 lines extracted" — true SPSO data, but judges who scan the QR land
      there right after watching a Bradwell demo. Genericize or add "e.g." framing if time allows.
- [ ] **Bobby: rehearse the 12-vs-10 line** (deck shows 12 deal-breakers, appendix says 10/10
      held-out) — the reconciliation answer is in `demo/q-and-a-battlecard.md` top section. It's the
      one piece of visible on-stage arithmetic a sharp judge will poke.
- [ ] **Jawad: J-081 smoke-test, amended** — on `/demo` + `/pitch` after pulling: (1) deal-breakers on
      top, (2) the **proof button** opens the PDF at the highlighted line (after the PDF lands),
      (3) the deck's stop-sign card shows the insurance gate, (4) `/pitch` Demo-reliability slide now
      says Bradwell (fixed tonight). Note: rows on `/demo` are read-only by design — the old "click the
      insurance row" instruction was never possible there.
- [ ] **All four: read your updated cue card once, aloud** — `demo-day/cue-cards/` (Bobby's numbers
      changed the most: held-out 10/10 + 12/12 deterministic now lead).
- [ ] **Team: agree slide-3 owner** (storyboard says Joel, slide notes say Pranav).
- [ ] **Record the backup video** off the current `/pitch` + `/demo` (post-fixes), full run, playable
      offline from the demo laptop.

## Night before

- [ ] `git pull` on the demo laptop; `cd frontend && npm install && npm run dev` — confirm
      `http://localhost:3000/pitch` and `/demo` run **offline** (tier-2 fallback).
- [ ] Confirm the live Vercel URLs load `/pitch` + `/demo` with Bradwell (title: "Grounds Maintenance
      Tender – Bradwell Common & Heelands").
- [ ] PDFs on the laptop: `bradwell-grounds-itt.pdf` (34pp, the stage tender) + SPSO + NHS spares.
- [ ] Laptop charged; charger + HDMI/USB-C adapters packed; phone hotspot tested.

## 30 minutes before

- [ ] Open tabs in order (Jawad): `/pitch` (slide 1) · `/demo` (scrolled to the worked example) ·
      `/review` only if the approve-click is rehearsed.
- [ ] Browser zoom readable from the back of the room; notifications muted (Slack/mail/calendar/OS).
- [ ] One full dry run with handoffs, on the stage laptop + stage network. Time it.
- [ ] Confirm cut order aloud: ask → honesty-flag second sentence → 5-min interlude; NEVER the catch or
      click-to-source.
- [ ] If (and only if) a live-key run is planned: test the exact upload on the actual venue network,
      or demote to prebake now, out loud.

## 5 minutes before

- [ ] `/pitch` on slide 1, fullscreen, cursor parked off-screen (auto-hides).
- [ ] Positions: Joel — P — Bobby — Jawad (keyboard side). Joel keeps time.
- [ ] Phones silent. Water for whoever opens.

## Speaker responsibilities (one line each)

| Person | Owns on stage | Never says |
|---|---|---|
| **Joel** | open · close · thesis-bridge · ask · business Q&A | "customers" (say pilots/outreach) |
| **P** | the read/pipeline beat · engineering Q&A · recovery lines | "the model is running live" (it isn't) |
| **Bobby** | every number, exactly per `demo-claim-ledger.md` §B · eval Q&A | any headline recall/precision % |
| **Jawad** | all clicks · product/design beats · UX Q&A | improvised navigation (no `/answers` on stage) |

## Emergency ladder (short form — full: `demo/run-of-show.md`)

Hosted static prebake → local `npm run dev` → second laptop → recorded video → screenshots + narration.
Recovery line: "When we're not sure, we say so — here's the same beat from the cached run."

## Final 30-minute rehearsal checklist

- [ ] One timed 3-minute deck run (target ≤ 2:50 to leave breathing room).
- [ ] One timed 90-second product run off `/demo`.
- [ ] Bobby speaks the §B numbers once, cold, no notes: 12/12 deterministic · Bradwell 10/10 held-out ·
      Duffield 0 missed · 101/101 **synthetic** · 42/42 citations, 0 bluffs · "we don't headline
      broader recall".
- [ ] Joel speaks the thesis-bridge once, near-verbatim (don't drop "we capture them").
- [ ] Handoff lines rehearsed: "P, drop it in." / "And here's the bit that matters most." / "Don't take
      our word for it." / "And where we're genuinely not sure — we say so." / "It drafts your response
      too." / "Three weeks down to minutes — the human approved every step."
- [ ] Decide NOW whether the 5-minute interlude is in or out based on the actual slot length.
