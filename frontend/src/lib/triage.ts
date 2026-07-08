import type { Requirement } from "@/types/requirement";

// The triage model: how the worklist is grouped by what each requirement needs
// from you (layout.md section 2 and 3). Pure functions, no React, so the header,
// matrix, and panel all derive the same grouping from a single source.

export type GroupKey =
  | "deal-breakers"
  | "needs-input"
  | "second-look"
  | "ready"
  | "decided";

export const GROUP_ORDER: GroupKey[] = [
  "deal-breakers",
  "needs-input",
  "second-look",
  "ready",
  "decided",
];

export const GROUP_LABELS: Record<GroupKey, string> = {
  "deal-breakers": "Deal-breakers to clear",
  "needs-input": "Needs your answer",
  "second-look": "Worth a second look",
  ready: "Ready to approve",
  decided: "Approved / decided",
};

// Below this, a pending non-gating item still wants a second look before approval.
export const LOW_CONFIDENCE = 0.75;

export function needsInput(req: Requirement): boolean {
  return (
    req.answer?.state === "needs_input" ||
    (req.open_questions?.some((q) => !q.answer) ?? false)
  );
}

// Which review state a single requirement belongs to. Order matters:
// pending gating items are bid/no-bid risk and always lead the worklist, then
// unanswered gaps, then uncertain drafts, then confident drafts ready to approve.
export function reviewStateOf(req: Requirement): GroupKey {
  if (req.status !== "pending") return "decided";

  if (req.is_gating) return "deal-breakers";

  if (needsInput(req)) return "needs-input";

  if (req.needs_review || req.confidence < LOW_CONFIDENCE)
    return "second-look";

  // Confident and non-gating but still pending.
  return "ready";
}

export const groupOf = reviewStateOf;

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
  // A confident gate is a deal-breaker to clear; one the tool flagged to be safe
  // but is less sure of (needs_review) is a possible deal-breaker to verify, so
  // an over-flag reads honestly instead of masquerading as a certain bid-killer.
  if (req.is_gating) {
    return req.needs_review
      ? "Possible deal-breaker - verify"
      : "Deal-breaker to clear";
  }
  if (needsInput(req)) return "Needs your answer";
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

// Split the requirements into the five groups in GROUP_ORDER, preserving source
// order within each group, plus a per-group count for the header triage line.
export function deriveTriage(reqs: Requirement[]): Triage {
  const buckets: Record<GroupKey, Requirement[]> = {
    "deal-breakers": [],
    "needs-input": [],
    "second-look": [],
    ready: [],
    decided: [],
  };

  for (const req of reqs) {
    buckets[reviewStateOf(req)].push(req);
  }

  const counts: Record<GroupKey, number> = {
    "deal-breakers": buckets["deal-breakers"].length,
    "needs-input": buckets["needs-input"].length,
    "second-look": buckets["second-look"].length,
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

// The review worklist in walking order: every pending item, in triage group
// order (deal-breakers, needs-input, second-look, ready), falling back to ALL
// items when nothing
// is pending so "next" still has somewhere to go. This is the one ordering the
// panel's Next, the j/k keys, and focus mode all walk — extracted so they can
// never drift apart.
export function orderedWorklist(triage: Triage): Requirement[] {
  const all = triage.groups.flatMap((group) => group.items);
  const pending = all.filter((req) => req.status === "pending");
  return pending.length > 0 ? pending : all;
}

export function labelForRequirementAction(
  req: Requirement | null | undefined
): string {
  if (!req || req.status !== "pending") return "Back to matrix";
  switch (reviewStateOf(req)) {
    case "deal-breakers":
      return "Review next deal-breaker";
    case "needs-input":
      return "Answer next gap";
    case "second-look":
      return "Review next draft";
    case "ready":
      return "Approve next draft";
    case "decided":
      return "Back to matrix";
  }
}

function firstPending(reqs: Requirement[]): Requirement | null {
  for (const group of deriveTriage(reqs).groups) {
    const pending = group.items.find((req) => req.status === "pending");
    if (pending) return pending;
  }
  return null;
}

// The item the header's Next action should route to: the highest-priority item
// still pending (layout.md section 2). Priority follows GROUP_ORDER. null when
// nothing is pending (Next becomes Export).
export function nextPriorityId(reqs: Requirement[]): string | null {
  return firstPending(reqs)?.id ?? null;
}

export function nextPriorityLabel(reqs: Requirement[]): string {
  const next = firstPending(reqs);
  return next ? labelForRequirementAction(next) : "Export";
}

export function nextUnresolvedAfter(
  triage: Triage,
  currentId: string
): Requirement | null {
  const all = triage.groups.flatMap((group) => group.items);
  const pending = all.filter((req) => req.status === "pending");
  if (pending.length === 0) return null;

  const currentIndex = all.findIndex((req) => req.id === currentId);
  const walk =
    currentIndex === -1
      ? all
      : [...all.slice(currentIndex + 1), ...all.slice(0, currentIndex)];
  return (
    walk.find((req) => req.status === "pending" && req.id !== currentId) ??
    pending.find((req) => req.id !== currentId) ??
    null
  );
}

export function nextUnresolvedLabelAfter(
  triage: Triage,
  currentId: string
): string {
  return labelForRequirementAction(nextUnresolvedAfter(triage, currentId));
}
