"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GROUP_LABELS, type GroupKey, type SortKey } from "@/lib/triage";
import { categoryStyle } from "@/lib/categoryStyle";
import { useRequirements } from "@/context/RequirementsContext";
import { SiteHeader } from "./SiteHeader";

// The app-page header: the shared fixed-height SiteHeader (logo, four-link
// SectionNav, account control, the one 2px ink rule) with a title row beneath
// it. The title row carries the page title in Fraunces — full width, allowed
// to wrap, never truncated — the mono tender reference (tender id, never
// invented), the per-tender view switcher (Matrix · Bid · Graph) on workspace
// views, and the page's controls (filter, sort, Next) on views with a
// worklist.

// The per-tender views that live below the masthead: siblings of the loaded
// tender, not global destinations, so they sit in the title row instead of
// the four-link SectionNav.
const TENDER_VIEWS = [
  { href: "/review", label: "Matrix" },
  { href: "/answers", label: "Bid" },
  { href: "/graph", label: "Graph" },
];

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
  const { tenderId } = useRequirements();
  const pathname = usePathname();
  const reference = tenderId ?? null;
  const showViews = TENDER_VIEWS.some((view) => pathname.startsWith(view.href));

  return (
    <>
      <SiteHeader variant="app" />

      {/* The title row: nameplate on the left (title never truncates — it may
          wrap), the page's controls gathered on the right. A hairline rule
          closes it; the 2px ink rule belongs to the masthead above. */}
      <div className="border-b border-hairline bg-paper">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-ink">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {showReference && reference && (
                <span className="font-mono text-[11px] text-ink-muted">
                  {reference}
                </span>
              )}
              {showViews && (
                <nav
                  aria-label="Tender views"
                  className="flex items-center gap-1.5 font-mono text-[11px]"
                >
                  {TENDER_VIEWS.map((view) => (
                    <Link
                      key={view.href}
                      href={view.href}
                      aria-current={
                        pathname.startsWith(view.href) ? "page" : undefined
                      }
                      className={
                        pathname.startsWith(view.href)
                          ? "rounded-md border border-forest bg-forest px-2.5 py-1 font-medium text-paper"
                          : "rounded-md border border-hairline bg-paper px-2.5 py-1 text-ink-muted shadow-[var(--depth-row)] transition-colors hover:border-forest hover:text-ink"
                      }
                    >
                      {view.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </div>

          {/* Controls: the filter and sort in the header register, then the one
              primary action, Next. */}
          {triage && (
            <div className="flex flex-wrap items-center gap-3">
              <MatrixFilterControl triage={triage} />
              {triage.sortBy && triage.onSortChange && (
                <SortControl
                  sortBy={triage.sortBy}
                  onSortChange={triage.onSortChange}
                />
              )}
              <button
                type="button"
                onClick={triage.onNext}
                className="shrink-0 rounded-md bg-forest px-4 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
              >
                {triage.nextLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
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
