# Classification Prompt — v1

> **Owner: J.** Provider-agnostic. The extraction prompt already does a first-pass mandatory/optional
> + gating call. This prompt is the **refinement pass**: run it when we want a sharper, dedicated
> judgment on `type` and `is_gating` — especially for the items extraction marked borderline (mid
> confidence, ambiguous wording, table-derived). Day 1 it's optional; Day 2 we decide whether the
> one-call version is good enough or whether every requirement gets this second look.
>
> Structured output only. Input = a batch of already-extracted requirements (text + excerpt +
> clause). Output = refined `type`, `is_gating`, and a confidence for the classification itself.

---

## Why a separate pass exists

The two errors that cost us the demo:
1. **A gating pass/fail requirement labelled non-gating** → the disqualifier "hero moment" misses
   the actual disqualifier. Unforgivable.
2. **An optional "should" labelled mandatory** → we cry wolf and the bid manager stops trusting us.

The extraction call optimises for *recall of requirements*. This call optimises for *getting the
mandatory/gating judgment right*, with the excerpt in front of it and nothing else to do.

## SYSTEM_PROMPT (stable — cache this prefix)

```
You classify UK public-sector tender requirements. For each requirement you are given its
normalised text, the exact source excerpt it came from, and its clause label. Decide two things
and nothing else: is it MANDATORY or OPTIONAL, and is it GATING (would missing it disqualify the
bid). Anchor every judgment in the excerpt's actual wording — not the paraphrased text.

MANDATORY vs OPTIONAL — anchor on signal words in the EXCERPT
- mandatory: shall, must, must not, is required to, is to, will be required, mandatory, requirement,
  a condition of, and obligations under selection/eligibility/pass-fail headings.
- optional: should, may, can, is encouraged to, desirable, preferred, ideally, where appropriate,
  nice to have, will be scored favourably (scored ≠ required).
- If the excerpt mixes signals (e.g. "should" in prose but listed under a "Mandatory Requirements"
  heading), treat the binding context as decisive and LOWER your confidence.

GATING — true only for genuine disqualifiers
Set is_gating = true when failing this removes the bid from consideration:
- explicit pass/fail, "PASS/FAIL", "compliance is mandatory", "failure to … will result in
  rejection / exclusion / disqualification".
- minimum eligibility thresholds (minimum turnover, mandatory certification/insurance held at
  submission, legal/regulatory must-haves).
- "shall be excluded if", "bids that do not … will not be evaluated".
A requirement can be MANDATORY but NOT gating (it's obligatory to answer, but missing a point
scores low rather than disqualifies). When in doubt about gating, set false but FLAG it (lower
classification_confidence) so a human checks — never silently upgrade or downgrade a disqualifier.

OUTPUT
Return only the structured object. Do not restate the requirement text. Do not add commentary.
```

## USER_PROMPT (per batch — volatile)

```
TENDER: {{title}}
Classify each requirement below. Judge from the excerpt wording. Be most careful with anything
that could be a disqualifier — getting is_gating wrong is the costliest error.

{{#each requirements}}
[{{this.raw_id}}]
text:    {{this.text}}
excerpt: {{this.source_excerpt}}
clause:  {{this.source_clause}}
{{/each}}
```

## CLASSIFICATION_OUTPUT_SCHEMA (structured-output / function args)

```jsonc
{
  "type": "object",
  "properties": {
    "classifications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "raw_id":                  { "type": "string" },
          "type":                    { "type": "string", "enum": ["mandatory", "optional"] },
          "is_gating":               { "type": "boolean" },
          "classification_confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "rationale":               { "type": ["string", "null"], "description": "Short: the signal word/heading that decided it. Helps red-teaming + the source panel." }
        },
        "required": ["raw_id", "type", "is_gating", "classification_confidence"]
      }
    }
  },
  "required": ["classifications"]
}
```

> The generalist merges `classification_confidence` with the extraction `confidence` (conservatively —
> a disagreement between the two passes is itself a reason to flag `needs_review`). `raw_id` ties each
> classification back to its raw requirement.

---

## Red-team checklist (Day 2)

- [ ] "should" under a **"Mandatory Requirements"** heading → does context win? confidence lowered?
- [ ] "must" in **background/recital** text (not an obligation on the bidder) → not over-flagged gating.
- [ ] **PASS/FAIL table rows** → gating true.
- [ ] "will be scored" / "evaluated on" → mandatory-to-answer but **not** gating.
- [ ] "must not" / prohibitions → mandatory, gating if breach = exclusion.
- [ ] Disagreement between extraction's first-pass call and this pass → surfaced, not hidden.

### Changelog
- **2026-06-28 (Day 1)** — v1 drafted by J. Optional refinement pass; Day 2 decide if it runs on
  all requirements or only borderline ones.
