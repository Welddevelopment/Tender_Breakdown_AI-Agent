import pytest

from engine.reconcile import merge_group


def _iso_group(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    return [reqs["raw-c003-0001"], reqs["raw-c004-0001"]]


def test_noisy_or_confidence_exact(raw_envelope):
    assert merge_group(_iso_group(raw_envelope))["confidence"] == 0.9928


def test_corroboration_raises_above_either_member(raw_envelope):
    c = merge_group(_iso_group(raw_envelope))["confidence"]
    assert c > 0.94 and c > 0.88


def test_canonical_is_c003(raw_envelope):
    m = merge_group(_iso_group(raw_envelope))
    assert m["source_page"] == 14
    assert m["source_clause"] == "Section 4.2.1"
    assert m["source_excerpt"] == (
        "Bidders shall hold a valid ISO 9001 certification at the point of submission. "
        "Failure to evidence this will result in the bid being rejected."
    )
    assert m["text"] == (
        "The supplier shall hold a valid ISO 9001 certification at the time of tender submission."
    )


def test_excerpt_is_a_verbatim_member_excerpt_not_spliced(raw_envelope):
    grp = _iso_group(raw_envelope)
    m = merge_group(grp)
    assert m["source_excerpt"] in {g["source_excerpt"] for g in grp}


def test_safety_escalation_mandatory_and_gating(raw_envelope):
    m = merge_group(_iso_group(raw_envelope))
    assert m["type"] == "mandatory" and m["is_gating"] is True


def test_safety_escalation_never_downgrades_mixed_members():
    a = {"raw_id": "a", "text": "x", "source_page": 1, "source_clause": "S",
         "source_excerpt": "x", "char_start": 0,
         "type": "mandatory", "is_gating": True, "category": "legal", "confidence": 0.80}
    b = {"raw_id": "b", "text": "x", "source_page": 1, "source_clause": "S",
         "source_excerpt": "x longer", "char_start": 0,
         "type": "optional", "is_gating": False, "category": "legal", "confidence": 0.70}
    m = merge_group([a, b])
    assert m["type"] == "mandatory" and m["is_gating"] is True


def test_singleton_passes_confidence_through_verbatim(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    m = merge_group([reqs["raw-c027-0001"]])
    assert m["confidence"] == 0.62                 # verbatim, no arithmetic/round
    assert m["type"] == "mandatory" and m["is_gating"] is True


def test_singleton_sets_interim_ordering_fields(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    m = merge_group([reqs["raw-c027-0001"]])
    assert m["_char_start"] == 88
    assert m["_member_raw_ids"] == ["raw-c027-0001"]


def test_empty_group_raises():
    with pytest.raises(ValueError):
        merge_group([])


def test_canonical_tiebreak_excerpt_length_then_char_start():
    a = {"raw_id": "a", "text": "ta", "source_page": 1, "source_clause": "S",
         "source_excerpt": "short", "char_start": 50,
         "type": "optional", "is_gating": False, "category": "x", "confidence": 0.80}
    b = {"raw_id": "b", "text": "tb", "source_page": 1, "source_clause": "S",
         "source_excerpt": "a much longer excerpt span", "char_start": 90,
         "type": "optional", "is_gating": False, "category": "x", "confidence": 0.80}
    assert merge_group([a, b])["text"] == "tb"      # longer excerpt => canonical b
    c = {"raw_id": "c", "text": "tc", "source_page": 1, "source_clause": "S",
         "source_excerpt": "same length here!!", "char_start": 10,
         "type": "optional", "is_gating": False, "category": "x", "confidence": 0.80}
    d = {"raw_id": "d", "text": "td", "source_page": 1, "source_clause": "S",
         "source_excerpt": "same length here!!", "char_start": 99,
         "type": "optional", "is_gating": False, "category": "x", "confidence": 0.80}
    assert merge_group([c, d])["text"] == "tc"      # equal len => lower char_start => c
