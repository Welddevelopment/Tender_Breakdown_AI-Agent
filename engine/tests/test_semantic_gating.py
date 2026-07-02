"""Region-anchored semantic gating recall (J-062 #3 / J-063).

Credits a gold disqualifier as CAUGHT only when a surfaced GATING req covers its region
(same page ± tol) AND is embedding-close (cosine ≥ threshold), greedy one-to-one. These
tests use an injected FakeIndex (offline, deterministic) to prove it credits GENUINE
catches only — it must never manufacture a 1.0 (J: "a fake 1.0 ships a broken tool").
"""
from engine.eval import semantic_gating_recall


def _gold(rows):  # rows: (gold_id, text, page, is_gating)
    return {"requirements": [
        {"gold_id": g, "text": t, "source_page": p, "is_gating": gt} for g, t, p, gt in rows]}


def _out(rows):   # rows: (id, text, page, is_gating)
    return {"requirements": [
        {"id": i, "text": t, "source_page": p, "is_gating": gt} for i, t, p, gt in rows]}


class _FakeIndex:
    """Deterministic stand-in: cosine looked up per unordered text pair (1.0 for identical)."""

    def __init__(self, pair_cos: dict):
        self._m = pair_cos

    def cosine(self, a: str, b: str) -> float:
        if a == b:
            return 1.0
        return self._m.get(frozenset({a, b}), 0.0)


def test_credits_genuine_same_page_catch():
    gold = _gold([("g16", "collusive tendering -> disqualification", 6, True)])
    out = _out([("o1", "any tenderer who fixes or adjusts the amount of their tender", 6, True)])
    idx = _FakeIndex({frozenset({gold["requirements"][0]["text"],
                                 out["requirements"][0]["text"]}): 0.70})
    r = semantic_gating_recall(gold, out, idx)
    assert r["caught"] == 1 and r["recall"] == 1.0
    assert r["audit"][0]["caught"] is True and r["audit"][0]["cosine"] == 0.7


def test_cross_page_high_cosine_never_credits():
    # A wrong-region coincidence must NOT false-credit, however high the cosine.
    gold = _gold([("g1", "A", 6, True)])
    out = _out([("o1", "B", 20, True)])
    idx = _FakeIndex({frozenset({"A", "B"}): 0.95})
    assert semantic_gating_recall(gold, out, idx, page_tol=1)["recall"] == 0.0


def test_below_threshold_is_a_miss():
    gold = _gold([("g1", "A", 6, True)])
    out = _out([("o1", "B", 6, True)])
    idx = _FakeIndex({frozenset({"A", "B"}): 0.64})   # the run-variable margin -> honest miss
    assert semantic_gating_recall(gold, out, idx)["recall"] == 0.0


def test_one_generic_req_cannot_credit_two_distinct_disqualifiers():
    # The granularity trap: two distinct gold gates, ONE generic surfaced req close to both.
    gold = _gold([("g61", "EXP", 6, True), ("g62", "QUAL", 6, True)])
    out = _out([("o1", "submit the documents", 6, True)])
    idx = _FakeIndex({frozenset({"EXP", "submit the documents"}): 0.72,
                      frozenset({"QUAL", "submit the documents"}): 0.71})
    r = semantic_gating_recall(gold, out, idx)
    assert r["caught"] == 1 and r["recall"] == 0.5   # 1:1 — not both off one req


def test_non_gating_output_req_never_credits():
    # Only a SURFACED GATING req can credit a disqualifier as caught.
    gold = _gold([("g1", "A", 6, True)])
    out = _out([("o1", "A-paraphrase", 6, False)])
    idx = _FakeIndex({frozenset({"A", "A-paraphrase"}): 0.95})
    assert semantic_gating_recall(gold, out, idx)["recall"] == 0.0


def test_unsurfaced_disqualifier_stays_a_miss():
    gold = _gold([("g1", "A", 6, True)])
    out = _out([("o1", "unrelated gate", 6, True)])
    r = semantic_gating_recall(gold, out, _FakeIndex({}))
    assert r["recall"] == 0.0 and r["audit"][0]["caught"] is False


def test_adjacent_page_within_tolerance_only():
    gold = _gold([("g1", "A", 6, True)])
    out = _out([("o1", "B", 7, True)])
    idx = _FakeIndex({frozenset({"A", "B"}): 0.80})
    assert semantic_gating_recall(gold, out, idx, page_tol=1)["recall"] == 1.0   # adjacent ok
    assert semantic_gating_recall(gold, out, idx, page_tol=0)["recall"] == 0.0   # strict same-page


def test_no_index_returns_none():
    # Embeddings unavailable (offline) -> None, so the lexical gating_recall stays default.
    assert semantic_gating_recall(_gold([("g1", "A", 6, True)]), _out([]), None) is None


def test_deterministic_repeatable():
    gold = _gold([("g1", "A", 6, True), ("g2", "C", 8, True)])
    out = _out([("o1", "B", 6, True), ("o2", "D", 8, True)])
    idx = _FakeIndex({frozenset({"A", "B"}): 0.9, frozenset({"C", "D"}): 0.75})
    a = semantic_gating_recall(gold, out, idx)
    b = semantic_gating_recall(gold, out, idx)
    assert a == b and a["recall"] == 1.0   # both caught, stable across calls
