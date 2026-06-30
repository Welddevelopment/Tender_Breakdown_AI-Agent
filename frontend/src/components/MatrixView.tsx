"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import {
  deriveTriage,
  nextPriorityId,
  type GroupKey,
} from "@/lib/triage";
import { summarize } from "@/lib/export";
import { AppMain } from "./AppMain";
import { ComplianceMatrix } from "./ComplianceMatrix";
import { CompletionBanner, ExportDialog } from "./ExportDialog";
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

export function MatrixView({ title }: { title: string }) {
  const { requirements, approve, editRequirement, flag } = useRequirements();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<GroupKey | null>(null);
  const [exporting, setExporting] = useState(false);
  const isWide = useIsWide();

  const triage = deriveTriage(requirements);
  const selected = requirements.find((r) => r.id === selectedId) ?? null;
  const priorityId = nextPriorityId(requirements);

  const close = useCallback(() => setSelectedId(null), []);

  // In the split, the spine is the way back: clicking the row that is already
  // open closes the panel and returns to the resting matrix (layout.md section
  // 5), while clicking any other row just moves the panel without closing.
  const selectFromSpine = useCallback(
    (id: string) => setSelectedId((current) => (current === id ? null : id)),
    []
  );

  // The header Next routes to the highest-priority unresolved item and opens it.
  // When nothing is pending it becomes Export response and opens the export.
  function onNext() {
    if (priorityId) setSelectedId(priorityId);
    else if (requirements.length > 0) setExporting(true);
  }

  // The panel Next advances to the next item within its current triage group,
  // rolling to the first item of the next non-empty group at the end (deriveTriage
  // order). It keeps the worklist flowing: approve, next, approve, next.
  const goNext = useCallback(
    (currentId: string) => {
      const ordered = triage.groups.flatMap((group) => group.items);
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
            {priorityId === null && requirements.length > 0 && (
              <CompletionBanner
                summary={summarize(requirements)}
                onExport={() => setExporting(true)}
              />
            )}
            <GatingHero />
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

      {exporting && (
        <ExportDialog title={title} onClose={() => setExporting(false)} />
      )}
    </>
  );
}
