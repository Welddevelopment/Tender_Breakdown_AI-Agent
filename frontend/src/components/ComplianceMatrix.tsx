import type { Requirement, RequirementStatus } from "@/types/requirement";
import { ConfidenceIndicator } from "./ConfidenceIndicator";

interface ComplianceMatrixProps {
  requirements: Requirement[];
}

function StatusBadge({ status }: { status: RequirementStatus }) {
  const styles: Record<RequirementStatus, string> = {
    pending: "bg-slate-100 text-slate-600 ring-slate-200",
    accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    edited: "bg-blue-50 text-blue-700 ring-blue-200",
    flagged: "bg-red-50 text-red-700 ring-red-200",
  };

  const labels: Record<RequirementStatus, string> = {
    pending: "Pending",
    accepted: "Accepted",
    edited: "Edited",
    flagged: "Flagged",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function TypeBadge({
  type,
  isGating,
}: {
  type: Requirement["type"];
  isGating: boolean;
}) {
  if (isGating) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
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
    );
  }

  if (type === "mandatory") {
    return (
      <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-inset ring-orange-200">
        Mandatory
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      Optional
    </span>
  );
}

function rowClasses(req: Requirement): string {
  const base = "border-b border-slate-200 transition-colors";

  if (req.is_gating) {
    return `${base} bg-red-50/80 hover:bg-red-50 border-l-4 border-l-red-500`;
  }

  if (req.needs_review) {
    return `${base} bg-amber-50/60 hover:bg-amber-50 border-l-4 border-l-amber-400 border-dashed`;
  }

  if (req.type === "mandatory") {
    return `${base} hover:bg-slate-50 border-l-4 border-l-orange-300`;
  }

  return `${base} hover:bg-slate-50 border-l-4 border-l-transparent`;
}

export function ComplianceMatrix({ requirements }: ComplianceMatrixProps) {
  const gatingCount = requirements.filter((r) => r.is_gating).length;
  const reviewCount = requirements.filter((r) => r.needs_review).length;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>
          <strong className="text-slate-900">{requirements.length}</strong>{" "}
          requirements
        </span>
        {gatingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
            {gatingCount} deal-breaker{gatingCount !== 1 ? "s" : ""}
          </span>
        )}
        {reviewCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            {reviewCount} need{reviewCount !== 1 ? "" : "s"} human review
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Requirement</th>
              <th className="px-4 py-3 w-32">Type</th>
              <th className="px-4 py-3 w-36">Source</th>
              <th className="px-4 py-3 w-36">Confidence</th>
              <th className="px-4 py-3 w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => (
              <tr key={req.id} className={rowClasses(req)}>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1.5">
                    <p
                      className={`leading-snug ${req.is_gating ? "font-semibold text-red-900" : req.needs_review ? "text-amber-900" : "text-slate-800"}`}
                    >
                      {req.text}
                    </p>
                    {req.needs_review && (
                      <span className="inline-flex w-fit items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Tool is unsure — verify manually
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{req.category}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <TypeBadge type={req.type} isGating={req.is_gating} />
                </td>
                <td className="px-4 py-3.5 align-top">
                  <div className="text-slate-700">
                    <span className="font-medium">p.{req.source_page}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {req.source_clause}
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <ConfidenceIndicator
                    confidence={req.confidence}
                    needsReview={req.needs_review}
                  />
                </td>
                <td className="px-4 py-3.5 align-top">
                  <StatusBadge status={req.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
