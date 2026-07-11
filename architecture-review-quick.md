# Architecture & Systems-Thinking Review — Tender Breakdown / Bidframe

> Multi-agent review (frontend, backend/engine, process/meta, cross-cutting contract seams), 2026-07-11.

**TL;DR:** This repo's systems thinking is well above hackathon grade — the team found the right seam (locked schema → mock-first frontend → env-var swap) and defended it, the engine is a genuinely well-designed pure core, and the agent-coordination primitives (per-author comms boards, commit-keyed CODEMAP) are correct solutions to real problems. The weaknesses are the mirror image: things that are *silently* wrong or *silently* decaying. Two P0 correctness risks (SQLite concurrency, silent engine-fallback in prod), one contract drift that only bites in live mode, and a meta-layer that's clever at preventing collisions but has no entropy management — no CI gate, no doc GC, governance rules the team no longer follows.

## What's genuinely good

- **The mock-swap seam is the best design call in the repo.** `isApiEnabled()` gates on `NEXT_PUBLIC_API_BASE_URL` (`frontend/src/lib/api.ts:11`), every mutation is optimistic-in-memory then best-effort PATCH — the demo cannot break in front of judges regardless of backend state.
- **The engine earned its testability.** `reconcile()` is pure with embeddings injected at the IO boundary (`engine/reconcile.py:300, 343`), which is why the engine has ~40 test files and the backend has few. Frontend logic likewise lives in pure lib modules (`triage.ts`, `dedupe.ts`), not components.
- **Security fundamentals above hackathon bar:** PBKDF2 + constant-time compare, path-traversal guards, server-side actor stamping, zip-bomb limits, no tokens in document URLs.
- **Meta-layer primitives are real systems design:** per-author append-only comms boards make concurrent pushes structurally conflict-free; the CODEMAP generator is commit-keyed (no CI churn) with fork-guard and rebase-retry in the workflow; `yc-story.md`'s receipts-and-gaps rule treats narrative as auditable infrastructure.
- **Honest-by-construction demo:** `demoDraft` only replays answers a real run produced — the "tool is honest, not guessing" rule is baked into code, not just docs.

## The critique — where the systems thinking fails

The pattern across all four reviews: **the system is excellent at making things work and poor at making failures visible.** Every serious issue below is a *silent* failure mode.

### P0 — will bite the demo or a pilot

1. **SQLite has no `busy_timeout` and no WAL** (`backend/app/store.py:39`), yet there are concurrent writers (background extraction thread, PATCHes, comments, `/draft`). Default SQLite fails contended writes *immediately* → intermittent, unreproducible 500s the moment two people touch one tender during a live extraction. Five-minute fix: `PRAGMA busy_timeout=5000` per connection + `PRAGMA journal_mode=WAL` once in `init_db`.

2. **Production may be silently running the degraded pipeline.** Five `try/except ImportError` flags (`backend/app/pipeline.py:43-89`) mean if `engine/` is absent in the deploy (render.yaml roots at `backend/`), reconcile falls back to a thin `SequenceMatcher` dedupe and autofill/safety-net no-op — with only a `print`. Nothing on `/health` reveals it. A compliance product could ship a pilot on the placeholder pipeline and nobody would know. Fix: expose `engine_loaded` on `/health` and decide whether missing-engine should be a hard boot failure in prod.

3. **"Main is always demo-able" is the only invariant with zero automated enforcement.** The single GitHub Action is the codemap refresher — no build/lint/test gate on push. All the safety is honor-system on the branch that *is* the release. Add a lightweight CI: frontend `build && lint` + `pytest engine/tests`.

### P1 — contract integrity (the thing the whole product is about)

4. **One real schema drift: `EvidenceRef.page`.** Frontend requires `page: number` (`frontend/src/types/requirement.ts:24`); backend allows `Optional[int] = None` (`backend/app/schema.py:65`) and the engine passes evidence refs through untouched. This breaks **live-only** — the mock demo will never surface it, which is exactly the failure class the mock-first design hides. Fix the type, and add **one cross-language golden-JSON contract test** (a full `TenderResponse` validated against both Pydantic and the TS types) so drift can't hide behind the mock again.

5. **The "locked" contract is enforced in three diverging places, and eval doesn't test what production ships.** The live pipeline imports only `group_candidates`/`merge_group` and re-implements ID assignment and final-object construction itself (`pipeline.py:469-496`), while `reconcile.to_final` is exercised only by the eval harness — two ID schemes (`req-0001` vs `{tender_id}-r{seq:04d}`), two promotion paths, and **the eval numbers validate a slightly different object than production emits.** Unify on the engine's `to_final` (parametrize the id scheme).

6. **Answer persistence is documented as two contradictory things.** Comments in `RequirementsContext.tsx:96-98` say "no backend endpoint for answer content yet," while `patchAnswer` (`api.ts:468`) is called from five write paths behind a fire-and-forget `.catch(toast)`. Either the comments are stale or those PATCHes silently 404. Thirty-minute audit; it's a "does this actually save?" ambiguity.

7. **`/prompts` is documentation, not the runtime contract.** Live system prompts are inlined in `extract.py:297` and `answer.py:144`; nothing loads `prompts/*.md`. For a product whose thesis is grounded extraction, the spec can drift from the shipped prompt with zero enforcement. Load from file, or add a drift-assertion test.

8. **Silent data loss in a "never miss a deal-breaker" tool.** A chunk that fails all retries drops its requirements with a stdout `print` (`extract.py:449`); there's no `logging`, no "3 of 40 pages failed" surfaced to the user. Surface `partial: true` + skip counts on the job result and `TenderResponse`.

### P2 — structural debt worth paying down

9. **`RequirementsContext.tsx` is an 876-line god-object** (28 context values: server sync + SSE + optimistic decisions + transient edit buffers + hand-rolled reveal-animation timers with magic constants). Everything authed re-renders on any change. Split into a data provider and a transient-editing store; move the `playReveal` choreography out of the data layer into a component/hook.

10. **Dead/duplicated frontend surface:** `UploadDropzone.tsx` (684 lines, superseded by `UploadWorkspace`), an inline CSV builder in `MatrixView.tsx:89-120` duplicating `export-matrix-xlsx.ts`, the never-finished `draft_answer` dual-write spread across ~8 sites, and three hand-maintained mock datasets (`mock-requirements.ts`, `demo/sample.ts`, engine fixtures) with no shared factory.

11. **`AUTH_SECRET` silently falls back to a hardcoded dev secret** (`auth.py:97`) — forget the env var in a deploy and every JWT is forgeable, invisibly. Refuse to boot in prod without it. (Tiny fix, arguably P0.)

### Meta-layer — clever primitives, no entropy management

12. **Doc sprawl with no garbage collection:** 611 tracked markdown files, 57 at root, **450 under `crm/`** (74% of tracked files — operational GTM data living on the live demo branch, bloating clones and dominating CODEMAP). Move `crm/` + outreach docs to a separate repo. Three demo scripts exist and, per the team's own board (J-089), "none matches today's."

13. **Documented governance ≠ practiced governance.** The schema branch+PR rule was waived from Day 1 ("verbal sign-off was the point"); additive fields now go straight to main. That's a *fine* policy — but AGENTS.md still teaches new agents the abandoned one. Rewrite the rule to match reality: additive-nullable fields → main; breaking/removing fields → branch + PR.

14. **The self-reporting discipline has decayed:** STATUS.md admits 3 of 4 rows are reconstructed second-hand; board-j.md is 1,316 lines of mostly-still-`OPEN` entries — an inbox that never compacts. Institute board archiving (`comms/archive/`) and a real RESOLVED discipline, or formally redefine STATUS as J-reconstructed.

15. **CODEMAP's "regenerate in the same commit" rule requires Python 3.10+**, so part of the rule's audience can't run it and the map is routinely one commit stale — contradicting "always-current, read it first." Fix the version floor or drop the rule and lean on CI. Also write one authoritative `ops/deploy.md` — `fly.toml` + `render.yaml` + `vercel.json` + mirrors currently leave no single source of truth for where the app runs.

## Recommended order of work

1. SQLite WAL + `busy_timeout` (5 min)
2. `engine_loaded` on `/health` + `AUTH_SECRET` boot assertion
3. CI build/lint/test gate on `main`
4. `EvidenceRef.page` fix + golden-JSON cross-language contract test
5. Reconcile the answer-persistence comments vs `patchAnswer` reality
6. Unify the promotion path (`to_final`) so eval tests production's object
7. Load prompts from `/prompts` at runtime (or drift test)
8. Split `RequirementsContext`; delete dead components; fold inline CSV into the export lib
9. Move `crm/` out of the monorepo; compact comms boards; align AGENTS.md with practiced governance

## Net judgment

The architecture's shape is right and the hard interface decisions were made early and correctly — rare at this speed. The systemic flaw is a consistent preference for **silent degradation over loud failure** (engine fallback, dropped chunks, dev secret, mock-hidden drift, stale docs) — the exact opposite of the product's own "honest, evidence-backed" thesis. Almost everything on the list is subtraction or a small assertion, not a rewrite; roughly two focused days closes the P0/P1 set.
