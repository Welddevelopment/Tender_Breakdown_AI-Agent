import json
from pathlib import Path

from engine._io import read_json, write_json


def test_engine_package_imports():
    import engine  # noqa: F401


def test_read_json_handles_pound_sign(raw_envelope):
    texts = [r["source_excerpt"] for r in raw_envelope["raw_requirements"]]
    assert any("?5,000,000" in t for t in texts)


def test_write_then_read_roundtrip_non_ascii(tmp_path: Path):
    payload = {"k": "insurance of at least ?5,000,000 ? ?"}
    p = tmp_path / "out.json"
    write_json(p, payload)
    assert "?" in p.read_text(encoding="utf-8")
    assert read_json(p) == payload
