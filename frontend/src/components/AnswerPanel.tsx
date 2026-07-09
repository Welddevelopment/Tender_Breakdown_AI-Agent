"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Answer, Requirement } from "@/types/requirement";
import { useRequirements } from "@/context/RequirementsContext";
import { useAuth } from "@/context/AuthContext";
import { actorLabel } from "@/lib/collaborators";
import { AnswerStateBadge } from "./AnswerStateBadge";
import { AnswerEvidenceOverlay } from "./AnswerEvidenceOverlay";
import styles from "./AnswerPanel.module.css";

// The drafted-answer zone of the requirement panel (layout.md section 6). It
// lives inside the panel's measure and margin: the warm answer prose sits in a
// 64ch reading column on the left, and everything machine-ish (the answer-state
// badge, the edit control, the evidence refs, the page numbers) runs down the
// mono margin on the right. The draft is provisional, so it carries at most a
// 2px accent edge, never a coloured slab. Evidence reads as "Backed by your
// {doc}, p.{page}" — the first receipt sits open so the grounding is visible
// without a click; further refs expand in place to the verbatim excerpt, and a
// Show-evidence link opens the consolidated verification split.
// While a draft run is in flight the prose column shows a shimmer skeleton,
// and a landing answer settles in with a one-shot rise (AnswerPanel.module.css,
// reduced-motion gated). Edit state lives in context, keyed by requirement id,
// so mid-edit text survives the card unmounting on a re-sort or filter change.
// Pinned beneath both columns is the answer decision — Approve / Flag the draft
// itself, recorded with a self-writing audit line. That verdict is INDEPENDENT
// of the requirement's own status (device kit + copywriting.md audit voice).

export function AnswerPanel({ requirement }: { requirement: Requirement }) {
  const {
    capabilityDocs,
    editAnswer,
    draftRun,
    answerEdits,
    beginAnswerEdit,
    updateAnswerEdit,
    endAnswerEdit,
    approveAnswer,
    flagAnswer,
    reopenAnswer,
    snapshotAnswers,
    restoreAnswers,
  } = useRequirements();
  const { user } = useAuth();
  const [verifyOpen, setVerifyOpen] = useState(false);
  const answer = requirement.answer ?? null;
  const draft = answerEdits[requirement.id];
  const editing = draft !== undefined;
  // This card's place in a draft run: waiting shows the skeleton, landing runs
  // the one-shot settle. An open edit always wins over the skeleton — never
  // hide a judge's half-typed text behind a loading state.
  const pending = !editing && (draftRun?.pending.has(requirement.id) ?? false);
  const justLanded =
    !!answer && (draftRun?.landed.has(requirement.id) ?? false);

  function docName(docId: string): string {
    return capabilityDocs.find((d) => d.doc_id === docId)?.filename ?? docId;
  }

  return (
    <div className="flex flex-col">
      <div
        className={`flex flex-col gap-4 @2xl:flex-row @2xl:gap-0 ${
          justLanded ? styles.settle : ""
        }`}
      >
        {/* Prose column: the warm reading measure, left-aligned, capped at 64ch. */}
        <div className="min-w-0 flex-1 @2xl:pr-8">
          {editing ? (
            <div className="flex max-w-[64ch] flex-col gap-2.5">
              <textarea
                value={draft}
                onChange={(event) =>
                  updateAnswerEdit(requirement.id, event.target.value)
                }
                rows={5}
                autoFocus
                placeholder="Write your answer"
                className="w-full resize-none border border-hairline px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Snapshot the exact prior answer BEFORE the edit, so Undo
                    // restores it verbatim — including reverting to no draft when
                    // this save is the first write (mirrors the matrix's undo).
                    const snapshot = snapshotAnswers([requirement.id]);
                    const hadDraft = answer !== null;
                    editAnswer(requirement.id, draft.trim());
                    endAnswerEdit(requirement.id);
                    toast(hadDraft ? "Answer edited" : "Answer saved", {
                      action: {
                        label: "Undo",
                        onClick: () => restoreAnswers(snapshot),
                      },
                    });
                  }}
                  className="bg-forest px-3.5 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
                >
                  Save answer
                </button>
                <button
                  type="button"
                  onClick={() => endAnswerEdit(requirement.id)}
                  className="px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : pending ? (
            // In-flight skeleton: placeholder lines where the prose will land.
            <div
              role="status"
              aria-label="Drafting this answer"
              className="max-w-[64ch] border-l-2 border-hairline pl-3"
            >
              <div className="flex flex-col gap-2 py-1">
                <div className={`${styles.skeletonLine} w-[95%]`} />
                <div className={`${styles.skeletonLine} w-[88%]`} />
                <div className={`${styles.skeletonLine} w-[62%]`} />
              </div>
            </div>
          ) : answer ? (
            <div className="max-w-[64ch] border-l-2 border-forest/50 pl-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {answer.text}
              </p>
              {answer.state === "human_edited" && (
                <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-forest">
                  Edited by user. Your wording wins.
                </p>
              )}
            </div>
          ) : (
            <div className="max-w-[64ch]">
              <p className="text-sm leading-relaxed text-ink-muted">
                No draft yet. Run autofill to draft from your documents, or write
                this answer yourself.
              </p>
              <button
                type="button"
                onClick={() => beginAnswerEdit(requirement.id, "")}
                className="no-print mt-2 inline-flex items-center gap-1.5 rounded-md border border-hairline bg-paper px-2.5 py-1.5 text-xs font-medium text-ink shadow-[var(--depth-control)] transition-colors hover:border-forest hover:text-forest"
              >
                <PencilIcon />
                Write answer
              </button>
            </div>
          )}
        </div>

        {/* Mono margin: the answer-state badge and edit control, then the
            evidence refs as quiet source lines that expand in place to the
            verbatim excerpt. Ruled with the device-kit --rule-hair token. */}
        {answer && !pending && (
          <div className="flex shrink-0 flex-col gap-3 @2xl:w-56 @2xl:[border-left:var(--rule-hair)] @2xl:pl-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <AnswerStateBadge state={answer.state} />
              {!editing && (
                <button
                  type="button"
                  onClick={() => beginAnswerEdit(requirement.id, answer.text)}
                  className="no-print inline-flex shrink-0 items-center gap-1.5 rounded-md border border-hairline bg-paper px-2 py-1 font-mono text-[11px] font-medium text-ink shadow-[var(--depth-control)] transition-colors hover:border-forest hover:text-forest"
                >
                  <PencilIcon />
                  Edit
                </button>
              )}
            </div>
            {answer.state === "human_edited" && (
              <p className="font-mono text-xs leading-relaxed text-forest">
                Human override recorded.
              </p>
            )}

            {answer.evidence_refs.length === 0 ? (
              <p className="max-w-[64ch] text-sm leading-relaxed text-ink-muted">
                No evidence linked yet. Upload a capability document so this answer
                is backed and checkable.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-2">
                  {answer.evidence_refs.map((ref, index) => (
                    <EvidenceRefItem
                      key={`${ref.doc_id}-${index}`}
                      doc={docName(ref.doc_id)}
                      page={ref.page}
                      excerpt={ref.excerpt}
                      // The first receipt sits open so every drafted answer shows
                      // its grounding without a click; the rest stay collapsed.
                      defaultOpen={index === 0}
                    />
                  ))}
                </ul>
                {/* The answer-side mirror of the matrix's "See it in the
                    document": one link into the consolidated evidence split. */}
                <button
                  type="button"
                  onClick={() => setVerifyOpen(true)}
                  className="no-print inline-flex w-fit items-center font-mono text-xs text-forest transition-colors hover:text-forest-hover hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  Show evidence
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Zone pinned beneath both columns: the answer's own verdict. Approve or
          Flag the drafted response itself — separate from the requirement
          decision — with the self-writing audit line. A workspace control, so
          it stays off the printed response. */}
      {answer && !pending && !editing && (
        <AnswerDecisionZone
          answer={answer}
          currentUserId={user?.id}
          onApprove={() => approveAnswer(requirement.id)}
          onFlag={(note) => flagAnswer(requirement.id, note)}
          onReopen={() => reopenAnswer(requirement.id)}
        />
      )}

      {verifyOpen && (
        <AnswerEvidenceOverlay
          requirement={requirement}
          capabilityDocs={capabilityDocs}
          onClose={() => setVerifyOpen(false)}
        />
      )}
    </div>
  );
}

// Zone 4 for the answer: Approve leads as the one forest primary, then Flag
// (which reveals a note textarea in place), then Reopen once a verdict exists.
// The self-writing audit line sits above, factual and past tense. Mirrors the
// requirement DecisionZone's grammar at answer scale — and reads as the ANSWER's
// verdict ("Approve answer"), never re-approving the requirement.
function AnswerDecisionZone({
  answer,
  currentUserId,
  onApprove,
  onFlag,
  onReopen,
}: {
  answer: Answer;
  currentUserId?: string | null;
  onApprove: () => void;
  onFlag: (note: string) => void;
  onReopen: () => void;
}) {
  const [mode, setMode] = useState<"idle" | "flag">("idle");
  const [note, setNote] = useState("");
  const decision = answer.decision ?? null;
  const decided = decision !== null;
  const audit = answerAuditLine(answer, currentUserId);

  function submitFlag() {
    onFlag(note.trim());
    setNote("");
    setMode("idle");
  }

  return (
    <div className="no-print mt-4 flex flex-col gap-3 [border-top:var(--rule-hair)] pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-sm text-ink-muted">
          {answerStatusWord(answer, currentUserId)}
        </span>
        {audit && (
          <span className="font-mono text-xs text-ink-muted">{audit}</span>
        )}
      </div>

      {mode === "idle" ? (
        <div className="flex flex-wrap items-center gap-2">
          {decision?.verdict !== "approved" && (
            <button
              type="button"
              onClick={onApprove}
              className="bg-forest px-4 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
            >
              Approve answer
            </button>
          )}
          {decision?.verdict !== "flagged" && (
            <button
              type="button"
              onClick={() => {
                setNote(decision?.note ?? "");
                setMode("flag");
              }}
              className="px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Flag answer
            </button>
          )}
          {decided && (
            <button
              type="button"
              onClick={onReopen}
              className="px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Reopen
            </button>
          )}
        </div>
      ) : (
        <div className="flex max-w-[64ch] flex-col gap-2.5">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            autoFocus
            placeholder="Note why you are flagging this answer"
            className="w-full resize-none border border-hairline px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitFlag}
              className="bg-forest px-3.5 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
            >
              Save flag
            </button>
            <button
              type="button"
              onClick={() => {
                setNote("");
                setMode("idle");
              }}
              className="px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {decided &&
        decision.verdict === "flagged" &&
        decision.note &&
        mode === "idle" && (
          <p className="max-w-[64ch] text-sm leading-relaxed text-ink-muted">
            {decision.note}
          </p>
        )}
    </div>
  );
}

// The quiet status word for the answer verdict (copywriting.md lexicon),
// attributed to whoever decided. Undecided reads the honest current state of the
// draft, not a false "ready".
function answerStatusWord(
  answer: Answer,
  currentUserId?: string | null
): string {
  const decision = answer.decision ?? null;
  if (decision) {
    const who = actorLabel(decision.actor, currentUserId);
    return decision.verdict === "approved"
      ? `Answer approved by ${who}`
      : "Answer flagged";
  }
  if (answer.state === "needs_input") return "Answer still needs input";
  return "Ready for your sign-off";
}

// The self-writing audit line for the answer verdict — factual, past tense,
// naming who and when. Dry, no adjectives (copywriting.md).
function answerAuditLine(
  answer: Answer,
  currentUserId?: string | null
): string | null {
  const decision = answer.decision ?? null;
  if (!decision) return null;
  const who = actorLabel(decision.actor, currentUserId);
  const time = formatTime(decision.timestamp);
  return decision.verdict === "approved"
    ? `Answer approved by ${who}, ${time}.`
    : `Answer flagged by ${who}, ${time}.`;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// One evidence ref in the margin: a mono "Backed by your {doc}, p.{page}" line
// that expands in place to the verbatim excerpt it came from.
function EvidenceRefItem({
  doc,
  page,
  excerpt,
  defaultOpen = false,
}: {
  doc: string;
  page: number;
  excerpt: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <li className="font-mono text-xs leading-relaxed">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="text-left text-accent transition-colors hover:text-ink"
      >
        Backed by your {doc}, p.{page}
      </button>
      {/* Collapsed on screen until opened, but always shown in print so the
          exported PDF carries the verbatim citation. */}
      <p
        className={`mt-2 rounded bg-paper-recessed p-2.5 leading-relaxed text-accent shadow-[var(--depth-pressed)] ${
          open ? "" : "hidden print:block"
        }`}
      >
        &ldquo;{excerpt}&rdquo;
      </p>
    </li>
  );
}

// The edit affordance's glyph: a small pencil, stroke-drawn like the repo's
// other inline icons.
function PencilIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3 w-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m11.3 2.7 2 2L5 13l-2.7.7L3 11l8.3-8.3Z" />
      <path d="m9.8 4.2 2 2" />
    </svg>
  );
}
