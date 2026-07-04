# Product Reality — verified state as of Sat 2026-07-04 morning

> Produced by the orchestrator directly (the codex worker hung on a stdin bug — see
> `demo/validation-log.md`). Every claim below was verified against code, tests, or build output
> tonight, not summarized from docs.

## What is demo-safe (verified)

- **`/pitch` + `/demo` are static-prerendered with the Bradwell prebake baked into the build** —
  `next build` green, 17/17 routes static. No backend, no API key, no Render dependency on stage.
  `frontend/src/app/demo/page.tsx` + `app/pitch/page.tsx` import `bradwell-prebake.json` directly and
  mount a frozen provider (live/mock state cannot leak in).
- **The Bradwell prebake content** (`frontend/src/data/bradwell-prebake.json`): title "Grounds
  Maintenance Tender – Bradwell Common & Heelands (Demo)", source doc `bradwell-grounds-itt.pdf` 34pp,
  **50 requirements, 12 deal-breakers** (10 high-confidence + 2 deliberate lower-confidence
  `needs_review`), 4 drafted answers (flagship: the £5m/£10m insurance gate, `state: auto`, 1 evidence
  ref), 1 open question (references row), 3 `needs_review` total.
- **Engine/backend suite: 223 passed** (7.91s, key-free). Frontend lint: 0 errors (1 pre-existing
  warning).
- **The deterministic deal-breaker floor** — the claim ledger's 12/12 gold + 10/10 held-out Bradwell +
  0-missed Duffield + 101/101 synthetic bank; the strongest stage fact is that **Bradwell (on screen)
  was itself the held-out test**.

## What is fragile (verified, with exact failure modes)

1. **`/demo`'s only interactive proof is missing on the deployed site.** The matrix on `/demo` is
   `pointer-events-none` (no row clicks — J-081's "click the insurance row" is impossible there). The
   one scripted interaction, the "**See a deal-breaker in the document**" button → PDF overlay with the
   exact line highlighted, only renders when `DEMO_PDFS` in `frontend/src/lib/api.ts` maps the
   tender's `source_filename`. It mapped only SPSO; **on Bradwell the button silently doesn't render.**
   Fixed the mapping tonight; still needs `data/tenders/bradwell-grounds-itt.pdf` copied to
   `frontend/public/demo/` and committed (Joel's call — repo rule vs. the SPSO-in-public precedent).
2. **The `/demo` cinematic scrolly still narrates SPSO** (`components/demo/sample.ts` `DEMO_FACTS`:
   "SPSO Cleaning Services ITT", 13pp/183 reqs/9 deal-breakers + "cleaning services" wall prose)
   directly above the **Bradwell** worked example — a visible on-page contradiction. Curated copy →
   left for Jawad (G-040).
3. **`/answers` is auth-gated and reads the mock/live provider, NOT Bradwell.** Don't open it on stage
   unless rehearsed as an explicitly-separate surface.
4. **Stale `node_modules` breaks the build after a plain pull** — the main checkout failed with 17
   module-not-found errors until `npm install`. The demo laptop MUST run `npm install` after pulling.
5. **Render free tier** sleeps on idle; the deployed API is heuristic-only until `OPENAI_API_KEY` is
   set. Irrelevant to the prebake path; only matters if someone attempts a live upload (mode B).
   **Never demo the heuristic as if it were the model** (gating recall 0.0 on heuristic).

## Exact run commands

```bash
# Hosted (default): open the Vercel URLs for /pitch and /demo — nothing to run.
# Local fallback (wifi-proof), demo laptop, night before:
cd ~/Projects/UKAI-hack && git pull --rebase
cd frontend && npm install && npm run dev    # http://localhost:3000/pitch + /demo
# Sanity: npm run build   (expect 17/17 static routes)
# Engine tests if anyone asks for proof live:
uv run --with pytest --with-requirements backend/requirements.txt python -m pytest engine/tests/ -q  # 223 passed
```

## Live/mock API mode

`frontend/src/lib/api.ts`: mock by default; live only when `NEXT_PUBLIC_API_BASE_URL` is set. `/demo`
+ `/pitch` ignore both (frozen Bradwell provider). PDF resolution: live tender → backend
`/tenders/{id}/pdf`; demo → static `DEMO_PDFS` map in `/public/demo/`.

## Fallback path if backend fails

The stage path has **no backend**. Ladder: hosted static → local `npm run dev` → second laptop →
recorded video → screenshots + narration (full ladder in `demo/run-of-show.md`). The backend failing
affects only an optional post-pitch live upload.

## Strongest proof points (locked numbers, `demo-claim-ledger.md` §B)

12/12 deal-breakers deterministic on gold (no model, re-runnable) · **10/10 on held-out Bradwell — the
tender on screen** · Duffield held-out 0 missed · 101/101 synthetic phrasing bank (say "synthetic") ·
42/42 citations verified, 0 bluffs (SPSO eval run — say "our full eval run") · 7/7 ugliest tenders
survive end-to-end · 223 tests green.

## What NOT to show

`/answers` (wrong tender, auth wall) · matrix row-clicks on `/demo` (dead by design) · the heuristic
extractor as if it were the model · a headline recall/precision % · live upload without a tested key
(30k-TPM key ≈ 6–7 min for a 41pp tender — too slow for stage anyway).

## demo-day/ kit staleness — RESOLVED tonight

The kit was written 2026-06-30 (pre-J-081). Reconciled in place tonight: run-sheet, all 4 cue cards,
README (date 4→5 Jul), pre-show checklist (J-020/key risks superseded by the prebake), backup plan,
qa-prep — all now Bradwell + claim-ledger consistent. What remains correct from the original: the
beat structure, handoff lines, driver rule (Jawad drives), speaker order, cut order, honesty rules.
