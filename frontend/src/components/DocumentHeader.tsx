"use client";

import Link from "next/link";
import type { GroupKey, SortKey } from "@/lib/triage";
import { categoryStyle } from "@/lib/categoryStyle";
import { useRequirements } from "@/context/RequirementsContext";
import { AccountMenu } from "./AccountMenu";
import { AnimatedNumber } from "./AnimatedNumber";
import { BrandLogo } from "./BrandLogo";
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
  // Category filter + sort contract. All optional and backward-compatible, so
  // the hero embed, the demo, and the frozen worked-example keep rendering
  // unchanged. This step only holds the contract; the chip / sort UI is built in
  // the following step. `categories` is the distinct category list to offer,
  // `activeCategories` is the current selection (empty = all), and `sortBy` /
  // `onSortChange` drive the row order.
  categories?: string[];
  activeCategories?: Set<string>;
  onToggleCategory?: (category: string) => void;
  sortBy?: SortKey;
  onSortChange?: (sort: SortKey) => void;
  // When present, the triage counts render as spring-ticking AnimatedNumbers,
  // keyed by this value: they tick 0 → real once per tender (the staged
  // reveal) and then tick between values as decisions land. Omitted (the hero
  // embed, the demo, the frozen example) = plain static numbers, unchanged.
  counterKey?: string;
}

export function DocumentHeader({
  title,
  triage,
  showReference = true,
}: {
  title: string;
  triage?: TriageHeader;
  // The mono reference line (requirement count + tender id) is drawn from the
  // loaded tender. The upload entry has no tender of its own yet, so it opts out
  // and the line appears once a real tender is open in the app.
  showReference?: boolean;
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
      <div className="mx-auto max-w-[1160px] px-6 py-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* LEFT: the masthead. The Bidframe lockup over the page title and the
              mono reference line. The section switcher has moved to the centre
              pill, so the title owns the nameplate. */}
          <div className="flex min-w-0 flex-col gap-1.5">
            <Link href="/tenders" aria-label="Bidframe home" className="w-fit">
              <BrandLogo className="h-7 w-auto" />
            </Link>
            <h1 className="truncate font-serif text-2xl font-semibold leading-tight tracking-tight text-ink">
              {title}
            </h1>
            {showReference && reference && (
              <span className="font-mono text-[11px] text-ink-muted">
                {reference}
              </span>
            )}
          </div>

          {/* CENTRE: the section switcher, gathered into one frosted pill so the
              nav reads as a single control and the masthead keeps its room. */}
          <div className="justify-self-center">
            <div className="rounded-full border border-hairline bg-paper-raised/70 px-4 py-1.5 shadow-[var(--depth-control)] backdrop-blur-md supports-[backdrop-filter]:bg-paper-raised/55">
              <SectionNav />
            </div>
          </div>

          {/* RIGHT: the one primary action (Next, when there's a worklist), with
              the quiet account control alongside it. */}
          <div className="flex items-center justify-end gap-4">
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

        {/* The triage line: the worklist filters, a contextual sub-bar centred
            under the masthead. Only the matrix passes triage. */}
        {triage && (
          <nav
            aria-label="Filter the worklist"
            className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm"
          >
            <TriageFilter
              count={triage.counts["needs-you"]}
              label="need your input"
              groupKey="needs-you"
              activeFilter={triage.activeFilter}
              onFilter={triage.onFilter}
              counterKey={triage.counterKey}
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
              counterKey={triage.counterKey}
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
              counterKey={triage.counterKey}
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
              counterKey={triage.counterKey}
            />
          </nav>
        )}

        {/* The content sub-line: colour-coded category filter chips (a tinted
            pill per category, filled when selected, outlined when resting) with
            a quiet sort control alongside. Category colours are CONTENT colours
            (categoryStyle), kept clear of the brand and status hues. Both are
            optional, so the hero, demo, and frozen example render without this
            row. */}
        {triage &&
          ((triage.categories && triage.categories.length > 0) ||
            (triage.sortBy && triage.onSortChange)) && (
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
              {triage.categories?.map((category) => (
                <CategoryChip
                  key={category}
                  category={category}
                  active={triage.activeCategories?.has(category) ?? false}
                  onToggle={triage.onToggleCategory}
                />
              ))}
              {triage.sortBy && triage.onSortChange && (
                <>
                  {triage.categories && triage.categories.length > 0 && (
                    <span
                      aria-hidden
                      className="mx-0.5 h-3 w-px bg-hairline"
                    />
                  )}
                  <SortControl
                    sortBy={triage.sortBy}
                    onSortChange={triage.onSortChange}
                  />
                </>
              )}
            </div>
          )}
      </div>
    </header>
  );
}

// A category filter chip: the CategoryTag look worn as a toggle. Resting it is an
// outline in the category hue; selected it fills with the same tint and darkens
// its label toward ink, so the on state reads without leaning on colour alone.
function CategoryChip({
  category,
  active,
  onToggle,
}: {
  category: string;
  active: boolean;
  onToggle?: (category: string) => void;
}) {
  const { label, hex } = categoryStyle(category);
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onToggle?.(category)}
      className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors"
      style={
        active
          ? {
              color: `color-mix(in oklab, ${hex} 62%, var(--color-ink))`,
              backgroundColor: `color-mix(in oklab, ${hex} 16%, var(--color-paper-raised))`,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${hex} 42%, transparent)`,
            }
          : {
              color: "var(--color-ink-muted)",
              backgroundColor: "transparent",
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${hex} 28%, var(--color-hairline))`,
            }
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: active
            ? hex
            : `color-mix(in oklab, ${hex} 55%, var(--color-ink-muted))`,
        }}
        aria-hidden
      />
      {label}
    </button>
  );
}

// The sort control: a quiet native select in the header register, no forest, no
// weight. Orders the matrix rows by confidence (riskiest first), source page, or
// category.
function SortControl({
  sortBy,
  onSortChange,
}: {
  sortBy: SortKey;
  onSortChange: (sort: SortKey) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
      <span className="uppercase tracking-wide">Sort</span>
      <select
        value={sortBy}
        onChange={(event) => onSortChange(event.target.value as SortKey)}
        className="rounded border border-hairline bg-paper px-1.5 py-0.5 text-[11px] text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest"
      >
        <option value="confidence">Confidence</option>
        <option value="page">Page</option>
        <option value="category">Category</option>
      </select>
    </label>
  );
}

function TriageFilter({
  count,
  label,
  groupKey,
  activeFilter,
  onFilter,
  counterKey,
}: {
  count: number;
  label: string;
  groupKey: GroupKey;
  activeFilter: GroupKey | null;
  onFilter: (key: GroupKey | null) => void;
  counterKey?: string;
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
      {counterKey !== undefined ? (
        // Keyed by the tender identity: the count ticks up from 0 exactly once
        // per tender, then springs between values as decisions land. Reduced
        // motion (inside AnimatedNumber) jumps straight to the value.
        <AnimatedNumber key={counterKey} value={count} from={0} />
      ) : (
        count
      )}{" "}
      {label}
    </button>
  );
}
