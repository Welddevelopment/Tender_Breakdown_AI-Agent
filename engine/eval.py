"""Eval harness: score tool output against a hand-labelled gold set.

The Generalist's headline-number machine. Computes recall / precision / f1 plus
the safety headline (gating_accuracy, gating_recall = did the disqualifiers
survive?), and a misses report where a missed GATING requirement is flagged
DANGEROUS. Gold<->output matching reuses the engine.similarity seam, so the
number is deterministic and auditable. No LLM judge.
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

from engine._io import read_json, write_json
from engine.similarity import match_score

MATCH_THRESHOLD = 0.60

_GATING_TRUE = {"yes", "true", "y", "1", "gating"}


def load_gold_csv(path: str | Path, tender_id: str | None = None) -> dict:
    """Load a team gold-set CSV (id,text,type,is_gating,source_page,source_clause,notes).

    Tolerates `#` comment lines and a yes/no `is_gating` column. Returns the gold
    envelope shape the scorer expects: {tender_id, requirements:[{gold_id, ...}]}.
    """
    with open(path, encoding="utf-8") as f:
        lines = [ln for ln in f if not ln.lstrip().startswith("#")]
    requirements = []
    for row in csv.DictReader(lines):
        gid = (row.get("id") or "").strip()
        if not gid:
            continue
        page = (row.get("source_page") or "").strip()
        clause = (row.get("source_clause") or "").strip()
        requirements.append({
            "gold_id": gid,
            "text": (row.get("text") or "").strip(),
            "type": (row.get("type") or "mandatory").strip() or "mandatory",
            "is_gating": (row.get("is_gating") or "").strip().lower() in _GATING_TRUE,
            "source_page": int(page) if page.lstrip("-").isdigit() else None,
            "source_clause": clause or None,
        })
    return {"tender_id": tender_id or Path(path).stem, "requirements": requirements}


def match_requirements(gold: dict, output: dict):
    """Greedy one-to-one match of gold <-> output reqs by text similarity.

    Returns (matches, unmatched_gold, unmatched_output) where matches is a list
    of (gold_req, output_req) tuples. Deterministic: candidates are ranked by
    (-similarity, prefer-same-page, gold_index, output_index).
    """
    golds = gold.get("requirements", [])
    outs = output.get("requirements", [])
    candidates = []
    for gi, g in enumerate(golds):
        for oi, o in enumerate(outs):
            sim = match_score(g.get("text", ""), o.get("text", ""))
            if sim >= MATCH_THRESHOLD:
                same_page = 0 if g.get("source_page") == o.get("source_page") else 1
                candidates.append((-sim, same_page, gi, oi))
    candidates.sort()
    used_g: set[int] = set()
    used_o: set[int] = set()
    matches = []
    for _neg_sim, _same_page, gi, oi in candidates:
        if gi in used_g or oi in used_o:
            continue
        used_g.add(gi)
        used_o.add(oi)
        matches.append((golds[gi], outs[oi]))
    unmatched_gold = [g for i, g in enumerate(golds) if i not in used_g]
    unmatched_output = [o for i, o in enumerate(outs) if i not in used_o]
    return matches, unmatched_gold, unmatched_output


def _ratio(num: int, den: int) -> float:
    return round(num / den, 4) if den else 0.0


def score(gold: dict, output: dict) -> dict:
    """Compute recall / precision / f1 + gating accuracy & recall."""
    matches, unmatched_gold, unmatched_output = match_requirements(gold, output)
    tp, fn, fp = len(matches), len(unmatched_gold), len(unmatched_output)

    recall = _ratio(tp, tp + fn)
    precision = _ratio(tp, tp + fp)
    f1 = _ratio(2 * tp, 2 * tp + fp + fn)

    gating_correct = sum(
        1 for g, o in matches if bool(g.get("is_gating")) == bool(o.get("is_gating"))
    )
    gating_accuracy = _ratio(gating_correct, len(matches))

    gold_gating = [g for g in gold.get("requirements", []) if g.get("is_gating")]
    caught_gating = sum(1 for g, o in matches if g.get("is_gating") and o.get("is_gating"))
    gating_recall = _ratio(caught_gating, len(gold_gating))
    # A dangerous miss = a gold GATING requirement the tool failed to match at all.
    dangerous_misses = sum(1 for g in unmatched_gold if g.get("is_gating"))

    return {
        "tp": tp, "fn": fn, "fp": fp,
        "gold_count": len(gold.get("requirements", [])),
        "output_count": len(output.get("requirements", [])),
        "recall": recall, "precision": precision, "f1": f1,
        "gating_accuracy": gating_accuracy, "gating_recall": gating_recall,
        "gating_gold": len(gold_gating), "gating_caught": caught_gating,
        "dangerous_misses": dangerous_misses,
    }


def semantic_gating_recall(gold: dict, output: dict, embed_index, threshold: float = 0.68,
                           page_tol: int = 1) -> dict | None:
    """Region-anchored, deterministic semantic gating recall (the release-gate metric).

    The lexical `gating_recall` understates catches on real tenders: a disqualifier the
    tool DID surface as gating can score < 0.60 against a verbose human gold row (same
    gate, different words). This credits a gold GATING row as CAUGHT when a surfaced
    GATING requirement on the SAME PAGE (within ±page_tol) is within embedding cosine
    >= threshold. Two guards make it trustworthy as a release gate:

      * greedy ONE-TO-ONE — each surfaced req credits at most one gold, so a single
        generic requirement can't be counted as catching several distinct disqualifiers
        (the granularity trap J-064 flagged for the museum Q3.2.x rows);
      * the page anchor blocks a cross-page cosine coincidence from false-crediting and
        steadies the number run-to-run (raw best-cosine flip-flops at the margin).

    It NEVER manufactures a credit for a disqualifier that isn't surfaced — an unsurfaced
    gate stays a MISS (an honest number, not a gamed 1.0). Every credit is returned in
    `audit` (gold_id, cosine, matched text + page) so a human can reject a bad threshold.

    Returns {caught, total, recall, threshold, audit:[...]}, or None when embed_index is
    None (embeddings unavailable -> the lexical gating_recall stays the offline default).
    """
    if embed_index is None:
        return None
    gold_gating = [g for g in gold.get("requirements", []) if g.get("is_gating")]
    out_gating = [r for r in output.get("requirements", []) if r.get("is_gating")]

    pairs: list[tuple[float, int, int]] = []
    for gi, g in enumerate(gold_gating):
        gp = g.get("source_page")
        for ri, r in enumerate(out_gating):
            rp = r.get("source_page")
            if gp is not None and rp is not None and abs(gp - rp) > page_tol:
                continue
            c = embed_index.cosine(g.get("text", ""), r.get("text", ""))
            if c >= threshold:
                pairs.append((c, gi, ri))
    pairs.sort(key=lambda p: (-p[0], p[1], p[2]))  # deterministic: cosine desc, then indices

    credit: dict[int, tuple[float, int]] = {}
    used_r: set[int] = set()
    for c, gi, ri in pairs:
        if gi in credit or ri in used_r:
            continue
        credit[gi] = (c, ri)
        used_r.add(ri)

    audit = []
    for gi, g in enumerate(gold_gating):
        gid = g.get("gold_id") or g.get("id")
        if gi in credit:
            c, ri = credit[gi]
            r = out_gating[ri]
            audit.append({"gold_id": gid, "caught": True, "cosine": round(c, 3),
                          "page": r.get("source_page"), "matched": (r.get("text") or "")[:80]})
        else:
            audit.append({"gold_id": gid, "caught": False, "cosine": None,
                          "page": g.get("source_page"), "matched": None})
    total = len(gold_gating)
    return {"caught": len(credit), "total": total, "threshold": threshold,
            "recall": round(len(credit) / total, 4) if total else 1.0, "audit": audit}


def format_report(gold: dict, output: dict) -> dict:
    """Score plus the misses (dangerous = missed gating req) and false positives."""
    _matches, unmatched_gold, unmatched_output = match_requirements(gold, output)
    report = dict(score(gold, output))
    report["misses"] = [
        {
            "gold_id": g.get("gold_id"),
            "text": g.get("text"),
            "source_page": g.get("source_page"),
            "is_gating": bool(g.get("is_gating")),
            "dangerous": bool(g.get("is_gating")),
        }
        for g in unmatched_gold
    ]
    report["false_positives"] = [
        {"id": o.get("id"), "text": o.get("text"), "source_page": o.get("source_page")}
        for o in unmatched_output
    ]
    return report


def _render(report: dict) -> str:
    lines = [
        f"Bidframe eval — recall {report['recall']}  precision {report['precision']}  f1 {report['f1']}",
        f"gating: accuracy {report['gating_accuracy']}  recall {report['gating_recall']}",
        f"caught {report['tp']}/{report['tp'] + report['fn']}; "
        f"{len(report['misses'])} miss(es), "
        f"{sum(1 for m in report['misses'] if m['dangerous'])} DANGEROUS; "
        f"{len(report['false_positives'])} false positive(s)",
    ]
    dangerous = [m for m in report["misses"] if m["dangerous"]]
    if dangerous:
        lines.append("DANGEROUS MISSES (missed gating requirements):")
        for m in dangerous:
            lines.append(f"  - {m['gold_id']} (p{m['source_page']}): {m['text']}")
    return "\n".join(lines)


def main(argv) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    parser = argparse.ArgumentParser(prog="engine.eval", description="Score tool output against a gold set.")
    parser.add_argument("--gold", required=True, help="path to a <tender>.gold.json")
    parser.add_argument("--output", required=True, help="path to the tool output (reconcile final envelope)")
    parser.add_argument("--report", default=None, help="optional path to write the full report JSON")
    try:
        args = parser.parse_args(argv[1:])
    except SystemExit:
        return 2
    try:
        gold = read_json(args.gold)
        output = read_json(args.output)
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    report = format_report(gold, output)
    print(_render(report))
    if args.report:
        write_json(args.report, report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
