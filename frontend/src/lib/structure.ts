import type { Requirement } from "@/types/requirement";

// Shared vocabulary for the /graph workspace, so the ledger (MarksView) and the
// map (GraphView) group and order requirements identically and their selection
// stays in lockstep. The workspace is one surface seen two ways; this is the
// single source of that shape.

// The stable key for a criterion group. Unassigned requirements share one group.
export const UNASSIGNED = "__none__";

export function critKey(ref: string | null | undefined): string {
  return ref ?? UNASSIGNED;
}

// The human label for a criterion group. Real clause number when present, else
// the raw ref; the catch-all reads "Unassigned".
export function criterionLabel(ref: string | null | undefined): string {
  if (!ref) return "Unassigned";
  const n = ref.replace(/\D+/g, "");
  return n ? `Award criterion ${n}` : ref;
}

// The criteria present, in the canonical order both panes render: real criteria
// first (numeric/lexical), the Unassigned catch-all always last.
export function orderedCritKeys(requirements: Requirement[]): string[] {
  const keys = Array.from(new Set(requirements.map((r) => critKey(r.criteria_ref))));
  return keys.sort((a, b) => {
    if (a === UNASSIGNED) return 1;
    if (b === UNASSIGNED) return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

// Requirements flattened in criterion order — the reading order the ledger lists
// and the map stacks, so "next" means the same thing in both.
export function orderByCriterion(requirements: Requirement[]): Requirement[] {
  const keys = orderedCritKeys(requirements);
  return keys.flatMap((k) =>
    requirements.filter((r) => critKey(r.criteria_ref) === k)
  );
}

// The set of node ids lit when a requirement is the focus: itself, the criterion
// it is scored against, and every requirement on its answer-order chain — the
// depends_on graph walked TRANSITIVELY in both directions, so a focus lights the
// things it ultimately rests on and everything that ultimately rests on it.
// Everything else dims. Criterion node ids are prefixed so they never collide
// with requirement ids.
export function critNodeId(ref: string): string {
  return `crit:${ref}`;
}

// Forward/reverse dependency adjacency, built once per requirement set. Hover
// fires traceSet constantly, so the O(n·deps) index is memoized on the array
// identity (the callers keep their filtered slice stable between hovers).
interface DepIndex {
  byId: Map<string, Requirement>;
  forward: Map<string, string[]>; // id -> the ids it depends on
  reverse: Map<string, string[]>; // id -> the ids that depend on it
}

const depIndexCache = new WeakMap<Requirement[], DepIndex>();

function depIndex(requirements: Requirement[]): DepIndex {
  const cached = depIndexCache.get(requirements);
  if (cached) return cached;

  const byId = new Map(requirements.map((r) => [r.id, r]));
  const forward = new Map<string, string[]>();
  const reverse = new Map<string, string[]>();
  for (const r of requirements) {
    for (const dep of r.depends_on) {
      if (!byId.has(dep)) continue; // link points outside the visible slice
      (forward.get(r.id) ?? forward.set(r.id, []).get(r.id)!).push(dep);
      (reverse.get(dep) ?? reverse.set(dep, []).get(dep)!).push(r.id);
    }
  }

  const index = { byId, forward, reverse };
  depIndexCache.set(requirements, index);
  return index;
}

export function traceSet(
  focusId: string,
  requirements: Requirement[]
): Set<string> {
  const set = new Set<string>();
  const { byId, forward, reverse } = depIndex(requirements);
  const focus = byId.get(focusId);
  if (!focus) return set;
  set.add(focus.id);
  if (focus.criteria_ref) set.add(critNodeId(focus.criteria_ref));

  // BFS each direction from the focus. Visited = the set itself, so shared
  // ancestors are walked once and cycles cannot loop.
  for (const adjacency of [forward, reverse]) {
    const queue = [focus.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const next of adjacency.get(id) ?? []) {
        if (set.has(next)) continue;
        set.add(next);
        queue.push(next);
      }
    }
  }
  return set;
}

// The trace set for a whole criterion lane: every requirement scored under it,
// plus the criterion node itself.
export function critTraceSet(
  key: string,
  requirements: Requirement[]
): Set<string> {
  const set = new Set<string>();
  if (key !== UNASSIGNED) set.add(critNodeId(key));
  for (const r of requirements) {
    if (critKey(r.criteria_ref) === key) set.add(r.id);
  }
  return set;
}
