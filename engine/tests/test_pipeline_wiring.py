"""Integration: the backend pipeline now uses the generalist engine for reconcile + routing.

Lives in the generalist lane because it pins MY wiring of engine.reconcile into
backend/app/pipeline.py (the explicitly-delegated `_reconcile` + `_route_confidence`).
"""
import json
from pathlib import Path

import pytest

# Bridges into the FastAPI backend package (backend.app.pipeline → schema/pydantic). Skip in a
# pure-engine checkout without the backend deps installed so `pytest engine/tests/` stays green on
# the engine alone; runs normally when the backend is present.
pipeline = pytest.importorskip("backend.app.pipeline")

REPO_ROOT = Path(__file__).resolve().parents[2]
MOCK_RAW = REPO_ROOT / "engine" / "tests" / "fixtures" / "mock_raw_extraction.json"


def test_engine_is_wired_in():
    assert pipeline._HAVE_ENGINE is True


def test_reconcile_uses_engine_conservative_merge():
    raws = json.loads(MOCK_RAW.read_text(encoding="utf-8"))["raw_requirements"]
    out = pipeline._reconcile(raws)
    # engine merges only the ISO cross-chunk dupe: 6 -> 5
    assert len(out) == 5
    # the merged ISO item carries the noisy-OR confidence (engine), not a raw passthrough
    iso = [r for r in out if "ISO 9001" in r["text"]]
    assert len(iso) == 1
    assert iso[0]["confidence"] == 0.9928


def test_route_confidence_uses_engine_threshold():
    assert pipeline._route_confidence("mandatory", 0.62) is True    # < 0.75
    assert pipeline._route_confidence("mandatory", 0.80) is False   # >= 0.75


# --- safety-net wiring: pins that the deterministic disqualifier net is unioned into the live
# pipeline. Regression guard for the exact bug we shipped a fix for (c620cbb): the net existed
# but was never called from the product path, so real uploads silently dropped deal-breakers.

def test_safety_net_is_wired_in():
    assert pipeline._HAVE_SAFETY_NET is True


def test_with_safety_net_surfaces_a_disqualifier_extraction_missed():
    from types import SimpleNamespace
    # extraction found only an unrelated service requirement — the collusion gate is missing.
    reconciled = [{
        "text": "The contractor must clean all windows weekly.", "source_page": 1,
        "source_excerpt": "clean all windows weekly", "type": "mandatory", "is_gating": False,
        "category": "service", "confidence": 0.9, "source_clause": None,
    }]
    pages = [SimpleNamespace(
        number=1,
        text="Any tenderer engaged in collusive tendering shall be disqualified.")]
    out = pipeline._with_safety_net(reconciled, pages)
    added = out[len(reconciled):]
    assert added, "safety-net added nothing for an uncovered disqualifier"
    assert any(a["is_gating"] and "collusive" in a["text"].lower() for a in added)


def test_full_pipeline_run_surfaces_safety_net_gates():
    """End-to-end guard: a real run (free heuristic extractor) must emit net gating candidates,
    so removing the _with_safety_net call from run_pipeline_multi fails a test, not silently."""
    import os
    museum = REPO_ROOT / "data" / "tenders" / "museum-cleaning-itt.pdf"
    if not museum.exists():
        pytest.skip("museum PDF not present in this checkout")
    os.environ["LLM_PROVIDER"] = "heuristic"   # free + deterministic, no key/spend
    resp = pipeline.run_pipeline(str(museum), "museum-wiring-test", "Museum Cleaning ITT")
    net_gates = [r for r in resp.requirements
                 if r.is_gating and r.needs_review and r.confidence == 0.5 and r.category == "legal"]
    assert net_gates, "wired pipeline surfaced no safety-net gating candidates"
