"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import styles from "./GraphView.module.css";
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
  zip: "border-ink/25 bg-paper text-ink",
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
// Sits behind the cards (negative z), never interactive. On first mount it fades
// in ahead of the cards (the opening beat of the build-in).
function LaneNode({ data }: NodeProps) {
  const { label, tint, intro } = data as unknown as {
    label: string;
    tint: boolean;
    intro?: boolean;
  };
  return (
    <div
      className={`relative h-full w-full rounded-lg border border-dashed border-hairline ${
        intro ? styles.laneIn : ""
      }`}
      style={{ background: tint ? "rgba(33,29,23,0.022)" : "transparent" }}
    >
      <span className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted/80">
        {label}
      </span>
    </div>
  );
}

// A requirement, as a register card. Gating items take the 2px oxblood reading
// edge. Dimmed when another item's trace is active; ringed when selected. Below
// the readable zoom the body + footer collapse away (LOD, driven by the canvas
// data attribute) leaving source-ref, confidence dot, and the coloured edge.
function RequirementNode({ data }: NodeProps) {
  const { req, dim, selected, introDelay } = data as unknown as {
    req: Requirement;
    dim?: boolean;
    selected?: boolean;
    // Build-in stagger (ms), row-indexed; null once the entrance has played.
    introDelay?: number | null;
  };
  const gating = req.is_gating;
  const unanswerable = gating && req.status === "pending";
  const ref = sourceRefLabel(req);

  return (
    <div
      className={`surface-grain w-[256px] rounded-md bg-paper-raised px-3 py-2.5 shadow-[var(--depth-row)] transition-all duration-[var(--motion-fast)] ease-[var(--ease-record)] hover:shadow-[var(--depth-sheet)] ${
        gating
          ? "rounded-l-none border-y border-r border-l-2 border-hairline border-l-signal-oxblood-frame"
          : "border border-hairline"
      } ${dim ? "opacity-35" : "opacity-100"} ${
        selected ? "ring-2 ring-forest ring-offset-1 ring-offset-paper" : ""
      } ${introDelay != null ? styles.cardIn : ""}`}
      style={{
        ...(gating
          ? undefined
          : {
              borderLeftWidth: 2,
              borderLeftColor: categoryStyle(req.category).hex,
            }),
        ...(introDelay != null
          ? { animationDelay: `${introDelay}ms` }
          : undefined),
      }}
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
        } ${styles.cardBody}`}
      >
        {req.text}
      </p>

      <div
        className={`mt-2 flex items-center justify-between gap-2 font-mono text-[10.5px] text-ink-muted ${styles.cardFoot}`}
      >
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
// page. Shows the published name + weight when the tender declared them, so the
// map names the same thing the ledger does. Pinned (from the ledger) takes an
// accent ring; dimmed off-trace.
function CriterionNode({ data }: NodeProps) {
  const { num, name, weight, count, hasGating, dim, pinned, introDelay } =
    data as unknown as {
      num: string;
      name: string | null;
      weight: number | null;
      count: number;
      hasGating: boolean;
      dim?: boolean;
      pinned?: boolean;
      introDelay?: number | null;
    };

  return (
    <div
      className={`w-[184px] rounded-md border border-hairline bg-paper-recessed px-3 py-2.5 shadow-[var(--depth-pressed)] transition-all duration-[var(--motion-fast)] ease-[var(--ease-record)] ${
        dim ? "opacity-35" : "opacity-100"
      } ${pinned ? "ring-2 ring-accent ring-offset-1 ring-offset-paper" : ""} ${
        introDelay != null ? styles.cardIn : ""
      }`}
      style={
        introDelay != null ? { animationDelay: `${introDelay}ms` } : undefined
      }
    >
      <Handle id="c" type="target" position={Position.Left} isConnectable={false} style={HANDLE} />
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        Award criterion
      </p>
      <p className="mt-0.5 font-mono text-lg font-medium leading-none text-ink">
        {num}
      </p>
      {name && (
        <p
          className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-ink"
          title={name}
        >
          {name}
        </p>
      )}
      <p className="mt-1.5 font-mono text-[11px] text-ink-muted">
        {count} requirement{count !== 1 ? "s" : ""}
        {weight != null && ` · ${weight}% of marks`}
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
  const { label, count, intro } = data as unknown as {
    label: string;
    count: number;
    intro?: boolean;
  };
  return (
    <div
      className={`flex items-baseline gap-2 whitespace-nowrap ${
        intro ? styles.laneIn : ""
      }`}
    >
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

// Identity caches for the derived (trace-decorated) nodes and edges, keyed by
// the base layout arrays so they are dropped with them. Hover recomputes the
// derived arrays constantly; these tables let each element keep its previous
// object identity unless its dim/selected/pinned state actually changed, so
// React Flow re-renders only the elements whose look changed.
interface NodeState {
  base: Node;
  dim: boolean;
  pinned: boolean;
  sel: boolean;
  node: Node;
}
interface EdgeState {
  base: Edge;
  on: boolean;
  edge: Edge;
}
const nodeStateCache = new WeakMap<Node[], Map<string, NodeState>>();
const edgeStateCache = new WeakMap<Edge[], Map<string, EdgeState>>();

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

// The legend, the key box on an official drawing. In the split pane the full
// card crowds the smaller canvas, so `collapsible` folds it behind a small
// "Key" toggle that only unfolds on demand.
function GraphKey({ collapsible = false }: { collapsible?: boolean }) {
  const [open, setOpen] = useState(!collapsible);

  if (!open) {
    return (
      <Panel position="top-right">
        <button
          type="button"
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="rounded-md border border-hairline bg-paper-raised px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted shadow-[var(--depth-row)] transition-colors hover:bg-paper-recessed hover:text-ink"
        >
          Key
        </button>
      </Panel>
    );
  }

  return (
    <Panel position="top-right">
      <div className="surface-grain w-[208px] rounded-md border border-hairline bg-paper-raised p-3 shadow-[var(--depth-row)]">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
            Key
          </p>
          {collapsible && (
            <button
              type="button"
              aria-label="Hide key"
              onClick={() => setOpen(false)}
              className="-my-1 px-1 font-mono text-[12px] leading-none text-ink-muted transition-colors hover:text-ink"
            >
              ×
            </button>
          )}
        </div>
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
  const { requirements: allRequirements, tenderId, awardCriteria } =
    useRequirements();
  const router = useRouter();
  const controlled = Boolean(onSelectRequirement);

  // The one-shot build-in. While it plays, nodes carry stagger delays and edges
  // carry draw-in classes; once the ~1.6s sequence ends the classes are dropped
  // so later remounts (viewport culling, filter changes) render plainly instead
  // of replaying the entrance. The keyframes themselves are gated on
  // prefers-reduced-motion in the CSS module.
  const [introDone, setIntroDone] = useState(false);

  // Zoom level-of-detail with hysteresis: cards collapse to source-ref +
  // confidence dot below 0.55 and only re-expand above 0.65, so hovering the
  // threshold never flickers. Applied as a data attribute + CSS so panning and
  // zooming never rebuild the node array.
  const [lod, setLod] = useState<"full" | "compact">("full");
  const onViewportMove = useCallback((_e: unknown, viewport: Viewport) => {
    setLod((cur) =>
      cur === "full"
        ? viewport.zoom < 0.55
          ? "compact"
          : cur
        : viewport.zoom > 0.65
          ? "full"
          : cur
    );
  }, []);

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
  // only when the visible requirement slice changes (and once more when the
  // entrance finishes, to strip the intro classes).
  const { baseNodes, baseEdges, counts } = useMemo(() => {
    const reqIds = new Set(requirements.map((r) => r.id));
    // Published award criteria (#27) → real name + weight, keyed by id =
    // criteria_ref, same as the ledger, so both panes name the same thing.
    const critMeta = new Map(awardCriteria.map((c) => [c.id, c]));

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

    // Build-in stagger: cards land top-to-bottom after the lanes fade in. The
    // per-row step compresses for big sets so the whole card pass stays inside
    // ~1.1s (plus the 0.55s settle); delays go null once the entrance played.
    const intro = !introDone;
    const step = Math.min(70, Math.max(20, 950 / Math.max(grouped.length, 1)));
    const cardDelay = (row: number): number | null =>
      intro ? Math.round(150 + row * step) : null;

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
            intro,
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
      data: { req, introDelay: cardDelay(i) },
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
      const meta = critMeta.get(ref);
      const delay = cardDelay(avgIdx);
      return {
        id: critNodeId(ref),
        type: "criterion",
        position: { x: CRIT_X, y: avgIdx * ROW_GAP },
        data: {
          num,
          name: meta?.name ?? null,
          weight: meta && meta.weight > 0 ? meta.weight : null,
          count: members.length,
          hasGating,
          // Criteria settle a beat after their feeders reach them.
          introDelay: delay === null ? null : delay + 120,
        },
        initialWidth: 184,
        initialHeight: (hasGating ? 100 : 80) + (meta?.name ? 20 : 0),
      };
    });

    const labelNodes: Node[] = [
      {
        id: "label:req",
        type: "columnLabel",
        position: { x: REQ_X + 2, y: LABEL_Y },
        data: { label: "Requirements", count: grouped.length, intro },
        draggable: false,
        selectable: false,
        initialWidth: 132,
        initialHeight: 18,
      },
      {
        id: "label:crit",
        type: "columnLabel",
        position: { x: CRIT_X + 2, y: LABEL_Y },
        data: { label: "Award criteria", count: critRefs.length, intro },
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
          className: intro ? styles.edgeIntro : undefined,
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
        // Static dashed at rest — animated edges are React Flow's most
        // expensive render, so the dash-march is reserved for the traced
        // chain (applied in the derived edges memo below).
        graphEdges.push({
          id: `${req.id}~dep~${depId}`,
          source: req.id,
          sourceHandle: "dout",
          target: depId,
          targetHandle: "din",
          className: intro ? styles.edgeIntroDep : undefined,
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
  }, [requirements, awardCriteria, introDone]);

  // The active trace: a hovered/selected requirement lights itself, its criterion
  // and its whole transitive dependency chain; a pinned criterion lights its
  // lane. Everything else dims. Recomputed without rebuilding the layout.
  const activeId = hoveredId ?? selectedId ?? null;
  const activeSet = useMemo<Set<string> | null>(() => {
    if (activeId) return traceSet(activeId, requirements);
    if (selectedCrit) return critTraceSet(selectedCrit, requirements);
    return null;
  }, [activeId, selectedCrit, requirements]);

  // Derive per-node visual state. See nodeStateCache above: a node only becomes
  // a NEW object when its dim/selected/pinned state actually changed.
  const nodes = useMemo(() => {
    const cache =
      nodeStateCache.get(baseNodes) ?? new Map<string, NodeState>();
    nodeStateCache.set(baseNodes, cache);
    return baseNodes.map((n) => {
      if (n.type === "lane" || n.type === "columnLabel") return n;
      const inSet = activeSet ? activeSet.has(n.id) : true;
      const dim = activeSet ? !inSet : false;
      const pinned =
        n.type === "criterion" &&
        n.id === (selectedCrit ? critNodeId(selectedCrit) : "");
      const sel = n.type === "requirement" && n.id === selectedId;
      const prev = cache.get(n.id);
      if (
        prev &&
        prev.base === n &&
        prev.dim === dim &&
        prev.pinned === pinned &&
        prev.sel === sel
      ) {
        return prev.node;
      }
      const node: Node = {
        ...n,
        data:
          n.type === "criterion"
            ? { ...n.data, dim, pinned }
            : { ...n.data, dim, selected: sel },
      };
      cache.set(n.id, { base: n, dim, pinned, sel, node });
      return node;
    });
  }, [baseNodes, activeSet, selectedCrit, selectedId]);

  // Same identity discipline for edges. Off-trace edges dim via a 150ms CSS
  // sweep (class, not inline style); only the traced dependency chain animates.
  const edges = useMemo(() => {
    const cache =
      edgeStateCache.get(baseEdges) ?? new Map<string, EdgeState>();
    edgeStateCache.set(baseEdges, cache);
    return baseEdges.map((e) => {
      if (!activeSet) return e;
      const on = activeSet.has(e.source) && activeSet.has(e.target);
      const prev = cache.get(e.id);
      if (prev && prev.base === e && prev.on === on) return prev.edge;
      const edge: Edge = {
        ...e,
        animated: on && e.id.includes("~dep~"),
        className:
          [e.className, on ? null : styles.edgeDim]
            .filter(Boolean)
            .join(" ") || undefined,
      };
      cache.set(e.id, { base: e, on, edge });
      return edge;
    });
  }, [baseEdges, activeSet]);

  // React Flow (and its minimap) render nondeterministic SVG attributes, so we
  // defer the canvas to the client to avoid a hydration mismatch. The container
  // keeps its size, so layout does not shift when it mounts.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // One-shot client mount flag; deps are empty so it runs exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Retire the build-in once it has fully played (lanes → cards → edges).
    const timer = window.setTimeout(() => setIntroDone(true), 1900);
    return () => window.clearTimeout(timer);
  }, []);

  // In the split the right pane can get tight: watch its width so the minimap
  // can step aside instead of crowding the canvas.
  const paneRef = useRef<HTMLDivElement | null>(null);
  const [paneWidth, setPaneWidth] = useState<number | null>(null);
  useEffect(() => {
    if (!embedded || !paneRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined) setPaneWidth(width);
    });
    observer.observe(paneRef.current);
    return () => observer.disconnect();
  }, [embedded]);

  if (allRequirements.length === 0 || (isApiEnabled() && !tenderId)) {
    return (
      <p className="p-4 text-sm text-ink-muted">
        No requirements yet. Upload a tender to see how its requirements connect.
      </p>
    );
  }

  // Standalone always keeps the minimap; embedded hides it when the pane is
  // narrow or the graph is small enough to take in at a glance.
  const narrowPane = paneWidth !== null && paneWidth < 560;
  const showMiniMap =
    chrome === "full" && (!embedded || (!narrowPane && counts.reqs > 8));

  const canvas = (
    <div
      ref={paneRef}
      data-lod={lod}
      className={`${styles.canvas} ${
        embedded
          ? "relative h-full w-full overflow-hidden bg-paper"
          : "relative w-full overflow-hidden rounded-lg border border-hairline bg-paper shadow-[var(--depth-pressed)]"
      }`}
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
          onlyRenderVisibleElements
          onMove={onViewportMove}
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
              <GraphKey collapsible={embedded} />
            </>
          )}
          {showMiniMap && (
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
            {controlled
              ? "Click a requirement to open its detail drawer."
              : "Click a requirement to open it in the matrix."}
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
