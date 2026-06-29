"""eval_answers.py — groundedness eval for auditable autofill (Generalist lane).

The autofill's whole trust claim is "it grounds every answer in real evidence or
flags needs_input — it never bluffs." This makes that claim MEASURABLE, the same way
engine/eval.py makes the extraction's disqualifier-catch measurable.

A bluff is one of two things, both checkable deterministically (no LLM judge):
  1. a grounded ("auto") answer that cites an excerpt which can't be found in the
     bidder's capability docs (a hallucinated citation), or cites a doc that doesn't exist;
  2. an "auto" answer with no evidence_refs at all.

Run:  python -m engine.eval_answers --tender enriched.json --capability engine/fixtures/capability
where enriched.json is a draft_answers --out file (a tender response with answers).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from engine._io import read_json
from engine.similarity import content_tokens

# An excerpt counts as supported if it's a normalized substring of a cited passage,
# or nearly all its content tokens appear in one passage (tolerates light reformatting).
TOKEN_CONTAINMENT = 0.9


def _norm(text: str) -> str:
    return " ".join((text or "").split()).lower()


def _excerpt_supported(excerpt: str, passages: list[dict]) -> bool:
    ne = _norm(excerpt)
    if not ne:
        return False
    etoks = content_tokens(excerpt)
    for p in passages:
        ptext = p["text"] if isinstance(p, dict) else str(p)
        if ne in _norm(ptext):
            return True
        if etoks and len(etoks & content_tokens(ptext)) / len(etoks) >= TOKEN_CONTAINMENT:
            return True
    return False


def verify_groundedness(requirements: list[dict], capability_docs: list[dict]) -> dict:
    """Check every grounded answer's citations against the capability docs. Returns a
    report with the grounded/gap split + any bluffs (hallucinated or unevidenced)."""
    by_doc: dict[str, list[dict]] = {}
    for d in capability_docs:
        by_doc.setdefault(d["doc_id"], []).extend(d.get("passages", []))

    grounded = needs_input = other = 0
    citations = verified = 0
    hallucinated: list[dict] = []
    empty_evidence: list[str] = []

    for r in requirements:
        ans = r.get("answer")
        state = ans.get("state") if ans else None
        if state == "auto":
            grounded += 1
            refs = ans.get("evidence_refs") or []
            if not refs:
                empty_evidence.append(r.get("id"))
                continue
            for ref in refs:
                citations += 1
                passages = by_doc.get(ref.get("doc_id"), [])
                if passages and _excerpt_supported(ref.get("excerpt", ""), passages):
                    verified += 1
                else:
                    hallucinated.append({
                        "req_id": r.get("id"), "doc_id": ref.get("doc_id"),
                        "excerpt": (ref.get("excerpt", "") or "")[:80],
                    })
        elif state == "needs_input":
            needs_input += 1
        else:
            other += 1

    bluffs = len(hallucinated) + len(empty_evidence)
    return {
        "total": len(requirements),
        "grounded": grounded,
        "needs_input": needs_input,
        "other": other,
        "evidence_citations": citations,
        "verified_citations": verified,
        "hallucinated_citations": hallucinated,
        "empty_evidence_autos": empty_evidence,
        "bluffs": bluffs,
        "clean": bluffs == 0,
    }


def _render(report: dict) -> str:
    lines = [
        f"Autofill groundedness — {report['total']} answers: "
        f"{report['grounded']} grounded, {report['needs_input']} gaps, {report['other']} other",
        f"citations: {report['verified_citations']}/{report['evidence_citations']} verified against capability docs",
        f"BLUFFS: {report['bluffs']}  ({'clean — it never bluffs' if report['clean'] else 'SEE BELOW'})",
    ]
    for h in report["hallucinated_citations"]:
        lines.append(f"  ! {h['req_id']}: cited [{h['doc_id']}] '{h['excerpt']}' — not found in docs")
    for rid in report["empty_evidence_autos"]:
        lines.append(f"  ! {rid}: marked grounded but cites no evidence")
    return "\n".join(lines)


def main(argv) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    p = argparse.ArgumentParser(prog="engine.eval_answers", description="Groundedness eval for autofill.")
    p.add_argument("--tender", required=True, help="enriched tender JSON (draft_answers --out)")
    p.add_argument("--capability", required=True, help="capability docs folder used for the draft")
    args = p.parse_args(argv[1:])

    from engine.answer import load_capability_docs
    tender = read_json(args.tender)
    caps = load_capability_docs(args.capability)
    report = verify_groundedness(tender.get("requirements", []), caps)
    print(_render(report))
    return 0 if report["clean"] else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
