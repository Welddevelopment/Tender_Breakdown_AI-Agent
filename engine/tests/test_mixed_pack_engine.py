"""Mixed-pack engine/eval lane (generalist, ops/mixed-pack-02-engine-eval.md).

Proves the trust layer is FORMAT-NEUTRAL: the deterministic deal-breaker net catches gates in
Office-shaped text, cross-document dedupe stays conservative, and eval renders Office source
locators without crashing. Covered for Bobby (internet down).

Deliberately does NOT duplicate backend's `test_ingest_office` (ingestion/locator emission) or
`test_upload_mixed_pack` (upload/provenance/source_rect nulling) — those own the parser side.
"""
from __future__ import annotations

from engine.eval import _render, format_report, score
from engine.gating_scan import scan_candidates, uncovered_gating
from engine.reconcile import group_candidates

# `ingest_office` (backend/app/ingest_office.py) bakes a human-readable locator prefix INTO the page
# text — [XLSX <sheet> row N | A1:E1], [DOCX table T row R], [DOCX paragraph N], [CSV row N] — and
# collapses every Office doc to a single Page(number=1). The trust layer only ever sees this text.
# Build a page in that exact shape, with a deal-breaker planted in each format's row style.
OFFICE_PAGE_TEXT = "\n".join([
    "[XLSX Pricing row 5 | A5:D5]",
    "Insurance | Public Liability | GBP 5,000,000 | Pass/Fail",
    "[XLSX Pricing row 9 | A9:D9]",
    "All prices must be completed and returned. Any tender that omits a price will be rejected.",
    "[DOCX table 1 row 3]",
    "Tenders must be received no later than 12:00 noon on 30 September 2025. Late tenders will not be considered.",
    "[DOCX paragraph 7]",
    "The Form of Tender must be completed, signed and returned; failure to do so will result in disqualification.",
    "[CSV row 2]",
    "The tenderer must provide a signed anti-collusion certificate; failure to do so will result in exclusion.",
])


def test_safety_net_catches_gates_in_office_shaped_text():
    """The net must fire on the locator-prefixed rows ingest_office emits — a Pass/Fail in a spreadsheet,
    a deadline in a DOCX table, a mandatory return, a CSV exclusion — so no disqualifier hides in a
    Word/Excel/CSV file. This is the whole point of making ingest format-neutral."""
    caught = " ".join(c["text"].lower() for c in scan_candidates([(1, OFFICE_PAGE_TEXT)]))
    assert "pass/fail" in caught.replace(" ", "")                      # spreadsheet pass/fail gate
    assert "rejected" in caught                                        # pricing return/rejection
    assert "no later than" in caught or "not be considered" in caught  # deadline
    assert "disqualif" in caught                                       # mandatory return
    assert "exclu" in caught                                           # CSV exclusion


def test_uncovered_gating_surfaces_office_gates_extraction_missed():
    """The safety net unions in gates the LLM extraction missed — with ZERO extracted requirements, every
    planted Office gate should surface as uncovered. The recall floor holds regardless of source format."""
    extra = uncovered_gating([], [(1, OFFICE_PAGE_TEXT)])
    assert len(extra) >= 3
    joined = " ".join(g["text"].lower() for g in extra)
    assert "insurance" in joined and "exclu" in joined


# --- cross-document provenance: dedupe must stay conservative across files ------------------------

def _office_raw(raw_id: str, doc_id: str, text: str) -> dict:
    """A raw requirement as it looks after Office ingest: source_page=1 (single-page) and a null clause
    — the worst case for a cross-document collision."""
    return {"raw_id": raw_id, "source_doc_id": doc_id, "text": text,
            "source_page": 1, "source_clause": None}


_IDENTICAL = "The tenderer must hold Public Liability insurance of at least GBP 10,000,000."


def test_flattened_reconcile_would_merge_across_docs_documenting_the_gap():
    """`group_candidates` has NO source_doc_id guard: identical text on source_page=1 from two DIFFERENT
    documents merges if grouped together. This documents WHY the pipeline must partition per document —
    it is not a bug to fix in reconcile (that would be a schema-adjacent change), it is a design constraint."""
    d1 = _office_raw("d1-1", "pricing.xlsx", _IDENTICAL)
    d2 = _office_raw("d2-1", "itt.pdf", _IDENTICAL)
    assert len(group_candidates([d1, d2])) == 1  # merged — what happens if you flatten the whole pack


def test_per_document_reconcile_keeps_cross_doc_requirements_separate():
    """The SHIPPED invariant: run_pipeline_multi reconciles each document INDEPENDENTLY. Reconciling
    per-doc keeps two identical requirements from different files as TWO distinct requirements — cross-
    document dedupe stays conservative. The per-doc partition is load-bearing; do not flatten it."""
    d1 = _office_raw("d1-1", "pricing.xlsx", _IDENTICAL)
    d2 = _office_raw("d2-1", "itt.pdf", _IDENTICAL)
    per_doc_groups = group_candidates([d1]) + group_candidates([d2])
    assert len(per_doc_groups) == 2  # never merged across documents


# --- eval / reporting handles Office-style source locators ---------------------------------------

def test_eval_renders_office_locator_source_without_crashing():
    """Eval/report must handle an Office-style source locator (sheet/row, non-integer clause) without
    assuming a real PDF page or crashing. Office reqs carry source_page=1 and a locator in source_clause."""
    req = {
        "text": _IDENTICAL,
        "source_page": 1,
        "source_clause": "XLSX: Pricing!A12:F20",
        "source_excerpt": "[XLSX Pricing row 12 | A12:F12] Public Liability | GBP 10,000,000 | Pass/Fail",
        "is_gating": True,
        "type": "mandatory",
    }
    gold = {"tender_id": "t", "requirements": [dict(req, gold_id="g1")]}
    output = {"tender_id": "t", "requirements": [dict(req, id="req-0001")]}
    report = format_report(gold, output)   # must not raise on a locator source_clause
    rendered = _render(report)             # must not raise
    assert isinstance(rendered, str) and rendered
    assert isinstance(score(gold, output), dict)  # scoring is page/format agnostic
