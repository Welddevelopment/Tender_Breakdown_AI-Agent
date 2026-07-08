"""Worker mapping seams (production queue, backend/worker.py).

The queue-claim SQL itself needs live Postgres (verified in the production E2E), but the
data seams are pure and must be exact: a Requirement survives the trip through the
requirements table unchanged (locked wire schema in → row params → wire schema out), and
jsonb fields serialise/deserialise correctly. Skipped without backend deps, like the
other FastAPI-adjacent suites.
"""
from __future__ import annotations

import json

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("psycopg")
pytest.importorskip("httpx")

from backend.app.schema import Answer, Decision, EvidenceRef, OpenQuestion, Requirement
from backend.worker import _JSONB_FIELDS, requirement_to_params, row_to_requirement


def _rich_requirement() -> Requirement:
    """One requirement exercising every column, nested jsonb included."""
    return Requirement(
        id="req-0007",
        text="The supplier must hold ISO 9001 certification.",
        source_page=14,
        source_clause="Section 4.2.1",
        source_excerpt="Suppliers MUST hold ISO 9001…",
        type="mandatory",
        is_gating=True,
        category="certification",
        confidence=0.92,
        status="accepted",
        needs_review=False,
        decision=Decision(action="approve", note="checked", timestamp="2026-07-08T10:00:00Z"),
        criteria_ref="award-criterion-3",
        depends_on=["req-0002"],
        draft_answer="We hold ISO 9001:2015.",
        answer=Answer(
            text="We hold ISO 9001:2015.",
            state="auto",
            evidence_refs=[EvidenceRef(doc_id="cap-003", excerpt="ISO 9001:2015 cert", page=4)],
            confidence=0.88,
        ),
        open_questions=[OpenQuestion(id="q-1", question="Expiry date?")],
        source_doc_id="d2",
        source_filename="itt.pdf",
        source_rect=[[10.0, 20.0, 300.0, 32.0]],
        source_rect_match="exact",
    )


def test_round_trip_preserves_the_locked_schema():
    original = _rich_requirement()
    params = requirement_to_params(original)

    # Simulate the row coming back from Postgres: jsonb columns arrive deserialised.
    row = dict(params)
    for field in _JSONB_FIELDS:
        if row.get(field) is not None:
            row[field] = json.loads(row[field])

    restored = row_to_requirement(row)
    assert restored.model_dump() == original.model_dump()


def test_params_serialise_jsonb_and_map_req_id():
    params = requirement_to_params(_rich_requirement())
    assert params["req_id"] == "req-0007"
    assert "id" not in params
    # jsonb fields go over the wire as JSON strings for the %s::jsonb-less insert…
    assert isinstance(params["decision"], str) and json.loads(params["decision"])["action"] == "approve"
    assert json.loads(params["depends_on"]) == ["req-0002"]
    # …and scalars stay native.
    assert params["is_gating"] is True
    assert params["confidence"] == pytest.approx(0.92)


def test_nullable_jsonb_fields_stay_null():
    bare = Requirement(
        id="req-0001", text="t", source_page=1, source_excerpt="e",
        type="optional", is_gating=False, category="", confidence=0.5,
    )
    params = requirement_to_params(bare)
    assert params["decision"] is None
    assert params["answer"] is None
    assert params["source_rect"] is None
    restored = row_to_requirement({**params, "depends_on": [], "open_questions": []})
    assert restored.decision is None and restored.answer is None
