from engine.similarity import (
    similarity, token_similarity, TEXT_SIM_THRESHOLD, TOKEN_SIM_FLOOR,
)


def test_identical_text_is_1():
    assert similarity("ISO 9001 certification", "ISO 9001 certification") == 1.0


def test_iso_pair_clears_both_gates(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    a, b = reqs["raw-c003-0001"]["text"], reqs["raw-c004-0001"]["text"]
    assert similarity(a, b) >= TEXT_SIM_THRESHOLD          # 0.7529 >= 0.66
    assert token_similarity(a, b) >= TOKEN_SIM_FLOOR       # 0.2727 >= 0.20


def test_insurance_vs_turnover_blocked_by_token_floor(raw_envelope):
    # CRITICAL conservatism guard: two DIFFERENT mandatory/gating disqualifiers.
    # char-ratio (0.6443) sneaks above the text gate; the token floor MUST block them.
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    a, b = reqs["raw-c008-0002"]["text"], reqs["raw-c027-0001"]["text"]
    assert token_similarity(a, b) < TOKEN_SIM_FLOOR        # 0.1111 < 0.20 => NOT mergeable


def test_insurance_vs_casestudies_low(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    a, b = reqs["raw-c008-0002"]["text"], reqs["raw-c033-0003"]["text"]
    assert similarity(a, b) < TEXT_SIM_THRESHOLD


def test_normalisation_is_case_and_whitespace_insensitive():
    assert similarity("ISO  9001", "iso 9001") >= 0.95


def test_is_deterministic():
    a = similarity("the supplier shall hold ISO 9001", "supplier must hold ISO 9001 cert")
    b = similarity("the supplier shall hold ISO 9001", "supplier must hold ISO 9001 cert")
    assert a == b
