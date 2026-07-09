"""Tender Breakdown API — FastAPI app.

Route shapes match the locked data contract in AGENTS.md so the frontend can swap
its mock data for these endpoints without UI changes.

Pipeline (ingest → chunk → extract → store) is scaffolded by J as backend cover.
Extraction is pluggable: heuristic with no key, Claude when ANTHROPIC_API_KEY is set.
"""

from __future__ import annotations

import asyncio
import json
import os
import shutil
import threading
import time
import uuid
import zipfile
from io import BytesIO
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

# Load backend/.env into os.environ before anything reads it (get_extractor(), the
# answerer, auth). Render/production sets env vars via its dashboard, not a .env file,
# so this is a no-op there — local dev is the only place a .env exists.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from .auth import current_user
from .extract import get_extractor
from .ingest import ingest_pdf, PDFIngestError, SUPPORTED_EXTENSIONS
from .pipeline import run_pipeline, run_pipeline_multi
from .schema import (
    Actor,
    AnswerUpdate,
    CommentCreate,
    DecisionUpdate,
    Requirement,
    ShareRequest,
    TeamCreate,
    TeamMemberRequest,
    TenderTeamRequest,
    TenderResponse,
)
from . import auth, events, pipeline, store

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


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


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


MAX_UPLOAD_MB = 50    # per file
MAX_PACK_MB = 150     # per tender pack (all files together)
MAX_ZIP_ENTRIES = 30          # a tender pack has a handful of documents, not hundreds
MAX_ZIP_UNCOMPRESSED_MB = 200  # zip-bomb guard: cap total uncompressed size before extracting
UPLOAD_ACCEPT_EXTENSIONS = SUPPORTED_EXTENSIONS | {".zip"}


def _expand_zip(raw: bytes, zip_filename: str) -> list[tuple[str, bytes]]:
    """Unzip a tender pack in memory into (basename, content) pairs — this is the file
    shape procurement portals actually deliver. Skips directories, hidden/system entries
    (__MACOSX, .DS_Store) and any extension ingest_document can't read, each with a clear
    note; never recurses into a nested .zip. Guards entry count and total uncompressed
    size against a zip bomb before reading any entry's bytes."""
    try:
        zf = zipfile.ZipFile(BytesIO(raw))
    except zipfile.BadZipFile as exc:
        raise HTTPException(status_code=400, detail=f"'{zip_filename}' is not a valid ZIP file.") from exc

    infos = [i for i in zf.infolist() if not i.is_dir()]
    if len(infos) > MAX_ZIP_ENTRIES:
        raise HTTPException(
            status_code=413,
            detail=f"'{zip_filename}' has too many files ({len(infos)}). Maximum is {MAX_ZIP_ENTRIES}.",
        )
    total_uncompressed = sum(i.file_size for i in infos)
    if total_uncompressed > MAX_ZIP_UNCOMPRESSED_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"'{zip_filename}' is too large uncompressed. Maximum is {MAX_ZIP_UNCOMPRESSED_MB} MB.",
        )

    out: list[tuple[str, bytes]] = []
    for info in infos:
        # Path(...).name strips any directory component — defends against a "zip slip"
        # entry (e.g. "../../etc/passwd") ever being used as a filesystem path.
        name = Path(info.filename).name
        if not name or name.startswith(".") or name.startswith("__MACOSX"):
            continue
        ext = Path(name).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            print(f"[upload] skipping unsupported entry '{info.filename}' inside {zip_filename}")
            continue
        out.append((name, zf.read(info)))
    return out


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


def _doc_progress_snapshot(docs, stage: str, active_index: int | None = None) -> list[dict]:
    """Per-file job progress for the upload UI. `active_index` is 1-based."""
    out = []
    for idx, (doc_id, _path, filename) in enumerate(docs, start=1):
        if active_index is None:
            doc_stage = stage
        elif idx < active_index:
            doc_stage = "done"
        elif idx == active_index:
            doc_stage = stage
        else:
            doc_stage = "queued"
        out.append({"doc_id": doc_id, "filename": filename, "stage": doc_stage})
    return out


def _run_extract_job(job_id: str, docs, tender_id: str, title: str, filename: str,
                     owner: str) -> None:
    """Run the pipeline over a tender pack on a background thread, streaming progress
    into JOBS. `docs` is a list of (doc_id, path, filename). The result is persisted
    under `owner`; the UI polls GET /tenders/jobs/{job_id} until status=done."""
    def on_progress(**ev) -> None:
        patch = dict(ev)
        stage = str(ev.get("stage") or "processing")
        doc_total = len(docs)
        doc_index = ev.get("doc_index")
        if isinstance(doc_index, int):
            patch["files_total"] = doc_total
            patch["files_done"] = max(0, min(doc_total, doc_index - 1))
            patch["docs"] = _doc_progress_snapshot(docs, stage, doc_index)
        elif stage == "reading" and ev.get("doc_total"):
            patch["files_total"] = doc_total
            patch["files_done"] = doc_total
            patch["docs"] = _doc_progress_snapshot(docs, "read")
        elif stage in {"chunking", "extract", "reconcile", "graph", "autofill"}:
            patch["files_total"] = doc_total
            patch["files_done"] = doc_total
            patch["docs"] = _doc_progress_snapshot(docs, stage)
        _set_job(job_id, status="processing", **patch)

    try:
        resp = run_pipeline_multi(docs, tender_id=tender_id, title=title, on_progress=on_progress)
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
            files_total=len(docs),
            files_done=len(docs),
            docs=_doc_progress_snapshot(docs, "done"),
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
            detail="We could not process this tender. The files may be corrupt or unsupported.",
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
    return {"token": token,
            "user": {"id": user["id"], "email": user["email"], "name": user.get("name")}}


@app.post("/auth/google", response_model=auth.AuthResponse)
def login_google(body: auth.GoogleLoginRequest):
    """Sign in with Google. Verify the Google ID token, then find-or-create the account
    for that email and issue our own bearer token — the same session the password path
    returns. A first-time email is auto-provisioned (unless GOOGLE_AUTO_PROVISION=0, which
    keeps it strictly invite-only). 503 when Google sign-in isn't configured on this deploy."""
    if auth.google_client_id() is None:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured.")
    claims = auth.verify_google_id_token(body.id_token)
    if claims is None:
        raise HTTPException(status_code=401, detail="Google sign-in could not be verified.")
    store.init_db()
    user = store.get_user_by_email(claims["email"])
    if user is None:
        if not auth.google_auto_provision():
            raise HTTPException(
                status_code=403,
                detail="No Bidframe account for this Google email. Ask an admin for access.",
            )
        store.create_user(
            user_id=f"usr-{uuid.uuid4().hex[:10]}",
            email=claims["email"],
            password_hash=auth.GOOGLE_PASSWORD_SENTINEL,
            created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            name=claims.get("name"),
        )
        user = store.get_user_by_email(claims["email"])
    token = auth.create_token(user["id"])
    return {"token": token,
            "user": {"id": user["id"], "email": user["email"], "name": user.get("name")}}


@app.get("/auth/me", response_model=auth.AuthUser)
def me(user: dict = Depends(current_user)):
    """Return the signed-in account — the frontend calls this on load to confirm the
    stored token is still valid before showing the app."""
    return {"id": user["id"], "email": user["email"], "name": user.get("name")}


@app.get("/tenders")
def list_tenders(user: dict = Depends(current_user)):
    """List the signed-in user's uploaded tenders (id, title, requirement count)."""
    return store.list_tenders(owner=user["id"])


@app.post("/tenders/upload")
async def upload_tender(
    files: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None),   # legacy single-file field (back-compat)
    title: str = Form(None),
    sync: bool = False,   # ?sync=1 → block until done (eval harness / back-compat)
    user: dict = Depends(current_user),
):
    """Save the tender pack (one or more PDFs) under data/uploads/{tender_id}/, then run
    extraction on a background job so the UI can show live progress. Returns
    { job_id, tender_id } immediately; poll GET /tenders/jobs/{job_id} until status=done,
    then load the tender. Accepts either a `files` pack or a single legacy `file`. ?sync=1
    blocks and returns { tender_id, requirement_count } (eval-harness / back-compat).
    Owner-scoped: the pack is saved under the signed-in user."""
    all_files = list(files or [])
    if file is not None:
        all_files.append(file)
    all_files = [f for f in all_files if f and f.filename]
    if not all_files:
        raise HTTPException(status_code=400, detail="Please upload at least one document.")
    for f in all_files:
        if Path(f.filename).suffix.lower() not in UPLOAD_ACCEPT_EXTENSIONS:
            supported = ", ".join(sorted(UPLOAD_ACCEPT_EXTENSIONS))
            raise HTTPException(
                status_code=400,
                detail=f"'{f.filename}' is not a supported file type. Supported: {supported}.",
            )

    # Expand any .zip pack into its contained supported entries — this is the single
    # file procurement portals actually deliver a tender pack as. A plain (non-zip)
    # upload just passes through unchanged. Reads each UploadFile fully into memory
    # (bounded by the per-file/pack size checks below), which .zip expansion needs anyway.
    expanded: list[tuple[str, bytes]] = []   # (filename, content)
    for f in all_files:
        raw = f.file.read()
        if Path(f.filename).suffix.lower() == ".zip":
            entries = _expand_zip(raw, f.filename)
            if not entries:
                raise HTTPException(
                    status_code=400,
                    detail=f"'{f.filename}' contains no supported files (.pdf/.docx/.xlsx/.csv).",
                )
            expanded.extend(entries)
        else:
            expanded.append((f.filename, raw))

    tender_id = f"tnd-{uuid.uuid4().hex[:8]}"
    folder = UPLOAD_DIR / tender_id
    folder.mkdir(parents=True, exist_ok=True)
    store.init_db()

    docs: list = []   # (doc_id, path, filename)
    total_mb = 0.0
    for i, (name, raw) in enumerate(expanded, start=1):
        doc_id = f"d{i}"
        ext = Path(name).suffix.lower()
        dest = folder / f"{doc_id}{ext}"
        dest.write_bytes(raw)
        mb = len(raw) / (1024 * 1024)
        total_mb += mb
        if mb > MAX_UPLOAD_MB:
            shutil.rmtree(folder, ignore_errors=True)
            raise HTTPException(
                status_code=413,
                detail=f"'{name}' is too large ({mb:.1f} MB). Maximum is {MAX_UPLOAD_MB} MB per file.",
            )
        docs.append((doc_id, str(dest), name))
    if total_mb > MAX_PACK_MB:
        shutil.rmtree(folder, ignore_errors=True)
        raise HTTPException(
            status_code=413,
            detail=f"This pack is too large ({total_mb:.1f} MB). Maximum is {MAX_PACK_MB} MB in total.",
        )

    resolved_title = title or all_files[0].filename

    if sync:
        try:
            resp = run_pipeline_multi(docs, tender_id=tender_id, title=resolved_title)
        except PDFIngestError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Pipeline failed: {exc}. The files may be corrupt or unsupported.",
            )
        store.save_tender(resp, filename=all_files[0].filename, owner=user["id"])
        return {"tender_id": tender_id, "requirement_count": len(resp.requirements)}

    job_id = f"job-{uuid.uuid4().hex[:8]}"
    _set_job(
        job_id, status="processing", stage="queued",
        message="Starting", progress=0.02, tender_id=tender_id, owner=user["id"],
        files_total=len(docs), files_done=0, docs=_doc_progress_snapshot(docs, "queued"),
    )
    threading.Thread(
        target=_run_extract_job,
        args=(job_id, docs, tender_id, resolved_title, all_files[0].filename, user["id"]),
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
    """Return { tender_id, title, requirements: [...] } in the locked schema — only if the
    signed-in user owns the tender OR has been shared into it (else 404, so it can't be probed)."""
    if not store.can_access(tender_id, user["id"]):
        raise HTTPException(status_code=404, detail="Tender not found.")
    resp = store.get_tender(tender_id)
    if resp is None:
        raise HTTPException(status_code=404, detail="Tender not found.")
    return resp


@app.get("/tenders/{tender_id}/members")
def list_tender_members(tender_id: str, user: dict = Depends(current_user)):
    """Everyone with access to a tender — the owner + shared members (with names). Any member
    can view the list so collaborators can see who else is on the tender."""
    if not store.can_access(tender_id, user["id"]):
        raise HTTPException(status_code=404, detail="Tender not found.")
    return {"members": store.list_members(tender_id)}


@app.get("/tenders/{tender_id}/activity")
def list_tender_activity(tender_id: str, user: dict = Depends(current_user)):
    """Append-only collaboration timeline for a tender. Unlike the current row state,
    this does not collapse earlier edits when a later teammate approves the row."""
    if not store.can_access(tender_id, user["id"]):
        raise HTTPException(status_code=404, detail="Tender not found.")
    return {"events": store.list_decision_events(tender_id)}


@app.post("/tenders/{tender_id}/share")
def share_tender(tender_id: str, body: ShareRequest, user: dict = Depends(current_user)):
    """Grant a registered user access to this tender by email (owner-only). Returns the updated
    member list. 404 if you don't own it (so ownership can't be probed); clear 404 if the email
    isn't a Bidframe account (invite-only — no silent share)."""
    if store.get_tender_owner(tender_id) != user["id"]:
        raise HTTPException(status_code=404, detail="Tender not found.")
    target = store.get_user_by_email(body.email)
    if target is None:
        raise HTTPException(status_code=404, detail=f"No Bidframe account for {body.email}.")
    if target["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="You already own this tender.")
    store.add_member(tender_id, target["id"], _now_iso())
    members = store.list_members(tender_id)
    events.publish(tender_id, {"type": "members", "members": members})
    return {"members": members}


# ---- Teams (persistent collaboration groups) ---------------------------------

@app.post("/teams")
def create_team(body: TeamCreate, user: dict = Depends(current_user)):
    """Create a team. The caller becomes its owner and first member. Add teammates with
    POST /teams/{id}/members, then share tenders to the team so everyone sees them."""
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Give the team a name.")
    team_id = f"team-{uuid.uuid4().hex[:8]}"
    store.create_team(team_id, name, user["id"], _now_iso())
    return {"team": store.get_team(team_id), "members": store.list_team_members(team_id)}


@app.get("/teams")
def list_teams(user: dict = Depends(current_user)):
    """The teams the signed-in user owns or belongs to (with member counts + their role)."""
    return {"teams": store.list_teams_for_user(user["id"])}


@app.get("/teams/{team_id}/members")
def list_team_members(team_id: str, user: dict = Depends(current_user)):
    """Everyone in a team. Any member can view the roster; a non-member gets 404 so team
    membership can't be probed."""
    if not store.is_team_member(team_id, user["id"]):
        raise HTTPException(status_code=404, detail="Team not found.")
    return {"members": store.list_team_members(team_id)}


@app.post("/teams/{team_id}/members")
def add_team_member(team_id: str, body: TeamMemberRequest, user: dict = Depends(current_user)):
    """Add a registered user to a team by email (owner-only). Same invite-only rule as
    tender sharing — the target must already have a Bidframe account (Google sign-in
    creates one), so there's no silent invite to a stranger."""
    if not store.is_team_owner(team_id, user["id"]):
        raise HTTPException(status_code=404, detail="Team not found.")
    target = store.get_user_by_email(body.email)
    if target is None:
        raise HTTPException(status_code=404, detail=f"No Bidframe account for {body.email}.")
    store.add_team_member(team_id, target["id"], _now_iso())
    return {"members": store.list_team_members(team_id)}


@app.delete("/teams/{team_id}/members/{member_id}")
def remove_team_member(team_id: str, member_id: str, user: dict = Depends(current_user)):
    """Remove a member from a team (owner-only). The owner can't be removed."""
    if not store.is_team_owner(team_id, user["id"]):
        raise HTTPException(status_code=404, detail="Team not found.")
    team = store.get_team(team_id)
    if team and team["owner_id"] == member_id:
        raise HTTPException(status_code=400, detail="The team owner can't be removed.")
    store.remove_team_member(team_id, member_id)
    return {"members": store.list_team_members(team_id)}


@app.post("/tenders/{tender_id}/team")
def share_tender_with_team(tender_id: str, body: TenderTeamRequest, user: dict = Depends(current_user)):
    """Share a tender with a team, so every team member can open + decide on it (owner-only).
    Pass team_id=null to unshare. You must own the tender AND belong to the target team."""
    if store.get_tender_owner(tender_id) != user["id"]:
        raise HTTPException(status_code=404, detail="Tender not found.")
    if body.team_id is not None and not store.is_team_member(body.team_id, user["id"]):
        raise HTTPException(status_code=404, detail="Team not found.")
    store.set_tender_team(tender_id, body.team_id)
    events.publish(tender_id, {"type": "members", "members": store.list_members(tender_id)})
    return {"tender_id": tender_id, "team_id": body.team_id}


@app.delete("/tenders/{tender_id}/share")
def unshare_tender(tender_id: str, body: ShareRequest, user: dict = Depends(current_user)):
    """Remove a registered user's shared access to this tender (owner-only)."""
    if store.get_tender_owner(tender_id) != user["id"]:
        raise HTTPException(status_code=404, detail="Tender not found.")
    target = store.get_user_by_email(body.email)
    if target is None:
        raise HTTPException(status_code=404, detail=f"No Bidframe account for {body.email}.")
    if target["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot remove the tender owner.")
    store.remove_member(tender_id, target["id"])
    return {"members": store.list_members(tender_id)}


@app.get("/tenders/{tender_id}/pdf")
def get_tender_pdf(
    tender_id: str,
    doc: str = "d1",
    token: Optional[str] = None,          # accepted so an <iframe>/link can authenticate
    authorization: str = Header(None),
):
    """Serve a source PDF from the tender pack, inline, so the frontend can open the exact
    source page (e.g. /tenders/{id}/pdf?doc=d2#page=14 — browser PDF viewers honour the
    #page fragment). Each document in the pack is persisted at upload time as
    data/uploads/{id}/{doc}.pdf; `doc` defaults to the first document. Owner-scoped.

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
    # Ids look like "tnd-<hex>" and doc like "d<n>"; guard against path traversal.
    if not tender_id.replace("-", "").isalnum() or not doc.isalnum():
        raise HTTPException(status_code=400, detail="Invalid id.")
    if not store.can_access(tender_id, user["id"]):
        raise HTTPException(status_code=404, detail="Source PDF not available for this tender.")
    path = UPLOAD_DIR / tender_id / f"{doc}.pdf"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Source PDF not available for this tender.")
    return FileResponse(
        path,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{tender_id}-{doc}.pdf"'},
    )


_SOURCE_MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
}


@app.get("/tenders/{tender_id}/source")
def get_tender_source_file(
    tender_id: str,
    doc: str = "d1",
    token: Optional[str] = None,          # accepted so an <iframe>/fetch can authenticate
    authorization: str = Header(None),
):
    """Serve any document in a tender pack — PDF, DOCX, XLSX or CSV — inline in its
    native format, so the frontend can render + highlight the real DOCX/XLSX/CSV
    alongside the existing PDF proof view instead of showing only the extracted
    excerpt as plain text. Same auth (bearer header or ?token=) and path-traversal
    guard as /tenders/{id}/pdf; looks up whichever extension is actually stored for
    `doc` since main.py keeps each upload's original suffix (d1.pdf, d2.docx, ...)."""
    raw = None
    if authorization and authorization.lower().startswith("bearer "):
        raw = authorization[7:].strip()
    elif token:
        raw = token
    user = auth.user_from_token(raw)
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to view this document.")
    if not tender_id.replace("-", "").isalnum() or not doc.isalnum():
        raise HTTPException(status_code=400, detail="Invalid id.")
    if store.get_tender_owner(tender_id) != user["id"]:
        raise HTTPException(status_code=404, detail="Source document not available for this tender.")
    folder = UPLOAD_DIR / tender_id
    for ext, media_type in _SOURCE_MEDIA_TYPES.items():
        path = folder / f"{doc}{ext}"
        if path.is_file():
            return FileResponse(
                path,
                media_type=media_type,
                headers={"Content-Disposition": f'inline; filename="{tender_id}-{doc}{ext}"'},
            )
    raise HTTPException(status_code=404, detail="Source document not available for this tender.")


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
    if not store.can_access(tender_id, user["id"]):
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
    """Update status + decision for one requirement — on a tender the user owns OR is shared
    into. The decision's `actor` is stamped server-side from the signed-in user (never trusted
    from the client), so collaboration attribution ("Approved by …") can't be forged."""
    if not store.can_access_requirement(req_id, user["id"]):
        raise HTTPException(status_code=404, detail="Requirement not found.")
    if update.decision is not None:
        update.decision.actor = Actor(
            id=user["id"], email=user["email"], name=user.get("name")
        )
    tender_id = store.get_requirement_tender_id(req_id)
    req = store.update_requirement(req_id, update)
    if req is None:
        raise HTTPException(status_code=404, detail="Requirement not found.")
    if tender_id is not None:
        decision = update.decision
        action = decision.action if decision is not None else (update.status or "update")
        note = decision.note if decision is not None else None
        timestamp = (
            decision.timestamp if decision is not None and decision.timestamp
            else time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        )
        store.append_decision_event(
            event_id=f"evt-{uuid.uuid4().hex[:12]}",
            tender_id=tender_id,
            req_id=req_id,
            actor_id=user["id"],
            action=action,
            note=note,
            timestamp=timestamp,
        )
        # Live collaboration: teammates viewing this tender see the decision immediately.
        events.publish(tender_id, {
            "type": "requirement",
            "req_id": req.id,
            "status": req.status,
            "decision": req.decision.model_dump() if req.decision else None,
        })
    return req


@app.patch("/requirements/{req_id}/answer", response_model=Requirement)
def update_requirement_answer(req_id: str, update: AnswerUpdate,
                              user: dict = Depends(current_user)):
    """Persist human-authored answer content — answer text, gap answers, and the answer
    verdict — for one requirement, on a tender the user owns OR is shared into. This is the
    piece that used to live only in the browser's localStorage; with it, a pilot user's
    drafted answers survive across devices and are visible to collaborators.

    The answer verdict's `actor` is stamped server-side from the signed-in user (never trusted
    from the client), exactly like a requirement decision. The requirement's own status/decision
    is NOT touched here — the two tracks stay independent (PATCH /requirements/{id} owns that)."""
    if not store.can_access_requirement(req_id, user["id"]):
        raise HTTPException(status_code=404, detail="Requirement not found.")
    if update.decision is not None:
        update.decision.actor = Actor(
            id=user["id"], email=user["email"], name=user.get("name")
        )
    tender_id = store.get_requirement_tender_id(req_id)
    req = store.update_answer(req_id, update)
    if req is None:
        raise HTTPException(status_code=404, detail="Requirement not found.")
    # Live collaboration: teammates viewing this tender see the answer change immediately.
    if tender_id is not None:
        events.publish(tender_id, {
            "type": "answer",
            "req_id": req.id,
            "answer": req.answer.model_dump() if req.answer else None,
            "open_questions": [q.model_dump() for q in req.open_questions],
        })
    return req


# ---- Comments (per-requirement collaboration) --------------------------------

@app.get("/requirements/{req_id}/comments")
def get_comments(req_id: str, user: dict = Depends(current_user)):
    """All team comments on a requirement (oldest first). Visible to anyone who can access
    the tender — owner, shared member, or team member; else 404."""
    if not store.can_access_requirement(req_id, user["id"]):
        raise HTTPException(status_code=404, detail="Requirement not found.")
    return {"comments": store.list_comments(req_id)}


@app.post("/requirements/{req_id}/comments")
def post_comment(req_id: str, body: CommentCreate, user: dict = Depends(current_user)):
    """Add a team comment to a requirement. Author is stamped server-side (never trusted
    from the client), and the new comment is broadcast live to everyone on the tender."""
    if not store.can_access_requirement(req_id, user["id"]):
        raise HTTPException(status_code=404, detail="Requirement not found.")
    text = (body.body or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Write a comment first.")
    tender_id = store.get_requirement_tender_id(req_id)
    comment = store.add_comment(
        comment_id=f"cmt-{uuid.uuid4().hex[:10]}",
        req_id=req_id,
        tender_id=tender_id or "",
        author_id=user["id"],
        author_name=user.get("name") or user["email"],
        body=text,
        created_at=_now_iso(),
    )
    if tender_id:
        events.publish(tender_id, {"type": "comment", "comment": comment})
    return comment


# ---- Live collaboration stream (SSE) -----------------------------------------

@app.get("/tenders/{tender_id}/events")
async def tender_events(
    tender_id: str,
    token: Optional[str] = None,          # a plain EventSource can't set an Authorization header
    authorization: str = Header(None),
):
    """Server-Sent Events stream of live collaboration on a tender: decisions, comments and
    membership changes as they happen. Auth via `?token=` (EventSource can't send headers),
    owner/member/team-scoped. Emits a heartbeat every 20s so proxies keep the stream open."""
    raw = None
    if authorization and authorization.lower().startswith("bearer "):
        raw = authorization[7:].strip()
    elif token:
        raw = token
    user = auth.user_from_token(raw)
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to watch this tender.")
    if not store.can_access(tender_id, user["id"]):
        raise HTTPException(status_code=404, detail="Tender not found.")

    async def stream():
        queue = events.subscribe(tender_id)
        try:
            yield ": connected\n\n"   # opening comment flushes headers immediately
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=20.0)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"   # heartbeat keeps intermediaries from closing the idle stream
                    continue
                yield f"data: {json.dumps(event)}\n\n"
        finally:
            events.unsubscribe(tender_id, queue)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
