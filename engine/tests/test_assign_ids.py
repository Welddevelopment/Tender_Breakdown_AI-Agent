from engine.reconcile import assign_ids, group_candidates, merge_group


def _merged(raw_envelope):
    return [merge_group(g) for g in group_candidates(raw_envelope["raw_requirements"])]


def test_id_order_matches_golden(raw_envelope):
    pairs = assign_ids(_merged(raw_envelope))
    assert [pid for pid, _ in pairs] == [
        "req-0001", "req-0002", "req-0003", "req-0004", "req-0005",
    ]


def test_req0001_is_iso_merge_via_c003_position(raw_envelope):
    pairs = dict(assign_ids(_merged(raw_envelope)))
    iso = pairs["req-0001"]
    assert iso["source_page"] == 14
    assert iso["_char_start"] == 1840   # canonical c003, not absorbed c004 (120)
    assert iso["confidence"] == 0.9928


def test_req0004_is_the_turnover_item(raw_envelope):
    pairs = dict(assign_ids(_merged(raw_envelope)))
    assert pairs["req-0004"]["source_page"] == 61
    assert pairs["req-0004"]["confidence"] == 0.62
