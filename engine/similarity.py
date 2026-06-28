"""Swappable similarity seam. difflib char-ratio + content-token Jaccard. No embeddings.

Deterministic, auditable, stdlib-only. The merge gate (reconcile.py) ANDs:
  similarity(a,b) >= TEXT_SIM_THRESHOLD  AND  token_similarity(a,b) >= TOKEN_SIM_FLOOR.

Char-ratio alone over-scores shared tender boilerplate (verified: two different mandatory
requirements scored 0.6443). The token-Jaccard floor blocks that false merge (their Jaccard
is 0.1111) while keeping the true ISO duplicate (Jaccard 0.2727). To swap algorithms later,
replace ONLY these function bodies; callers depend on the signatures.
"""
from __future__ import annotations

import re
from difflib import SequenceMatcher

TEXT_SIM_THRESHOLD = 0.66
TOKEN_SIM_FLOOR = 0.20

_WS = re.compile(r"\s+")
_NONWORD = re.compile(r"[^a-z0-9 ]")

# Boilerplate / structural words that carry no requirement-distinguishing meaning.
_STOPWORDS = frozenset({
    "the", "a", "an", "of", "at", "to", "for", "and", "or", "must", "shall",
    "should", "will", "be", "is", "are", "with", "in", "on", "this", "that",
    "supplier", "suppliers", "bidders", "bidder", "least", "provide", "hold",
    "each", "its", "their",
})


def _normalise(text: str) -> str:
    return _WS.sub(" ", text.strip().lower())


def _content_tokens(text: str) -> set[str]:
    cleaned = _WS.sub(" ", _NONWORD.sub(" ", text.lower())).strip()
    return {w for w in cleaned.split() if w and w not in _STOPWORDS}


def similarity(a: str, b: str) -> float:
    """Deterministic char-level fuzzy ratio in [0,1] over normalised text."""
    return SequenceMatcher(None, _normalise(a), _normalise(b)).ratio()


def token_similarity(a: str, b: str) -> float:
    """Jaccard over content tokens (stopwords/boilerplate removed), in [0,1].

    Blocks boilerplate-heavy false merges that char-ratio alone lets through.
    """
    ta, tb = _content_tokens(a), _content_tokens(b)
    if not ta and not tb:
        return 1.0
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)
