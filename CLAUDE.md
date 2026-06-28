@AGENTS.md

# Claude-specific notes

## Context

You are working on **Tender Breakdown**, a hackathon tool for the Conduct "Make Legacy Move" track. The frontend Day 1 goal is a compliance matrix over mock requirement objects — deal-breakers jump out, uncertain items look hesitant, confidence is visual not numeric.

## Before writing code

1. Read `tender-master-plan.md` for the full pipeline and scoring criteria.
2. Read `AGENTS.md` for the locked requirement schema and frontend rules.
3. Match existing code style in `frontend/src/` — minimal diffs, no over-engineering.

## Priority order (frontend)

1. Compliance matrix table (text · mandatory? · source · confidence · status)
2. Source panel (click row → show `source_excerpt` + `source_page`)
3. Decision controls (approve / edit / flag → PATCH API)
4. Graph view (requirements ↔ sources ↔ criteria, gating lit up)
5. Upload flow + gating hero moment for demo

## Schema reminder

```typescript
type RequirementType = "mandatory" | "optional";
type RequirementStatus = "pending" | "accepted" | "edited" | "flagged";

interface Requirement {
  id: string;
  text: string;
  source_page: number;
  source_clause: string;
  source_excerpt: string;
  type: RequirementType;
  is_gating: boolean;
  category: string;
  confidence: number;       // 0–1, display as bar/dot only
  status: RequirementStatus;
  needs_review: boolean;
  decision: { action: string; note: string; timestamp: string } | null;
  criteria_ref: string | null;
  depends_on: string[];
  draft_answer: string | null;
}
```

## Mock data

Keep fake requirements varied: some scary mandatory gating ones, some minor optional ones, a couple with `needs_review: true` and low confidence. Backend will send real data in the same shape later.
