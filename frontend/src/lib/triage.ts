import type { Requirement } from "@/types/requirement";

// The triage model: how the worklist is grouped by what each requirement needs
// from you (layout.md section 2 and 3). Pure functions, no React, so the header,
// matrix, and panel all derive the same grouping from a single source.

export type GroupKey = "needs-you" | "to-verify" | "ready" | "decided";

export const GROUP_ORDER: GroupKey[] = [
  "needs-you",
  "to-verify",
  "ready",
  "decided",
];

export const GROUP_LABELS: Record<GroupKey, string> = {
  "needs-you": "Needs you",
  "to-verify": "To verify",
  ready: "Ready to approve",
  decided: "Decided",
};

// Below this, a pending non-gating item still wants a second look before approval.
export const LOW_CONFIDENCE = 0.75;

// Which group a single requirement belongs to. Order of the checks matters:
// a needs-you item is always needs-you even if it would otherwise verify.
export function groupOf(req: Requirement): GroupKey {
  if (req.status !== "pending") return "decided";

  const needsInput =
    req.answer?.state === "needs_input" ||
    (req.open_questions?.some((q) => !q.answer) ?? false);
  if (needsInput) return "needs-you";

  if (
    req.status === "pending" &&
    (req.is_gating || req.needs_review || req.confidence < LOW_CONFIDENCE)
  ) {
    return "to-verify";
  }

  // Confident and non-gating but still pending.
  return "ready";
}

// A confident, non-gating, still-pending item: the only kind that earns the
// inline approve affordance in the resting matrix (layout.md section 4).
export function isConfidentNonGating(req: Requirement): boolean {
  return (
    !req.is_gating &&
    !req.needs_review &&
    req.confidence >= LOW_CONFIDENCE &&
    req.status === "pending"
  );
}

// The status word for a still-pending item at rest (copywriting.md status
// lexicon). It names what THIS item needs, so the column stops repeating one
// flat "Needs your eye" on every row. First match wins. A gating item always
// names itself a deal-breaker — the word matches the row's oxblood alarm edge +
// bead, so it must lead even over a pending question (this is a deliberate
// divergence from groupOf, whose job is grouping, not the per-row headline).
// Returns null for a confident non-gating item: it rests silent and the hover
// Approve owns its cell.
export function pendingStatusWord(req: Requirement): string | null {
  if (isConfidentNonGating(req)) return null;
  if (req.is_gating) return "Deal-breaker to clear";
  const needsInput =
    req.answer?.state === "needs_input" ||
    (req.open_questions?.some((q) => !q.answer) ?? false);
  if (needsInput) return "Needs your answer";
  return "Worth a second look";
}

// How the matrix orders the rows within a group. 'confidence' is the default
// worklist order: riskiest (lowest confidence) first, so the items most likely
// to need a human float to the top. 'page' follows the document; 'category'
// gathers like content together.
export type SortKey = "confidence" | "page" | "category";

// A pure comparator for the chosen sort. Kept here (not in the component) so the
// ordering stays testable and shared. Confidence sorts ascending (riskiest
// first); page follows the source; category sorts by its label. Each falls back
// to source order via a stable Array.prototype.sort.
export function compareRequirements(
  sortBy: SortKey
): (a: Requirement, b: Requirement) => number {
  return (a, b) => {
    switch (sortBy) {
      case "page":
        return a.source_page - b.source_page;
      case "category":
        return a.category.localeCompare(b.category);
      case "confidence":
      default:
        return a.confidence - b.confidence;
    }
  };
}

export interface TriageGroup {
  key: GroupKey;
  label: string;
  items: Requirement[];
}

export interface Triage {
  counts: Record<GroupKey, number>;
  groups: TriageGroup[];
}

// Split the requirements into the three groups in GROUP_ORDER, preserving source
// order within each group, plus a per-group count for the header triage line.
export function deriveTriage(reqs: Requirement[]): Triage {
  const buckets: Record<GroupKey, Requirement[]> = {
    "needs-you": [],
    "to-verify": [],
    ready: [],
    decided: [],
  };

  for (const req of reqs) {
    buckets[groupOf(req)].push(req);
  }

  const counts: Record<GroupKey, number> = {
    "needs-you": buckets["needs-you"].length,
    "to-verify": buckets["to-verify"].length,
    ready: buckets.ready.length,
    decided: buckets.decided.length,
  };

  const groups: TriageGroup[] = GROUP_ORDER.map((key) => ({
    key,
    label: GROUP_LABELS[key],
    items: buckets[key],
  }));

  return { counts, groups };
}

// The item the header's Next action should route to: the highest-priority item
// still pending (layout.md section 2). Priority: gating unresolved, then
// needs-you, then low-confidence to verify, then any other pending. null when
// nothing is pending (Next becomes Export response).
export function nextPriorityId(reqs: Requirement[]): string | null {
  const pending = reqs.filter((req) => req.status === "pending");
  if (pending.length === 0) return null;

  const gating = pending.find((req) => req.is_gating);
  if (gating) return gating.id;

  const needsYou = pending.find(
    (req) =>
      req.answer?.state === "needs_input" ||
      (req.open_questions?.some((q) => !q.answer) ?? false)
  );
  if (needsYou) return needsYou.id;

  const lowConfidence = pending.find(
    (req) => req.needs_review || req.confidence < LOW_CONFIDENCE
  );
  if (lowConfidence) return lowConfidence.id;

  return pending[0].id;
}
