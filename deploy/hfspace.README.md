---
title: Bidframe API
emoji: 📋
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# Bidframe API (demo backend)

FastAPI backend for the Bidframe demo, with the Bradwell grounds-maintenance tender
pack pre-baked (accounts, requirements, team, drafted answers, source files).

- `GET /health` → `{ "status": "ok", "extractor": "openai" }`
- API docs at `/docs`
- The Next.js frontend (on Vercel) points at this Space's URL via
  `NEXT_PUBLIC_API_BASE_URL`.

**Secrets to set in the Space (Settings → Variables and secrets):**
- `AUTH_SECRET` — any strong random string (signs session tokens; login 500s without it)
- `OPENAI_API_KEY` — only needed if you re-run extraction/autofill live; the baked demo
  serves without it.
