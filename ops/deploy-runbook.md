# Deploy runbook — hosting the demo backend on a free tier

Goal: put the Bidframe backend (with the Bradwell demo tender **already baked in**) on a
public URL so a remote teammate can sign in and record. The frontend is already on Vercel;
we only need to host the backend and point Vercel at it.

> **Why not the ones we tried:** Render's usable tier is paid for us; Fly was fiddly;
> Cloudflare tunnel was rejected (keeps the laptop in the loop). **Koyeb's free "nano" is
> 256 MB and the backend idles at ~247 MB, so it OOMs.** The reliable free choice is
> **Hugging Face Spaces (Docker)** — 16 GB RAM, no card, its own git repo (so we can ship
> the baked SQLite + source files without committing them to this repo), and SSE works.

## What's baked into the image (so no slow/rate-limited re-extraction on the server)
- `backend/tender.db` — accounts (alice/bob/demo), the tender, the team, decisions, drafted answers
- `backend/data/uploads/tnd-9da46fbf/` — the 4 source files (PDF/Word/Excel/CSV) the source panel serves
- `backend/data/capability/tnd-9da46fbf/` — the 3 Verdant Landscapes capability docs (Bid evidence)

Secrets are **not** baked — set them in the host: `AUTH_SECRET` (required, or login 500s) and
`OPENAI_API_KEY` (only needed to draft/extract live; the baked demo serves without it).

---

## Primary path — Hugging Face Spaces (Docker)

> **Current state (2026-07-07):** the Space **exists and is prepped** —
> `yonnie-tsenta/bidframe-api` (Docker SDK, public, empty) with `AUTH_SECRET` already set.
> On the machine with the baked demo data, the whole deploy is **one command**:
> ```powershell
> powershell -ExecutionPolicy Bypass -File deploy\push-hf-space.ps1
> ```
> (prompts for the HF write token; stage → push → prints the health URL). Then set the
> Vercel env var (see below) and redeploy. Steps 1–4 below are the manual equivalent.

1. **Stage the build** (assembles a 2 MB push-ready folder from the live, seeded backend):
   ```powershell
   powershell -ExecutionPolicy Bypass -File deploy\stage-hf-space.ps1
   ```
   → produces `deploy\hf-build\` (backend + engine + baked data + Dockerfile + README.md).
   Re-run this any time the demo data changes (re-bake, then re-stage).

2. **Create the Space:** https://huggingface.co/new-space → **SDK: Docker** → name it (e.g.
   `bidframe-api`). This gives you a git repo like `https://huggingface.co/spaces/<you>/bidframe-api`.

3. **Push the build:**
   ```bash
   git clone https://huggingface.co/spaces/<you>/bidframe-api
   cp -r deploy/hf-build/* bidframe-api/         # (or copy in Explorer)
   cd bidframe-api && git add -A && git commit -m "bidframe backend" && git push
   ```
   HF builds the Docker image and deploys. Watch the build log in the Space UI.

4. **Set secrets:** Space → **Settings → Variables and secrets** → add
   `AUTH_SECRET` = a strong random string, and `OPENAI_API_KEY` = your key. The Space rebuilds.

5. **Verify:** open `https://<you>-bidframe-api.hf.space/health` → `{"status":"ok","extractor":"openai"}`.
   API docs at `/docs`. (Free Spaces sleep after inactivity — hit `/health` ~1 min before recording to warm it.)

## Point the Vercel frontend at it
1. Vercel project → **Settings → Environment Variables** → set
   `NEXT_PUBLIC_API_BASE_URL = https://<you>-bidframe-api.hf.space` (no trailing slash).
2. **Redeploy** the frontend (env vars are baked at build time).
3. CORS already allows `*.vercel.app`, so no backend CORS change is needed.

## ⚠️ Push the frontend title fix first
`main` has an **uncommitted** fix (this session) so a live tender shows its own title instead of
the seed's "(Demo)" label — see `src/context/RequirementsContext.tsx` and `src/components/MatrixView.tsx`.
**Commit + push it before redeploying Vercel**, or the hosted matrix header will read
"…(Demo)". (Locally it's already live via the dev server.)

---

## Alternative — Koyeb (only if you want it)
Reads the same repo-root Dockerfile (`backend/Dockerfile`), but: (a) the **free nano is 256 MB
→ will OOM** at ~247 MB idle; you'd need a ≥512 MB instance; and (b) Koyeb builds from GitHub,
where `tender.db`/uploads are gitignored, so you'd have to re-seed on the server (re-run the
admin CLI + upload the pack → slow + rate-limited). Net: more friction than HF Spaces here.

## Fallback — local, two machines on one LAN
No deploy: run the backend locally bound to `0.0.0.0`, and have the teammate point a local
frontend at `http://<your-lan-ip>:8000`. Add their origin to `CORS_ORIGINS`. Only works on the
same network. (Same-machine two-window Google+Incognito also works but isn't two real recorders.)

## Local dev (how it's running right now)
- Backend: from the **repo root** (so `engine` imports): `backend/.venv/Scripts/python.exe -m uvicorn backend.app.main:app --port 8000`
- Frontend: `cd frontend && npm run dev` with `frontend/.env.local` → `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
