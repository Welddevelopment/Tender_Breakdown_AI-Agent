# Home-device deploy — context + exact steps (written 2026-07-07)

For the machine that has the **baked demo data** (the one where the Bradwell demo tender was
seeded). Goal: get the backend live on the already-created Hugging Face Space so the Vercel
frontend can point at it. If you're an AI agent reading this: everything below is current as
of the commit that added this file — do the Fast path first, fall back to Manual only if it fails.

## What's already done (don't redo)

| Thing | State |
|---|---|
| HF account | `yonnie-tsenta` exists |
| HF Space | `yonnie-tsenta/bidframe-api` — created, **Docker SDK, public, empty** ("NO_APP_FILE") |
| `AUTH_SECRET` | **already set** as a Space secret (random, server-side; nobody needs its value) |
| `OPENAI_API_KEY` | **not set** — optional; baked demo serves without it (only live drafting/extraction needs it) |
| Deploy scripts | `deploy/stage-hf-space.ps1` (stage) and `deploy/push-hf-space.ps1` (one-shot) — both in the repo |
| Vercel | new project exists, root dir `frontend`; `NEXT_PUBLIC_API_BASE_URL` **not set yet** |

**You need:** an HF **write** token (`hf_...`) — https://huggingface.co/settings/tokens.
The one used on 2026-07-07 was pasted in chat, so ideally delete it and create a fresh one.

## What must exist on THIS machine before anything works

The gitignored baked demo data (this is why the office machine couldn't deploy):

- `backend/tender.db` — accounts (alice/bob/demo), the tender, team, decisions, drafted answers
- `backend/data/uploads/tnd-9da46fbf/` — the 4 source files (PDF/Word/Excel/CSV)
- `backend/data/capability/tnd-9da46fbf/` — the 3 Verdant Landscapes capability docs

If any are missing here too, STOP — the demo has to be re-seeded (see `ops/deploy-runbook.md`).

## Fast path (one command)

From the repo root:

```powershell
git pull --rebase
powershell -ExecutionPolicy Bypass -File deploy\push-hf-space.ps1
```

Prompts for the HF token, then: stages the build → pushes to the Space → prints the health
URL. Skip to **After the push** below.

## Manual fallback (if the script errors)

Each step is independently checkable; replace `hf_XXX` with the token.

1. **Stage** (assembles `deploy\hf-build\` = backend + engine + baked data + Dockerfile + README):
   ```powershell
   powershell -ExecutionPolicy Bypass -File deploy\stage-hf-space.ps1
   ```
   Must end `Staged OK`. If it prints `MISSING backend\tender.db` etc. → wrong machine / not
   seeded (see section above). If PowerShell refuses to run scripts entirely, run the same
   line from **cmd.exe**.

2. **Clone the Space** (any folder outside the repo, e.g. `%TEMP%`):
   ```powershell
   git clone https://yonnie-tsenta:hf_XXX@huggingface.co/spaces/yonnie-tsenta/bidframe-api $env:TEMP\bidframe-space
   ```
   (Token-in-URL avoids the credential prompt. Auth error → token isn't a **write** token.)

3. **Copy the build in and push:**
   ```powershell
   Copy-Item deploy\hf-build\* $env:TEMP\bidframe-space -Recurse -Force
   git -C $env:TEMP\bidframe-space add -A
   git -C $env:TEMP\bidframe-space commit -m "bidframe backend + baked demo data"
   git -C $env:TEMP\bidframe-space push
   ```
   Build is ~2 MB; push is quick. NOTE: the Dockerfile and README.md at the build root are
   required (README front-matter sets `app_port: 7860`) — don't push backend/ alone.

## After the push

1. Watch https://huggingface.co/spaces/yonnie-tsenta/bidframe-api — **Building → Running**
   (first build ~3–5 min; the build log is on that page if it fails).
2. Verify: https://yonnie-tsenta-bidframe-api.hf.space/health → `{"status":"ok",...}`.
   Also sanity-check `/tenders` returns the Bradwell tender, and log in on the deployed
   frontend as `alice@bidframe.io` / `alice1234` once Vercel is pointed at it.
3. **Vercel** → project → Settings → Environment Variables →
   `NEXT_PUBLIC_API_BASE_URL = https://yonnie-tsenta-bidframe-api.hf.space` (no trailing
   slash) → then **Deployments → ⋯ → Redeploy** (env vars bake in at build time; without a
   redeploy the site stays on mock data).
4. Optional: add `OPENAI_API_KEY` in Space Settings → Variables and secrets (only for live
   drafting/extraction on camera).

## Troubleshooting

- **Login 500s** → `AUTH_SECRET` missing on the Space (Settings → Variables and secrets).
  It was set 2026-07-07; re-add any random string if it's gone (re-adding logs everyone out).
- **Health OK but frontend shows mock/demo data** → Vercel env var missing, has a trailing
  slash, or you forgot to redeploy.
- **Space "sleeping" / slow first hit** → free Spaces sleep after inactivity; open `/health`
  ~1 min before recording to warm it.
- **Build error on the Space page** → open the build log; the usual suspect is a missing file
  in the pushed tree (re-run stage, re-copy, re-push).
- **CORS errors in the browser console** → shouldn't happen (backend allows `*.vercel.app`),
  but if the frontend is on a custom domain, add that origin to the backend CORS config.

Full background: `ops/deploy-runbook.md`. Demo shoot script: `ops/demo-bob-script.md`.
