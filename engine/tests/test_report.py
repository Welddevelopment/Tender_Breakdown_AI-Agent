from engine.reconcile import reconcile


def test_report_records_the_single_merge(raw_envelope):
    _, report = reconcile(raw_envelope)
    assert report["raw_count"] == 6
    assert report["final_count"] == 5
    merged = [g for g in report["merge_groups"] if len(g["member_raw_ids"]) > 1]
    assert len(merged) == 1
    g = merged[0]
    assert g["final_id"] == "req-0001"
    assert set(g["member_raw_ids"]) == {"raw-c003-0001", "raw-c004-0001"}
    assert g["canonical_raw_id"] == "raw-c003-0001"
    assert g["member_confidences"] == [0.94, 0.88]      # provenance retained, ordered
    assert g["merged_confidence"] == 0.9928


def test_report_has_one_entry_per_final_requirement(raw_envelope):
    _, report = reconcile(raw_envelope)
    assert len(report["merge_groups"]) == 5
    assert [g["final_id"] for g in report["merge_groups"]] == [
        "req-0001", "req-0002", "req-0003", "req-0004", "req-0005",
    ]


def test_singleton_report_entry_has_single_confidence(raw_envelope):
    _, report = reconcile(raw_envelope)
    turnover = next(g for g in report["merge_groups"] if g["final_id"] == "req-0004")
    assert turnover["member_raw_ids"] == ["raw-c027-0001"]
    assert turnover["member_confidences"] == [0.62]
