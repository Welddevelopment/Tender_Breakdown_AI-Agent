"""worker.py — the durable extraction/draft worker (production queue consumer).

Replaces the in-memory JOBS registry + background threads: a job is a ROW in Supabase
Postgres, so it survives restarts and deploys, N workers never double-claim (FOR UPDATE
SKIP LOCKED), and a worker that dies mid-job is healed by the stale-claim watchdog.
The UI watches the job row over Supabase Realtime — every progress write here streams
straight to the uploader's ProcessingView.

    python -m worker            # from backend/, or the `worker` process on Fly

Env (service credentials — this process bypasses RLS by design, it serves every org):
    DATABASE_URL                Supabase Postgres connection string
    SUPABASE_URL                https://<project>.supabase.co   (Storage REST)
    SUPABASE_SERVICE_ROLE_KEY   Storage download auth
plus the existing engine keys (OPENAI_API_KEY etc.).

Design: docs/superpowers/specs/2026-07-08-production-clerk-supabase-design.md
"""

from __future__ import annotations

import json
import os
import tempfile
import time
import traceback
from pathlib import Path

import httpx
import psycopg
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

# Imported repo-root style (`python -m backend.worker`), matching the Docker image's
# /app workdir and the engine tests — backend/ AND engine/ are both importable then.
from backend.app.ingest import PDFIngestError, SUPPORTED_EXTENSIONS  # noqa: E402
from backend.app.main import _expand_zip  # noqa: E402  (zip-bomb-guarded expansion)
from backend.app.pipeline import run_pipeline_multi  # noqa: E402
from backend.app.schema import Requirement, TenderResponse  # noqa: E402

POLL_SECONDS = 3          # idle wait between claim attempts
STALE_MINUTES = 20        # a running job silent this long is presumed dead → requeue
BUCKET = "tender-docs"

# Requirement columns as they land in the requirements table (the locked wire schema).
_REQ_COLUMNS = [
    "req_id", "text", "source_page", "source_clause", "source_excerpt", "type",
    "is_gating", "category", "confidence", "status", "needs_review", "decision",
    "criteria_ref", "depends_on", "draft_answer", "answer", "open_questions",
    "source_doc_id", "source_filename", "source_rect", "source_rect_match",
]
_JSONB_FIELDS = {"decision", "depends_on", "answer", "open_questions", "source_rect"}


def _dsn() -> str:
    dsn = os.environ.get("DATABASE_URL", "").strip()
    if not dsn:
        raise SystemExit("worker: DATABASE_URL is not set — see docs/setup-production.md")
    return dsn


def requirement_to_params(req: Requirement) -> dict:
    """One requirement → the insert params for its row. jsonb fields serialised;
    req_id maps from the wire schema's `id`."""
    data = req.model_dump()
    params: dict = {"req_id": data.pop("id")}
    for col in _REQ_COLUMNS:
        if col == "req_id":
            continue
        value = data.get(col)
        params[col] = json.dumps(value) if col in _JSONB_FIELDS and value is not None else value
    return params


def row_to_requirement(row: dict) -> Requirement:
    """A requirements row → the locked-schema Requirement (for draft jobs, which
    re-run autofill over what's already extracted)."""
    data = {k: row[k] for k in _REQ_COLUMNS if k in row}
    data["id"] = data.pop("req_id")
    return Requirement(**data)


# ---- Storage (service role) ---------------------------------------------------------

def download_doc(path: str, dest: Path) -> None:
    url = f"{os.environ['SUPABASE_URL']}/storage/v1/object/{BUCKET}/{path}"
    headers = {"Authorization": f"Bearer {os.environ['SUPABASE_SERVICE_ROLE_KEY']}"}
    with httpx.stream("GET", url, headers=headers, timeout=120) as resp:
        resp.raise_for_status()
        with dest.open("wb") as out:
            for chunk in resp.iter_bytes():
                out.write(chunk)


# ---- Queue primitives ----------------------------------------------------------------

def claim_job(conn: psycopg.Connection) -> dict | None:
    """Claim the oldest queued job, or None. SKIP LOCKED means N workers coexist
    without ever double-claiming; the claim + attempt bump is one atomic statement."""
    row = conn.execute(
        """
        UPDATE jobs
           SET status = 'running', claimed_at = now(), attempts = attempts + 1
         WHERE id = (
                SELECT id FROM jobs
                 WHERE status = 'queued'
                 ORDER BY created_at
                 LIMIT 1
                 FOR UPDATE SKIP LOCKED
               )
        RETURNING id, org_id, tender_id, kind, payload, attempts, max_attempts
        """
    ).fetchone()
    conn.commit()
    if row is None:
        return None
    keys = ["id", "org_id", "tender_id", "kind", "payload", "attempts", "max_attempts"]
    return dict(zip(keys, row))


def requeue_stale(conn: psycopg.Connection) -> None:
    """The watchdog: a running job whose worker died gets requeued (attempts left)
    or failed honestly (attempts exhausted) — never stuck at 'running' forever."""
    conn.execute(
        """
        UPDATE jobs SET status = 'queued', claimed_at = NULL
         WHERE status = 'running'
           AND claimed_at < now() - make_interval(mins => %s)
           AND attempts < max_attempts
        """,
        (STALE_MINUTES,),
    )
    conn.execute(
        """
        UPDATE jobs
           SET status = 'error',
               error = 'The worker processing this job stopped responding.'
         WHERE status = 'running'
           AND claimed_at < now() - make_interval(mins => %s)
           AND attempts >= max_attempts
        """,
        (STALE_MINUTES,),
    )
    conn.execute(
        """
        UPDATE tenders SET status = 'failed', error = j.error
          FROM jobs j
         WHERE j.tender_id = tenders.id AND j.status = 'error'
           AND tenders.status = 'processing'
        """
    )
    conn.commit()


def write_progress(conn: psycopg.Connection, job_id: str, **fields) -> None:
    conn.execute(
        "UPDATE jobs SET progress = progress || %s::jsonb WHERE id = %s",
        (json.dumps(fields), job_id),
    )
    conn.commit()


def finish_job(conn: psycopg.Connection, job_id: str, tender_id: str,
               error: str | None) -> None:
    if error is None:
        conn.execute("UPDATE jobs SET status = 'done' WHERE id = %s", (job_id,))
        conn.execute(
            "UPDATE tenders SET status = 'ready', error = NULL WHERE id = %s",
            (tender_id,),
        )
    else:
        conn.execute(
            "UPDATE jobs SET status = 'error', error = %s WHERE id = %s",
            (error, job_id),
        )
        conn.execute(
            "UPDATE tenders SET status = 'failed', error = %s WHERE id = %s",
            (error, tender_id),
        )
    conn.commit()


# ---- Job handlers ----------------------------------------------------------------------

def persist_tender(conn: psycopg.Connection, job: dict, resp: TenderResponse) -> None:
    """Write the pipeline's output: replace the tender's requirements and fill the
    envelope columns. One transaction — a crash mid-write leaves the previous state."""
    with conn.transaction():
        conn.execute(
            "DELETE FROM requirements WHERE tender_id = %s", (job["tender_id"],)
        )
        for seq, req in enumerate(resp.requirements):
            params = requirement_to_params(req)
            params.update(tender_id=job["tender_id"], org_id=job["org_id"], seq=seq)
            cols = ["tender_id", "org_id", "seq", *_REQ_COLUMNS]
            conn.execute(
                f"INSERT INTO requirements ({', '.join(cols)}) "
                f"VALUES ({', '.join('%(' + c + ')s' for c in cols)})",
                params,
            )
        conn.execute(
            "UPDATE tenders SET source_docs = %s::jsonb, award_criteria = %s::jsonb, "
            "capability_docs = %s::jsonb, title = COALESCE(NULLIF(%s, ''), title) "
            "WHERE id = %s",
            (
                json.dumps([sd.model_dump() for sd in resp.source_docs]),
                json.dumps([ac.model_dump() for ac in resp.award_criteria]),
                json.dumps([cd.model_dump() for cd in resp.capability_docs]),
                resp.title or "",
                job["tender_id"],
            ),
        )


def run_extract(conn: psycopg.Connection, job: dict) -> None:
    payload = job["payload"] or {}
    docs_meta = payload.get("docs") or []
    title = payload.get("title") or "Tender"
    if not docs_meta:
        raise ValueError("Job has no documents to process.")

    def on_progress(**ev) -> None:
        write_progress(conn, job["id"], stage="processing", **ev)

    with tempfile.TemporaryDirectory() as tmp:
        # Download the pack; expand any .zip into its supported entries (the shape
        # procurement portals deliver), same guarded expansion the API used.
        docs: list[tuple[str, str, str]] = []  # (doc_id, path, filename)
        idx = 0
        write_progress(conn, job["id"], stage="downloading",
                       message="Fetching the tender pack", progress=0.02)
        for meta in docs_meta:
            raw_path = Path(tmp) / Path(meta["path"]).name
            download_doc(meta["path"], raw_path)
            if raw_path.suffix.lower() == ".zip":
                for name, content in _expand_zip(raw_path.read_bytes(), meta["filename"]):
                    idx += 1
                    dest = Path(tmp) / f"d{idx}{Path(name).suffix.lower()}"
                    dest.write_bytes(content)
                    docs.append((f"d{idx}", str(dest), name))
            else:
                if raw_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                    continue
                idx += 1
                docs.append((f"d{idx}", str(raw_path), meta["filename"]))
        if not docs:
            raise ValueError("No supported documents in this pack (.pdf/.docx/.xlsx/.csv).")

        resp = run_pipeline_multi(
            docs, tender_id=str(job["tender_id"]), title=title, on_progress=on_progress
        )
    persist_tender(conn, job, resp)
    write_progress(
        conn, job["id"], stage="done", message="Ready", progress=1.0,
        requirement_count=len(resp.requirements),
        deal_breaker_count=sum(1 for r in resp.requirements if r.is_gating),
    )


def run_draft(conn: psycopg.Connection, job: dict) -> None:
    """Auditable autofill as a queue job: re-draft grounded answers over the tender's
    stored requirements, then write them back. Uses the same engine path the old
    /draft endpoint did."""
    from backend.app import pipeline as pl
    from engine.answer import get_answerer, MockAnswerer, OpenAIAnswerer

    payload = job["payload"] or {}
    provider = payload.get("provider")
    limit = payload.get("limit")
    answerer = (
        MockAnswerer() if provider == "mock"
        else OpenAIAnswerer() if provider == "openai"
        else get_answerer()
    )

    cols = ", ".join(_REQ_COLUMNS)
    rows = conn.execute(
        f"SELECT {cols} FROM requirements WHERE tender_id = %s ORDER BY seq",
        (job["tender_id"],),
    ).fetchall()
    names = _REQ_COLUMNS
    requirements = [row_to_requirement(dict(zip(names, r))) for r in rows]
    if not requirements:
        raise ValueError("Nothing to draft — the tender has no requirements yet.")

    targets = requirements
    if isinstance(limit, int) and limit > 0:
        targets = sorted(requirements, key=lambda r: (not r.is_gating,))[:limit]

    write_progress(conn, job["id"], stage="drafting",
                   message="Drafting grounded answers", progress=0.1)
    _enriched, capability_docs = pl._autofill(targets, None, answerer, 8)

    with conn.transaction():
        for req in requirements:
            conn.execute(
                "UPDATE requirements SET draft_answer = %s, answer = %s::jsonb, "
                "open_questions = %s::jsonb WHERE tender_id = %s AND req_id = %s",
                (
                    req.draft_answer,
                    json.dumps(req.answer.model_dump()) if req.answer else None,
                    json.dumps([q.model_dump() for q in req.open_questions]),
                    job["tender_id"],
                    req.id,
                ),
            )
        conn.execute(
            "UPDATE tenders SET capability_docs = %s::jsonb WHERE id = %s",
            (json.dumps([cd.model_dump() for cd in capability_docs]), job["tender_id"]),
        )
    write_progress(conn, job["id"], stage="done", message="Answers drafted", progress=1.0)


# ---- Main loop --------------------------------------------------------------------------

def process_one(conn: psycopg.Connection, job: dict) -> None:
    print(f"[worker] claimed {job['kind']} job {job['id']} (attempt {job['attempts']})")
    try:
        if job["kind"] == "draft":
            run_draft(conn, job)
        else:
            run_extract(conn, job)
        finish_job(conn, job["id"], job["tender_id"], None)
        print(f"[worker] done {job['id']}")
    except PDFIngestError as exc:
        finish_job(conn, job["id"], job["tender_id"], str(exc))
        print(f"[worker] ingest error {job['id']}: {exc}")
    except Exception as exc:  # calm message out, real detail to the log
        traceback.print_exc()
        finish_job(
            conn, job["id"], job["tender_id"],
            "We could not process this tender. The files may be corrupt or unsupported."
        )
        print(f"[worker] failed {job['id']}: {exc}")


def main() -> None:
    print("[worker] starting — queue consumer on", os.environ.get("SUPABASE_URL", "?"))
    last_watchdog = 0.0
    while True:
        try:
            with psycopg.connect(_dsn()) as conn:
                while True:
                    if time.monotonic() - last_watchdog > 60:
                        requeue_stale(conn)
                        last_watchdog = time.monotonic()
                    job = claim_job(conn)
                    if job is None:
                        time.sleep(POLL_SECONDS)
                        continue
                    process_one(conn, job)
        except KeyboardInterrupt:
            print("[worker] stopping")
            return
        except Exception as exc:
            # Connection drop or similar — back off and reconnect rather than die.
            print(f"[worker] connection error, retrying in 10s: {exc}")
            time.sleep(10)


if __name__ == "__main__":
    main()
