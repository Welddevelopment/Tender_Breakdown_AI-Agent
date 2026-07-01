"""Tender Breakdown API — FastAPI app.

Route shapes match the locked data contract in AGENTS.md so the frontend can swap
its mock data for these endpoints without UI changes.

Pipeline (ingest → chunk → extract → store) is scaffolded by J as backend cover.
Extraction is pluggable: heuristic with no key, Claude when ANTHROPIC_API_KEY is set.
"""

from __future__ import annotations

import os
import shutil
import threading
import time
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .auth import current_user
from .extract import get_extractor
from .ingest import ingest_pdf, PDFIngestError
from .pipeline import run_pipeline
from .schema import DecisionUpdate, Requirement, TenderResponse
from . import auth, pipeline, store

# The generalist's autofill answerers (engine.answer). Guarded like the pipeline import:
# present at repo-root runtime, absent on a backend-rooted deploy (then /draft returns 503).
try:
    from engine.answer import (
        MockAnswerer as _MockAnswerer,
        OpenAIAnswerer as _OpenAIAnswerer,
        get_answerer as _get_answerer,
    )
    _HAVE_ANSWER_API = True
except ImportError:  # pragma: no cover - deploy without engine/ on path
    _HAVE_ANSWER_API = False

app = FastAPI(title="Tender Breakdown API")

# CORS: allow local dev (:3000) + any *.vercel.app deployment (the live frontend +
# its preview builds), plus anything in CORS_ORIGINS (comma-separated) for a custom domain.
_origins = ["http://localhost:3000"]
_origins += [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "data" / "uploads"
CAPABILITY_DIR = Path(__file__).resolve().parent.parent / "data" / "capability"


def _resolve_answerer(provider: Optional[str]):
    """mock -> free/deterministic · openai -> J's answer-generation prompt · None -> env-driven."""
    if provider == "mock":
        return _MockAnswerer()
    if provider == "openai":
        return _OpenAIAnswerer()
    return _get_answerer()


def _save_capability_files(tender_id: str, files: List[UploadFile]) -> str:
    """Persist uploaded capability docs as .txt under data/capability/{tender_id} so the
    autofill retriever can read them. PDFs are run through the same ingest as tenders."""
    folder = CAPABILITY_DIR / tender_id
    folder.mkdir(parents=True, exist_ok=True)
    for f in files or []:
        name = f.filename or "doc"
        raw = f.file.read()
        stem = Path(name).stem
        if name.lower().endswith(".pdf"):
            pdf_path = folder / name
            pdf_path.write_bytes(raw)
            doc = ingest_pdf(str(pdf_path))
            text = "\n\n".join(p.text for p in doc.pages)
        else:
            text = raw.decode("utf-8", "replace")
        (folder / f"{stem}.txt").write_text(text, encoding="utf-8")
    return str(folder)


@app.on_event("startup")
def _startup() -> None:
    store.init_db()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


MAX_UPLOAD_MB = 50


# ---- Extraction jobs (live progress) ----------------------------------------
# In-memory registry of running/finished extraction jobs, keyed by job_id. Single
# process only (Render free tier is one instance); a multi-instance deploy would move
# this to Redis. Cosmetic progress state — the real result is persisted via store.
JOBS: dict[str, dict] = {}
_JOBS_LOCK = threading.Lock()
_JOBS_MAX = 100  # keep the last N jobs, drop the oldest beyond that


def _set_job(job_id: str, **patch) -> None:
    with _JOBS_LOCK:
        job = JOBS.get(job_id) or {}
        job.update(patch)
        job["updated_at"] = time.time()
        JOBS[job_id] = job
        if len(JOBS) > _JOBS_MAX:
            stale = sorted(JOBS.items(), key=lambda kv: kv[1].get("updated_at", 0))
            for jid, _ in stale[: len(JOBS) - _JOBS_MAX]:
                JOBS.pop(jid, None)


def _run_extract_job(job_id: str, pdf_path: str, tender_id: str, title: str,
                     filename: str, owner: str) -> None:
    """Run the pipeline on a background thread, streaming progress into JOBS. The result
    is persisted under `owner`; the UI polls GET /tenders/jobs/{job_id} until status=done."""
    def on_progress(**ev) -> None:
        _set_job(job_id, status="processing", **ev)

    try:
        resp = run_pipeline(pdf_path, tender_id=tender_id, title=title, on_progress=on_progress)
        store.save_tender(resp, filename=filename, owner=owner)
        _set_job(
            job_id,
            status="done",
            stage="done",
            message="Ready",
            progress=1.0,
            tender_id=tender_id,
            requirement_count=len(resp.requirements),
            deal_breaker_count=sum(1 for r in resp.requirements if r.is_gating),
        )
    except PDFIngestError as exc:
        _set_job(job_id, status="error", stage="error", code=422, detail=str(exc))
    except Exception as exc:  # surface a calm message, log the real detail
        print(f"[jobs] extraction failed for {job_id}: {exc}")
        _set_job(
            job_id,
            status="error",
            stage="error",
            code=500,
            detail="We could not process this PDF. It may be corrupt or unsupported.",
        )


@app.get("/health")
def health():
    return {"status": "ok", "extractor": get_extractor().name}


# ---- Auth (invite-only; accounts created via `python -m app.admin`) ----------

@app.post("/auth/login", response_model=auth.AuthResponse)
def login(body: auth.LoginRequest):
    """Exchange email + password for a bearer token. One generic error for both a
    missing account and a wrong password, so the endpoint can't be used to enumerate
    which emails have accounts."""
    store.init_db()
    user = store.get_user_by_email(body.email)
    if user is None or not auth.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    token = auth.create_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"]}}


@app.get("/auth/me", response_model=auth.AuthUser)
def me(user: dict = Depends(current_user)):
    """Return the signed-in account — the frontend calls this on load to confirm the
    stored token is still valid before showing the app."""
    return {"id": user["id"], "email": user["email"]}


@app.get("/tenders")
def list_tenders(user: dict = Depends(current_user)):
    """List the signed-in user's uploaded tenders (id, title, requirement count)."""
    return store.list_tenders(owner=user["id"])


@app.post("/tenders/upload")
async def upload_tender(
    file: UploadFile = File(...),
    title: str = Form(None),
    sync: bool = False,   # ?sync=1 → block until done (eval harness / back-compat)
    user: dict = Depends(current_user),
):
    """Save the PDF, then run extraction on a background job so the upload UI can show
    live progress. Returns { job_id, tender_id } immediately; poll
    GET /tenders/jobs/{job_id} until status=done, then load the tender. With ?sync=1 it
    blocks and returns { tender_id, requirement_count } (the original behaviour, used by
    the eval harness)."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF.")

    tender_id = f"tnd-{uuid.uuid4().hex[:8]}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    store.init_db()
    dest = UPLOAD_DIR / f"{tender_id}.pdf"
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    size_mb = dest.stat().st_size / (1024 * 1024)
    if size_mb > MAX_UPLOAD_MB:
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Maximum is {MAX_UPLOAD_MB} MB.",
        )

    resolved_title = title or file.filename

    if sync:
        try:
            resp = run_pipeline(str(dest), tender_id=tender_id, title=resolved_title)
        except PDFIngestError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Pipeline failed on this PDF: {exc}. The file may be corrupt or unsupported.",
            )
        store.save_tender(resp, filename=file.filename, owner=user["id"])
        return {"tender_id": tender_id, "requirement_count": len(resp.requirements)}

    job_id = f"job-{uuid.uuid4().hex[:8]}"
    _set_job(
        job_id, status="processing", stage="queued",
        message="Starting", progress=0.02, tender_id=tender_id, owner=user["id"],
    )
    threading.Thread(
        target=_run_extract_job,
        args=(job_id, str(dest), tender_id, resolved_title, file.filename, user["id"]),
        daemon=True,
    ).start()
    return {"job_id": job_id, "tender_id": tender_id}


@app.get("/tenders/jobs/{job_id}")
def get_job(job_id: str, user: dict = Depends(current_user)):
    """Live progress for an extraction job — poll this after upload. Returns the current
    stage / message / progress (0–1) + counts, and status: processing | done | error
    (with detail on error). Only the user who started the job can poll it."""
    with _JOBS_LOCK:
        snapshot = dict(JOBS[job_id]) if job_id in JOBS else None
    if snapshot is None or snapshot.get("owner") != user["id"]:
        raise HTTPException(status_code=404, detail="Job not found (it may have expired).")
    snapshot.pop("owner", None)  # internal — never sent to the client
    return {"job_id": job_id, **snapshot}


@app.get("/tenders/{tender_id}/requirements", response_model=TenderResponse)
def get_requirements(tender_id: str, user: dict = Depends(current_user)):
    """Return { tender_id, title, requirements: [...] } in the locked schema — only if
    the tender belongs to the signed-in user (else 404, so ownership can't be probed)."""
    if store.get_tender_owner(tender_id) != user["id"]:
        raise HTTPException(status_code=404, detail="Tender not found.")
    resp = store.get_tender(tender_id)
    if resp is None:
        raise HTTPException(status_code=404, detail="Tender not found.")
    return resp


@app.get("/tenders/{tender_id}/pdf")
def get_tender_pdf(
    tender_id: str,
    token: Optional[str] = None,          # accepted so an <iframe>/link can authenticate
    authorization: str = Header(None),
):
    """Serve the original uploaded PDF so the frontend can open the exact source page
    (e.g. /tenders/{id}/pdf#page=14 — browser PDF viewers honour the #page fragment).
    Inline, so the browser renders it in place rather than downloading. The PDF is
    persisted at upload time (data/uploads/{id}.pdf). Owner-scoped.

    A browser opening this in an <iframe> or a new tab can't set an Authorization
    header, so the bearer token is accepted as a `?token=` query param too."""
    raw = None
    if authorization and authorization.lower().startswith("bearer "):
        raw = authorization[7:].strip()
    elif token:
        raw = token
    user = auth.user_from_token(raw)
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to view this document.")
    # Our ids look like "tnd-<hex>"; guard against path traversal just in case.
    if not tender_id.replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid tender id.")
    if store.get_tender_owner(tender_id) != user["id"]:
        raise HTTPException(status_code=404, detail="Source PDF not available for this tender.")
    path = UPLOAD_DIR / f"{tender_id}.pdf"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Source PDF not available for this tender.")
    return FileResponse(
        path,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{tender_id}.pdf"'},
    )


DRAFT_CONCURRENCY = 8   # parallel LLM draft calls — keeps the live "Autofill with AI" snappy


@app.post("/tenders/{tender_id}/draft", response_model=TenderResponse)
async def draft_tender(
    tender_id: str,
    provider: Optional[str] = None,                       # "mock" | "openai" | None (env-driven)
    limit: Optional[int] = None,                          # draft only the top-N (gating-first) for speed
    files: Optional[List[UploadFile]] = File(None),       # optional capability docs (.txt/.pdf)
    user: dict = Depends(current_user),
):
    """Auditable autofill: draft a grounded answer per requirement from the bidder's
    capability docs — uploaded here, else the demo bidder — and persist them. Every claim
    is evidenced or the item is flagged needs_input; it never bluffs. Returns the enriched
    tender in the locked schema (answers + open_questions + capability_docs).

    Per-requirement LLM calls run concurrently; `?limit=N` drafts only the N most important
    (gating first) for a fast live demo, leaving the rest with their upload-time drafts."""
    if not pipeline._HAVE_ANSWER or not _HAVE_ANSWER_API:
        raise HTTPException(status_code=503, detail="Autofill engine not on this deployment's path.")
    if store.get_tender_owner(tender_id) != user["id"]:
        raise HTTPException(status_code=404, detail="Tender not found.")
    resp = store.get_tender(tender_id)
    if resp is None:
        raise HTTPException(status_code=404, detail="Tender not found.")

    folder = _save_capability_files(tender_id, files) if files else None
    try:
        answerer = _resolve_answerer(provider)
    except Exception as exc:  # e.g. OpenAI requested with no key
        raise HTTPException(status_code=503, detail=f"Answerer unavailable: {exc}")

    # Pick which requirements to (re)draft — gating first when capped. _autofill mutates
    # the chosen Requirement objects in place, so resp.requirements stays the full set.
    targets = resp.requirements
    if limit and limit > 0:
        targets = sorted(resp.requirements, key=lambda r: (not r.is_gating,))[:limit]

    _enriched, capability_docs = await run_in_threadpool(
        pipeline._autofill, targets, folder, answerer, DRAFT_CONCURRENCY
    )
    store.replace_drafts(tender_id, resp.requirements, capability_docs)
    return store.get_tender(tender_id)


@app.patch("/requirements/{req_id}", response_model=Requirement)
def update_requirement(req_id: str, update: DecisionUpdate,
                       user: dict = Depends(current_user)):
    """Update status + decision for one requirement — only on a tender the user owns."""
    if store.get_requirement_owner(req_id) != user["id"]:
        raise HTTPException(status_code=404, detail="Requirement not found.")
    req = store.update_requirement(req_id, update)
    if req is None:
        raise HTTPException(status_code=404, detail="Requirement not found.")
    return req
