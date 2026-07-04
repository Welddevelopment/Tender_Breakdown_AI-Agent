# 5-minute run-of-show — the 1pm live pitch

> The timed spine that ties it all together. Detailed beats live in `control-demo-script.md` (the control
> moment), `pitch-before-after.md` (the before/after), and `demo-claim-ledger.md` (Q&A numbers). This is
> the clock + the handoffs. Target **5:00**. Split ≈ **3 min deck / 2 min product** but it's one flow.
> Speakers follow the `/pitch` deck assignments; the product is driven on **`/showcase`**.

## The clock

| Time | Who | Where | Beat |
|---|---|---|---|
| **0:00–0:35** | Jawad | Deck s1–2 | **Hook.** "A public-sector tender is 100+ pages of legal text. Hidden in it are pass/fail rules that disqualify a bid outright — miss one after days of work and the whole bid is binned. Finding them by hand takes a bid manager days." |
| **0:35–1:05** | Bobby | Deck s2–3 | **The wedge.** "The work everyone struggles with is the *first read* — before you write a word. That's what Bidframe does: it turns weeks of reading into hours, and keeps the expert in control." |
| **1:05–1:35** | Pranav | Deck → before/after | **Before/after** (`pitch-before-after.md`). Raw tender clause 4.6 (five buried disqualifiers) → *"a human can't see them; Bidframe pulls each one out."* Land on the matrix. |
| **1:35–3:30** | Joel (+Bobby) | **`/showcase`** | **The product — the 2-minute walkthrough.** Deal-breakers first (12, pinned) → click **insurance £5m/£10m** → **source trace** (exact clause + page, one click into the real PDF) → the buried **page-31 pricing landmine** → the **answer beat** (evidence-backed draft with a citation). Then the **control beat** (`control-demo-script.md`): **approve a deal-breaker → the named-confirm** ("it won't let me rubber-stamp a bid-killer") → **answer the open question** ("where it couldn't back an answer, it asked me instead of guessing"). Point at the **ControlPanel** tally: *"every decision captured — I'm at the wheel."* |
| **3:30–4:20** | Bobby | Deck: proof + engineering | **Proof, honestly.** "Deal-breaker catch is engineered, not hoped for — a deterministic net + a model filter; 20/20 adversarial safety tests, held out on unseen tenders. We measure recall and flag what we're unsure of. This is real engineering — a 223-test suite, not a wrapper around a prompt." (Eval appendix ready for Q&A — `demo-claim-ledger.md`.) |
| **4:20–5:00** | Joel | Deck: ask + close | **Close on the thesis + ask.** "The goal isn't to replace the bid manager — it's to make them 10× faster while they stay at the wheel, with every decision captured as context that compounds. That's Bidframe." → the ask (`bidframe.org`, QR). |

## Non-negotiables (rehearse these)
- **Show control, don't narrate it** — the named-confirm and the open-question are the 20% "user in control" criterion made visible. Do them live.
- **Everything is on `/showcase` (frozen Bradwell) — nothing live on stage.** No uploads, no API. PDF-highlight works (Bradwell PDF is served).
- **Hit the before/after** — it's an explicit 20% demo criterion.
- **The 12th deal-breaker line** if asked "why 12 not 10": *"ten hard bid-killers plus two it flagged for a human to check — recall-first, we'd rather over-flag than miss one."*
- **Timing:** if you're over, cut the deck proof slide (3:30–4:20) to one sentence — the live product + control beat are worth more than another slide.

## Fallbacks
- Browser/animation issue → PDF export of the deck + the static before/after split (`pitch-before-after.md`).
- If `/showcase` misbehaves → `/demo` (the guided version) is the backup surface.
- Claim ledger (`demo-claim-ledger.md`) open in a tab for Q&A; two market figures verified before stage.
