"""Groundedness eval — turns "the autofill never bluffs" into an auditable number.

A bluff = a grounded ("auto") answer whose cited evidence can't be found in the
bidder's capability docs (a hallucinated citation), OR an "auto" answer with no
evidence at all. Deterministic string/token check — no LLM judge.
"""
from __future__ import annotations

from engine.eval_answers import verify_groundedness


CAPS = [
    {
        "doc_id": "cap-iso",
        "filename": "cap-iso.txt",
        "passages": [
            {"doc_id": "cap-iso", "page": 1,
             "text": "AcmeClean holds ISO 9001 certification number 12345 issued by BSI."},
        ],
    }
]


def _auto(rid, excerpt, doc_id="cap-iso"):
    return {"id": rid, "answer": {"state": "auto", "text": "We comply.",
            "evidence_refs": [{"doc_id": doc_id, "excerpt": excerpt, "page": 1}], "confidence": 0.9}}


def test_grounded_answer_with_real_evidence_is_clean():
    reqs = [_auto("r1", "AcmeClean holds ISO 9001 certification number 12345 issued by BSI.")]
    report = verify_groundedness(reqs, CAPS)
    assert report["grounded"] == 1
    assert report["verified_citations"] == 1
    assert report["bluffs"] == 0
    assert report["clean"] is True


def test_hallucinated_citation_is_flagged():
    reqs = [_auto("r1", "AcmeClean holds ISO 27001 and Cyber Essentials Plus since 2018.")]
    report = verify_groundedness(reqs, CAPS)
    assert report["bluffs"] == 1
    assert report["clean"] is False
    assert report["hallucinated_citations"][0]["req_id"] == "r1"


def test_fabricated_doc_id_is_flagged():
    reqs = [_auto("r1", "AcmeClean holds ISO 9001 certification number 12345 issued by BSI.",
                  doc_id="cap-does-not-exist")]
    report = verify_groundedness(reqs, CAPS)
    assert report["bluffs"] == 1


def test_auto_with_no_evidence_is_a_bluff():
    reqs = [{"id": "r1", "answer": {"state": "auto", "text": "We comply.",
             "evidence_refs": [], "confidence": 0.9}}]
    report = verify_groundedness(reqs, CAPS)
    assert report["empty_evidence_autos"] == ["r1"]
    assert report["bluffs"] == 1


def test_needs_input_is_honest_not_a_bluff():
    reqs = [{"id": "r1", "answer": {"state": "needs_input", "text": "",
             "evidence_refs": [], "confidence": 0.0}}]
    report = verify_groundedness(reqs, CAPS)
    assert report["needs_input"] == 1
    assert report["bluffs"] == 0
    assert report["clean"] is True


def test_minor_reformatting_still_verifies():
    # whitespace/case differences shouldn't count as fabrication
    reqs = [_auto("r1", "acmeclean   holds ISO 9001 certification number 12345 issued by bsi")]
    report = verify_groundedness(reqs, CAPS)
    assert report["bluffs"] == 0
