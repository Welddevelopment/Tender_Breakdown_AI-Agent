"use client";

import type { JobStatus } from "@/lib/api";
import { AnimatedNumber } from "./AnimatedNumber";
import styles from "./ProcessingView.module.css";

// The "watch it read your tender" processing view (#5). A staged, live-updating
// panel shown while a tender is extracted, so a 30–120s wait reads as
// sophisticated work rather than a frozen spinner. Driven entirely by the job
// status it is handed — the live polled job or the demo build's scripted replay,
// it cannot tell the difference: the bar tracks chunk completion, the counts
// tick up as requirements (and deal-breakers) are found, each stage lights up
// in turn, and the pipeline narrates itself through the job's message line.

const STEPS: { key: string; label: string }[] = [
  { key: "reading", label: "Read the document" },
  { key: "chunking", label: "Split into sections" },
  { key: "extract", label: "Extract the requirements" },
  { key: "reconcile", label: "Merge duplicates across sections" },
  { key: "graph", label: "Map award criteria, flag deal-breakers" },
  { key: "autofill", label: "Draft first answers from your evidence" },
];
const ORDER = STEPS.map((s) => s.key);

type StepState = "done" | "active" | "pending";

function stepState(index: number, current: number): StepState {
  if (index < current) return "done";
  if (index === current) return "active";
  return "pending";
}

export function ProcessingView({
  job,
  fileName,
  fileCount = 1,
  isArchive = false,
}: {
  job: JobStatus | null;
  fileName: string | null;
  fileCount?: number;
  isArchive?: boolean;
}) {
  const stage = job?.stage ?? "queued";
  // "queued" (-1) resolves to 0 so "reading" reads as active straight away; "done"
  // marks every step complete.
  const current =
    stage === "done" ? STEPS.length : Math.max(0, ORDER.indexOf(stage));
  const progress = Math.max(0, Math.min(1, job?.progress ?? 0.02));
  const found = job?.requirementCount ?? job?.rawCount;
  const dealBreakers = job?.dealBreakerCount;
  const isPack = fileCount > 1 || isArchive;
  const documentLabel = `${fileCount} document${fileCount === 1 ? "" : "s"}`;
  const title = isArchive
    ? "Reading zipped tender pack"
    : isPack
      ? `Reading ${documentLabel}`
      : "Reading your tender";

  return (
    <div className="surface-grain w-full max-w-xl rounded-xl border border-hairline bg-paper-raised p-6 shadow-[var(--depth-sheet)]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">
          {title}
        </h2>
        <span className="font-mono text-xs text-ink-muted">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <p
        className="mt-0.5 truncate font-mono text-xs text-ink-muted"
        title={fileName ?? undefined}
      >
        {isPack ? `${fileName ?? documentLabel} staged` : fileName}
        {job?.pageCount ? ` · ${job.pageCount} pages` : ""}
      </p>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-recessed shadow-[var(--depth-pressed)]">
        <div
          className="h-full rounded-full bg-forest transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(4, progress * 100)}%` }}
        />
      </div>

      {/* The pipeline narrating its own work — "Reading clause 4.2.1 on page
          14…" — so the wait reads as a machine leafing through the document. */}
      {job?.message && (
        <p aria-live="polite" className="mt-2 truncate font-mono text-xs text-ink-muted">
          {job.message}
        </p>
      )}

      {(found != null || (dealBreakers != null && dealBreakers > 0)) && (
        <p className="mt-3 text-sm text-ink">
          {found != null && (
            <>
              <AnimatedNumber value={found} from={0} className="font-semibold" />{" "}
              requirement
              {found === 1 ? "" : "s"} found
              {isPack
                ? ` across ${isArchive ? "the archive" : documentLabel}`
                : ""}
            </>
          )}
          {/* The deal-breaker count wears the two-tone alarm: oxblood figure
              inside an oxblood-frame edge, arriving under a one-shot ring flash
              the moment the first one is flagged. */}
          {dealBreakers != null && dealBreakers > 0 && (
            <>
              {" · "}
              <span
                className={`inline-flex items-baseline gap-1 rounded-full border border-signal-oxblood-frame/45 px-2 text-signal-oxblood ${styles.gateFlare}`}
              >
                <AnimatedNumber
                  value={dealBreakers}
                  from={0}
                  className="font-semibold"
                />
                deal-breaker{dealBreakers === 1 ? "" : "s"}
              </span>
            </>
          )}
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2.5">
        {STEPS.map((step, i) => {
          const s = stepState(i, current);
          return (
            <li key={step.key} className="flex items-center gap-2.5 text-sm">
              <StepIcon state={s} />
              <span className={s === "pending" ? "text-ink-muted" : "text-ink"}>
                {step.label}
                {step.key === "extract" && s === "active" && job?.chunkTotal ? (
                  <span className="ml-1.5 font-mono text-xs text-ink-muted">
                    section {job.chunkDone ?? 0} of {job.chunkTotal}
                  </span>
                ) : null}
                {step.key === "chunking" && s !== "pending" && job?.sectionCount ? (
                  <span className="ml-1.5 font-mono text-xs text-ink-muted">
                    {job.sectionCount} sections
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      // The check mounts the moment its step completes, so the module's
      // one-shot settle plays exactly once per step.
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center text-forest ${styles.stepSettle}`}
        aria-hidden
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2.5 7.5l3 3 6-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-hairline border-t-forest"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="h-4 w-4 shrink-0 rounded-full border border-hairline"
      aria-hidden
    />
  );
}
