"""Reconcile/dedupe — pipeline step 5 (Generalist lane).

Turns the backend's RAW extraction envelope (cross-chunk duplicate candidates,
raw confidence, provisional ids) into the CLEAN final requirement objects the
API serves and the frontend renders.

PRIME DIRECTIVE: reconcile CONSERVATIVELY. Wrongly merging two genuinely-
different requirements is a silent miss — the worst failure (a missed gating
requirement disqualifies a bid). We merge only on a conservative AND of FOUR
signals, escalate safety flags on merge, and never let a disqualifier vanish.
"""
from __future__ import annotations

import argparse
import sys
from math import prod
from pathlib import Path

from engine._io import read_json, write_json
from engine.similarity import (
    similarity, token_similarity, TEXT_SIM_THRESHOLD, TOKEN_SIM_FLOOR,
)

NEEDS_REVIEW_THRESHOLD = 0.75   # needs_review = merged confidence < this (strict). Crude; Day-3 calibration.

# The 15 fields the live frontend `Requirement` type declares. Output emits exactly these.
FINAL_KEYS = (
    "id", "text", "source_page", "source_clause", "source_excerpt", "type",
    "is_gating", "category", "confidence", "status", "needs_review", "decision",
    "criteria_ref", "depends_on", "draft_answer",
)


# --------------------------------------------------------------------------- #
# Merge predicate — conservative AND of four signals
# --------------------------------------------------------------------------- #
def _source_proximal(a: dict, b: dict) -> bool:
    """Same page AND same non-null clause. (Char offsets are chunk-local => not used.)"""
    if a.get("source_page") != b.get("source_page"):
        return False
    ca, cb = a.get("source_clause"), b.get("source_clause")
    return ca is not None and cb is not None and ca == cb


def _mergeable(a: dict, b: dict) -> bool:
    return (
        similarity(a.get("text", ""), b.get("text", "")) >= TEXT_SIM_THRESHOLD
        and token_similarity(a.get("text", ""), b.get("text", "")) >= TOKEN_SIM_FLOOR
        and _source_proximal(a, b)
    )


def group_candidates(raws: list[dict]) -> list[list[dict]]:
    """Cluster candidates that are the same requirement.

    All-pairs mutual mergeability (anti-transitivity guard): a candidate joins a
    group only if it is mergeable with EVERY current member, never via a chain.
    Input order is preserved.
    """
    groups: list[list[dict]] = []
    for item in raws:
        for g in groups:
            if all(_mergeable(item, member) for member in g):
                g.append(item)
                break
        else:
            groups.append([item])
    return groups


# --------------------------------------------------------------------------- #
# Merge a group -> one interim dict (canonical + noisy-OR + safety escalation)
# --------------------------------------------------------------------------- #
def _canonical(group: list[dict]) -> dict:
    """Highest confidence, then longest excerpt, then lowest char_start."""
    return sorted(
        group,
        key=lambda m: (-m["confidence"], -len(m.get("source_excerpt", "")), m.get("char_start", 0)),
    )[0]


def _noisy_or(confidences: list[float]) -> float:
    clamped = [max(0.0, min(1.0, c)) for c in confidences]
    return round(1 - prod(1 - c for c in clamped), 4)


def _first_non_null(group: list[dict], key: str):
    return next((m.get(key) for m in group if m.get(key) is not None), None)


def merge_group(group: list[dict]) -> dict:
    """Collapse one group into a single interim merged dict.

    Carries `_char_start` (ordering), `_member_raw_ids` and `_canonical_raw_id`
    (report provenance). `to_final` strips all interim/underscore fields.
    """
    if not group:
        raise ValueError("merge_group called with an empty group")
    canonical = _canonical(group)

    if len(group) == 1:
        confidence = group[0]["confidence"]            # verbatim passthrough, no float drift
    else:
        confidence = _noisy_or([m["confidence"] for m in group])

    clause = canonical.get("source_clause")
    if clause is None:
        clause = _first_non_null(group, "source_clause")

    depends_on: list[str] = []
    for m in group:
        for dep in (m.get("depends_on") or []):
            if dep not in depends_on:
                depends_on.append(dep)

    return {
        "text": canonical["text"],
        "source_page": canonical.get("source_page"),
        "source_clause": clause,
        "source_excerpt": canonical.get("source_excerpt"),
        "type": "mandatory" if any(m.get("type") == "mandatory" for m in group) else "optional",
        "is_gating": any(bool(m.get("is_gating")) for m in group),
        "category": canonical.get("category"),
        "confidence": confidence,
        "criteria_ref": _first_non_null(group, "criteria_ref"),
        "depends_on": depends_on,
        "_char_start": canonical.get("char_start", 0),
        "_member_raw_ids": [m["raw_id"] for m in group],
        "_canonical_raw_id": canonical["raw_id"],
    }


# --------------------------------------------------------------------------- #
# Promote to the locked 15-field schema
# --------------------------------------------------------------------------- #
def to_final(merged: dict, req_id: str) -> dict:
    """Build a fresh dict with exactly FINAL_KEYS — no interim/deferred fields leak."""
    depends_on = merged.get("depends_on") or []
    for dep in depends_on:
        if isinstance(dep, str) and dep.startswith("raw-"):
            raise ValueError(f"raw id leaked into depends_on: {dep!r}")
    confidence = merged["confidence"]
    return {
        "id": req_id,
        "text": merged["text"],
        "source_page": merged.get("source_page"),
        "source_clause": merged.get("source_clause"),
        "source_excerpt": merged.get("source_excerpt"),
        "type": merged["type"],
        "is_gating": merged["is_gating"],
        "category": merged.get("category"),
        "confidence": confidence,
        "status": "pending",
        "needs_review": confidence < NEEDS_REVIEW_THRESHOLD,
        "decision": None,
        "criteria_ref": merged.get("criteria_ref"),
        "depends_on": list(depends_on),
        "draft_answer": None,
    }


# --------------------------------------------------------------------------- #
# Document-order id assignment
# --------------------------------------------------------------------------- #
def assign_ids(merged_groups: list[dict]) -> list[tuple[str, dict]]:
    """Stable-sort by (source_page, _char_start); assign req-0001.. in document order."""
    ordered = sorted(merged_groups, key=lambda m: (m["source_page"], m["_char_start"]))
    return [(f"req-{n:04d}", m) for n, m in enumerate(ordered, start=1)]


# --------------------------------------------------------------------------- #
# The reconcile report (audit/eval artifact — provenance lives ONLY here)
# --------------------------------------------------------------------------- #
def build_report(raw_envelope: dict, id_pairs: list[tuple[str, dict]]) -> dict:
    raws_by_id = {r["raw_id"]: r for r in raw_envelope.get("raw_requirements", [])}
    merge_groups = []
    for req_id, m in id_pairs:
        member_ids = m["_member_raw_ids"]
        merge_groups.append({
            "final_id": req_id,
            "member_raw_ids": member_ids,
            "canonical_raw_id": m["_canonical_raw_id"],
            "member_confidences": [raws_by_id[mid]["confidence"] for mid in member_ids],
            "merged_confidence": m["confidence"],
            "type": m["type"],
            "is_gating": m["is_gating"],
            "needs_review": m["confidence"] < NEEDS_REVIEW_THRESHOLD,
        })
    return {
        "tender_id": raw_envelope.get("tender_id"),
        "raw_count": len(raw_envelope.get("raw_requirements", [])),
        "final_count": len(id_pairs),
        "merge_groups": merge_groups,
    }


# --------------------------------------------------------------------------- #
# Orchestrator
# --------------------------------------------------------------------------- #
def reconcile(raw_envelope: dict) -> tuple[dict, dict]:
    """Raw envelope -> (final envelope, reconcile report). Pure; no I/O."""
    groups = group_candidates(raw_envelope.get("raw_requirements", []))
    merged = [merge_group(g) for g in groups]
    id_pairs = assign_ids(merged)
    requirements = [to_final(m, req_id) for req_id, m in id_pairs]
    final_envelope = {
        "tender_id": raw_envelope.get("tender_id"),
        "title": raw_envelope.get("title"),
        "requirements": requirements,
    }
    return final_envelope, build_report(raw_envelope, id_pairs)


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main(argv) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    parser = argparse.ArgumentParser(
        prog="engine.reconcile", description="Reconcile/dedupe a raw extraction envelope.")
    parser.add_argument("raw", help="path to the raw extraction envelope JSON")
    parser.add_argument("--out", default=None, help="output final envelope path")
    parser.add_argument("--report", default=None, help="output reconcile report path")
    try:
        args = parser.parse_args(argv[1:])
    except SystemExit:
        return 2
    try:
        raw_envelope = read_json(args.raw)
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    final, report = reconcile(raw_envelope)
    stem = Path(args.raw).stem
    out_path = args.out or str(Path(args.raw).with_name(stem + ".final.json"))
    report_path = args.report or str(Path(args.raw).with_name(stem + ".report.json"))
    write_json(out_path, final)
    write_json(report_path, report)

    n_merge = sum(1 for g in report["merge_groups"] if len(g["member_raw_ids"]) > 1)
    n_review = sum(1 for r in final["requirements"] if r["needs_review"])
    print(f"reconciled {report['raw_count']} raw -> {report['final_count']} final "
          f"({n_merge} merge group); needs_review: {n_review}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
