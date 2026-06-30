"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRequirements } from "@/context/RequirementsContext";
import type { Requirement } from "@/types/requirement";
import {
  deriveTriage,
  nextPriorityId,
  type GroupKey,
} from "@/lib/triage";
import { AppMain } from "./AppMain";
import { ComplianceMatrix } from "./ComplianceMatrix";
import { DocumentHeader } from "./DocumentHeader";
import { GatingHero } from "./GatingHero";
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

export function MatrixView({ title }: { title: string }) {
  const { requirements, approve, editRequirement, flag } = useRequirements();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<GroupKey | null>(null);
  const isWide = useIsWide();

  const triage = deriveTriage(requirements);
  const selected = requirements.find((r) => r.id === selectedId) ?? null;
  const priorityId = nextPriorityId(requirements);
  const decidedCount = requirements.filter((req) => req.status !== "pending").length;

  // Open a requirement from a ?req= URL param (a deep link from the graph, a
  // shared link, or a refresh), once, after its requirement is present.
  const appliedUrlSelection = useRef(false);
  useEffect(() => {
    if (appliedUrlSelection.current) return;
    const id = new URLSearchParams(window.location.search).get("req");
    if (id && requirements.some((r) => r.id === id)) {
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
                onExport={() => exportRequirements(requirements)}
              />
            )}
            {priorityId !== null && decidedCount > 0 && (
              <p className="mb-2 font-mono text-xs text-ink-muted">
                {decidedCount} of {requirements.length} requirements decided.
              </p>
            )}
            <ComplianceMatrix
              groups={triage.groups}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onApprove={approve}
              activeFilter={activeFilter}
            />
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

function CompletionSummary({
  total,
  approved,
  edited,
  flagged,
  onExport,
}: {
  total: number;
  approved: number;
  edited: number;
  flagged: number;
  onExport: () => void;
}) {
  return (
    <section className="mb-8 border-y-2 border-ink py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Matrix ready to export
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {total} requirements reviewed: {approved} approved, {edited} edited,
            {flagged} flagged.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="shrink-0 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
        >
          Export CSV
        </button>
      </div>
    </section>
  );
}
