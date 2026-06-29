"""Tender Breakdown API — FastAPI app.

Route shapes match the locked data contract in AGENTS.md so the frontend can swap
its mock data for these endpoints without UI changes.

Pipeline (ingest → chunk → extract → store) is scaffolded by J as backend cover.
Extraction is pluggable: heuristic with no key, Claude when ANTHROPIC_API_KEY is set.
"""

from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

from .extract import get_extractor
from .ingest import ingest_pdf, PDFIngestError
from .pipeline import run_pipeline
from .schema import DecisionUpdate, Requirement, TenderResponse
from . import pipeline, store

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


@app.get("/health")
def health():
    return {"status": "ok", "extractor": get_extractor().name}


@app.get("/tenders")
def list_tenders():
    """List all uploaded tenders (id, title, requirement count). Useful for the frontend
    to show previously processed tenders without re-uploading."""
    return store.list_tenders()


@app.post("/tenders/upload")
async def upload_tender(file: UploadFile = File(...), title: str = Form(None)):
    """Ingest a PDF, run the extraction pipeline, persist, return { tender_id }."""
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

    try:
        resp = run_pipeline(
            str(dest), tender_id=tender_id, title=title or file.filename
        )
    except PDFIngestError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline failed on this PDF: {exc}. The file may be corrupt or unsupported.",
        )
    store.save_tender(resp, filename=file.filename)
    return {"tender_id": tender_id, "requirement_count": len(resp.requirements)}


@app.get("/tenders/{tender_id}/requirements", response_model=TenderResponse)
def get_requirements(tender_id: str):
    """Return { tender_id, title, requirements: [...] } in the locked schema."""
    resp = store.get_tender(tender_id)
    if resp is None:
        raise HTTPException(status_code=404, detail="Tender not found.")
    return resp


DRAFT_CONCURRENCY = 8   # parallel LLM draft calls — keeps the live "Autofill with AI" snappy


@app.post("/tenders/{tender_id}/draft", response_model=TenderResponse)
async def draft_tender(
    tender_id: str,
    provider: Optional[str] = None,                       # "mock" | "openai" | None (env-driven)
    limit: Optional[int] = None,                          # draft only the top-N (gating-first) for speed
    files: Optional[List[UploadFile]] = File(None),       # optional capability docs (.txt/.pdf)
):
    """Auditable autofill: draft a grounded answer per requirement from the bidder's
    capability docs — uploaded here, else the demo bidder — and persist them. Every claim
    is evidenced or the item is flagged needs_input; it never bluffs. Returns the enriched
    tender in the locked schema (answers + open_questions + capability_docs).

    Per-requirement LLM calls run concurrently; `?limit=N` drafts only the N most important
    (gating first) for a fast live demo, leaving the rest with their upload-time drafts."""
    if not pipeline._HAVE_ANSWER or not _HAVE_ANSWER_API:
        raise HTTPException(status_code=503, detail="Autofill engine not on this deployment's path.")
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
def update_requirement(req_id: str, update: DecisionUpdate):
    """Update status + decision for one requirement."""
    req = store.update_requirement(req_id, update)
    if req is None:
        raise HTTPException(status_code=404, detail="Requirement not found.")
    return req
