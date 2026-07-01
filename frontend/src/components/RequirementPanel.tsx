"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Requirement, RequirementStatus } from "@/types/requirement";
import { AnswerPanel } from "./AnswerPanel";
import { ApprovalStamp } from "./ApprovalStamp";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { useRequirements } from "@/context/RequirementsContext";
import { sourceDocUrl, tenderPdfPageUrl } from "@/lib/api";
import { SourceVerifyOverlay } from "./SourceVerifyOverlay";

// The open-state panel internals (layout.md section 6). One sheet on a
// paper-raised surface, read top to bottom, flat zones separated by hairlines:
// requirement, drafted answer (with its evidence), decision. The body prose
// stays in a 64ch reading column; everything machine-ish (source refs, page
// numbers, the self-writing audit line) runs down the mono margin. The decision
// controls and the audit line are pinned to the bottom.
//
// B2 owns the internals; the prop shape is B1's contract and is rendered the
// same way by both the split (variant "split") and the drawer fallback
// (variant "drawer").

interface RequirementPanelProps {
  requirement: Requirement;
  variant: "split" | "drawer";
  onApprove: (id: string) => void;
  onEdit: (id: string, note: string) => void;
  onFlag: (id: string, note: string) => void;
  onNext: () => void;
  onClose: () => void;
}

// The status word, from the decision-status lexicon (copywriting.md).
const STATUS_WORD: Record<RequirementStatus, string> = {
  pending: "Needs your eye",
  accepted: "Approved by you",
  edited: "Edited by you",
  flagged: "Flagged",
};

// The self-writing audit line, factual and past tense, from the recorded
// decision (copywriting.md, the self-writing audit line). Dry, no adjectives.
function auditLine(req: Requirement): string | null {
  if (!req.decision) return null;
  const time = formatTime(req.decision.timestamp);
  switch (req.status) {
    case "accepted":
      return `Approved by you, ${time}.`;
    case "edited":
      return "Edited by you. The original draft is kept.";
    case "flagged":
      return `Flagged by you, ${time}.`;
    default:
      return null;
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RequirementPanel({
  requirement,
  variant,
  onApprove,
  onEdit,
  onFlag,
  onNext,
  onClose,
}: RequirementPanelProps) {
  // Esc returns to the resting matrix. The drawer shell owns its own Esc, so the
  // panel only wires it up in the split where nothing else does.
  useEffect(() => {
    if (variant !== "split") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [variant, onClose]);

  const needsInput =
    requirement.answer?.state === "needs_input" ||
    (requirement.open_questions?.some((q) => !q.answer) ?? false);

  // In the split, B1 moves the panel between items without re-keying it, so the
  // stateful zones (form notes, expanded source/evidence) are keyed by the
  // requirement id to reset per item. The drawer already keys the whole panel.
  return (
    <div
      className="surface-grain flex h-full max-h-full flex-col bg-paper-raised"
      style={{ "--grain": "0.14" } as React.CSSProperties}
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        <RequirementZone key={`req-${requirement.id}`} requirement={requirement} />

        <Zone title="Drafted answer">
          {needsInput ? (
            <NeedsInputNotice requirement={requirement} />
          ) : (
            <AnswerPanel key={`ans-${requirement.id}`} requirement={requirement} />
          )}
        </Zone>
      </div>

      <DecisionZone
        key={`dec-${requirement.id}`}
        requirement={requirement}
        statusWord={STATUS_WORD[requirement.status]}
        audit={auditLine(requirement)}
        onApprove={onApprove}
        onEdit={onEdit}
        onFlag={onFlag}
        onNext={onNext}
        onClose={onClose}
      />
    </div>
  );
}

// A flat zone, separated from the one above it by a single hairline (layout.md
// section 7: hairlines divide kinds of content). The label is set in the quiet
// mono margin style so it reads as the document talking, not a heading.
function Zone({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 font-mono text-[12.5px] font-medium uppercase tracking-wide text-ink-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

// Zone 1: the requirement itself. The text carries the reading column on the
// left; the gating/mandatory marker and the source ref (page and clause, with
// the verbatim excerpt one expand away) run down the mono margin on the right.
function RequirementZone({ requirement }: { requirement: Requirement }) {
  const unanswerable = requirement.is_gating && requirement.status === "pending";
  const { tenderId } = useRequirements();
  const [verifyOpen, setVerifyOpen] = useState(false);
  // The source document to verify against: the live tender's PDF, or a static demo
  // copy. Null in the plain mock (no matching document) — the button hides then.
  const pdfUrl = sourceDocUrl({
    tenderId,
    docId: requirement.source_doc_id ?? null,
    filename: requirement.source_filename ?? null,
  });

  return (
    <Zone title="Requirement">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-0">
        <div className="min-w-0 flex-1 sm:pr-8">
          <p className="max-w-[64ch] text-base leading-relaxed text-ink">
            {requirement.text}
          </p>
          <div className="mt-3">
            <ConfidenceIndicator
              confidence={requirement.confidence}
              needsReview={requirement.needs_review}
              unanswerable={unanswerable}
              variant="word"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:w-56 sm:border-l sm:border-hairline sm:pl-8">
          {requirement.is_gating ? (
            <p className="font-mono text-xs text-ink-muted">
              Deal-breaker. Miss it and the bid is disqualified.
            </p>
          ) : requirement.type === "mandatory" ? (
            <p className="font-mono text-xs text-ink-muted">Mandatory.</p>
          ) : (
            <p className="font-mono text-xs text-ink-muted">Optional.</p>
          )}
          <SourceRef
            page={requirement.source_page}
            clause={requirement.source_clause}
            excerpt={requirement.source_excerpt}
            docId={requirement.source_doc_id ?? null}
            filename={requirement.source_filename ?? null}
          />
          {pdfUrl && (
            <button
              type="button"
              onClick={() => setVerifyOpen(true)}
              className="inline-flex w-fit items-center font-mono text-xs text-forest transition-colors hover:text-forest-hover hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
            >
              See it in the document
            </button>
          )}
        </div>
      </div>

      {verifyOpen && (
        <SourceVerifyOverlay
          requirement={requirement}
          pdfUrl={pdfUrl}
          onClose={() => setVerifyOpen(false)}
        />
      )}
    </Zone>
  );
}

// The source reference in the margin: a quiet mono "p.14, Section 4.2.1" line
// that expands in place to the verbatim excerpt the requirement was lifted from.
function SourceRef({
  page,
  clause,
  excerpt,
  docId,
  filename,
}: {
  page: number;
  clause: string | null;
  excerpt: string;
  docId?: string | null;
  filename?: string | null;
}) {
  const { tenderId } = useRequirements();
  const [open, setOpen] = useState(false);
  const ref = clause ? `p.${page}, ${clause}` : `p.${page}`;
  // With a live tender loaded, link to the original PDF (the right document in the
  // pack) opened at this page.
  const pdfUrl = tenderId ? tenderPdfPageUrl(tenderId, page, docId) : "";

  return (
    <div className="font-mono text-xs leading-relaxed">
      {filename && (
        <p className="truncate text-ink-muted/70" title={filename}>
          {filename}
        </p>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="text-left text-ink-muted transition-colors hover:text-ink"
      >
        {ref}
      </button>
      {open && excerpt && (
        <p className="mt-2 rounded bg-paper-recessed p-2.5 leading-relaxed text-ink-muted shadow-[var(--depth-pressed)]">
          &ldquo;{excerpt}&rdquo;
        </p>
      )}
      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-forest transition-colors hover:text-forest-hover hover:underline"
        >
          Open the page
        </a>
      )}
    </div>
  );
}

// Needs-you items are not answered inline in the panel: the gap belongs in the
// /answers gap pass (layout.md section 6). Show the open question read-only with
// a single link there rather than an editor, so the gap review stays the one
// place an answer is supplied.
function NeedsInputNotice({ requirement }: { requirement: Requirement }) {
  const open = (requirement.open_questions ?? []).filter((q) => !q.answer);

  return (
    <div className="flex max-w-[64ch] flex-col gap-3">
      {open.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {open.map((question) => (
            <li
              key={question.id}
              className="flex items-baseline gap-2 text-sm leading-snug text-ink"
            >
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal-amber"
                aria-hidden
              />
              <span>{question.question}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-ink-muted">
          This one needs an answer from you before it can be drafted.
        </p>
      )}
      <Link
        href={`/answers#${open[0]?.id ?? ""}`}
        className="text-sm text-forest transition-colors hover:text-forest-hover hover:underline"
      >
        Answer this in the gap review
      </Link>
    </div>
  );
}

// Zone 4, pinned to the bottom: the decision. Approve leads as the one forest
// primary, then Edit, then Flag. Edit and Flag reveal a note textarea in place.
// A gating item asks for a named confirm before it is approved. The self-writing
// audit line sits in the mono footer once a decision is recorded.
function DecisionZone({
  requirement,
  statusWord,
  audit,
  onApprove,
  onEdit,
  onFlag,
  onNext,
  onClose,
}: {
  requirement: Requirement;
  statusWord: string;
  audit: string | null;
  onApprove: (id: string) => void;
  onEdit: (id: string, note: string) => void;
  onFlag: (id: string, note: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const { reopen } = useRequirements();
  const [mode, setMode] = useState<"idle" | "edit" | "flag">("idle");
  const [note, setNote] = useState("");
  const [confirmingGating, setConfirmingGating] = useState(false);
  const resolved = requirement.status !== "pending";

  function submitEdit() {
    onEdit(requirement.id, note.trim());
    setNote("");
    setMode("idle");
  }

  function submitFlag() {
    onFlag(requirement.id, note.trim());
    setNote("");
    setMode("idle");
  }

  function handleApprove() {
    if (requirement.is_gating && !confirmingGating) {
      setConfirmingGating(true);
      return;
    }
    setConfirmingGating(false);
    onApprove(requirement.id);
  }

  return (
    <div className="border-t border-hairline bg-paper-raised px-5 py-4 sm:px-6">
      {/* Current decision. Approval stamps the sheet (design-language device 6);
          every other status keeps the quiet word plus its mono audit line. */}
      <div className="mb-3 flex items-baseline justify-between gap-4">
        {requirement.status === "accepted" && requirement.decision ? (
          <ApprovalStamp time={formatTime(requirement.decision.timestamp)} />
        ) : (
          <>
            <span className="text-sm text-ink-muted">{statusWord}</span>
            {audit && (
              <span className="font-mono text-xs text-ink-muted">{audit}</span>
            )}
          </>
        )}
      </div>

      {requirement.is_gating && confirmingGating && mode === "idle" && (
        <p className="mb-3 max-w-[64ch] text-sm leading-relaxed text-ink">
          This is a deal-breaker requirement. Confirm your answer is accurate.
        </p>
      )}

      {mode === "idle" ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleApprove}
            className="bg-forest px-4 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
          >
            {requirement.is_gating && confirmingGating
              ? "Confirm approve"
              : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmingGating(false);
              setNote(requirement.decision?.note ?? "");
              setMode("edit");
            }}
            className="px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmingGating(false);
              setNote("");
              setMode("flag");
            }}
            className="px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Flag
          </button>
          {resolved && (
            <button
              type="button"
              onClick={() => reopen(requirement.id)}
              className="px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Reopen
            </button>
          )}
          <span className="ml-auto flex items-center gap-3">
            {confirmingGating && (
              <button
                type="button"
                onClick={() => setConfirmingGating(false)}
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Next
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Close
            </button>
          </span>
        </div>
      ) : (
        <div className="flex max-w-[64ch] flex-col gap-2.5">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            autoFocus
            placeholder={
              mode === "edit"
                ? "Note what you changed and why"
                : "Note why you are flagging this"
            }
            className="w-full resize-none border border-hairline px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={mode === "edit" ? submitEdit : submitFlag}
              className="bg-forest px-3.5 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
            >
              {mode === "edit" ? "Save edit" : "Save flag"}
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

      {resolved && requirement.decision?.note && mode === "idle" && (
        <p className="mt-3 max-w-[64ch] text-sm leading-relaxed text-ink-muted">
          {requirement.decision.note}
        </p>
      )}
    </div>
  );
}
