"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRequirements } from "@/context/RequirementsContext";
import { isApiEnabled } from "@/lib/api";
import type { Requirement } from "@/types/requirement";
import {
  deriveTriage,
  isConfidentNonGating,
  nextPriorityId,
  type GroupKey,
} from "@/lib/triage";
import { AppMain } from "./AppMain";
import { ApprovalStamp } from "./ApprovalStamp";
import { ComplianceMatrix } from "./ComplianceMatrix";
import { DocumentHeader } from "./DocumentHeader";
import { GatingHero } from "./GatingHero";
import { NoTenderLoaded } from "./NoTenderLoaded";
import { RequirementDrawer } from "./RequirementDrawer";
import { RequirementPanel } from "./RequirementPanel";
import { RequirementSpine } from "./RequirementSpine";

// MatrixView owns the open state. It holds the selected requirement, the active
// triage filter, and the responsive mode switch, and it renders the full-bleed
// document header plus the centred body column (layout.md sections 1, 2, 5, 8).
//
// Resting (nothing selected): the gating hero over the grouped matrix.
// Open at >=1100px: a split, a narrow spine index on the left and the panel on
//   the right. The matrix grid is hidden; the spine replaces it.
// Open at <1100px: the resting matrix stays and the panel slides in as a drawer.
//   The spine drops because there is no room for it.

const WIDE_QUERY = "(min-width: 1100px)";

// Track whether the split open state is viable for this viewport. Read straight
// from the media query via useSyncExternalStore so there is no setState in an
// effect (no cascading render). SSR and the first client snapshot both assume
// the split, then the real match resolves on mount, so the wide layout never
// flickers to the drawer on a wide screen.
function subscribeWide(onChange: () => void): () => void {
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getWideSnapshot(): boolean {
  return window.matchMedia(WIDE_QUERY).matches;
}

function useIsWide(): boolean {
  return useSyncExternalStore(subscribeWide, getWideSnapshot, () => true);
}

function csvCell(value: unknown): string {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  return `"${text.replace(/"/g, '""')}"`;
}

function exportRequirements(requirements: Requirement[]) {
  const header = [
    "id",
    "status",
    "type",
    "gating",
    "category",
    "source_page",
    "source_clause",
    "requirement",
    "decision_note",
    "answer",
    "evidence",
  ];
  const rows = requirements.map((req) => [
    req.id,
    req.status,
    req.type,
    req.is_gating ? "yes" : "no",
    req.category,
    req.source_page,
    req.source_clause ?? "",
    req.text,
    req.decision?.note ?? "",
    req.answer?.text ?? req.draft_answer ?? "",
    req.answer?.evidence_refs
      ?.map((ref) => `${ref.doc_id} p.${ref.page}: ${ref.excerpt}`)
      .join(" | ") ?? "",
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bidframe-compliance-matrix.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// The stamp time for the completion summary: the latest decision made this
// session, formatted HH:MM. Undefined when nothing carries a timestamp, so the
// stamp falls back to its own default.
function latestDecisionTimeLabel(requirements: Requirement[]): string | undefined {
  const stamps = requirements
    .map((req) => req.decision?.timestamp)
    .filter((t): t is string => Boolean(t))
    .sort();
  const latest = stamps.at(-1);
  if (!latest) return undefined;
  const when = new Date(latest);
  if (Number.isNaN(when.getTime())) return undefined;
  return when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function MatrixView({ title }: { title: string }) {
  const { requirements, tenderId, approve, editRequirement, flag } =
    useRequirements();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<GroupKey | null>(null);
  // Which groups the user has folded away. The long, low-priority groups start
  // collapsed so a big tender opens short; the actionable ones start open. Held
  // here (not in ComplianceMatrix) so the fold survives the matrix unmounting when
  // a requirement opens the split.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<GroupKey>>(
    () => new Set<GroupKey>(["ready", "decided"])
  );
  const toggleGroup = useCallback((key: GroupKey) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const isWide = useIsWide();

  const triage = deriveTriage(requirements);
  const selected = requirements.find((r) => r.id === selectedId) ?? null;
  const priorityId = nextPriorityId(requirements);
  const decidedCount = requirements.filter((req) => req.status !== "pending").length;
  // What still needs a human: gaps to fill + deal-breakers / low-confidence to verify.
  // Everything else, Bidframe has handled (ready to approve, or already decided).
  const needInput = triage.counts["needs-you"] + triage.counts["to-verify"];
  const verifiedCount = requirements.length - needInput;

  // Live product, no tender loaded yet → show an onboarding empty state rather than
  // the sample data. The mock showcase build (no API) keeps its sample matrix.
  const noTenderLoaded = isApiEnabled() && !tenderId;

  // Open a requirement from a ?req= URL param (a deep link from the graph, a
  // shared link, or a refresh), once, after its requirement is present.
  const appliedUrlSelection = useRef(false);
  useEffect(() => {
    if (appliedUrlSelection.current) return;
    const id = new URLSearchParams(window.location.search).get("req");
    if (id && requirements.some((r) => r.id === id)) {
      // One-shot deep-link sync from the URL, applied after hydration (not a
      // render-time derive, which would cause an SSG hydration mismatch); the
      // ref makes it run once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(id);
      appliedUrlSelection.current = true;
    } else if (requirements.length > 0) {
      appliedUrlSelection.current = true;
    }
  }, [requirements]);

  const close = useCallback(() => setSelectedId(null), []);

  // In the split, the spine is the way back: clicking the row that is already
  // open closes the panel and returns to the resting matrix (layout.md section
  // 5), while clicking any other row just moves the panel without closing.
  const selectFromSpine = useCallback(
    (id: string) => setSelectedId((current) => (current === id ? null : id)),
    []
  );

  // The header Next routes to the highest-priority unresolved item and opens it.
  // When nothing is pending it becomes Export response (a no-op stub here, the
  // export route is a later pass).
  function onNext() {
    if (priorityId) setSelectedId(priorityId);
    else exportRequirements(requirements);
  }

  // The panel Next advances to the next item within its current triage group,
  // rolling to the first item of the next non-empty group at the end (deriveTriage
  // order). It keeps the worklist flowing: approve, next, approve, next.
  const goNext = useCallback(
    (currentId: string) => {
      const pending = triage.groups
        .flatMap((group) => group.items)
        .filter((req) => req.status === "pending");
      const ordered =
        pending.length > 0 ? pending : triage.groups.flatMap((group) => group.items);
      const index = ordered.findIndex((r) => r.id === currentId);
      if (index === -1 || ordered.length === 0) return;
      const nextItem = ordered[(index + 1) % ordered.length];
      setSelectedId(nextItem.id);
    },
    [triage.groups]
  );

  // #16: keyboard shortcuts for the worklist. j / ArrowDown and k / ArrowUp move
  // through the worklist; `a` approves the selected item only when it is safe (a
  // confident, non-gating item — gating still needs the panel's named confirm).
  // Ignored while typing in a field. The listener re-subscribes when the worklist or
  // selection change, which is cheap.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const el = event.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const ordered = triage.groups.flatMap((group) => group.items);
      if (ordered.length === 0) return;
      const idx = selectedId
        ? ordered.findIndex((r) => r.id === selectedId)
        : -1;
      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedId(ordered[Math.min(ordered.length - 1, idx + 1)].id);
      } else if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedId(ordered[idx <= 0 ? 0 : idx - 1].id);
      } else if (event.key === "a" && selectedId) {
        const cur = ordered.find((r) => r.id === selectedId);
        if (cur && isConfidentNonGating(cur)) {
          event.preventDefault();
          approve(selectedId);
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [triage.groups, selectedId, approve]);

  // Live product, no tender loaded → the onboarding empty state (after all hooks).
  if (noTenderLoaded) {
    return (
      <>
        <DocumentHeader title="Compliance matrix" />
        <AppMain>
          <NoTenderLoaded />
        </AppMain>
      </>
    );
  }

  return (
    <>
      <DocumentHeader
        title={title}
        triage={{
          counts: triage.counts,
          activeFilter,
          onFilter: setActiveFilter,
          onNext,
          nextLabel: priorityId ? "Next" : "Export response",
        }}
      />

      <AppMain>
        {isWide && selected ? (
          // SPLIT open state: spine index (~300px) + panel, divided by a hairline.
          // The matrix grid is hidden; the spine is the matrix in miniature.
          <div className="grid min-h-[70vh] grid-cols-[300px_1fr] gap-0 divide-x divide-hairline">
            <div className="pr-4">
              <RequirementSpine
                groups={triage.groups}
                selectedId={selectedId}
                onSelect={selectFromSpine}
              />
            </div>
            <div className="pl-6">
              <RequirementPanel
                requirement={selected}
                variant="split"
                onApprove={approve}
                onEdit={editRequirement}
                onFlag={flag}
                onNext={() => goNext(selected.id)}
                onClose={close}
              />
            </div>
          </div>
        ) : (
          // RESTING, plus the narrow-viewport open state: the matrix stays put and
          // the panel arrives as a drawer over it (rendered below).
          <>
            <GatingHero onSelect={setSelectedId} />
            {priorityId === null && requirements.length > 0 && (
              <CompletionSummary
                total={requirements.length}
                approved={requirements.filter((req) => req.status === "accepted").length}
                edited={requirements.filter((req) => req.status === "edited").length}
                flagged={requirements.filter((req) => req.status === "flagged").length}
                time={latestDecisionTimeLabel(requirements)}
                onExport={() => exportRequirements(requirements)}
              />
            )}
            {priorityId !== null && requirements.length > 0 && (
              <p className="mb-3 font-mono text-xs text-ink-muted">
                <span className="text-ink">
                  Bidframe verified {verifiedCount} of {requirements.length}
                </span>{" "}
                — {needInput} need your input
                {decidedCount > 0 ? ` · ${decidedCount} decided` : ""}.
              </p>
            )}
            <ComplianceMatrix
              groups={triage.groups}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onApprove={approve}
              activeFilter={activeFilter}
              collapsed={collapsedGroups}
              onToggleGroup={toggleGroup}
            />
            <p className="mt-6 font-mono text-[11px] text-ink-muted/70">
              Keys: j / k to move, a to approve a confident item.
            </p>
          </>
        )}
      </AppMain>

      {/* Narrow-viewport fallback only: the same panel content in a slide-over.
          On wide screens the split owns the open state, so the drawer is idle. */}
      {!isWide && (
        <RequirementDrawer
          requirement={selected}
          onApprove={approve}
          onEdit={editRequirement}
          onFlag={flag}
          onNext={selected ? () => goNext(selected.id) : () => {}}
          onClose={close}
        />
      )}
    </>
  );
}

// The completion payoff (frontend-ux-audit #8): a Civic Record "record filed"
// sheet that marks the end of the loop and doubles as the export surface. The
// stamp is honest — it only lands when nothing is left flagged; an open concern
// gets a quiet line instead of a false victory. No signal colour, no confetti:
// the forest approval stamp is the one earned celebration.
function CompletionSummary({
  total,
  approved,
  edited,
  flagged,
  time,
  onExport,
}: {
  total: number;
  approved: number;
  edited: number;
  flagged: number;
  time?: string;
  onExport: () => void;
}) {
  const clean = flagged === 0;
  const noun = total === 1 ? "requirement" : "requirements";

  return (
    <section className="surface-grain mb-8 rounded-lg border border-hairline bg-paper-raised px-6 py-6 shadow-[var(--depth-sheet)]">
      <p className="font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
        {clean ? "Review complete" : "Ready to file"}
      </p>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold leading-tight text-ink">
            {total} {noun} reviewed
          </h2>
          <p className="mt-2 font-mono text-sm text-ink-muted">
            {approved} approved · {edited} edited
            {flagged > 0 ? ` · ${flagged} flagged` : ""}
          </p>
          {clean ? (
            <div className="mt-4">
              <ApprovalStamp time={time} />
            </div>
          ) : (
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-muted">
              {flagged} flagged for follow-up. Resolve or note them, then export
              the response.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onExport}
          className="shrink-0 self-start rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper shadow-[var(--depth-control)] transition-colors hover:bg-forest-hover sm:self-auto"
        >
          Export response
        </button>
      </div>
    </section>
  );
}
