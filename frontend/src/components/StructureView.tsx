"use client";

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { useRequirements } from "@/context/RequirementsContext";
import { isApiEnabled } from "@/lib/api";
import type { Requirement } from "@/types/requirement";
import { orderByCriterion } from "@/lib/structure";
import { labelForRequirementAction } from "@/lib/triage";
import { MarksView } from "./MarksView";
import { GraphView } from "./GraphView";
import { RequirementDrawer } from "./RequirementDrawer";
import { NoTenderLoaded } from "./NoTenderLoaded";

// The /graph surface, rebuilt as one linked workspace instead of two hidden
// tabs. The ledger ("Marks & structure") and the relationship map are the same
// data seen two ways, shown side by side and wired to a shared selection: hover
// or pick a requirement in either pane and it lights in both. Opening one no
// longer ejects you to the matrix — its full detail slides in as a drawer over
// the workspace, so you never lose your place. A prominent segmented control
// (Split · Ledger · Map) replaces the old whisper-quiet text toggle, and a
// filter select narrows both panes at once. See design-language.md, "The linked
// workspace" (a named departure).

type Layout = "split" | "ledger" | "map";

const WIDE_QUERY = "(min-width: 1024px)";

function subscribeWide(onChange: () => void): () => void {
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function getWideSnapshot(): boolean {
  return window.matchMedia(WIDE_QUERY).matches;
}
// Assume wide during SSR / first paint so the split never flickers to a single
// pane on a desktop (mirrors MatrixView's useIsWide).
function useIsWide(): boolean {
  return useSyncExternalStore(subscribeWide, getWideSnapshot, () => true);
}

export function StructureView() {
  const { requirements, tenderId, approve, editRequirement, flag } =
    useRequirements();
  const router = useRouter();

  // The shared spine: what is selected (opens the drawer + lights both panes),
  // what is hovered (a lighter, transient trace), and which criterion lane is
  // pinned from the ledger. One source, read and written by both panes.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedCrit, setSelectedCrit] = useState<string | null>(null);

  // The filter controls. Both panes receive the same predicate, so they always
  // show the same slice of the tender. The deal-breaker lens is its own toggle
  // chip (one click, composable with the category select), not a select option.
  const [query, setQuery] = useState("");
  const [gatingOnly, setGatingOnly] = useState(false);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [activeCats, setActiveCats] = useState<Set<string>>(() => new Set());

  const isWide = useIsWide();
  const [layout, setLayout] = useState<Layout>("split");
  // Split is not viable below lg — fall back to the ledger there.
  const effective: Layout = !isWide && layout === "split" ? "ledger" : layout;

  const categories = useMemo(
    () =>
      Array.from(new Set(requirements.map((r) => r.category))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [requirements]
  );

  const gatingCount = useMemo(
    () => requirements.filter((r) => r.is_gating).length,
    [requirements]
  );

  const filter = useCallback(
    (r: Requirement): boolean => {
      if (gatingOnly && !r.is_gating) return false;
      if (reviewOnly && !r.needs_review) return false;
      if (activeCats.size > 0 && !activeCats.has(r.category)) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${r.text} ${r.source_clause ?? ""} ${r.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    },
    [gatingOnly, reviewOnly, activeCats, query]
  );

  const selected = requirements.find((r) => r.id === selectedId) ?? null;

  // "Next" in the drawer walks the same criterion order the ledger lists, across
  // the current filter — approve, next, approve, next, without leaving the graph.
  const goNext = useCallback(() => {
    const ordered = orderByCriterion(requirements.filter(filter));
    if (ordered.length === 0) return;
    const idx = ordered.findIndex((r) => r.id === selectedId);
    const nextItem = ordered[(idx + 1) % ordered.length];
    setSelectedId(nextItem.id);
  }, [requirements, filter, selectedId]);

  // Task-specific copy for the drawer's Next control (Stage 1): label it after
  // the action the next item in the criterion walk needs, matching the matrix.
  const nextDrawerLabel = useMemo(() => {
    const ordered = orderByCriterion(requirements.filter(filter));
    if (ordered.length === 0 || !selectedId) return "Back to matrix";
    const idx = ordered.findIndex((r) => r.id === selectedId);
    return labelForRequirementAction(ordered[(idx + 1) % ordered.length]);
  }, [requirements, filter, selectedId]);

  const filtersActive =
    gatingOnly || reviewOnly || activeCats.size > 0 || query.trim().length > 0;
  const resetFilters = useCallback(() => {
    setQuery("");
    setGatingOnly(false);
    setReviewOnly(false);
    setActiveCats(new Set());
  }, []);
  const filterValue = reviewOnly
    ? "to-check"
    : activeCats.size === 1
      ? `category:${Array.from(activeCats)[0]}`
      : activeCats.size > 1
        ? "category:mixed"
        : "all";
  const selectFilter = useCallback((next: string) => {
    // The select owns the to-check/category lens; the deal-breaker chip is
    // independent, so it survives select changes.
    setReviewOnly(false);
    setActiveCats(new Set());
    if (next === "to-check") {
      setReviewOnly(true);
    } else if (next.startsWith("category:")) {
      setActiveCats(new Set([next.slice("category:".length)]));
    }
  }, []);

  if (isApiEnabled() && !tenderId) {
    return (
      <NoTenderLoaded
        heading="Nothing to map yet"
        body="Pick a tender from the library or upload a tender pack before reviewing marks and structure."
      />
    );
  }

  const paneProps = {
    filter,
    selectedId,
    hoveredId,
    selectedCrit,
    onSelectRequirement: setSelectedId,
    onHoverRequirement: setHoveredId,
    onSelectCrit: setSelectedCrit,
  };

  return (
    <div>
      {/* Toolbar: the switcher, search, the deal-breaker chip, and one compact
          filter select. */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            layout={layout}
            onChange={setLayout}
            allowSplit={isWide}
          />
          <SearchField value={query} onChange={setQuery} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {gatingCount > 0 && (
            <button
              type="button"
              onClick={() => setGatingOnly((v) => !v)}
              aria-pressed={gatingOnly}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                gatingOnly
                  ? "border-signal-oxblood-frame bg-paper-raised text-ink shadow-[var(--depth-row)]"
                  : "border-hairline text-ink-muted hover:bg-paper-raised hover:text-ink"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  gatingOnly ? "bg-signal-oxblood" : "border border-hairline"
                }`}
                aria-hidden
              />
              Deal-breakers only · {gatingCount}
            </button>
          )}
          <WorkspaceFilterSelect
            value={filterValue}
            categories={categories}
            onChange={selectFilter}
          />
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 font-mono text-[11px] text-ink-muted underline decoration-hairline underline-offset-2 transition-colors hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* The workspace. Split shows both panes divided by a hairline, each
          scrolling in its own column; Ledger / Map show one full-width. */}
      {effective === "split" ? (
        <div className="grid h-[76vh] min-h-[520px] grid-cols-[minmax(320px,0.9fr)_1.4fr] divide-x divide-hairline overflow-hidden rounded-lg border border-hairline">
          <div className="min-w-0 overflow-y-auto px-5 py-5">
            <MarksView {...paneProps} compact />
          </div>
          <div className="min-w-0">
            <GraphView {...paneProps} embedded />
          </div>
        </div>
      ) : effective === "map" ? (
        <div className="h-[76vh] min-h-[520px] overflow-hidden rounded-lg border border-hairline">
          <GraphView {...paneProps} embedded />
        </div>
      ) : (
        <MarksView {...paneProps} />
      )}

      {/* Detail in place: the same panel the matrix opens, as a drawer over the
          workspace. You act on a requirement without leaving the graph. */}
      <RequirementDrawer
        requirement={selected}
        onApprove={approve}
        onEdit={editRequirement}
        onFlag={flag}
        onNext={goNext}
        nextLabel={nextDrawerLabel}
        onClose={() => setSelectedId(null)}
      />

      {/* The drawer's onward journeys. The drawer shell has no footer slot, so
          the rail floats just outside its left edge (the panel is max-w-md =
          28rem, pinned right): review the item in the matrix or jump straight
          to drafting its answer. Hidden where the drawer takes the full width. */}
      {selected && (
        <div className="fixed bottom-5 right-[calc(28rem+1.25rem)] z-[60] hidden flex-col items-end gap-2 md:flex">
          <DrawerJumpButton
            label="View in matrix"
            onClick={() => router.push(`/review?req=${selected.id}`)}
          />
          <DrawerJumpButton
            label="Draft answer"
            onClick={() => router.push(`/answers?req=${selected.id}`)}
          />
        </div>
      )}
    </div>
  );
}

// One onward link beside the drawer: quiet paper chip, mono voice, arrow to say
// "this leaves the workspace".
function DrawerJumpButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-paper-raised px-3 py-1.5 font-mono text-[11.5px] text-ink shadow-[var(--depth-sheet)] transition-colors hover:border-forest hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
    >
      {label}
      <span aria-hidden>→</span>
    </button>
  );
}

function WorkspaceFilterSelect({
  value,
  categories,
  onChange,
}: {
  value: string;
  categories: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
      <FilterIcon />
      <select
        value={value}
        aria-label="Filter structure view"
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-hairline bg-paper px-1.5 py-0.5 text-[11px] text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest"
      >
        <option value="all">All requirements</option>
        <option value="to-check">To check</option>
        {value === "category:mixed" && (
          <option value="category:mixed" disabled>
            Multiple categories
          </option>
        )}
        {categories.length > 0 && (
          <option value="category-heading" disabled>
            Categories
          </option>
        )}
        {categories.map((category) => (
          <option key={category} value={`category:${category}`}>
            {category}
          </option>
        ))}
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

// The prominent switcher. Three segments on wide screens (Split leads), two when
// the split will not fit. A pressed segment reads as the current lens.
function Segmented({
  layout,
  onChange,
  allowSplit,
}: {
  layout: Layout;
  onChange: (l: Layout) => void;
  allowSplit: boolean;
}) {
  const options: { key: Layout; label: string }[] = [
    ...(allowSplit ? [{ key: "split" as Layout, label: "Split" }] : []),
    { key: "ledger", label: "Ledger" },
    { key: "map", label: "Map" },
  ];
  const current: Layout = !allowSplit && layout === "split" ? "ledger" : layout;

  return (
    <div
      role="tablist"
      aria-label="Workspace layout"
      className="inline-flex items-center rounded-md border border-hairline bg-paper-recessed p-0.5 shadow-[var(--depth-pressed)]"
    >
      {options.map((o) => {
        const active = current === o.key;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.key)}
            className={`rounded-[5px] px-3 py-1 font-mono text-[12px] uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-1 focus-visible:ring-offset-paper-recessed ${
              active
                ? "bg-paper-raised text-ink shadow-[var(--depth-row)]"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">Search requirements</span>
      <svg
        aria-hidden
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        className="pointer-events-none absolute left-2.5 text-ink-muted"
      >
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10.5 10.5L14 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search text or clause"
        className="w-56 rounded-md border border-hairline bg-paper-raised py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted/70 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
      />
    </label>
  );
}
