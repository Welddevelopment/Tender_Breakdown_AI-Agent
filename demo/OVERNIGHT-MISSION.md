# Overnight Mission — Judge-Optimized Demo Plan (Bidframe / Tender Breakdown)

You are the overnight orchestration lead for our UKAI-hack demo prep.

**Execution contract:** work this mission end to end until it is fully done. Do not stop to ask for confirmation between phases — the only reasons to stop are a destructive action outside this brief, a schema change, or a hard blocker you've already tried to work around (document it and continue with the rest). Finish with the final report.

## Objective

By morning, produce a judge-optimized, executable 4-person demo plan for Bidframe / Tender Breakdown in the Conduct track, based on:

- our real repo/product state
- our pitch deck
- all other teams' demos
- official judges + judging criteria
- likely competitive whitespace

**Repo:** /Users/bobbc/Projects/UKAI-hack
**Today:** Saturday 2026-07-04 Europe/London
**Demo:** Tomorrow, Sunday 2026-07-05 Europe/London

**Key links:**
- Team sheet: https://docs.google.com/spreadsheets/u/0/d/1E5yuPUz56sPorooK-lTRfKAkYim5zMMPaOfA2zzgV9w/htmlview
- Pitch deck: https://bidframe.org/pitch
- Track: Conduct

## Operating principles

- Do the work, don't just explain.
- Use source-of-truth files and live sources.
- Prefer citations, commands, artifacts, and proof.
- Do not hallucinate. If a source is inaccessible, record exactly what failed.
- Use bounded worker outputs to preserve final synthesis context.
- Do not expose hidden reasoning; output evidence, conclusions, and decisions.
- No risky refactors.
- Do not change the locked requirement schema.
- Do not commit secrets, PDFs, node_modules, .venv, or env files.

## Prior art — build on it, do NOT rewrite from scratch

The team already produced substantial demo material. Read it in Phase 0 and treat it as the base layer:

- **`demo-day/`** (Pranav, 2026-06-30) — the demo-day kit: `run-sheet.md` (beat-by-beat master timeline with handoff lines), `cue-cards/` (one per person: joel-j, p-backend, bobby-generalist, jawad-frontend), `qa-prep.md` (judge questions routed by owner), `backup-plan.md`, `pre-show-checklist.md`, plus a demo-mode decision table (pre-baked / live-key / recorded).
- **`demo-narrative.md`** — the LOCKED 90-second spine, honest numbers, and positioning guardrails. Do not change its beats or numbers without flagging it explicitly.
- **`storyboard.md`** and **`pitchimprovements.md`** (Jawad) — pitch deck storyboard + improvement backlog.
- **`demo-claim-ledger.md`** — the honest, verified claims (worked example is now Bradwell).

**Known staleness to reconcile (this is much of the job):**
1. The kit predates **J-081** (comms/board-j.md, 2026-07-04): the on-stage tender is now the **Bradwell grounds-maintenance prebake (12 deal-breakers)** on `/demo` + `/pitch`, not SPSO. Every SPSO reference, page count, and beat in `demo-day/` needs re-checking against the Bradwell prebake (`frontend/src/data/bradwell-prebake.json`).
2. `demo-day/README.md` says "Demo = 4 Jul 2026" — the real demo is **Sunday 5 Jul 2026**.
3. The kit's open risks (OpenAI key on Render, pre-bake J-020) may be resolved — check STATUS.md + boards for current truth.

So: Phase 2's `run-of-show.md`, `q-and-a-battlecard.md`, and `final-checklist.md` should be produced by **updating/extending Pranav's kit** (and keeping what's good verbatim — the handoff lines, driver rule, honesty rule, mode table are good), not by inventing a parallel structure. Where you change a beat or number from the locked narrative, say so and why. Prefer also updating `demo-day/` files in place so the team's existing entry point stays current — the `demo/` artifacts can reference them rather than duplicate.

## Phase 0 — Sync + orient

1. Run: `git pull --rebase`
2. Read startup docs:
   - AGENTS.md
   - START-HERE.md
   - CODEMAP.md
   - STATUS.md
   - comms/board-*.md
   - tender-master-plan.md
   - role-*.md
   - demo-narrative.md, demo-day/ (all files), storyboard.md, pitchimprovements.md, demo-claim-ledger.md (prior art — see above)
3. Create: `mkdir -p demo/research demo/logs`

## Phase 1 — Spawn bounded Codex research workers

Use Codex CLI workers with:
- model: gpt-5.5
- reasoning: xhigh
- web search when needed
- final response captured to files under demo/research
- each worker must stay within its word budget
- workers must not write final demo strategy; only evidence and summaries

If Codex CLI fails, use your native subagent mechanism with the same contracts.

### Worker 1 — Team landscape

```bash
codex exec --search \
  -m gpt-5.5 \
  -c 'model_reasoning_effort="xhigh"' \
  -C /Users/bobbc/Projects/UKAI-hack \
  -o demo/research/team-landscape-worker.md \
  "Read the Google Sheet at https://docs.google.com/spreadsheets/u/0/d/1E5yuPUz56sPorooK-lTRfKAkYim5zMMPaOfA2zzgV9w/htmlview. Carefully summarize every team/project. Output markdown only. Max 2500 words. Include a table with: team/project, track, problem, proposed demo/product, likely judge appeal, overlap/threat to Bidframe, weakness/gap we can exploit, source/citation. If the sheet is inaccessible, save the failure details and use any retrievable page content or browser-accessible data."
```

### Worker 2 — Judges + criteria

```bash
codex exec --search \
  -m gpt-5.5 \
  -c 'model_reasoning_effort="xhigh"' \
  -C /Users/bobbc/Projects/UKAI-hack \
  -o demo/research/judges-criteria-worker.md \
  "Find official UKAI hackathon judging criteria, Conduct track criteria, judges, and judge backgrounds. Use current sources and cite URLs. Output markdown only. Max 2000 words. Include: criteria, Conduct-track interpretation, judges, what each judge likely values, red flags, and how Bidframe should position."
```

### Worker 3 — Product reality

```bash
codex exec \
  -m gpt-5.5 \
  -c 'model_reasoning_effort="xhigh"' \
  -C /Users/bobbc/Projects/UKAI-hack \
  -o demo/research/product-reality-worker.md \
  "Inspect the repo docs and actual product state. Read AGENTS.md, START-HERE.md, CODEMAP.md, STATUS.md, comms boards, tender-master-plan.md, role files, frontend/backend/engine structure, and relevant package/test scripts. Output markdown only. Max 2000 words. Include: what is demo-safe, what is fragile, exact run commands, live/mock API mode, fallback path if backend fails, strongest product proof points, and what not to show."
```

### Worker 4 — Pitch

```bash
codex exec --search \
  -m gpt-5.5 \
  -c 'model_reasoning_effort="xhigh"' \
  -C /Users/bobbc/Projects/UKAI-hack \
  -o demo/research/pitch-worker.md \
  "Read https://bidframe.org/pitch. Extract the current narrative, claims, problem framing, product positioning, strongest slides, weakest slides, missing judge-facing proof, and demo implications. Output markdown only. Max 1500 words. Cite URLs or note access failure."
```

Wait for all workers to finish before final synthesis.

## Phase 2 — Final synthesis

Read only:
- demo/research/team-landscape-worker.md
- demo/research/judges-criteria-worker.md
- demo/research/product-reality-worker.md
- demo/research/pitch-worker.md
- essential repo docs if needed for verification

Then create these durable artifacts:

1. **demo/judge-research.md** — judges; judging criteria; Conduct-track interpretation; cited sources; what judges likely reward
2. **demo/team-landscape.md** — all teams/projects; overlap/threat analysis; whitespace for Bidframe; positioning implications
3. **demo/demo-strategy.md** — winning narrative; demo wedge; why this is not "just AI PDF summarization"; what to show; what not to show; exact proof points; failure modes and fallbacks
4. **demo/run-of-show.md** — 90-second version; 3-minute version; 5-minute version; 4-person speaker plan; exact transitions; who clicks what; fallback if backend/API fails; fallback if live app fails
5. **demo/pitch-script.md** — polished spoken script; concrete demo beats; no fluff; judge-facing language; exact opener; exact closer; must distinguish Bidframe from generic document AI
6. **demo/q-and-a-battlecard.md** — likely judge questions; sharp answers; technical answers; Conduct/regulatory answers; "why now?"; "why you?"; "what's defensible?"; "what did you actually build?"; "why public procurement?"; "what happens after hackathon?"
7. **demo/final-checklist.md** — exact prep checklist; commands to run; URLs to open; files to have ready; speaker responsibilities; emergency fallback plan; final 30-minute rehearsal checklist
8. **demo/whatsapp-joel-summary.md** — concise WhatsApp-ready summary for Joel; under 2500 characters; include artifact paths, top 5 demo recommendations, exact opener, exact closer, blockers if any

## Phase 3 — Safe product/demo fixes

Only if clearly useful and low-risk:
- make tiny demo-readiness fixes
- do not change schema
- do not risky-refactor
- if adding/renaming/deleting files or changing structure, run: `python scripts/gen_codemap.py`

## Phase 4 — Validation

Run relevant checks based on repo docs. At minimum inspect available commands and run safe validation, likely:
- frontend build/lint if dependencies are installed
- backend/engine tests if available
- `python scripts/gen_codemap.py` if structure changed

Record commands and results in: **demo/validation-log.md**

## Phase 5 — Commit/push

Only if validation passes and repo rules allow:

```bash
git add -A
git commit -m "Add judge-optimized demo plan"
git pull --rebase
git push
```

If validation fails:
- do not push broken code
- still leave demo artifacts
- document blockers in demo/validation-log.md and final response

## Phase 6 — WhatsApp delivery to Joel

Use local wacli, not manual UI.

**Target:**
- Name: Joel (hackathon)
- Phone: +44 7928 432725
- Sanitized number: 447928432725

First verify wacli:

```bash
command -v wacli
wacli doctor || true
wacli contacts search "Joel (hackathon)" --json || true
wacli contacts search "447928432725" --json || true
```

Create a zip package:

```bash
zip -r demo/bidframe-demo-pack.zip demo/*.md demo/research/*.md demo/validation-log.md 2>/dev/null || true
```

Send:

```bash
wacli send text --to "447928432725" --message "$(cat demo/whatsapp-joel-summary.md)"
```

Then send the package if it exists:

```bash
wacli send file --to "447928432725" --file demo/bidframe-demo-pack.zip --filename bidframe-demo-pack.zip --caption "Bidframe demo prep pack: strategy, run-of-show, script, Q&A, checklist."
```

If WhatsApp delivery fails:
- run `wacli doctor`
- save output to demo/wacli-delivery-log.md
- report exact blocker
- do not keep retrying indefinitely
- do not leak secrets or auth tokens

## Final response to Bobby

- files created/changed with absolute paths
- worker commands run
- validation commands + results
- git commit/push status
- WhatsApp delivery status to Joel
- top 10 demo recommendations max
- exact opener
- exact closer
- unresolved blockers
