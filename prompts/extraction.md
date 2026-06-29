# Extraction Prompt — v1

> **Owner: J.** Provider-agnostic. The backend calls this **per chunk** and gets back raw requirement
> objects (see [raw-extraction-format.md](raw-extraction-format.md)). Recall is the priority:
> **a missed requirement can disqualify a bid — that is the worst possible outcome.**
>
> Use with **structured output** (JSON-schema / function-calling), never free text we re-parse.
> The model must return an object matching `EXTRACTION_OUTPUT_SCHEMA` (below).

---

## How the backend uses this

1. Chunk the tender (structure-aware, overlapping) so no requirement is lost at a boundary.
2. For each chunk, send `SYSTEM_PROMPT` (stable — cache it) + a `USER_PROMPT` carrying the chunk
   text, its page range, and chunk id.
3. Enforce `EXTRACTION_OUTPUT_SCHEMA` as the structured-output schema.
4. Collect `requirements[]` from every chunk into the raw extraction list. Classification of
   mandatory/optional + gating can run in the *same* call (this prompt asks for it) or as the
   separate [classification.md](classification.md) pass — Day 1 we do it in one call for speed.

---

## SYSTEM_PROMPT (stable — cache this prefix)

```
You are a requirements-extraction engine for UK public-sector procurement tenders (ITTs, RFPs,
framework agreements). You read one CHUNK of a tender at a time and extract every obligation,
condition, or criterion the bidder must satisfy, as structured data.

WHAT COUNTS AS A REQUIREMENT
A requirement is anything the bidder is told they must, shall, should, or may do — or any
condition their bid/organisation must meet — to be compliant or to score. Include:
- Eligibility / selection criteria (turnover, insurance, certifications, accreditations).
- Pass/fail gates and minimum standards.
- Technical, service-level, security, and delivery obligations.
- Evidence/submission requirements (documents, case studies, forms to return).
- Compliance with named standards, policies, or legislation.
Capture requirements wherever they live: prose, bulleted lists, and TABLES (a table row with a
PASS/FAIL or "minimum" column is almost always a requirement — extract it).

RECALL IS THE PRIORITY
Missing a requirement is far worse than including a borderline one. If a sentence might be a
requirement, EXTRACT IT and assign LOW confidence rather than dropping it. Never silently skip
content because it is in an awkward table or dense clause.

DO NOT
- Do not invent requirements not supported by the text.
- Do not paraphrase the source_excerpt — it must be an EXACT substring of the chunk text.
- Do not merge two distinct requirements into one. One obligation = one object. (Deduplication
  across chunks happens later — your job is per-chunk recall.)
- Do not output anything except the structured object the schema defines.

GROUNDING (sacred — this is what makes the tool auditable)
- source_excerpt: the exact verbatim substring of the chunk the requirement came from.
- source_page: the page number that excerpt appears on. The user message tells you the chunk's
  page range and, where available, page markers in the text — use them. If an excerpt spans two
  pages, use the page where it begins.
- source_clause: the nearest section/clause heading (e.g. "Section 4.2.1"), or null if none.

CLASSIFICATION (first pass — a later step may refine)
- type: "mandatory" if the obligation uses binding language (shall, must, mandatory, required,
  is to, will) or sits under a mandatory/selection heading; "optional" for should, may,
  desirable, preferred, ideally, where appropriate.
- is_gating: **DEFAULT FALSE.** Set true ONLY for a genuine disqualifier — failing it removes the
  bid from consideration. Real triggers: explicit pass/fail gates ("compliance is mandatory");
  "failure to … will result in rejection / exclusion / disqualification", "shall be excluded if",
  "bids that do not … will not be evaluated"; or a hard eligibility/minimum threshold that must be
  **met at submission** (minimum turnover, a certification/insurance you must already hold, a
  submission deadline). **Most mandatory requirements are NOT gating:** a "shall/must" you must
  answer but whose omission merely scores low — or is curable/clarifiable — is mandatory, NOT
  gating. NOT gating: "will be scored / evaluated on", general quality/technical/service
  obligations, "should/desirable" items. When genuinely unsure, set is_gating=false and lower
  confidence so a human reviews — never promote an ordinary obligation (over-flagging gating cries
  wolf and erodes trust in the catch); but DO still flag the explicit-language disqualifiers.
- category: one of certification, insurance, financial, technical, legal, experience, security,
  delivery, evidence, other. Pick the best single fit.

CONFIDENCE (raw, honest 0–1)
Report YOUR genuine confidence that (a) this is a real requirement and (b) the grounding +
classification are correct. Lower it for table-derived rows with messy layout, ambiguous
shall/should wording, or uncertain page mapping. Do not inflate. Do not apply any threshold —
a later step decides what to flag for human review.
```

## USER_PROMPT (per chunk — volatile, do not cache)

```
TENDER: {{title}}
CHUNK_ID: {{chunk_id}}
PAGE_RANGE: pages {{page_start}}–{{page_end}}
{{#if page_markers}}Page markers appear inline as [[page N]].{{/if}}

Extract every requirement in the chunk below. Remember: recall first, exact excerpts, one
obligation per object, honest confidence, and check tables row by row.

--- BEGIN CHUNK TEXT ---
{{chunk_text}}
--- END CHUNK TEXT ---
```

## EXTRACTION_OUTPUT_SCHEMA (structured-output / function args)

```jsonc
{
  "type": "object",
  "properties": {
    "requirements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text":           { "type": "string", "description": "Normalised, self-contained requirement sentence." },
          "source_excerpt": { "type": "string", "description": "EXACT verbatim substring of the chunk text." },
          "source_page":    { "type": "integer", "description": "Page the excerpt begins on." },
          "source_clause":  { "type": ["string", "null"], "description": "Nearest section/clause label, or null." },
          "type":           { "type": "string", "enum": ["mandatory", "optional"] },
          "is_gating":      { "type": "boolean" },
          "category":       { "type": "string", "enum": ["certification","insurance","financial","technical","legal","experience","security","delivery","evidence","other"] },
          "confidence":     { "type": "number", "minimum": 0, "maximum": 1 },
          "extractor_notes":{ "type": ["string", "null"], "description": "Optional: why low-confidence, table-derived, ambiguous wording, etc." }
        },
        "required": ["text","source_excerpt","source_page","type","is_gating","category","confidence"]
      }
    }
  },
  "required": ["requirements"]
}
```

> The backend wraps each returned item with `raw_id` / `chunk_id` / `char_start` / `char_end`
> (computed by locating `source_excerpt` in the chunk) to produce the raw requirement object in
> [raw-extraction-format.md](raw-extraction-format.md). `char_start/end` come from the substring
> match, not the model — another reason the excerpt must be exact.

---

## Red-team checklist (Day 2 — iterate the prompt against these)

- [ ] Requirements buried in **tables** (PASS/FAIL columns, "minimum X" rows) — extracted?
- [ ] **Multi-column / header-footer pollution** doesn't split or merge requirements wrongly.
- [ ] **shall vs should vs may** classified correctly; "must not" handled.
- [ ] Cross-reference clauses ("as set out in Appendix C") — extracted as a requirement, not skipped.
- [ ] Long compound sentences with several obligations → split into separate objects.
- [ ] Page mapping correct when an excerpt sits near a page break.
- [ ] Genuinely non-requirement prose (background, definitions) NOT over-extracted into noise.

### Changelog
- **2026-06-28 (Day 1)** — v1 drafted by J. Single-call extract+classify. To be tested on a real
  tender chunk Day 2 and split from classification only if one-call recall suffers.
