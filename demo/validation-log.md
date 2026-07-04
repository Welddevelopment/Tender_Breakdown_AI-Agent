# Validation Log — overnight demo-prep run (2026-07-04, ~02:00–morning)

All commands run in `/Users/bobbc/Projects/UKAI-hack` (main checkout, branch `main`).

## Changes validated

- `frontend/src/lib/api.ts` — added `bradwell-grounds-itt.pdf` to `DEMO_PDFS` (inert until the PDF is
  committed to `frontend/public/demo/`).
- `frontend/src/components/pitch/PitchDeck.tsx` — 3 stale SPSO→Bradwell text fixes (1 visible
  Demo-reliability slide line, 2 speaker notes).
- `demo-day/` — doc-only Bradwell reconciliation (run-sheet, 4 cue cards, README, pre-show checklist,
  backup plan, qa-prep).
- `comms/board-generalist.md` — G-040 entry. `demo/` — new artifact pack (docs only).

## Commands + results

| Command | Result |
|---|---|
| `cd frontend && npm run lint` | ✅ **0 errors**, 1 warning (pre-existing `react-hooks/incompatible-library` in `ComplianceMatrix.tsx:532` — untouched by tonight's changes) |
| `cd frontend && npm run build` (first attempt) | ❌ 17 × Module not found (`@tanstack/react-virtual`, `cmdk`, `pdfjs-dist`, …) — **stale `node_modules` in the main checkout**, NOT caused by tonight's edits (text-only changes; deps were added by teammates in recent pushes) |
| `cd frontend && npm install` | ✅ installed; fixed all 17 |
| `cd frontend && npm run build` (after install) | ✅ **BUILD_EXIT=0** — Turbopack build clean, 17/17 static pages, all routes incl. `/demo` + `/pitch` prerender |
| `uv run --with pytest --with-requirements backend/requirements.txt python -m pytest engine/tests/ -q` | ✅ **223 passed**, 3 warnings, 7.91s |
| `python scripts/gen_codemap.py` | run before commit (structure changed: `demo/` added) — result appended below |

Note: `backend/tests/` does not exist as a directory — the backend's coverage lives inside
`engine/tests/` (e.g. `test_backend_extract.py`, `test_autofill_wiring.py`), all green above.

Note for the demo laptop: the main checkout's `node_modules` was stale enough to break the build until
`npm install` — **run `npm install` after every pull on the demo machine** (it's in
`demo/final-checklist.md` night-before steps).

## Research workers (Phase 1) — codex failed, native fallback used

| Worker | Attempt 1 (codex) | Outcome | Fallback |
|---|---|---|---|
| team-landscape | `codex --search exec -m gpt-5.5 -c 'model_reasoning_effort="xhigh"' -o … "…"` | ❌ hung 8.5h | ✅ native subagent (WebFetch/WebSearch), same contract |
| judges-criteria | same pattern | ❌ hung 8.5h | ✅ native subagent |
| pitch | same pattern | ❌ hung 8.5h | ✅ native subagent |
| product-reality | `codex exec -m gpt-5.5 …` | ❌ hung 8.5h | ✅ written directly by the orchestrator from tonight's verified code findings |

**Failure detail (exact):**
1. First launch (~02:10) of workers 1/2/4 died instantly — in codex-cli 0.142.5, `--search` is a
   *global* flag and must precede `exec`; `codex exec --search` → usage error, exit 2.
2. Relaunch (~02:15, flag order fixed) + worker 3: all four processes started, then blocked forever on
   `Reading additional input from stdin...` — `codex exec` in this non-interactive shell waited on
   stdin despite a prompt argument and never proceeded (0 bytes of model output in 8.5 hours, no
   API traffic visible). Killed 10:42. Lesson for future runs: pipe stdin explicitly closed, e.g.
   `codex exec ... "prompt" </dev/null` is NOT sufficient here; use `echo | codex exec -` form or the
   native Agent tool.
3. Native subagents launched 10:42 with the same contracts and word budgets.
