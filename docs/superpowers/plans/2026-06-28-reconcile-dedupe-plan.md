# Bidframe Reconcile/Dedupe — Final TDD Implementation Plan

Pipeline **step 5**. One engineer can execute this top-to-bottom with no other context.
Every number below is verified against the golden trace and live difflib output on this machine.

> **BUILD ORDER (eval-prioritized — read this first).** The eval harness is the Generalist's headline
> deliverable, so it is built *before* the bulk of reconcile. This plan is split across that order:
> 1. **This plan, Phases 0–2** — `engine/` scaffolding + `_io.py` + `similarity.py`. *(the shared foundation; `similarity.py` is reused by eval)*
> 2. **`2026-06-28-eval-harness-plan.md`, Phases E0–E3** — the eval harness against synthetic fixtures. *(THE PRIORITY)*
> 3. **This plan, Phases 3–9** — grouping → merge → `to_final` → ids → report → end-to-end.
> 4. **Eval plan, Phase E4** — the closed loop: `reconcile(mock raw)` → `score` vs `mock.gold.json`.
>
> If time runs short, reconcile's anti-transitivity guard (Phase 3 all-pairs + its chain tests) is the one
> deferrable piece — but the conservative AND gate and the token-Jaccard floor are essential, not optional.

---

## 1. Goal & Context

Build a **stdlib-only Python module** that consumes the **raw extraction envelope** the backend emits
(candidate requirement objects, cross-chunk duplicates allowed, provisional `raw_id`s, raw confidence)
and produces the **clean final envelope** the API serves and the frontend renders.

- **Home:** new top-level `engine/` folder (Generalist lane — a *sibling* to `/backend`, never nested under it).
- **Stack:** Python 3.12 stdlib only for the module; `pytest` is the only dev dependency.
- **Method:** TDD — write the test, watch it fail, implement, verify against the exact expected value, check done-criteria. Every phase.
- **The trace:** **6 raw items → 5 final requirements** (exactly one merge: the ISO-9001 cross-chunk duplicate).

### THE PRIME DIRECTIVE — keep this front-and-center

> **Reconcile CONSERVATIVELY. When unsure two candidates are the same, keep BOTH.**
> Wrongly merging two *different* requirements is a **silent miss** — the worst failure, because a
> missed mandatory/gating requirement disqualifies a real bid. We merge only on a conservative **AND**
> of signals; we **escalate** safety flags on merge (mandatory/gating wins, never downgrades); we never
> let a disqualifier vanish.

### Locked design (do NOT relitigate)

- Matching = `difflib` fuzzy text similarity **+** a token-set floor + source proximity, behind a swappable `similarity()` seam. **Not embeddings** (over-merge, non-deterministic, unauditable).
- Merge gate = conservative **AND**: high text similarity **AND** token-set overlap **AND** source-proximal (same page **AND** same clause).
- Merged confidence = **noisy-OR**: `1 - product(1 - c_i)`. Corroboration raises confidence. Singletons pass through unchanged.
- **Safety escalation:** any merged member mandatory ⇒ merged mandatory; any member `is_gating` ⇒ merged gating. Never downgrade.
- Output = the locked final schema, **drop-in for the live frontend type**. Merge provenance goes in a **separate reconcile report**, never in the requirement object.
- `needs_review` = crude default: `merged confidence < 0.75 ⇒ true`. (Real calibration is Day 3, out of scope.)
- All file I/O and stdout forced to UTF-8 (this box defaults to cp1252 and *will* crash otherwise — already observed: J-008).

### Verified facts this plan depends on (measured live, not assumed)

| Fact | Measured value | Consequence |
|---|---|---|
| ISO pair char-ratio (normalised) | **0.7529** | clears char gate 0.66 |
| ISO pair token Jaccard | **0.2727** | clears jaccard floor 0.20 |
| insurance vs turnover char-ratio | **0.6443** | **above 0.60** — a naive 0.60 char-only gate would over-merge two different disqualifiers if they shared a page |
| insurance vs turnover Jaccard | **0.1111** | **below 0.20** — the jaccard floor blocks this false merge |
| insurance vs case-studies char-ratio | 0.3478 | safely below gate |
| `engine/` exists? | **No** | create it |
| live `frontend/src/types/requirement.ts` | **15 fields**, no `answer`/`open_questions`, `source_clause: string` (non-null); `Tender` has **no** `capability_docs` | reconcile output must match this exactly — see §3 |

---

## 2. What we are NOT doing (out of scope — do not build)

- **No embeddings / ML similarity.** The `similarity()` seam makes that a one-line future swap, not a Day-1 rabbit hole.
- **No confidence calibration.** `needs_review = conf < 0.75` is a deliberate crude placeholder. Tuning vs the gold set is Day 3.
- **No `answer`, `open_questions`, `capability_docs`, or autofill fields in the output** — the live frontend type does not declare them. Reconcile **omits** them entirely (AGENTS.md explicitly permits "emit null OR omit"). They land later via a *coordinated Frontend PR* when the Day-3 autofill step ships. See §3.
- **No config knobs / tunable weights / threshold UI.** Hardcode conservative constants now.
- **No cross-document reconcile, no dependency-edge resolution.** `criteria_ref`/`depends_on` pass through (default `null` / `[]`), with a guard that no `raw_id` leaks through `depends_on`.
- **No rich provenance schema / no UI for provenance.** Plain separate report only; debug/audit, never a requirement-object field.
- **No new deps beyond stdlib + pytest.**

### A note on the anti-transitivity guard (kept, but earns its place)

Two critics flagged the all-pairs guard as YAGNI gold-plating *and* its test as vacuous. Both are partly right:
the original test fixture did not exercise the guard. We **keep** the guard (it is cheap and directly defends the
prime directive's worst failure mode), but **only because §6 ships a numerically-verified real chain fixture** that
a naive transitive-closure implementation fails. A guard without a real test is dead ceremony — we do not ship that.

---

## 3. The output contract — match the LIVE frontend type, not just AGENTS.md

This is the integration blocker the critiques surfaced, and it is correct. The reconcile output is consumed by
`frontend/src/types/requirement.ts`, which is the **15-field** interface below. AGENTS.md describes a *wider future*
schema (`answer`, `open_questions`, `capability_docs`); those fields are **not yet in the frontend type**, and adding
them is a Frontend-lane schema change gated behind a PR per AGENTS.md git rules.

**Decision (cheapest correct path):** reconcile emits **exactly the 15 fields the live frontend declares**, and the
envelope is **exactly `{tender_id, title, requirements}`**. We do **not** emit `answer`, `open_questions`, or
`capability_docs`. This keeps `main` demo-able and "drop-in for the frontend" *true*, not aspirational.

**The 15 final fields (FINAL_KEYS) — exactly the `Requirement` interface, nothing more:**
```
id, text, source_page, source_clause, source_excerpt, type, is_gating, category,
confidence, status, needs_review, decision, criteria_ref, depends_on, draft_answer
```
**FINAL_KEYS has exactly 15 members** (counted against `frontend/src/types/requirement.ts` lines 10–26).

**Forbidden in output** (raw/interim fields that must never leak): `raw_id, chunk_id, char_start, char_end,
extractor_notes, _char_start, _member_raw_ids` — and `answer, open_questions, capability_docs` (deferred, not yet in
the frontend type).

**Cross-lane note to put in `engine/README.md`:** *"Reconcile emits the 15-field `Requirement` shape and the
`{tender_id, title, requirements}` envelope that `frontend/src/types/requirement.ts` declares today. The additive
autofill fields (`answer`, `open_questions`, `capability_docs`) are intentionally omitted; they arrive via a
coordinated Frontend type change + PR when the Day-3 autofill step ships. Do not add them to reconcile output before
that PR lands."*

> `source_clause` discrepancy (minor, noted not fixed here): the live frontend type declares `source_clause: string`
> (non-nullable) while AGENTS.md marks it nullable. In raw v1 every item has a non-null clause, so reconcile never
> emits `null` for it on this trace. Flag to Frontend that real raw may carry `null`; do not change the frontend type
> from this lane.

---

## 4. File layout under `engine/`

```
engine/
  __init__.py            # makes `engine` importable (python -m engine.reconcile from repo root)
  _io.py                 # read_json / write_json — always encoding='utf-8', ensure_ascii=False
  similarity.py          # swappable similarity() seam: char-ratio + token Jaccard
  reconcile.py           # the module + def main(argv) -> int + __main__ guard + UTF-8 stdout guard
  requirements.txt       # pytest==9.0.2 (dev-only; flat-by-name like backend/requirements.txt)
  README.md              # Run section (bash + Windows) + "run from repo root" + cross-lane omit note
  tests/
    __init__.py
    conftest.py          # anchors rootdir; loads golden fixtures
    fixtures/
      mock_raw_extraction.json   # the 6 raw candidates (golden INPUT)
      golden_final.json          # the 5 final requirements (golden EXPECTED OUTPUT)
    test_io.py
    test_similarity.py
    test_grouping.py
    test_merge.py
    test_to_final.py
    test_assign_ids.py
    test_report.py
    test_end_to_end.py
```

**Patterns to copy from `backend/scripts/parse_check.py`** (verified present): module docstring,
`from __future__ import annotations`, PEP 604 hints, `def main(argv) -> int`,
`if __name__ == "__main__": raise SystemExit(main(sys.argv))`, and the UTF-8 stdout guard at its lines 128–132:
```python
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass
```

**How to run anything (ALWAYS from repo root):**
- Tests: `python -m pytest engine/tests/ -v`
- Module: `python -m engine.reconcile <raw.json> --out <final.json> --report <report.json>`

Always `python` (never `python3` / `py` — neither works on this box: `python3` is the Store shim, `py` is not installed).

---

## Phase 0 — Scaffolding + golden fixtures

No test yet — this is the fixture data every later test asserts against.

### 0a. Package skeleton

**`engine/__init__.py`:**
```python
"""Bidframe engine package (Generalist lane): reconcile/dedupe + confidence routing."""
```

**`engine/tests/__init__.py`** — empty file.

**`engine/tests/conftest.py`:**
```python
"""Pytest config for engine tests. Run from repo root: python -m pytest engine/tests/ -v"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str) -> dict:
    with open(FIXTURES / name, encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def raw_envelope() -> dict:
    return _load("mock_raw_extraction.json")


@pytest.fixture
def golden_final() -> dict:
    return _load("golden_final.json")
```

**`engine/tests/fixtures/mock_raw_extraction.json`** — the golden INPUT (6 raw candidates, RAW envelope shape).
Char offsets drive document order; the two ISO members are the seeded duplicate.
```json
{
  "tender_id": "tnd-001",
  "title": "Managed IT Services Framework 2026",
  "source_filename": "managed-it-tender.pdf",
  "page_count": 80,
  "chunk_count": 40,
  "raw_requirements": [
    {
      "raw_id": "raw-c003-0001",
      "chunk_id": "c003",
      "text": "The supplier shall hold a valid ISO 9001 certification at the time of tender submission.",
      "source_page": 14,
      "source_clause": "Section 4.2.1",
      "source_excerpt": "Bidders shall hold a valid ISO 9001 certification at the point of submission. Failure to evidence this will result in the bid being rejected.",
      "char_start": 1840,
      "char_end": 1978,
      "type": "mandatory",
      "is_gating": true,
      "category": "certification",
      "confidence": 0.94,
      "extractor_notes": ""
    },
    {
      "raw_id": "raw-c004-0001",
      "chunk_id": "c004",
      "text": "Suppliers must hold a current ISO 9001 certificate at the point of bid submission.",
      "source_page": 14,
      "source_clause": "Section 4.2.1",
      "source_excerpt": "Suppliers must hold a current ISO 9001 certificate at the point of bid submission.",
      "char_start": 120,
      "char_end": 201,
      "type": "mandatory",
      "is_gating": true,
      "category": "certification",
      "confidence": 0.88,
      "extractor_notes": "duplicate of c003 from overlapping chunk boundary — reconcile should merge"
    },
    {
      "raw_id": "raw-c008-0002",
      "chunk_id": "c008",
      "text": "The supplier must hold employer's liability insurance of at least £5,000,000.",
      "source_page": 22,
      "source_clause": "Section 6.1",
      "source_excerpt": "The supplier must hold employer's liability insurance of at least £5,000,000.",
      "char_start": 540,
      "char_end": 616,
      "type": "mandatory",
      "is_gating": true,
      "category": "insurance",
      "confidence": 0.91,
      "extractor_notes": ""
    },
    {
      "raw_id": "raw-c019-0004",
      "chunk_id": "c019",
      "text": "The supplier should provide a dedicated account manager for the contract term.",
      "source_page": 48,
      "source_clause": "Section 9.3",
      "source_excerpt": "The supplier should provide a dedicated account manager for the duration of the contract term.",
      "char_start": 2100,
      "char_end": 2193,
      "type": "optional",
      "is_gating": false,
      "category": "technical",
      "confidence": 0.79,
      "extractor_notes": ""
    },
    {
      "raw_id": "raw-c027-0001",
      "chunk_id": "c027",
      "text": "The supplier must demonstrate an annual turnover of at least £2,000,000.",
      "source_page": 61,
      "source_clause": "Section 11.4",
      "source_excerpt": "minimum annual turnover of £2,000,000 over each of the last two financial years",
      "char_start": 88,
      "char_end": 166,
      "type": "mandatory",
      "is_gating": true,
      "category": "financial",
      "confidence": 0.62,
      "extractor_notes": "low confidence — extracted from a noisy financial table"
    },
    {
      "raw_id": "raw-c033-0003",
      "chunk_id": "c033",
      "text": "The supplier shall provide three case studies of comparable public-sector contracts.",
      "source_page": 74,
      "source_clause": "Section 13.2",
      "source_excerpt": "Bidders shall provide three case studies of comparable public-sector contracts delivered in the last five years.",
      "char_start": 310,
      "char_end": 421,
      "type": "mandatory",
      "is_gating": false,
      "category": "experience",
      "confidence": 0.85,
      "extractor_notes": ""
    }
  ],
  "extraction_meta": {
    "model": "mock-extractor-v0",
    "extracted_at": "2026-06-28T09:00:00Z",
    "warnings": []
  }
}
```

**`engine/tests/fixtures/golden_final.json`** — the EXPECTED OUTPUT envelope. **15-field requirements, envelope is
`{tender_id, title, requirements}` only — NO `capability_docs`, NO `answer`, NO `open_questions`.** `req-0001` keeps
the **c003** canonical text/excerpt/page/clause, mandatory+gating, confidence `0.9928`, `needs_review:false`;
`req-0004` is the only `needs_review:true`.
```json
{
  "tender_id": "tnd-001",
  "title": "Managed IT Services Framework 2026",
  "requirements": [
    {
      "id": "req-0001",
      "text": "The supplier shall hold a valid ISO 9001 certification at the time of tender submission.",
      "source_page": 14,
      "source_clause": "Section 4.2.1",
      "source_excerpt": "Bidders shall hold a valid ISO 9001 certification at the point of submission. Failure to evidence this will result in the bid being rejected.",
      "type": "mandatory",
      "is_gating": true,
      "category": "certification",
      "confidence": 0.9928,
      "status": "pending",
      "needs_review": false,
      "decision": null,
      "criteria_ref": null,
      "depends_on": [],
      "draft_answer": null
    },
    {
      "id": "req-0002",
      "text": "The supplier must hold employer's liability insurance of at least £5,000,000.",
      "source_page": 22,
      "source_clause": "Section 6.1",
      "source_excerpt": "The supplier must hold employer's liability insurance of at least £5,000,000.",
      "type": "mandatory",
      "is_gating": true,
      "category": "insurance",
      "confidence": 0.91,
      "status": "pending",
      "needs_review": false,
      "decision": null,
      "criteria_ref": null,
      "depends_on": [],
      "draft_answer": null
    },
    {
      "id": "req-0003",
      "text": "The supplier should provide a dedicated account manager for the contract term.",
      "source_page": 48,
      "source_clause": "Section 9.3",
      "source_excerpt": "The supplier should provide a dedicated account manager for the duration of the contract term.",
      "type": "optional",
      "is_gating": false,
      "category": "technical",
      "confidence": 0.79,
      "status": "pending",
      "needs_review": false,
      "decision": null,
      "criteria_ref": null,
      "depends_on": [],
      "draft_answer": null
    },
    {
      "id": "req-0004",
      "text": "The supplier must demonstrate an annual turnover of at least £2,000,000.",
      "source_page": 61,
      "source_clause": "Section 11.4",
      "source_excerpt": "minimum annual turnover of £2,000,000 over each of the last two financial years",
      "type": "mandatory",
      "is_gating": true,
      "category": "financial",
      "confidence": 0.62,
      "status": "pending",
      "needs_review": true,
      "decision": null,
      "criteria_ref": null,
      "depends_on": [],
      "draft_answer": null
    },
    {
      "id": "req-0005",
      "text": "The supplier shall provide three case studies of comparable public-sector contracts.",
      "source_page": 74,
      "source_clause": "Section 13.2",
      "source_excerpt": "Bidders shall provide three case studies of comparable public-sector contracts delivered in the last five years.",
      "type": "mandatory",
      "is_gating": false,
      "category": "experience",
      "confidence": 0.85,
      "status": "pending",
      "needs_review": false,
      "decision": null,
      "criteria_ref": null,
      "depends_on": [],
      "draft_answer": null
    }
  ]
}
```

**`engine/requirements.txt`:**
```
pytest==9.0.2
```

**`engine/README.md`** — short, mirroring `backend/README.md`, with a Run section (bash + Windows), the
"always run from repo root" note, the `python` (not `python3`/`py`) caveat, and the **cross-lane omit note** from §3.
Document:
```
python -m pytest engine/tests/ -v
python -m engine.reconcile engine/tests/fixtures/mock_raw_extraction.json --out out.json --report report.json
```

**Done-criteria for 0a:** files exist and both fixtures parse:
```
python -c "import json; json.load(open('engine/tests/fixtures/mock_raw_extraction.json',encoding='utf-8')); json.load(open('engine/tests/fixtures/golden_final.json',encoding='utf-8')); print('fixtures OK')"
```
→ prints `fixtures OK`.

### 0b. Package-import smoke test

**Test first — `engine/tests/test_io.py` (start with just the import):**
```python
def test_engine_package_imports():
    import engine  # noqa: F401
```
**Run / watch fail:** `python -m pytest engine/tests/test_io.py -v`
**Done-criteria:** 1 passed (confirms rootdir + discovery work from repo root).

---

## Phase 1 — UTF-8 I/O helper (`engine/_io.py`)

The single highest-likelihood failure on this box is forgetting `encoding='utf-8'`. Centralize it. The fixtures
contain `£` (cp1252 round-trip hazard) — that's the regression guard.

**(a) Tests first — add to `engine/tests/test_io.py`:**
```python
import json
from pathlib import Path

from engine._io import read_json, write_json


def test_read_json_handles_pound_sign(raw_envelope):
    texts = [r["source_excerpt"] for r in raw_envelope["raw_requirements"]]
    assert any("£5,000,000" in t for t in texts)


def test_write_then_read_roundtrip_non_ascii(tmp_path: Path):
    payload = {"k": "insurance of at least £5,000,000 — ✓"}
    p = tmp_path / "out.json"
    write_json(p, payload)
    assert "£" in p.read_text(encoding="utf-8")
    assert read_json(p) == payload
```

**(b) Run / watch fail:** `python -m pytest engine/tests/test_io.py -v` → `ModuleNotFoundError: No module named 'engine._io'`.

**(c) Implement `engine/_io.py`:**
```python
"""UTF-8-safe JSON I/O. This box defaults to cp1252 (J-008 crash); never rely on it."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def read_json(path: str | Path) -> Any:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str | Path, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
```

**(d) Verify:** `python -m pytest engine/tests/test_io.py -v` → **3 passed**.
**Done-criteria:** all `test_io.py` pass; `£` round-trips as UTF-8 bytes.

---

## Phase 2 — The similarity seam (`engine/similarity.py`)

Swappable, deterministic, stdlib-only. **Char-ratio alone is not enough** — verified: insurance vs turnover scores
0.6443 on char-ratio (shared tender boilerplate), which a 0.60-only gate would over-merge. We add a **content-token
Jaccard floor** that drops that pair to 0.1111 while the ISO pair stays at 0.2727. The public seam exposes two
functions; the merge gate (Phase 3) ANDs them.

**Locked constants (single source of truth, live in `similarity.py`, imported elsewhere):**
```python
TEXT_SIM_THRESHOLD = 0.66    # char-ratio gate. ISO pair = 0.7529 clears; ins/turn = 0.6443 fails alone but...
TOKEN_SIM_FLOOR    = 0.20    # ...content-Jaccard gate. ISO pair = 0.2727 clears; ins/turn = 0.1111 BLOCKS.
```

**(a) Tests first — `engine/tests/test_similarity.py`:**
```python
from engine.similarity import (
    similarity, token_similarity, TEXT_SIM_THRESHOLD, TOKEN_SIM_FLOOR,
)


def test_identical_text_is_1():
    assert similarity("ISO 9001 certification", "ISO 9001 certification") == 1.0


def test_iso_pair_clears_both_gates(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    a, b = reqs["raw-c003-0001"]["text"], reqs["raw-c004-0001"]["text"]
    assert similarity(a, b) >= TEXT_SIM_THRESHOLD          # 0.7529 >= 0.66
    assert token_similarity(a, b) >= TOKEN_SIM_FLOOR       # 0.2727 >= 0.20


def test_insurance_vs_turnover_blocked_by_token_floor(raw_envelope):
    # CRITICAL conservatism guard: two DIFFERENT mandatory/gating disqualifiers.
    # char-ratio (0.6443) sneaks above the text gate; the token floor MUST block them.
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    a, b = reqs["raw-c008-0002"]["text"], reqs["raw-c027-0001"]["text"]
    assert token_similarity(a, b) < TOKEN_SIM_FLOOR        # 0.1111 < 0.20 => NOT mergeable


def test_insurance_vs_casestudies_low(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    a, b = reqs["raw-c008-0002"]["text"], reqs["raw-c033-0003"]["text"]
    assert similarity(a, b) < TEXT_SIM_THRESHOLD


def test_normalisation_is_case_and_whitespace_insensitive():
    assert similarity("ISO  9001", "iso 9001") >= 0.95


def test_is_deterministic():
    a = similarity("the supplier shall hold ISO 9001", "supplier must hold ISO 9001 cert")
    b = similarity("the supplier shall hold ISO 9001", "supplier must hold ISO 9001 cert")
    assert a == b
```

**(b) Run / watch fail:** `python -m pytest engine/tests/test_similarity.py -v` → `ModuleNotFoundError: No module named 'engine.similarity'`.

> **No goalpost-moving.** The thresholds 0.66 / 0.20 are *verified* against live difflib (ISO 0.7529/0.2727 clears;
> ins/turn 0.6443/0.1111 is blocked by the token floor). Do **not** adjust thresholds to fit the implementation — the
> measured values already separate the classes. Tests import the constants symbolically; there is one source of truth.

**(c) Implement `engine/similarity.py`:**
```python
"""Swappable similarity seam. difflib char-ratio + content-token Jaccard. No embeddings.

Deterministic, auditable, stdlib-only. The merge gate (reconcile.py) ANDs:
  similarity(a,b) >= TEXT_SIM_THRESHOLD  AND  token_similarity(a,b) >= TOKEN_SIM_FLOOR.

Char-ratio alone over-scores shared tender boilerplate (verified: two different mandatory
requirements scored 0.6443). The token-Jaccard floor blocks that false merge (their Jaccard
is 0.1111) while keeping the true ISO duplicate (Jaccard 0.2727). To swap algorithms later,
replace ONLY these function bodies; callers depend on the signatures.
"""
from __future__ import annotations

import re
from difflib import SequenceMatcher

TEXT_SIM_THRESHOLD = 0.66
TOKEN_SIM_FLOOR = 0.20

_WS = re.compile(r"\s+")
_NONWORD = re.compile(r"[^a-z0-9 ]")

# Boilerplate / structural words that carry no requirement-distinguishing meaning.
_STOPWORDS = frozenset({
    "the", "a", "an", "of", "at", "to", "for", "and", "or", "must", "shall",
    "should", "will", "be", "is", "are", "with", "in", "on", "this", "that",
    "supplier", "suppliers", "bidders", "bidder", "least", "provide", "hold",
    "each", "its", "their",
})


def _normalise(text: str) -> str:
    return _WS.sub(" ", text.strip().lower())


def _content_tokens(text: str) -> set[str]:
    cleaned = _WS.sub(" ", _NONWORD.sub(" ", text.lower())).strip()
    return {w for w in cleaned.split() if w and w not in _STOPWORDS}


def similarity(a: str, b: str) -> float:
    """Deterministic char-level fuzzy ratio in [0,1] over normalised text."""
    return SequenceMatcher(None, _normalise(a), _normalise(b)).ratio()


def token_similarity(a: str, b: str) -> float:
    """Jaccard over content tokens (stopwords/boilerplate removed), in [0,1].

    Blocks boilerplate-heavy false merges that char-ratio alone lets through.
    """
    ta, tb = _content_tokens(a), _content_tokens(b)
    if not ta and not tb:
        return 1.0
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)
```

**(d) Verify:** `python -m pytest engine/tests/test_similarity.py -v` → **6 passed**.
**Done-criteria:** ISO pair clears both gates; insurance-vs-turnover is blocked by the token floor; deterministic.

---

## Phase 3 — Conservative grouping (`group_candidates`)

The heart of the prime directive: pairwise, conservative AND-of-signals, explicitly non-transitive.

**Locked constants (in `reconcile.py`):**
```python
from engine.similarity import (
    similarity, token_similarity, TEXT_SIM_THRESHOLD, TOKEN_SIM_FLOOR,
)
NEEDS_REVIEW_THRESHOLD = 0.75    # needs_review = merged confidence < this (strict)
```

### Merge predicate — conservative AND of FOUR limbs

Two raw candidates `a, b` are **mergeable** iff **ALL** hold:
1. `similarity(a.text, b.text) >= TEXT_SIM_THRESHOLD` (0.66), **AND**
2. `token_similarity(a.text, b.text) >= TOKEN_SIM_FLOOR` (0.20), **AND**
3. `a.source_page == b.source_page` (both present), **AND**
4. `a.source_clause == b.source_clause` (both **non-null** and equal).

**Source-proximity = same page AND same non-null clause. We do NOT use char-offset overlap.**
Rationale (verified): raw `char_start/char_end` are **chunk-local** — the seeded ISO duplicate is c003 `[1840,1978]`
and c004 `[120,201]`, which do **not** overlap and live in different chunks' coordinate spaces. Comparing them across
chunks is incoherent and risks false-positive overlaps. The one true duplicate merges via page+clause alone; char
offsets are used **only** for document-order tie-breaking within the canonical member (Phase 6), never as a cross-item
proximity signal. If any limb's signal is missing/null, that limb is **false** — err toward NOT merging.

### Grouping algorithm — pairwise, NON-transitive (all-pairs mutual mergeability)

`group_candidates(raws: list[dict]) -> list[list[dict]]` returns groups in input order:
1. Start every candidate in its own singleton group.
2. Walk candidates pairwise. Maintain group membership.
3. **Before adding candidate X to an existing group G, require X is mergeable with EVERY current member of G**
   (all-pairs check), not just one. This is the **anti-transitivity guard**: if `A~B` and `B~C` but `A` is *not*
   mergeable with `C`, the chain is refused — we never form `{A,B,C}`; keep the smaller safe groups / singletons.
4. Group order = order of each group's first-appearing member in the input.

> Why all-pairs not transitive closure: transitive chaining is exactly how two genuinely-different requirements get
> silently fused. All-pairs mutual mergeability keeps merges tight. This guard is verified by a **real** chain fixture
> below (a~b and b~c both clear the gate; a~c does not).

**(a) Tests first — `engine/tests/test_grouping.py`:**
```python
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
    ins = {"raw_id": "i1", "text": "The supplier must hold employer's liability insurance of at least £5,000,000.",
           "source_page": 61, "source_clause": "Section 11.4"}
    turn = {"raw_id": "t1", "text": "The supplier must demonstrate an annual turnover of at least £2,000,000.",
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
```

> The implementer MUST re-confirm `test_positive_control_full_chain_merges` actually produces one group when they
> implement — if the three near-identical strings don't all clear both gates mutually, nudge the suffixes (they differ
> by one trailing word, so char-ratio and Jaccard stay near-identical and clear easily). The chain refusal test
> values are verified: a~b char 0.8655 / jacc 0.6667, b~c char 0.7191 / jacc 0.5455, a~c char 0.6164 (< 0.66) → refused.

**(b) Run / watch fail:** `python -m pytest engine/tests/test_grouping.py -v` → `ImportError: cannot import name 'group_candidates'`.

**(c) Implement** in `engine/reconcile.py`:
- `_source_proximal(a, b) -> bool`: `a.get("source_page") == b.get("source_page")` **and** both `source_clause` non-null and equal.
- `_mergeable(a, b) -> bool`: `similarity >= TEXT_SIM_THRESHOLD and token_similarity >= TOKEN_SIM_FLOOR and _source_proximal(a, b)`.
- `group_candidates(raws)`: all-pairs mutual mergeability, input order preserved. Use `.get()` everywhere — `source_clause` may be `None`; `char_start`/`char_end` may be absent.

**(d) Verify:** `python -m pytest engine/tests/test_grouping.py -v` → **9 passed**.
**Done-criteria:** 6 raw → 5 groups; the only size-2 group is `{raw-c003-0001, raw-c004-0001}`; same-text/different-page,
same-page/different-clause, null-clause, and same-page different-requirement (token floor) all stay split; the real
A~B~C chain is refused; the positive-control chain fully merges.

---

## Phase 4 — Merge a group → canonical + noisy-OR + safety escalation (`merge_group`)

`merge_group(group: list[dict]) -> dict` collapses one group into a single **interim merged dict** (still carrying
`_char_start` for ordering and `_member_raw_ids` for the report; `to_final` strips them in Phase 5).
**Raise `ValueError` on an empty group** (defensive — never silently emit confidence 0.0).

### Canonical-member selection (deterministic, this priority order)
1. **highest `confidence`**, ties → 2. **longest `source_excerpt`**, ties → 3. **lowest `char_start`**.

For the ISO group this picks **`raw-c003-0001`** (conf 0.94 > 0.88). Canonical contributes: `text`, `source_page`,
`source_excerpt`, `category`, and `char_start` (→ `_char_start`). `source_clause` = canonical's if non-null, else the
first non-null clause across the group, else `None`.

### Field merge rules
- `confidence`:
  - **Singleton short-circuit (explicit, no arithmetic):** `if len(group) == 1: confidence = group[0]["confidence"]` — verbatim passthrough, **no `round`** (avoids float drift that would break the byte-deep golden diff).
  - **Multi-member:** `round(1 - prod(1 - c_i), 4)`. ISO: `1-(1-0.94)*(1-0.88) = 0.9928`.
  - Clamp each input `c_i` into `[0.0, 1.0]` before the product (defensive against a stray out-of-range raw confidence).
- `type` = safety escalation: `"mandatory"` if ANY member is `"mandatory"`, else `"optional"`.
- `is_gating` = safety escalation: `any(m["is_gating"] for m in group)`.
- `text`, `source_page`, `source_excerpt`, `category` = canonical member (excerpt taken **wholesale**, never spliced).
- `source_clause` = canonical's if non-null, else first non-null across group, else `None`.
- `criteria_ref` = first non-null across group, else `None`.
- `depends_on` = order-preserving union of present `depends_on` lists, else `[]`. **(Phase 5 guards against any `raw-*` id leaking through.)**
- `_char_start` = canonical's `char_start` (**set on singletons too** — `assign_ids` depends on it).
- `_member_raw_ids` = `[m["raw_id"] for m in group]` (for ordering + the report; set on singletons too).

**(a) Tests first — `engine/tests/test_merge.py`:**
```python
import pytest

from engine.reconcile import merge_group


def _iso_group(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    return [reqs["raw-c003-0001"], reqs["raw-c004-0001"]]


def test_noisy_or_confidence_exact(raw_envelope):
    assert merge_group(_iso_group(raw_envelope))["confidence"] == 0.9928


def test_corroboration_raises_above_either_member(raw_envelope):
    c = merge_group(_iso_group(raw_envelope))["confidence"]
    assert c > 0.94 and c > 0.88


def test_canonical_is_c003(raw_envelope):
    m = merge_group(_iso_group(raw_envelope))
    assert m["source_page"] == 14
    assert m["source_clause"] == "Section 4.2.1"
    assert m["source_excerpt"] == (
        "Bidders shall hold a valid ISO 9001 certification at the point of submission. "
        "Failure to evidence this will result in the bid being rejected."
    )
    assert m["text"] == (
        "The supplier shall hold a valid ISO 9001 certification at the time of tender submission."
    )


def test_excerpt_is_a_verbatim_member_excerpt_not_spliced(raw_envelope):
    grp = _iso_group(raw_envelope)
    m = merge_group(grp)
    assert m["source_excerpt"] in {g["source_excerpt"] for g in grp}  # never stitched


def test_safety_escalation_mandatory_and_gating(raw_envelope):
    m = merge_group(_iso_group(raw_envelope))
    assert m["type"] == "mandatory" and m["is_gating"] is True


def test_safety_escalation_never_downgrades_mixed_members():
    a = {"raw_id": "a", "text": "x", "source_page": 1, "source_clause": "S",
         "source_excerpt": "x", "char_start": 0,
         "type": "mandatory", "is_gating": True, "category": "legal", "confidence": 0.80}
    b = {"raw_id": "b", "text": "x", "source_page": 1, "source_clause": "S",
         "source_excerpt": "x longer", "char_start": 0,
         "type": "optional", "is_gating": False, "category": "legal", "confidence": 0.70}
    m = merge_group([a, b])
    assert m["type"] == "mandatory" and m["is_gating"] is True


def test_singleton_passes_confidence_through_verbatim(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    m = merge_group([reqs["raw-c027-0001"]])
    assert m["confidence"] == 0.62                 # verbatim, no arithmetic/round
    assert m["type"] == "mandatory" and m["is_gating"] is True


def test_singleton_sets_interim_ordering_fields(raw_envelope):
    # assign_ids (Phase 6) depends on these being present on singletons.
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    m = merge_group([reqs["raw-c027-0001"]])
    assert m["_char_start"] == 88
    assert m["_member_raw_ids"] == ["raw-c027-0001"]


def test_empty_group_raises():
    with pytest.raises(ValueError):
        merge_group([])


def test_canonical_tiebreak_excerpt_length_then_char_start():
    # Equal confidence -> longer excerpt wins; equal length -> lower char_start wins.
    a = {"raw_id": "a", "text": "ta", "source_page": 1, "source_clause": "S",
         "source_excerpt": "short", "char_start": 50,
         "type": "optional", "is_gating": False, "category": "x", "confidence": 0.80}
    b = {"raw_id": "b", "text": "tb", "source_page": 1, "source_clause": "S",
         "source_excerpt": "a much longer excerpt span", "char_start": 90,
         "type": "optional", "is_gating": False, "category": "x", "confidence": 0.80}
    assert merge_group([a, b])["text"] == "tb"      # longer excerpt => canonical b
    c = {"raw_id": "c", "text": "tc", "source_page": 1, "source_clause": "S",
         "source_excerpt": "same length here!!", "char_start": 10,
         "type": "optional", "is_gating": False, "category": "x", "confidence": 0.80}
    d = {"raw_id": "d", "text": "td", "source_page": 1, "source_clause": "S",
         "source_excerpt": "same length here!!", "char_start": 99,
         "type": "optional", "is_gating": False, "category": "x", "confidence": 0.80}
    assert merge_group([c, d])["text"] == "tc"      # equal len => lower char_start => c
```

**(b) Run / watch fail:** `python -m pytest engine/tests/test_merge.py -v` → `ImportError: cannot import name 'merge_group'`.

**(c) Implement** `merge_group`, `_canonical(group)`, `_noisy_or(confidences)` per the rules above. `_canonical` sorts
by `(-confidence, -len(source_excerpt), char_start)`. `_noisy_or` clamps inputs to `[0,1]`.

**(d) Verify:** `python -m pytest engine/tests/test_merge.py -v` → **11 passed**.
**Done-criteria:** ISO confidence exactly `0.9928` and > both members; canonical = c003; excerpt is a verbatim member
excerpt (never spliced); mandatory+gating escalation holds on mixed members; singleton confidence verbatim & interim
ordering fields set; empty group raises; tiebreak ladder works.

---

## Phase 5 — `to_final`: emit the locked 15-field schema

`to_final(merged: dict, req_id: str) -> dict` maps one interim merged dict to a final requirement object — building a
**fresh dict** with exactly `FINAL_KEYS` (never copy-and-delete the interim dict; build clean to guarantee no leak).

### Rules
- `id = req_id`.
- Carry: `text, source_page, source_clause, source_excerpt, type, is_gating, category, confidence`.
- `status = "pending"` (always).
- `needs_review = confidence < NEEDS_REVIEW_THRESHOLD` (**strict** `<`; computed on **merged** confidence).
- `decision = None`; `criteria_ref = merged.get("criteria_ref")`; `depends_on = merged.get("depends_on", [])`.
- `draft_answer = None`.
- **Guard:** assert no entry in `depends_on` matches `^raw-` (raw_ids must never leak through edges). If any does,
  **raise** — do not silently emit. (Raw v1 has empty `depends_on`, so this never fires now; the guard protects the
  Day-3 graph step.)
- **Do NOT emit:** `raw_id, chunk_id, char_start, char_end, extractor_notes, _char_start, _member_raw_ids, answer, open_questions, capability_docs`.

**(a) Tests first — `engine/tests/test_to_final.py`:**
```python
import pytest

from engine.reconcile import merge_group, to_final

FINAL_KEYS = {
    "id", "text", "source_page", "source_clause", "source_excerpt", "type",
    "is_gating", "category", "confidence", "status", "needs_review", "decision",
    "criteria_ref", "depends_on", "draft_answer",
}
FORBIDDEN = {"raw_id", "chunk_id", "char_start", "char_end", "extractor_notes",
             "_char_start", "_member_raw_ids", "answer", "open_questions", "capability_docs"}


def _final_for(raw_envelope, raw_id, req_id="req-0001"):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    return to_final(merge_group([reqs[raw_id]]), req_id)


def test_final_has_exactly_15_locked_keys(raw_envelope):
    f = _final_for(raw_envelope, "raw-c008-0002")
    assert set(f.keys()) == FINAL_KEYS
    assert len(FINAL_KEYS) == 15


def test_no_forbidden_fields_leak(raw_envelope):
    f = _final_for(raw_envelope, "raw-c008-0002")
    assert FORBIDDEN.isdisjoint(f.keys())


def test_defaults_are_correct(raw_envelope):
    f = _final_for(raw_envelope, "raw-c008-0002")
    assert f["status"] == "pending"
    assert f["decision"] is None
    assert f["criteria_ref"] is None
    assert f["depends_on"] == []
    assert f["draft_answer"] is None


def test_tolerates_raw_item_missing_optional_keys():
    # raw v1 may omit criteria_ref/depends_on entirely -> default null/[] without KeyError.
    raw = {"raw_id": "m1", "text": "t", "source_page": 3, "source_clause": "S",
           "source_excerpt": "t", "char_start": 0,
           "type": "optional", "is_gating": False, "category": "x", "confidence": 0.90}
    f = to_final(merge_group([raw]), "req-0001")
    assert f["criteria_ref"] is None and f["depends_on"] == []


def test_needs_review_boundary_strict_less_than():
    # Pins comparator direction: 0.74 -> True, 0.75 -> False, 0.76 -> False.
    def nr(conf):
        raw = {"raw_id": "b", "text": "t", "source_page": 1, "source_clause": "S",
               "source_excerpt": "t", "char_start": 0, "type": "optional",
               "is_gating": False, "category": "x", "confidence": conf}
        return to_final(merge_group([raw]), "req-0001")["needs_review"]
    assert nr(0.74) is True
    assert nr(0.75) is False
    assert nr(0.76) is False


def test_merged_iso_clears_needs_review(raw_envelope):
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    m = merge_group([reqs["raw-c003-0001"], reqs["raw-c004-0001"]])
    f = to_final(m, "req-0001")
    assert f["confidence"] == 0.9928 and f["needs_review"] is False


def test_draft_answer_is_null_in_reconcile_step(raw_envelope):
    # Lockstep invariant for v1 UI: reconcile emits no answer, so draft_answer must be null.
    f = _final_for(raw_envelope, "raw-c008-0002")
    assert f["draft_answer"] is None


def test_raw_id_in_depends_on_is_rejected():
    raw = {"raw_id": "d1", "text": "t", "source_page": 1, "source_clause": "S",
           "source_excerpt": "t", "char_start": 0, "type": "optional", "is_gating": False,
           "category": "x", "confidence": 0.9, "depends_on": ["raw-c003-0001"]}
    with pytest.raises(ValueError):
        to_final(merge_group([raw]), "req-0001")
```

**(b) Run / watch fail:** `python -m pytest engine/tests/test_to_final.py -v` → `ImportError: cannot import name 'to_final'`.

**(c) Implement** `to_final` (build fresh dict with exactly `FINAL_KEYS`; the `^raw-` `depends_on` guard).

**(d) Verify:** `python -m pytest engine/tests/test_to_final.py -v` → **8 passed**.
**Done-criteria:** exactly the 15 locked keys; zero forbidden fields; defaults correct; tolerates missing optional raw
keys; `needs_review` strictly `< 0.75` (0.75 → false); merged ISO clears the flag; `draft_answer` null; `raw-*` in
`depends_on` rejected.

---

## Phase 6 — `assign_ids`: document-order ID assignment

`assign_ids(merged_groups: list[dict]) -> list[tuple[str, dict]]` sorts interim merged dicts into **document order** and
assigns sequential `req-NNNN`.

### Rule
Stable-sort by `(source_page asc, _char_start asc)`, then assign `req-0001, req-0002, …` (zero-padded width 4). The
merged ISO item uses its **canonical c003** position (`page 14, char 1840`) — NOT the absorbed c004 (`page 14, char 120`).
Resulting order: `p14/1840` → req-0001, `p22/540` → req-0002, `p48/2100` → req-0003, `p61/88` → req-0004, `p74/310` → req-0005.

**(a) Tests first — `engine/tests/test_assign_ids.py`:**
```python
from engine.reconcile import assign_ids, group_candidates, merge_group


def _merged(raw_envelope):
    return [merge_group(g) for g in group_candidates(raw_envelope["raw_requirements"])]


def test_id_order_matches_golden(raw_envelope):
    pairs = assign_ids(_merged(raw_envelope))
    assert [pid for pid, _ in pairs] == [
        "req-0001", "req-0002", "req-0003", "req-0004", "req-0005",
    ]


def test_req0001_is_iso_merge_via_c003_position(raw_envelope):
    pairs = dict(assign_ids(_merged(raw_envelope)))
    iso = pairs["req-0001"]
    assert iso["source_page"] == 14
    assert iso["_char_start"] == 1840   # canonical c003, not absorbed c004 (120)
    assert iso["confidence"] == 0.9928


def test_req0004_is_the_turnover_item(raw_envelope):
    pairs = dict(assign_ids(_merged(raw_envelope)))
    assert pairs["req-0004"]["source_page"] == 61
    assert pairs["req-0004"]["confidence"] == 0.62
```

**(b) Run / watch fail:** `python -m pytest engine/tests/test_assign_ids.py -v` → `ImportError: cannot import name 'assign_ids'`.

**(c) Implement** `assign_ids` (stable sort on `(source_page, _char_start)`, enumerate from 1, `f"req-{n:04d}"`).

**(d) Verify:** `python -m pytest engine/tests/test_assign_ids.py -v` → **3 passed**.
**Done-criteria:** id order `req-0001..req-0005`; `req-0001` carries c003 char 1840 & conf 0.9928; `req-0004` is the
page-61 turnover item.

---

## Phase 7 — The reconcile report (separate, never in the requirement object)

The top-level orchestrator `reconcile` returns `(final_envelope, report)`. The report is the audit/eval artifact —
provenance lives ONLY here.

### Report shape
```json
{
  "tender_id": "tnd-001",
  "raw_count": 6,
  "final_count": 5,
  "merge_groups": [
    {
      "final_id": "req-0001",
      "member_raw_ids": ["raw-c003-0001", "raw-c004-0001"],
      "canonical_raw_id": "raw-c003-0001",
      "member_confidences": [0.94, 0.88],
      "merged_confidence": 0.9928,
      "type": "mandatory",
      "is_gating": true,
      "needs_review": false
    },
    { "final_id": "req-0002", "member_raw_ids": ["raw-c008-0002"], "canonical_raw_id": "raw-c008-0002",
      "member_confidences": [0.91], "merged_confidence": 0.91, "type": "mandatory",
      "is_gating": true, "needs_review": false }
  ]
}
```
Singletons appear too (a group of one). `member_confidences` order matches `member_raw_ids`. This is the **Day-2
eval-harness input**.

**(a) Tests first — `engine/tests/test_report.py`:**
```python
from engine.reconcile import reconcile


def test_report_records_the_single_merge(raw_envelope):
    _, report = reconcile(raw_envelope)
    assert report["raw_count"] == 6
    assert report["final_count"] == 5
    merged = [g for g in report["merge_groups"] if len(g["member_raw_ids"]) > 1]
    assert len(merged) == 1
    g = merged[0]
    assert g["final_id"] == "req-0001"
    assert set(g["member_raw_ids"]) == {"raw-c003-0001", "raw-c004-0001"}
    assert g["canonical_raw_id"] == "raw-c003-0001"
    assert g["member_confidences"] == [0.94, 0.88]      # provenance retained, ordered
    assert g["merged_confidence"] == 0.9928


def test_report_has_one_entry_per_final_requirement(raw_envelope):
    _, report = reconcile(raw_envelope)
    assert len(report["merge_groups"]) == 5
    assert [g["final_id"] for g in report["merge_groups"]] == [
        "req-0001", "req-0002", "req-0003", "req-0004", "req-0005",
    ]


def test_singleton_report_entry_has_single_confidence(raw_envelope):
    _, report = reconcile(raw_envelope)
    turnover = next(g for g in report["merge_groups"] if g["final_id"] == "req-0004")
    assert turnover["member_raw_ids"] == ["raw-c027-0001"]
    assert turnover["member_confidences"] == [0.62]
```

**(b) Run / watch fail:** `python -m pytest engine/tests/test_report.py -v` → `ImportError: cannot import name 'reconcile'`.

**(c) Implement** the orchestrator in `engine/reconcile.py`:
```python
def reconcile(raw_envelope: dict) -> tuple[dict, dict]:
    """Raw envelope -> (final envelope, reconcile report). Pure; no I/O."""
```
Pipeline: `group_candidates` → `merge_group` per group → `assign_ids` → `to_final` per `(id, merged)` → assemble the
final envelope **`{tender_id, title, requirements}`** (rename `raw_requirements` → `requirements`; **DROP**
`source_filename`/`page_count`/`chunk_count`/`extraction_meta`; do **not** add `capability_docs`) → `build_report`.
`tender_id`/`title` pass through from the raw envelope. Return both.

**(d) Verify:** `python -m pytest engine/tests/test_report.py -v` → **3 passed**.
**Done-criteria:** report has 5 entries in id order; exactly one multi-member group (`req-0001`, members `{c003,c004}`,
canonical c003, `member_confidences [0.94,0.88]`, merged 0.9928); singleton report entries carry a length-1
`member_confidences`.

---

## Phase 8 — CLI entrypoint (`main`) with UTF-8 stdout guard

Mirror `backend/scripts/parse_check.py`: `def main(argv) -> int`,
`if __name__ == "__main__": raise SystemExit(main(sys.argv))`, UTF-8 stdout reconfigure at the top of `main()`.

### CLI contract
```
python -m engine.reconcile <raw.json> --out <final.json> --report <report.json>
```
- `--out` / `--report` optional; default to `<raw_stem>.final.json` / `<raw_stem>.report.json` beside the input.
- Reads via `engine._io.read_json`; writes via `engine._io.write_json` (UTF-8, `ensure_ascii=False`).
- Prints one plain-ASCII summary line: `reconciled 6 raw -> 5 final (1 merge group); needs_review: 1`.
- Returns `0` on success; `2` on bad args / missing file.

Top of `main()`:
```python
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass
```

**(a) Tests first — `engine/tests/test_end_to_end.py` (CLI part):**
```python
import subprocess
import sys
from pathlib import Path

from engine._io import read_json

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW = "engine/tests/fixtures/mock_raw_extraction.json"


def test_cli_writes_final_and_report(tmp_path: Path):
    out = tmp_path / "final.json"
    report = tmp_path / "report.json"
    proc = subprocess.run(
        [sys.executable, "-m", "engine.reconcile", RAW,
         "--out", str(out), "--report", str(report)],
        cwd=REPO_ROOT, capture_output=True, text=True, encoding="utf-8",
    )
    assert proc.returncode == 0, proc.stderr
    final = read_json(out)
    assert len(final["requirements"]) == 5
    assert read_json(report)["final_count"] == 5
    assert "5 final" in proc.stdout
```

**(b) Run / watch fail:** `python -m pytest engine/tests/test_end_to_end.py -v -k cli` → non-zero return (module/argparse not wired).

**(c) Implement** `main(argv)` using `argparse`, the stdout guard, `reconcile()`, and `write_json` for both outputs;
add the `__main__` guard at module bottom. Count the merge groups (`len(member_raw_ids) > 1`) and the `needs_review`
trues for the summary line.

**(d) Verify (manual run):**
```
python -m engine.reconcile engine/tests/fixtures/mock_raw_extraction.json --out scratch_final.json --report scratch_report.json
```
Expected stdout: `reconciled 6 raw -> 5 final (1 merge group); needs_review: 1`
Then: `python -m pytest engine/tests/test_end_to_end.py -v -k cli` → **1 passed**.
**Done-criteria:** CLI runs from repo root, exit 0, writes both files as UTF-8, prints the summary; no cp1252 crash.

---

## Phase 9 — End-to-end golden diff + determinism (acceptance gate)

The win condition: **6 → 5**, deep value-equal to `golden_final.json`, deterministic across runs.

> **Honest claim:** the test compares **parsed-dict deep equality** (`final == golden_final`), not raw bytes.
> That is the right choice (it ignores key order / formatting). We do NOT claim "byte-for-byte"; we claim **deep value
> equality** of the envelope. Serialization formatting (indent, trailing newline) is pinned only by `write_json`, not
> asserted.

**(a) Tests first — append to `engine/tests/test_end_to_end.py`:**
```python
from engine.reconcile import reconcile


def test_reconcile_matches_golden_exactly(raw_envelope, golden_final):
    final, _ = reconcile(raw_envelope)
    assert final == golden_final            # deep value equality on the whole envelope


def test_is_deterministic_across_runs(raw_envelope):
    a, ra = reconcile(raw_envelope)
    b, rb = reconcile(raw_envelope)
    assert a == b and ra == rb              # stable ids + stable canonical selection


def test_counts_flags_and_disqualifier_survival(raw_envelope):
    final, _ = reconcile(raw_envelope)
    reqs = final["requirements"]
    assert len(reqs) == 5
    assert [r["id"] for r in reqs] == [
        "req-0001", "req-0002", "req-0003", "req-0004", "req-0005",
    ]
    # exactly one needs_review, and it is the turnover item
    assert [r["id"] for r in reqs if r["needs_review"]] == ["req-0004"]
    # NO disqualifier vanished: count gating survivors against the trace (4 of 5).
    assert sum(1 for r in reqs if r["is_gating"]) == 4
    assert sum(1 for r in reqs if r["type"] == "mandatory") == 4
    # ISO merge stayed mandatory + gating at corroborated confidence
    iso = reqs[0]
    assert iso["type"] == "mandatory" and iso["is_gating"] is True
    assert iso["confidence"] == 0.9928
    # envelope hygiene
    assert set(final.keys()) == {"tender_id", "title", "requirements"}
    assert "raw_requirements" not in final
    assert "capability_docs" not in final


def test_no_requirement_leaks_provenance(raw_envelope):
    final, _ = reconcile(raw_envelope)
    forbidden = {"raw_id", "chunk_id", "char_start", "char_end", "extractor_notes",
                 "_char_start", "_member_raw_ids", "answer", "open_questions"}
    for r in final["requirements"]:
        assert forbidden.isdisjoint(r.keys())


def test_canonical_excerpt_is_exact_raw_substring(raw_envelope):
    # Localizes a fixture typo: the merged excerpt must equal the c003 raw excerpt char-for-char.
    final, _ = reconcile(raw_envelope)
    reqs = {r["raw_id"]: r for r in raw_envelope["raw_requirements"]}
    assert final["requirements"][0]["source_excerpt"] == reqs["raw-c003-0001"]["source_excerpt"]
```

**(b) Run / watch fail:** `python -m pytest engine/tests/test_end_to_end.py -v` (fails only if a field drifts from golden).

**(c) Implement** — no new code expected. If `test_reconcile_matches_golden_exactly` fails, diff the produced envelope
against the golden file and fix the offending field. **Do NOT edit the golden file to match buggy output; fix the code.**

**(d) Final full-suite verification:**
```
python -m pytest engine/tests/ -v
```
Expected: all green across `test_io, test_similarity, test_grouping, test_merge, test_to_final, test_assign_ids,
test_report, test_end_to_end` (≈ 44 tests, 0 failed). Then a clean manual run:
```
python -m engine.reconcile engine/tests/fixtures/mock_raw_extraction.json --out scratch_final.json --report scratch_report.json
```
→ exit 0, prints `reconciled 6 raw -> 5 final (1 merge group); needs_review: 1`, and `scratch_final.json` deep-equals
`engine/tests/fixtures/golden_final.json`.

**Done-criteria (win condition):**
- `reconcile()` turns the 6-item raw envelope into exactly the 5-item golden envelope (deep value equality), deterministically.
- The ONLY merge is the ISO-9001 pair; the other four pass through as distinct rows.
- Merged ISO confidence is exactly `0.9928`, mandatory + gating preserved, `needs_review:false`.
- `req-0004` (turnover, 0.62) is the only `needs_review:true`; 4 of 5 stay gating, 4 of 5 mandatory (no disqualifier vanished).
- No requirement object leaks any raw/interim/deferred field; provenance lives only in the report.
- The token floor blocks the insurance-vs-turnover false merge; the real A~B~C chain is refused; the positive-control chain fully merges.
- Output envelope = `{tender_id, title, requirements}`, matching the live frontend `Tender` type.

---

## 10. Commit / demo-safety gate (per AGENTS.md)

`engine/` is a **new top-level folder in the Generalist lane** — additive, so it cannot break the frontend or backend
build, and `main` stays demo-able. Before committing/pushing:
1. `git pull --rebase` (per AGENTS.md daily loop).
2. `python -m pytest engine/tests/ -v` must be **all green** — this is the precondition to commit.
3. Commit small with a scannable message; `git pull --rebase`; `git push`.

This is everyday work in your own lane → straight to `main`, no PR. The one thing that **does** need a PR (not in this
plan's scope): adding `answer`/`open_questions`/`capability_docs` to `frontend/src/types/requirement.ts` — that is a
Frontend-lane schema change. Reconcile deliberately omits those fields until that coordinated PR lands.

---

## 11. Day-2 eval handoff (short note)

The **reconcile report** (`build_report` output / `--report` file) is the **input to the Day-2 eval harness** — the
auditable answer to a judge's *"how do you know you didn't merge two different things?"* It records, per final
requirement: which `raw_id`s merged, the canonical pick, ordered member confidences, the noisy-OR result, and the
safety flags. The next sub-project defines the **gold-set format** (hand-labelled expected merge groups + expected
mandatory/gating + expected `needs_review`) and an eval script that diffs the report against the gold set to produce
recall / precision / mandatory-accuracy — the headline number the demo quotes.

**Out of scope here:** the gold-set schema, the eval runner, and **real `needs_review` calibration** (the `0.75`
threshold stays the crude placeholder until then). Keep `engine/confidence.py` (the other Generalist lane) as the home
for calibrated routing when Day 3 lands — `reconcile.py` will import the threshold from there later without changing its
merge logic. Likewise the autofill fields (`answer`/`open_questions`/`capability_docs`) arrive via the Day-3 answer-draft
step behind the coordinated Frontend PR, keeping `draft_answer == answer.text` in lockstep at that point.

---

## Appendix — disposition of the four adversarial critiques

**Blockers accepted and fixed:**
- *Token floor* (Algorithm lens): difflib char-ratio scores tender boilerplate — insurance vs turnover = **0.6443** (verified), above a 0.60 char-only gate. **Fixed:** added `token_similarity` Jaccard floor (0.20); the pair drops to **0.1111** and is blocked. Gate is now char≥0.66 AND jaccard≥0.20 AND page AND clause. New adversarial test `test_different_requirements_same_page_clause_blocked_by_token_floor`.
- *Char-offset proximity is incoherent across chunks* (Algorithm lens): verified the ISO members' chunk-local offsets do not overlap and live in different coordinate spaces. **Fixed:** dropped char-overlap as a proximity signal entirely; proximity = same page AND same non-null clause. Char offsets retained only for canonical document-order tie-break.
- *Output diverges from the live frontend type* (Integration lens): verified `frontend/src/types/requirement.ts` has 15 fields, no `answer`/`open_questions`, and `Tender` has no `capability_docs`. **Fixed:** golden + output now emit exactly the 15-field requirement and `{tender_id, title, requirements}` envelope; `answer`/`open_questions`/`capability_docs` are omitted (AGENTS.md permits) with a cross-lane PR note.
- *Vacuous anti-transitivity test* (TDD + Demo + Algorithm lenses, all three): verified the original fixture's b~c = 0.325 — the guard was never exercised. **Fixed:** shipped a numerically-verified real chain (a~b 0.8655, b~c 0.7191, a~c 0.6164 < gate) that a naive transitive impl fails, plus a positive-control chain that fully merges.

**Majors accepted and fixed:** raw-id-in-`depends_on` leak guard + test; `draft_answer` null invariant test; singleton `_char_start`/`_member_raw_ids` pinned in Phase 4 (not three phases downstream); determinism test; empty-group raises; malformed/missing-optional-key tolerance test; `needs_review` boundary test at exactly 0.75; canonical-tiebreak ladder test; report retains ordered `member_confidences`; same-page/different-clause and null-clause negative tests; explicit singleton confidence verbatim passthrough (no float drift).

**Minors applied:** dropped the "byte-for-byte" overclaim (now "deep value equality"); single-source-of-truth thresholds imported symbolically; canonical-excerpt exact-substring assertion; explicit gating-survivor count assertion backing the conservatism story.

**Rejected (with reason):** "Cut the all-pairs guard as YAGNI" (Demo + Integration lenses) — **kept**, because the prime directive's *worst* failure is a silent over-merge, the guard is cheap, and it is now backed by a real test that a naive implementation fails. A guard that defends the headline safety claim is not gold-plating once it has a real test. The contradicting suggestion to *also* keep it but only with a real chain is exactly what we did. We did **not** relitigate any locked decision (difflib not embeddings, noisy-OR, safety escalation, crude 0.75, separate report, stdlib-only) — the `similarity()` seam stays the swap point, and the token floor lives *inside* that seam, so the locked "difflib + proximity behind a swappable seam" design is preserved, not violated.
