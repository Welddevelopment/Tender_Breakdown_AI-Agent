import subprocess
import sys
from pathlib import Path

from engine._io import read_json
from engine.reconcile import reconcile

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW = "engine/tests/fixtures/mock_raw_extraction.json"


def test_cli_writes_final_and_report(tmp_path: Path):
    out = tmp_path / "final.json"
    report = tmp_path / "report.json"
    proc = subprocess.run(
        [sys.executable, "-m", "engine.reconcile", RAW,
         "--out", str(out), "--report", str(report)],
        cwd=REPO_ROOT, capture_output=True, text=True, encoding="utf-8",
    )
    assert proc.returncode == 0, proc.stderr
    final = read_json(out)
    assert len(final["requirements"]) == 5
    assert read_json(report)["final_count"] == 5
    assert "5 final" in proc.stdout


def test_reconcile_matches_golden_exactly(raw_envelope, golden_final):
    final, _ = reconcile(raw_envelope)
    assert final == golden_final            # deep value equality on the whole envelope


def test_is_deterministic_across_runs(raw_envelope):
    a, ra = reconcile(raw_envelope)
    b, rb = reconcile(raw_envelope)
    assert a == b and ra == rb              # stable ids + stable canonical selection


def test_counts_flags_and_disqualifier_survival(raw_envelope):
    final, _ = reconcile(raw_envelope)
    reqs = final["requirements"]
    assert len(reqs) == 5
    assert [r["id"] for r in reqs] == [
        "req-0001", "req-0002", "req-0003", "req-0004", "req-0005",
    ]
    # exactly one needs_review, and it is the turnover item
    assert [r["id"] for r in reqs if r["needs_review"]] == ["req-0004"]
    # No disqualifier vanished. NOTE: the plan text said 4 gating, but the golden
    # fixture has 3 gating (ISO, insurance, turnover) and 4 mandatory — the plan
    # conflated the two counts. The golden data is authoritative.
    assert sum(1 for r in reqs if r["is_gating"]) == 3
    assert sum(1 for r in reqs if r["type"] == "mandatory") == 4
    # ISO merge stayed mandatory + gating at corroborated confidence
    iso = reqs[0]
    assert iso["type"] == "mandatory" and iso["is_gating"] is True
    assert iso["confidence"] == 0.9928
    # envelope hygiene
    assert set(final.keys()) == {"tender_id", "title", "requirements"}
    assert "raw_requirements" not in final
    assert "capability_docs" not in final


def test_no_requirement_leaks_provenance(raw_envelope):
    final, _ = reconcile(raw_envelope)
    forbidden = {"raw_id", "chunk_id", "char_start", "char_end", "extractor_notes",
                 "_char_start", "_member_raw_ids", "answer", "open_questions"}
    for r in final["requirements"]:
        assert forbidden.isdisjoint(r.keys())


def test_canonical_excerpt_is_exact_raw_substring(raw_envelope):
    final, _ = reconcile(raw_envelope)
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    assert final["requirements"][0]["source_excerpt"] == reqs["raw-c003-0001"]["source_excerpt"]
