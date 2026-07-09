import type { Requirement } from "@/types/requirement";
import { LOW_CONFIDENCE } from "@/lib/triage";

// The answer-completeness model for the /answers response workspace. Where
// triage.ts groups the worklist by decision status (needs-you / to-verify /
// ready / decided), these helpers speak a different question: "is the drafted
// RESPONSE submittable?" — is it drafted, is it backed by evidence, is a gating
// answer still open. Pure functions, no React, so the ledger, filter bar, and
// workspace all derive the same view from one source. Reuses LOW_CONFIDENCE so
// the single confidence threshold stays in one place.

// --- per-requirement predicates (all null-safe on answer / open_questions) ---

// Open questions the tool flagged that the human hasn't answered yet.
export function unansweredCount(req: Requirement): number {
  return (req.open_questions ?? []).filter((q) => q.answer === null).length;
}

// A drafted answer exists with real prose (not the empty placeholder state).
export function hasDraft(req: Requirement): boolean {
  const answer = req.answer;
  return (
    !!answer && answer.state !== "empty" && answer.text.trim().length > 0
  );
}

// The answer cites at least one piece of the bidder's own evidence.
export function isBacked(req: Requirement): boolean {
  return (req.answer?.evidence_refs.length ?? 0) > 0;
}

// The tool or the human still owes input: the draft is flagged needs_input, or
// a flagged gap is unanswered.
export function needsInput(req: Requirement): boolean {
  return req.answer?.state === "needs_input" || unansweredCount(req) > 0;
}

// A deal-breaker (gating) requirement that isn't safely put to bed: not yet
// accepted, and either undrafted, needing input, or unbacked. These are the
// ones that can disqualify the whole bid, so they lead every ordering.
export function isOpenDealBreaker(req: Requirement): boolean {
  return (
    req.is_gating &&
    req.status !== "accepted" &&
    (!hasDraft(req) || needsInput(req) || !isBacked(req))
  );
}

// --- readiness ledger buckets (one requirement lands in exactly one; first
// match wins, in this order) ---

export type ReadinessKey = "deal-breaker" | "needs-input" | "no-draft" | "ready";

export function readinessOf(req: Requirement): ReadinessKey {
  if (isOpenDealBreaker(req)) return "deal-breaker";
  if (needsInput(req)) return "needs-input";
  if (!hasDraft(req)) return "no-draft";
  return "ready";
}

export interface ReadinessCounts {
  dealBreaker: number;
  needsInput: number;
  noDraft: number;
  ready: number;
  total: number;
}

export function deriveReadiness(reqs: Requirement[]): ReadinessCounts {
  const counts: ReadinessCounts = {
    dealBreaker: 0,
    needsInput: 0,
    noDraft: 0,
    ready: 0,
    total: reqs.length,
  };
  for (const req of reqs) {
    switch (readinessOf(req)) {
      case "deal-breaker":
        counts.dealBreaker += 1;
        break;
      case "needs-input":
        counts.needsInput += 1;
        break;
      case "no-draft":
        counts.noDraft += 1;
        break;
      case "ready":
        counts.ready += 1;
        break;
    }
  }
  return counts;
}

// Eligible for the /answers bulk-approve: a ready draft (gap-free, drafted, no
// open deal-breaker) that is also confident and not yet decided. Bulk approval
// never touches an answer with an open gap, a shaky draft, or one a human has
// already ruled on — those need an individual look. Single-sources the
// confidence bar from LOW_CONFIDENCE.
export function isAnswerApprovable(req: Requirement): boolean {
  return (
    readinessOf(req) === "ready" &&
    !req.needs_review &&
    (req.answer?.confidence ?? req.confidence) >= LOW_CONFIDENCE &&
    !req.answer?.decision
  );
}

// --- answer filters (empty set = show all; the UI selects one at a time) ---

export type AnswerFilterKey = "deal-breakers" | "needs-input" | "unbacked";

export function matchesFilter(req: Requirement, key: AnswerFilterKey): boolean {
  switch (key) {
    case "deal-breakers":
      return isOpenDealBreaker(req);
    case "needs-input":
      return needsInput(req);
    case "unbacked":
      // Only meaningful once a draft exists: a written answer with no evidence.
      return hasDraft(req) && !isBacked(req);
  }
}

export function matchesFilters(
  req: Requirement,
  active: Set<AnswerFilterKey>
): boolean {
  if (active.size === 0) return true;
  for (const key of active) {
    if (matchesFilter(req, key)) return true;
  }
  return false;
}

// --- weakest-first comparator ---
// Encodes "strength" as a tuple compared lexicographically, ascending, so the
// weakest (most likely to lose points) float to the top. Priority, in order:
//   1. open deal-breaker first
//   2. no draft vs has draft (a null-answer gating item is weakest of all)
//   3. needs input first, then more unanswered questions first
//   4. unbacked before backed
//   5. lowest answer confidence first (falls back to requirement confidence)
// Ties keep source order via the stable Array.prototype.sort.
function weaknessTuple(req: Requirement): number[] {
  return [
    isOpenDealBreaker(req) ? 0 : 1,
    hasDraft(req) ? 1 : 0,
    needsInput(req) ? 0 : 1,
    -unansweredCount(req),
    isBacked(req) ? 1 : 0,
    req.answer?.confidence ?? req.confidence,
  ];
}

export function compareWeakestFirst(a: Requirement, b: Requirement): number {
  const ta = weaknessTuple(a);
  const tb = weaknessTuple(b);
  for (let i = 0; i < ta.length; i += 1) {
    if (ta[i] !== tb[i]) return ta[i] - tb[i];
  }
  return 0;
}

// Re-export so callers can single-source the threshold from here if they want.
export { LOW_CONFIDENCE };
