"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useRequirements } from "@/context/RequirementsContext";
import { isApiEnabled } from "@/lib/api";
import type { Requirement } from "@/types/requirement";
import {
  deriveTriage,
  isConfidentNonGating,
  nextPriorityId,
  orderedWorklist,
  type GroupKey,
  type SortKey,
} from "@/lib/triage";
import { deriveVisibleGroups, type MatrixLens } from "@/lib/matrix-derive";
import { requirementPdfUrl, sourceRefLabel } from "@/lib/source-doc";
import { exportMatrixXlsx } from "@/lib/export-matrix-xlsx";
import { AnimatedNumber } from "./AnimatedNumber";
import { AppMain } from "./AppMain";
import { ApprovalStamp } from "./ApprovalStamp";
import { BulkActionBar } from "./BulkActionBar";
import { CommandPalette } from "./CommandPalette";
import { ComplianceMatrix } from "./ComplianceMatrix";
import { DocumentHeader } from "./DocumentHeader";
import { FocusMode } from "./FocusMode";
import { GatingHero } from "./GatingHero";
import { ControlPanel } from "./ControlPanel";
import { NoTenderLoaded } from "./NoTenderLoaded";
import { PdfSourceView, type MatchKind } from "./PdfSourceView";
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

// The short human name for a requirement in an undo toast: its clause ref when
// present, else its page — the same margin ref the matrix rows carry.
function toastRef(req: Requirement | undefined): string {
  if (!req) return "1 requirement";
  return (
    req.source_clause?.replace(/^section\s+/i, "") ?? `p.${req.source_page}`
  );
}

export function MatrixView({
  title,
  stageReturnHref = null,
}: {
  title: string;
  stageReturnHref?: string | null;
}) {
  const {
    requirements,
    tenderId,
    approve,
    editRequirement,
    flag,
    awardCriteria,
    approveMany,
    flagMany,
    snapshotDecisions,
    restoreDecisions,
    answerOpenQuestion,
  } = useRequirements();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<GroupKey | null>(null);
  // Category filter (empty set = all categories shown) and the row sort order.
  // Held here so the matrix, the header dropdown, command palette, and split
  // spine all read one source.
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set<string>()
  );
  const toggleCategory = useCallback((category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);
  const setCategoryFilter = useCallback((category: string | null) => {
    setActiveCategories(category ? new Set([category]) : new Set());
  }, []);
  const [sortBy, setSortBy] = useState<SortKey>("confidence");
  // Row density for the matrix: comfortable by default, compact for a longer
  // tender the user wants to see more of at once. Held here so it survives the
  // matrix unmounting into the split; threaded to ComplianceMatrix as an optional
  // prop (the frozen surfaces stay comfortable).
  const [density, setDensity] = useState<"compact" | "comfortable">(
    "comfortable"
  );
  // Which groups the user has folded away, keyed by the visible group's string
  // key (triage GroupKeys and criterion ids share one fold state, so a fold
  // survives switching lenses). The long, low-priority triage groups start
  // collapsed so a big tender opens short; the actionable ones start open. Held
  // here (not in ComplianceMatrix) so the fold survives the matrix unmounting when
  // a requirement opens the split.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set<string>(["ready", "decided"])
  );
  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  // The grouping lens: triage (what each row needs from you) or the tender's
  // award criteria. Under criteria the header's triage filter degrades to a
  // row-level predicate (see lib/matrix-derive.ts).
  const [lens, setLens] = useState<MatrixLens>("triage");
  // Multi-select for bulk decisions: the selected row ids plus the shift-range
  // anchor (the last row toggled without shift).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set<string>()
  );
  const [anchorId, setAnchorId] = useState<string | null>(null);
  // The persistent evidence pane beside the split panel (wide viewports only):
  // the tender page with the excerpt highlighted, or an honest placeholder when
  // no PDF exists. Open by default; a quiet control hides it for more measure.
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  // Focus mode: the full-screen one-at-a-time review overlay (Shift+F, or the
  // quiet Focus affordance in the matrix toolbar). An overlay, not a route.
  const [focusMode, setFocusMode] = useState(false);
  // The command palette (Cmd+K / Ctrl+K). While it is up, the j/k/a/e/f
  // worklist shortcuts stand down — cmdk owns the keyboard.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isWide = useIsWide();
  // Batch E motion wiring. `reduced` gates every animation this view owns
  // (motion/react's hook — no render-time window reads of our own).
  const reduced = useReducedMotion() ?? false;
  // The tender's identity, for the one-time entrance choreography: keys the
  // matrix's staged reveal and the header/summary counters ticking 0 → real.
  // The mock showcase has no tender id, so it gets one stable seed.
  const revealSeed = tenderId ?? "sample-tender";
  // Whether the split has ever been open: the resting view cross-fades back in
  // when returning from the split, but NOT on first load (entrance animation
  // belongs to the staged reveal alone). A one-way latch, set by the effect
  // below the handlers — state, not a ref, because the render reads it.
  const [splitSeen, setSplitSeen] = useState(false);
  // Bulk-approve cascade: written just before a batch decision commits, read
  // through ComplianceMatrix's getExitDelay as each affected row's exit starts
  // — a ~40ms stagger down the group, capped so a big sweep never queues for
  // seconds, cleared soon after so later single decisions exit immediately.
  const cascadeDelays = useRef<Map<string, number>>(new Map());
  const getExitDelay = useCallback(
    (id: string) => cascadeDelays.current.get(id) ?? 0,
    []
  );

  const triage = deriveTriage(requirements);

  // The display order the matrix will render (before its local search box),
  // for resolving a shift-click into a contiguous range of rows. Derived with
  // an empty query: a range never silently sweeps in rows a search is hiding
  // beyond what is on screen, because filters and lens match the live view.
  // (The palette's "Go to requirement" group searches the same visibleGroups,
  // so it can only land on rows the current filters would actually show.)
  const { flatOrder, groups: visibleGroups } = deriveVisibleGroups({
    groups: triage.groups,
    query: "",
    activeFilter,
    activeCategories,
    sortBy,
    lens,
    awardCriteria,
  });

  // Toggle one row's selection; shift extends from the anchor (the last row
  // toggled without shift) through the clicked row, in display order.
  const toggleSelected = useCallback(
    (id: string, shiftKey: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (shiftKey && anchorId && anchorId !== id) {
          const from = flatOrder.indexOf(anchorId);
          const to = flatOrder.indexOf(id);
          if (from !== -1 && to !== -1) {
            const [lo, hi] = from < to ? [from, to] : [to, from];
            for (let i = lo; i <= hi; i += 1) next.add(flatOrder[i]);
            return next;
          }
        }
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      if (!shiftKey) setAnchorId(id);
    },
    [anchorId, flatOrder]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set<string>());
    setAnchorId(null);
  }, []);

  // ---- Undoable decisions -------------------------------------------------
  // Every decision handler snapshots the affected rows BEFORE mutating, then
  // raises a toast whose Undo puts the snapshot back exactly (status + note).

  const undoAction = useCallback(
    (ids: string[]) => {
      const snapshot = snapshotDecisions(ids);
      return {
        label: "Undo",
        onClick: () => restoreDecisions(snapshot),
      };
    },
    [snapshotDecisions, restoreDecisions]
  );

  const approveWithUndo = useCallback(
    (id: string) => {
      const action = undoAction([id]);
      approve(id);
      toast(`Approved ${toastRef(requirements.find((r) => r.id === id))}`, {
        action,
      });
    },
    [approve, requirements, undoAction]
  );

  const editWithUndo = useCallback(
    (id: string, note: string) => {
      const action = undoAction([id]);
      editRequirement(id, note);
      toast(`Edited ${toastRef(requirements.find((r) => r.id === id))}`, {
        action,
      });
    },
    [editRequirement, requirements, undoAction]
  );

  const flagWithUndo = useCallback(
    (id: string, note: string) => {
      const action = undoAction([id]);
      flag(id, note);
      toast(`Flagged ${toastRef(requirements.find((r) => r.id === id))}`, {
        action,
      });
    },
    [flag, requirements, undoAction]
  );

  // Batch approve (the group header's "Approve all confident" and the bulk
  // bar): one state pass, one toast, one undo.
  const approveManyWithUndo = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const action = undoAction(ids);
      // Stage the exit cascade BEFORE the state commits: the rows read their
      // delay as their exit variant resolves, right after this render.
      cascadeDelays.current = new Map(
        ids.map((id, index) => [id, Math.min(index * 0.04, 0.6)])
      );
      window.setTimeout(() => cascadeDelays.current.clear(), 2000);
      approveMany(ids);
      const label =
        ids.length === 1
          ? `Approved ${toastRef(requirements.find((r) => r.id === ids[0]))}`
          : `Approved ${ids.length} requirements`;
      toast(label, { action });
    },
    [approveMany, requirements, undoAction]
  );

  // Bulk-bar approve: only the confident non-gating members of the selection —
  // a sweep can never wave a deal-breaker through.
  const selectedList = requirements.filter((req) => selectedIds.has(req.id));
  const eligibleSelected = selectedList.filter(isConfidentNonGating);
  const selectedDealBreakers = selectedList.filter((req) => req.is_gating);

  const bulkApprove = useCallback(() => {
    approveManyWithUndo(eligibleSelected.map((req) => req.id));
    clearSelection();
  }, [approveManyWithUndo, eligibleSelected, clearSelection]);

  const bulkFlag = useCallback(
    (note: string) => {
      const ids = selectedList.map((req) => req.id);
      if (ids.length === 0) return;
      const action = undoAction(ids);
      flagMany(ids, note);
      const label =
        ids.length === 1
          ? `Flagged ${toastRef(selectedList[0])}`
          : `Flagged ${ids.length} requirements`;
      toast(label, { action });
      clearSelection();
    },
    [selectedList, flagMany, undoAction, clearSelection]
  );
  // The distinct categories present, sorted by label, for the header dropdown.
  // Cheap to derive each render, like triage above.
  const availableCategories = Array.from(
    new Set(requirements.map((req) => req.category))
  ).sort((a, b) => a.localeCompare(b));
  const selected = requirements.find((r) => r.id === selectedId) ?? null;
  const priorityId = nextPriorityId(requirements);
  // What still needs a human: gaps to fill + deal-breakers / low-confidence to verify.
  // Everything else, Bidframe has "handled" (ready to approve, or already decided).
  // Deliberately "handled", not "verified" — a flagged low-confidence item is off your
  // plate but was never verified, so counting it as verified would over-claim.
  const needInput = triage.counts["needs-you"] + triage.counts["to-verify"];
  const handledCount = requirements.length - needInput;

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

  // The two export paths: the styled Excel workbook (primary — dynamic import,
  // exceljs stays in its own async chunk) and the plain CSV (quiet secondary).
  const exportXlsx = useCallback(() => {
    void exportMatrixXlsx({ title, requirements, awardCriteria });
  }, [title, requirements, awardCriteria]);

  const exportCsv = useCallback(() => {
    exportRequirements(requirements);
  }, [requirements]);

  // The header Next routes to the highest-priority unresolved item and opens it.
  // When nothing is pending it becomes Export response — the styled workbook.
  function onNext() {
    if (priorityId) setSelectedId(priorityId);
    else exportXlsx();
  }

  // The panel Next advances to the next item within its current triage group,
  // rolling to the first item of the next non-empty group at the end (deriveTriage
  // order). It keeps the worklist flowing: approve, next, approve, next.
  const goNext = useCallback(
    (currentId: string) => {
      const ordered = orderedWorklist(triage);
      const index = ordered.findIndex((r) => r.id === currentId);
      if (index === -1 || ordered.length === 0) return;
      const nextItem = ordered[(index + 1) % ordered.length];
      setSelectedId(nextItem.id);
    },
    [triage]
  );

  // #16: keyboard shortcuts for the worklist. j / ArrowDown and k / ArrowUp move
  // through the worklist; `a` approves the selected item only when it is safe (a
  // confident, non-gating item — gating still needs the panel's named confirm).
  // Ignored while typing in a field. The listener re-subscribes when the worklist or
  // selection change, which is cheap.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // Focus mode owns the keyboard while it is up (its own j/k/a/Esc).
      if (focusMode) return;
      // Cmd+K / Ctrl+K toggles the command palette — checked before the input
      // bail so it works from the search box too.
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      // While the palette is up, cmdk owns the keyboard: the j/k/a/e/f
      // worklist shortcuts (and Shift+F) are suppressed.
      if (paletteOpen) return;
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
      if (event.key === "F" && event.shiftKey) {
        event.preventDefault();
        setFocusMode(true);
        return;
      }
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
          approveWithUndo(selectedId);
        }
      } else if (event.key === "e" || event.key === "f") {
        // Edit / flag both need a typed note, so they cannot act blind from the
        // list: open the panel on the current row (or the first item) where the
        // note field lives, and let the user commit there.
        const target = selectedId ?? ordered[0]?.id ?? null;
        if (target) {
          event.preventDefault();
          setSelectedId(target);
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [triage.groups, selectedId, approveWithUndo, focusMode, paletteOpen]);

  useEffect(() => {
    if (!stageReturnHref) return;
    const returnHref = stageReturnHref;

    function onStageAdvance(event: KeyboardEvent) {
      if (event.key !== "ArrowRight") return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "A" ||
          target.tagName === "BUTTON" ||
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      event.preventDefault();
      router.push(returnHref);
    }

    document.addEventListener("keydown", onStageAdvance, true);
    return () => document.removeEventListener("keydown", onStageAdvance, true);
  }, [router, stageReturnHref]);

  // Remember that the split has been open, so the resting view knows a return
  // from the split (cross-fade) from a first paint (staged reveal only). The
  // latch flips once per session, after the split's first paint.
  const splitOpen = isWide && selected !== null && !focusMode;
  useEffect(() => {
    if (splitOpen) {
      // One-way latch, not a render-time derive.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSplitSeen(true);
    }
  }, [splitOpen]);

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
          categories: availableCategories,
          activeCategories,
          onSetCategory: setCategoryFilter,
          sortBy,
          onSortChange: setSortBy,
        }}
      />

      <ControlPanel />

      {stageReturnHref && (
        <div className="border-b border-hairline bg-paper">
          <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-6 py-3">
            <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
              Live walkthrough
            </p>
            {/* Returns to the showcase home (resting matrix). The deck handoff
                stays on ArrowRight (stageReturnHref), off any visible control. */}
            <button
              type="button"
              onClick={() => {
                close();
                window.scrollTo({ top: 0 });
              }}
              className="font-mono text-xs uppercase tracking-wide text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:text-forest-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Back to matrix
            </button>
          </div>
        </div>
      )}

      <AppMain>
        {isWide && selected && !focusMode ? (
          // SPLIT open state: spine index + panel, divided by hairlines, with the
          // persistent evidence pane (the tender page itself, excerpt highlighted)
          // as a third column while it is shown. The matrix grid is hidden; the
          // spine is the matrix in miniature.
          <motion.div
            // Split open: a quick cross-fade in (the drawer's CSS twin lives
            // in RequirementDrawer). Static under reduced motion.
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={
              evidenceOpen
                ? "grid min-h-[70vh] grid-cols-[280px_minmax(0,1fr)_minmax(340px,42%)] gap-0 divide-x divide-hairline"
                : "grid min-h-[70vh] grid-cols-[300px_1fr] gap-0 divide-x divide-hairline"
            }
          >
            <div className="pr-4">
              <RequirementSpine
                groups={triage.groups}
                selectedId={selectedId}
                onSelect={selectFromSpine}
              />
            </div>
            <div className="flex min-w-0 flex-col pl-6">
              {/* Always-visible way back to the resting matrix — the decision
                  zone's quiet Close sits below the fold on stage, so the exit
                  must live at the top too (Esc still works). */}
              <div className="flex items-center justify-between pb-2">
                <button
                  type="button"
                  onClick={close}
                  className="font-mono text-xs text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                >
                  ← Back to the matrix
                </button>
                {!evidenceOpen && (
                  <button
                    type="button"
                    onClick={() => setEvidenceOpen(true)}
                    className="font-mono text-xs text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                  >
                    Show source
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1">
                <RequirementPanel
                  requirement={selected}
                  variant="split"
                  onApprove={approveWithUndo}
                  onEdit={editWithUndo}
                  onFlag={flagWithUndo}
                  onNext={() => goNext(selected.id)}
                  onClose={close}
                />
              </div>
            </div>
            {evidenceOpen && (
              <aside className="min-w-0 pl-5">
                {/* Sticky so the page stays alongside while the panel scrolls.
                    Keyed by requirement so the match signal resets per item. */}
                <div className="sticky top-6 h-[min(82vh,56rem)]">
                  <EvidencePane
                    key={selected.id}
                    requirement={selected}
                    pdfUrl={requirementPdfUrl(tenderId, selected)}
                    onHide={() => setEvidenceOpen(false)}
                  />
                </div>
              </aside>
            )}
          </motion.div>
        ) : (
          // RESTING, plus the narrow-viewport open state: the matrix stays put
          // and the panel arrives as a drawer over it (rendered below). The
          // wrapper cross-fades ONLY when returning from the split (the ref
          // below) — first load stays with the staged reveal, nothing else.
          <motion.div
            initial={reduced || !splitSeen ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            <GatingHero onSelect={setSelectedId} />
            {priorityId === null && requirements.length > 0 && (
              <CompletionSummary
                total={requirements.length}
                approved={requirements.filter((req) => req.status === "accepted").length}
                edited={requirements.filter((req) => req.status === "edited").length}
                flagged={requirements.filter((req) => req.status === "flagged").length}
                time={latestDecisionTimeLabel(requirements)}
                onExportXlsx={exportXlsx}
                onExportCsv={exportCsv}
              />
            )}
            {priorityId !== null && requirements.length > 0 && (
              <div className="mb-3">
                <p className="font-mono text-xs text-ink-muted">
                  {/* Keyed by the tender identity: the counts tick 0 → real
                      once per tender, then spring between values as decisions
                      land (AnimatedNumber; reduced motion jumps). */}
                  <span className="text-ink">
                    Bidframe handled{" "}
                    <AnimatedNumber
                      key={`handled-${revealSeed}`}
                      value={handledCount}
                      from={0}
                    />{" "}
                    of{" "}
                    <AnimatedNumber
                      key={`total-${revealSeed}`}
                      value={requirements.length}
                      from={0}
                    />
                  </span>{" "}
                  —{" "}
                  <AnimatedNumber
                    key={`need-${revealSeed}`}
                    value={needInput}
                    from={0}
                  />{" "}
                  still need your input.
                </p>
                {/* A slim derived progress track: forest fill on a hairline
                    rule, showing how much Bidframe has already carried. No new
                    state, purely the counts above. */}
                <div
                  className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-hairline"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={requirements.length}
                  aria-valuenow={handledCount}
                  aria-label="Requirements Bidframe has handled"
                >
                  <div
                    className="h-full rounded-full bg-forest transition-[width] duration-500"
                    style={{
                      width: `${
                        requirements.length > 0
                          ? (handledCount / requirements.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
            <ComplianceMatrix
              groups={triage.groups}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onApprove={approveWithUndo}
              onApproveMany={approveManyWithUndo}
              activeFilter={activeFilter}
              activeCategories={activeCategories}
              sortBy={sortBy}
              collapsed={collapsedGroups}
              onToggleGroup={toggleGroup}
              density={density}
              onDensityChange={setDensity}
              lens={lens}
              onLensChange={setLens}
              awardCriteria={awardCriteria}
              selection={{ ids: selectedIds, onToggle: toggleSelected }}
              onAnswerQuestion={answerOpenQuestion}
              onEnterFocus={() => setFocusMode(true)}
              revealKey={revealSeed}
              getExitDelay={getExitDelay}
            />
            <p className="mt-6 font-mono text-[11px] text-ink-muted/70">
              Keys: j / k to move, a to approve a confident item, Shift+F to
              focus, ⌘K for commands.
            </p>
          </motion.div>
        )}
      </AppMain>

      {/* Narrow-viewport fallback only: the same panel content in a slide-over.
          On wide screens the split owns the open state, so the drawer is idle.
          Focus mode owns the whole screen, so the drawer stands down under it. */}
      {!isWide && !focusMode && (
        <RequirementDrawer
          requirement={selected}
          onApprove={approveWithUndo}
          onEdit={editWithUndo}
          onFlag={flagWithUndo}
          onNext={selected ? () => goNext(selected.id) : () => {}}
          onClose={close}
        />
      )}

      {/* Focus mode: the full-screen one-at-a-time review. Decisions go through
          the same undo-wrapped handlers, so every toast still fires. */}
      {focusMode && (
        <FocusMode
          triage={triage}
          onApprove={approveWithUndo}
          onEdit={editWithUndo}
          onFlag={flagWithUndo}
          onClose={() => setFocusMode(false)}
        />
      )}

      {/* The floating bulk-decision bar, alive while any rows are selected. */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          eligibleCount={eligibleSelected.length}
          dealBreakerCount={selectedDealBreakers.length}
          onApprove={bulkApprove}
          onFlag={bulkFlag}
          onClear={clearSelection}
        />
      )}

      {/* The command palette (Cmd+K): every matrix action from the keyboard. */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={visibleGroups}
        onSelectRequirement={setSelectedId}
        activeFilter={activeFilter}
        onFilter={setActiveFilter}
        categories={availableCategories}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        density={density}
        onDensityChange={setDensity}
        lens={lens}
        onLensChange={setLens}
        onEnterFocus={() => setFocusMode(true)}
        evidenceOpen={evidenceOpen}
        onToggleEvidence={() => setEvidenceOpen((open) => !open)}
        onExportXlsx={exportXlsx}
        onExportCsv={exportCsv}
      />
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
  onExportXlsx,
  onExportCsv,
}: {
  total: number;
  approved: number;
  edited: number;
  flagged: number;
  time?: string;
  onExportXlsx: () => void;
  onExportCsv: () => void;
}) {
  const clean = flagged === 0;
  const noun = total === 1 ? "requirement" : "requirements";
  // The stamp lands with a motion spring (settle={false} keeps ApprovalStamp's
  // own CSS entrance off — one entrance, not two). Under reduced motion the
  // default CSS path takes over, which globals.css already renders static.
  const reduced = useReducedMotion() ?? false;

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
              {reduced ? (
                <ApprovalStamp time={time} />
              ) : (
                // The landing thud: oversized, faded, over-rotated, then a
                // springy settle — the motion twin of the CSS stamp-settle
                // cubic-bezier(0.34,1.56,0.64,1) in globals.css.
                <motion.div
                  className="inline-block origin-left"
                  initial={{ scale: 1.4, opacity: 0, rotate: -6 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 17,
                    mass: 0.9,
                  }}
                >
                  <ApprovalStamp time={time} settle={false} />
                </motion.div>
              )}
            </div>
          ) : (
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-muted">
              {flagged} flagged for follow-up. Resolve or note them, then export
              the response.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4 self-start sm:self-auto">
          <button
            type="button"
            onClick={onExportCsv}
            className="font-mono text-xs text-ink-muted underline decoration-hairline underline-offset-4 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
          >
            .csv
          </button>
          <button
            type="button"
            onClick={onExportXlsx}
            className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper shadow-[var(--depth-control)] transition-colors hover:bg-forest-hover"
          >
            Export .xlsx
          </button>
        </div>
      </div>
    </section>
  );
}

// The persistent evidence pane (wide split only): the actual tender page,
// rendered by the same PdfSourceView the verify overlay uses, with the excerpt
// highlighted. Above it, a mono header names the document and page and carries
// the honest match signal — a word in a chip, never a score. When no PDF exists
// (the plain mock), a calm placeholder holds the pane so it is never a broken
// hole. Keyed by requirement in the owner so the match state resets per item.

// Tailwind 4: full literal class strings in a lookup map, never template-built.
const MATCH_CHIP: Record<
  MatchKind,
  { label: string; className: string }
> = {
  exact: {
    label: "Verified on page",
    className:
      "shrink-0 rounded-full border border-forest/40 bg-forest/10 px-2 py-0.5 font-mono text-[11px] text-forest",
  },
  approximate: {
    label: "Close match",
    className:
      "shrink-0 rounded-full border border-signal-amber/60 bg-signal-amber/15 px-2 py-0.5 font-mono text-[11px] text-ink",
  },
  unlocated: {
    label: "Could not pin the excerpt",
    className:
      "shrink-0 rounded-full border border-hairline px-2 py-0.5 font-mono text-[11px] text-ink-muted",
  },
};

function EvidencePane({
  requirement,
  pdfUrl,
  onHide,
}: {
  requirement: Requirement;
  pdfUrl: string | null;
  onHide: () => void;
}) {
  // null while PdfSourceView is still locating the line.
  const [match, setMatch] = useState<MatchKind | null>(null);
  const ref = sourceRefLabel(requirement);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 pb-2">
        <p
          className="min-w-0 truncate font-mono text-xs text-ink-muted"
          title={
            requirement.source_filename
              ? `${requirement.source_filename} · ${ref}`
              : ref
          }
        >
          {requirement.source_filename && (
            <span className="text-accent/70">
              {requirement.source_filename} ·{" "}
            </span>
          )}
          <span className="text-accent">{ref}</span>
        </p>
        <span className="flex shrink-0 items-center gap-3">
          {pdfUrl &&
            (match === null ? (
              <span className="font-mono text-[11px] text-ink-muted">
                Finding the line…
              </span>
            ) : (
              <span className={MATCH_CHIP[match].className}>
                {MATCH_CHIP[match].label}
              </span>
            ))}
          <button
            type="button"
            onClick={onHide}
            className="font-mono text-xs text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
          >
            Hide source
          </button>
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-hairline">
        {pdfUrl ? (
          <PdfSourceView
            pdfUrl={pdfUrl}
            page={requirement.source_page}
            excerpt={requirement.source_excerpt}
            onMatch={setMatch}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-paper-recessed p-6 shadow-[var(--depth-pressed)]">
            <p className="max-w-[36ch] text-center font-mono text-xs leading-relaxed text-ink-muted">
              {ref} — source PDF available when a tender is uploaded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
