"""gating_scan.py — deterministic disqualifier SAFETY NET (never miss a deal-breaker).

A compliance tool cannot silently drop a pass/fail requirement. General LLM extraction
occasionally does — especially in garbled form/PQQ sections (verified on the museum 41pp ITT:
the model missed the Q3.2.x Pass/Fail selection questions and the collusion-exclusion clause).

This exhaustive, deterministic scan reads EVERY page for strong disqualifier language
(reject / exclude / disqualify / pass-fail / "failure to … will result in …" / submission
deadline). For any STRONG signal the LLM extraction did NOT already cover, it emits a candidate
gating requirement — low confidence, needs_review — so the disqualifier is surfaced for a human
to confirm rather than lost. Recall-first by design: over-surface a candidate, never miss one.

Stdlib + the similarity seam only — no LLM, no key, reproducible offline. It only ADDS uncovered
strong candidates, so it can never reduce recall or precision of what extraction already found.
"""
from __future__ import annotations

import re

from engine.similarity import content_tokens

# UK PUBLIC-SECTOR DISQUALIFIER TAXONOMY — the finite set of gate types that void a bid in a UK
# ITT / SQ / framework. High-recall by design (the LLM pass + reconcile dedup filter downstream);
# grouped for maintainability. Specialising into public sector = making this taxonomy exhaustive.
_STRONG = re.compile(
    # 1. explicit exclusion / rejection / disqualification / debarment
    r"(reject(ed|ion)?|exclu(de|ded|ding|des|sion|sionary)|disqualif(y|ied|ication|ies)|"
    r"eliminat(e|ed|ion)|debarr(ed|ing)?|ineligib(le|ility)?|"
    r"(will\s+not|cannot|shall\s+not|won'?t)\s+be\s+(considered|evaluated|accepted|assessed|"
    r"progressed|short[-\s]?listed|taken\s+forward|entertained|scored)|shall\s+be\s+excluded|"
    r"\bnot\s+be\s+accepted\b|variant\s+bids?|remov\w*\s+.{0,25}(consideration|the\s+process|"
    r"evaluation|participation)|must\s+satisfy|mandatory\s+criteri|"
    r"grounds?\s+for\s+exclusion|mandatory\s+exclusion|"
    r"(render|invalidat)\w*\s+.{0,25}(void|invalid|non[-\s]?compliant)|"
    r"(void|invalid)\s+(tender|bid|submission|proposal|response|offer)|"
    r"(tender|bid|submission|proposal|response|offer)s?\b.{0,25}\b(void|invalid)\b|"
    r"(is|are|deemed|considered)\s+(void|invalid)\b|"
    # 2. pass/fail selection stage (SQ / PQQ / SPD)
    r"pass\s*[-/]?\s*fail|pass\s+or\s+fail|\bpqq\b|\bsq\b|selection\s+questionnaire|"
    r"deemed\s+.{0,25}fail|fail(ure|ed|s)?\s+.{0,40}(reject|exclu|disqualif|eliminat|not\s+be\s+considered)|"
    # 3. integrity gates
    r"canvass|collusi|non[-\s]?complian|conflicts?\s+of\s+interest|anti[-\s]?competitive|"
    r"improper\s+(contact|approach|influenc\w*)|(attempt|seek)\w*\s+to\s+influenc\w*|"
    r"influenc\w*\s+.{0,20}(evaluation|award|panel|process)|"
    # 4. mandatory minimums / thresholds / required holdings (certs, insurance, turnover)
    r"minimum\s+(?:[\w'-]+\s+){0,3}(turnover|standard|requirement|level|threshold|score|rating|credit)|"
    r"must\s+hold|must\s+be\s+.{0,30}(registered|certified|accredited|licen[cs]ed)|"
    r"registration\s+(is\s+)?(required|mandatory)|must\s+(possess|have|maintain)\s+.{0,40}"
    r"(certificat|accreditat|insurance|licen[cs]e|registration|clearance|check)|"
    r"(employer'?s|public)\s+liability|professional\s+indemnity|"
    # sector compliance schemes — appearing as a requirement is effectively a mandatory-registration gate
    r"gas\s+safe|\bchas\b|constructionline|safe\s?contractor|\bcscs\b|\bsia\b\s+(licen|approved|registered)|"
    r"\bcqc\b|care\s+quality\s+commission|\bdbs\b|disclosure\s+and\s+barring|enhanced\s+(disclosure|check)|"
    r"(security|dbs)\s+clearance|food\s+hygiene\s+rating|"
    # 5. mandatory returns / completeness
    r"must\s+(complete|submit|return|provide|confirm|acknowledge|sign|be\s+(returned|completed|"
    r"submitted|received|provided))|"
    r"failure\s+to\s+(complete|submit|return|provide|comply|meet|confirm|sign|acknowledge|accept)|"
    # 6. submission deadline / late / incomplete
    r"(receiv(e|ed)|submit(ted)?|return(ed)?|lodg(e|ed)|upload(ed)?|arriv(e|ed|es)|reach(es|ed)?)"
    r"\b.{0,70}no\s+later\s+than|closing\s+(date|time)|\bdeadline\b|"
    r"late\s+(tender|bid|submission|response)s?|incomplete\s+(tender|bid|submission|response)s?|"
    # 7. varied phrasings — real tenders paraphrase the finite gate set (synonyms for reject /
    #    exclude / hold / threshold). Widened after an adversarial paraphrase bank exposed 16/32.
    r"set\s+aside|pass(ed)?\s+over|ruled?\s+out|(will\s+)?not\s+(proceed|progress)\b|"
    r"non[-\s]?conform\w*|(required\s+to|shall)\s+hold|must\s+be\s+(a\s+)?member|"
    r"(no\s+less\s+than|not\s+less\s+than|at\s+least)\s+.{0,30}(turnover|insurance|experience|year)|"
    r"turnover\s+of\s+(at\s+least|no\s+less\s+than|not\s+less\s+than|£|gbp|\d)|"
    r"financial\s+standing|member\s+of\s+.{0,25}(scheme|register|body|association)|"
    r"pass\s+mark|(quality|score|scoring)\s+threshold|"
    r"mandatory\s+.{0,20}(site\s+visit|attendance|briefing)|condition\s+of\s+(bidding|tender)|"
    # 8. GENEROUS consequence net (recall-first: a missed deal-breaker costs FAR more than a
    #    needs_review false flag). A broad negative-modal + action, plus the full "the bid is out"
    #    synonym set — ambiguous verbs (discount/withdraw/refuse) anchored to a bid noun to stay sane.
    r"(cannot|can\s?not|will\s+not|shall\s+not|won'?t|would\s+not|may\s+not|must\s+not)\s+(be\s+)?"
    r"(consider|accept|award|evaluat|assess|progress|proceed|scor|short[-\s]?list|shortlist|open|"
    r"entertain|qualif|succeed|advanc|participat)\w*|"
    r"\bnot\s+be\s+(consider|accept|award|evaluat|assess|progress|scor|open|entertain|short[-\s]?list)\w*|"
    r"preclud\w*|rescind\w*|annul\w*|struck\s+out|\bbarred\b|st(oo|an)d\s+down|"
    r"automatic\w*\s+.{0,15}(fail|reject|exclu|disqualif)|fail\w*\s+.{0,10}(the\s+)?"
    r"(selection|assessment|evaluation)|"
    r"(bid|bidder|tender|tenderer|submission|proposal|response|offer|application|supplier|contractor)s?"
    r"\b.{0,30}\b(set\s+aside|passed?\s+over|ruled?\s+out|stood\s+down|thrown\s+out|returned\s+unopened|"
    r"withdrawn|discount\w*|disregard\w*|refus\w*|declin\w*|not\s+opened)|"
    r"(set\s+aside|passed?\s+over|ruled?\s+out|stood\s+down|thrown\s+out|withdrawn|disregard\w*|refus\w*|"
    r"declin\w*)\b.{0,30}(bid|tender|submission|proposal|response|offer|application)|"
    r"deemed?\s+.{0,20}(non[-\s]?compliant|ineligible|invalid|variant|unacceptable)|"
    r"(before|by)\s+the\s+(cut[-\s]?off|closing|deadline)|cut[-\s]?off\s+(time|date|point))",
    re.IGNORECASE,
)

_MIN_LEN = 16
_COVER_CONTAINMENT = 0.6   # covered if an extracted req overlaps >=60% of the smaller token set
_PASSFAIL = re.compile(r"pass\s*[-/]?\s*fail|pass\s+or\s+fail", re.IGNORECASE)

# Typographic characters real PDFs emit that would silently break the ASCII patterns above:
# curly quotes ("employer's" -> employer'?s misses), ligatures ("disqualiﬁed"), en/em dashes
# ("pass–fail"). Normalise them to ASCII before scanning so the gate keyword still matches.
_NORMALISE = {
    "’": "'", "‘": "'", "“": '"', "”": '"',      # curly quotes
    "–": "-", "—": "-", "−": "-",                       # en / em / minus dashes
    "ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl",  # ligatures
}


def _normalise(text: str) -> str:
    for k, v in _NORMALISE.items():
        if k in text:
            text = text.replace(k, v)
    return text


def _units(text: str):
    """Whitespace-normalise (form/table sections arrive with huge gaps), split into sentence-ish
    units, plus a sliding 3-window so a requirement fragmented across form cells still reforms.

    ALSO yields newline-delimited lines: form/address layouts separate fields by NEWLINES, not
    punctuation, so a gate on its own line ("Arrive no later than 12.00 noon 06/11/2013") would
    otherwise be swallowed into one giant punctuation-free run and its signal diluted below the
    match threshold. Isolating each line keeps that disqualifier recognisable as its own unit."""
    seen: set[str] = set()
    # Normalise typographic chars (curly quotes / ligatures / en-dashes) to ASCII so gate keywords
    # match, then rejoin soft-hyphenated words split across a line break ("exclu-\nsion" -> "exclusion")
    # so the keyword survives; the rejoin matches only letter-hyphen-newline-letter (real hyphens intact).
    text = re.sub(r"(\w)-[ \t]*\n[ \t]*(\w)", r"\1\2", _normalise(text or ""))
    # 1. per line: isolate form/address fields AND table cells. A table ROW flattens to one line
    #    with big column gaps ("Turnover £500k    Insurance £5m    Deadline 5pm"); split on those
    #    gaps + cell delimiters so each distinct gate is its own unit — the one-to-one eval can then
    #    credit each (a single merged row-unit could only ever credit one). Then also yield the whole
    #    collapsed line, which keeps a gate phrase that legitimately spans cells ("no later than").
    for raw_line in (text or "").split("\n"):
        for cell in re.split(r"\s{2,}|[\t|│┃¦]", raw_line):
            cell = re.sub(r"\s+", " ", cell).strip()
            if len(cell) >= _MIN_LEN and cell not in seen:
                seen.add(cell)
                yield cell
        line = re.sub(r"\s+", " ", raw_line).strip()
        if len(line) >= _MIN_LEN and line not in seen:
            seen.add(line)
            yield line
    # 2. collapsed + sentence-split units (reforms prose split across lines) + sliding 3-window
    norm = re.sub(r"\s+", " ", text or "").strip()
    parts = [p.strip() for p in re.split(r"(?<=[.;:])\s+", norm) if len(p.strip()) >= _MIN_LEN]
    for p in parts:
        if p not in seen:
            seen.add(p)
            yield p
    for i in range(len(parts) - 1):
        win = " ".join(parts[i:i + 3])
        if len(win) >= 20 and win not in seen:
            seen.add(win)
            yield win


def scan_candidates(pages) -> list[dict]:
    """pages: iterable of (page_number:int, page_text:str).
    Returns strong-signal candidate sentences: [{text, source_excerpt, source_page}]."""
    out: list[dict] = []
    seen: set[str] = set()
    for page_no, text in pages:
        for unit in _units(text):
            if _STRONG.search(unit):
                key = re.sub(r"\s+", " ", unit.lower())[:120]
                if key in seen:
                    continue
                seen.add(key)
                # A Pass/Fail selection question is a gate but arrives as a bare heading in form
                # layout ("3.2.2 Quality Standard (Pass/Fail)"); frame it as a requirement so the
                # candidate faithfully represents the disqualifier and is recognisable as the same
                # gate a human labelled (source_excerpt stays the verbatim line for grounding).
                cand_text = unit
                if _PASSFAIL.search(unit):
                    cand_text = "Tenderers must satisfy this Pass/Fail selection requirement: " + unit
                out.append({"text": cand_text, "source_excerpt": unit, "source_page": page_no})
    return out


def _covered(cand_tokens: set[str], extracted_token_sets: list[set[str]]) -> bool:
    """Covered if some extracted requirement overlaps >=60% of the SMALLER token set — so a tight
    disqualifier sentence AND a wide form-window that merely contains it both count as covered."""
    if not cand_tokens:
        return True
    for et in extracted_token_sets:
        if not et:
            continue
        inter = len(cand_tokens & et)
        if inter and inter / min(len(cand_tokens), len(et)) >= _COVER_CONTAINMENT:
            return True
    return False


_EMAIL = re.compile(r"\S+@\S+")
_PHONE = re.compile(r"\d[\d\s()+-]{6,}\d")


def _is_structural_nongate(text: str) -> bool:
    """A line that STRUCTURALLY cannot be a deal-breaker: a table-of-contents dotted leader, a
    contact block (email/phone), a mostly-digits/symbols line, or a <3-real-word fragment."""
    if "...." in text:
        return True
    if _EMAIL.search(text) or _PHONE.search(text):
        return True
    alnum = sum(ch.isalnum() for ch in text)
    if alnum and sum(ch.isalpha() for ch in text) / alnum < 0.5:
        return True
    return len(re.findall(r"[A-Za-z]{3,}", text)) < 3


def consolidate_candidates(candidates: list[dict], dedup_overlap: float = 0.90,
                           min_len_ratio: float = 0.6, dedup: bool = True) -> list[dict]:
    """Recall-safe precision pass on the generous net's output (deterministic, no LLM): drop
    structural non-gates (TOC leaders, contact blocks, digit/symbol lines, tiny fragments) and
    collapse same-page near-duplicate fragments (>= dedup_overlap token overlap), keeping the
    FULLEST line per cluster. Returns a SUBSET in the original order — never adds.

    Two guards keep it from dropping a real gate:
      * high overlap bar — distinct-but-similar gates (museum's Q3.2.x Pass/Fail questions) stay
        SEPARATE (0.85 already merges them and drops to 9/10; 0.90 keeps them apart);
      * LENGTH guard — a short, focused gate line is fully contained in (100% token overlap with) a
        long bloated block (e.g. SPSO's 'Arrive no later than…' inside an address block), so without
        this the focused line got absorbed and the bloated representative embedded poorly to the gold
        (SPSO 2/2 -> 0/2). Only merge when the two lines are within min_len_ratio in length.
    Verified to hold gating recall on ALL THREE gold tenders: museum 10/10, bradwell 10/10, SPSO 2/2."""
    kept = [c for c in candidates if not _is_structural_nongate(c.get("text", ""))]
    if not dedup:  # structural drop only — the model filter (stage 2) does context-aware de-dup, and
        return kept  # the lexical dedup can degrade a gate's best candidate (rubric-prefixed variant)
    reps: list[tuple[set, object, dict]] = []
    for c in sorted(kept, key=lambda x: -len(x.get("text", ""))):  # longest first -> representative
        ct = content_tokens(c.get("text", "")); pg = c.get("source_page"); lc = len(c.get("text", ""))
        dup = False
        for rt, rp, rc in reps:
            if rp != pg or not ct or not rt:
                continue
            if len(ct & rt) / min(len(ct), len(rt)) < dedup_overlap:
                continue
            lr = len(rc.get("text", ""))
            if min(lc, lr) / max(lc, lr, 1) < min_len_ratio:  # don't absorb a focused line into a bloated one
                continue
            dup = True
            break
        if not dup:
            reps.append((ct, pg, c))
    rep_ids = {id(r[2]) for r in reps}
    return [c for c in kept if id(c) in rep_ids]  # original order preserved


def uncovered_gating(extracted_reqs: list[dict], pages, raw_id_prefix: str = "gate") -> list[dict]:
    """The safety net: strong disqualifier sentences NOT already covered by extraction, returned
    as raw-format gating requirement dicts (low confidence, needs_review). Union these into the
    raw set before reconcile — reconcile's safety-escalation keeps them gating."""
    extracted_token_sets = [content_tokens(r.get("text", "")) for r in extracted_reqs]
    extra: list[dict] = []
    for seq, cand in enumerate(scan_candidates(pages)):
        # Recall-first: a Pass/Fail selection gate is a hard disqualifier — never let the
        # containment heuristic suppress it. A generic "…complete and submit the documents…"
        # req shares enough boilerplate to falsely "cover" a distinct "3.2.x (Pass/Fail)"
        # question (museum g61-63), which silently drops a deal-breaker. Non-pass/fail
        # candidates keep the coverage suppression as before. (G-038)
        is_passfail = bool(_PASSFAIL.search(cand.get("source_excerpt", "")))
        if not is_passfail and _covered(content_tokens(cand["text"]), extracted_token_sets):
            continue
        excerpt = cand["source_excerpt"][:300]
        extra.append({
            "raw_id": f"{raw_id_prefix}-{cand['source_page']}-{seq:04d}",
            "chunk_id": f"gating-scan-p{cand['source_page']}",
            "text": cand["text"][:300],
            "source_page": cand["source_page"],
            "source_clause": None,
            "source_excerpt": excerpt,
            "type": "mandatory",
            "is_gating": True,
            "category": "legal",
            "confidence": 0.5,
            "char_start": None,
            "char_end": None,
            "extractor_notes": "deterministic gating safety-net — extraction missed this "
                               "disqualifier-language line; confirm it is a real pass/fail gate.",
            "needs_review": True,
        })
    return extra
