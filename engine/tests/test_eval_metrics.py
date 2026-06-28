from engine._io import read_json
from engine.eval import score

GOLD = read_json("engine/tests/fixtures/eval_gold_syn.json")
OUTPUT = read_json("engine/tests/fixtures/eval_output_syn.json")


def test_score_matches_hand_computed_synthetic_metrics():
    metrics = score(GOLD, OUTPUT)
    assert metrics["recall"] == 0.75
    assert metrics["precision"] == 0.75
    assert metrics["f1"] == 0.75
    assert metrics["gating_accuracy"] == 0.6667
    assert metrics["gating_recall"] == 0.3333
    assert metrics["tp"] == 3
    assert metrics["fn"] == 1
    assert metrics["fp"] == 1


def test_score_empty_output_does_not_crash():
    metrics = score(GOLD, {"requirements": []})
    assert metrics["recall"] == 0.0
    assert metrics["precision"] == 0.0
