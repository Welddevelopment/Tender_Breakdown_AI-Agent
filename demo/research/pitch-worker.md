# Pitch deck evidence report — bidframe.org/pitch

Worker output, 2026-07-04. Evidence + critique only; no strategy rewrite.

## 1. Access log

- **https://bidframe.org/pitch** — returned rich content, not thin HTML. All 11 slides (7 main + 4 appendix) render in the served DOM (the deck keeps every `<section>` mounted and toggles `is-active`), so the fetch saw the full slide text including the appendix proof ledger (12/12, 10/10, 101/101, recall-first wording). Live content matches repo ground truth in `frontend/src/components/pitch/PitchDeck.tsx` (1,320 lines; slides defined inline as JSX at ~L568–1122).
- **https://bidframe.org** — landing renders "Never lose a bid to a deal-breaker you missed", plus **SPSO-era proof numbers**: "18 of 19 requirements on a live cleaning contract ITT (13 pages, 183 lines)", "zero invented answers". Repo confirms: `components/landing/ProofNumbers.tsx` still cites `spso-prebake.json` ("SPSO Cleaning Services ITT · 13 pages · 183 lines extracted").
- **https://bidframe.org/demo** — mixed state, confirmed live and in repo. `app/demo/page.tsx` mounts the **Bradwell** prebake (Grounds Maintenance, 50 requirements), but `DemoView` includes `DemoScrolly`, whose narrative copy still says "the same pipeline on a real **13-page** tender" and `components/demo/sample.ts` stats say 183 requirements / SPSO. The live fetch surfaced both tenders' numbers on one page.
- **Repo ground truth for the mounted fixture** (`frontend/src/data/bradwell-prebake.json`, computed): title "Grounds Maintenance Tender – Bradwell Common & Heelands (Demo)", **50 rows, 12 gating deal-breakers, 4 evidence-backed drafts, 1 open question, max source_page 31**. First gating row (the slide-3 stop-sign card) = Public Liability £5m / Employers' Liability insurance gate, clause 3.3.2, p.5 — matches the speaker note "the insurance gate."
- `storyboard.md` and `pitchimprovements.md` read in full.

## 2. Narrative arc, slides 1–7 (actual on-screen headlines)

| # | Bucket | On-screen headline | Job |
|---|--------|--------------------|-----|
| 1 | Problem | **"One missed deal-breaker kills the bid"** (kicker: "A tender, in plain English") | Define tender + disqualification stakes in one poster line. |
| 2 | Use Case | **"The first read decides what happens next"** | 4-step manual workflow (Open tender → Find risks → Build matrix → Draft safely) + animated £341bn stat with 24 Feb 2025 rules note. |
| 3 | Solution | **"Find the clause that can void the bid"** | Two-beat stop-sign: real Bradwell insurance gate (clause 3.3.2 · p.5) lands alone, then a keypress stamps "Caught — surfaced first, before a word is written." |
| 4 | Product | **"The tender becomes a checkable map"** | Live `GatingHero` + click-to-open source peek + `AnswerCard`, with count-up metrics: 50 rows · 12 deal-breakers · 4 backed drafts. |
| 5 | Demo Flow | **"PDF to matrix to proof to answer"** | 4-step route map + live read-only `ComplianceMatrix` embed; line "A real tender, cached. Nothing on stage is staged." |
| 6 | Tech | **"A trust layer, not a PDF chatbot"** | Pipeline word-chips (ingest → extraction → dedupe → deal-breaker detection → source matrix → answer receipts) + static `GraphView`. |
| 7 | Ask | **"Help us scale the first-read layer"** | "Invest, advise, or introduce us." + bidframe.org / bidframe.org/demo. |

Appendix (Q&A only, `Q` key): Team · **Proof ledger** · Market sources · Demo reliability · Competitive wedge.

## 3. Claims inventory vs. the claim ledger

**On-deck claims that match the ledger:**

| Claim on deck | Where | Ledger match |
|---|---|---|
| £341bn UK public procurement 2023/24 | Slide 2 (animated) + Market sources appendix (HoC Library link) | ✓ £341bn |
| "new rules live since 24 Feb 2025" | Slide 2 + appendix (GOV.UK NPPS link) | ✓ Procurement Act 24 Feb 2025 |
| **12/12** deal-breaker benchmark, "SPSO 2/2, museum 10/10 … deterministically, without the model — guaranteed, not luck" | Proof-ledger appendix | ✓ 12/12 deterministic gold |
| **10/10** "Bradwell deal-breakers caught outside the hero tender" | Proof-ledger appendix | ✓ Bradwell held-out |
| **101/101** "worst-case wording variants caught by the safety net" | Proof-ledger appendix | ✓ synthetic bank |
| "recall-first … over-flagging, never a silent miss"; "No headline precision" | Proof-ledger caveat | ✓ honesty framing |

**Ledger claims ABSENT from the deck** (grep-confirmed): **Duffield 0 missed** and **42/42 citations, 0 bluffs** appear nowhere in `frontend/src`. The groundedness number is the bigger loss — slide 4 sells "draft with receipts" with zero quantitative backing on any slide or appendix.

**Claims on deck NOT in the ledger (flag):**
- "about a third of public spend" (slide 2) — companion to £341bn, sourced in appendix; low risk.
- **SME 26.5% central-gov procurement, 2021/22** (Market sources appendix) — not in ledger; self-caveated on the slide but nobody is listed as its Q&A defender.
- Dynamic fixture counts — "50 worked-example rows", "12 deal-breakers surfaced", "4 backed drafts", "1 open prompt" — computed live from the Bradwell prebake, not ledgered. Defensible (they ARE the fixture), but see the 10-vs-12 tension below.
- "Nothing on stage is staged." (slide 5) — rhetorical; true only with the spoken caveat that it's a cached real run. The reliability appendix covers this, but the line itself invites a "so it's live?" misread.

**Cross-surface contradictions (live now):** the landing's **18/19 · 13 pages · 183 lines** (SPSO) and the /demo scrolly's "13-page tender" copy sit one click away from a deck that just showed Bradwell 50/12. Neither 18/19 nor 183 is in the current ledger.

## 4. Strongest and weakest slides

**Strongest — Slide 3 (Solution).** It shows a *real* gating clause from the mounted fixture with clause + page (3.3.2 · p.5), not lorem. The two-beat mechanic (clause alone → "Caught") is genuine stagecraft, speaker-controlled, refresh-safe, and the speaker notes explicitly ban universal-accuracy claims. This is the wedge, delivered as evidence.

**Strongest — Slide 4 (Product).** It embeds the actual product components (`GatingHero`, source-peek with "Exact/Approximate source match" honesty labels, `AnswerCard`) rather than screenshots, and the metrics count up from the same data object the demo runs on. The one-click source peek is the best proof of "every line checkable" in the whole deck.

**Weakest — Slide 6 (Tech).** Body copy is one sentence ("Structured records, with receipts.") plus four tech names and six pipeline word-chips over a non-interactive graph. The storyboard specified "pipeline diagram **plus eval proof ledger**" here; the eval numbers were exiled to the appendix, so the main flow's credibility slide contains **no evidence at all** — a judge who never presses `Q` never sees 12/12, 10/10, or 101/101.

**Weakest — Slide 7 (Ask).** "Invest, advise, or introduce us." + two URLs. No traction line, no pilots/outreach count, and it drops the storyboard's concrete, memorable close ("bring us a public-sector tender and we will prepare the deal-breaker checklist before the call") — the one ask that gives a judge something to *do*.

## 5. Missing judge-facing proof

1. **Precision / false-flag rate.** The deck says "over-flagging, never a silent miss" but never says how much over-flagging. Bradwell makes this concrete: gold = 10 deal-breakers, prebake surfaces 12. A skeptical judge subtracts and asks about the 2. No slide reconciles 12 (surfaced) with 10/10 (held-out gold).
2. **Groundedness numbers.** "Answers with receipts" has no figure — 42/42 / 0 bluffs exists in the ledger but is nowhere on deck; only 4 of 50 rows have backed drafts, which a judge can also read off slide 4.
3. **Eval methodology in the main flow.** How gold sets were labelled, what "deterministic, without the model" means mechanically — one sentence on slide 6 would pre-empt "is this just prompting?"
4. **Time/cost saved.** "Minutes vs weeks" lives on the landing, not the deck; no quantified first-read time on any slide.
5. **Any external validation** — pilot, letter of intent, named target user, or even "we showed it to N bid managers." The Ask is proof-free.
6. **Consistent numbers across surfaces.** Landing (18/19, 183, SPSO) vs deck (Bradwell 50/12, 10/10) — judges who follow the CTA will see the discrepancy before the team can explain it.

## 6. Demo implications (observations, not strategy)

1. **The deck already contains the demo.** Slides 4–5 mount live product components on the same Bradwell provider as /demo — the minimal demo path needs no alt-tab. But the slide-5 matrix embed is a no-op shell (`onSelect={() => {}}`): if a judge says "click that row," nothing happens, which can read as broken rather than read-only.
2. **Slide 3's second beat is a keypress**, and autoplay fires it at ~10.4s into the slide (0.45× of 23s). Presenter muscle memory is load-bearing; refresh mid-beat is handled (sessionStorage + `#slide` hash).
3. **Autoplay totals exactly 180s** (20+22+23+33+34+30+18). Zero slack for the stop-sign pause or handoffs among the four listed speakers — manual navigation with the elapsed timer is the realistic mode.
4. **The 12-vs-10 juxtaposition happens on stage**: slide 4 animates "12 deal-breakers surfaced," the Q&A appendix says "10/10 Bradwell." Whoever fields Q&A needs the one-line reconciliation (gold=10 held-out, detector surfaces 12 recall-first) rehearsed.
5. **The CTA leads into the inconsistency.** Both CTAs route judges to surfaces still carrying SPSO-era copy (landing ProofNumbers, DemoScrolly "13-page" narration). The J-081 Bradwell switch updated the mounted fixture but not the surrounding narrative copy — the smoke-test flagged in commit 5840bd5 would have caught this.
6. Backlog check vs `pitchimprovements.md`: P0s are done in code (hash/sessionStorage persistence, elapsed timer, cursor auto-hide, no QR, autoplay array) and the P1 source peek + 341bn count-up + eval appendix shipped. Still undone from their own list: real team photos (SVG avatars remain), OG image refresh, PDF export in the stage folder, and the demo-claim ledger note "beside the deck" — the last of which is exactly what the Duffield/42-42 omissions and the SPSO stragglers suggest is missing.
