"""store.py — SQLite persistence (stdlib sqlite3, zero-config).

Persists tenders + their requirements, and updates a requirement's status/decision.
Requirements are stored as JSON blobs keyed by id so the schema can evolve without
migrations during the hackathon. The DB file is gitignored (*.db).

Scaffolded by J as backend cover. Backend can swap to SQLAlchemy later if wanted.
"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from .schema import CapabilityDoc, DecisionUpdate, Requirement, TenderResponse


def _db_path() -> Path:
    # Accept DATABASE_URL=sqlite:///./tender.db (default) or a bare path.
    url = os.environ.get("DATABASE_URL", "sqlite:///./tender.db")
    if url.startswith("sqlite:///"):
        url = url[len("sqlite:///"):]
    return (Path(__file__).resolve().parent.parent / url).resolve()


@contextmanager
def _conn():
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with _conn() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS tenders (
                id       TEXT PRIMARY KEY,
                title    TEXT NOT NULL,
                filename TEXT
            );
            CREATE TABLE IF NOT EXISTS requirements (
                id        TEXT PRIMARY KEY,
                tender_id TEXT NOT NULL,
                seq       INTEGER NOT NULL,
                data      TEXT NOT NULL,
                FOREIGN KEY (tender_id) REFERENCES tenders(id)
            );
            """
        )
        # Additive migration: the bidder's capability docs (autofill envelope). Idempotent,
        # so an existing deployed DB gains the column on next startup without a reset.
        cols = [row["name"] for row in c.execute("PRAGMA table_info(tenders)").fetchall()]
        if "capability_docs" not in cols:
            c.execute("ALTER TABLE tenders ADD COLUMN capability_docs TEXT")


def _caps_json(resp: TenderResponse) -> str:
    return json.dumps([cd.model_dump() for cd in resp.capability_docs])


def save_tender(resp: TenderResponse, filename: str | None = None) -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO tenders (id, title, filename, capability_docs) VALUES (?, ?, ?, ?)",
            (resp.tender_id, resp.title, filename, _caps_json(resp)),
        )
        c.execute("DELETE FROM requirements WHERE tender_id = ?", (resp.tender_id,))
        for seq, req in enumerate(resp.requirements):
            c.execute(
                "INSERT INTO requirements (id, tender_id, seq, data) VALUES (?, ?, ?, ?)",
                (req.id, resp.tender_id, seq, req.model_dump_json()),
            )


def replace_drafts(tender_id: str, requirements: list[Requirement],
                   capability_docs: list[CapabilityDoc]) -> None:
    """Rewrite a tender's requirements + capability_docs (the autofill output) WITHOUT
    touching its title/filename — used by POST /tenders/{id}/draft so a re-draft can't
    clobber the original upload metadata."""
    with _conn() as c:
        c.execute(
            "UPDATE tenders SET capability_docs = ? WHERE id = ?",
            (json.dumps([cd.model_dump() for cd in capability_docs]), tender_id),
        )
        c.execute("DELETE FROM requirements WHERE tender_id = ?", (tender_id,))
        for seq, req in enumerate(requirements):
            c.execute(
                "INSERT INTO requirements (id, tender_id, seq, data) VALUES (?, ?, ?, ?)",
                (req.id, tender_id, seq, req.model_dump_json()),
            )


def get_tender(tender_id: str) -> TenderResponse | None:
    with _conn() as c:
        trow = c.execute(
            "SELECT id, title, capability_docs FROM tenders WHERE id = ?", (tender_id,)
        ).fetchone()
        if trow is None:
            return None
        rows = c.execute(
            "SELECT data FROM requirements WHERE tender_id = ? ORDER BY seq", (tender_id,)
        ).fetchall()
    requirements = [Requirement(**json.loads(r["data"])) for r in rows]
    caps_raw = trow["capability_docs"]
    capability_docs = [CapabilityDoc(**c) for c in json.loads(caps_raw)] if caps_raw else []
    return TenderResponse(
        tender_id=trow["id"], title=trow["title"], requirements=requirements,
        capability_docs=capability_docs,
    )


def list_tenders() -> list[dict]:
    """Return a summary of all uploaded tenders (id, title, requirement count)."""
    with _conn() as c:
        rows = c.execute(
            "SELECT t.id, t.title, COUNT(r.id) as req_count "
            "FROM tenders t LEFT JOIN requirements r ON t.id = r.tender_id "
            "GROUP BY t.id ORDER BY t.id DESC"
        ).fetchall()
    return [{"tender_id": row["id"], "title": row["title"], "requirement_count": row["req_count"]}
            for row in rows]


def update_requirement(req_id: str, update: DecisionUpdate) -> Requirement | None:
    with _conn() as c:
        row = c.execute(
            "SELECT data FROM requirements WHERE id = ?", (req_id,)
        ).fetchone()
        if row is None:
            return None
        req = Requirement(**json.loads(row["data"]))
        if update.status is not None:
            req.status = update.status
        if update.decision is not None:
            req.decision = update.decision
        c.execute(
            "UPDATE requirements SET data = ? WHERE id = ?",
            (req.model_dump_json(), req_id),
        )
    return req
