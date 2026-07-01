"use client";

import type { GroupKey } from "@/lib/triage";
import { useRequirements } from "@/context/RequirementsContext";
import { AccountMenu } from "./AccountMenu";
import { SectionNav } from "./SectionNav";

// The document header (layout.md section 2; design-language section 1: the
// masthead). A thin nameplate, not a marketing bar. The title zone stacks the
// running head "BIDFRAME", the section switcher, the tender title in Fraunces,
// and a reference line in mono drawn from real tender metadata (the requirement
// count, and the tender id when a live tender is loaded, never an invented
// reference). Centre is the triage line: three in-page filters for the worklist
// groups. Right is exactly one primary action, Next. Beneath the whole header
// sits the one 2px ink rule (--rule-strong). On views without a worklist
// (answers, graph) only the title zone renders.

interface TriageHeader {
  counts: Record<GroupKey, number>;
  activeFilter: GroupKey | null;
  onFilter: (key: GroupKey | null) => void;
  onNext: () => void;
  nextLabel: string;
}

export function DocumentHeader({
  title,
  triage,
}: {
  title: string;
  triage?: TriageHeader;
}) {
  const { requirements, tenderId } = useRequirements();
  const count = requirements.length;
  const reference =
    count > 0
      ? `${count} requirement${count === 1 ? "" : "s"}${
          tenderId ? ` · ${tenderId}` : ""
        }`
      : null;

  return (
    <header className="border-b-2 border-ink bg-paper-raised">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
        {/* LEFT: the masthead nameplate. Running head, section switcher, the tender
            title (the one Fraunces use), and the mono reference line. */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Bidframe
          </span>
          <SectionNav />
          <h1 className="truncate font-serif text-2xl font-semibold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          {reference && (
            <span className="font-mono text-[11px] text-ink-muted">
              {reference}
            </span>
          )}
        </div>

        {/* CENTRE: the triage line. Three quiet in-page filters, middot separated.
            Clicking the active one clears the filter. */}
        {triage && (
            <nav
              aria-label="Filter the worklist"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
            >
              <TriageFilter
                count={triage.counts["needs-you"]}
                label="need your input"
                groupKey="needs-you"
                activeFilter={triage.activeFilter}
                onFilter={triage.onFilter}
              />
              <span aria-hidden className="text-ink-muted">
                ·
              </span>
              <TriageFilter
                count={triage.counts["to-verify"]}
                label="to verify"
                groupKey="to-verify"
                activeFilter={triage.activeFilter}
                onFilter={triage.onFilter}
              />
              <span aria-hidden className="text-ink-muted">
                ·
              </span>
              <TriageFilter
                count={triage.counts.ready}
                label="ready to approve"
                groupKey="ready"
                activeFilter={triage.activeFilter}
                onFilter={triage.onFilter}
              />
              <span aria-hidden className="text-ink-muted">
                ·
              </span>
              <TriageFilter
                count={triage.counts.decided}
                label="decided"
                groupKey="decided"
                activeFilter={triage.activeFilter}
                onFilter={triage.onFilter}
              />
            </nav>
        )}

        {/* RIGHT: the one primary action (Next, when there's a worklist), with the
            quiet account control alongside it. */}
        <div className="flex shrink-0 items-center gap-4">
          {triage && (
            <button
              type="button"
              onClick={triage.onNext}
              className="shrink-0 rounded-md bg-forest px-4 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
            >
              {triage.nextLabel}
            </button>
          )}
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

function TriageFilter({
  count,
  label,
  groupKey,
  activeFilter,
  onFilter,
}: {
  count: number;
  label: string;
  groupKey: GroupKey;
  activeFilter: GroupKey | null;
  onFilter: (key: GroupKey | null) => void;
}) {
  const isActive = activeFilter === groupKey;
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onFilter(isActive ? null : groupKey)}
      className={`whitespace-nowrap transition-colors ${
        isActive
          ? "font-semibold text-ink underline decoration-1 underline-offset-4"
          : "text-ink-muted hover:text-ink"
      }`}
    >
      {count} {label}
    </button>
  );
}
