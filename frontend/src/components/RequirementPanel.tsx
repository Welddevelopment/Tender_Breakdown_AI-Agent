"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import type { Requirement } from "@/types/requirement";
import { AnswerPanel } from "./AnswerPanel";
import { ApprovalStamp } from "./ApprovalStamp";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { CategoryTag } from "./CategoryTag";
import { useRequirements } from "@/context/RequirementsContext";
import { useAuth } from "@/context/AuthContext";
import { actorLabel } from "@/lib/collaborators";
import { tenderPdfPageUrl } from "@/lib/api";
import {
  hasPdfSource,
  requirementPdfUrl,
  sourceLocatorLabel,
  sourceRefLabel,
} from "@/lib/source-doc";
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

// "split" and "drawer" are the everyday registers; "focus" is the full-screen
// one-at-a-time review (FocusMode) — same zones, a wider measure, larger serif
// requirement text and more generous padding, plus e/f hotkeys into the note flow.
export type PanelVariant = "split" | "drawer" | "focus";

// Tailwind 4: every conditional class is a full literal string in a lookup map.
const BODY_PADDING: Record<PanelVariant, string> = {
  split: "flex-1 overflow-y-auto px-5 py-4 sm:px-6",
  drawer: "flex-1 overflow-y-auto px-5 py-4 sm:px-6",
  focus: "flex-1 overflow-y-auto px-6 py-8 sm:px-10 lg:px-14",
};

const REQUIREMENT_TEXT: Record<PanelVariant, string> = {
  split: "max-w-[64ch] text-base leading-relaxed text-ink",
  drawer: "max-w-[64ch] text-base leading-relaxed text-ink",
  focus: "max-w-[72ch] font-serif text-xl leading-relaxed text-ink sm:text-2xl",
};

// The two-column requirement split keys off the PANEL's width (@container),
// not the viewport: under projector zoom the split pane narrows while the
// viewport stays md+, which crushed the reading column to one word per line.
const REQUIREMENT_LAYOUT: Record<PanelVariant, string> = {
  split: "flex flex-col gap-4 @2xl:flex-row @2xl:gap-0",
  drawer: "flex flex-col gap-4",
  focus: "flex flex-col gap-4 @2xl:flex-row @2xl:gap-0",
};

const REQUIREMENT_COPY: Record<PanelVariant, string> = {
  split: "min-w-0 flex-1 @2xl:pr-8",
  drawer: "min-w-0",
  focus: "min-w-0 flex-1 @2xl:pr-8",
};

const REQUIREMENT_META: Record<PanelVariant, string> = {
  split:
    "flex min-w-0 flex-col gap-2 border-t border-hairline pt-4 @2xl:w-56 @2xl:shrink-0 @2xl:border-l @2xl:border-t-0 @2xl:pl-8 @2xl:pt-0",
  drawer: "flex min-w-0 flex-col gap-2 border-t border-hairline pt-4",
  focus:
    "flex min-w-0 flex-col gap-2 border-t border-hairline pt-4 @2xl:w-64 @2xl:shrink-0 @2xl:border-l @2xl:border-t-0 @2xl:pl-8 @2xl:pt-0",
};

const DECISION_PADDING: Record<PanelVariant, string> = {
  split: "border-t border-hairline bg-paper-raised px-5 py-4 sm:px-6",
  drawer: "border-t border-hairline bg-paper-raised px-5 py-4 sm:px-6",
  focus: "border-t border-hairline bg-paper-raised px-6 py-5 sm:px-10 lg:px-14",
};

const GATING_CONFIRM_TEXT = "CONFIRM";

interface RequirementPanelProps {
  requirement: Requirement;
  variant: PanelVariant;
  onApprove: (id: string) => void;
  onEdit: (id: string, note: string) => void;
  onFlag: (id: string, note: string) => void;
  onNext: () => void;
  onClose: () => void;
}

// The status word (copywriting.md lexicon), attributed to whoever made the decision — "you" when
// it was the signed-in user or unknown (legacy/frozen demo), else the collaborator's name.
function statusWord(req: Requirement, currentUserId?: string | null): string {
  const who = actorLabel(req.decision?.actor, currentUserId);
  switch (req.status) {
    case "accepted":
      return `Approved by ${who}`;
    case "edited":
      return `Edited by ${who}`;
    case "flagged":
      return "Flagged";
    default:
      return "Needs your eye";
  }
}

// The self-writing audit line, factual and past tense, from the recorded decision — now naming
// who made it (copywriting.md, the self-writing audit line). Dry, no adjectives.
function auditLine(req: Requirement, currentUserId?: string | null): string | null {
  if (!req.decision) return null;
  const time = formatTime(req.decision.timestamp);
  const who = actorLabel(req.decision.actor, currentUserId);
  switch (req.status) {
    case "accepted":
      return `Approved by ${who}, ${time}.`;
    case "edited":
      return `Edited by ${who}. The original draft is kept.`;
    case "flagged":
      return `Flagged by ${who}, ${time}.`;
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

function confidenceState(req: Requirement): string {
  if (req.needs_review || req.confidence < 0.55) return "Needs review";
  if (req.confidence < 0.7) return "Low confidence";
  if (req.confidence < 0.86) return "Fairly sure";
  return "Confident";
}

function flagReason(req: Requirement): string {
  const haystack = `${req.category} ${req.text} ${req.source_excerpt}`.toLowerCase();
  if (haystack.includes("insurance")) {
    return "This is a minimum insurance gate. If the bidder cannot meet it, the tender may fail before scoring.";
  }
  if (haystack.includes("deadline") || haystack.includes("returned by")) {
    return "This is a submission gate. A late or wrongly delivered tender can be rejected without evaluation.";
  }
  if (haystack.includes("pricing") || haystack.includes("not be scored")) {
    return "This is a pricing gate. The source says failure to confirm acceptance can remove the tender from scoring.";
  }
  if (
    haystack.includes("disqualified") ||
    haystack.includes("rejected") ||
    haystack.includes("not be accepted") ||
    haystack.includes("remove") ||
    haystack.includes("excluded")
  ) {
    return "The source uses rejection, exclusion, or removal language. Bidframe treats that as a deal-breaker for human sign-off.";
  }
  if (haystack.includes("pass/fail")) {
    return "This is marked Pass/Fail, so it must be checked before the bid team proceeds.";
  }
  return "This is mandatory and carries bid-risk language, so Bidframe surfaced it for human approval.";
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
  const { user } = useAuth(); // to render decisions as "you" vs a collaborator's name
  // Esc returns to the resting matrix. The drawer shell and the focus overlay
  // own their own Esc, so the panel only wires it up in the split where nothing
  // else does.
  useEffect(() => {
    if (variant !== "split") return;
    function onKeyDown(event: KeyboardEvent) {
      // defaultPrevented: a layered surface above the split (the command
      // palette's Radix dialog) already consumed this Escape — one Esc, one
      // close, top layer first.
      if (event.key === "Escape" && !event.defaultPrevented) onClose();
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
      className="surface-grain @container flex h-full max-h-full flex-col bg-paper-raised"
      style={{ "--grain": "0.14" } as React.CSSProperties}
    >
      <div className={BODY_PADDING[variant]}>
        <RequirementZone
          key={`req-${requirement.id}`}
          requirement={requirement}
          variant={variant}
        />

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
        variant={variant}
        requirement={requirement}
        statusWord={statusWord(requirement, user?.id)}
        audit={auditLine(requirement, user?.id)}
        approvedBy={actorLabel(requirement.decision?.actor, user?.id)}
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
function RequirementZone({
  requirement,
  variant,
}: {
  requirement: Requirement;
  variant: PanelVariant;
}) {
  const unanswerable = requirement.is_gating && requirement.status === "pending";
  const { tenderId } = useRequirements();
  const [verifyOpen, setVerifyOpen] = useState(false);
  // The source document to verify against: the live tender's PDF, or a static demo
  // copy. Null in the plain mock (no matching document) — the button hides then.
  const pdfUrl = requirementPdfUrl(tenderId, requirement);

  return (
    <Zone title="Requirement">
      <div className={REQUIREMENT_LAYOUT[variant]}>
        <div className={REQUIREMENT_COPY[variant]}>
          <p className={REQUIREMENT_TEXT[variant]}>{requirement.text}</p>
          <div className="mt-3">
            <ConfidenceIndicator
              confidence={requirement.confidence}
              needsReview={requirement.needs_review}
              unanswerable={unanswerable}
              variant="word"
            />
          </div>
        </div>

        <div className={REQUIREMENT_META[variant]}>
          {requirement.is_gating ? (
            <p className="font-mono text-xs text-ink-muted">
              Deal-breaker. Miss it and the bid is disqualified.
            </p>
          ) : requirement.type === "mandatory" ? (
            <p className="font-mono text-xs text-ink-muted">Mandatory.</p>
          ) : (
            <p className="font-mono text-xs text-ink-muted">Optional.</p>
          )}
          <CategoryTag category={requirement.category} className="w-fit" />
          <SourceRef requirement={requirement} />
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

      {requirement.is_gating && (
        <ExplainabilityBlock
          requirement={requirement}
          canVerify={Boolean(pdfUrl)}
          onVerify={() => setVerifyOpen(true)}
        />
      )}

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

function ExplainabilityBlock({
  requirement,
  canVerify,
  onVerify,
}: {
  requirement: Requirement;
  canVerify: boolean;
  onVerify: () => void;
}) {
  const evidenceCount = requirement.answer?.evidence_refs.length ?? 0;
  const source = sourceRefLabel(requirement);
  const next =
    requirement.status === "pending"
      ? canVerify
        ? "Open the source, inspect the evidence, then approve by name, edit the answer, or flag it for a colleague."
        : "Read the source excerpt, inspect the evidence, then approve by name, edit the answer, or flag it for a colleague."
      : "This decision is recorded. Reopen it if the source check changes your mind.";

  return (
    <div className="mt-4 max-w-[72ch] rounded-md border border-signal-oxblood-frame/35 bg-paper-recessed p-3 shadow-[var(--depth-pressed)]">
      <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-signal-oxblood">
        Why Bidframe flagged this
      </p>
      <dl className="mt-2 grid gap-2 text-sm leading-relaxed text-ink sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Why flagged
          </dt>
          <dd>{flagReason(requirement)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Source
          </dt>
          <dd>
            <span className="font-mono text-accent">{source}</span>
            {requirement.source_filename && (
              <span className="text-ink-muted"> · {requirement.source_filename}</span>
            )}
            {canVerify && (
              <button
                type="button"
                onClick={onVerify}
                className="ml-2 text-forest transition-colors hover:text-forest-hover hover:underline"
              >
                See it in the document
              </button>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Confidence state
          </dt>
          <dd>{confidenceState(requirement)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Evidence
          </dt>
          <dd>
            {evidenceCount > 0
              ? `${evidenceCount} bidder evidence citation${evidenceCount === 1 ? "" : "s"} linked below.`
              : "No bidder evidence linked."}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            User must decide next
          </dt>
          <dd>{next}</dd>
        </div>
      </dl>
    </div>
  );
}

// The source reference in the margin: a quiet mono line that expands in place
// to the verbatim excerpt the requirement was lifted from. PDF sources get the
// page link; Office/CSV sources stay excerpt-only.
function SourceRef({ requirement }: { requirement: Requirement }) {
  const { tenderId } = useRequirements();
  const [open, setOpen] = useState(false);
  const ref = sourceRefLabel(requirement);
  const locator = sourceLocatorLabel(requirement);
  // With a live tender loaded, link to the original PDF (the right document in the
  // pack) opened at this page.
  const pdfUrl =
    tenderId && hasPdfSource(requirement)
      ? tenderPdfPageUrl(
          tenderId,
          requirement.source_page,
          requirement.source_doc_id ?? null
        )
      : "";

  return (
    <div className="font-mono text-xs leading-relaxed">
      {requirement.source_filename && (
        <p className="truncate text-accent/70" title={requirement.source_filename}>
          {requirement.source_filename}
        </p>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        title={locator}
        className="text-left text-accent transition-colors hover:text-ink"
      >
        {ref}
      </button>
      {open && requirement.source_excerpt && (
        <p className="mt-2 rounded bg-paper-recessed p-2.5 leading-relaxed text-accent shadow-[var(--depth-pressed)]">
          &ldquo;{requirement.source_excerpt}&rdquo;
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
  const { answerOpenQuestion } = useRequirements();
  const [answerText, setAnswerText] = useState("");
  const open = (requirement.open_questions ?? []).filter((q) => !q.answer);
  const current = open[0] ?? null;

  function saveAnswer() {
    const trimmed = answerText.trim();
    if (!trimmed || !current) return;
    answerOpenQuestion(requirement.id, current.id, trimmed);
    setAnswerText("");
  }

  return (
    <div className="flex max-w-[64ch] flex-col gap-3">
      <div className="rounded-md border border-signal-amber/50 bg-paper-recessed p-3 shadow-[var(--depth-pressed)]">
        <p className="text-sm leading-relaxed text-ink">
          Bidframe did not draft this because no evidence was found.
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-signal-amber">
          It asks instead of inventing.
        </p>
      </div>

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
          The open question has been answered. Review the requirement, then
          approve, edit, or flag it.
        </p>
      )}

      {current && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`gap-${current.id}`}
            className="font-mono text-[11px] uppercase tracking-wide text-ink-muted"
          >
            Your answer
          </label>
          <textarea
            id={`gap-${current.id}`}
            value={answerText}
            onChange={(event) => setAnswerText(event.target.value)}
            rows={3}
            placeholder="Answer the missing evidence question"
            className="w-full resize-none border border-hairline bg-paper px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-ink-muted">
              {open.length === 1 ? "Last question" : `${open.length} questions remaining`}
            </span>
            <button
              type="button"
              onClick={saveAnswer}
              disabled={answerText.trim().length === 0}
              className="bg-forest px-3.5 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover disabled:cursor-not-allowed disabled:bg-ink-muted/40 disabled:text-paper/70"
            >
              Save answer
            </button>
          </div>
        </div>
      )}

      {current && (
        <Link
          href={`/answers#${current.id}`}
          className="text-sm text-forest transition-colors hover:text-forest-hover hover:underline"
        >
          Answer this in the gap review
        </Link>
      )}
    </div>
  );
}

// Zone 4, pinned to the bottom: the decision. Approve leads as the one forest
// primary, then Edit, then Flag. Edit and Flag reveal a note textarea in place.
// A gating item asks for a typed confirm before it is approved. The self-writing
// audit line sits in the mono footer once a decision is recorded.
function DecisionZone({
  requirement,
  variant,
  statusWord,
  audit,
  approvedBy,
  onApprove,
  onEdit,
  onFlag,
  onNext,
  onClose,
}: {
  requirement: Requirement;
  variant: PanelVariant;
  statusWord: string;
  audit: string | null;
  approvedBy: string;
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
  const [confirmText, setConfirmText] = useState("");
  const confirmInputId = useId();
  const confirmHelpId = useId();
  const resolved = requirement.status !== "pending";
  const confirmReady = confirmText === GATING_CONFIRM_TEXT;

  // In focus mode, e / f drop straight into the note flow (the textarea then
  // autofocuses and owns the keyboard). Elsewhere the matrix-level handler
  // routes e / f by opening the panel, so only "focus" wires these.
  useEffect(() => {
    if (variant !== "focus") return;
    function onKey(event: KeyboardEvent) {
      const el = event.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "e") {
        event.preventDefault();
        setConfirmingGating(false);
        setConfirmText("");
        setNote(requirement.decision?.note ?? "");
        setMode("edit");
      } else if (event.key === "f") {
        event.preventDefault();
        setConfirmingGating(false);
        setConfirmText("");
        setNote("");
        setMode("flag");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [variant, requirement]);

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
      setConfirmText("");
      return;
    }
    if (requirement.is_gating && !confirmReady) return;
    setConfirmingGating(false);
    setConfirmText("");
    onApprove(requirement.id);
  }

  function submitGatingConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleApprove();
  }

  function cancelGatingConfirm() {
    setConfirmingGating(false);
    setConfirmText("");
  }

  return (
    <div className={DECISION_PADDING[variant]}>
      {/* Current decision. Approval stamps the sheet (design-language device 6);
          every other status keeps the quiet word plus its mono audit line. */}
      <div className="mb-3 flex items-baseline justify-between gap-4">
        {requirement.status === "accepted" && requirement.decision ? (
          <ApprovalStamp by={approvedBy} time={formatTime(requirement.decision.timestamp)} />
        ) : (
          <>
            <span className="text-sm text-ink-muted">{statusWord}</span>
            {audit && (
              <span className="font-mono text-xs text-ink-muted">{audit}</span>
            )}
          </>
        )}
      </div>

      {mode === "idle" ? (
        <>
          {requirement.is_gating && confirmingGating && (
            <form
              onSubmit={submitGatingConfirm}
              className="mb-3 max-w-[64ch] rounded-md border border-signal-oxblood-frame/35 bg-paper-recessed p-3 shadow-[var(--depth-pressed)]"
            >
              <label
                htmlFor={confirmInputId}
                className="block text-sm leading-relaxed text-ink"
              >
                Type{" "}
                <span className="font-mono font-semibold text-signal-oxblood">
                  {GATING_CONFIRM_TEXT}
                </span>{" "}
                to approve this deal-breaker requirement by name.
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id={confirmInputId}
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={confirmHelpId}
                  className="min-w-0 flex-1 border border-hairline bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest"
                />
                <button
                  type="submit"
                  disabled={!confirmReady}
                  className="bg-forest px-3.5 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover disabled:cursor-not-allowed disabled:bg-ink-muted/40 disabled:text-paper/70"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={cancelGatingConfirm}
                  className="px-3.5 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  Cancel
                </button>
              </div>
              <p
                id={confirmHelpId}
                className="mt-2 font-mono text-[11px] leading-relaxed text-ink-muted"
              >
                Approval stays locked until the entry exactly matches{" "}
                {GATING_CONFIRM_TEXT}.
              </p>
            </form>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!confirmingGating && (
              <button
                type="button"
                onClick={handleApprove}
                className="bg-forest px-4 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
              >
                {requirement.is_gating ? "Inspect source before approving" : "Approve"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                cancelGatingConfirm();
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
                cancelGatingConfirm();
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
        </>
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
