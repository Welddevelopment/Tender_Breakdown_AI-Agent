"""Regression tests for backend/app/extract.py — the Day-4 accuracy pass (P).

Pins the behaviour of the extraction tuning so a later refactor can't silently
regress it: soft-wrap reflow, the NOT-a-requirement filter, precise gating signals,
the added mandatory-recall verbs, whitespace-flexible page location, and the
multi-pass union's default no-op. Uses the key-free HeuristicExtractor only.

Bridges into the backend package; skipped in a pure-engine checkout.
"""
import os

import pytest

extract = pytest.importorskip("backend.app.extract")
chunk_mod = pytest.importorskip("backend.app.chunk")

Chunk = chunk_mod.Chunk


def _chunk(text: str) -> "Chunk":
    return Chunk(id="c001", text=text, page_start=1, page_end=1, page_map=[(0, 1)])


# ---- soft-wrap reflow (kills mid-sentence fragment "rules") -------------------

def test_soft_wrap_joins_midsentence_newline():
    # lowercase/comma before + lowercase/open-paren after = a wrap, join to a space
    assert extract._SOFT_WRAP.sub(" ", "provide\nall") == "provide all"


def test_soft_wrap_keeps_sentence_boundary():
    # a capitalised next line is a new clause/heading — must NOT be joined
    assert "\n" in extract._SOFT_WRAP.sub(" ", "equipment.\nThe Contractor")


def test_reflow_yields_whole_requirement_not_fragments():
    ch = _chunk("The Tenderer shall provide\nall necessary equipment for the works.")
    reqs = extract.HeuristicExtractor().extract_chunk(ch)
    assert len(reqs) == 1
    assert "provide all necessary equipment" in reqs[0]["text"].lower()


# ---- NOT-a-requirement filter -----------------------------------------------

def test_reject_continuation_fragment():
    # begins lowercase -> a leftover mid-sentence fragment, not an obligation
    assert extract._looks_like_requirement(
        "as to the accuracy of the information stated in the Tender which shall") is False


def test_reject_buyer_side_opener():
    assert extract._looks_like_requirement(
        "The Authority will select the preferred bidder at its discretion.") is False


def test_reject_dangling_tail_fragment():
    assert extract._looks_like_requirement(
        "The Contractor shall provide the following equipment and") is False


def test_accept_real_obligation():
    assert extract._looks_like_requirement(
        "The Contractor shall provide clean, presentable uniforms for staff.") is True


# ---- gating precision (no bare "minimum"/"failure to") ----------------------

def test_minimum_standard_is_not_gating():
    assert extract._is_gating(
        "The minimum standard of cleanliness must be maintained daily.", "mandatory") is False


def test_explicit_disqualifier_is_gating():
    assert extract._is_gating(
        "A late tender will not be considered.", "mandatory") is True


def test_exclusion_phrase_is_gating():
    assert extract._is_gating(
        "Non-compliant bids will result in exclusion from the process.", "mandatory") is True


# ---- mandatory-recall verbs --------------------------------------------------

def test_responsible_for_classifies_mandatory():
    assert extract._classify_type("The Contractor is responsible for pest control.") == "mandatory"


def test_will_provide_classifies_mandatory():
    assert extract._classify_type("The Contractor will provide six air-care units.") == "mandatory"


# ---- whitespace-flexible page location (survives reflow offset shift) --------

def test_find_in_original_tolerates_wrap_whitespace():
    haystack = "intro. The  Contractor\nshall provide staff. end."
    idx = extract._find_in_original(haystack, "The Contractor shall provide staff")
    assert idx == haystack.index("The  Contractor")


def test_find_in_original_returns_minus_one_when_absent():
    assert extract._find_in_original("nothing relevant here", "a totally different sentence") == -1


# ---- multi-pass union: default is an exact no-op -----------------------------

def test_extract_chunk_multi_default_is_noop(monkeypatch):
    monkeypatch.delenv("EXTRACT_PASSES", raising=False)
    ch = _chunk("The Contractor shall provide staff. Records must be kept on site.")
    ex = extract.HeuristicExtractor()
    assert extract.extract_chunk_multi(ex, ch) == ex.extract_chunk(ch)


def test_extract_chunk_multi_noop_for_heuristic_even_when_passes_set(monkeypatch):
    # extra passes are OpenAI-only; the heuristic must never be run N times
    monkeypatch.setenv("EXTRACT_PASSES", "3")
    ch = _chunk("The Contractor shall provide staff.")
    ex = extract.HeuristicExtractor()
    assert extract.extract_chunk_multi(ex, ch) == ex.extract_chunk(ch)


# ---- bullet-inheritance recall (list items under a mandatory stem) ----------

def test_list_stem_detected():
    assert extract._is_list_stem("A tender shall only be accepted if:") is True
    # no colon -> not a stem
    assert extract._is_list_stem("The Contractor shall provide staff.") is False
    # colon but no binding signal -> not a stem
    assert extract._is_list_stem("The following applies:") is False


def test_bulleted_obligations_inherit_the_stem():
    # the two bullets carry no modal of their own; they must be picked up under the stem
    ch = _chunk(
        "A tender shall only be accepted if:\n"
        "The submission is in the English language and prices in pounds sterling.\n"
        "The submission is complete and fully compliant with this ITT."
    )
    reqs = extract.HeuristicExtractor().extract_chunk(ch)
    texts = " || ".join(r["text"].lower() for r in reqs)
    assert "english language" in texts
    assert "fully compliant" in texts


def test_inheritance_does_not_run_without_a_stem():
    # signal-less lines with no governing stem stay dropped (precision guard)
    ch = _chunk(
        "This section describes the site.\n"
        "The submission is in the English language.\n"
        "Prices are in pounds sterling."
    )
    reqs = extract.HeuristicExtractor().extract_chunk(ch)
    assert reqs == []


# ---- precision: advisory/aspirational + buyer-org filtering -----------------

def test_aspirational_optional_is_dropped():
    # soft guidance with no hard modal — over-surfaces, drop it
    assert extract._looks_like_requirement(
        "Applicants should be aware that late submissions may not be accepted.") is False
    assert extract._looks_like_requirement(
        "Where possible, opportunities to enhance biodiversity should be identified.") is False


def test_aspirational_with_hard_modal_is_kept():
    # a real mandatory signal overrides the aspirational marker
    assert extract._looks_like_requirement(
        "The Contractor must, where appropriate, provide evidence of training.") is True


def test_buyer_org_subject_is_dropped():
    # the buyer describing itself, wrongly caught by the 'responsible for' signal
    assert extract._looks_like_requirement(
        "The SPSO is responsible for considering complaints about public services.") is False
    assert extract._looks_like_requirement(
        "The Council may send these clarifications to all parties.") is False


def test_glossary_definition_is_dropped():
    # a Definitions-section entry, not an obligation (even though it contains "shall")
    assert extract._looks_like_requirement(
        "Award | The process by which the Council shall determine to whom the Contract is awarded.") is False
    assert extract._looks_like_requirement(
        "Pesticides means chemicals and proprietary products for the control of pests.") is False
    # a real form/pricing row ("… | Confirm/Decline") must NOT be caught as glossary
    assert extract._looks_like_requirement(
        "All costs must be provided in pounds sterling exclusive of VAT.") is True


# ---- determinism knobs are present ------------------------------------------

def test_extract_seed_is_fixed():
    assert isinstance(extract.EXTRACT_SEED, int)
