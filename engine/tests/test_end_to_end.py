import subprocess
import sys
from pathlib import Path

from engine._io import read_json

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
