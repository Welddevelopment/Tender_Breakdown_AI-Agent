"""Deterministic eval harness for gold-set scoring."""
from __future__ import annotations

from typing import Any

from engine.similarity import similarity

MATCH_THRESHOLD = 0.60


def _requirements(envelope: dict[str, Any]) -> list[dict[str, Any]]:
    return list(envelope.get("requirements", []))


def match_requirements(
    gold: dict[str, Any], output: dict[str, Any]
) -> tuple[list[tuple[dict[str, Any], dict[str, Any]]], list[dict[str, Any]], list[dict[str, Any]]]:
    """Greedy one-to-one gold/output matching by descending deterministic similarity."""
    gold_reqs = _requirements(gold)
    output_reqs = _requirements(output)
    candidates: list[tuple[float, int, int, int, dict[str, Any], dict[str, Any]]] = []

    for gi, gold_req in enumerate(gold_reqs):
        for oi, output_req in enumerate(output_reqs):
            sim = similarity(str(gold_req.get("text", "")), str(output_req.get("text", "")))
            if sim >= MATCH_THRESHOLD:
                same_page_rank = 0 if gold_req.get("source_page") == output_req.get("source_page") else 1
                candidates.append((sim, same_page_rank, gi, oi, gold_req, output_req))

    candidates.sort(key=lambda item: (-item[0], item[1], item[2], item[3]))

    matched_gold: set[int] = set()
    matched_output: set[int] = set()
    matches: list[tuple[dict[str, Any], dict[str, Any]]] = []

    for _, _, gi, oi, gold_req, output_req in candidates:
        if gi in matched_gold or oi in matched_output:
            continue
        matched_gold.add(gi)
        matched_output.add(oi)
        matches.append((gold_req, output_req))

    matches.sort(key=lambda pair: gold_reqs.index(pair[0]))
    unmatched_gold = [g for i, g in enumerate(gold_reqs) if i not in matched_gold]
    unmatched_output = [o for i, o in enumerate(output_reqs) if i not in matched_output]
    return matches, unmatched_gold, unmatched_output



def _rounded_ratio(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, 4)


def score(gold: dict[str, Any], output: dict[str, Any]) -> dict[str, float | int]:
    """Compute hand-auditable recall/precision and gating metrics."""
    matches, unmatched_gold, unmatched_output = match_requirements(gold, output)
    tp = len(matches)
    fn = len(unmatched_gold)
    fp = len(unmatched_output)

    recall = _rounded_ratio(tp, tp + fn)
    precision = _rounded_ratio(tp, tp + fp)
    f1 = 0.0 if recall == 0.0 or precision == 0.0 else round(2 * recall * precision / (recall + precision), 4)

    gating_correct = sum(
        1 for gold_req, output_req in matches
        if bool(output_req.get("is_gating")) == bool(gold_req.get("is_gating"))
    )
    gating_accuracy = _rounded_ratio(gating_correct, len(matches))

    gold_gating = [g for g in _requirements(gold) if bool(g.get("is_gating"))]
    caught_and_flagged = sum(
        1 for gold_req, output_req in matches
        if bool(gold_req.get("is_gating")) and bool(output_req.get("is_gating"))
    )
    gating_recall = _rounded_ratio(caught_and_flagged, len(gold_gating))

    return {
        "tp": tp,
        "fn": fn,
        "fp": fp,
        "recall": recall,
        "precision": precision,
        "f1": f1,
        "gating_accuracy": gating_accuracy,
        "gating_recall": gating_recall,
    }
