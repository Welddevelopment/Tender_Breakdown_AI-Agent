import type { ExportBlockerKind, ExportReadiness } from "@/lib/export-readiness";

// The honest read shown before any export starts (QA.md: blockers appear before
// export; export never implies readiness while deal-breakers or gaps remain).
// Record-led: a mono label, a count of real things (never a score), each blocker
// carried by a dot plus a word so it survives the greyscale test — colour is
// reinforcement, not the signal. No forest decoration; forest is earned only by
// the "nothing outstanding" state.

const BLOCKER_TONE: Record<ExportBlockerKind, "oxblood" | "amber"> = {
  "deal-breaker": "oxblood",
  "blocker-comment": "oxblood",
  flagged: "oxblood",
  gap: "amber",
  unapproved: "amber",
  "no-draft": "amber",
  unbacked: "amber",
};

export function ExportReadinessSummary({
  readiness,
}: {
  readiness: ExportReadiness;
}) {
  const { total, approved, blockers } = readiness;

  return (
    <div className="[border-bottom:var(--rule-hair)] px-3 pb-3 pt-2">
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        Export readiness
      </p>
      <p className="mt-1 text-sm text-ink">
        {approved} of {total} answer{total === 1 ? "" : "s"} approved.
      </p>

      {blockers.length === 0 ? (
        <p className="mt-1.5 text-sm text-forest">
          Nothing outstanding. This can go out as a client-ready pack.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {blockers.map((blocker) => (
            <li key={blocker.kind} className="flex gap-2">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-1 ring-ink/25 ${
                  BLOCKER_TONE[blocker.kind] === "oxblood"
                    ? "bg-signal-oxblood"
                    : "bg-signal-amber"
                }`}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="text-sm text-ink">{blocker.label}.</span>{" "}
                <span className="text-sm leading-snug text-ink-muted">
                  {blocker.prompt}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
