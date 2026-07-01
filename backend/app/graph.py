"""graph.py — relationship edges (criteria_ref · depends_on).

Step 7. Adds the meaningful graph edges the frontend lights up:
  • is_gating       — already set during extraction.
  • criteria_ref    — map a requirement to the award criterion it scores under, when
                      the tender publishes weighted criteria (e.g. Quality 60% / Cost 40%).
  • depends_on      — link a requirement to another it explicitly references by clause.

CONSERVATIVE BY DESIGN (master-plan guardrail: don't invent edges). We only add an
edge when there's real textual evidence; otherwise we leave it null/empty.

Scaffolded by J as backend cover.
"""

from __future__ import annotations

import re

from .schema import Requirement

# "Quality – 60%", "Price (40%)", and table/list layouts where the weight is on the
# next line ("Quality Response\n40%"). Allow up to 30 chars incl. a newline between.
_CRITERION_RE = re.compile(
    r"\b(Quality|Price|Cost|Commercial|Technical|Social Value|Method(?:ology)?|"
    r"Experience|Sustainability|Delivery|Compliance)\b[^%]{0,30}?(\d{1,3})\s*%",
    re.IGNORECASE,
)
_CLAUSE_REF_RE = re.compile(r"\b(?:Section|Clause|Para(?:graph)?|Appendix)\s+[\w.]+", re.IGNORECASE)

# Which requirement categories naturally score under which criterion keyword.
_CRITERION_CATEGORIES = {
    "price": {"financial"},
    "cost": {"financial"},
    "commercial": {"financial"},
    "quality": {"technical", "experience", "delivery", "security", "certification"},
    "technical": {"technical", "security", "certification"},
    "experience": {"experience"},
    "social value": {"legal"},
    "sustainability": {"legal"},
    "delivery": {"delivery"},
    "compliance": {"legal", "certification", "insurance"},
}


def detect_criteria(full_text: str) -> list[dict]:
    """Find published award criteria + weightings. Deduped, in document order."""
    seen: dict[str, dict] = {}
    for i, m in enumerate(_CRITERION_RE.finditer(full_text), start=1):
        name = m.group(1).title()
        weight = int(m.group(2))
        if weight > 100:
            continue
        key = name.lower()
        if key not in seen:
            seen[key] = {
                "id": f"award-criterion-{len(seen) + 1}",
                "name": name,
                "weight": weight,
                "ref": f"{name} ({weight}%)",
            }
    return list(seen.values())


def _criterion_for(req: Requirement, criteria: list[dict]) -> str | None:
    """Best-matching criterion id for a requirement, or None if no clear match."""
    for crit in criteria:
        cats = _CRITERION_CATEGORIES.get(crit["name"].lower(), set())
        if req.category in cats:
            return crit["id"]
    return None


_CROSS_REF_RE = re.compile(
    r"\b(?:as (?:set out|described|specified|detailed|outlined) in|"
    r"in accordance with|refer(?:ring)? to|see|per)\s+"
    r"(?:Section|Clause|Para(?:graph)?|Appendix)\s+[\w.]+",
    re.IGNORECASE,
)


def build_graph(requirements: list[Requirement], full_text: str) -> list[dict]:
    """Populate criteria_ref + depends_on in place. Returns the detected criteria."""
    criteria = detect_criteria(full_text)

    if criteria:
        for req in requirements:
            req.criteria_ref = _criterion_for(req, criteria)

    by_clause: dict[str, str] = {}
    for req in requirements:
        if req.source_clause:
            by_clause.setdefault(req.source_clause.lower(), req.id)
    for req in requirements:
        refs = set()
        for m in _CLAUSE_REF_RE.finditer(req.text):
            target = by_clause.get(m.group(0).lower())
            if target and target != req.id:
                refs.add(target)
        for m in _CROSS_REF_RE.finditer(req.text):
            clause = _CLAUSE_REF_RE.search(m.group(0))
            if clause:
                target = by_clause.get(clause.group(0).lower())
                if target and target != req.id:
                    refs.add(target)
        for m in _CLAUSE_REF_RE.finditer(req.source_excerpt):
            target = by_clause.get(m.group(0).lower())
            if target and target != req.id:
                refs.add(target)
        req.depends_on = sorted(refs)

    return criteria
