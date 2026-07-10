"use client";

import type { Requirement } from "@/types/requirement";
import { readinessOf, type ReadinessKey } from "@/lib/answers";
import { AnswerCard } from "./AnswerCard";

// The list of answer cards, already filtered and sorted by AnswersBody. Thin by
// design: it just maps the visible requirements to cards, with an honest empty
// state that distinguishes "a filter hid everything" from "there's genuinely
// nothing here".
//
// Unfiltered, the flat list also gets grouped into swim-lanes by readinessOf —
// the same four states the ReadinessLedger tallies (deal-breaker / needs-input
// / no-draft / ready) — so "what needs me vs what's ready" reads at a glance
// instead of one long scroll. An active filter is already a grouping, so we
// don't double it: filtered stays a flat list. Lanes are a stable partition of
// the incoming order, never a re-sort, so the weakest-first order (or document
// order) picked upstream survives within each lane.

const LANE_ORDER: ReadinessKey[] = [
  "deal-breaker",
  "needs-input",
  "no-draft",
  "ready",
];

const LANE_LABELS: Record<ReadinessKey, string> = {
  "deal-breaker": "Deal-breakers",
  "needs-input": "Needs input",
  "no-draft": "No draft",
  ready: "Ready",
};

export function AnswerWorkspace({
  requirements,
  filtered,
}: {
  requirements: Requirement[];
  // true when a filter is active, so the empty state reads correctly.
  filtered: boolean;
}) {
  if (requirements.length === 0) {
    return (
      <div className="max-w-[64ch]">
        <p className="text-sm font-medium text-ink">
          {filtered ? "No answers match this filter." : "No answers yet."}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {filtered
            ? "Clear the filter to see the full response."
            : "Upload a tender and draft your answers to get started."}
        </p>
      </div>
    );
  }

  if (filtered) {
    return (
      <ul className="flex flex-col">
        {requirements.map((req) => (
          <AnswerCard key={req.id} requirement={req} />
        ))}
      </ul>
    );
  }

  // Stable partition into lanes: one pass, each requirement appended to its
  // lane's bucket, so within a lane the incoming (weakest-first or document)
  // order is preserved exactly — this is a grouping, not a sort.
  const lanes = new Map<ReadinessKey, Requirement[]>();
  for (const req of requirements) {
    const key = readinessOf(req);
    const bucket = lanes.get(key);
    if (bucket) bucket.push(req);
    else lanes.set(key, [req]);
  }

  return (
    <div className="flex flex-col">
      {LANE_ORDER.map((key) => {
        const bucket = lanes.get(key);
        if (!bucket || bucket.length === 0) return null;
        return (
          <section key={key} aria-label={LANE_LABELS[key]}>
            <h3 className="mb-1 mt-4 border-b border-hairline pb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted first:mt-0">
              {LANE_LABELS[key]}{" "}
              <span
                className={key === "deal-breaker" ? "text-signal-oxblood" : undefined}
              >
                ({bucket.length})
              </span>
            </h3>
            <ul className="flex flex-col">
              {bucket.map((req) => (
                <AnswerCard key={req.id} requirement={req} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
