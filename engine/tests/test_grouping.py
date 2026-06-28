from engine.reconcile import group_candidates


def test_six_raw_yield_five_groups(raw_envelope):
    assert len(group_candidates(raw_envelope["raw_requirements"])) == 5


def test_iso_pair_is_the_only_merge(raw_envelope):
    groups = group_candidates(raw_envelope["raw_requirements"])
    sizes = sorted(len(g) for g in groups)
    assert sizes == [1, 1, 1, 1, 2]
    pair = next(g for g in groups if len(g) == 2)
    assert {r["raw_id"] for r in pair} == {"raw-c003-0001", "raw-c004-0001"}


def test_singletons_never_merged_with_iso(raw_envelope):
    groups = group_candidates(raw_envelope["raw_requirements"])
    singletons = {g[0]["raw_id"] for g in groups if len(g) == 1}
    assert singletons == {
        "raw-c008-0002", "raw-c019-0004", "raw-c027-0001", "raw-c033-0003",
    }


def test_different_page_blocks_merge_even_if_text_identical():
    # PRIME DIRECTIVE: identical text on different pages => KEEP BOTH.
    a = {"raw_id": "x1", "text": "The supplier must hold ISO 9001 certification.",
         "source_page": 14, "source_clause": "S1"}
    b = {"raw_id": "x2", "text": "The supplier must hold ISO 9001 certification.",
         "source_page": 51, "source_clause": "S1"}
    assert len(group_candidates([a, b])) == 2


def test_same_page_different_clause_blocks_merge():
    # Conservative: same page but different clause => not source-proximal => KEEP BOTH.
    a = {"raw_id": "y1", "text": "The supplier must hold ISO 9001 certification.",
         "source_page": 14, "source_clause": "Section 4.2.1"}
    b = {"raw_id": "y2", "text": "The supplier must hold ISO 9001 certification.",
         "source_page": 14, "source_clause": "Section 9.9"}
    assert len(group_candidates([a, b])) == 2


def test_null_clause_blocks_merge_even_if_text_identical():
    # 'err toward NOT merging' when a proximity signal is null.
    a = {"raw_id": "z1", "text": "The supplier must hold ISO 9001 certification.",
         "source_page": 14, "source_clause": None}
    b = {"raw_id": "z2", "text": "The supplier must hold ISO 9001 certification.",
         "source_page": 14, "source_clause": None}
    assert len(group_candidates([a, b])) == 2


def test_different_requirements_same_page_clause_blocked_by_token_floor():
    # Two DIFFERENT mandatory disqualifiers that share boilerplate AND share a page/clause.
    # char-ratio (~0.64) clears limb 1, but the token floor (~0.11) blocks the merge.
    ins = {"raw_id": "i1", "text": "The supplier must hold employer's liability insurance of at least ?5,000,000.",
           "source_page": 61, "source_clause": "Section 11.4"}
    turn = {"raw_id": "t1", "text": "The supplier must demonstrate an annual turnover of at least ?2,000,000.",
            "source_page": 61, "source_clause": "Section 11.4"}
    assert len(group_candidates([ins, turn])) == 2


def test_non_transitive_chain_is_refused():
    # REAL chain (verified live): a~b and b~c both clear the gate, a~c does NOT.
    # Naive transitive closure would wrongly fuse {a,b,c}; the all-pairs guard must not.
    a = {"raw_id": "a", "source_page": 5, "source_clause": "S",
         "text": "The supplier must hold ISO 9001 quality certification before contract award."}
    b = {"raw_id": "b", "source_page": 5, "source_clause": "S",
         "text": "The supplier must hold ISO 9001 quality certification before contract commencement and renewal."}
    c = {"raw_id": "c", "source_page": 5, "source_clause": "S",
         "text": "The provider must complete ISO 9001 renewal before contract commencement and audit."}
    groups = group_candidates([a, b, c])
    # c must NOT be chained in via b. {a,b} may merge; c stays separate => 2 groups, c alone.
    assert len(groups) == 2
    c_group = next(g for g in groups if any(r["raw_id"] == "c" for r in g))
    assert {r["raw_id"] for r in c_group} == {"c"}


def test_positive_control_full_chain_merges():
    # Mutual all-pairs similarity => all three SHOULD merge into one group.
    base = "The supplier must hold a valid ISO 9001 certification at the point of submission"
    a = {"raw_id": "p", "source_page": 9, "source_clause": "S", "text": base + " today."}
    b = {"raw_id": "q", "source_page": 9, "source_clause": "S", "text": base + " now."}
    c = {"raw_id": "r", "source_page": 9, "source_clause": "S", "text": base + " here."}
    groups = group_candidates([a, b, c])
    assert len(groups) == 1 and len(groups[0]) == 3
