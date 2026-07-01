"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import type { Requirement } from "@/types/requirement";
import {
  UNASSIGNED,
  critKey,
  criterionLabel,
  orderedCritKeys,
} from "@/lib/structure";

// "Where the marks live" — the graph reframed from a node soup into the questions
// a bid manager actually has: where does the work concentrate (requirements per
// award criterion), where is the risk (the deal-breakers), and what must be
// answered before what (the dependency chains). A ruled ledger in the
// civic-record voice, legible at 20 requirements and at 500.
//
// It is now the left pane of the linked workspace: controlled by StructureView.
// Selecting a requirement here opens it in the drawer and lights it in the map;
// selecting a criterion pins its lane in the map. Hover traces a lighter path.
// (See graph-and-verification-deep-plan.md Part A: options #5 + #6.)

interface MarksViewProps {
  filter?: (r: Requirement) => boolean;
  selectedId?: string | null;
  hoveredId?: string | null;
  selectedCrit?: string | null;
  onSelectRequirement?: (id: string) => void;
  onHoverRequirement?: (id: string | null) => void;
  onSelectCrit?: (key: string | null) => void;
  // Tightens the type scale for the narrow split column.
  compact?: boolean;
}

interface CriterionGroup {
  key: string;
  label: string;
  weight: number | null; // published share of the marks (#27), null when not stated
  items: Requirement[];
  gating: number;
  review: number;
}

export function MarksView({
  filter,
  selectedId = null,
  hoveredId = null,
  selectedCrit = null,
  onSelectRequirement,
  onHoverRequirement,
  onSelectCrit,
  compact = false,
}: MarksViewProps) {
  const { requirements: all, awardCriteria } = useRequirements();
  const requirements = useMemo(
    () => (filter ? all.filter(filter) : all),
    [all, filter]
  );

  // Which groups are expanded. Multiple can be open; the group holding the
  // current selection is force-opened below so the drawer's item is always in view.
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());

  const { groups, maxCount, maxWeight, hasWeights, deps } = useMemo(() => {
    // Published award criteria (#27) → real name + weight, keyed by id = criteria_ref.
    const critMeta = new Map(awardCriteria.map((c) => [c.id, c]));
    const keys = orderedCritKeys(requirements);
    const byKey = new Map<string, Requirement[]>();
    for (const r of requirements) {
      const k = critKey(r.criteria_ref);
      (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(r);
    }
    const groups: CriterionGroup[] = keys.map((k) => {
      const items = byKey.get(k) ?? [];
      const meta = critMeta.get(k);
      return {
        key: k,
        // Prefer the published criterion name; fall back to the id-derived label.
        label: meta?.name ?? criterionLabel(k === UNASSIGNED ? null : k),
        weight: meta && meta.weight > 0 ? meta.weight : null,
        items,
        gating: items.filter((r) => r.is_gating).length,
        review: items.filter((r) => r.needs_review).length,
      };
    });
    const maxCount = Math.max(1, ...groups.map((g) => g.items.length));
    const maxWeight = Math.max(1, ...groups.map((g) => g.weight ?? 0));
    // Size bars by the real marks when the tender published weightings, else by count.
    const hasWeights = groups.some((g) => g.weight != null);

    const byId = new Map(requirements.map((r) => [r.id, r]));
    const deps = requirements
      .map((r) => ({
        req: r,
        before: r.depends_on
          .map((d) => byId.get(d))
          .filter((x): x is Requirement => Boolean(x)),
      }))
      .filter((d) => d.before.length > 0);

    return { groups, maxCount, maxWeight, hasWeights, deps };
  }, [requirements, awardCriteria]);

  // The group holding the current selection is always shown open, derived rather
  // than forced through state, so a selection from the map never collapses.
  const selectedKey = selectedId
    ? critKey(requirements.find((r) => r.id === selectedId)?.criteria_ref)
    : null;
  const isGroupOpen = (key: string) =>
    openKeys.has(key) || key === selectedKey;

  // Scroll the selected row into view once its group is open (pure DOM effect).
  useEffect(() => {
    if (!selectedId) return;
    const id = requestAnimationFrame(() => {
      rowRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(id);
  }, [selectedId]);

  function toggleGroup(key: string) {
    const willOpen = !isGroupOpen(key);
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    // Pin/unpin the lane in the map. Outside the state updater so we never update
    // the parent mid-render.
    onSelectCrit?.(willOpen ? key : null);
  }

  const totalGating = requirements.filter((r) => r.is_gating).length;
  const headingSize = compact
    ? "text-xl"
    : "text-2xl sm:text-3xl";

  return (
    <div className={compact ? "flex flex-col gap-10" : "flex flex-col gap-14"}>
      {/* Where the marks live — a ledger of award criteria by requirement count. */}
      <section>
        <h2
          className={`font-serif font-semibold tracking-tight text-ink ${headingSize}`}
        >
          Where the marks live
        </h2>
        <p className="mt-2 max-w-[64ch] text-[14.5px] leading-relaxed text-ink-muted">
          Every requirement grouped by the award criterion it is scored against
          {hasWeights ? ", each bar sized by its share of the marks" : ""}.{" "}
          {totalGating > 0 && (
            <span className="text-ink">
              {totalGating} deal-breaker{totalGating === 1 ? "" : "s"}
            </span>
          )}{" "}
          across {groups.length} criteri{groups.length === 1 ? "on" : "a"}. Open a
          row to read its requirements.
        </p>

        <div className="mt-6">
          {groups.length === 0 && (
            <p className="text-sm text-ink-muted">
              Nothing matches the current filter.
            </p>
          )}
          {groups.map((g) => {
            const isOpen = isGroupOpen(g.key);
            const isPinned = selectedCrit === g.key;
            const width =
              hasWeights && g.weight != null
                ? Math.round((g.weight / maxWeight) * 100)
                : Math.round((g.items.length / maxCount) * 100);
            const gatingPct = g.items.length
              ? (g.gating / g.items.length) * 100
              : 0;
            return (
              <div
                key={g.key}
                className={`border-t border-hairline py-3.5 first:border-t-0 ${
                  isPinned ? "bg-accent-soft/40" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(g.key)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 rounded-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span
                        className={`font-mono text-[13px] font-medium ${
                          isPinned ? "text-accent" : "text-ink"
                        }`}
                      >
                        {g.label}
                      </span>
                      {g.gating > 0 && (
                        <span className="font-mono text-[11px] font-medium text-signal-oxblood">
                          {g.gating} deal-breaker{g.gating === 1 ? "" : "s"}
                        </span>
                      )}
                      {g.review > 0 && (
                        <span className="font-mono text-[11px] text-ink-muted">
                          {g.review} to check
                        </span>
                      )}
                      {g.weight != null && (
                        <span className="font-mono text-[11px] font-medium text-ink-muted">
                          {g.weight}% of marks
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-2.5 w-full max-w-[520px] overflow-hidden rounded-[3px] bg-paper-recessed shadow-[var(--depth-pressed)]">
                      <div className="flex h-full" style={{ width: `${width}%` }}>
                        {g.gating > 0 && (
                          <div
                            className="h-full bg-signal-oxblood"
                            style={{ width: `${gatingPct}%` }}
                          />
                        )}
                        <div className="h-full flex-1 bg-ink/25" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-lg font-medium text-ink">
                      {g.items.length}
                    </span>
                    <span className="font-mono text-[11px] text-ink-muted">
                      req{g.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <ul className="mt-3 flex flex-col gap-0.5 border-l border-hairline pl-2">
                    {g.items.map((r) => {
                      const isSel = selectedId === r.id;
                      const isHov = hoveredId === r.id;
                      return (
                        <li
                          key={r.id}
                          ref={(el) => {
                            if (el) rowRefs.current.set(r.id, el);
                            else rowRefs.current.delete(r.id);
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectRequirement?.(r.id)}
                            onMouseEnter={() => onHoverRequirement?.(r.id)}
                            onMouseLeave={() => onHoverRequirement?.(null)}
                            aria-current={isSel}
                            className={`grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                              isSel
                                ? "bg-paper-raised shadow-[var(--depth-row)]"
                                : isHov
                                  ? "bg-paper-raised/60"
                                  : "hover:bg-paper-raised/60"
                            }`}
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                r.is_gating ? "bg-signal-oxblood" : "bg-ink/20"
                              }`}
                              aria-hidden
                            />
                            <span
                              className={`line-clamp-2 leading-snug ${
                                isSel
                                  ? "font-medium text-ink"
                                  : "text-ink group-hover:text-forest"
                              }`}
                            >
                              {r.text}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                              p.{r.source_page}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Answer in order — the dependency chains, as ordered rails. */}
      <section>
        <h2
          className={`font-serif font-semibold tracking-tight text-ink ${headingSize}`}
        >
          Answer in order
        </h2>
        <p className="mt-2 max-w-[64ch] text-[14.5px] leading-relaxed text-ink-muted">
          Some requirements depend on others. Answer the ones on the left first.
        </p>
        {deps.length === 0 ? (
          <p className="mt-5 text-sm text-ink-muted">
            No dependencies in view — each requirement stands on its own.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {deps.map(({ req, before }) => (
              <li key={req.id} className="flex flex-wrap items-center gap-2">
                {before.map((b) => (
                  <DepChip
                    key={b.id}
                    req={b}
                    selected={selectedId === b.id}
                    onSelect={onSelectRequirement}
                    onHover={onHoverRequirement}
                  />
                ))}
                <span aria-hidden className="font-mono text-sm text-ink-muted">
                  →
                </span>
                <DepChip
                  req={req}
                  emphasis
                  selected={selectedId === req.id}
                  onSelect={onSelectRequirement}
                  onHover={onHoverRequirement}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// A requirement as a small chip in a dependency rail. Deal-breakers take the
// oxblood reading edge; the dependent (the "then" item) is emphasised in full
// ink; the selected one carries the row lift.
function DepChip({
  req,
  emphasis = false,
  selected = false,
  onSelect,
  onHover,
}: {
  req: Requirement;
  emphasis?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  return (
    <button
      type="button"
      title={req.text}
      onClick={() => onSelect?.(req.id)}
      onMouseEnter={() => onHover?.(req.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`inline-flex max-w-[36ch] items-center rounded-md border bg-paper-raised px-2.5 py-1 text-xs transition-colors hover:border-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
        req.is_gating
          ? "border-l-2 border-hairline border-l-signal-oxblood"
          : "border-hairline"
      } ${emphasis ? "font-medium text-ink" : "text-ink-muted"} ${
        selected ? "shadow-[var(--depth-row)] ring-1 ring-forest" : ""
      }`}
    >
      <span className="truncate">{req.text}</span>
    </button>
  );
}
