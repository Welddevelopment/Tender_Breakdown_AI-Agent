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
