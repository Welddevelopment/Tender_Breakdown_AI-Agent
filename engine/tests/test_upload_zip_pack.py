"""ZIP-pack upload (backend lane, J-096): POST /tenders/upload accepts a single .zip
containing PDF/DOCX/XLSX/CSV entries — the file shape a procurement portal actually
delivers a tender pack as. Uses the QA-staged fixtures/mixed-pack/sample-pack.zip
(DOCX + XLSX + CSV, plus a __MACOSX junk entry and an unsupported notes.txt to prove
clean skipping).

Bridges into the FastAPI backend; skipped in a pure-engine checkout without backend
deps installed, so `pytest engine/tests/` stays green on the engine alone.
"""
from __future__ import annotations

import io
import zipfile
from pathlib import Path

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("jwt")
pytest.importorskip("docx")
pytest.importorskip("openpyxl")

from fastapi.testclient import TestClient

from backend.app import main as api
from backend.app import store
from backend.app.main import _expand_zip

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURES = REPO_ROOT / "fixtures" / "mixed-pack"
ZIP_FIXTURE = FIXTURES / "sample-pack.zip"


@pytest.fixture
def client(tmp_path, monkeypatch):
    db = tmp_path / "test.db"
    monkeypatch.setattr(store, "_db_path", lambda: db)
    store.init_db()
    from backend.app import admin
    admin._create_user("zippack@bidframe.co.uk", "testpw123456")
    c = TestClient(api.app)
    tok = c.post("/auth/login",
                 json={"email": "zippack@bidframe.co.uk", "password": "testpw123456"}).json()["token"]
    c.headers.update({"Authorization": f"Bearer {tok}"})
    return c


def _make_zip(tmp_path, entries: dict[str, bytes]) -> Path:
    path = tmp_path / "pack.zip"
    with zipfile.ZipFile(path, "w") as zf:
        for name, content in entries.items():
            zf.writestr(name, content)
    return path


# --------------------------------------------------------------------------- #
# _expand_zip unit behaviour
# --------------------------------------------------------------------------- #

def test_expand_zip_extracts_supported_entries_and_skips_the_rest(tmp_path):
    zpath = _make_zip(tmp_path, {
        "return-forms.docx": b"not a real docx but bytes are enough for this unit test",
        "notes.txt": b"unsupported, should be skipped",
        "__MACOSX/._return-forms.docx": b"junk",
        ".DS_Store": b"junk",
    })
    entries = _expand_zip(zpath.read_bytes(), "pack.zip")
    names = {name for name, _ in entries}
    assert names == {"return-forms.docx"}


def test_expand_zip_rejects_bad_zip():
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        _expand_zip(b"not a zip file at all", "bad.zip")
    assert exc.value.status_code == 400


def test_expand_zip_guards_entry_count(tmp_path):
    from fastapi import HTTPException
    entries = {f"file{i}.csv": b"a,b\n1,2\n" for i in range(40)}
    zpath = _make_zip(tmp_path, entries)
    with pytest.raises(HTTPException) as exc:
        _expand_zip(zpath.read_bytes(), "big.zip")
    assert exc.value.status_code == 413


# --------------------------------------------------------------------------- #
# Live upload path
# --------------------------------------------------------------------------- #

def test_zip_pack_upload_reaches_extraction_with_provenance(client):
    with ZIP_FIXTURE.open("rb") as fh:
        resp = client.post(
            "/tenders/upload",
            files=[("files", ("sample-pack.zip", fh, "application/zip"))],
            params={"sync": "1"},
        )
    assert resp.status_code == 200
    tid = resp.json()["tender_id"]

    full = client.get(f"/tenders/{tid}/requirements").json()
    filenames = {d["filename"] for d in full["source_docs"]}
    # notes.txt (unsupported) and the __MACOSX junk entry are excluded; the 3 real
    # documents inside the zip are extracted and ingested as their own source docs.
    assert filenames == {
        "sample-return-forms.docx", "sample-pricing-schedule.xlsx", "sample-compliance.csv",
    }
    for r in full["requirements"]:
        assert r["source_rect"] is None
        assert r["source_rect_match"] is None


def test_zip_with_only_unsupported_entries_is_rejected(client):
    zip_bytes = io.BytesIO()
    with zipfile.ZipFile(zip_bytes, "w") as zf:
        zf.writestr("notes.txt", "nothing usable in here")
    zip_bytes.seek(0)
    resp = client.post(
        "/tenders/upload",
        files=[("files", ("empty-ish.zip", zip_bytes, "application/zip"))],
        params={"sync": "1"},
    )
    assert resp.status_code == 400


def test_bad_zip_upload_rejected_cleanly(client):
    resp = client.post(
        "/tenders/upload",
        files=[("files", ("broken.zip", io.BytesIO(b"definitely not a zip"), "application/zip"))],
        params={"sync": "1"},
    )
    assert resp.status_code == 400
