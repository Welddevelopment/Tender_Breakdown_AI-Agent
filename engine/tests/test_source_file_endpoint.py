"""GET /tenders/{id}/source: serves any pack document (PDF/DOCX/XLSX/CSV) inline in
its native format, so the frontend can render + highlight the real DOCX/XLSX/CSV
instead of showing only the extracted excerpt as plain text (the "make Office
sources as trustworthy as PDF" ask). Bridges into the FastAPI backend; skipped in a
pure-engine checkout without backend deps installed.
"""
from __future__ import annotations

from pathlib import Path

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("jwt")
pytest.importorskip("docx")
pytest.importorskip("openpyxl")

from fastapi.testclient import TestClient

from backend.app import main as api
from backend.app import store

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURES = REPO_ROOT / "fixtures" / "mixed-pack"


@pytest.fixture
def client(tmp_path, monkeypatch):
    db = tmp_path / "test.db"
    monkeypatch.setattr(store, "_db_path", lambda: db)
    store.init_db()
    from backend.app import admin
    admin._create_user("sourcefile@bidframe.co.uk", "testpw123456")
    c = TestClient(api.app)
    tok = c.post("/auth/login",
                 json={"email": "sourcefile@bidframe.co.uk", "password": "testpw123456"}).json()["token"]
    c.headers.update({"Authorization": f"Bearer {tok}"})
    return c


def _upload(client, paths):
    files = [("files", (p.name, p.open("rb"), "application/octet-stream")) for p in paths]
    try:
        return client.post("/tenders/upload", files=files, params={"sync": "1"})
    finally:
        for _, (_, fh, _) in files:
            fh.close()


def test_serves_docx_with_correct_media_type_and_bytes(client):
    docx_path = FIXTURES / "sample-return-forms.docx"
    resp = _upload(client, [docx_path])
    tid = resp.json()["tender_id"]

    r = client.get(f"/tenders/{tid}/source", params={"doc": "d1"})
    assert r.status_code == 200
    assert r.headers["content-type"] == (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    assert r.content == docx_path.read_bytes()


def test_serves_xlsx_and_csv_with_correct_media_types(client):
    xlsx_path = FIXTURES / "sample-pricing-schedule.xlsx"
    csv_path = FIXTURES / "sample-compliance.csv"
    resp = _upload(client, [xlsx_path, csv_path])
    tid = resp.json()["tender_id"]

    r_xlsx = client.get(f"/tenders/{tid}/source", params={"doc": "d1"})
    assert r_xlsx.status_code == 200
    assert r_xlsx.headers["content-type"] == (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    r_csv = client.get(f"/tenders/{tid}/source", params={"doc": "d2"})
    assert r_csv.status_code == 200
    assert r_csv.headers["content-type"].startswith("text/csv")
    assert r_csv.content == csv_path.read_bytes()


def test_404_on_missing_doc(client):
    resp = _upload(client, [FIXTURES / "sample-compliance.csv"])
    tid = resp.json()["tender_id"]
    r = client.get(f"/tenders/{tid}/source", params={"doc": "d9"})
    assert r.status_code == 404


def test_401_without_auth(client):
    resp = _upload(client, [FIXTURES / "sample-compliance.csv"])
    tid = resp.json()["tender_id"]
    anon = TestClient(api.app)
    r = anon.get(f"/tenders/{tid}/source", params={"doc": "d1"})
    assert r.status_code == 401


def test_404_for_another_users_tender(client, tmp_path, monkeypatch):
    resp = _upload(client, [FIXTURES / "sample-compliance.csv"])
    tid = resp.json()["tender_id"]

    from backend.app import admin
    admin._create_user("other@bidframe.co.uk", "testpw123456")
    other = TestClient(api.app)
    tok = other.post("/auth/login",
                      json={"email": "other@bidframe.co.uk", "password": "testpw123456"}).json()["token"]
    other.headers.update({"Authorization": f"Bearer {tok}"})
    r = other.get(f"/tenders/{tid}/source", params={"doc": "d1"})
    assert r.status_code == 404


def test_rejects_path_traversal_doc_param(client):
    resp = _upload(client, [FIXTURES / "sample-compliance.csv"])
    tid = resp.json()["tender_id"]
    r = client.get(f"/tenders/{tid}/source", params={"doc": "../../etc/passwd"})
    assert r.status_code == 400
