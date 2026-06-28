"use client";

import { useState } from "react";
import type { OpenQuestion, Requirement } from "@/types/requirement";
import { useRequirements } from "@/context/RequirementsContext";

export function OpenQuestions({ requirement }: { requirement: Requirement }) {
  const questions = requirement.open_questions ?? [];
  if (questions.length === 0) return null;

  const unanswered = questions.filter((q) => q.answer === null).length;

  return (
    <section className="mt-5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
          Open questions
        </h3>
        {unanswered > 0 && (
          <span className="inline-flex items-center rounded-full bg-signal-amber/15 px-2 py-0.5 text-[11px] font-medium text-signal-amber">
            {unanswered} need{unanswered === 1 ? "s" : ""} an answer
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2.5">
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
  const { answerOpenQuestion } = useRequirements();
  const [value, setValue] = useState(question.answer ?? "");
  const answered = question.answer !== null;
  const trimmed = value.trim();
  const dirty = trimmed.length > 0 && trimmed !== (question.answer ?? "");

  return (
    <li
      className={`rounded-lg border px-3 py-2.5 ${
        answered
          ? "border-forest/30 bg-forest/5"
          : "border-signal-amber/30 bg-signal-amber/10"
      }`}
    >
      <div className="flex items-start gap-2">
        {answered ? (
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-forest"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span
            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-signal-amber"
            aria-hidden
          />
        )}
        <p className="text-sm leading-snug text-ink">
          {question.question}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type the answer…"
          className="min-w-0 flex-1 rounded-md border border-hairline px-2.5 py-1.5 text-sm text-ink shadow-sm outline-none focus:border-forest focus:ring-1 focus:ring-forest"
        />
        <button
          type="button"
          disabled={!dirty}
          onClick={() =>
            answerOpenQuestion(requirementId, question.id, trimmed)
          }
          className="shrink-0 rounded-md bg-forest px-3 py-1.5 text-sm font-medium text-paper shadow-sm transition-colors hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {answered ? "Update" : "Save"}
        </button>
      </div>
    </li>
  );
}
