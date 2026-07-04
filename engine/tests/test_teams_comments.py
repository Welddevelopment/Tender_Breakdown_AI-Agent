"""Teams + comments + Google provisioning (extend of the self-hosted auth, Generalist lane).

Covers the auth+collab extension shipped on generalist/auth-collab:
- persistent teams: create, add member by email (owner-only, account must exist), team access
  to a shared tender, and team membership granting the tender list + decide rights;
- per-requirement comments: access-gated read/write, server-stamped author;
- Google sign-in: auto-provisions an account and issues our own JWT (Google verification stubbed).

Skipped in a pure-engine checkout without backend deps (importorskip), like test_collaboration.py.
"""
from __future__ import annotations

from pathlib import Path

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("jwt")

from fastapi.testclient import TestClient

from backend.app import admin, auth, main as api, store

REPO_ROOT = Path(__file__).resolve().parents[2]
DOCX_FIXTURE = REPO_ROOT / "fixtures" / "mixed-pack" / "sample-return-forms.docx"

_DECISION = {"status": "accepted",
             "decision": {"action": "approve", "note": "", "timestamp": "2026-07-04T18:00:00Z"}}


def _client(email: str) -> TestClient:
    c = TestClient(api.app)
    tok = c.post("/auth/login", json={"email": email, "password": "testpw123456"}).json()["token"]
    c.headers.update({"Authorization": f"Bearer {tok}"})
    return c


@pytest.fixture
def env(tmp_path, monkeypatch):
    """Owner + member + outsider on a shared DB; owner has uploaded one tender. Returns
    (owner, member, outsider, tender_id, a_requirement_id)."""
    pytest.importorskip("docx")
    db = tmp_path / "teams.db"
    monkeypatch.setattr(store, "_db_path", lambda: db)
    store.init_db()
    admin._create_user("owner@bidframe.co.uk", "testpw123456", "Olivia Owner")
    admin._create_user("member@bidframe.co.uk", "testpw123456", "Marcus Member")
    admin._create_user("outsider@bidframe.co.uk", "testpw123456")
    owner = _client("owner@bidframe.co.uk")
    member = _client("member@bidframe.co.uk")
    outsider = _client("outsider@bidframe.co.uk")
    with DOCX_FIXTURE.open("rb") as fh:
        r = owner.post("/tenders/upload",
                       files=[("files", (DOCX_FIXTURE.name, fh, "application/octet-stream"))],
                       params={"sync": "1"})
    assert r.status_code == 200, r.text
    tid = r.json()["tender_id"]
    rid = owner.get(f"/tenders/{tid}/requirements").json()["requirements"][0]["id"]
    return owner, member, outsider, tid, rid


# ---- Teams -------------------------------------------------------------------

def test_create_team_makes_caller_owner(env):
    owner, *_ = env
    r = owner.post("/teams", json={"name": "Bid Squad"})
    assert r.status_code == 200, r.text
    assert r.json()["team"]["name"] == "Bid Squad"
    members = r.json()["members"]
    assert len(members) == 1 and members[0]["role"] == "owner"


def test_team_share_grants_member_access_outsider_walled(env):
    owner, member, outsider, tid, _ = env
    team_id = owner.post("/teams", json={"name": "Bid Squad"}).json()["team"]["id"]
    owner.post(f"/teams/{team_id}/members", json={"email": "member@bidframe.co.uk"})
    # Before the tender is shared with the team, the member is walled.
    assert member.get(f"/tenders/{tid}/requirements").status_code == 404
    assert owner.post(f"/tenders/{tid}/team", json={"team_id": team_id}).status_code == 200
    # Now the whole team can open it — and it shows in the member's tender list.
    assert member.get(f"/tenders/{tid}/requirements").status_code == 200
    assert tid in member.get("/tenders").text
    # Someone not on the team is still 404-walled.
    assert outsider.get(f"/tenders/{tid}/requirements").status_code == 404


def test_team_member_can_decide_and_is_attributed(env):
    owner, member, _outsider, tid, rid = env
    team_id = owner.post("/teams", json={"name": "Bid Squad"}).json()["team"]["id"]
    owner.post(f"/teams/{team_id}/members", json={"email": "member@bidframe.co.uk"})
    owner.post(f"/tenders/{tid}/team", json={"team_id": team_id})
    r = member.patch(f"/requirements/{rid}", json=_DECISION)
    assert r.status_code == 200, r.text
    assert r.json()["decision"]["actor"]["email"] == "member@bidframe.co.uk"


def test_add_member_requires_owner_and_real_account(env):
    owner, member, _outsider, _tid, _ = env
    team_id = owner.post("/teams", json={"name": "Bid Squad"}).json()["team"]["id"]
    # Unknown email → 404 (invite-only; no silent add).
    assert owner.post(f"/teams/{team_id}/members", json={"email": "ghost@nowhere.co"}).status_code == 404
    # A non-owner can't add members or even see the team.
    assert member.post(f"/teams/{team_id}/members", json={"email": "outsider@bidframe.co.uk"}).status_code == 404
    assert member.get(f"/teams/{team_id}/members").status_code == 404


def test_owner_cannot_be_removed(env):
    owner, *_ = env
    resp = owner.post("/teams", json={"name": "Bid Squad"}).json()
    team_id = resp["team"]["id"]
    owner_id = resp["members"][0]["id"]
    assert owner.request("DELETE", f"/teams/{team_id}/members/{owner_id}").status_code == 400


# ---- Comments ----------------------------------------------------------------

def test_comment_roundtrip_and_author_stamp(env):
    owner, member, _outsider, tid, rid = env
    team_id = owner.post("/teams", json={"name": "Bid Squad"}).json()["team"]["id"]
    owner.post(f"/teams/{team_id}/members", json={"email": "member@bidframe.co.uk"})
    owner.post(f"/tenders/{tid}/team", json={"team_id": team_id})
    r = member.post(f"/requirements/{rid}/comments", json={"body": "Who owns ISO evidence?"})
    assert r.status_code == 200, r.text
    assert r.json()["author_name"] == "Marcus Member"       # server-stamped, not client-supplied
    listed = owner.get(f"/requirements/{rid}/comments").json()["comments"]
    assert len(listed) == 1 and listed[0]["body"] == "Who owns ISO evidence?"


def test_outsider_cannot_read_or_write_comments(env):
    _owner, _member, outsider, _tid, rid = env
    assert outsider.get(f"/requirements/{rid}/comments").status_code == 404
    assert outsider.post(f"/requirements/{rid}/comments", json={"body": "hi"}).status_code == 404


# ---- Google sign-in ----------------------------------------------------------

def test_google_signin_auto_provisions_account(env, monkeypatch):
    owner, *_ = env
    monkeypatch.setattr(auth, "google_client_id", lambda: "test-client-id.apps.googleusercontent.com")
    monkeypatch.setattr(
        auth, "verify_google_id_token",
        lambda _tok: {"email": "grace@newco.co.uk", "name": "Grace Google"},
    )
    fresh = TestClient(api.app)
    r = fresh.post("/auth/google", json={"id_token": "stub"})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["email"] == "grace@newco.co.uk"
    # The provisioned account is real: its token authenticates /auth/me.
    tok = r.json()["token"]
    me = fresh.get("/auth/me", headers={"Authorization": f"Bearer {tok}"})
    assert me.status_code == 200 and me.json()["name"] == "Grace Google"


def test_google_signin_rejects_unverified_token(env, monkeypatch):
    monkeypatch.setattr(auth, "google_client_id", lambda: "test-client-id.apps.googleusercontent.com")
    monkeypatch.setattr(auth, "verify_google_id_token", lambda _tok: None)
    r = TestClient(api.app).post("/auth/google", json={"id_token": "bad"})
    assert r.status_code == 401


def test_google_signin_503_when_unconfigured(env, monkeypatch):
    monkeypatch.setattr(auth, "google_client_id", lambda: None)
    r = TestClient(api.app).post("/auth/google", json={"id_token": "whatever"})
    assert r.status_code == 503
