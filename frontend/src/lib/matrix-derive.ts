import type { Requirement } from "@/types/requirement";
import {
  compareRequirements,
  type GroupKey,
  type SortKey,
  type TriageGroup,
} from "@/lib/triage";
import { collapseDuplicates, type DedupeMeta } from "@/lib/dedupe";

// The matrix's visible-worklist derivation, pulled out of ComplianceMatrix so it
// is pure, testable, and computed ONCE per render (the component previously
// re-ran collapseDuplicates per group just for its "shown" counter). Everything
// here is display-level: nothing is dropped, nothing mutated.
//
// The group shape is deliberately lens-ready: `key` is a plain string (a triage
// GroupKey today, an award-criterion id under a criteria lens later) and `label`
// is the display heading, so a future grouping lens can reuse this shape without
// the matrix reshaping.

export interface VisibleGroup {
  // Lens-ready group identity: a triage GroupKey today (string-typed on purpose
  // so a later criteria lens can use award-criterion ids without a reshape).
  key: string;
  label: string;
  // The group's rows after search/category filtering + sorting, BEFORE display
  // dedupe. Kept so fold/selection logic can still see every member.
  items: Requirement[];
  // Display dedupe, precomputed exactly once per group (see lib/dedupe.ts):
  // one representative per unique requirement + per-representative meta.
  representatives: Requirement[];
  meta: Map<string, DedupeMeta>;
}

export interface VisibleMatrix {
  groups: VisibleGroup[];
  // Total representatives on screen — the header's "N shown" counter.
  shownCount: number;
  // Representative ids in display order across all visible groups, for
  // keyboard traversal / virtualisation later.
  flatOrder: string[];
}

// Replicates the matrix's filter/sort semantics exactly: free-text search over
// text/category/source_clause/answer.text, then the category set filter, then
// the sortBy comparator (source order when omitted); empty groups are dropped
// and an active triage filter narrows to its one group.
export function deriveVisibleGroups({
  groups,
  query,
  activeFilter,
  activeCategories,
  sortBy,
}: {
  groups: TriageGroup[];
  query: string;
  activeFilter: GroupKey | null;
  activeCategories?: Set<string>;
  sortBy?: SortKey;
}): VisibleMatrix {
  const normalisedQuery = query.trim().toLowerCase();
  // An empty (or omitted) category set means no category filtering.
  const categoryFilter =
    activeCategories && activeCategories.size > 0 ? activeCategories : null;
  const comparator = sortBy ? compareRequirements(sortBy) : null;

  const visible: VisibleGroup[] = [];
  const flatOrder: string[] = [];
  let shownCount = 0;

  for (const group of groups) {
    if (activeFilter !== null && group.key !== activeFilter) continue;

    let items =
      normalisedQuery.length === 0
        ? group.items
        : group.items.filter((req) =>
            [
              req.text,
              req.category,
              req.source_clause ?? "",
              req.answer?.text ?? "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalisedQuery)
          );
    if (categoryFilter) {
      items = items.filter((req) => categoryFilter.has(req.category));
    }
    if (comparator) {
      items = [...items].sort(comparator);
    }
    if (items.length === 0) continue;

    const { representatives, meta } = collapseDuplicates(items);
    visible.push({
      key: group.key,
      label: group.label,
      items,
      representatives,
      meta,
    });
    shownCount += representatives.length;
    for (const rep of representatives) flatOrder.push(rep.id);
  }

  return { groups: visible, shownCount, flatOrder };
}
