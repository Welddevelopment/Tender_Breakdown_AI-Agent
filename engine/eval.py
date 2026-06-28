"""Deterministic eval harness for gold-set scoring."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from engine._io import read_json, write_json
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


def format_report(gold: dict[str, Any], output: dict[str, Any]) -> dict[str, Any]:
    """Build eval report with headline metrics, dangerous misses, and false positives."""
    metrics = score(gold, output)
    _, unmatched_gold, unmatched_output = match_requirements(gold, output)
    misses = [dict(g, dangerous=bool(g.get("is_gating"))) for g in unmatched_gold]
    return {
        **metrics,
        "tender_id": gold.get("tender_id") or output.get("tender_id"),
        "misses": misses,
        "false_positives": unmatched_output,
    }


def _render(report: dict[str, Any]) -> str:
    dangerous_count = sum(1 for miss in report.get("misses", []) if miss.get("dangerous"))
    false_positive_count = len(report.get("false_positives", []))
    return "\n".join([
        f"recall: {report['recall']}",
        f"precision: {report['precision']}",
        f"f1: {report['f1']}",
        f"gating_accuracy: {report['gating_accuracy']}",
        f"gating_recall: {report['gating_recall']}",
        f"dangerous_misses: {dangerous_count}",
        f"false_positives: {false_positive_count}",
    ])


def main(argv: list[str]) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

    parser = argparse.ArgumentParser(description="Score Bidframe output against a gold set.")
    parser.add_argument("--gold", required=True, help="Path to gold JSON")
    parser.add_argument("--output", required=True, help="Path to output JSON")
    parser.add_argument("--report", help="Optional path to write JSON report")
    args = parser.parse_args(argv[1:])

    gold_path = Path(args.gold)
    output_path = Path(args.output)
    if not gold_path.exists() or not output_path.exists():
        parser.error("gold and output files must exist")

    report = format_report(read_json(gold_path), read_json(output_path))
    if args.report:
        write_json(args.report, report)
    print(_render(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
