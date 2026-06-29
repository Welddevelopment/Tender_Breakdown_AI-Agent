"""Adversarial trust-invariant suite — a judge-style attack battery on the four
claims Bidframe's demo rests on. Deterministic, offline (no network, no LLM): it
codifies the SAFETY INVARIANTS so a future change can't silently break them.

The four claims under attack:
  1. Reconcile is conservative — it never silently merges two DIFFERENT requirements
     (a wrongly-merged requirement is a silent miss, the worst failure).
  2. Safety escalation — a disqualifier is never downgraded by a merge.
  3. Autofill never bluffs — it grounds in real evidence or flags needs_input.
  4. The eval can't hide a disqualifier miss — a missed gating req always surfaces.

Known, documented limitation (NOT a regression — see comms G-015): reconcile is
lexical, so two near-identical-but-different requirements that share the SAME page
AND clause could merge. The page+clause AND-gate is the mitigation (the extractor
clause-separates distinct requirements); a semantic guard is future work.
"""
from __future__ import annotations

from engine.reconcile import (
    _mergeable, group_candidates, merge_group, reconcile, NEEDS_REVIEW_THRESHOLD,
)
from engine.similarity import token_similarity, TOKEN_SIM_FLOOR
from engine.eval import score
from engine.answer import MockAnswerer, draft_all, draft_answer
from engine.eval_answers import verify_groundedness


def _raw(rid, text, page=1, clause="4.1", gating=False, typ="mandatory", conf=0.9,
         excerpt=None, char_start=0):
    return {"raw_id": rid, "text": text, "source_page": page, "source_clause": clause,
            "source_excerpt": excerpt or text, "char_start": char_start,
            "type": typ, "is_gating": gating, "category": "general", "confidence": conf}


DUP_A = "The supplier shall hold valid ISO 9001 certification at the time of tender submission."
DUP_B = "The supplier must hold a valid ISO 9001 certification at the point of submission."


# --------------------------------------------------------------------------- #
# Claim 1 — conservative reconcile (never silently merge different requirements)
# --------------------------------------------------------------------------- #
def test_genuine_cross_chunk_duplicate_does_merge():
    """Positive control: a real duplicate SHOULD merge (else we're uselessly conservative)."""
    a, b = _raw("a", DUP_A, conf=0.92), _raw("b", DUP_B, conf=0.91)
    assert _mergeable(a, b) is True
    groups = group_candidates([a, b])
    assert len(groups) == 1
    assert merge_group(groups[0])["confidence"] > 0.92   # noisy-OR corroborates above either


def test_different_page_never_merges_even_if_identical_text():
    a, b = _raw("a", DUP_A, page=3), _raw("b", DUP_A, page=4)
    assert _mergeable(a, b) is False
    assert len(group_candidates([a, b])) == 2


def test_different_clause_never_merges_even_if_identical_text():
    a, b = _raw("a", DUP_A, clause="4.1"), _raw("b", DUP_A, clause="4.2")
    assert _mergeable(a, b) is False
    assert len(group_candidates([a, b])) == 2


def test_null_clause_never_merges():
    """Conservative: a null clause is not a match key — don't merge on it."""
    a, b = _raw("a", DUP_A, clause=None), _raw("b", DUP_A, clause=None)
    assert _mergeable(a, b) is False
    assert len(group_candidates([a, b])) == 2


def test_low_token_overlap_never_merges_insurance_vs_turnover():
    """The token-Jaccard floor blocks lexically-structured but different requirements."""
    ins = _raw("a", "The supplier must hold valid public liability insurance cover.")
    tov = _raw("b", "The supplier must demonstrate sufficient annual financial turnover.")
    assert _mergeable(ins, tov) is False
    assert len(group_candidates([ins, tov])) == 2


def test_token_metric_separates_different_topics():
    assert token_similarity(
        "valid public liability insurance cover",
        "sufficient annual financial turnover",
    ) < TOKEN_SIM_FLOOR


# --------------------------------------------------------------------------- #
# Claim 2 — safety escalation (a disqualifier is never downgraded by a merge)
# --------------------------------------------------------------------------- #
def test_merge_escalates_gating_and_mandatory_from_any_member():
    plain = _raw("a", DUP_A, gating=False, typ="optional", conf=0.70)
    deal_breaker = _raw("b", DUP_B, gating=True, typ="mandatory", conf=0.60)
    m = merge_group([plain, deal_breaker])
    assert m["is_gating"] is True       # disqualifier survives the merge
    assert m["type"] == "mandatory"


def test_merged_confidence_never_below_any_member():
    members = [_raw("a", DUP_A, conf=0.55), _raw("b", DUP_B, conf=0.80)]
    m = merge_group(members)
    assert m["confidence"] >= max(0.55, 0.80)   # noisy-OR is monotonic up


# --------------------------------------------------------------------------- #
# Claim 3 — autofill never bluffs (grounds in real evidence or flags needs_input)
# --------------------------------------------------------------------------- #
def _caps():
    return [{"doc_id": "cap-iso", "filename": "cap-iso.txt", "passages": [
        {"doc_id": "cap-iso", "page": 1,
         "text": "AcmeClean holds ISO 9001 certification number 12345 issued by BSI."}]}]


def test_no_evidence_yields_needs_input_never_fabrication():
    req = {"id": "r", "text": "Supplier must operate a fleet of electric delivery vehicles."}
    out = MockAnswerer().draft(req, evidence=[])
    assert out["state"] == "needs_input"
    assert out["text"] == "" and out["evidence_refs"] == []


def test_every_grounded_answer_cites_real_evidence():
    reqs = [{"id": "r1", "text": "The supplier must hold ISO 9001 certification.",
             "type": "mandatory", "is_gating": True},
            {"id": "r2", "text": "Provide a fleet of electric vehicles.",
             "type": "mandatory", "is_gating": False}]
    enriched, _q = draft_all(reqs, _caps(), MockAnswerer())
    report = verify_groundedness(enriched, _caps())
    assert report["grounded"] >= 1
    assert report["bluffs"] == 0          # every 'auto' answer cites a real passage


def test_groundedness_detector_catches_a_planted_fabrication():
    planted = [{"id": "r1", "answer": {"state": "auto", "text": "We hold it.",
                "evidence_refs": [{"doc_id": "cap-iso",
                "excerpt": "AcmeClean holds ISO 27001 and Cyber Essentials Plus since 2018.",
                "page": 1}], "confidence": 0.9}}]
    report = verify_groundedness(planted, _caps())
    assert report["bluffs"] >= 1          # the detector cannot be fooled


# --------------------------------------------------------------------------- #
# Claim 4 — the eval can't hide a disqualifier miss
# --------------------------------------------------------------------------- #
def test_missed_gating_requirement_is_always_dangerous():
    gold = {"requirements": [{"id": "g1", "text": "Bid must include a signed pass/fail declaration.",
                              "is_gating": True, "source_page": 1}]}
    out = {"requirements": []}            # tool found nothing
    s = score(gold, out)
    assert s["dangerous_misses"] >= 1 and s["gating_recall"] == 0.0


def test_found_but_unflagged_disqualifier_loses_gating_recall():
    """Finding the disqualifier but NOT flagging it gating must drop gating recall."""
    text = "Bid must include a signed pass/fail declaration."
    gold = {"requirements": [{"id": "g1", "text": text, "is_gating": True, "source_page": 1}]}
    out = {"requirements": [{"id": "o1", "text": text, "is_gating": False, "source_page": 1}]}
    s = score(gold, out)
    assert s["tp"] >= 1                   # it WAS matched (found)
    assert s["gating_recall"] == 0.0      # but flagging matters — we measure the failure


# --------------------------------------------------------------------------- #
# Claim 5 — robustness (degenerate input never crashes)
# --------------------------------------------------------------------------- #
def test_reconcile_empty_envelope():
    final, report = reconcile({"raw_requirements": []})
    assert final["requirements"] == [] and report["final_count"] == 0


def test_group_candidates_empty():
    assert group_candidates([]) == []


def test_merge_group_tolerates_null_char_start():
    m = merge_group([_raw("a", DUP_A, char_start=None)])
    assert m["_char_start"] == 0          # None offset coerced, no crash


def test_autofill_handles_empty_inputs():
    assert draft_all([], _caps(), MockAnswerer()) == ([], [])
    enriched, _q = draft_all([{"id": "r", "text": "x"}], [], MockAnswerer())
    assert enriched[0]["answer"]["state"] == "needs_input"   # no docs => honest gap


def test_empty_requirement_text_does_not_crash():
    out = draft_answer({"id": "r", "text": ""}, _caps()[0]["passages"], MockAnswerer())
    assert out["state"] == "needs_input"
