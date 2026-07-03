"""gating_filter.py — MODEL precision filter for the generous gating safety-net.

Two-stage deal-breaker engine: the deterministic keyword net (engine.gating_scan) is generous by
design (recall-first — it would rather over-flag than miss a disqualifier), then this reads each
flagged line and DROPS only the obvious false positives (scope-of-work, boilerplate, navigation,
contact details). The model can only REMOVE from the net's set, so the deterministic recall floor
is preserved — precision goes up, recall does not go down.

RECALL-SAFETY INVARIANTS (why this can never silently drop a real deal-breaker):
  * Conservative prompt — KEEP if a line is, or might plausibly be, a deal-breaker; DROP only when
    it is CLEARLY not one; when unsure, KEEP.
  * Fail-open — disabled, no key, a network error, malformed output, or an EMPTY keep-set all return
    the candidates UNCHANGED. A failure can only under-filter (keep noise), never over-filter.
  * Never adds — the result is always a subset of the input, in the same order.

OFF by default (needs the GATING_FILTER flag + a key), same explicit-flag pattern as
engine.embeddings, so the offline test suite and the no-key demo stay deterministic and free.
"""
from __future__ import annotations

import json
import os

_TRUTHY = {"1", "true", "yes", "on"}

FILTER_SYSTEM = """You are a UK public-sector bid-compliance checker. You are given candidate lines a \
keyword scanner flagged as POSSIBLE deal-breakers in a tender.

A DEAL-BREAKER = a requirement where, if the bidder fails, omits or breaches it, their BID IS \
REJECTED, DISQUALIFIED, EXCLUDED, or SCORES A FAIL. This includes: explicit reject / exclude / \
disqualify / eliminate statements; Pass/Fail selection questions (SQ / PQQ); mandatory MINIMUM \
insurance / turnover / certification / registration; documents that MUST be returned or the bid is \
rejected; the SUBMISSION DEADLINE; collusion / canvassing / conflict-of-interest bans; variant-bid \
bans.

NOT a deal-breaker: the SCOPE OF WORK / what the service must actually do ("must build the \
infrastructure", "must clean the site weekly", "must use recycled materials where possible"); service \
quality aspirations; navigation / table-of-contents lines; contact details, addresses, emails; page \
headers/footers; generic boilerplate; content the tender "must include" UNLESS omitting it explicitly \
rejects the bid.

For each numbered line reply KEEP or DROP. KEEP if it is — or might plausibly be — a deal-breaker. \
DROP only if it is CLEARLY not one. When genuinely unsure, KEEP: missing a real deal-breaker is far \
worse than one extra flag a human can dismiss in a second.

Reply ONLY with a JSON object: {"verdicts":[{"n":1,"v":"KEEP"},{"n":2,"v":"DROP"}, ...]} covering \
every line by its number."""


def filter_enabled() -> bool:
    """The filter runs only when GATING_FILTER is explicitly truthy — an explicit flag (not mere
    key-presence) keeps pytest deterministic + the no-key demo free, exactly as engine.embeddings."""
    return os.environ.get("GATING_FILTER", "").strip().lower() in _TRUTHY


def _llm_classify(texts: list[str]) -> set[int]:
    """One batched chat call -> the set of 0-based indices to KEEP. Raises on any client/network/
    parse error (the caller fails open to keeping everything). Unlisted lines default to KEEP."""
    from openai import OpenAI

    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")
    numbered = "\n".join(f"{i + 1}. {(t or '')[:220]}" for i, t in enumerate(texts))
    client = OpenAI()
    resp = client.chat.completions.create(
        model=model, temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": FILTER_SYSTEM},
                  {"role": "user", "content": numbered}],
    )
    try:  # spend visibility (J-055) — must never break the filter
        from engine.usage_log import log_usage
        log_usage(resp, model, f"gating-filter {len(texts)} candidates")
    except Exception:
        pass
    data = json.loads(resp.choices[0].message.content)
    dropped = {int(d["n"]) - 1 for d in data.get("verdicts", [])
               if str(d.get("v", "")).strip().upper().startswith("D")}
    # default-KEEP: everything not explicitly dropped stays (recall-first)
    return {i for i in range(len(texts)) if i not in dropped}


# --- FULL-PAGE-CONTEXT judges (better than judging isolated lines). Each flagged line is judged
# WITH the whole page it sits on, so the model can tell a real gate from scope/boilerplate. We run
# TWO judges and KEEP a line if EITHER keeps it (drop only on agreement) — a recall-safe ensemble
# that held 10/10 on all three gold tenders (museum/bradwell/spso) where a single aggressive judge
# dropped a subtle scoring-threshold gate. ---
_PAGE_SYS = """You are given the FULL TEXT of one page of a UK public-sector tender, then numbered \
lines FROM that page which a keyword scanner flagged as POSSIBLE deal-breakers. Using the whole page \
as context, decide which flagged lines are GENUINE deal-breakers.

A DEAL-BREAKER = a rule where failing/omitting/breaching it means the BID IS REJECTED, DISQUALIFIED, \
EXCLUDED or SCORES A FAIL: exclusion grounds; a Pass/Fail selection question; a mandatory MINIMUM \
insurance/turnover/certification/registration; a document that MUST be returned or the bid is \
rejected; the submission DEADLINE; a collusion/canvassing/conflict/variant-bid ban; a minimum SCORE \
or QUALITY THRESHOLD where scoring below it fails/rejects/eliminates the bid (this counts even inside \
a scoring rubric, e.g. "a score of 0-2 means failure to meet the specification").

DROP a line if, in context, it merely describes the SCOPE OF WORK / how the service is delivered; is a \
quality aspiration, an instruction, a heading, navigation, or a contact detail; or is a duplicate \
fragment of another flagged line (keep the single clearest line per distinct deal-breaker). When \
unsure, KEEP — missing a real deal-breaker is far worse than one extra flag. Reply ONLY JSON \
{"keep":[<numbers to keep>]}."""

_PAGE_SYS_STRICT = """You are given the FULL TEXT of one page of a UK tender, then numbered lines \
flagged as possible DEAL-BREAKERS (a rule where a bidder who fails/omits/breaches it is rejected, \
disqualified, excluded, scored a fail, or knocked out). Err strongly toward KEEP: KEEP a line if it \
mentions ANY of — rejection/exclusion/disqualification/elimination; a Pass/Fail or a score/quality \
threshold that eliminates; a mandatory minimum (insurance, turnover, certification, registration); a \
document that must be returned; a deadline; collusion/canvassing/conflict/variant bids. ONLY drop a \
line that is unmistakably scope of work, service description, a heading, navigation, a contact detail, \
or an exact duplicate. Reply ONLY JSON {"keep":[<numbers to keep>]}."""


def _page_call(page_text: str, lines: str, sysmsg: str, model: str) -> set[int] | None:
    """One page judge -> set of KEPT local (0-based) indices, or None on any error (fail-open)."""
    from openai import OpenAI
    try:
        resp = OpenAI().chat.completions.create(
            model=model, temperature=0, response_format={"type": "json_object"},
            messages=[{"role": "system", "content": sysmsg},
                      {"role": "user", "content": f"PAGE FULL TEXT:\n{page_text}\n\nFLAGGED LINES:\n{lines}"}])
        try:
            from engine.usage_log import log_usage
            log_usage(resp, model, "gating-filter page-judge")
        except Exception:
            pass
        return {int(n) - 1 for n in json.loads(resp.choices[0].message.content).get("keep", [])}
    except Exception:
        return None


def _page_ensemble_keep(candidates: list[dict], pages, text_key: str = "text") -> set[int]:
    """Keep a candidate if EITHER full-page judge keeps it (drop only on agreement). Returns the set
    of KEPT indices into `candidates`. Any page/judge error keeps that page's lines (recall-safe)."""
    from collections import defaultdict
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")
    ptext = {pg: txt for pg, txt in pages}
    by_page: dict[object, list[int]] = defaultdict(list)
    for i, c in enumerate(candidates):
        by_page[c.get("source_page")].append(i)
    keep: set[int] = set()
    for pg, idxs in by_page.items():
        txt = (ptext.get(pg, "") or "")[:3200]
        lines = "\n".join(f"{k + 1}. {candidates[gi].get(text_key, '')[:180]}" for k, gi in enumerate(idxs))
        for sysmsg in (_PAGE_SYS, _PAGE_SYS_STRICT):
            kept_local = _page_call(txt, lines, sysmsg, model)
            if kept_local is None:            # judge errored -> keep all lines on this page
                keep.update(idxs)
                break
            for k in kept_local:
                if 0 <= k < len(idxs):
                    keep.add(idxs[k])
    return keep


def filter_gating_candidates(candidates: list[dict], pages=None, classify=None,
                             enabled: bool | None = None, text_key: str = "text") -> list[dict]:
    """Drop obvious-false candidates from the generous net; return a SUBSET (never adds/reorders).

    candidates: raw gating dicts from gating_scan.uncovered_gating. When `pages` (an iterable of
    (page_no, text)) is given, uses the recall-safe FULL-PAGE-CONTEXT ensemble; otherwise falls back
    to the isolated-line judge. `classify` is injectable (list[str] -> set[int] kept indices) for
    offline testing and takes precedence. Fail-open on every error / empty result so the filter can
    never lower the deterministic recall floor.
    """
    if enabled is None:
        enabled = filter_enabled()
    if not enabled or not candidates:
        return candidates
    try:
        if classify is not None:
            keep = classify([c.get(text_key, "") for c in candidates])
        elif pages is not None:
            keep = _page_ensemble_keep(candidates, pages, text_key)
        else:
            keep = _llm_classify([c.get(text_key, "") for c in candidates])
    except Exception as exc:  # no key / network / parse — keep everything (recall-safe)
        print(f"[gating-filter] disabled this run ({exc}); keeping all candidates.")
        return candidates
    if not keep:  # empty/failed verdict set — keep everything rather than drop all
        return candidates
    kept = [c for i, c in enumerate(candidates) if i in keep]
    return kept if kept else candidates
