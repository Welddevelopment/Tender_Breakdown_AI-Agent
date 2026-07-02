"""extract.py — chunk → raw requirement objects.

Step 3+4 (extract + classify). PLUGGABLE by design:

  • HeuristicExtractor — rule-based (signal words like shall/must/PASS-FAIL). Runs with
    NO API key, so the whole pipeline works end-to-end today. Good enough to prove the
    plumbing + give frontend real-shaped data from a real tender. NOT the final quality bar.

  • OpenAIExtractor — calls OpenAI with the extraction prompt (prompts/extraction.md) and
    structured output (function calling). Activates when OPENAI_API_KEY is set. **This is
    our chosen provider** (hackathon OpenAI/Codex credits).

  • ClaudeExtractor — same, for Anthropic. Kept as an alternative (ANTHROPIC_API_KEY).

Provider selection: LLM_PROVIDER=openai|anthropic|heuristic to force one, else auto by
which key is present (OpenAI first). Output = raw requirement dicts in the shape of
prompts/raw-extraction-format.md (pre-reconcile; cross-chunk duplicates expected).

Scaffolded by J as backend cover. Backend owns tuning the LLM path (model, retries).
"""

from __future__ import annotations

import json
import os
import re
import time

from .chunk import Chunk

try:  # present at repo-root runtime; absent on a backend-rooted deploy (then logging is skipped)
    from engine.usage_log import log_usage as _log_usage
except ImportError:  # pragma: no cover
    def _log_usage(resp, model, label) -> None:
        return

MAX_RETRIES = 3
RETRY_BACKOFF = [1.0, 3.0, 8.0]
# temperature=0 + a fixed seed make extraction reproducible run-to-run (J-056: the same
# tender was scoring 0.84-1.0 recall across runs purely from sampling noise at the
# default temp=1.0). OpenAI's seed is best-effort determinism, not a guarantee, but
# combined with temp=0 it removes the bulk of the wobble.
EXTRACT_SEED = 42

# ---- classification signal words ---------------------------------------------
MANDATORY_SIGNALS = (
    "shall", "must", "is required", "are required", "mandatory", "is to ",
    "will be required", "required to", "a condition of",
)
OPTIONAL_SIGNALS = (
    "should", "may ", "desirable", "preferred", "ideally", "where appropriate",
    "encouraged to", "nice to have",
)
GATING_SIGNALS = (
    "pass/fail", "pass / fail", "disqualif", "will result in rejection",
    "will be rejected", "will be excluded", "shall be excluded", "minimum",
    "failure to", "not be evaluated", "mandatory requirement",
)
CATEGORY_KEYWORDS = {
    "certification": ("iso ", "certif", "accredit", "kitemark", "cyber essentials"),
    "insurance": ("insurance", "indemnity", "liability cover", "public liability"),
    "financial": ("turnover", "financial", "accounts", "credit", "solvency"),
    "security": ("security", "gdpr", "data protection", "safeguard", "dbs"),
    "experience": ("experience", "case study", "case studies", "track record", "reference"),
    "legal": ("comply with", "legislation", "regulation", "act 20", "law"),
    "delivery": ("delivery", "timescale", "deadline", "mobilisation", "service level", "sla"),
    "evidence": ("submit", "provide evidence", "documentation", "complete the", "return the"),
}

_SENT_SPLIT = re.compile(r"(?<=[.;:])\s+(?=[A-Z0-9])|\n")
_CLAUSE_RE = re.compile(r"\b(Section|Clause|Para(?:graph)?|Appendix)\s+[\w.]+", re.IGNORECASE)

# A PDF hard-wraps one sentence across several lines. This joins a newline back into a
# space ONLY when both sides are clearly mid-sentence (lowercase/comma before, lowercase/
# open-paren after), so a real requirement isn't fragmented into bogus half-sentence rows
# (J-069: mid-sentence fragments were the biggest source of invented "rules"). Clause /
# bullet / heading boundaries (a capitalised or numbered next line) are left intact.
_SOFT_WRAP = re.compile(r"(?<=[a-z,])[ \t]*\n[ \t]*(?=[a-z(])")

# Buyer-side / descriptive openers — the authority describing itself or the process, not an
# obligation ON the bidder. Rejected even if the sentence happens to contain a modal.
_BUYER_SIDE_OPENERS = (
    "the mac will", "the mac reserves", "the mac shall not", "the mac is",
    "the authority will", "the authority reserves", "the authority is", "the authority may",
    "the council will", "the council reserves", "the client will", "the client reserves",
    "the client shall not", "the successful bidder may be", "the successful tenderer will be",
    "we reserve", "for the avoidance", "for information", "please note", "note that",
    "this itt", "this tender document", "this section", "the following",
)
# Dangling trailing words = a cut-off fragment, not a whole obligation.
_FRAGMENT_TAIL = (
    "and", "or", "the", "a", "an", "to", "of", "for", "with", "in", "on", "at", "by",
    "which", "that", "who", "shall", "must", "should", "may", "will", "including",
    "such", "as", "is", "are", "be", "following", "any", "all",
)


def _classify_type(text: str) -> str:
    low = text.lower()
    if any(s in low for s in MANDATORY_SIGNALS):
        return "mandatory"
    if any(s in low for s in OPTIONAL_SIGNALS):
        return "optional"
    return "mandatory"  # default conservative — recall first


def _is_gating(text: str, req_type: str) -> bool:
    low = text.lower()
    return req_type == "mandatory" and any(s in low for s in GATING_SIGNALS)


def _category(text: str) -> str:
    low = text.lower()
    for cat, kws in CATEGORY_KEYWORDS.items():
        if any(k in low for k in kws):
            return cat
    return "other"


def _clause(text: str) -> str | None:
    m = _CLAUSE_RE.search(text)
    return m.group(0) if m else None


def _find_in_original(haystack: str, sentence: str) -> int:
    """Char offset of `sentence` in the original chunk text, tolerant of the newlines the
    reflow replaced with spaces. Tries an exact find first, then a whitespace-flexible
    regex on the first ~6 words. Returns -1 if not locatable."""
    exact = haystack.find(sentence[:40])
    if exact >= 0:
        return exact
    words = sentence.split()[:6]
    if not words:
        return -1
    pattern = r"\s+".join(re.escape(w) for w in words)
    m = re.search(pattern, haystack)
    return m.start() if m else -1


def _looks_like_requirement(sentence: str) -> bool:
    s = sentence.strip()
    low = s.lower()
    if len(s) < 25:
        return False
    # A leftover mid-sentence fragment: begins lowercase (a continuation) — after reflow
    # these are near-always noise, and a genuine obligation starts with a capital/subject.
    if s[:1].islower():
        return False
    # Buyer-side / descriptive prose — the authority talking about itself or the process.
    if any(low.startswith(op) for op in _BUYER_SIDE_OPENERS):
        return False
    # Cut-off fragment: ends on a dangling function word (no terminal punctuation either).
    last = low.rstrip(".;:").split()[-1] if low.rstrip(".;:").split() else ""
    if last in _FRAGMENT_TAIL:
        return False
    return (
        any(s in low for s in MANDATORY_SIGNALS)
        or any(s in low for s in OPTIONAL_SIGNALS)
        or any(s in low for s in GATING_SIGNALS)
    )


class HeuristicExtractor:
    """Rule-based extractor — no API key required."""

    name = "heuristic"

    def extract_chunk(self, chunk: Chunk) -> list[dict]:
        out: list[dict] = []
        seq = 0
        reflowed = _SOFT_WRAP.sub(" ", chunk.text)
        for raw_sentence in _SENT_SPLIT.split(reflowed):
            sentence = " ".join(raw_sentence.split())
            if not _looks_like_requirement(sentence):
                continue
            req_type = _classify_type(sentence)
            gating = _is_gating(sentence, req_type)
            # Heuristic confidence: gating/clear signals score higher; cap modest
            # because rule-based extraction is inherently uncertain.
            low = sentence.lower()
            conf = 0.55
            if any(s in low for s in MANDATORY_SIGNALS):
                conf += 0.1
            if gating:
                conf += 0.1
            conf = min(conf, 0.8)
            # Locate the sentence in the ORIGINAL (un-reflowed) chunk text for an accurate
            # page. Reflow collapsed soft-wrap newlines to spaces + shifted offsets, so
            # match the first few words whitespace-flexibly rather than an exact substring.
            start = _find_in_original(chunk.text, sentence)
            page = chunk.page_at(start) if start >= 0 else chunk.page_start
            out.append(
                {
                    "raw_id": f"raw-{chunk.id}-{seq:04d}",
                    "chunk_id": chunk.id,
                    "text": sentence,
                    "source_page": page,  # resolved to the exact page via chunk.page_map
                    "source_clause": _clause(sentence),
                    "source_excerpt": sentence,
                    "type": req_type,
                    "is_gating": gating,
                    "category": _category(sentence),
                    "confidence": round(conf, 2),
                    "char_start": start if start >= 0 else None,
                    "char_end": (start + len(raw_sentence.strip())) if start >= 0 else None,
                    "extractor_notes": "heuristic/rule-based — verify with LLM extractor",
                }
            )
            seq += 1
        return out


# ---- shared LLM bits (used by both providers) --------------------------------
_LLM_SYSTEM = (
    "You are a requirements-extraction engine for UK public-sector tenders. "
    "Extract every obligation/condition/criterion the bidder must satisfy from the "
    "CHUNK as structured data. Recall first: if a sentence might be a requirement, "
    "extract it with low confidence rather than dropping it. source_excerpt must be "
    "an EXACT substring of the chunk. Classify type (mandatory/optional) on binding "
    "language. is_gating DEFAULTS FALSE: set true ONLY for a genuine disqualifier - "
    "explicit pass/fail gates (a selection/PQQ question or criterion explicitly marked "
    "'(Pass/Fail)' IS a gate - flag it is_gating=true), 'failure to ... will result in "
    "rejection/exclusion/disqualification', or a hard eligibility/minimum threshold that must be met at "
    "submission (minimum turnover, a required certification/insurance, a submission "
    "deadline). Most mandatory requirements are NOT gating; when unsure, set "
    "is_gating=false. Do NOT extract background/scope description, definitions, the "
    "buyer's own statements, headings, or explanatory notes as requirements - that "
    "noise tanks precision. SUBJECT TEST: extract only obligations ON THE BIDDER (the "
    "Tenderer/Contractor/Supplier must/shall...). Do NOT extract sentences whose subject "
    "is the BUYER describing itself or the process (e.g. 'The Authority/MAC/Client will "
    "select/reserves the right/may instruct/is entitled') - that is context, not a bidder "
    "obligation. Every source_excerpt must be a complete sentence, never a mid-sentence "
    "fragment. One obligation = one object: split only genuinely separate "
    "obligations; never fragment one into overlapping pieces or emit it twice/at two "
    "granularities; each distinct obligation once per chunk. In TABLES, extract only "
    "rows that state an obligation or a minimum/threshold - skip header rows, column "
    "labels, units, and purely descriptive cells. Report honest "
    "0-1 confidence. (Full spec: prompts/extraction.md.)"
)

# JSON Schema for the structured output (one object with a `requirements` array).
_REQ_PARAMETERS = {
    "type": "object",
    "properties": {
        "requirements": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "source_excerpt": {"type": "string"},
                    "source_page": {"type": "integer"},
                    "source_clause": {"type": ["string", "null"]},
                    "type": {"type": "string", "enum": ["mandatory", "optional"]},
                    "is_gating": {"type": "boolean"},
                    "category": {"type": "string"},
                    "confidence": {"type": "number"},
                    "extractor_notes": {"type": ["string", "null"]},
                },
                "required": [
                    "text", "source_excerpt", "source_page",
                    "type", "is_gating", "category", "confidence",
                ],
            },
        }
    },
    "required": ["requirements"],
}


def _user_prompt(chunk: Chunk) -> str:
    return (
        f"CHUNK_ID: {chunk.id}\nPAGE_RANGE: pages {chunk.page_start}-{chunk.page_end}\n"
        f"--- BEGIN CHUNK TEXT ---\n{chunk.text}\n--- END CHUNK TEXT ---"
    )


def _to_raw(items: list[dict], chunk: Chunk, raw_id_prefix: str = "raw") -> list[dict]:
    """Wrap the model's requirement items into raw-extraction-format dicts.
    `raw_id_prefix` disambiguates multiple extraction passes over the same chunk
    (see extract_chunk_multi) so their raw_ids never collide."""
    out: list[dict] = []
    for seq, it in enumerate(items):
        excerpt = it.get("source_excerpt", "")
        if not isinstance(excerpt, str):
            # Models occasionally emit a non-str source_excerpt (e.g. an int); str.find(int)
            # raises and — via the retry wrapper — drops the ENTIRE chunk's requirements.
            excerpt = str(excerpt or "")
        start = chunk.text.find(excerpt) if excerpt else -1
        # If we can locate the excerpt, trust the page_map over the model's guess.
        page = chunk.page_at(start) if start >= 0 else it.get("source_page", chunk.page_start)
        out.append(
            {
                "raw_id": f"{raw_id_prefix}-{chunk.id}-{seq:04d}",
                "chunk_id": chunk.id,
                "text": it.get("text", ""),
                "source_page": page,
                "source_clause": it.get("source_clause"),
                "source_excerpt": excerpt,
                "type": it.get("type", "mandatory"),
                "is_gating": bool(it.get("is_gating", False)),
                "category": it.get("category", "other"),
                "confidence": float(it.get("confidence", 0.5)),
                "char_start": start if start >= 0 else None,
                "char_end": (start + len(excerpt)) if start >= 0 else None,
                "extractor_notes": it.get("extractor_notes"),
            }
        )
    return out


class OpenAIExtractor:
    """OpenAI extractor (our chosen provider) using function-calling structured output.

    Activates when OPENAI_API_KEY is set and `openai` is installed. Set LLM_MODEL to
    whatever your credits cover (default below). Backend owns tuning (model, retries).
    """

    name = "openai"

    def __init__(self) -> None:
        from openai import OpenAI
        self._client = OpenAI()
        self._model = os.environ.get("LLM_MODEL", "gpt-4o")

    def extract_chunk(self, chunk: Chunk, pass_no: int = 0) -> list[dict]:
        """`pass_no` selects the sampling for extract_chunk_multi's union passes:
        pass 0 is the deterministic baseline (temp=0, fixed seed); pass_no > 0 trades
        determinism for diversity (temp=0.7, a different seed per pass) so a second
        read can catch requirements the first missed. Single-pass callers never see this."""
        temperature = 0 if pass_no == 0 else 0.7
        seed = EXTRACT_SEED if pass_no == 0 else EXTRACT_SEED + pass_no
        raw_id_prefix = "raw" if pass_no == 0 else f"raw-p{pass_no}"
        for attempt in range(MAX_RETRIES):
            try:
                resp = self._client.chat.completions.create(
                    model=self._model,
                    temperature=temperature,
                    seed=seed,
                    messages=[
                        {"role": "system", "content": _LLM_SYSTEM},
                        {"role": "user", "content": _user_prompt(chunk)},
                    ],
                    tools=[{
                        "type": "function",
                        "function": {
                            "name": "emit_requirements",
                            "description": "Return every requirement found in the chunk.",
                            "parameters": _REQ_PARAMETERS,
                        },
                    }],
                    tool_choice={"type": "function", "function": {"name": "emit_requirements"}},
                )
                _log_usage(resp, self._model, f"extract chunk={chunk.id} pass={pass_no}")
                calls = resp.choices[0].message.tool_calls or []
                items: list[dict] = []
                if calls:
                    items = json.loads(calls[0].function.arguments).get("requirements", [])
                return _to_raw(items, chunk, raw_id_prefix=raw_id_prefix)
            except Exception as exc:
                if attempt < MAX_RETRIES - 1:
                    wait = RETRY_BACKOFF[attempt]
                    print(f"[extract] OpenAI retry {attempt + 1}/{MAX_RETRIES} after {wait}s ({exc})")
                    time.sleep(wait)
                else:
                    print(f"[extract] OpenAI failed after {MAX_RETRIES} attempts ({exc}); returning empty")
                    return []


class ClaudeExtractor:
    """Anthropic extractor (alternative provider). Activates on ANTHROPIC_API_KEY."""

    name = "claude"

    def __init__(self) -> None:
        import anthropic
        self._client = anthropic.Anthropic()
        self._model = os.environ.get("LLM_MODEL", "claude-opus-4-8")

    def extract_chunk(self, chunk: Chunk) -> list[dict]:
        for attempt in range(MAX_RETRIES):
            try:
                msg = self._client.messages.create(
                    model=self._model,
                    max_tokens=4096,
                    temperature=0,  # no seed param on the Anthropic API; temp=0 is the best we get
                    system=_LLM_SYSTEM,
                    tools=[{
                        "name": "emit_requirements",
                        "description": "Return every requirement found in the chunk.",
                        "input_schema": _REQ_PARAMETERS,
                    }],
                    tool_choice={"type": "tool", "name": "emit_requirements"},
                    messages=[{"role": "user", "content": _user_prompt(chunk)}],
                )
                items: list[dict] = []
                for block in msg.content:
                    if getattr(block, "type", None) == "tool_use":
                        items = block.input.get("requirements", [])
                        break
                return _to_raw(items, chunk)
            except Exception as exc:
                if attempt < MAX_RETRIES - 1:
                    wait = RETRY_BACKOFF[attempt]
                    print(f"[extract] Claude retry {attempt + 1}/{MAX_RETRIES} after {wait}s ({exc})")
                    time.sleep(wait)
                else:
                    print(f"[extract] Claude failed after {MAX_RETRIES} attempts ({exc}); returning empty")
                    return []


def get_extractor():
    """Pick the LLM extractor by LLM_PROVIDER, else auto by key (OpenAI first),
    else the heuristic fallback. Degrades gracefully if an SDK/key is misconfigured."""
    provider = os.environ.get("LLM_PROVIDER", "").lower()
    has_openai = bool(os.environ.get("OPENAI_API_KEY"))
    has_anthropic = bool(os.environ.get("ANTHROPIC_API_KEY"))

    if provider == "heuristic":
        return HeuristicExtractor()

    want_openai = provider == "openai" or (not provider and has_openai)
    want_anthropic = provider == "anthropic" or (not provider and has_anthropic)

    if want_openai:
        try:
            return OpenAIExtractor()
        except Exception as exc:
            print(f"[extract] OpenAI unavailable ({exc}); falling back.")
    if want_anthropic:
        try:
            return ClaudeExtractor()
        except Exception as exc:
            print(f"[extract] Claude unavailable ({exc}); falling back.")
    return HeuristicExtractor()


MAX_EXTRACT_PASSES = 3  # hard cap regardless of EXTRACT_PASSES — bounds cost/latency


def extract_chunk_multi(extractor, chunk: Chunk) -> list[dict]:
    """Optional multi-pass union (J-056): set EXTRACT_PASSES>1 to re-read each chunk
    N times and hand reconcile the UNION of raw candidates (max-recall set; reconcile's
    dedup collapses the overlap, keeping a requirement gating/mandatory if any pass
    flagged it). Pass 0 stays the deterministic temp=0 baseline; extra passes trade
    determinism for diversity (temp=0.7) to catch what pass 0 missed. Opt-in and
    OpenAI-only (extra Claude/heuristic passes would just repeat identical output) —
    single-pass (default) behaves exactly as extract_chunk did before this existed."""
    raws = extractor.extract_chunk(chunk)
    passes = min(max(int(os.environ.get("EXTRACT_PASSES", "1") or 1), 1), MAX_EXTRACT_PASSES)
    if passes <= 1 or getattr(extractor, "name", None) != "openai":
        return raws
    for pass_no in range(1, passes):
        try:
            raws = raws + extractor.extract_chunk(chunk, pass_no=pass_no)
        except TypeError:
            break  # extractor doesn't accept pass_no — no-op beyond pass 0
    return raws
