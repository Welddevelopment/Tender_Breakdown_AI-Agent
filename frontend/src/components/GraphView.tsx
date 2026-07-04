"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRequirements } from "@/context/RequirementsContext";
import { isApiEnabled } from "@/lib/api";
import {
  sourceDocumentKind,
  sourceKindLabel,
  sourceKindShortLabel,
  type SourceDocumentKind,
  sourceRefLabel,
} from "@/lib/source-doc";
import type { Requirement } from "@/types/requirement";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { CategoryTag } from "@/components/CategoryTag";
import { categoryStyle } from "@/lib/categoryStyle";
import {
  UNASSIGNED,
  critKey,
  criterionLabel,
  critNodeId,
  traceSet,
  critTraceSet,
} from "@/lib/structure";

// The relationship map (CLAUDE.md priority 4; design-language: the civic record).
// The tender's schedule of cross-references drawn as a wiring diagram: every
// requirement wired to the award criterion it is scored against, and to the
// requirements it depends on. It is NOT a generic node graph. Requirements are
// banded into criterion swimlanes; hovering or selecting one traces its path and
// dims the rest; a minimap keeps a big tender navigable.
//
// As the right pane of the linked workspace it is controlled by StructureView:
// it emits selection/hover and reads them back, so it and the ledger light in
// lockstep, and clicking a requirement opens the drawer instead of ejecting to
// the matrix. Used standalone (the /demo showcase, interactive=false) it keeps
// its own header and the deep-link-to-matrix behaviour.

// Layout geometry. Requirements stack in the left column in criterion order, so
// each criterion's feeders sit together; the criterion is placed at the vertical
// centroid of its group, which turns crossing spaghetti into clean roll-ups.
const REQ_X = 0;
const CRIT_X = 560;
const ROW_GAP = 104;
const LABEL_Y = -56;
const CARD_H = 100;
const LANE_X = -28;
const LANE_W = 312;

// Edge inks (the signal palette lives on status carriers only).
const INK_OXBLOOD = "#8a2d2a";
const INK_FOREST = "#2c5640";
const INK_LINK = "#b4a892";

const HANDLE: React.CSSProperties = {
  width: 7,
  height: 7,
  minWidth: 0,
  minHeight: 0,
  background: "var(--color-hairline)",
  border: "1px solid var(--color-paper-raised)",
};

const SOURCE_BADGE_TONE: Record<SourceDocumentKind, string> = {
  pdf: "border-ink/20 bg-paper text-ink-muted",
  word: "border-forest/30 bg-forest/5 text-forest",
  excel: "border-accent/35 bg-accent/5 text-accent",
  csv: "border-signal-amber/40 bg-signal-amber/10 text-ink",
  document: "border-hairline bg-paper text-ink-muted",
};

function CheckMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SourceTypeBadge({ req }: { req: Requirement }) {
  const kind = sourceDocumentKind(req);
  return (
    <span
      title={sourceKindLabel(req)}
      className={`inline-flex h-4 shrink-0 items-center rounded border px-1 font-mono text-[9px] font-medium leading-none ${SOURCE_BADGE_TONE[kind]}`}
    >
      {sourceKindShortLabel(kind)}
    </span>
  );
}

// A faint horizontal band grouping one criterion's requirements — the swimlane
// that makes the grouping visible instead of merely implied by vertical order.
// Sits behind the cards (negative z), never interactive.
function LaneNode({ data }: NodeProps) {
  const { label, tint } = data as unknown as { label: string; tint: boolean };
  return (
    <div
      className="relative h-full w-full rounded-lg border border-dashed border-hairline"
      style={{ background: tint ? "rgba(33,29,23,0.022)" : "transparent" }}
    >
      <span className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted/80">
        {label}
      </span>
    </div>
  );
}

// A requirement, as a register card. Gating items take the 2px oxblood reading
// edge. Dimmed when another item's trace is active; ringed when selected.
function RequirementNode({ data }: NodeProps) {
  const { req, dim, selected } = data as unknown as {
    req: Requirement;
    dim?: boolean;
    selected?: boolean;
  };
  const gating = req.is_gating;
  const unanswerable = gating && req.status === "pending";
  const ref = sourceRefLabel(req);

  return (
    <div
      className={`surface-grain w-[256px] rounded-md bg-paper-raised px-3 py-2.5 shadow-[var(--depth-row)] transition-all hover:shadow-[var(--depth-sheet)] ${
        gating
          ? "rounded-l-none border-y border-r border-l-2 border-hairline border-l-signal-oxblood-frame"
          : "border border-hairline"
      } ${dim ? "opacity-35" : "opacity-100"} ${
        selected ? "ring-2 ring-forest ring-offset-1 ring-offset-paper" : ""
      }`}
      style={
        gating
          ? undefined
          : { borderLeftWidth: 2, borderLeftColor: categoryStyle(req.category).hex }
      }
    >
      <Handle id="r" type="source" position={Position.Right} isConnectable={false} style={HANDLE} />
      <Handle
        id="dout"
        type="source"
        position={Position.Left}
        isConnectable={false}
        style={{ ...HANDLE, top: "38%" }}
      />
      <Handle
        id="din"
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={{ ...HANDLE, top: "62%" }}
      />

      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 font-mono text-[11px] leading-tight text-ink-muted">
          <SourceTypeBadge req={req} />
          <span className="truncate">{ref}</span>
        </span>
        <ConfidenceIndicator
          confidence={req.confidence}
          needsReview={req.needs_review}
          unanswerable={unanswerable}
          variant="dot"
          size="sm"
        />
      </div>

      <p
        className={`mt-1.5 line-clamp-2 text-[12.5px] leading-snug text-ink ${
          gating ? "font-medium" : ""
        }`}
      >
        {req.text}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[10.5px] text-ink-muted">
        <span>{ref}</span>
        {gating ? (
          <span className="font-medium text-signal-oxblood">Deal-breaker</span>
        ) : req.status === "accepted" ? (
          <span className="inline-flex items-center gap-1 text-forest">
            <CheckMark />
            Approved
          </span>
        ) : (
          <CategoryTag category={req.category} />
        )}
      </div>
    </div>
  );
}

// An award criterion: the fixed structure of the tender, a tab pressed into the
// page. Pinned (from the ledger) takes an accent ring; dimmed off-trace.
function CriterionNode({ data }: NodeProps) {
  const { num, count, hasGating, dim, pinned } = data as unknown as {
    num: string;
    count: number;
    hasGating: boolean;
    dim?: boolean;
    pinned?: boolean;
  };

  return (
    <div
      className={`w-[184px] rounded-md border border-hairline bg-paper-recessed px-3 py-2.5 shadow-[var(--depth-pressed)] transition-all ${
        dim ? "opacity-35" : "opacity-100"
      } ${pinned ? "ring-2 ring-accent ring-offset-1 ring-offset-paper" : ""}`}
    >
      <Handle id="c" type="target" position={Position.Left} isConnectable={false} style={HANDLE} />
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        Award criterion
      </p>
      <p className="mt-0.5 font-mono text-lg font-medium leading-none text-ink">
        {num}
      </p>
      <p className="mt-1.5 font-mono text-[11px] text-ink-muted">
        {count} requirement{count !== 1 ? "s" : ""}
      </p>
      {hasGating && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[10.5px] text-signal-oxblood">
          <span
            className="h-1.5 w-1.5 rounded-full bg-signal-oxblood shadow-[0_0_0_1px_rgba(33,29,23,0.3)]"
            aria-hidden
          />
          has a deal-breaker
        </p>
      )}
    </div>
  );
}

function ColumnLabelNode({ data }: NodeProps) {
  const { label, count } = data as unknown as { label: string; count: number };
  return (
    <div className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-ink">
        {label}
      </span>
      <span className="font-mono text-[11px] text-ink-muted">{count}</span>
    </div>
  );
}

const nodeTypes = {
  requirement: RequirementNode,
  criterion: CriterionNode,
  columnLabel: ColumnLabelNode,
  lane: LaneNode,
};

// Bespoke zoom controls on warmed paper, replacing the default white buttons.
function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const btn =
    "flex h-8 w-9 items-center justify-center text-ink-muted transition-colors hover:bg-paper-recessed hover:text-ink focus:outline-none focus-visible:bg-paper-recessed";

  return (
    <Panel position="bottom-left">
      <div className="flex flex-col divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-paper-raised shadow-[var(--depth-row)]">
        <button type="button" aria-label="Zoom in" onClick={() => zoomIn()} className={`${btn} text-base`}>
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomOut()} className={`${btn} text-base`}>
          −
        </button>
        <button
          type="button"
          aria-label="Fit to view"
          onClick={() => fitView({ padding: 0.2 })}
          className={`${btn} font-mono text-[10px] uppercase tracking-wider`}
        >
          Fit
        </button>
      </div>
    </Panel>
  );
}

// The legend, the key box on an official drawing.
function GraphKey() {
  return (
    <Panel position="top-right">
      <div className="surface-grain w-[208px] rounded-md border border-hairline bg-paper-raised p-3 shadow-[var(--depth-row)]">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          Key
        </p>
        <ul className="flex flex-col gap-2 text-[11.5px] text-ink">
          <li className="flex items-center gap-2.5">
            <span className="h-3.5 w-5 shrink-0 rounded-sm rounded-l-none border-y border-r border-l-2 border-hairline border-l-signal-oxblood-frame bg-paper-raised" />
            Deal-breaker
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-3.5 w-5 shrink-0 rounded-sm border border-hairline bg-paper-recessed shadow-[var(--depth-pressed)]" />
            Award criterion
          </li>
          <li className="flex items-center gap-2.5">
            <svg width="20" height="8" viewBox="0 0 20 8" aria-hidden className="shrink-0">
              <line x1="0" y1="4" x2="20" y2="4" stroke={INK_LINK} strokeWidth="1.5" />
            </svg>
            Scored against
          </li>
          <li className="flex items-center gap-2.5">
            <svg width="20" height="8" viewBox="0 0 20 8" aria-hidden className="shrink-0">
              <line x1="0" y1="4" x2="20" y2="4" stroke={INK_OXBLOOD} strokeWidth="2" />
            </svg>
            Deal-breaker link
          </li>
          <li className="flex items-center gap-2.5">
            <svg width="20" height="8" viewBox="0 0 20 8" aria-hidden className="shrink-0">
              <line
                x1="0"
                y1="4"
                x2="20"
                y2="4"
                stroke={INK_FOREST}
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
            </svg>
            Depends on
          </li>
        </ul>
      </div>
    </Panel>
  );
}

interface GraphViewProps {
  interactive?: boolean;
  // Linked-workspace controls (StructureView). When onSelectRequirement is set
  // the map is controlled: it emits selection instead of routing to the matrix.
  filter?: (r: Requirement) => boolean;
  selectedId?: string | null;
  hoveredId?: string | null;
  selectedCrit?: string | null;
  onSelectRequirement?: (id: string) => void;
  onHoverRequirement?: (id: string | null) => void;
  onSelectCrit?: (key: string | null) => void;
  // Drop the standalone header/description; fill the parent pane's height.
  embedded?: boolean;
  chrome?: "full" | "min";
}

export function GraphView({
  interactive = true,
  filter,
  selectedId = null,
  hoveredId = null,
  selectedCrit = null,
  onSelectRequirement,
  onHoverRequirement,
  onSelectCrit,
  embedded = false,
  chrome = "full",
}: GraphViewProps) {
  const { requirements: allRequirements, tenderId } = useRequirements();
  const router = useRouter();
  const controlled = Boolean(onSelectRequirement);

  // Uncontrolled (standalone) keeps its own deal-breakers lens; controlled takes
  // the workspace filter instead.
  const [gatingOnly, setGatingOnly] = useState(false);
  const gatingCount = allRequirements.filter((r) => r.is_gating).length;

  const requirements = useMemo(() => {
    let rs = filter ? allRequirements.filter(filter) : allRequirements;
    if (!filter && gatingOnly) rs = rs.filter((r) => r.is_gating);
    return rs;
  }, [allRequirements, filter, gatingOnly]);

  // Node click: open in the drawer (controlled) or deep-link to the matrix
  // (standalone). Clicking a criterion pins/unpins its lane.
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "requirement") {
        if (onSelectRequirement) onSelectRequirement(node.id);
        else if (interactive) router.push(`/review?req=${node.id}`);
        return;
      }
      if (node.type === "criterion" && onSelectCrit) {
        const key = node.id.replace(/^crit:/, "");
        onSelectCrit(selectedCrit === key ? null : key);
      }
    },
    [onSelectRequirement, onSelectCrit, selectedCrit, interactive, router]
  );

  const onNodeEnter = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (node.type === "requirement") onHoverRequirement?.(node.id);
    },
    [onHoverRequirement]
  );
  const onNodeLeave = useCallback(() => onHoverRequirement?.(null), [
    onHoverRequirement,
  ]);

  // Base layout: lanes, columns, criteria, requirements, and the edges. Rebuilt
  // only when the visible requirement slice changes.
  const { baseNodes, baseEdges, counts } = useMemo(() => {
    const reqIds = new Set(requirements.map((r) => r.id));

    const critRefs = Array.from(
      new Set(
        requirements
          .map((r) => r.criteria_ref)
          .filter((ref): ref is string => ref !== null)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const grouped: Requirement[] = [
      ...critRefs.flatMap((ref) =>
        requirements.filter((r) => r.criteria_ref === ref)
      ),
      ...requirements.filter((r) => !r.criteria_ref),
    ];
    const indexOf = new Map(grouped.map((r, i) => [r.id, i] as const));

    // Swimlanes: one faint band per contiguous criterion segment (grouped order
    // makes each criterion's members contiguous), plus one for the unassigned tail.
    const laneNodes: Node[] = [];
    let segStart = 0;
    for (let i = 1; i <= grouped.length; i++) {
      const prevKey = critKey(grouped[i - 1]?.criteria_ref);
      const curKey = i < grouped.length ? critKey(grouped[i].criteria_ref) : null;
      if (curKey !== prevKey) {
        const count = i - segStart;
        laneNodes.push({
          id: `lane:${prevKey}:${segStart}`,
          type: "lane",
          position: { x: LANE_X, y: segStart * ROW_GAP - 18 },
          data: {
            label: criterionLabel(prevKey === UNASSIGNED ? null : prevKey),
            tint: laneNodes.length % 2 === 0,
          },
          draggable: false,
          selectable: false,
          zIndex: -1,
          style: {
            width: LANE_W,
            height: (count - 1) * ROW_GAP + CARD_H + 36,
          },
        });
        segStart = i;
      }
    }

    const reqNodes: Node[] = grouped.map((req, i) => ({
      id: req.id,
      type: "requirement",
      position: { x: REQ_X, y: i * ROW_GAP },
      data: { req },
      initialWidth: 256,
      initialHeight: CARD_H,
    }));

    const critNodes: Node[] = critRefs.map((ref) => {
      const members = grouped.filter((r) => r.criteria_ref === ref);
      const avgIdx =
        members.reduce((sum, r) => sum + (indexOf.get(r.id) ?? 0), 0) /
        members.length;
      const num = ref.replace(/\D+/g, "") || ref;
      const hasGating = members.some((m) => m.is_gating);
      return {
        id: critNodeId(ref),
        type: "criterion",
        position: { x: CRIT_X, y: avgIdx * ROW_GAP },
        data: { num, count: members.length, hasGating },
        initialWidth: 184,
        initialHeight: hasGating ? 100 : 80,
      };
    });

    const labelNodes: Node[] = [
      {
        id: "label:req",
        type: "columnLabel",
        position: { x: REQ_X + 2, y: LABEL_Y },
        data: { label: "Requirements", count: grouped.length },
        draggable: false,
        selectable: false,
        initialWidth: 132,
        initialHeight: 18,
      },
      {
        id: "label:crit",
        type: "columnLabel",
        position: { x: CRIT_X + 2, y: LABEL_Y },
        data: { label: "Award criteria", count: critRefs.length },
        draggable: false,
        selectable: false,
        initialWidth: 132,
        initialHeight: 18,
      },
    ];

    const graphEdges: Edge[] = [];
    let depCount = 0;

    for (const req of requirements) {
      if (req.criteria_ref) {
        graphEdges.push({
          id: `${req.id}->crit`,
          source: req.id,
          sourceHandle: "r",
          target: critNodeId(req.criteria_ref),
          targetHandle: "c",
          style: {
            stroke: req.is_gating ? INK_OXBLOOD : INK_LINK,
            strokeWidth: req.is_gating ? 2 : 1.25,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: req.is_gating ? INK_OXBLOOD : INK_LINK,
          },
        });
      }

      for (const depId of req.depends_on) {
        if (!reqIds.has(depId)) continue;
        depCount += 1;
        graphEdges.push({
          id: `${req.id}~dep~${depId}`,
          source: req.id,
          sourceHandle: "dout",
          target: depId,
          targetHandle: "din",
          animated: true,
          style: { stroke: INK_FOREST, strokeWidth: 1.5, strokeDasharray: "5 4" },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 13,
            height: 13,
            color: INK_FOREST,
          },
        });
      }
    }

    return {
      baseNodes: [...laneNodes, ...labelNodes, ...critNodes, ...reqNodes],
      baseEdges: graphEdges,
      counts: {
        reqs: requirements.length,
        crits: critRefs.length,
        deps: depCount,
      },
    };
  }, [requirements]);

  // The active trace: a hovered/selected requirement lights itself, its criterion
  // and its dependency neighbours; a pinned criterion lights its whole lane.
  // Everything else dims. Recomputed without rebuilding the layout.
  const activeId = hoveredId ?? selectedId ?? null;
  const activeSet = useMemo<Set<string> | null>(() => {
    if (activeId) return traceSet(activeId, requirements);
    if (selectedCrit) return critTraceSet(selectedCrit, requirements);
    return null;
  }, [activeId, selectedCrit, requirements]);

  const nodes = useMemo(
    () =>
      baseNodes.map((n) => {
        if (n.type === "lane" || n.type === "columnLabel") return n;
        const inSet = activeSet ? activeSet.has(n.id) : true;
        const dim = activeSet ? !inSet : false;
        if (n.type === "criterion") {
          const pinned = n.id === (selectedCrit ? critNodeId(selectedCrit) : "");
          return { ...n, data: { ...n.data, dim, pinned } };
        }
        return {
          ...n,
          data: { ...n.data, dim, selected: n.id === selectedId },
        };
      }),
    [baseNodes, activeSet, selectedCrit, selectedId]
  );

  const edges = useMemo(
    () =>
      baseEdges.map((e) => {
        if (!activeSet) return e;
        const on = activeSet.has(e.source) && activeSet.has(e.target);
        return { ...e, style: { ...e.style, opacity: on ? 1 : 0.12 } };
      }),
    [baseEdges, activeSet]
  );

  // React Flow (and its minimap) render nondeterministic SVG attributes, so we
  // defer the canvas to the client to avoid a hydration mismatch. The container
  // keeps its size, so layout does not shift when it mounts.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // One-shot client mount flag; deps are empty so it runs exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (allRequirements.length === 0 || (isApiEnabled() && !tenderId)) {
    return (
      <p className="p-4 text-sm text-ink-muted">
        No requirements yet. Upload a tender to see how its requirements connect.
      </p>
    );
  }

  const canvas = (
    <div
      className={
        embedded
          ? "relative h-full w-full overflow-hidden bg-paper"
          : "relative w-full overflow-hidden rounded-lg border border-hairline bg-paper shadow-[var(--depth-pressed)]"
      }
      style={embedded ? undefined : { height: "72vh", minHeight: 480 }}
    >
      {!mounted ? null : requirements.length === 0 ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink-muted">
          Nothing matches the current filter.
        </p>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 72, y: 96, zoom: 0.78 }}
          minZoom={0.3}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          onNodeClick={interactive ? onNodeClick : undefined}
          onNodeMouseEnter={controlled ? onNodeEnter : undefined}
          onNodeMouseLeave={controlled ? onNodeLeave : undefined}
          className="graph-canvas bg-paper"
        >
          <Background
            id="fine"
            variant={BackgroundVariant.Lines}
            gap={32}
            size={1}
            color="rgba(33,29,23,0.04)"
          />
          <Background
            id="coarse"
            variant={BackgroundVariant.Lines}
            gap={128}
            size={1}
            color="rgba(33,29,23,0.06)"
          />
          {chrome === "full" && (
            <>
              <GraphControls />
              <GraphKey />
              <MiniMap
                pannable
                zoomable
                ariaLabel="Map overview"
                nodeStrokeWidth={2}
                maskColor="rgba(33,29,23,0.06)"
                style={{
                  background: "var(--color-paper-raised)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: 8,
                  height: 96,
                  width: 148,
                }}
                nodeColor={(n) => {
                  if (n.type === "lane") return "transparent";
                  if (n.type === "criterion") return "#cfc3ab";
                  const r = (n.data as { req?: Requirement })?.req;
                  return r?.is_gating ? INK_OXBLOOD : "#d8cdb6";
                }}
              />
            </>
          )}
          {embedded && chrome === "full" && (
            <Panel position="top-left">
              <p className="rounded-md border border-hairline bg-paper-raised/90 px-2.5 py-1 font-mono text-[11px] text-ink-muted shadow-[var(--depth-row)]">
                {counts.reqs} req · {counts.crits} criteria · {counts.deps} deps
              </p>
            </Panel>
          )}
        </ReactFlow>
      )}
    </div>
  );

  if (embedded) return canvas;

  return (
    <div>
      <div className="mb-5">
        <p className="max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">
          Every requirement, wired to the award criterion it is scored against
          and the requirements it depends on. The deal-breakers carry the oxblood
          edge, the same as the matrix.
        </p>
        <p className="mt-2 font-mono text-xs text-ink-muted">
          {counts.reqs} requirements · {counts.crits} award criteria ·{" "}
          {counts.deps} dependencies
        </p>
        {interactive && (
          <p className="mt-1 font-mono text-xs text-ink-muted">
            Click a requirement to open it in the matrix.
          </p>
        )}
        {gatingCount > 0 && (
          <button
            type="button"
            onClick={() => setGatingOnly((v) => !v)}
            aria-pressed={gatingOnly}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-ink-muted transition-colors hover:bg-paper-raised hover:text-ink"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                gatingOnly ? "bg-signal-oxblood" : "border border-hairline"
              }`}
              aria-hidden
            />
            {gatingOnly ? "Showing deal-breakers only" : "Deal-breakers only"}
          </button>
        )}
      </div>
      {canvas}
    </div>
  );
}
