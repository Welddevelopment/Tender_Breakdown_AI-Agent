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

from .chunk import Chunk

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


def _looks_like_requirement(sentence: str) -> bool:
    low = sentence.lower()
    if len(sentence.strip()) < 25:
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
        for raw_sentence in _SENT_SPLIT.split(chunk.text):
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
            start = chunk.text.find(raw_sentence.strip()[:40])
            out.append(
                {
                    "raw_id": f"raw-{chunk.id}-{seq:04d}",
                    "chunk_id": chunk.id,
                    "text": sentence,
                    "source_page": chunk.page_start,  # best-effort; chunk-level page
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
    "language; is_gating=true only when missing it disqualifies the bid. Report honest "
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


def _to_raw(items: list[dict], chunk: Chunk) -> list[dict]:
    """Wrap the model's requirement items into raw-extraction-format dicts."""
    out: list[dict] = []
    for seq, it in enumerate(items):
        excerpt = it.get("source_excerpt", "")
        start = chunk.text.find(excerpt) if excerpt else -1
        out.append(
            {
                "raw_id": f"raw-{chunk.id}-{seq:04d}",
                "chunk_id": chunk.id,
                "text": it.get("text", ""),
                "source_page": it.get("source_page", chunk.page_start),
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

    def extract_chunk(self, chunk: Chunk) -> list[dict]:
        resp = self._client.chat.completions.create(
            model=self._model,
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
        calls = resp.choices[0].message.tool_calls or []
        items: list[dict] = []
        if calls:
            items = json.loads(calls[0].function.arguments).get("requirements", [])
        return _to_raw(items, chunk)


class ClaudeExtractor:
    """Anthropic extractor (alternative provider). Activates on ANTHROPIC_API_KEY."""

    name = "claude"

    def __init__(self) -> None:
        import anthropic
        self._client = anthropic.Anthropic()
        self._model = os.environ.get("LLM_MODEL", "claude-opus-4-8")

    def extract_chunk(self, chunk: Chunk) -> list[dict]:
        msg = self._client.messages.create(
            model=self._model,
            max_tokens=4096,
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
