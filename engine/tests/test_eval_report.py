import subprocess
import sys
from pathlib import Path

from engine._io import read_json
from engine.eval import format_report

REPO_ROOT = Path(__file__).resolve().parents[2]
GOLD = read_json("engine/tests/fixtures/eval_gold_syn.json")
OUTPUT = read_json("engine/tests/fixtures/eval_output_syn.json")


def test_format_report_includes_headline_metrics_and_dangerous_miss():
    report = format_report(GOLD, OUTPUT)
    assert report["recall"] == 0.75
    assert report["precision"] == 0.75
    assert report["gating_recall"] == 0.3333
    assert len(report["misses"]) == 1
    miss = report["misses"][0]
    assert miss["gold_id"] == "gs-4"
    assert miss["dangerous"] is True


def test_format_report_includes_false_positive():
    report = format_report(GOLD, OUTPUT)
    assert len(report["false_positives"]) == 1
    assert report["false_positives"][0]["id"] == "req-0004"


def test_eval_cli_prints_headline_and_writes_report(tmp_path: Path):
    out = tmp_path / "eval-report.json"
    proc = subprocess.run(
        [sys.executable, "-m", "engine.eval", "--gold", "engine/tests/fixtures/eval_gold_syn.json",
         "--output", "engine/tests/fixtures/eval_output_syn.json", "--report", str(out)],
        cwd=REPO_ROOT, capture_output=True, text=True, encoding="utf-8",
    )
    assert proc.returncode == 0, proc.stderr
    assert "recall: 0.75" in proc.stdout
    assert "precision: 0.75" in proc.stdout
    assert "gating_recall: 0.3333" in proc.stdout
    assert "dangerous_misses: 1" in proc.stdout
    assert read_json(out)["misses"][0]["dangerous"] is True
