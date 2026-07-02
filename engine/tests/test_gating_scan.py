"""gating_scan safety net: surfaces disqualifier lines extraction missed, stays quiet when covered."""
from engine.gating_scan import _STRONG, scan_candidates, uncovered_gating

PAGES = [
    (1, "The contract is for cleaning two sites. Any tenderer engaged in collusive tendering "
        "shall be disqualified. Services run Monday to Friday."),
    (2, "Tenders must be received no later than 12:00 noon on 21 March 2016. Late tenders will "
        "not be considered."),
    (3, "3.2.1 Previous Relevant Experience (Pass/Fail). Describe similar prior contracts."),
]


def test_scan_finds_strong_disqualifier_signals():
    texts = " ".join(c["text"].lower() for c in scan_candidates(PAGES))
    assert "collusive" in texts and "disqualified" in texts
    assert "no later than" in texts or "not be considered" in texts
    assert "pass/fail" in texts.replace(" ", "") or "pass/fail" in texts


CANONICAL_GATES = [
    # exclusion / rejection
    "Bids that do not comply with the mandatory requirements will be rejected.",
    "The authority reserves the right to exclude any supplier that fails to meet the selection criteria.",
    "A supplier subject to a mandatory ground for exclusion under Regulation 57 will be excluded.",
    "Any tender that is incomplete will be deemed non-compliant and eliminated.",
    "Suppliers who are ineligible under the exclusion grounds cannot be awarded the contract.",
    "Failure to sign the form of tender will render the bid invalid.",
    # pass/fail selection
    "Question 3.1 is assessed on a pass/fail basis; a fail eliminates the bid.",
    "The Selection Questionnaire (SQ) is evaluated pass or fail.",
    "Bidders must pass all sections of the PQQ to proceed to evaluation.",
    # integrity
    "Any bidder found to have engaged in collusive tendering will be disqualified.",
    "Canvassing of members or officers will result in disqualification.",
    # minimum standing
    "Bidders must have a minimum annual turnover of GBP 500,000.",
    "Suppliers must hold employer's liability insurance of at least GBP 5 million.",
    "You must be registered with the relevant regulatory body.",
    "A minimum credit rating is required to pass the financial assessment.",
    # mandatory returns
    "Failure to submit the required documents will result in exclusion.",
    "You must return the completed Standard Selection Questionnaire.",
    # deadline / late
    "Tenders must arrive no later than 12:00 noon on the closing date.",
    "Late tenders will not be accepted.",
    "Bids must be uploaded no later than the stated time.",
]


# ADVERSARIAL phrasings — deliberately AVOID our keywords (synonyms + passive/legalese) to test
# recall on wording an unseen tender might use. Exposed 16/32 misses before widening (incl. the
# 'exclusion' noun bug); all now caught. Locked so a future pattern edit can't silently regress.
ADVERSARIAL_GATES = [
    "Proposals that fail to satisfy the essential criteria will be set aside.",
    "Non-conforming tenders shall be passed over.",
    "The panel will disregard any late submission.",
    "Any bid received after the closing time will be returned unopened.",
    "Submissions that do not meet the requirements will be ruled out.",
    "A response lacking the signed declaration is invalid.",
    "Incomplete responses will not be taken forward.",
    "Bids failing to conform to the instructions may be set aside without further consideration.",
    "Tenders omitting mandatory information will be treated as non-compliant.",
    "Bids scoring below the pass mark are eliminated.",
    "A tender that does not reach the quality threshold will not proceed.",
    "Bidders lacking the required accreditation cannot be considered.",
    "Firms without the necessary licences are ineligible to bid.",
    "You are required to hold a valid waste carrier licence.",
    "Tenderers must be a member of an approved contractors scheme.",
    "The tenderer must demonstrate at least three years of relevant experience.",
    "Economic operators must not be subject to any ground for exclusion.",
    "Suppliers failing the financial standing assessment will not progress.",
    "Annual turnover of no less than five hundred thousand pounds is required.",
    "Any attempt to influence the evaluation will lead to disqualification.",
    "Undisclosed conflicts of interest will result in exclusion.",
    "Offers must reach the authority by the stated time; those that do not are excluded.",
    "Submissions received after the specified time will not be entertained.",
    "A mandatory site visit is a condition of bidding.",
]


def test_net_catches_canonical_uk_ps_gate_phrasings():
    """Generalisation guard: the deterministic net must recognise standard UK public-sector
    deal-breaker phrasings beyond the 2 tenders we have gold for, or a real unseen tender costs
    us recall. Each line is a canonical gate statement; the net must flag every one."""
    misses = [g for g in CANONICAL_GATES + ADVERSARIAL_GATES if not _STRONG.search(g)]
    assert not misses, f"net missed gate phrasings: {misses}"


def test_taxonomy_catches_canonical_uk_ps_gate_vocabulary():
    """Canonical UK public-sector gate phrasings the 8-tender corpus may not all use verbatim,
    but real tenders will — the net must recognise them so recall generalises beyond the corpus."""
    pages = [
        (1, "A supplier deemed ineligible under the exclusion grounds cannot proceed."),
        (2, "Failure to sign the declaration will render your tender invalid."),
        (3, "Any bid that is void will be set aside."),
        # generalised submission-deadline phrasing (verb + words + 'no later than')
        (4, "You must submit your Tender no later than 23-Oct-2025 12:00."),
    ]
    joined = " ".join(c["text"].lower() for c in scan_candidates(pages))
    assert "ineligible" in joined
    assert "invalid" in joined
    assert "void" in joined
    assert "no later than" in joined


def test_form_layout_deadline_on_its_own_line_is_isolated():
    """Form/address layouts separate fields by NEWLINES, not punctuation. A submission-deadline
    gate on its own line ('Arrive no later than 12.00 noon ...') must be surfaced as its own unit,
    not swallowed into the address block — otherwise its signal dilutes below the match threshold
    (this was the SPSO g17 deterministic miss). Also pins 'arrive' as a recognised deadline verb."""
    pages = [(6, "Facilities Administrator\n4 Melville Street\nEDINBURGH\nEH3 7NS\n\n"
                 "Arrive no later than 12.00 noon 06/11/2013\n\nYour submission must be complete.")]
    texts = [c["text"] for c in scan_candidates(pages)]
    assert any("Arrive no later than 12.00 noon 06/11/2013" == t for t in texts), \
        "the deadline line must be isolated as its own candidate, not merged into the address"


def test_uncovered_gating_surfaces_what_extraction_missed():
    # extraction only caught the innocuous line -> the collusion + deadline + pass/fail gates are missed
    extracted = [{"text": "The service runs Monday to Friday."}]
    extra = uncovered_gating(extracted, PAGES)
    joined = " ".join(c["text"].lower() for c in extra)
    assert "collusive" in joined
    assert all(c["is_gating"] and c["needs_review"] and c["confidence"] <= 0.6 for c in extra)


def test_covered_disqualifier_is_not_re_added():
    extracted = [
        {"text": "Any tenderer engaged in collusive tendering shall be disqualified from the process."},
        {"text": "Tenders must be received no later than 12:00 noon on 21 March 2016; late tenders "
                 "will not be considered."},
        {"text": "Tenderers must answer 3.2.1 Previous Relevant Experience (Pass/Fail)."},
    ]
    joined = " ".join(c["text"].lower() for c in uncovered_gating(extracted, PAGES))
    assert "collusive" not in joined  # already covered -> not duplicated


def test_passfail_gate_never_suppressed_by_a_generic_covering_req():
    # museum g61-63: a distinct "3.2.x (Pass/Fail)" selection gate was masked because a
    # generic "submit the documents" req shared >=60% boilerplate tokens. A Pass/Fail gate
    # is a hard disqualifier and must surface anyway (recall-first). (G-038)
    pages = [(24, "3.2.2 Quality Standard (Pass/Fail). Describe your quality management systems.")]
    cand = scan_candidates(pages)[0]["text"]
    # a generic req that token-CONTAINS the candidate (containment 1.0 -> old rule would suppress)
    extracted = [{"text": cand + " plus additional unrelated submission paperwork details."}]
    out = uncovered_gating(extracted, pages)
    assert any("3.2.2" in c["source_excerpt"] for c in out), "Pass/Fail gate must not be suppressed"


def test_non_passfail_gate_still_suppressed_when_covered():
    # control: the coverage suppression still applies to non-pass/fail candidates.
    pages = [(1, "Any tenderer engaged in collusive tendering shall be disqualified.")]
    extracted = [{"text": "Any tenderer engaged in collusive tendering shall be disqualified "
                          "from the whole procurement process without exception."}]
    joined = " ".join(c["text"].lower() for c in uncovered_gating(extracted, pages))
    assert "collusive" not in joined


def test_no_gates_means_no_candidates():
    pages = [(1, "The service runs Monday to Friday. Staff wear uniforms. Bins are emptied daily.")]
    assert uncovered_gating([{"text": "irrelevant"}], pages) == []
