"""usage_log.py — cheap OpenAI spend visibility (J-055) + persistent ledger (J-058).

We have no access to the billing dashboard for the shared key, so this is the only way
to see tokens/$ per call while staying under a couple of dollars. Each call:
  1. prints a per-call line with the PROCESS running total (as before), and
  2. appends to an append-only, cross-process LEDGER so any run adds to a cumulative
     total everyone can read — no matter which process/teammate ran it.

Check total spend anytime:  python -m engine.usage_log
The ledger is gitignored (runtime data). Override its path with $USAGE_LEDGER.
USD/1M-token prices are approximate list prices; update PRICES if the roster changes.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

# USD per 1M tokens: (prompt, completion). Extend as new models get used.
PRICES = {
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
}

# Append-only cross-process ledger (gitignored). Default: repo-root/usage-ledger.jsonl.
LEDGER_PATH = Path(
    os.environ.get("USAGE_LEDGER", Path(__file__).resolve().parents[1] / "usage-ledger.jsonl")
)

_running_total_usd = 0.0


def _cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    prompt_price, completion_price = PRICES.get(model, (0.0, 0.0))
    return prompt_tokens / 1_000_000 * prompt_price + completion_tokens / 1_000_000 * completion_price


def log_usage(resp, model: str, label: str) -> None:
    """Log tokens + estimated $ for one OpenAI chat.completions response.

    Prints the per-call line (process running total) AND appends to the cross-process
    ledger so cumulative spend survives across runs/teammates. Never raises — spend
    visibility must never break a real extraction.
    """
    global _running_total_usd
    usage = getattr(resp, "usage", None)
    if usage is None:
        return
    pt = getattr(usage, "prompt_tokens", 0) or 0
    ct = getattr(usage, "completion_tokens", 0) or 0
    tt = getattr(usage, "total_tokens", pt + ct) or (pt + ct)
    cost = _cost(model, pt, ct)
    _running_total_usd += cost
    print(
        f"[usage] {label} model={model} prompt={pt} completion={ct} total={tt} "
        f"cost=${cost:.4f} running_total=${_running_total_usd:.4f}"
    )
    try:
        rec = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "model": model,
            "label": label,
            "prompt_tokens": pt,
            "completion_tokens": ct,
            "cost_usd": round(cost, 6),
        }
        with open(LEDGER_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec) + "\n")
    except OSError:
        pass  # never block extraction on ledger I/O


def read_total(path: Path | str | None = None) -> dict:
    """Sum the persistent ledger → {total_usd, calls, by_model:{model:{calls,usd}}}."""
    path = Path(path) if path else LEDGER_PATH
    total, calls, by_model = 0.0, 0, {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    r = json.loads(line)
                except json.JSONDecodeError:
                    continue
                usd = float(r.get("cost_usd", 0.0))
                total += usd
                calls += 1
                m = r.get("model", "?")
                b = by_model.setdefault(m, {"calls": 0, "usd": 0.0})
                b["calls"] += 1
                b["usd"] += usd
    except FileNotFoundError:
        pass
    return {
        "total_usd": round(total, 4),
        "calls": calls,
        "by_model": {m: {"calls": v["calls"], "usd": round(v["usd"], 4)} for m, v in by_model.items()},
    }


def _main() -> int:
    t = read_total()
    print(f"OpenAI usage ledger: {LEDGER_PATH}")
    if t["calls"] == 0:
        print("(no calls logged yet — run something on the OpenAI path first)")
        return 0
    print(f"TOTAL: ${t['total_usd']:.4f}  across {t['calls']} call(s)")
    for m, v in sorted(t["by_model"].items()):
        print(f"  {m:<14} {v['calls']:>5} calls   ${v['usd']:.4f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
