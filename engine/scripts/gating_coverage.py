"""gating_coverage.py — gate-FAMILY coverage diagnostic for the public-sector safety-net.

The release goal is ~1.0 gating recall on ANY UK public-sector tender. The failure mode is a
disqualifier FAMILY the deterministic net (engine.gating_scan) does not recognise, so a whole
class of deal-breaker slips through. This tool is the standing instrument that catches that
BEFORE it costs recall — and before gold sets exist, so we can harden the taxonomy now.

For each tender PDF it runs the net's scan and buckets every surfaced candidate line into the
named UK public-sector gate families (exclusion / pass-fail selection / integrity / minimum
standing / mandatory returns / submission deadline). It then flags a BLIND SPOT: a family whose
language is visibly present in the raw text but which the net fired zero times on — the exact
signal that the taxonomy has a gap on that tender.

Gold-free, regex-only, no LLM, no key, reproducible offline (reuses gating_scan.scan_candidates).
It measures the NET's family reach, not correctness of a specific answer key — that stays the
gold set's job (engine.eval / engine.scripts.gating_recall).

Usage (repo root):
  python -m engine.scripts.gating_coverage                 # every PDF in the eval manifest
  python -m engine.scripts.gating_coverage path/to.pdf ... # ad-hoc tender PDF(s)
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from engine._io import read_json
from engine.gating_scan import _STRONG, scan_candidates

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST = REPO_ROOT / "gold-set" / "eval-manifest.json"

# A human-readable decomposition of _STRONG into the named UK public-sector gate families. Kept
# deliberately close to _STRONG's grouped comments; a candidate can match more than one family.
FAMILIES: dict[str, re.Pattern] = {
    "exclusion": re.compile(
        r"reject(ed|ion)?|exclu(de|ded|ding|des|sion|sionary)|disqualif|eliminat(e|ed|ion)|debarr|"
        r"ineligib|(will\s+not|cannot|shall\s+not|won'?t)\s+be\s+(considered|evaluated|accepted|"
        r"assessed|progressed|short[-\s]?listed|taken\s+forward|entertained|scored)|grounds?\s+for\s+"
        r"exclusion|mandatory\s+exclusion|(render|invalidat)\w*\s+.{0,25}(void|invalid|non[-\s]?"
        r"compliant)|(void|invalid)\s+(tender|bid|submission|proposal|response|offer)|(tender|bid|"
        r"submission|proposal|response|offer)s?\b.{0,25}\b(void|invalid)\b|(is|are|deemed|considered)"
        r"\s+(void|invalid)\b|set\s+aside|pass(ed)?\s+over|ruled?\s+out|(will\s+)?not\s+"
        r"(proceed|progress)\b|non[-\s]?conform\w*|\bnot\s+be\s+accepted\b|variant\s+bids?|"
        r"remov\w*\s+.{0,25}(consideration|the\s+process|evaluation|participation)|"
        # generous consequence net (group 8)
        r"(cannot|can\s?not|will\s+not|shall\s+not|won'?t|would\s+not|may\s+not|must\s+not)\s+(be\s+)?"
        r"(consider|accept|award|evaluat|assess|progress|proceed|scor|short[-\s]?list|shortlist|open|"
        r"entertain|qualif|succeed|advanc|participat)\w*|\bnot\s+be\s+(consider|accept|award|evaluat|"
        r"assess|progress|scor|open|entertain|short[-\s]?list)\w*|preclud\w*|rescind\w*|annul\w*|"
        r"struck\s+out|\bbarred\b|st(oo|an)d\s+down|automatic\w*\s+.{0,15}(fail|reject|exclu|disqualif)|"
        r"fail\w*\s+.{0,10}(the\s+)?(selection|assessment|evaluation)|deemed?\s+.{0,20}(non[-\s]?"
        r"compliant|ineligible|invalid|variant|unacceptable)|(bid|bidder|tender|tenderer|submission|"
        r"proposal|response|offer|application|supplier|contractor)s?\b.{0,30}\b(thrown\s+out|"
        r"returned\s+unopened|withdrawn|discount\w*|refus\w*|declin\w*|not\s+opened)", re.I),
    "passfail": re.compile(
        r"pass\s*[-/]?\s*fail|pass\s+or\s+fail|\bpqq\b|\bsq\b|selection\s+questionnaire|"
        r"deemed\s+.{0,25}fail|fail(ure|ed|s)?\s+.{0,40}(reject|exclu|disqualif|eliminat|"
        r"not\s+be\s+considered)|pass\s+mark|(quality|score|scoring)\s+threshold|"
        r"must\s+satisfy|mandatory\s+criteri", re.I),
    "integrity": re.compile(
        r"canvass|collusi|non[-\s]?complian|conflicts?\s+of\s+interest|anti[-\s]?competitive|"
        r"improper\s+(contact|approach|influenc\w*)|(attempt|seek)\w*\s+to\s+influenc\w*|"
        r"influenc\w*\s+.{0,20}(evaluation|award|panel|process)", re.I),
    "minimums": re.compile(
        r"minimum\s+(?:[\w'-]+\s+){0,3}(turnover|standard|requirement|level|threshold|score|rating|"
        r"credit)|must\s+hold|(required\s+to|shall)\s+hold|must\s+be\s+(a\s+)?(registered|certified|"
        r"accredited|licen[cs]ed|member)|registration\s+(is\s+)?(required|mandatory)|"
        r"must\s+(possess|have|maintain)\s+.{0,40}(certificat|accreditat|insurance|licen[cs]e|"
        r"registration|clearance|check)|(employer'?s|public)\s+liability|professional\s+indemnity|"
        r"financial\s+standing|member\s+of\s+.{0,25}(scheme|register|body|association)|turnover\s+of\s+"
        r"(at\s+least|no\s+less\s+than|not\s+less\s+than|£|gbp|\d)|(no\s+less\s+than|not\s+less\s+than|"
        r"at\s+least)\s+.{0,30}(turnover|insurance|experience|year)|gas\s+safe|\bchas\b|constructionline|"
        r"safe\s?contractor|\bcscs\b|\bsia\b\s+(licen|approved|registered)|\bcqc\b|care\s+quality\s+"
        r"commission|\bdbs\b|disclosure\s+and\s+barring|enhanced\s+(disclosure|check)|"
        r"(security|dbs)\s+clearance|food\s+hygiene\s+rating", re.I),
    "returns": re.compile(
        r"must\s+(complete|submit|return|provide|be\s+(returned|completed|submitted|received|provided))|"
        r"failure\s+to\s+(complete|submit|return|provide|comply|meet|confirm|sign|acknowledge|accept)|"
        r"mandatory\s+.{0,20}(site\s+visit|attendance|briefing)|condition\s+of\s+(bidding|tender)", re.I),
    "deadline": re.compile(
        r"(receiv(e|ed)|submit(ted)?|return(ed)?|lodg(e|ed)|upload(ed)?|arriv(e|ed|es)|reach(es|ed)?)"
        r"\b.{0,70}no\s+later\s+than|closing\s+(date|time)|\bdeadline\b|"
        r"late\s+(tender|bid|submission|response)s?|(before|by)\s+the\s+(cut[-\s]?off|closing|deadline)|"
        r"cut[-\s]?off\s+(time|date|point)|incomplete\s+(tender|bid|submission|response)s?", re.I),
}

# Weaker "is this family genuinely present in the document at all?" probes — so a family that
# fires 0 times on a tender whose raw text clearly contains it is flagged as a real blind spot
# (rather than a family that's simply absent from that tender, which is expected and fine).
PRESENT: dict[str, re.Pattern] = {
    "exclusion": re.compile(r"exclu|disqualif|reject|debarr|ineligib", re.I),
    "passfail": re.compile(r"pass\s*/?\s*fail|\bpqq\b|selection\s+questionnaire|\bsq\b", re.I),
    "integrity": re.compile(r"collusi|canvass|conflict\s+of\s+interest|anti[-\s]?competitive", re.I),
    "minimums": re.compile(r"turnover|professional\s+indemnity|liability\s+insurance|"
                           r"must\s+hold|accreditat", re.I),
    "returns": re.compile(r"failure\s+to\s+(complete|submit|return|provide)|"
                          r"must\s+(complete|submit|return)", re.I),
    "deadline": re.compile(r"closing\s+(date|time)|no\s+later\s+than|deadline", re.I),
}


def _pages(pdf_path: Path):
    import fitz
    doc = fitz.open(pdf_path)
    out = [(i + 1, doc.load_page(i).get_text("text")) for i in range(doc.page_count)]
    doc.close()
    return out


def _tender_pdfs(argv: list[str]) -> list[tuple[str, Path]]:
    """Ad-hoc PDF paths if given, else every distinct PDF referenced by the eval manifest."""
    if argv:
        return [(Path(a).stem, Path(a)) for a in argv]
    manifest = read_json(MANIFEST)
    seen: dict[str, Path] = {}
    for e in manifest.get("tenders", []):
        p = REPO_ROOT / e["pdf"]
        seen.setdefault(e.get("tender_id", p.stem), p)
    return list(seen.items())


def analyse(pdf_path: Path) -> dict:
    pages = _pages(pdf_path)
    full = "\n".join(t for _, t in pages)
    cands = scan_candidates(pages)
    counts = {f: 0 for f in FAMILIES}
    for c in cands:
        exc = c["source_excerpt"]
        for f, rx in FAMILIES.items():
            if rx.search(exc):
                counts[f] += 1
    blind = [f for f in FAMILIES if not counts[f] and PRESENT[f].search(full)]
    return {"total": len(cands), "counts": counts, "blind": blind, "pages": len(pages)}


def main(argv) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    tenders = _tender_pdfs(argv[1:])
    fams = list(FAMILIES)
    print("Gate-FAMILY coverage of the deterministic safety-net (regex-only, gold-free):\n")
    print(f"{'tender':<32}{'pp':>4}{'cand':>6}  " + "".join(f"{f[:8]:>9}" for f in fams))
    all_blind: list[tuple[str, str]] = []
    for tid, pdf in tenders:
        if not pdf.exists():
            print(f"{tid[:31]:<32}  (PDF not found: {pdf})")
            continue
        a = analyse(pdf)
        row = f"{tid[:31]:<32}{a['pages']:>4}{a['total']:>6}  "
        for f in fams:
            n = a["counts"][f]
            row += f"{(str(n) if n else ('GAP' if f in a['blind'] else '·')):>9}"
        print(row)
        all_blind += [(tid, f) for f in a["blind"]]
    print("\nBLIND SPOTS (family present in the raw text but the net fired 0 — taxonomy gap to close):")
    if all_blind:
        for tid, f in all_blind:
            print(f"  ⚠ {tid}: {f}")
    else:
        print("  none — every present gate-family fires at least once on every tender scanned.")
    # sanity: confirm the decomposed families cover _STRONG (no family-less strong candidates)
    unclassified = 0
    for tid, pdf in tenders:
        if not pdf.exists():
            continue
        for c in scan_candidates(_pages(pdf)):
            if _STRONG.search(c["source_excerpt"]) and not any(
                    rx.search(c["source_excerpt"]) for rx in FAMILIES.values()):
                unclassified += 1
    if unclassified:
        print(f"\n  note: {unclassified} strong candidate(s) matched _STRONG but no named family "
              f"— the family decomposition drifted from _STRONG; re-sync FAMILIES.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
