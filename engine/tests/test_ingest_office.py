"""Mixed-pack ingestion (backend lane, B-022): Word/Excel/CSV -> IngestedDoc.

Bridges into backend.app.ingest_office / backend.app.ingest. Skipped in a pure-engine
checkout without the backend deps installed, so `pytest engine/tests/` stays green on
the engine alone.
"""
from __future__ import annotations

import pytest

ingest_office = pytest.importorskip("backend.app.ingest_office")
ingest_mod = pytest.importorskip("backend.app.ingest")


def _make_docx(tmp_path):
    docx = pytest.importorskip("docx")
    path = tmp_path / "forms.docx"
    doc = docx.Document()
    doc.add_heading("Selection Questionnaire", level=1)
    doc.add_paragraph("Tenderers must provide evidence of Employer's Liability insurance.")
    table = doc.add_table(rows=1, cols=2)
    table.rows[0].cells[0].text = "Insurance"
    table.rows[0].cells[1].text = "Public Liability GBP 5m"
    doc.save(str(path))
    return path


def _make_xlsx(tmp_path):
    openpyxl = pytest.importorskip("openpyxl")
    path = tmp_path / "pricing.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Pricing"
    ws.append(["Item", "Unit", "Qty", "Price"])
    ws.append(["Widget", "each", 10, ""])
    wb.save(str(path))
    return path


def _make_csv(tmp_path):
    path = tmp_path / "compliance.csv"
    path.write_text(
        "ref,requirement,mandatory\n"
        "C1,Signed anti-collusion certificate required; failure results in exclusion.,yes\n",
        encoding="utf-8",
    )
    return path


# --------------------------------------------------------------------------- #
# Individual readers
# --------------------------------------------------------------------------- #

def test_ingest_docx_carries_heading_paragraph_and_table_locators(tmp_path):
    doc = ingest_office.ingest_docx(_make_docx(tmp_path))
    assert doc.page_count == 1
    text = doc.pages[0].text
    assert "[DOCX paragraph" in text
    assert "heading: Selection Questionnaire" in text
    assert "Employer's Liability insurance" in text
    assert "[DOCX table 1 row 1]" in text
    assert "Public Liability GBP 5m" in text


def test_ingest_xlsx_carries_sheet_and_row_locator(tmp_path):
    doc = ingest_office.ingest_xlsx(_make_xlsx(tmp_path))
    text = doc.pages[0].text
    assert "[XLSX Pricing row 1" in text
    assert "Item | Unit | Qty | Price" in text
    assert "Widget" in text


def test_ingest_csv_carries_row_locator(tmp_path):
    doc = ingest_office.ingest_csv(_make_csv(tmp_path))
    text = doc.pages[0].text
    assert "[CSV row 2]" in text
    assert "anti-collusion" in text


def test_office_readers_skip_empty_rows(tmp_path):
    openpyxl = pytest.importorskip("openpyxl")
    path = tmp_path / "sparse.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["A", "B"])
    ws.append([None, None])
    ws.append(["C", None])
    wb.save(str(path))
    doc = ingest_office.ingest_xlsx(path)
    assert doc.pages[0].text.count("[XLSX") == 2  # blank row dropped


def test_empty_docx_is_a_clean_parse_error(tmp_path):
    docx = pytest.importorskip("docx")
    path = tmp_path / "empty.docx"
    docx.Document().save(str(path))
    with pytest.raises(ingest_mod.PDFIngestError, match="readable tender text"):
        ingest_office.ingest_docx(path)


def test_empty_xlsx_is_a_clean_parse_error(tmp_path):
    openpyxl = pytest.importorskip("openpyxl")
    path = tmp_path / "empty.xlsx"
    wb = openpyxl.Workbook()
    wb.active["A1"] = None
    wb.save(str(path))
    with pytest.raises(ingest_mod.PDFIngestError, match="readable tender text"):
        ingest_office.ingest_xlsx(path)


def test_empty_csv_is_a_clean_parse_error(tmp_path):
    path = tmp_path / "empty.csv"
    path.write_text("", encoding="utf-8")
    with pytest.raises(ingest_mod.PDFIngestError, match="readable tender text"):
        ingest_office.ingest_csv(path)


def test_malformed_xlsx_is_a_clean_parse_error(tmp_path):
    path = tmp_path / "locked-or-corrupt.xlsx"
    path.write_bytes(b"not a workbook")
    with pytest.raises(ingest_mod.PDFIngestError, match="Could not parse"):
        ingest_office.ingest_xlsx(path)


# --------------------------------------------------------------------------- #
# Dispatcher
# --------------------------------------------------------------------------- #

def test_ingest_document_dispatches_by_extension(tmp_path):
    csv_path = _make_csv(tmp_path)
    doc = ingest_mod.ingest_document(csv_path)
    assert doc.filename == "compliance.csv"
    assert "anti-collusion" in doc.pages[0].text


def test_ingest_document_rejects_unsupported_extension(tmp_path):
    path = tmp_path / "diagram.png"
    path.write_bytes(b"\x89PNG\r\n")
    with pytest.raises(ingest_mod.PDFIngestError):
        ingest_mod.ingest_document(path)


def test_supported_extensions_include_office_formats():
    assert ingest_mod.SUPPORTED_EXTENSIONS == {".pdf", ".docx", ".xlsx", ".csv"}
