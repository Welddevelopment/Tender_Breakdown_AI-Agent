"use client";

import type { Requirement } from "@/types/requirement";
import { hasDraft, isOpenDealBreaker } from "@/lib/answers";
import { sourceRefLabel } from "@/lib/source-doc";
import { useAuth } from "@/context/AuthContext";
import { actorLabel } from "@/lib/collaborators";
import { AnswerPanel } from "./AnswerPanel";
import { BlockerMarker, CommentCountMarker } from "./CollaborationMarkers";
import { CategoryTag } from "./CategoryTag";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { OpenQuestions } from "./OpenQuestions";

// One requirement's response in the workspace: metadata row, the requirement
// text, the drafted answer + evidence receipts (AnswerPanel), and any open
// questions inline. De-carded — a hairline-separated row, no rounded slab,
// matching GapInterview's list grammar. The card carries the requirement id as
// a scroll anchor so the ledger/filters and future deep links can jump to it.

export function AnswerCard({ requirement: req }: { requirement: Requirement }) {
  const { user } = useAuth();
  const answer = req.answer ?? null;
  // A gating item with no draft can't be answered from source — read it as the
  // oxblood alarm, not a low meter.
  const unanswerable = isOpenDealBreaker(req) && !hasDraft(req);

  return (
    <li
      id={req.id}
      className="answer-card scroll-mt-24 border-t border-hairline py-6 first:border-t-0 first:pt-0"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        {req.is_gating && (
          <span className="inline-flex items-center gap-1.5 font-medium text-signal-oxblood">
            <span
              className="h-2 w-2 rounded-full bg-signal-oxblood"
              aria-hidden
            />
            Deal-breaker
          </span>
        )}
        <CategoryTag category={req.category} />
        <ConfidenceIndicator
          confidence={answer?.confidence ?? req.confidence}
          needsReview={req.needs_review}
          unanswerable={unanswerable}
          variant="dot"
          size="sm"
        />
        {/* The answer-state badge lives in the panel's mono margin — one badge
            per card, not two. Accent on the clause ref: the requirement's own
            source ref and the evidence refs share the one "traceable to
            source" colour. */}
        <span className="font-mono text-accent">{sourceRefLabel(req)}</span>
        {/* Collaboration presence (UI Stage 6): a quiet signal that the team has
            been talking about this item, without opening the panel to find out.
            Null-at-zero — cards with no comments/blockers render unchanged. */}
        <BlockerMarker count={req.open_blocker_count} />
        <CommentCountMarker count={req.comment_count} />
        {/* Cross-surface coherence: the requirement's OWN decision, shown beside
            the answer state so a divergence reads honestly — "requirement
            approved · answer still needs input" is a real state, not a bug. Only
            shown once the requirement is actually decided on the matrix. */}
        <RequirementStatusNote req={req} currentUserId={user?.id} />
      </div>

      <p className="mb-3 max-w-[64ch] text-sm font-medium leading-snug text-ink">
        {req.text}
      </p>

      <AnswerPanel requirement={req} />

      {/* Inline gaps. Hidden in print — answered gap input is merged into the
          drafted answer prose, which carries onto the PDF. */}
      <div className="no-print">
        <OpenQuestions requirement={req} />
      </div>
    </li>
  );
}

// The requirement's own matrix decision, rendered on the answer card so the two
// independent tracks (requirement status vs answer state) are both legible here.
// Nothing while pending — an undecided requirement adds no signal, and the answer
// state already carries the review. Attributed like the matrix's status word.
function RequirementStatusNote({
  req,
  currentUserId,
}: {
  req: Requirement;
  currentUserId?: string | null;
}) {
  if (req.status === "pending") return null;
  const who = actorLabel(req.decision?.actor, currentUserId);
  const label =
    req.status === "accepted"
      ? `Requirement approved by ${who}`
      : req.status === "edited"
        ? `Requirement edited by ${who}`
        : "Requirement flagged";
  const tone =
    req.status === "flagged" ? "text-signal-oxblood" : "text-forest";
  return <span className={`font-mono ${tone}`}>{label}</span>;
}
