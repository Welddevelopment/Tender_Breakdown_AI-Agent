"""Reconcile raw extraction candidates into final Bidframe requirements."""
from __future__ import annotations

from typing import Any

from engine.similarity import (
    TEXT_SIM_THRESHOLD,
    TOKEN_SIM_FLOOR,
    similarity,
    token_similarity,
)

NEEDS_REVIEW_THRESHOLD = 0.75


def _source_proximal(a: dict[str, Any], b: dict[str, Any]) -> bool:
    clause_a = a.get("source_clause")
    clause_b = b.get("source_clause")
    return (
        a.get("source_page") == b.get("source_page")
        and clause_a is not None
        and clause_b is not None
        and clause_a == clause_b
    )


def _mergeable(a: dict[str, Any], b: dict[str, Any]) -> bool:
    text_a = str(a.get("text", ""))
    text_b = str(b.get("text", ""))
    return (
        similarity(text_a, text_b) >= TEXT_SIM_THRESHOLD
        and token_similarity(text_a, text_b) >= TOKEN_SIM_FLOOR
        and _source_proximal(a, b)
    )


def group_candidates(raws: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    """Group raw candidates with conservative all-pairs mutual mergeability."""
    groups: list[list[dict[str, Any]]] = []
    for raw in raws:
        for group in groups:
            if all(_mergeable(raw, member) for member in group):
                group.append(raw)
                break
        else:
            groups.append([raw])
    return groups



def _confidence(raw: dict[str, Any]) -> float:
    return float(raw.get("confidence", 0.0))


def _char_start(raw: dict[str, Any]) -> int:
    value = raw.get("char_start")
    return int(value) if value is not None else 0


def _canonical(group: list[dict[str, Any]]) -> dict[str, Any]:
    return sorted(
        group,
        key=lambda raw: (-_confidence(raw), -len(str(raw.get("source_excerpt", ""))), _char_start(raw)),
    )[0]


def _clamp_confidence(confidence: float) -> float:
    return min(1.0, max(0.0, confidence))


def _noisy_or(confidences: list[float]) -> float:
    product = 1.0
    for confidence in confidences:
        product *= 1.0 - _clamp_confidence(confidence)
    return round(1.0 - product, 4)


def _first_non_null(group: list[dict[str, Any]], key: str) -> Any:
    for member in group:
        value = member.get(key)
        if value is not None:
            return value
    return None


def _depends_on_union(group: list[dict[str, Any]]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for member in group:
        for dep in member.get("depends_on", []) or []:
            if dep not in seen:
                seen.add(dep)
                result.append(dep)
    return result


def merge_group(group: list[dict[str, Any]]) -> dict[str, Any]:
    """Collapse one conservative group into an interim merged requirement dict."""
    if not group:
        raise ValueError("cannot merge an empty group")

    canonical = _canonical(group)
    confidences = [_confidence(member) for member in group]
    confidence: float = group[0]["confidence"] if len(group) == 1 else _noisy_or(confidences)

    source_clause = canonical.get("source_clause")
    if source_clause is None:
        source_clause = _first_non_null(group, "source_clause")

    return {
        "text": canonical.get("text"),
        "source_page": canonical.get("source_page"),
        "source_clause": source_clause,
        "source_excerpt": canonical.get("source_excerpt"),
        "type": "mandatory" if any(member.get("type") == "mandatory" for member in group) else "optional",
        "is_gating": any(bool(member.get("is_gating")) for member in group),
        "category": canonical.get("category"),
        "confidence": confidence,
        "criteria_ref": _first_non_null(group, "criteria_ref"),
        "depends_on": _depends_on_union(group),
        "_char_start": _char_start(canonical),
        "_member_raw_ids": [member["raw_id"] for member in group],
        "_member_confidences": confidences,
        "_canonical_raw_id": canonical.get("raw_id"),
    }


FINAL_KEYS = (
    "id", "text", "source_page", "source_clause", "source_excerpt", "type",
    "is_gating", "category", "confidence", "status", "needs_review", "decision",
    "criteria_ref", "depends_on", "draft_answer",
)


def _final_depends_on(merged: dict[str, Any]) -> list[str]:
    depends_on = list(merged.get("depends_on", []) or [])
    if any(str(dep).startswith("raw-") for dep in depends_on):
        raise ValueError("raw_id must not leak through depends_on")
    return depends_on


def to_final(merged: dict[str, Any], req_id: str) -> dict[str, Any]:
    """Map one interim merged dict to the locked 15-field Requirement schema."""
    confidence = merged["confidence"]
    return {
        "id": req_id,
        "text": merged.get("text"),
        "source_page": merged.get("source_page"),
        "source_clause": merged.get("source_clause"),
        "source_excerpt": merged.get("source_excerpt"),
        "type": merged.get("type"),
        "is_gating": merged.get("is_gating"),
        "category": merged.get("category"),
        "confidence": confidence,
        "status": "pending",
        "needs_review": confidence < NEEDS_REVIEW_THRESHOLD,
        "decision": None,
        "criteria_ref": merged.get("criteria_ref"),
        "depends_on": _final_depends_on(merged),
        "draft_answer": None,
    }



def assign_ids(merged_groups: list[dict[str, Any]]) -> list[tuple[str, dict[str, Any]]]:
    """Sort merged requirements by document order and assign stable req-NNNN IDs."""
    ordered = sorted(
        merged_groups,
        key=lambda merged: (int(merged.get("source_page") or 0), int(merged.get("_char_start") or 0)),
    )
    return [(f"req-{index:04d}", merged) for index, merged in enumerate(ordered, start=1)]



def build_report(
    tender_id: str | None,
    raw_count: int,
    assigned: list[tuple[str, dict[str, Any]]],
    finals: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build separate reconcile provenance report in final-id order."""
    merge_groups: list[dict[str, Any]] = []
    for (final_id, merged), final in zip(assigned, finals, strict=True):
        merge_groups.append({
            "final_id": final_id,
            "member_raw_ids": list(merged.get("_member_raw_ids", [])),
            "canonical_raw_id": merged.get("_canonical_raw_id"),
            "member_confidences": list(merged.get("_member_confidences", [])),
            "merged_confidence": merged.get("confidence"),
            "type": merged.get("type"),
            "is_gating": merged.get("is_gating"),
            "needs_review": final.get("needs_review"),
        })
    return {
        "tender_id": tender_id,
        "raw_count": raw_count,
        "final_count": len(finals),
        "merge_groups": merge_groups,
    }


def reconcile(raw_envelope: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Raw envelope -> (final envelope, reconcile report). Pure; no I/O."""
    raws = list(raw_envelope.get("raw_requirements", []))
    groups = group_candidates(raws)
    merged_groups = [merge_group(group) for group in groups]
    assigned = assign_ids(merged_groups)
    final_requirements = [to_final(merged, req_id) for req_id, merged in assigned]
    final_envelope = {
        "tender_id": raw_envelope.get("tender_id"),
        "title": raw_envelope.get("title"),
        "requirements": final_requirements,
    }
    report = build_report(raw_envelope.get("tender_id"), len(raws), assigned, final_requirements)
    return final_envelope, report
