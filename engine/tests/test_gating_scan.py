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


SECTOR_AND_STRUCTURE_GATES = [
    # long-distance phrasing (many words between the verb and the deadline trigger)
    "Tenders must be submitted, in accordance with the instructions in section 6, no later than 12:00.",
    # sector-specific mandatory registrations / clearances (real UK public-sector gates)
    "The provider must be registered with the Care Quality Commission (CQC).",
    "All gas work must be carried out by a Gas Safe registered engineer.",
    "The contractor must be CHAS accredited before commencing work.",
    "An enhanced DBS check is mandatory for all staff working with children.",
    "Staff must have DBS clearance before deployment.",
    "Contractors must be Constructionline registered.",
]


# Real deal-breaker phrasings from a HELD-OUT tender (Bradwell grounds ITT, hand-labelled by
# Pranav) that the scanner missed on first contact — the value of a real test over synthetic banks.
HELD_OUT_GATES = [
    "Any bid which includes proposed amendments to the contract shall be deemed a variant bid and not be accepted.",
    "Tenderers must satisfy these mandatory criteria before their bid will be considered further.",
    "Failure to confirm acceptance will remove the Tenderer from consideration and their bid will not be scored further.",
]


# PROACTIVE mega-bank: enumerate the deal-breaker phrasing space UP FRONT (every consequence
# synonym, obligation form, trigger) so an unseen tender can't drop us to ~70% by using a word we
# never listed. Recall-first — being generous here is correct: a missed deal-breaker costs far more
# than a needs_review false flag. Every line must match; a future edit that narrows a pattern fails.
MEGABANK_GATES = [
    # consequence synonyms — "the bid is out"
    "The tender will be rejected.", "The bid shall be excluded from the competition.",
    "The supplier will be disqualified.", "The submission will be eliminated.",
    "The economic operator will be debarred.", "The tenderer may be precluded from award.",
    "The bid will be set aside.", "The proposal will be passed over.", "The response will be ruled out.",
    "Late submissions will be disregarded.", "The tenderer will be removed from the process.",
    "The bidder will be stood down.", "The bid will not be accepted.", "The tender will not be considered.",
    "The submission will not be evaluated.", "The tender will not proceed.",
    "The bid will not progress to the next stage.", "The submission will not be scored.",
    "The tenderer will not be shortlisted.", "The bid will not be entertained.",
    "The response will not be taken forward.", "The bid will be deemed non-compliant.",
    "The tenderer will be deemed ineligible.", "The bid will be rendered void.",
    "The bidder is barred from participating.", "The bid will be thrown out.",
    "Bids received late will be returned unopened.", "The tender will be refused.",
    "The submission will be declined.", "The bid will be withdrawn from the process.",
    "The tenderer will automatically fail the selection stage.", "The bid cannot be awarded the contract.",
    # obligations / holdings / minimums / returns / deadline / integrity / triggers
    "The tenderer must hold public liability insurance of £5 million.",
    "The contractor must be CHAS accredited.", "Bidders must have a minimum annual turnover of £500,000.",
    "A tender that does not reach the quality threshold will not proceed.",
    "The pricing schedule must be completed and returned.",
    "Failure to submit the required documents will result in exclusion.",
    "Tenders must be received no later than 12:00 on the closing date.",
    "Submissions must be lodged before the cut-off time.", "Late tenders will not be accepted.",
    "Any tenderer engaged in collusive tendering will be disqualified.",
    "No variant bids will be accepted.", "Any attempt to influence the evaluation will lead to disqualification.",
    "If a tenderer does not meet the selection criteria, the bid will be rejected.",
    "A supplier subject to a ground for exclusion is ineligible.",
    "Bidders unable to evidence the requisite cover will be stood down.",
]


def test_megabank_full_phrasing_space_is_covered():
    """Proactive generosity guard: the scanner must recognise the whole enumerated deal-breaker
    phrasing space, not just words seen in a real tender so far."""
    misses = [g for g in MEGABANK_GATES if not _STRONG.search(g)]
    assert not misses, f"mega-bank misses (narrow a pattern and this fails): {misses}"


def test_net_catches_held_out_bradwell_phrasings():
    """Regression guard for the 3 deal-breakers the Bradwell held-out gold caught us missing
    (variant-bid rejection, must-satisfy-mandatory-criteria, failure-to-confirm removal)."""
    misses = [g for g in HELD_OUT_GATES if not _STRONG.search(g)]
    assert not misses, f"net missed held-out gate phrasings: {misses}"


def test_net_catches_sector_and_longdistance_gates():
    """Sector compliance schemes (CQC/Gas Safe/CHAS/DBS/Constructionline) and gates with many
    words between the verb and the trigger — both real on UK public-sector tenders."""
    misses = [g for g in SECTOR_AND_STRUCTURE_GATES if not _STRONG.search(g)]
    assert not misses, f"net missed sector/long-distance gates: {misses}"


def test_typographic_characters_do_not_break_matching():
    """Real PDFs emit curly quotes, ligatures and en-dashes that would break ASCII patterns —
    "employer's liability" (curly '), "pass-fail" (en-dash), "disqualified" (fi ligature). The
    scan normalises them so the gate keyword still matches."""
    pages = [
        (1, "Cover for employer’s liability of five million pounds is a requirement."),
        (2, "This selection question is assessed on a pass–fail basis."),
        (3, "A tenderer who acts improperly may be disqualiﬁed."),
    ]
    for p in pages:
        assert any(_STRONG.search(c["text"]) for c in scan_candidates([p])), \
            f"typographic characters broke matching on: {p[1]}"


def test_hyphenated_gate_word_split_across_a_line_break_is_rejoined():
    """PDFs hyphenate at line breaks ('exclu-\\nsion'); the gate keyword must survive so the
    disqualifier is still flagged."""
    pages = [(4, "A supplier subject to a ground for exclu-\nsion cannot be awarded the contract.")]
    texts = " ".join(c["text"].lower() for c in scan_candidates(pages))
    assert "exclusion" in texts


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


def test_table_row_with_several_gates_splits_into_separate_cells():
    """A table row flattens (PyMuPDF) to one line with big column gaps. If several distinct
    deal-breakers share that row, they must each become their own candidate — otherwise the
    one-to-one matcher can only ever credit ONE of them, silently dropping the others."""
    row = [(5, "Minimum turnover GBP 500,000    Public liability insurance GBP 5m    "
               "Tenders must arrive no later than 12:00")]
    cands = [c["text"] for c in scan_candidates(row)]
    assert any("turnover" in c.lower() and "insurance" not in c.lower() for c in cands)
    assert any("insurance" in c.lower() and "turnover" not in c.lower() for c in cands)
    assert any("no later than" in c.lower() and "turnover" not in c.lower() for c in cands)


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
