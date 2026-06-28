"use client";

import { useRequirements } from "@/context/RequirementsContext";

export function GatingHero() {
  const { requirements } = useRequirements();
  const gating = requirements.filter((r) => r.is_gating);

  if (gating.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-signal-oxblood/30 bg-signal-oxblood/10 shadow-sm">
      <div className="flex items-start gap-3 border-b border-signal-oxblood/40 bg-signal-oxblood px-5 py-4 text-paper">
        <svg
          className="mt-0.5 h-6 w-6 shrink-0"
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
        <div>
          <h2 className="text-base font-bold leading-tight tracking-tight">
            {gating.length} deal-breaker{gating.length !== 1 ? "s" : ""} — miss
            any one and the bid is disqualified
          </h2>
          <p className="mt-0.5 text-sm text-paper/80">
            These are pass/fail gating requirements. Confirm each one before
            submission.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-signal-oxblood/15">
        {gating.map((req) => (
          <li
            key={req.id}
            className="flex items-start gap-2.5 px-5 py-3 text-sm text-ink"
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-oxblood"
              aria-hidden
            />
            <span className="leading-snug">
              {req.text}
              <span className="ml-2 text-xs font-medium text-ink-muted">
                p.{req.source_page} · {req.source_clause}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
