"""calibrate.py — data-driven calibration of the needs_review threshold.

Turns reconcile's `NEEDS_REVIEW_THRESHOLD` from an arbitrary number into a value
justified by a labelled tender. Reads a gold CSV + a reconcile output JSON,
page-scopes the output to the gold's range, and splits it into:

  - CONFIRMED-CORRECT  = output items that matched a gold requirement (reliable).
  - UNMATCHED          = output items with no gold match. CONTAMINATED: many are
                         real requirements the gold simply didn't list (gold
                         incompleteness), NOT tool errors. We do NOT treat these
                         as ground-truth errors.

We calibrate against the reliable signal: pick the highest threshold that still
flags at most `max_false_alarm` of CONFIRMED-CORRECT items ("don't cry wolf"),
and report the full sweep so the choice is transparent.

Usage (from repo root):
  python -m engine.scripts.calibrate --gold gold-set/spso-cleaning.labels.csv \
      --output engine/out/spso.final.json --max-page 6
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from engine._io import read_json
from engine.eval import load_gold_csv, match_requirements

# Thresholds to sweep (the needs_review cut lives in this range in practice).
SWEEP = [round(0.50 + 0.05 * i, 2) for i in range(9)]  # 0.50 .. 0.90


def split_by_match(gold: dict, output: dict) -> tuple[list[float], list[float]]:
    """Return (confirmed_correct_confidences, unmatched_confidences)."""
    matches, _unmatched_gold, unmatched_output = match_requirements(gold, output)
    matched_conf = [o.get("confidence", 0.0) for _g, o in matches]
    unmatched_conf = [o.get("confidence", 0.0) for o in unmatched_output]
    return matched_conf, unmatched_conf


def sweep(matched_conf: list[float], unmatched_conf: list[float],
          thresholds: list[float] = SWEEP) -> list[dict]:
    """For each threshold, the flag rates on confirmed-correct vs unmatched."""
    rows = []
    for t in thresholds:
        cc_flagged = sum(1 for c in matched_conf if c < t)
        un_flagged = sum(1 for c in unmatched_conf if c < t)
        rows.append({
            "threshold": t,
            "correct_flagged": cc_flagged,
            "correct_flag_rate": round(cc_flagged / len(matched_conf), 4) if matched_conf else 0.0,
            "unmatched_flagged": un_flagged,
            "unmatched_flag_rate": round(un_flagged / len(unmatched_conf), 4) if unmatched_conf else 0.0,
        })
    return rows


def recommend(rows: list[dict], max_false_alarm: float = 0.10) -> float:
    """Highest threshold whose confirmed-correct flag rate stays <= max_false_alarm."""
    ok = [r for r in rows if r["correct_flag_rate"] <= max_false_alarm]
    return max((r["threshold"] for r in ok), default=rows[0]["threshold"] if rows else 0.0)


def _mean(xs: list[float]) -> float:
    return round(sum(xs) / len(xs), 4) if xs else 0.0


def main(argv) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    p = argparse.ArgumentParser(prog="engine.scripts.calibrate")
    p.add_argument("--gold", required=True)
    p.add_argument("--output", required=True, help="a reconcile final-envelope JSON")
    p.add_argument("--max-page", type=int, default=None)
    p.add_argument("--max-false-alarm", type=float, default=0.10)
    args = p.parse_args(argv[1:])

    gold = load_gold_csv(args.gold)
    final = read_json(args.output)
    reqs = final.get("requirements", [])
    if args.max_page:
        reqs = [r for r in reqs if r.get("source_page") and 1 <= r["source_page"] <= args.max_page]
    scoped = {**final, "requirements": reqs}

    matched_conf, unmatched_conf = split_by_match(gold, scoped)
    rows = sweep(matched_conf, unmatched_conf)
    rec = recommend(rows, args.max_false_alarm)

    print(f"=== needs_review calibration — {Path(args.output).name} vs {Path(args.gold).name} ===")
    print(f"confirmed-correct: {len(matched_conf)} (mean conf {_mean(matched_conf)})   "
          f"unmatched: {len(unmatched_conf)} (mean conf {_mean(unmatched_conf)})")
    sep = _mean(matched_conf) - _mean(unmatched_conf)
    print(f"separation (mean correct - mean unmatched): {round(sep, 4)} "
          f"{'(confidence IS informative)' if sep >= 0.05 else '(confidence weakly informative)'}\n")
    print(f"{'thresh':>7}{'correct_flagged':>17}{'unmatched_flagged':>19}")
    for r in rows:
        print(f"{r['threshold']:>7}"
              f"{str(r['correct_flagged'])+' ('+str(int(r['correct_flag_rate']*100))+'%)':>17}"
              f"{str(r['unmatched_flagged'])+' ('+str(int(r['unmatched_flag_rate']*100))+'%)':>19}")
    print(f"\nRECOMMENDED threshold: {rec}  "
          f"(highest T flagging <= {int(args.max_false_alarm*100)}% of confirmed-correct items)")
    print("Caveats: calibrated on ONE tender; unmatched set is contaminated by gold "
          "incompleteness (not all errors). Re-run as more gold lands.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
