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
from datetime import datetime, timezone
from pathlib import Path

from .schema import (
    Answer,
    AnswerUpdate,
    CapabilityDoc,
    Criterion,
    DecisionUpdate,
    Requirement,
    SourceDoc,
    TenderResponse,
)


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
            CREATE TABLE IF NOT EXISTS users (
                id            TEXT PRIMARY KEY,
                email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at    TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tender_members (
                tender_id TEXT NOT NULL,
                user_id   TEXT NOT NULL,
                added_at  TEXT NOT NULL,
                PRIMARY KEY (tender_id, user_id),
                FOREIGN KEY (tender_id) REFERENCES tenders(id)
            );
            CREATE TABLE IF NOT EXISTS decision_events (
                id        TEXT PRIMARY KEY,
                tender_id TEXT NOT NULL,
                req_id    TEXT NOT NULL,
                actor_id  TEXT NOT NULL,
                action    TEXT NOT NULL,
                note      TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (tender_id) REFERENCES tenders(id),
                FOREIGN KEY (req_id) REFERENCES requirements(id),
                FOREIGN KEY (actor_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS teams (
                id         TEXT PRIMARY KEY,
                name       TEXT NOT NULL,
                owner_id   TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS team_members (
                team_id  TEXT NOT NULL,
                user_id  TEXT NOT NULL,
                role     TEXT NOT NULL DEFAULT 'member',
                added_at TEXT NOT NULL,
                PRIMARY KEY (team_id, user_id),
                FOREIGN KEY (team_id) REFERENCES teams(id)
            );
            CREATE TABLE IF NOT EXISTS comments (
                id          TEXT PRIMARY KEY,
                req_id      TEXT NOT NULL,
                tender_id   TEXT NOT NULL,
                author_id   TEXT NOT NULL,
                author_name TEXT,
                body        TEXT NOT NULL,
                created_at  TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS comments_req_idx ON comments (req_id);
            """
        )
        # Additive migration: the bidder's capability docs (autofill envelope). Idempotent,
        # so an existing deployed DB gains the column on next startup without a reset.
        cols = [row["name"] for row in c.execute("PRAGMA table_info(tenders)").fetchall()]
        if "capability_docs" not in cols:
            c.execute("ALTER TABLE tenders ADD COLUMN capability_docs TEXT")
        # Additive migration: tender ownership (per-user isolation, invite-only auth).
        # Existing rows get owner=NULL (unowned, invisible to users) — a clean auth start.
        if "owner" not in cols:
            c.execute("ALTER TABLE tenders ADD COLUMN owner TEXT")
        # Additive migration: upload timestamp (Stage 4 — "uploaded date" on the
        # library card + current-tender strip). Existing rows get NULL; the UI
        # simply omits the date when it's absent, so this is backward-compatible.
        if "created_at" not in cols:
            c.execute("ALTER TABLE tenders ADD COLUMN created_at TEXT")
        # Additive migration: the tender pack's source documents (#4 multi-file).
        if "source_docs" not in cols:
            c.execute("ALTER TABLE tenders ADD COLUMN source_docs TEXT")
        # Additive migration: published award criteria (#27 — real name/weight for the graph).
        if "award_criteria" not in cols:
            c.execute("ALTER TABLE tenders ADD COLUMN award_criteria TEXT")
        # Additive migration: user display name (collaboration attribution — "Approved by …").
        ucols = [row["name"] for row in c.execute("PRAGMA table_info(users)").fetchall()]
        if "name" not in ucols:
            c.execute("ALTER TABLE users ADD COLUMN name TEXT")
        # Additive migration: blocker comments (Stage 6). `is_blocker` marks a comment
        # that must be resolved before the requirement is export-ready; `resolved_at`
        # is the ISO time it was cleared (NULL while still open). Existing comments get
        # is_blocker=0 / resolved_at=NULL — ordinary conversational notes, unchanged.
        ccols = [row["name"] for row in c.execute("PRAGMA table_info(comments)").fetchall()]
        if "is_blocker" not in ccols:
            c.execute("ALTER TABLE comments ADD COLUMN is_blocker INTEGER NOT NULL DEFAULT 0")
        if "resolved_at" not in ccols:
            c.execute("ALTER TABLE comments ADD COLUMN resolved_at TEXT")
        # Additive migration: a tender may belong to a team (persistent collaboration).
        # Nullable — existing per-user/shared tenders are unaffected; access via team is
        # granted on top of owner + tender_members (see can_access).
        if "team_id" not in cols:
            c.execute("ALTER TABLE tenders ADD COLUMN team_id TEXT")


def _caps_json(resp: TenderResponse) -> str:
    return json.dumps([cd.model_dump() for cd in resp.capability_docs])


def save_tender(resp: TenderResponse, filename: str | None = None,
                owner: str | None = None) -> None:
    with _conn() as c:
        # Preserve the original upload time across an INSERT OR REPLACE (e.g. a
        # re-ingest of the same tender_id) — only stamp `now` on first save.
        existing = c.execute(
            "SELECT created_at FROM tenders WHERE id = ?", (resp.tender_id,)
        ).fetchone()
        created_at = (existing["created_at"] if existing and existing["created_at"]
                      else datetime.now(timezone.utc).isoformat())
        c.execute(
            "INSERT OR REPLACE INTO tenders "
            "(id, title, filename, capability_docs, owner, source_docs, award_criteria, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                resp.tender_id,
                resp.title,
                filename,
                _caps_json(resp),
                owner,
                json.dumps([sd.model_dump() for sd in resp.source_docs]),
                json.dumps([ac.model_dump() for ac in resp.award_criteria]),
                created_at,
            ),
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
            "SELECT id, title, capability_docs, source_docs, award_criteria FROM tenders WHERE id = ?",
            (tender_id,),
        ).fetchone()
        if trow is None:
            return None
        rows = c.execute(
            "SELECT data FROM requirements WHERE tender_id = ? ORDER BY seq", (tender_id,)
        ).fetchall()
    requirements = [Requirement(**json.loads(r["data"])) for r in rows]
    # Stamp collaboration presence (Stage 6): total comments + unresolved blocker
    # comments per requirement, derived here so the workspace can mark discussed /
    # blocked rows without a second round-trip. Absent from the stored blob, so it
    # always reflects the live comments table.
    counts = comment_counts(tender_id)
    for req in requirements:
        tally = counts.get(req.id)
        if tally:
            req.comment_count = tally["total"]
            req.open_blocker_count = tally["blockers"]
    caps_raw = trow["capability_docs"]
    capability_docs = [CapabilityDoc(**c) for c in json.loads(caps_raw)] if caps_raw else []
    src_raw = trow["source_docs"]
    source_docs = [SourceDoc(**s) for s in json.loads(src_raw)] if src_raw else []
    crit_raw = trow["award_criteria"]
    award_criteria = [Criterion(**a) for a in json.loads(crit_raw)] if crit_raw else []
    return TenderResponse(
        tender_id=trow["id"], title=trow["title"], requirements=requirements,
        capability_docs=capability_docs, source_docs=source_docs,
        award_criteria=award_criteria,
    )


def list_tenders(owner: str | None = None) -> list[dict]:
    """Return a summary of the tenders a user can see — ones they OWN or have been SHARED into
    (id, title, requirement count). With no `owner`, returns all tenders (trusted callers / eval
    only, never the API)."""
    with _conn() as c:
        # Enriched summary (Stage 4 follow-ups): alongside id/title/req_count we
        # surface deal_breaker_count (SUM of the is_gating flag inside each
        # requirement's JSON blob), created_at (upload date), the owner (so the
        # caller can tell "mine" from "shared with me"), and member_count (people
        # with access = shared members + the owner). All additive; the frontend
        # parses each defensively and renders complete without them.
        base = (
            "SELECT t.id, t.title, t.owner, t.created_at, "
            "COUNT(r.id) as req_count, "
            "COALESCE(SUM(CASE WHEN json_extract(r.data, '$.is_gating') THEN 1 ELSE 0 END), 0) as db_count, "
            "(SELECT COUNT(*) FROM tender_members m WHERE m.tender_id = t.id) as member_count "
            "FROM tenders t LEFT JOIN requirements r ON t.id = r.tender_id "
        )
        if owner is not None:
            rows = c.execute(
                base
                + "WHERE t.owner = ? "
                + "OR t.id IN (SELECT tender_id FROM tender_members WHERE user_id = ?) "
                + "OR t.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) "
                + "GROUP BY t.id ORDER BY t.id DESC",
                (owner, owner, owner),
            ).fetchall()
        else:
            rows = c.execute(base + "GROUP BY t.id ORDER BY t.id DESC").fetchall()
    summaries = []
    for row in rows:
        summary = {
            "tender_id": row["id"],
            "title": row["title"],
            "requirement_count": row["req_count"],
            "deal_breaker_count": int(row["db_count"] or 0),
            # people with access: shared members + the owner (when the tender is owned)
            "member_count": int(row["member_count"] or 0) + (1 if row["owner"] else 0),
        }
        if row["created_at"]:
            summary["created_at"] = row["created_at"]
        # "shared with me" = the caller can see it but isn't the owner. Only
        # meaningful for an owner-scoped call (the API always passes one).
        if owner is not None:
            summary["shared"] = row["owner"] != owner
        summaries.append(summary)
    return summaries


def get_tender_owner(tender_id: str) -> str | None:
    """The user id that owns a tender, or None if the tender is missing/unowned. Used to
    enforce per-user isolation before returning or mutating tender data."""
    with _conn() as c:
        row = c.execute("SELECT owner FROM tenders WHERE id = ?", (tender_id,)).fetchone()
    return row["owner"] if row is not None else None


def get_requirement_owner(req_id: str) -> str | None:
    """The user id that owns the tender a requirement belongs to (for PATCH isolation)."""
    with _conn() as c:
        row = c.execute(
            "SELECT t.owner FROM requirements r JOIN tenders t ON r.tender_id = t.id "
            "WHERE r.id = ?",
            (req_id,),
        ).fetchone()
    return row["owner"] if row is not None else None


# ---- Users (invite-only auth) ------------------------------------------------

def create_user(user_id: str, email: str, password_hash: str, created_at: str,
                 name: str | None = None) -> None:
    """Insert a user. Raises sqlite3.IntegrityError if the email already exists."""
    with _conn() as c:
        c.execute(
            "INSERT INTO users (id, email, password_hash, created_at, name) VALUES (?, ?, ?, ?, ?)",
            (user_id, email.strip(), password_hash, created_at, name),
        )


def get_user_by_email(email: str) -> dict | None:
    with _conn() as c:
        row = c.execute(
            "SELECT id, email, password_hash, name FROM users WHERE email = ?", (email.strip(),)
        ).fetchone()
    return dict(row) if row is not None else None


def get_user_by_id(user_id: str) -> dict | None:
    with _conn() as c:
        row = c.execute(
            "SELECT id, email, name FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    return dict(row) if row is not None else None


def list_users() -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT id, email, name, created_at FROM users ORDER BY created_at"
        ).fetchall()
    return [dict(r) for r in rows]


# ---- Tender sharing / membership (collaboration) -----------------------------

def add_member(tender_id: str, user_id: str, added_at: str) -> None:
    """Grant a user access to a tender (idempotent)."""
    with _conn() as c:
        c.execute(
            "INSERT OR IGNORE INTO tender_members (tender_id, user_id, added_at) VALUES (?, ?, ?)",
            (tender_id, user_id, added_at),
        )


def remove_member(tender_id: str, user_id: str) -> int:
    """Remove a user's shared access to a tender. Returns number of rows removed."""
    with _conn() as c:
        cur = c.execute(
            "DELETE FROM tender_members WHERE tender_id = ? AND user_id = ?",
            (tender_id, user_id),
        )
        return cur.rowcount


def is_member(tender_id: str, user_id: str) -> bool:
    with _conn() as c:
        row = c.execute(
            "SELECT 1 FROM tender_members WHERE tender_id = ? AND user_id = ?",
            (tender_id, user_id),
        ).fetchone()
    return row is not None


def can_access(tender_id: str, user_id: str) -> bool:
    """A user may access a tender if they own it, have been shared into it, OR belong to
    the team it's assigned to. Owner still passes; everyone else 404s. Team access is
    additive on top of the per-user share wall."""
    if get_tender_owner(tender_id) == user_id or is_member(tender_id, user_id):
        return True
    team_id = get_tender_team(tender_id)
    return team_id is not None and is_team_member(team_id, user_id)


def can_access_requirement(req_id: str, user_id: str) -> bool:
    """Can this user access the tender a requirement belongs to (owner, shared member, or
    team member)? Requirement-level equivalent of can_access, for the PATCH/comment guard."""
    with _conn() as c:
        row = c.execute(
            "SELECT t.id AS tid, t.owner, t.team_id FROM requirements r "
            "JOIN tenders t ON r.tender_id = t.id WHERE r.id = ?",
            (req_id,),
        ).fetchone()
    if row is None:
        return False
    if row["owner"] == user_id or is_member(row["tid"], user_id):
        return True
    return row["team_id"] is not None and is_team_member(row["team_id"], user_id)


# ---- Teams (persistent collaboration groups) ---------------------------------

def create_team(team_id: str, name: str, owner_id: str, created_at: str) -> None:
    """Create a team and add its owner as the first (owner-role) member."""
    with _conn() as c:
        c.execute(
            "INSERT INTO teams (id, name, owner_id, created_at) VALUES (?, ?, ?, ?)",
            (team_id, name.strip(), owner_id, created_at),
        )
        c.execute(
            "INSERT OR IGNORE INTO team_members (team_id, user_id, role, added_at) VALUES (?, ?, 'owner', ?)",
            (team_id, owner_id, created_at),
        )


def get_team(team_id: str) -> dict | None:
    with _conn() as c:
        row = c.execute(
            "SELECT id, name, owner_id, created_at FROM teams WHERE id = ?", (team_id,)
        ).fetchone()
    return dict(row) if row is not None else None


def is_team_owner(team_id: str, user_id: str) -> bool:
    with _conn() as c:
        row = c.execute(
            "SELECT 1 FROM teams WHERE id = ? AND owner_id = ?", (team_id, user_id)
        ).fetchone()
    return row is not None


def is_team_member(team_id: str, user_id: str) -> bool:
    with _conn() as c:
        row = c.execute(
            "SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?",
            (team_id, user_id),
        ).fetchone()
    return row is not None


def user_team_ids(user_id: str) -> list[str]:
    with _conn() as c:
        rows = c.execute(
            "SELECT team_id FROM team_members WHERE user_id = ?", (user_id,)
        ).fetchall()
    return [r["team_id"] for r in rows]


def list_teams_for_user(user_id: str) -> list[dict]:
    """Teams the user owns or belongs to, each with a member count and the caller's role."""
    with _conn() as c:
        rows = c.execute(
            "SELECT t.id, t.name, t.owner_id, t.created_at, me.role AS my_role, "
            "  (SELECT COUNT(*) FROM team_members m2 WHERE m2.team_id = t.id) AS member_count "
            "FROM teams t JOIN team_members me ON me.team_id = t.id AND me.user_id = ? "
            "ORDER BY t.created_at DESC",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def add_team_member(team_id: str, user_id: str, added_at: str, role: str = "member") -> None:
    """Grant a user membership of a team (idempotent)."""
    with _conn() as c:
        c.execute(
            "INSERT OR IGNORE INTO team_members (team_id, user_id, role, added_at) VALUES (?, ?, ?, ?)",
            (team_id, user_id, role, added_at),
        )


def remove_team_member(team_id: str, user_id: str) -> None:
    """Remove a member from a team. The owner can't be removed (guarded in the API)."""
    with _conn() as c:
        c.execute(
            "DELETE FROM team_members WHERE team_id = ? AND user_id = ?",
            (team_id, user_id),
        )


def list_team_members(team_id: str) -> list[dict]:
    """Everyone in a team, owner first, with names — mirrors list_members' shape."""
    with _conn() as c:
        rows = c.execute(
            "SELECT u.id, u.email, u.name, m.role, m.added_at "
            "FROM team_members m JOIN users u ON u.id = m.user_id "
            "WHERE m.team_id = ? ORDER BY (m.role = 'owner') DESC, m.added_at",
            (team_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def get_tender_team(tender_id: str) -> str | None:
    with _conn() as c:
        row = c.execute("SELECT team_id FROM tenders WHERE id = ?", (tender_id,)).fetchone()
    return row["team_id"] if row is not None and row["team_id"] else None


def set_tender_team(tender_id: str, team_id: str | None) -> None:
    """Assign (or clear, with None) the team a tender is shared with."""
    with _conn() as c:
        c.execute("UPDATE tenders SET team_id = ? WHERE id = ?", (team_id, tender_id))


# ---- Comments (per-requirement collaboration) --------------------------------

def add_comment(comment_id: str, req_id: str, tender_id: str, author_id: str,
                author_name: str | None, body: str, created_at: str,
                is_blocker: bool = False) -> dict:
    """Insert a comment on a requirement and return it as a dict (for the SSE broadcast)."""
    with _conn() as c:
        c.execute(
            "INSERT INTO comments (id, req_id, tender_id, author_id, author_name, body, "
            "created_at, is_blocker) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (comment_id, req_id, tender_id, author_id, author_name, body, created_at,
             1 if is_blocker else 0),
        )
    return {"id": comment_id, "req_id": req_id, "tender_id": tender_id, "author_id": author_id,
            "author_name": author_name, "body": body, "created_at": created_at,
            "is_blocker": is_blocker, "resolved_at": None}


def list_comments(req_id: str) -> list[dict]:
    """All comments on a requirement, oldest first."""
    with _conn() as c:
        rows = c.execute(
            "SELECT id, req_id, tender_id, author_id, author_name, body, created_at, "
            "is_blocker, resolved_at FROM comments WHERE req_id = ? ORDER BY created_at",
            (req_id,),
        ).fetchall()
    return [{**dict(r), "is_blocker": bool(r["is_blocker"])} for r in rows]


def resolve_comment(comment_id: str, resolved_at: str) -> dict | None:
    """Mark a blocker comment resolved (clears it as an export blocker). Returns the
    updated comment dict, or None if the comment doesn't exist. Idempotent: resolving an
    already-resolved comment just re-stamps the time."""
    with _conn() as c:
        cur = c.execute(
            "UPDATE comments SET resolved_at = ? WHERE id = ?", (resolved_at, comment_id)
        )
        if cur.rowcount == 0:
            return None
        row = c.execute(
            "SELECT id, req_id, tender_id, author_id, author_name, body, created_at, "
            "is_blocker, resolved_at FROM comments WHERE id = ?",
            (comment_id,),
        ).fetchone()
    return {**dict(row), "is_blocker": bool(row["is_blocker"])} if row else None


def get_comment_req_id(comment_id: str) -> str | None:
    """The requirement a comment belongs to (for access checks on resolve)."""
    with _conn() as c:
        row = c.execute(
            "SELECT req_id FROM comments WHERE id = ?", (comment_id,)
        ).fetchone()
    return row["req_id"] if row is not None else None


def comment_counts(tender_id: str) -> dict[str, dict]:
    """Per-requirement comment tallies for a tender: total comments and the number of
    UNRESOLVED blocker comments, keyed by req_id. Used to stamp comment_count /
    open_blocker_count onto each requirement at read time."""
    with _conn() as c:
        rows = c.execute(
            "SELECT req_id, COUNT(*) AS total, "
            "SUM(CASE WHEN is_blocker = 1 AND resolved_at IS NULL THEN 1 ELSE 0 END) AS blockers "
            "FROM comments WHERE tender_id = ? GROUP BY req_id",
            (tender_id,),
        ).fetchall()
    return {r["req_id"]: {"total": int(r["total"]), "blockers": int(r["blockers"] or 0)}
            for r in rows}


def get_requirement_tender_id(req_id: str) -> str | None:
    """The tender id a requirement belongs to, or None when the requirement is missing."""
    with _conn() as c:
        row = c.execute(
            "SELECT tender_id FROM requirements WHERE id = ?",
            (req_id,),
        ).fetchone()
    return row["tender_id"] if row is not None else None


def list_members(tender_id: str) -> list[dict]:
    """Everyone with access to a tender: the owner first, then shared members, with names."""
    with _conn() as c:
        owner_id = get_tender_owner(tender_id)
        rows = c.execute(
            "SELECT u.id, u.email, u.name, m.added_at "
            "FROM tender_members m JOIN users u ON u.id = m.user_id "
            "WHERE m.tender_id = ? ORDER BY m.added_at",
            (tender_id,),
        ).fetchall()
        members = [{**dict(r), "role": "member"} for r in rows]
        if owner_id:
            owner = c.execute(
                "SELECT id, email, name FROM users WHERE id = ?", (owner_id,)
            ).fetchone()
            if owner is not None:
                members.insert(0, {**dict(owner), "added_at": None, "role": "owner"})
    return members


def append_decision_event(
    event_id: str,
    tender_id: str,
    req_id: str,
    actor_id: str,
    action: str,
    note: str | None,
    timestamp: str,
) -> None:
    """Append one immutable collaboration event for the tender activity timeline."""
    with _conn() as c:
        c.execute(
            "INSERT INTO decision_events "
            "(id, tender_id, req_id, actor_id, action, note, timestamp) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (event_id, tender_id, req_id, actor_id, action, note, timestamp),
        )


def list_decision_events(tender_id: str) -> list[dict]:
    """Newest-first decision history for a tender, with actor details for the UI."""
    with _conn() as c:
        rows = c.execute(
            "SELECT e.id, e.tender_id, e.req_id, e.action, e.note, e.timestamp, "
            "u.id AS actor_id, u.email AS actor_email, u.name AS actor_name "
            "FROM decision_events e LEFT JOIN users u ON u.id = e.actor_id "
            "WHERE e.tender_id = ? "
            "ORDER BY e.timestamp DESC, e.id DESC",
            (tender_id,),
        ).fetchall()
    return [
        {
            "id": r["id"],
            "tender_id": r["tender_id"],
            "req_id": r["req_id"],
            "action": r["action"],
            "note": r["note"],
            "timestamp": r["timestamp"],
            "actor": {
                "id": r["actor_id"],
                "email": r["actor_email"],
                "name": r["actor_name"],
            },
        }
        for r in rows
    ]


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


def update_answer(req_id: str, update: AnswerUpdate) -> Requirement | None:
    """Persist human-authored answer content onto a requirement's JSON blob: answer text/
    state/confidence, the answer verdict, and gap answers. Only the fields present on the
    update are applied. The requirement's own status/decision and every machine field
    (evidence_refs, source, category…) are left untouched — this owns answer content only."""
    with _conn() as c:
        row = c.execute(
            "SELECT data FROM requirements WHERE id = ?", (req_id,)
        ).fetchone()
        if row is None:
            return None
        req = Requirement(**json.loads(row["data"]))

        # Ensure there's an answer to write onto — a hand-written answer on a
        # requirement autofill left blank creates one, mirroring the frontend.
        answer = req.answer or Answer()
        if update.text is not None:
            answer.text = update.text
            req.draft_answer = update.text  # keep the deprecated alias in sync
        if update.state is not None:
            answer.state = update.state
        if update.confidence is not None:
            answer.confidence = update.confidence
        if update.decision is not None:
            answer.decision = update.decision
        elif update.clear_decision:
            answer.decision = None
        req.answer = answer

        # Gap answers, matched by question id. Unknown ids are ignored — the client
        # can answer existing questions, not invent new ones.
        if update.open_questions is not None:
            patch_by_id = {g.id: g for g in update.open_questions}
            for q in req.open_questions:
                g = patch_by_id.get(q.id)
                if g is not None:
                    q.answer = g.answer
                    if g.answered_at is not None:
                        q.answered_at = g.answered_at

        c.execute(
            "UPDATE requirements SET data = ? WHERE id = ?",
            (req.model_dump_json(), req_id),
        )
    return req
