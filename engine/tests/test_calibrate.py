from engine.scripts.calibrate import recommend, split_by_match, sweep


def test_sweep_and_recommend():
    matched = [0.9, 0.8, 0.85, 0.95]      # confirmed-correct, high confidence
    unmatched = [0.6, 0.65, 0.7]          # uncertain, lower confidence
    rows = sweep(matched, unmatched, thresholds=[0.70, 0.75, 0.80, 0.85])
    by_t = {r["threshold"]: r for r in rows}
    assert by_t[0.75]["correct_flagged"] == 0     # none of the correct items flagged
    assert by_t[0.75]["unmatched_flagged"] == 3   # all uncertain items flagged
    assert by_t[0.85]["correct_flagged"] == 1     # 0.8 < 0.85
    # highest T flagging <=10% of confirmed-correct -> 0.80 (0.85 flags 25%)
    assert recommend(rows, max_false_alarm=0.10) == 0.80


def test_split_by_match_uses_output_confidence():
    gold = {"requirements": [
        {"gold_id": "g1", "text": "alpha bravo charlie requirement", "source_page": 1, "is_gating": False},
    ]}
    output = {"requirements": [
        {"id": "r1", "text": "alpha bravo charlie requirement", "source_page": 1, "is_gating": False, "confidence": 0.9},
        {"id": "r2", "text": "totally unrelated zulu yankee xray", "source_page": 1, "is_gating": False, "confidence": 0.6},
    ]}
    matched_conf, unmatched_conf = split_by_match(gold, output)
    assert matched_conf == [0.9]
    assert unmatched_conf == [0.6]
