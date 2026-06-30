"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
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
import type { Requirement } from "@/types/requirement";
import { ConfidenceIndicator } from "./ConfidenceIndicator";

// The relationship map (CLAUDE.md priority 4; design-language: the civic record).
// This is the tender's schedule of cross-references drawn as a wiring diagram:
// every requirement wired to the award criterion it is scored against, and to the
// requirements it depends on. It is NOT a generic node graph. The status system
// carries the stakes exactly as it does in the matrix: register cards on warmed
// paper, the oxblood reading edge and oxblood wiring on the deal-breakers, the
// shared confidence bead, the mono clause refs. The award criteria are the fixed
// structure of the document, so they read as tabs pressed into the page while the
// requirements are loose sheets raised on it. Default React Flow chrome (its
// nodes, controls, dotted background) is replaced wholesale.

// Layout geometry. Requirements stack in the left column in criterion order, so
// each criterion's feeders sit together; the criterion is then placed at the
// vertical centroid of its group, which turns crossing spaghetti into clean
// roll-ups.
const REQ_X = 0;
const CRIT_X = 560;
const ROW_GAP = 104;
const LABEL_Y = -56;

// Edge inks (the signal palette lives on status carriers only). Non-gating links
// are a quiet pencil line; a deal-breaker's link is lit in oxblood; a dependency
// is the earned forest, dashed, so the chains read as a distinct relationship.
const INK_OXBLOOD = "#8a2d2a";
const INK_FOREST = "#2c5640";
const INK_LINK = "#b4a892";

function prettyCategory(category: string): string {
  const s = category.replace(/[_-]/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// A near-invisible connection point: a small hairline tick ringed in paper so the
// wiring meets the card on a tidy edge, never the default dark React Flow handle.
const HANDLE: React.CSSProperties = {
  width: 7,
  height: 7,
  minWidth: 0,
  minHeight: 0,
  background: "var(--color-hairline)",
  border: "1px solid var(--color-paper-raised)",
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

// A requirement, as a register card: clause ref and confidence bead on top, the
// requirement text, then the page ref and either its deal-breaker mark, its
// approval, or its category. Gating items take the 2px oxblood reading edge.
function RequirementNode({ data }: NodeProps) {
  const { req } = data as unknown as { req: Requirement };
  const gating = req.is_gating;
  const unanswerable = gating && req.status === "pending";
  const ref =
    req.source_clause?.replace(/^section\s+/i, "") ?? `p.${req.source_page}`;

  return (
    <div
      className={`surface-grain w-[256px] rounded-md bg-paper-raised px-3 py-2.5 shadow-[var(--depth-row)] transition-shadow hover:shadow-[var(--depth-sheet)] ${
        gating
          ? "rounded-l-none border-y border-r border-l-2 border-hairline border-l-signal-oxblood"
          : "border border-hairline"
      }`}
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
        <span className="font-mono text-[11px] leading-tight text-ink-muted">
          {ref}
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
        <span>p.{req.source_page}</span>
        {gating ? (
          <span className="font-medium text-signal-oxblood">Deal-breaker</span>
        ) : req.status === "accepted" ? (
          <span className="inline-flex items-center gap-1 text-forest">
            <CheckMark />
            Approved
          </span>
        ) : (
          <span>{prettyCategory(req.category)}</span>
        )}
      </div>
    </div>
  );
}

// An award criterion: the fixed structure of the tender, so it reads as a tab
// pressed into the page (recessed, mono record voice), the counterweight to the
// raised requirement sheets. Carries the count of requirements scored under it,
// and an oxblood mark when any of them is a deal-breaker.
function CriterionNode({ data }: NodeProps) {
  const { num, count, hasGating } = data as unknown as {
    num: string;
    count: number;
    hasGating: boolean;
  };

  return (
    <div className="w-[184px] rounded-md border border-hairline bg-paper-recessed px-3 py-2.5 shadow-[var(--depth-pressed)]">
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

// A quiet mono column header that pans with the diagram (the editorial form:
// columns with headers), never a floating chrome label.
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

// Stable across renders (React Flow requires it).
const nodeTypes = {
  requirement: RequirementNode,
  criterion: CriterionNode,
  columnLabel: ColumnLabelNode,
};

// Bespoke zoom controls, replacing the default white React Flow buttons: a small
// mono group on warmed paper, fixed to the canvas corner.
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

// The legend, as the key box on an official drawing: anchored in the corner,
// grained paper, listing exactly the marks on the canvas.
function GraphKey() {
  return (
    <Panel position="top-right">
      <div className="surface-grain w-[208px] rounded-md border border-hairline bg-paper-raised p-3 shadow-[var(--depth-row)]">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          Key
        </p>
        <ul className="flex flex-col gap-2 text-[11.5px] text-ink">
          <li className="flex items-center gap-2.5">
            <span className="h-3.5 w-5 shrink-0 rounded-sm rounded-l-none border-y border-r border-l-2 border-hairline border-l-signal-oxblood bg-paper-raised" />
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

export function GraphView({ interactive = true }: { interactive?: boolean }) {
  const { requirements } = useRequirements();
  const router = useRouter();

  // Clicking a requirement node opens it in the matrix (deep link via ?req=).
  // Disabled on the read-only demo (interactive=false).
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "requirement") router.push(`/review?req=${node.id}`);
    },
    [router]
  );

  const { nodes, edges, counts } = useMemo(() => {
    const reqIds = new Set(requirements.map((r) => r.id));

    // Distinct criteria in numeric order; requirements grouped under them.
    const critRefs = Array.from(
      new Set(
        requirements
          .map((r) => r.criteria_ref)
          .filter((ref): ref is string => ref !== null)
      )
    ).sort();

    const grouped: Requirement[] = [
      ...critRefs.flatMap((ref) =>
        requirements.filter((r) => r.criteria_ref === ref)
      ),
      ...requirements.filter((r) => !r.criteria_ref),
    ];
    const indexOf = new Map(grouped.map((r, i) => [r.id, i] as const));

    // initialWidth/initialHeight give React Flow measured dimensions up front, so
    // nodes render visible and edges route on the first paint instead of waiting
    // for the per-node ResizeObserver (which, under Next dev's StrictMode, can
    // double-mount and never deliver the first measurement). A real browser still
    // refines these from the live DOM.
    const reqNodes: Node[] = grouped.map((req, i) => ({
      id: req.id,
      type: "requirement",
      position: { x: REQ_X, y: i * ROW_GAP },
      data: { req },
      initialWidth: 256,
      initialHeight: 100,
    }));

    const critNodes: Node[] = critRefs.map((ref) => {
      const members = grouped.filter((r) => r.criteria_ref === ref);
      const avgIdx =
        members.reduce((sum, r) => sum + (indexOf.get(r.id) ?? 0), 0) /
        members.length;
      const num = ref.replace(/\D+/g, "") || ref;
      const hasGating = members.some((m) => m.is_gating);
      return {
        id: `crit:${ref}`,
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
      // Requirement -> the award criterion it is scored against.
      if (req.criteria_ref) {
        graphEdges.push({
          id: `${req.id}->crit`,
          source: req.id,
          sourceHandle: "r",
          target: `crit:${req.criteria_ref}`,
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

      // Requirement -> the requirement it depends on (the dependency chain).
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
      nodes: [...labelNodes, ...critNodes, ...reqNodes],
      edges: graphEdges,
      counts: {
        reqs: requirements.length,
        crits: critRefs.length,
        deps: depCount,
      },
    };
  }, [requirements]);

  if (requirements.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No requirements yet. Upload a tender to see how its requirements connect.
      </p>
    );
  }

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
      </div>

      {/* Inline height, not a Tailwind class: React Flow measures its container on
          mount, and in dev the utility-class CSS can land a frame late, leaving it
          0-tall so handle measurement, edge routing, and the one-shot fitView all
          fail and never recover. An inline height is present at first paint. */}
      <div
        className="relative w-full overflow-hidden rounded-lg border border-hairline bg-paper shadow-[var(--depth-pressed)]"
        style={{ height: "72vh", minHeight: 480 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          onNodeClick={interactive ? onNodeClick : undefined}
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
          <GraphControls />
          <GraphKey />
        </ReactFlow>
      </div>
    </div>
  );
}
