"use client";

import { useRequirements } from "@/context/RequirementsContext";
import { AnswerStateBadge } from "./AnswerStateBadge";
import { OpenQuestionItem } from "./OpenQuestions";

export function GapInterview() {
  const { requirements } = useRequirements();

  const withAnswer = requirements.filter((r) => r.answer);
  const drafted = withAnswer.length;
  const autoCount = withAnswer.filter((r) => r.answer?.state === "auto").length;
  const needsInputCount = withAnswer.filter(
    (r) => r.answer?.state === "needs_input"
  ).length;

  const groups = requirements
    .map((req) => ({ req, questions: req.open_questions ?? [] }))
    .filter((group) => group.questions.length > 0);

  const allQuestions = groups.flatMap((group) => group.questions);
  const total = allQuestions.length;
  const answered = allQuestions.filter((q) => q.answer !== null).length;
  const remaining = total - answered;
  const pct = total === 0 ? 100 : Math.round((answered / total) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Answers drafted" value={drafted} tone="neutral" />
        <StatCard label="Auto-drafted" value={autoCount} tone="forest" />
        <StatCard label="Need your input" value={needsInputCount} tone="amber" />
        <StatCard label="Gaps remaining" value={remaining} tone="amber" />
      </div>

      {total > 0 && (
        <div className="rounded-xl border border-hairline bg-paper-raised p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Gap interview</span>
            <span className="text-ink-muted">
              {answered} of {total} answered
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-forest transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-xl border border-forest/30 bg-forest/10 px-5 py-8 text-center">
          <p className="text-sm font-medium text-forest">
            All clear — no open questions.
          </p>
          <p className="mt-1 text-xs text-forest/80">
            Every drafted answer is fully grounded. Nothing needs your input
            right now.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {groups.map(({ req, questions }) => (
            <li
              key={req.id}
              className="rounded-xl border border-hairline bg-paper-raised p-4 shadow-sm"
            >
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                {req.is_gating && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-signal-oxblood px-2 py-0.5 text-xs font-semibold text-paper shadow-sm">
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Deal-breaker
                  </span>
                )}
                {req.answer && <AnswerStateBadge state={req.answer.state} />}
                <span className="font-mono text-xs text-ink-muted">
                  {req.category} · p.{req.source_page}
                </span>
              </div>
              <p className="mb-3 text-sm font-medium leading-snug text-ink">
                {req.text}
              </p>
              <ul className="flex flex-col gap-2.5">
                {questions.map((question) => (
                  <OpenQuestionItem
                    key={question.id}
                    requirementId={req.id}
                    question={question}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "forest" | "amber";
}) {
  const valueTone: Record<typeof tone, string> = {
    neutral: "text-ink",
    forest: "text-forest",
    amber: "text-signal-amber",
  };

  return (
    <div className="rounded-xl border border-hairline bg-paper-raised px-4 py-3 shadow-sm">
      <div className={`font-serif text-2xl font-semibold ${valueTone[tone]}`}>{value}</div>
      <div className="text-xs text-ink-muted">{label}</div>
    </div>
  );
}
