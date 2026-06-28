"""stress_test.py — throw real tenders at the full backend and log what breaks.

Runs continuously (background-friendly). Each pass:
  1. reads a URL list (one per line; blank / # ignored) — re-read each pass, so you
     can add URLs while it runs,
  2. downloads any new tenders into data/tenders/ (skips existing),
  3. runs EVERY tender in data/tenders/ through the full API (upload → get → patch),
  4. logs anomalies + crashes IN DETAIL to data/stress-log.md.

    python backend/scripts/stress_test.py [sources.txt] [--passes N] [--sleep S]

Defaults: sources=data/tender-sources.txt, passes=continuous, sleep=20s.
Findings go to data/stress-log.md (gitignored). Scaffolded by J. Read-only on the
codebase — safe to run in the background.
"""

from __future__ import annotations

import sys
import time
import traceback
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent          # repo root
TENDERS_DIR = ROOT / "data" / "tenders"
LOG = ROOT / "data" / "stress-log.md"
# URL list is committed (shareable); the downloaded PDFs + log stay gitignored.
DEFAULT_SOURCES = Path(__file__).resolve().parent / "tender-sources.txt"
UA = {"User-Agent": "Mozilla/5.0 (Bidframe stress-test)"}
_failed_urls: set[str] = set()   # URLs that errored this run — don't retry every pass


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")


def log(msg: str) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg)


def _slug(url: str) -> str:
    name = url.rstrip("/").split("/")[-1].split("?")[0]
    if not name.lower().endswith(".pdf"):
        name = (name or "tender") + ".pdf"
    return name.replace("%20", "-")


def download_new(sources: Path) -> None:
    if not sources.exists():
        return
    urls = [
        ln.strip() for ln in sources.read_text(encoding="utf-8").splitlines()
        if ln.strip() and not ln.strip().startswith("#")
    ]
    TENDERS_DIR.mkdir(parents=True, exist_ok=True)
    for url in urls:
        dest = TENDERS_DIR / _slug(url)
        if dest.exists() or url in _failed_urls:
            continue
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
            dest.write_bytes(data)
            log(f"- {_now()} · downloaded `{dest.name}` ({len(data):,} bytes)")
        except Exception as exc:
            _failed_urls.add(url)   # try once per run, not every pass
            log(f"- {_now()} · DOWNLOAD FAILED `{url}` — {type(exc).__name__}: {exc}")


def test_one(client, pdf: Path) -> None:
    """Run one tender through the full API; log any breakage in detail."""
    try:
        with pdf.open("rb") as f:
            up = client.post(
                "/tenders/upload",
                files={"file": (pdf.name, f, "application/pdf")},
                data={"title": pdf.stem},
            )
        if up.status_code != 200:
            log(f"\n### ❌ BREAKAGE — upload `{pdf.name}` (HTTP {up.status_code}) · {_now()}\n"
                f"```\n{up.text[:1500]}\n```")
            return
        tid = up.json()["tender_id"]
        count = up.json()["requirement_count"]

        g = client.get(f"/tenders/{tid}/requirements")
        if g.status_code != 200:
            log(f"\n### ❌ BREAKAGE — GET `{pdf.name}` (HTTP {g.status_code}) · {_now()}\n"
                f"```\n{g.text[:1500]}\n```")
            return
        reqs = g.json()["requirements"]

        # --- anomaly checks (not crashes, but worth flagging) ---
        notes = []
        if count == 0:
            notes.append("0 requirements extracted")
        pages = {r["source_page"] for r in reqs}
        if reqs and len(pages) == 1:
            notes.append(f"ALL requirements on one page (p.{pages.pop()}) — page resolution suspect")
        if reqs and max(r["source_page"] for r in reqs) <= 1 < len(reqs):
            notes.append("all source_page <= 1 — page numbers likely wrong")
        bad_excerpt = sum(1 for r in reqs if not r.get("source_excerpt", "").strip())
        if bad_excerpt:
            notes.append(f"{bad_excerpt} requirements with empty source_excerpt (grounding lost)")
        review = sum(1 for r in reqs if r.get("needs_review"))
        if reqs and review == len(reqs):
            notes.append("EVERY requirement flagged needs_review")

        # --- exercise PATCH on the first requirement ---
        if reqs:
            rid = reqs[0]["id"]
            p = client.patch(f"/requirements/{rid}", json={
                "status": "accepted",
                "decision": {"action": "approve", "note": "stress", "timestamp": _now()},
            })
            if p.status_code != 200:
                notes.append(f"PATCH failed (HTTP {p.status_code}): {p.text[:200]}")

        gating = sum(1 for r in reqs if r.get("is_gating"))
        status = "⚠️ ANOMALY" if notes else "ok"
        log(f"- {_now()} · {status} · `{pdf.name}` · {count} reqs · gating {gating} · "
            f"review {review} · pages {min(pages_all(reqs))}-{max(pages_all(reqs))}"
            + ("".join(f"\n    - ⚠️ {n}" for n in notes) if notes else ""))

    except Exception:
        log(f"\n### 💥 CRASH — `{pdf.name}` · {_now()}\n```\n{traceback.format_exc()[:2500]}\n```")


def pages_all(reqs):
    ps = [r["source_page"] for r in reqs]
    return ps or [0]


def main(argv: list[str]) -> int:
    # Windows consoles default to cp1252 and crash on non-Latin-1 glyphs; force UTF-8.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

    sources = Path(argv[1]) if len(argv) > 1 and not argv[1].startswith("--") else DEFAULT_SOURCES
    passes = _arg_int(argv, "--passes", 0)        # 0 = continuous
    sleep_s = _arg_int(argv, "--sleep", 20)

    from fastapi.testclient import TestClient
    from app.main import app

    log(f"\n## Stress run started {_now()} · sources=`{sources.name}` · passes={passes or '∞'}\n")
    p = 0
    while passes == 0 or p < passes:
        p += 1
        download_new(sources)
        pdfs = sorted(TENDERS_DIR.glob("*.pdf"))
        log(f"\n### Pass {p} · {len(pdfs)} tender(s) · {_now()}")
        if not pdfs:
            log("  (no tenders yet — add URLs to the sources file)")
        with TestClient(app) as client:
            for pdf in pdfs:
                test_one(client, pdf)
        if passes and p >= passes:
            break
        time.sleep(sleep_s)
    log(f"\n## Stress run finished {_now()} ({p} pass(es))\n")
    return 0


def _arg_int(argv: list[str], flag: str, default: int) -> int:
    if flag in argv:
        try:
            return int(argv[argv.index(flag) + 1])
        except (ValueError, IndexError):
            pass
    return default


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
