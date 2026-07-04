"use client";

import Link from "next/link";
import { GROUP_LABELS, type GroupKey, type SortKey } from "@/lib/triage";
import { categoryStyle } from "@/lib/categoryStyle";
import { useRequirements } from "@/context/RequirementsContext";
import { AccountMenu } from "./AccountMenu";
import { BrandLogo } from "./BrandLogo";
import { SectionNav } from "./SectionNav";

// The document header (layout.md section 2; design-language section 1: the
// masthead). A thin nameplate, not a marketing bar. The title zone stacks the
// running head "BIDFRAME", the section switcher, the tender title in Fraunces,
// and a reference line in mono drawn from real tender metadata (the requirement
// count, and the tender id when a live tender is loaded, never an invented
// reference). Centre is the section switcher. Right is exactly one primary
// action, Next. Beneath the whole header
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
  // unchanged. `categories` is the distinct category list to offer,
  // `activeCategories` is the current selection (empty = all), and `sortBy` /
  // `onSortChange` drive the row order.
  categories?: string[];
  activeCategories?: Set<string>;
  onSetCategory?: (category: string | null) => void;
  sortBy?: SortKey;
  onSortChange?: (sort: SortKey) => void;
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
              <BrandLogo className="h-9 w-auto sm:h-10" />
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

        {/* Matrix controls: one filter select instead of a row of chip toggles,
            with the existing sort beside it. */}
        {triage && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <MatrixFilterControl triage={triage} />
            {triage.sortBy && triage.onSortChange && (
              <SortControl
                sortBy={triage.sortBy}
                onSortChange={triage.onSortChange}
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function MatrixFilterControl({ triage }: { triage: TriageHeader }) {
  const activeCategoryCount = triage.activeCategories?.size ?? 0;
  const activeCategory =
    activeCategoryCount === 1
      ? Array.from(triage.activeCategories ?? [])[0]
      : null;
  const value = triage.activeFilter
    ? `flow:${triage.activeFilter}`
    : activeCategory
      ? `category:${activeCategory}`
      : activeCategoryCount > 1
        ? "category:mixed"
        : "all";

  function onChange(next: string) {
    if (next === "all") {
      triage.onFilter(null);
      triage.onSetCategory?.(null);
      return;
    }
    if (next.startsWith("flow:")) {
      triage.onFilter(next.slice("flow:".length) as GroupKey);
      triage.onSetCategory?.(null);
      return;
    }
    if (next.startsWith("category:")) {
      triage.onFilter(null);
      triage.onSetCategory?.(next.slice("category:".length));
    }
  }

  return (
    <label className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
      <FilterIcon />
      <select
        value={value}
        aria-label="Filter matrix"
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-hairline bg-paper px-1.5 py-0.5 text-[11px] text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest"
      >
        <option value="all">All requirements</option>
        <option value="flow:needs-you">
          {GROUP_LABELS["needs-you"]} ({triage.counts["needs-you"]})
        </option>
        <option value="flow:to-verify">
          {GROUP_LABELS["to-verify"]} ({triage.counts["to-verify"]})
        </option>
        <option value="flow:ready">
          {GROUP_LABELS.ready} ({triage.counts.ready})
        </option>
        <option value="flow:decided">
          {GROUP_LABELS.decided} ({triage.counts.decided})
        </option>
        {activeCategoryCount > 1 && (
          <option value="category:mixed" disabled>
            Multiple categories
          </option>
        )}
        {triage.categories && triage.categories.length > 0 && (
          <option value="category-heading" disabled>
            Categories
          </option>
        )}
        {triage.categories?.map((category) => {
          const { label } = categoryStyle(category);
          return (
            <option key={category} value={`category:${category}`}>
              {label}
            </option>
          );
        })}
      </select>
    </label>
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

function FilterIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 text-ink-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h16l-6.5 7.5v5L10.5 19v-6.5L4 5z" />
    </svg>
  );
}
