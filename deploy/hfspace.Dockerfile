# Bidframe backend for Hugging Face Spaces (Docker SDK) — free tier, 16GB RAM.
# Build context = the assembled Space repo root (see deploy/stage-hf-space.ps1),
# which contains backend/ + engine/ WITH the baked demo data already inside
# backend/tender.db, backend/data/uploads/ and backend/data/capability/.
#
# HF Spaces route to port 7860 by default (app_port in README.md). AUTH_SECRET and
# OPENAI_API_KEY are set as Space *secrets* (never baked into the image).
FROM python:3.12-slim

WORKDIR /app

# deps first for layer caching
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# code + baked demo data (accounts, tender, team, drafts, source + capability files)
COPY backend/ backend/
COPY engine/ engine/

# HF Spaces expects the app on 7860.
ENV PORT=7860
EXPOSE 7860

# repo-root context so `engine` is importable (real reconcile/gating-net/autofill).
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
