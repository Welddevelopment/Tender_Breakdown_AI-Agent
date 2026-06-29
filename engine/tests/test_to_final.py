import pytest

from engine.reconcile import merge_group, to_final

FINAL_KEYS = {
    "id", "text", "source_page", "source_clause", "source_excerpt", "type",
    "is_gating", "category", "confidence", "status", "needs_review", "decision",
    "criteria_ref", "depends_on", "draft_answer",
}
FORBIDDEN = {"raw_id", "chunk_id", "char_start", "char_end", "extractor_notes",
             "_char_start", "_member_raw_ids", "answer", "open_questions", "capability_docs"}


def _final_for(raw_envelope, raw_id, req_id="req-0001"):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    return to_final(merge_group([reqs[raw_id]]), req_id)


def test_final_has_exactly_15_locked_keys(raw_envelope):
    f = _final_for(raw_envelope, "raw-c008-0002")
    assert set(f.keys()) == FINAL_KEYS
    assert len(FINAL_KEYS) == 15


def test_no_forbidden_fields_leak(raw_envelope):
    f = _final_for(raw_envelope, "raw-c008-0002")
    assert FORBIDDEN.isdisjoint(f.keys())


def test_defaults_are_correct(raw_envelope):
    f = _final_for(raw_envelope, "raw-c008-0002")
    assert f["status"] == "pending"
    assert f["decision"] is None
    assert f["criteria_ref"] is None
    assert f["depends_on"] == []
    assert f["draft_answer"] is None


def test_tolerates_raw_item_missing_optional_keys():
    raw = {"raw_id": "m1", "text": "t", "source_page": 3, "source_clause": "S",
           "source_excerpt": "t", "char_start": 0,
           "type": "optional", "is_gating": False, "category": "x", "confidence": 0.90}
    f = to_final(merge_group([raw]), "req-0001")
    assert f["criteria_ref"] is None and f["depends_on"] == []


def test_needs_review_boundary_strict_less_than():
    # Boundary pinned to the calibrated NEEDS_REVIEW_THRESHOLD (0.70).
    def nr(conf):
        raw = {"raw_id": "b", "text": "t", "source_page": 1, "source_clause": "S",
               "source_excerpt": "t", "char_start": 0, "type": "optional",
               "is_gating": False, "category": "x", "confidence": conf}
        return to_final(merge_group([raw]), "req-0001")["needs_review"]
    assert nr(0.69) is True
    assert nr(0.70) is False
    assert nr(0.71) is False


def test_merged_iso_clears_needs_review(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    m = merge_group([reqs["raw-c003-0001"], reqs["raw-c004-0001"]])
    f = to_final(m, "req-0001")
    assert f["confidence"] == 0.9928 and f["needs_review"] is False


def test_draft_answer_is_null_in_reconcile_step(raw_envelope):
    f = _final_for(raw_envelope, "raw-c008-0002")
    assert f["draft_answer"] is None


def test_raw_id_in_depends_on_is_rejected():
    raw = {"raw_id": "d1", "text": "t", "source_page": 1, "source_clause": "S",
           "source_excerpt": "t", "char_start": 0, "type": "optional", "is_gating": False,
           "category": "x", "confidence": 0.9, "depends_on": ["raw-c003-0001"]}
    with pytest.raises(ValueError):
        to_final(merge_group([raw]), "req-0001")
