"""gen_mixedpack_prebake.py — freeze a mixed-pack demo snapshot (J-092).

Runs run_pipeline_multi over a real PDF ITT + the three QA-staged Office fixtures
(fixtures/mixed-pack/*.docx/.xlsx/.csv) and writes the resulting TenderResponse to
frontend/src/data/mixedpack-prebake.json, in the same shape as bradwell-prebake.json,
so /demo has one real screen proving: per-file source_filename provenance, Office
sheet/row locators, and source_rect=null (no fake PDF highlight) for non-PDF rows.

Run from repo root:  python -m backend.scripts.gen_mixedpack_prebake
No API key needed — runs on the key-free heuristic extractor + the deterministic
gating net, same as `python -m engine.scripts.mixed_pack_smoke`.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from backend.app.ingest import ingest_document
from backend.app.pipeline import run_pipeline_multi

REPO = Path(__file__).resolve().parents[2]
PDF_SAMPLE = REPO / "frontend" / "public" / "demo" / "bradwell-grounds-itt.pdf"
FIXTURES = REPO / "fixtures" / "mixed-pack"
OUT = REPO / "frontend" / "src" / "data" / "mixedpack-prebake.json"

_LOCATOR = re.compile(r"\[([^\]]+)\]")


def _locator_for(excerpt: str, page_text: str) -> str | None:
    """Find the `[locator]` tag ingest_office.py planted immediately before this
    excerpt in the doc's page text (e.g. "XLSX Pricing row 12 | A12:F12"), so the
    source panel's clause line reads the real cell/paragraph/row, not blank."""
    needle = " ".join(excerpt.split())[:40]
    if len(needle) < 6:
        return None
    idx = page_text.replace("\n", " ").find(needle)
    if idx == -1:
        return None
    preceding = page_text[:idx]
    matches = _LOCATOR.findall(preceding)
    return matches[-1] if matches else None


def main() -> None:
    docs = [
        ("d1", str(PDF_SAMPLE), PDF_SAMPLE.name),
        ("d2", str(FIXTURES / "sample-return-forms.docx"), "sample-return-forms.docx"),
        ("d3", str(FIXTURES / "sample-pricing-schedule.xlsx"), "sample-pricing-schedule.xlsx"),
        ("d4", str(FIXTURES / "sample-compliance.csv"), "sample-compliance.csv"),
    ]
    for _, path, name in docs:
        if not Path(path).exists():
            raise FileNotFoundError(f"missing fixture for {name}: {path}")

    resp = run_pipeline_multi(docs, tender_id="mixedpack-demo", title="Mixed Pack Demo — Grounds ITT + Return Forms")

    # Stretch (J-092): for Office-derived rows, fold the human locator into source_clause
    # too, so the source panel's clause line reads "XLSX Pricing row 12 | A12:F12" / "DOCX
    # table 3 row 4" instead of staying blank. Re-ingest each Office fixture to recover the
    # locator tag ingest_office.py planted right before the extracted excerpt.
    office_doc_ids = {"d2": docs[1][1], "d3": docs[2][1], "d4": docs[3][1]}
    page_text_by_doc = {
        doc_id: ingest_document(path).pages[0].text for doc_id, path in office_doc_ids.items()
    }
    for r in resp.requirements:
        page_text = page_text_by_doc.get(r.source_doc_id or "")
        if page_text and not r.source_clause:
            locator = _locator_for(r.source_excerpt or "", page_text)
            if locator:
                r.source_clause = locator

    # Demo-snapshot cleanup only (not a pipeline change): the deterministic gating
    # safety-net (engine.gating_scan) scans raw page text in line-windows and isn't
    # yet aware of our synthetic "[DOCX paragraph N]"-style locator tags, so a few of
    # its candidates bleed a literal bracket tag into text/source_excerpt. Drop those
    # here so the frozen screen is clean; the underlying net behaviour is unchanged
    # and is exactly what generalist's G-044 (format-neutral safety-net pass) covers.
    _BRACKET_LEAK = re.compile(r"\[(DOCX|XLSX|CSV)\b")
    before = len(resp.requirements)
    resp.requirements = [
        r for r in resp.requirements
        if not _BRACKET_LEAK.search(r.text) and not _BRACKET_LEAK.search(r.source_excerpt or "")
    ]
    dropped = before - len(resp.requirements)
    if dropped:
        print(f"dropped {dropped} safety-net candidate(s) with a leaked locator tag (see G-044)")

    payload = resp.model_dump()
    OUT.write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    gating = sum(1 for r in resp.requirements if r.is_gating)
    by_file: dict[str, int] = {}
    for r in resp.requirements:
        by_file[r.source_filename or "?"] = by_file.get(r.source_filename or "?", 0) + 1
    print(f"wrote {OUT.relative_to(REPO)}: {len(resp.requirements)} requirements, {gating} gating")
    for name, count in by_file.items():
        print(f"  {name}: {count}")


if __name__ == "__main__":
    main()
