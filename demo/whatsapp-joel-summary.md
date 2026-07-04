BIDFRAME DEMO PREP — overnight run done (Bobby's agent)

🚨 1) DATE: official sources say Demo Day = TODAY SAT 4 JUL (Luma, DoraHacks, aiagentslab.uk). Running-order sheet: Bidframe pitches LAST, 3:55pm. Notes said Sunday — CONFIRM IN DISCORD NOW.

🚨 2) YOUR 30-SEC CALL: /demo's one interactive proof ("See a deal-breaker in the document" → PDF, exact line highlighted) is MISSING on Bradwell — the PDF isn't in the build. Fix (code mapping already pushed):
cp data/tenders/bradwell-grounds-itt.pdf frontend/public/demo/ → commit+push.
(Repo rule bans tender PDFs; SPSO in public/demo is the precedent. Your call.)

IN THE REPO (pushed): demo/ = strategy · run-of-show (90s/3m/5m) · pitch-script · Q&A battlecard · final-checklist · judge-research · team-landscape · validation log + research/. Pranav's demo-day/ kit fully reconciled to Bradwell (cue cards, run-sheet, checklist).

TOP 5 RECOMMENDATIONS
1. Lead with the held-out line — "this tender on screen was our held-out test: 10/10 deal-breakers caught, never seen before." No team in the field has ANY measured eval (we read 19/21 rival decks).
2. Rehearse the visible 12-vs-10 (screen shows 12, appendix says 10/10): "10 gold caught + 2 honest low-confidence flags — over-flag, never a silent miss." Battlecard has the wording.
3. Jawad: scrolly + landing still say SPSO (13pp/183/18-of-19) one click behind the QR — fix before stage (G-040).
4. We pitch last, after ~10 "human-in-control AI" pitches — catch inside 15 sec, ≤3:00, closer is king. Likely judges: Conduct's ex-Palantir founders — expect "how do you KNOW?"; answer = eval harness.
5. Ask slide is proof-free — add verbally: "Bring us a public-sector tender; deal-breaker checklist ready before the call."

OPENER (Joel): "Last year the UK public sector bought over £300bn of goods and services — and small firms lose that work in the stupidest possible way: one mandatory requirement, buried on page 31, missed. Whole bid thrown out, unread. Bidframe exists so that never happens again."

CLOSER (Joel, verbatim): "Three weeks of expert reading, a disqualifier risk, and a blank page — down to minutes, with the killer requirement caught, every line checkable, and a human approving every step. We didn't build an AI that writes bids; we built the layer that makes it safe to use one."

Validation: build green, lint 0 errors, 223 tests pass. Demo laptop MUST run npm install after pull (stale deps broke the build last night).
