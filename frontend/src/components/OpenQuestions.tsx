"use client";

import { toast } from "sonner";
import type { OpenQuestion, Requirement } from "@/types/requirement";
import { useRequirements } from "@/context/RequirementsContext";
import { isApiEnabled, patchAnswer } from "@/lib/api";

const GAP_SAVE_FAILED =
  "Couldn't save that to the server. It shows here, but may not have been kept. Check your connection, then redo it.";

export function OpenQuestions({ requirement }: { requirement: Requirement }) {
  const questions = requirement.open_questions ?? [];
  if (questions.length === 0) return null;

  const answered = questions.filter((q) => q.answer !== null).length;
  const unanswered = questions.length - answered;

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
          Open questions
        </h3>
        {/* Partial progress stays visible: "1 of 3 answered", amber while any
            gap still needs the human, quiet once they're all in. */}
        <span
          className={`font-mono text-xs ${
            unanswered > 0 ? "text-signal-amber" : "text-ink-muted"
          }`}
        >
          {answered} of {questions.length} answered
        </span>
      </div>
      <ul className="flex flex-col gap-4">
        {questions.map((question) => (
          <OpenQuestionItem
            key={question.id}
            requirementId={requirement.id}
            question={question}
          />
        ))}
      </ul>
    </section>
  );
}

export function OpenQuestionItem({
  requirementId,
  question,
}: {
  requirementId: string;
  question: OpenQuestion;
}) {
  const {
    answerOpenQuestion,
    requirements,
    updateRequirement,
    gapDrafts,
    setGapDraft,
    clearGapDraft,
  } = useRequirements();
  // The live value is the in-progress draft when one exists (held in context so a
  // half-typed answer survives the panel collapsing), otherwise the saved answer.
  const draft = gapDrafts[question.id];
  const value = draft ?? question.answer ?? "";
  const answered = question.answer !== null;
  const trimmed = value.trim();
  const dirty = trimmed.length > 0 && trimmed !== (question.answer ?? "");
  const requirement = requirements.find((req) => req.id === requirementId);

  function saveAnswer() {
    if (!requirement) {
      answerOpenQuestion(requirementId, question.id, trimmed);
      clearGapDraft(question.id);
      toast("Answer saved", {
        description: "The draft notes your input for review.",
      });
      return;
    }

    const nextQuestions = (requirement.open_questions ?? []).map((q) =>
      q.id === question.id
        ? { ...q, answer: trimmed, answered_at: new Date().toISOString() }
        : q
    );
    const answeredCount = nextQuestions.filter((q) => q.answer !== null).length;
    const allAnswered = answeredCount === nextQuestions.length;
    const baseText =
      requirement.answer?.text ??
      requirement.draft_answer ??
      "Draft answer ready for review.";
    const answerText =
      allAnswered && !baseText.includes(trimmed)
        ? `${baseText}\n\nBid team input: ${trimmed}`
        : baseText;

    updateRequirement(requirementId, {
      open_questions: nextQuestions,
      draft_answer: allAnswered ? answerText : requirement.draft_answer,
      answer: requirement.answer
        ? {
            ...requirement.answer,
            text: answerText,
            state: allAnswered ? "human_edited" : requirement.answer.state,
            confidence: allAnswered
              ? Math.max(requirement.answer.confidence, 0.7)
              : requirement.answer.confidence,
          }
        : requirement.answer,
    });
    // The answer now lives on the question — drop the in-progress draft.
    clearGapDraft(question.id);

    // Persist server-side (best-effort): the gap answers, plus the merged answer
    // text/state when this input closed the last gap. localStorage still holds it
    // regardless; this is what makes it survive across devices / reach teammates.
    if (isApiEnabled()) {
      patchAnswer(requirementId, {
        open_questions: nextQuestions.map((q) => ({
          id: q.id,
          answer: q.answer,
          answered_at: q.answered_at,
        })),
        ...(requirement.answer
          ? {
              text: answerText,
              state: allAnswered
                ? ("human_edited" as const)
                : requirement.answer.state,
              confidence: allAnswered
                ? Math.max(requirement.answer.confidence, 0.7)
                : requirement.answer.confidence,
            }
          : {}),
      }).catch(() => toast.error(GAP_SAVE_FAILED));
    }

    // Confirmation rides the app's toaster (restyled sonner) rather than an
    // inline line, and reports honest per-requirement progress.
    toast("Answer saved", {
      description: allAnswered
        ? "All gaps closed — your input is merged into the draft for review."
        : `${answeredCount} of ${nextQuestions.length} answered for this requirement.`,
    });
  }

  return (
    <li id={question.id} className="scroll-mt-24">
      {/* The answered/unanswered distinction is carried by a quiet dot plus a
          word and whitespace, not a full coloured card. */}
      <div className="flex items-baseline gap-2">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
            answered ? "bg-forest" : "bg-signal-amber"
          }`}
          aria-hidden
        />
        <p className="max-w-[64ch] text-sm leading-snug text-ink">
          {question.question}
        </p>
        <span
          className={`shrink-0 text-xs ${
            answered ? "text-ink-muted" : "text-signal-amber"
          }`}
        >
          {answered ? "Answered" : "Needs your input"}
        </span>
      </div>
      <div className="mt-2 flex items-start gap-2 pl-4">
        <textarea
          value={value}
          onChange={(event) => setGapDraft(question.id, event.target.value)}
          placeholder="Type your answer"
          rows={answered || value.includes("\n") ? 3 : 2}
          className="min-w-0 flex-1 resize-y rounded-md border border-hairline px-2.5 py-1.5 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest"
        />
        <button
          type="button"
          disabled={!dirty}
          onClick={saveAnswer}
          className="shrink-0 rounded-md bg-forest px-3 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {answered ? "Update" : "Save"}
        </button>
      </div>
    </li>
  );
}
