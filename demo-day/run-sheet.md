# Run Sheet — Bidframe Live Demo

> Master timeline. One person times it (suggest Joel, since he opens and closes). Beats and honest
> numbers are locked in [`demo-narrative.md`](../demo-narrative.md) — this just maps them to people and
> screens. Target: **~2:30 scripted**, leaving Q&A room in a typical hackathon slot.

**Default path: pre-baked demo data** (per `demo-narrative.md`'s key-resilience note — no standing OpenAI
key on the public Render instance). If J-020 + the Render key are confirmed live by demo day, the
"judges upload their own tender" variant in [backup-plan.md](backup-plan.md) becomes the stretch option,
not the default.

**Backend honesty rule:** on the pre-baked path, do not say "the model is running live" or imply the stage
upload is spending a fresh API call. Say the cached output was produced by the same ingest → chunk →
extract → reconcile → autofill pipeline, then show the result. If the Render key is live and tested,
P can switch to the live-call wording in the upload beat.

**Driver (at the keyboard):** Jawad — it's the app he built and deployed; one driver avoids fumbled
laptop handoffs. Everyone else speaks from beside the screen and points.

---

## Beat-by-beat

### 0:00–0:15 — OPEN — **Joel**
**Screen:** `/` (the landing page, civic-record hero), or stand in front of a closed laptop / title slide.
**Visual cue:** none yet — all eyes on the speaker, not the screen.
**Says:**
> "A bid manager spends about three weeks reading a tender like this by hand. Miss one mandatory
> requirement, and the whole bid is thrown out — weeks of work, gone. Bidframe turns that into a
> verified, source-linked checklist in minutes."

**Handoff:** "P, drop it in." → P steps to the keyboard side, Jawad navigates to `/review` (or `/upload`).

---

### 0:15–0:35 — UPLOAD → MATRIX POPULATES — **P**
**Screen:** `/review` (or `/upload` → auto-redirects into the matrix). Driver: Jawad performs the drag-drop
on P's cue.
**Visual cue:** the upload dropzone, then the matrix rows filling in. Point at the row count ticking up.
**Says:**
> "We drop in a real public-sector tender — the Bradwell Common & Heelands grounds-maintenance ITT,
> 34 pages. For stage reliability this is the pre-baked run from our real backend pipeline: PDF ingest,
> chunking, extraction, classification, reconcile, and API response. The important bit is the shape of
> the output: every requirement pulled out, scored, and sitting in the matrix — including twelve
> deal-breakers, sitting right at the top."

**If the Render key is live and tested that day, P can use the live-call variant instead:**
> "This is running live now: ingest, chunk, extract, classify, reconcile, then return the API response.
> It takes a few seconds because it is reading the PDF, not replaying a slide."

> ✅ **Hero tender resolved (J-081, 2026-07-04):** the on-stage tender is now **Bradwell** (grounds
> maintenance, 34pp, 12 deal-breakers) served from `frontend/src/data/bradwell-prebake.json` on `/demo`
> + `/pitch` — Joel's call; SPSO's on-screen deal-breakers were weak (same deadline repeated 3×).
> The SPSO fixture is untouched in the repo, so revert = two import lines if anything looks off.

**Handoff:** "And here's the bit that matters most." → hands to Bobby, who's already positioned at the
gating banner.

---

### 0:35–0:55 — THE CATCH (hero moment) — **Bobby**
**Screen:** the **gating "deal-breaker" hero banner** (oxblood, 2px reading edge, glossy oxblood
confidence dots — `GatingHero.tsx`). On Bradwell the wall of gates is dramatic and varied: insurance
£5m/£10m, "automatically disqualified", collusion, no-variant-bids, and a buried pricing-statement
landmine on **p31**.
**Visual cue:** point directly at the red/oxblood banner. Don't let the room's eyes wander.
**Says:**
> "This one's a pass/fail gate. Miss it, you're disqualified — and it's the first thing you see, not
> buried on page 31. Twelve of these on this tender alone. And here's the part that matters: this tender
> was our **held-out test** — the pipeline had never seen it, and it caught **all ten** hand-labelled
> deal-breakers, on top of **12/12 deterministically** on our gold tenders. That's not a vibe, it's a
> number from our own eval harness, including an adversarial test suite built to break exactly that claim."

> *(Numbers per `demo-claim-ledger.md` §B — say them exactly; if pushed on overall accuracy, use the
> ledger's safe wording, never a headline recall %.)*

**Handoff:** "Don't take our word for it." → Jawad clicks the gating row.

---

### 0:55–1:15 — CLICK-TO-SOURCE (trust) — **Jawad**
**Screen:** click the flagged row → the source/requirement drawer slides over (`RequirementDrawer.tsx` /
`RequirementPanel.tsx`), showing `source_excerpt` + `source_page` + the mono "register" clause reference.
**Visual cue:** point at the highlighted clause text and the page number in the mono margin.
**Says:**
> "One click, and you see the exact sentence, on the exact page, it came from. Every line in this matrix
> is checkable — we're not asking you to trust a black box."

**Handoff:** "And where we're genuinely not sure — we say so." → scroll to an amber `needs_review` row.

---

### 1:15–1:35 — THE FLAG (honesty) — **Bobby**
**Screen:** an amber/lower-confidence row — point at the **confidence bead** (`ConfidenceIndicator.tsx`,
greyscale-safe fill, oxblood-to-confident scale) and the `needs_review` state. On Bradwell, two of the
twelve deal-breakers are deliberately lower-confidence `needs_review` rows (J-081) — point at one of
those: "even among the deal-breakers, when it's less sure, it says so."
**Visual cue:** the dimmer/duller confidence bead next to a clearly-marked uncertain row.
**Says:**
> "Where we're not confident, we flag it instead of guessing. That threshold is calibrated against real
> hand-labelled tenders, not a guess — it's the same honesty that drives the gating catch. The flag isn't
> a weakness we're hiding, it's the proof we're not bluffing."

**Handoff:** "And it doesn't stop at reading — it drafts your response too." → Jawad navigates to `/answers`.

---

### 1:35–2:05 — AUTOFILL + THE GAP INTERVIEW — **Jawad drives, Bobby narrates**
**Screen:** stay inside `/demo` (the Bradwell prebake carries both beats — J-081): click the
**insurance row** → the flagship **evidence-backed drafted answer** shows (citation: filename · page ·
verbatim excerpt from the bidder's capability doc); then the **references row** → the **open question**
shows (the honesty beat: it asks instead of guessing). Note (verified in code): `/demo` is **read-only**
and `/answers` is auth-gated on the **mock/live** tender, NOT Bradwell — so if you want to show a live
**approve click** (the "human in control" beat), do it on `/review`'s tender after the Bradwell
walkthrough, or let the deck's Product slide carry it. Don't improvise this live.
**Visual cue:** point at the citation chip on the drafted answer first, then the open question.
**Jawad says (driving, brief):**
> "Approve a requirement, and it drafts an answer straight from the bidder's own capability documents —
> every claim links back to the evidence behind it."

**Bobby says (the trust number):**
> "And it never bluffs. We built a groundedness check specifically to catch fabricated citations — on
> our full eval run, 42 out of 42 citations verified, zero bluffs. Where it genuinely can't answer from
> your documents, it doesn't guess — it asks. A handful of questions, not a blank page."

> *(Attribution note: the 42/42 was measured on the SPSO eval run, not Bradwell — "our full eval run" is
> the honest wording on stage. The detector was also tested against a planted fake citation.)*

**Handoff:** "Three weeks down to minutes — with the human approving every step." → back to Joel.

---

### 2:05–2:30 — CLOSE + CONDUCT THESIS-BRIDGE + THE ASK — **Joel**
**Screen:** wherever's calmest to look at — the matrix at rest, or back to `/`. Eyes should be on Joel now.
**Says (before/after, compressed):**
> "Three weeks of expert reading and a disqualifier risk — down to minutes, every line verifiable, a
> drafted response waiting. The human approved every step."

**Says (thesis-bridge — verbatim from `demo-narrative.md`, don't paraphrase this part):**
> "Conduct captures the context of an expert's decisions so legacy knowledge moves with the work. Bidframe
> does exactly that for the bid manager. Every tender forces dozens of judgment calls — is this really
> mandatory, do we meet it, how do we interpret this clause — and today those decisions evaporate the
> moment the bid is sent. We capture them. Each approve, edit, flag, each answer to a gap question, each
> piece of evidence linked to a requirement becomes reusable context that compounds across every future
> bid. We're not replacing the expert — we're moving their decisions out of their head and into something
> the next bid, and the next teammate, inherits."

**Says (the ask, optional if time allows):**
> "We've already built the outreach pipeline to take this to real SME bidders — care, cleaning, security,
> IT, training — and we're starting those conversations now. Happy to take questions."

---

## If a beat runs long

Cut from the back first: drop the "ask" line before cutting the thesis-bridge, and drop the autofill beat's
second sentence before cutting the click-to-source beat. **Never cut the gating catch (0:35–0:55) or the
click-to-source (0:55–1:15)** — `demo-narrative.md` calls these the two moments that must land.

## Speaker positions

Stand in beat order, left to right, facing the screen at an angle so you're not blocking it: **Joel — P —
Bobby — Jawad** (Jawad nearest the keyboard). Step forward half a pace when it's your beat; step back when
you hand off. Keeps the judges' eyes tracking who's talking without anyone needing to reshuffle mid-demo.
