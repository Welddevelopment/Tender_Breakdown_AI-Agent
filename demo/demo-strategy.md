# Demo Strategy — the winning line for Bidframe

> Synthesis of all four research files + repo ground truth. Companions: `run-of-show.md` (execution),
> `pitch-script.md` (words), `q-and-a-battlecard.md` (defense), `final-checklist.md` (prep).

## 🚨 Act on this first

**Official sources say Demo Day is TODAY, Sat 4 Jul** (Luma, DoraHacks, aiagentslab.uk), with
**Bidframe pitching LAST — 3:55pm** per the running-order sheet. Internal notes said Sunday.
**Confirm in Discord now**; if today, the checklist's "Saturday" and "night before" items collapse
into this morning, in this order: (1) Bradwell PDF decision + push, (2) scrolly/landing SPSO copy fix,
(3) one timed rehearsal, (4) laptop `npm install` + offline fallback test.

## The winning narrative (one paragraph)

Everyone in the Conduct track will say "AI does the work, a human stays in control, it's auditable" —
~10 rivals, all attacking legacy **code**. We are the only team applying it to a **regulated document
process moving £300bn+ of public money**, and — uniquely in the entire field — **we measured ours**:
hand-labelled gold sets, a held-out test the pipeline had never seen (the tender on screen), an
adversarial suite, and a deterministic floor under the one failure that kills bids. The story is not
"we built document AI"; it's **"we built the trust layer that makes AI safe for the one mistake an
SME can't afford — and we can prove it."**

## The demo wedge

**The held-out catch.** One sentence no other team can say: *"This tender on screen was our held-out
test — the pipeline had never seen it, and it caught all ten hand-labelled deal-breakers."* Then the
physical proof: one click → the exact sentence highlighted in the actual 34-page PDF. Code-side rivals
(KEEL, LegacyLift) cannot physically replicate that moment on a document.

## Why this is not "just AI PDF summarization" (say it in claims, not category talk)

1. **Deterministic where it matters** — the deal-breaker floor runs without the model: 12/12 on gold,
   re-runnable, not sampling luck.
2. **Held-out proof** — 10/10 Bradwell + 0 missed on Duffield; a summarizer has no measurable claim.
3. **Two-sided traceability** — every requirement → exact clause+page in the tender; every drafted
   answer → the bidder's own evidence, or it asks (42/42 verified, 0 bluffs).
4. **Decision capture** — approve/edit/flag persists as structured, reusable context (the Conduct
   thesis, instantiated). A summary is disposable; a decision record compounds.

## What to show (priority order)

1. **The oxblood deal-breaker wall** on Bradwell (12 gates: £5m/£10m insurance, "automatically
   disqualified", the p31 pricing landmine) — within the first 60 seconds.
2. **The held-out line** (Bobby) immediately on top of it.
3. **The proof click** — "See a deal-breaker in the document" → exact line in the real PDF
   (⚠️ requires the PDF commit — the button is currently missing; G-040).
4. **The honesty beat** — the 2 lower-confidence `needs_review` gates: "when it's less sure, it says
   so." This also pre-answers the visible 12-vs-10 arithmetic.
5. **Answers with receipts** — the insurance gate's evidence-cited draft + the open question
   (asks-instead-of-guessing).
6. **The thesis-bridge close** — decision capture in Conduct's own language, then the verbatim closer.

## What NOT to show

- `/answers` (auth-gated, wrong tender) · matrix row-clicks on `/demo` (dead by design) · the graph
  view as a headline (guardrail: it's Q&A material) · any live upload without a tested key (30k-TPM ≈
  6–7 min/41pp — dead air) · the heuristic extractor · any headline recall/precision % · slide-5's
  embedded matrix as if it were clickable (it's a no-op shell — narrate, don't invite clicks).

## Exact proof points (claim ledger §B — the only numbers allowed on stage)

12/12 deterministic on gold · 10/10 held-out Bradwell (on-screen tender) · Duffield 0 missed ·
101/101 **synthetic** phrasing bank · 42/42 citations verified, 0 bluffs ("our full eval run") ·
7/7 ugly tenders survive · 223 tests green · £341bn (HoC Library) · Act live 24 Feb 2025.

## Known gaps a judge may hit (from the pitch audit — pre-briefed answers)

- **12 vs 10 on screen** → the rehearsed reconciliation (battlecard, top). Our over-flagging is the
  designed failure mode; the alternative is a silent miss.
- **Main-flow Tech slide carries no evidence** (proof ledger is behind the `Q` appendix) → speaker
  compensates: Bobby SAYS the numbers on slide 5; if a judge asks "how do you know," press `Q`.
- **Duffield + 42/42 aren't on any slide** → they're spoken beats (script) — deliberate, keep.
- **"Nothing on stage is staged"** (slide 5 line) → immediately follow with "cached output of a real
  pipeline run" so it can't be misread as "live model call."
- **Landing/scrolly still show SPSO-era numbers** (18/19 · 13pp · 183) one click behind the QR →
  fix this morning (checklist) or judges following the CTA see contradicting numbers.
- **Proof-free Ask slide** → Joel adds the storyboard's dropped close verbally: *"Bring us a
  public-sector tender — we'll have the deal-breaker checklist ready before the call."*

## Failure modes & fallbacks (ladder detail in run-of-show.md)

Static prebake hosting = primary (no backend/key/network beyond page load) → local `npm run dev`
(post-`npm install`!) → second laptop → recorded video → screenshots + narration. Any visible wobble:
the honesty recovery line — "when we're not sure, we say so; here's the cached run" — is on-message.

## Last-slot tactics (3:55pm, final pitch of the day)

Judges will have sat through ~10 human-gated-AI pitches. (a) Concrete catch inside 15 seconds — no
category preamble; (b) run ≤3:00 — tired rooms punish overruns; (c) the verbatim closer is the final
thing the panel hears before deliberating — it's the single highest-leverage rehearsal item; (d) the
likely judges are Conduct's ex-Palantir founders (inference, see judge-research.md) — expect the
"how do you know?" probe and answer with the eval harness, our unique asset in this field.
