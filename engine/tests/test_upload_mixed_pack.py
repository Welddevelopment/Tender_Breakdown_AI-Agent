"""Mixed-pack upload (backend lane, B-022): POST /tenders/upload accepts PDF + Word +
Excel + CSV in one pack, normalized into the existing IngestedDoc path with no
requirement-schema change. Uses the QA-staged synthetic fixtures in
fixtures/mixed-pack/ (see ops/mixed-pack-qa-log.md) plus any real PDF already in the repo.

Bridges into the FastAPI backend; skipped in a pure-engine checkout without backend
deps installed, so `pytest engine/tests/` stays green on the engine alone.
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
from backend.app.schema import SourceDoc, TenderResponse
from backend.app import store

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURES = REPO_ROOT / "fixtures" / "mixed-pack"
DOCX_FIXTURE = FIXTURES / "sample-return-forms.docx"
XLSX_FIXTURE = FIXTURES / "sample-pricing-schedule.xlsx"
CSV_FIXTURE = FIXTURES / "sample-compliance.csv"

_PDF_FIXTURES = list((REPO_ROOT / "data" / "tenders").glob("*.pdf")) if (REPO_ROOT / "data" / "tenders").exists() else []


@pytest.fixture
def client(tmp_path, monkeypatch):
    db = tmp_path / "test.db"
    monkeypatch.setattr(store, "_db_path", lambda: db)
    store.init_db()
    from backend.app import admin
    admin._create_user("mixedpack@bidframe.co.uk", "testpw123456")
    c = TestClient(api.app)
    tok = c.post("/auth/login",
                 json={"email": "mixedpack@bidframe.co.uk", "password": "testpw123456"}).json()["token"]
    c.headers.update({"Authorization": f"Bearer {tok}"})
    return c


def _upload(client, paths):
    files = [("files", (p.name, p.open("rb"), "application/octet-stream")) for p in paths]
    try:
        return client.post("/tenders/upload", files=files, params={"sync": "1"})
    finally:
        for _, (_, fh, _) in files:
            fh.close()


def test_rejects_unsupported_extension(client, tmp_path):
    bogus = tmp_path / "diagram.png"
    bogus.write_bytes(b"\x89PNG\r\n")
    resp = _upload(client, [bogus])
    assert resp.status_code == 400
    assert "diagram.png" in resp.json()["detail"]


def test_malformed_docx_upload_is_422_not_500(client, tmp_path):
    broken = tmp_path / "broken.docx"
    broken.write_bytes(b"not a real word document")
    resp = _upload(client, [broken])
    assert resp.status_code == 422
    assert "could be read" in resp.json()["detail"].lower() or "could not parse" in resp.json()["detail"].lower()


def test_docx_only_upload_reaches_extraction(client):
    resp = _upload(client, [DOCX_FIXTURE])
    assert resp.status_code == 200
    body = resp.json()
    assert body["requirement_count"] >= 0
    tid = body["tender_id"]
    full = client.get(f"/tenders/{tid}/requirements").json()
    assert full["source_docs"][0]["filename"] == "sample-return-forms.docx"


def test_xlsx_and_csv_only_upload_reaches_extraction(client):
    resp = _upload(client, [XLSX_FIXTURE, CSV_FIXTURE])
    assert resp.status_code == 200
    tid = resp.json()["tender_id"]
    full = client.get(f"/tenders/{tid}/requirements").json()
    filenames = {d["filename"] for d in full["source_docs"]}
    assert filenames == {"sample-pricing-schedule.xlsx", "sample-compliance.csv"}


def test_office_source_clauses_are_clean_locators():
    from backend.app.pipeline import _clean_office_source_clause

    assert _clean_office_source_clause(
        "XLSX Pricing row 6 | A6:E6",
        "[XLSX Pricing row 6 | A6:E6]\nPublic Liability",
        "pricing.xlsx",
    ) == "Pricing!A6"
    assert _clean_office_source_clause(
        None,
        "[CSV row 2]\nMandatory, Signed declaration",
        "compliance.csv",
    ) == "CSV row 2"
    assert _clean_office_source_clause(
        "DOCX paragraph 7 | heading: Section B",
        "Tenderers must hold insurance.",
        "forms.docx",
    ) == "DOCX paragraph 7"
    assert _clean_office_source_clause("Appendix A", "Text", "itt.pdf") == "Appendix A"


def test_async_job_reports_per_file_progress(client, monkeypatch):
    def fake_run_pipeline_multi(docs, tender_id, title, on_progress=None):
        if on_progress:
            for idx, (_doc_id, _path, filename) in enumerate(docs, start=1):
                on_progress(
                    stage="reading",
                    message=f"Reading {filename}",
                    progress=0.05,
                    doc_index=idx,
                    doc_total=len(docs),
                )
            on_progress(stage="chunking", message="Splitting", progress=0.15)
        return TenderResponse(
            tender_id=tender_id,
            title=title,
            requirements=[],
            source_docs=[
                SourceDoc(doc_id=doc_id, filename=filename, page_count=1)
                for doc_id, _path, filename in docs
            ],
            capability_docs=[],
            award_criteria=[],
        )

    monkeypatch.setattr(api, "run_pipeline_multi", fake_run_pipeline_multi)
    files = [
        ("files", (DOCX_FIXTURE.name, DOCX_FIXTURE.open("rb"), "application/octet-stream")),
        ("files", (CSV_FIXTURE.name, CSV_FIXTURE.open("rb"), "text/csv")),
    ]
    try:
        resp = client.post("/tenders/upload", files=files)
    finally:
        for _, (_, fh, _) in files:
            fh.close()
    assert resp.status_code == 200, resp.text

    job = client.get(f"/tenders/jobs/{resp.json()['job_id']}").json()
    assert job["files_total"] == 2
    assert job["files_done"] == 2
    assert [d["filename"] for d in job["docs"]] == [
        "sample-return-forms.docx",
        "sample-compliance.csv",
    ]
    assert {d["stage"] for d in job["docs"]} == {"done"}


@pytest.mark.skipif(not _PDF_FIXTURES, reason="no real PDF fixture available in data/tenders/")
def test_mixed_pdf_and_docx_pack_preserves_provenance(client):
    resp = _upload(client, [_PDF_FIXTURES[0], DOCX_FIXTURE])
    assert resp.status_code == 200
    tid = resp.json()["tender_id"]
    full = client.get(f"/tenders/{tid}/requirements").json()
    filenames = {d["filename"] for d in full["source_docs"]}
    assert filenames == {_PDF_FIXTURES[0].name, "sample-return-forms.docx"}

    docx_reqs = [r for r in full["requirements"] if r["source_filename"] == "sample-return-forms.docx"]
    assert docx_reqs, "expected at least one requirement sourced from the DOCX"
    for r in docx_reqs:
        assert r["source_rect"] is None
        assert r["source_rect_match"] is None


def test_docx_only_pack_never_gets_fake_pdf_highlight(client):
    resp = _upload(client, [DOCX_FIXTURE])
    tid = resp.json()["tender_id"]
    full = client.get(f"/tenders/{tid}/requirements").json()
    for r in full["requirements"]:
        assert r["source_rect"] is None
        assert r["source_rect_match"] is None


def test_existing_pdf_only_path_still_works(client):
    if not _PDF_FIXTURES:
        pytest.skip("no real PDF fixture available in data/tenders/")
    resp = _upload(client, [_PDF_FIXTURES[0]])
    assert resp.status_code == 200
    assert resp.json()["requirement_count"] >= 0
