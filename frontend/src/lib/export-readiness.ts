import type { Requirement } from "@/types/requirement";
import { hasDraft, isBacked, isOpenDealBreaker, unansweredCount } from "@/lib/answers";

// Export readiness — the one honest read of "what stands between this tender and
// a clean export", shared by the export menu (blocker prompts) and the client-
// ready gate. Pure functions, no React, so the summary UI and the builders all
// derive the same view from one source (SLOP-CHECK: one source of truth for
// readiness/export). Reads the same predicates the /answers workspace already
// uses, plus Stage 5's answer verdict (answer.decision).
//
// Voice note (copywriting.md): every label counts a real thing (a number of
// requirements), never scores a judgement; verbs stay provisional (draft, check,
// resolve), calm, no hype.

export type ExportBlockerKind =
  | "deal-breaker" // gating requirement not safely resolved
  | "blocker-comment" // a teammate raised an unresolved blocker comment
  | "gap" // unanswered open question(s)
  | "flagged" // an answer a human flagged for rework
  | "unapproved" // a draft with no approval verdict yet
  | "no-draft" // a requirement with no drafted answer
  | "unbacked"; // a drafted answer citing no evidence

export interface ExportBlocker {
  kind: ExportBlockerKind;
  count: number;
  reqIds: string[]; // the requirements in this category, for jump-to prompts
  label: string; // "2 deal-breakers still open" — a count, never a score
  prompt: string; // what to do about it, plainly
}

export interface ExportReadiness {
  total: number;
  approved: number; // answers a human has approved
  blockers: ExportBlocker[]; // only non-empty categories, most severe first
  // "Client-ready" = safe to send outside the team. Blocked while any deal-breaker
  // is open, any teammate blocker comment is unresolved, any answer is flagged,
  // or any deal-breaker answer is unapproved. Internal export is always allowed
  // and shows everything honestly.
  clientReadyBlocked: boolean;
  clientReadyReason: string | null;
}

function isApproved(req: Requirement): boolean {
  return req.answer?.decision?.verdict === "approved";
}
function isFlagged(req: Requirement): boolean {
  return req.answer?.decision?.verdict === "flagged";
}
function hasOpenBlockerComment(req: Requirement): boolean {
  return (req.open_blocker_count ?? 0) > 0;
}

// The blocker predicates, in severity order. A requirement can land in more than
// one (an unbacked draft with an open gap is both) — the counts are honest about
// each concern rather than forcing one bucket.
const CATEGORIES: {
  kind: ExportBlockerKind;
  match: (req: Requirement) => boolean;
  label: (n: number) => string;
  prompt: string;
}[] = [
  {
    kind: "deal-breaker",
    match: (req) => isOpenDealBreaker(req),
    label: (n) => `${n} deal-breaker${n === 1 ? "" : "s"} still open`,
    prompt:
      "These can disqualify the bid. Resolve them before you send a client-ready pack.",
  },
  {
    kind: "blocker-comment",
    match: hasOpenBlockerComment,
    label: (n) => `${n} blocker comment${n === 1 ? "" : "s"} still open`,
    prompt:
      "A teammate flagged these as blocked. Resolve the comment before you send a client-ready pack.",
  },
  {
    kind: "gap",
    match: (req) => unansweredCount(req) > 0,
    label: (n) =>
      `${n} requirement${n === 1 ? "" : "s"} with an open question`,
    prompt: "Answer the outstanding questions, or export internally with them shown.",
  },
  {
    kind: "flagged",
    match: isFlagged,
    label: (n) => `${n} answer${n === 1 ? "" : "s"} flagged for rework`,
    prompt: "A reviewer flagged these. They stay out of a client-ready pack.",
  },
  {
    kind: "unapproved",
    match: (req) => hasDraft(req) && !req.answer?.decision,
    label: (n) => `${n} draft${n === 1 ? "" : "s"} not yet approved`,
    prompt: "Approve the ready answers, or export internally as drafts.",
  },
  {
    kind: "no-draft",
    match: (req) => !hasDraft(req),
    label: (n) => `${n} requirement${n === 1 ? "" : "s"} with no answer`,
    prompt: "Draft an answer, or export with the gap shown.",
  },
  {
    kind: "unbacked",
    match: (req) => hasDraft(req) && !isBacked(req),
    label: (n) => `${n} answer${n === 1 ? "" : "s"} with no evidence`,
    prompt: "Add a capability document so the answer is backed.",
  },
];

export function deriveExportReadiness(
  requirements: Requirement[]
): ExportReadiness {
  const blockers: ExportBlocker[] = [];
  for (const cat of CATEGORIES) {
    const reqIds = requirements.filter(cat.match).map((r) => r.id);
    if (reqIds.length > 0) {
      blockers.push({
        kind: cat.kind,
        count: reqIds.length,
        reqIds,
        label: cat.label(reqIds.length),
        prompt: cat.prompt,
      });
    }
  }

  // A client-ready pack is one you could put in front of the buyer: no open
  // deal-breaker, no unresolved team blocker comment, nothing a reviewer
  // flagged, and every deal-breaker answered and approved. Anything short of
  // that is honestly internal-only.
  const openDealBreakers = requirements.filter(isOpenDealBreaker).length;
  const openBlockerComments = requirements.filter(hasOpenBlockerComment).length;
  const flagged = requirements.filter(isFlagged).length;
  const gatingUnapproved = requirements.filter(
    (r) => r.is_gating && !isApproved(r)
  ).length;

  let clientReadyReason: string | null = null;
  if (openDealBreakers > 0) {
    clientReadyReason = `${openDealBreakers} deal-breaker${openDealBreakers === 1 ? " is" : "s are"} still open.`;
  } else if (openBlockerComments > 0) {
    clientReadyReason = `${openBlockerComments} blocker comment${openBlockerComments === 1 ? " is" : "s are"} still open.`;
  } else if (gatingUnapproved > 0) {
    clientReadyReason = `${gatingUnapproved} deal-breaker answer${gatingUnapproved === 1 ? " is" : "s are"} not approved yet.`;
  } else if (flagged > 0) {
    clientReadyReason = `${flagged} answer${flagged === 1 ? " is" : "s are"} flagged for rework.`;
  }

  return {
    total: requirements.length,
    approved: requirements.filter(isApproved).length,
    blockers,
    clientReadyBlocked: clientReadyReason !== null,
    clientReadyReason,
  };
}
