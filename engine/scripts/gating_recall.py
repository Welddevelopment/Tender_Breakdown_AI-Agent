"""gating_recall.py — the TRUE gating-recall number (semantic + auditable).

The lexical `match_score` understates gating on real tenders: a disqualifier the tool DID
surface as gating scores < 0.60 against a verbose human gold row (e.g. museum g16, the collusion
clause: extracted "…fixes or adjusts the amount of their Tender…" but the gold says "collusive
tendering / price-fixing" — same gate, different words). That reads as a "dangerous miss" when it
is not one — a bid team's release bar (gating recall = 1.0) is unmeasurable with lexical matching.

This measures gating recall SEMANTICALLY: a gold gating row is CAUGHT when a surfaced gating
requirement is within embedding cosine `threshold` of it (reusing engine.embeddings, the same
text-embedding-3-small seam the reconcile dedup uses). It also unions the deterministic
gating_scan safety-net so an extraction slip can't drop a disqualifier.

Anti-gaming: it PRINTS every gold row's best cosine + the matched requirement, so each credit is
human-auditable — you can see WHY each disqualifier was counted caught, and reject a bad threshold.
Opt-in (needs OPENAI_API_KEY for embeddings); the default lexical eval stays offline/deterministic.

Usage (repo root):  python -m engine.scripts.gating_recall [tender_id ...] [--threshold 0.68]
"""
from __future__ import annotations

import sys
from pathlib import Path

from engine._io import read_json
from engine.eval import load_gold_csv
from engine.embeddings import build_index
from engine.gating_scan import uncovered_gating
from engine.reconcile import reconcile

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST = REPO_ROOT / "gold-set" / "eval-manifest.json"
DEFAULT_THRESHOLD = 0.68   # below the lowest genuine museum catch (0.70); each credit is printed to audit


def _pages(pdf_path: Path, max_page: int | None):
    import fitz
    doc = fitz.open(pdf_path)
    n = doc.page_count if not max_page else min(doc.page_count, max_page)
    out = [(i + 1, doc.load_page(i).get_text("text")) for i in range(n)]
    doc.close()
    return out


def _report_one(entry: dict, threshold: float) -> tuple[int, int]:
    from engine.scripts.run_tender import raw_envelope_from_pdf

    gold = load_gold_csv(REPO_ROOT / entry["gold"], tender_id=entry["tender_id"])
    envelope, extractor = raw_envelope_from_pdf(
        str(REPO_ROOT / entry["pdf"]), entry["tender_id"], entry.get("title", ""))
    final, _ = reconcile(envelope)
    reqs = final["requirements"]
    mp = entry.get("max_page")
    if mp:
        reqs = [r for r in reqs if r.get("source_page") and 1 <= r["source_page"] <= mp]
    # belt + braces: union the deterministic safety-net so a slip can't drop a disqualifier
    reqs = reqs + uncovered_gating(reqs, _pages(REPO_ROOT / entry["pdf"], mp))
    gating_reqs = [r for r in reqs if r.get("is_gating")]
    gold_gating = [g for g in gold["requirements"] if g.get("is_gating")]

    idx = build_index(list({*(g["text"] for g in gold_gating),
                            *(r.get("text", "") for r in gating_reqs)}), enabled=True)
    if idx is None:
        print(f"  {entry['tender_id']}: embeddings unavailable (need OPENAI_API_KEY) — cannot measure semantically")
        return 0, len(gold_gating)

    caught = 0
    print(f"\n=== {entry['tender_id']} ({extractor}) — {len(gold_gating)} disqualifiers, "
          f"{len(gating_reqs)} surfaced gating reqs, threshold {threshold} ===")
    for g in gold_gating:
        best, bc = "", 0.0
        for r in gating_reqs:
            c = idx.cosine(g["text"], r.get("text", ""))
            if c > bc:
                bc, best = c, r.get("text", "")
        hit = bc >= threshold
        caught += hit
        print(f"  [{g['gold_id']} p{g.get('source_page')}] {'CAUGHT' if hit else 'MISS  '} cos={bc:.2f}"
              f"  <- {best[:74]}")
    print(f"  gating recall (semantic) = {caught}/{len(gold_gating)} = {caught/len(gold_gating):.2f}")
    return caught, len(gold_gating)


def main(argv) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    args = argv[1:]
    threshold = DEFAULT_THRESHOLD
    if "--threshold" in args:
        i = args.index("--threshold")
        threshold = float(args[i + 1])
        del args[i:i + 2]
    wanted = set(args)
    manifest = read_json(MANIFEST)
    entries = [e for e in manifest.get("tenders", []) if not e.get("draft")]
    if wanted:
        entries = [e for e in entries if e["tender_id"] in wanted]
    tc, tg = 0, 0
    print("SEMANTIC gating recall (auditable — every credit shown with its cosine + matched req):")
    for e in entries:
        c, g = _report_one(e, threshold)
        tc += c
        tg += g
    if tg:
        print(f"\nAGGREGATE semantic gating recall = {tc}/{tg} = {tc/tg:.3f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
