import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { AwardCriterion, Requirement } from "@/types/requirement";
import {
  isConfidentNonGating,
  pendingStatusWord,
  type GroupKey,
  type SortKey,
  type TriageGroup,
} from "@/lib/triage";
import { alsoCitedLabel } from "@/lib/dedupe";
import {
  SOURCE_KIND_BADGE_TONE,
  sourceDocumentKind,
  sourceKindLabel,
  sourceKindShortLabel,
  sourceRefLabel,
} from "@/lib/source-doc";
import { useAuth } from "@/context/AuthContext";
import { actorLabel, collaboratorFor, displayName } from "@/lib/collaborators";
import {
  deriveVisibleGroups,
  type MatrixLens,
  type VisibleGroup,
} from "@/lib/matrix-derive";
import {
  ConfidenceIndicator,
  confidenceTier,
  type ConfidenceTier,
} from "./ConfidenceIndicator";
import { CategoryTag } from "./CategoryTag";
import { BlockerMarker, CommentCountMarker } from "./CollaborationMarkers";

// Row density: comfortable is the resting register; compact tightens the row
// gutters so a longer tender shows more at once. Only the vertical padding
// changes; the grid and the reading rhythm stay put.
export type Density = "compact" | "comfortable";

const ROW_PADDING: Record<Density, string> = {
  comfortable: "py-2",
  compact: "py-1",
};

// How much requirement text a resting row shows. The text IS the product, so
// comfortable gives it two lines before clamping; compact keeps the strict
// one-line register. The selected row always shows the full text — the row you
// are reading never hides its own words.
const TEXT_CLAMP: Record<Density, string> = {
  comfortable: "line-clamp-2",
  compact: "truncate",
};

// ---- Motion / virtualization reconciliation (Batch E policy) ---------------
// Layout animation and windowing conflict, so a group runs exactly one of two
// row paths, chosen by its visible representative count:
//   <= VIRTUALIZE_THRESHOLD  rows render as motion.div with layout animations
//                            inside AnimatePresence (approve/flag rows slide
//                            between groups; exits fade-collapse).
//   >  VIRTUALIZE_THRESHOLD  rows render through @tanstack/react-virtual in a
//                            scrollable body — plain divs, cheap CSS
//                            transitions only. AnimatePresence and layout
//                            animation NEVER wrap a virtualized row.
// Reduced motion collapses the first path to plain divs too.
const VIRTUALIZE_THRESHOLD = 80;

// Virtualized row height estimates per density; measureElement corrects rows
// whose hover reveals extra lines.
const ROW_ESTIMATE: Record<Density, number> = {
  comfortable: 40,
  compact: 30,
};

// Staged reveal: only the first N rows of a group stagger in; the rest appear
// instantly so a long tender never queues behind its own choreography.
const REVEAL_ROW_COUNT = 12;

// Reveal keys already played this session. Module scope on purpose: the matrix
// unmounts when the split (or focus mode) takes over, and remounting for the
// same tender must not replay the entrance — only a new tender identity does.
// Only mutated from an effect, so it stays empty during SSR.
const seenRevealKeys = new Set<string>();

// Hydration-safe prefers-reduced-motion. The server snapshot is false, so SSR
// and the hydration render agree on the reveal/motion markup; a reduced-motion
// client then re-renders static immediately after mount (useSyncExternalStore
// patches a snapshot that differs from the server's before paint). motion's own
// useReducedMotion returns the live value on the first client render, which
// mismatches the SSR HTML — this hook exists so the matrix never does that.
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function useReducedMotionHydrationSafe(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );
}

// The multi-select contract. The matrix only reports "this row was toggled,
// shift held or not" — the owner keeps the anchor and resolves shift into a
// range over the derive's flatOrder. Omitted on frozen surfaces, where no
// checkbox renders and the grid keeps its original margin width.
export interface MatrixSelection {
  ids: Set<string>;
  onToggle: (id: string, shiftKey: boolean) => void;
}

// The row grid. With selection live, the ref margin widens to make room for the
// checkbox; without it the original geometry is untouched. Full literal strings.
// Ref column is 64px (plain) / 82px (selectable): narrowed from 80/98px per
// design-language.md device 3 (~52px target). 64px chosen because the longest
// realistic stripped Bradwell clause — "Spec 6.4" at 8 chars × ~7.2px/char ≈
// 58px — renders un-clipped on a non-gating row; gating rows add a ~12px pennant
// overhead and clip at that width, handled by the existing truncate + title tooltip.
const ROW_GRID: Record<"plain" | "selectable", string> = {
  plain:
    "grid-cols-[64px_22px_minmax(0,1fr)] sm:grid-cols-[72px_26px_minmax(0,1fr)_auto]",
  selectable:
    "grid-cols-[82px_22px_minmax(0,1fr)] sm:grid-cols-[90px_26px_minmax(0,1fr)_auto]",
};

// The resting row wash, keyed to the confidence tier so the worklist carries a
// calm colour gradient: the riskier the row, the warmer the tint; confident (and
// decided) rows rest clean. Full literal classes so Tailwind sees every one.
const TIER_WASH: Record<ConfidenceTier, string> = {
  oxblood:
    "bg-[color-mix(in_oklab,var(--color-signal-oxblood)_7%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-signal-oxblood)_12%,transparent)]",
  amber:
    "bg-[color-mix(in_oklab,var(--color-signal-amber)_6%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-signal-amber)_11%,transparent)]",
  yellow:
    "bg-[color-mix(in_oklab,var(--color-signal-yellow)_6%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-signal-yellow)_10%,transparent)]",
  "light-green": "hover:bg-paper-raised",
};

// The resting matrix: a contents page, not a table (layout.md sections 3, 4, 7).
// Each requirement is one line on a shared grid [ref | dot | text | status],
// grouped by the ask. Hierarchy comes from type and space, not boxes: no card
// wrapper, no per-row borders, peers separated by whitespace and a hover
// background. The status system carries the colour and the depth: the confidence
// bead, the gating oxblood reading edge, the forest approve tick, and depth that
// lifts only the open row. Interactivity scales with stakes: confident non-gating
// rows expose a single quiet Approve on hover or focus; everything riskier only
// opens the panel.

// The decided-status word (copywriting.md decision-status lexicon), quiet and
// right-aligned. Approval also carries a forest tick, so it never relies on
// colour alone (the greyscale test). Pending items get a differentiated word
// from pendingStatusWord() instead of one flat label.
function StatusWord({ req }: { req: Requirement }) {
  const { user } = useAuth();

  // Pending: name what this item needs. A confident non-gating item returns
  // null and rests silent (its cell is owned by the hover Approve). A gating
  // item carries the one signal-coloured word in the column, matched to its
  // oxblood row edge and bead (and still legible as a word in greyscale).
  if (req.status === "pending") {
    const word = pendingStatusWord(req);
    if (!word) return null;
    const tone = req.is_gating
      ? req.needs_review
        ? "text-signal-amber"
        : "text-signal-oxblood"
      : "text-ink-muted";
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${tone}`}>
        {word}
      </span>
    );
  }

  const tone =
    req.status === "accepted"
      ? "text-forest"
      : req.status === "flagged"
        ? "text-ink"
        : "text-ink-muted";

  const who = actorLabel(req.decision?.actor, user?.id);

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${tone}`}>
      {req.status === "accepted" && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 7.5l3 3 6-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {/* Flagged carries its own greyscale marker so it never reads as a bare
          decided row: an oxblood flag (the one sanctioned alarm tone for a
          raised concern — MOTION.md §Matrix) plus who raised it, mirroring the
          approved tick + "Approved by". */}
      {req.status === "flagged" && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-signal-oxblood"
        >
          <path
            d="M3.6 1.4v11.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="M3.6 2.4h6.8l-1.7 2.1 1.7 2.1H3.6z" fill="currentColor" />
        </svg>
      )}
      {req.status === "accepted"
        ? `Approved by ${who}`
        : req.status === "edited"
          ? `Edited by ${who}`
          : `Flagged by ${who}`}
    </span>
  );
}

function SourceTypeBadge({ req }: { req: Requirement }) {
  const kind = sourceDocumentKind(req);
  const badgeShape =
    kind === "pdf"
      ? "px-0 text-ink-muted/70"
      : `rounded-[3px] border px-1 ${SOURCE_KIND_BADGE_TONE[kind]}`;
  return (
    <span
      title={sourceKindLabel(req)}
      className={`inline-flex h-[17px] shrink-0 items-center font-mono text-[8.5px] font-medium leading-none ${badgeShape}`}
    >
      {sourceKindShortLabel(kind)}
    </span>
  );
}

// The register ref: show the real source_clause when present (stripping a
// "Section " prefix for the compact cell; the full string stays in the title
// tooltip via fullRef / sourceRefLabel). Falls back to the page locator only
// when source_clause is absent, inverting the old PDF-only page-first logic.
function matrixSourceRefLabel(req: Requirement): string {
  if (req.source_clause) {
    return req.source_clause.replace(/^Section\s+/i, "");
  }
  return `p.${req.source_page}`;
}

function DecisionActorChip({ req }: { req: Requirement }) {
  if (!req.decision) return null;

  const actor = req.decision.actor;
  const collaborator = actor ? collaboratorFor(actor) : null;
  const label = actor ? displayName(actor) : "you";
  const initial = collaborator?.initials ?? "Y";

  return (
    <span
      title={`Decided by ${label}`}
      aria-label={`Decided by ${label}`}
      className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-paper/80 px-1 font-mono text-[9px] font-semibold leading-none text-paper shadow-[var(--depth-pressed)] ring-1 ring-ink/10"
      style={{
        backgroundColor: collaborator?.color ?? "var(--color-ink-muted)",
      }}
    >
      {initial}
    </span>
  );
}

function MatrixRow({
  req,
  isSelected,
  isCursor = false,
  alsoCitedOn,
  density,
  showSourceKind = true,
  onSelect,
  onApprove,
  selection,
  onAnswerQuestion,
}: {
  req: Requirement;
  isSelected: boolean;
  // The keyboard cursor rests here (j/k). A quieter ring than selection: the
  // cursor marks where Enter would open, without opening anything itself.
  isCursor?: boolean;
  // Pages the same requirement was also cited on (display-dedupe annotation).
  alsoCitedOn: number[];
  density: Density;
  // Whether the format badge earns its margin space: only when the tender pack
  // actually mixes document kinds. A single-format pack repeats no information.
  showSourceKind?: boolean;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  // Multi-select (omitted on frozen surfaces — no checkbox renders).
  selection?: MatrixSelection;
  // Inline gap answering (omitted on frozen surfaces — the prompt stays static).
  onAnswerQuestion?: (reqId: string, questionId: string, text: string) => void;
}) {
  const canApproveInline = isConfidentNonGating(req);
  const preview = req.answer?.text ?? req.draft_answer ?? null;
  const alsoOn = alsoCitedLabel(alsoCitedOn);
  const checked = selection?.ids.has(req.id) ?? false;
  const selectionActive = (selection?.ids.size ?? 0) > 0;

  // A gating item with no resolved decision is the unanswerable oxblood case.
  const unanswerable = req.is_gating && req.status === "pending";
  const tier = confidenceTier(req.confidence, {
    needsReview: req.needs_review,
    unanswerable,
  });

  // The register: each row carries its real clause ref down a quiet mono margin
  // (design-language). Fall back to the page when there is no clause.
  const ref = matrixSourceRefLabel(req);
  const fullRef = sourceRefLabel(req);

  // Rows read as a flagged zone, not a pinstripe: a faint tier-keyed wash that
  // deepens on hover. A gating row also carries a real left reading edge in the
  // frame tone (edges use the frame colour, fills use oxblood proper) so a
  // deal-breaker reads across a room, pennant or no pennant. Decided rows rest
  // clean; depth lifts only the open row; the keyboard cursor rests a quieter
  // ring than the open row's.
  const shape = req.is_gating
    ? "rounded-md border-l-2 border-signal-oxblood-frame"
    : "rounded-md";
  const rest =
    req.status === "accepted" ? "hover:bg-paper-raised" : TIER_WASH[tier];
  const state = isSelected
    ? "bg-paper-raised shadow-[var(--depth-row)] ring-1 ring-inset ring-ink/30"
    : isCursor
      ? `ring-1 ring-inset ring-ink/20 ${rest}`
      : rest;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      data-req-id={req.id}
      onClick={() => onSelect(req.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(req.id);
        }
      }}
      className={`group grid w-full cursor-pointer ${
        ROW_GRID[selection ? "selectable" : "plain"]
      } items-start gap-x-2 gap-y-1 px-2.5 ${ROW_PADDING[density]} text-left transition-[background-color,box-shadow] duration-[var(--motion-instant)] focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink/40 sm:gap-x-3 ${shape} ${state}`}
    >
      {/* The register margin: the selection checkbox (when selection is live),
          a gating pennant, then the clause ref, right-aligned in mono. The
          pennant marks the deal-breaker even on decided rows, where the alarm
          meter no longer shows. Colour is ink-muted (not accent teal) per
          design-language.md device 3: the register ref is a quiet ledger edge,
          subordinate to the text; teal stays on click-to-source actions only. */}
      <span
        title={fullRef}
        className="flex min-w-0 items-start justify-end gap-1 overflow-hidden pt-1 text-right font-mono text-[12px] leading-tight text-ink-muted"
      >
        {selection && (
          <input
            type="checkbox"
            aria-label={`Select ${req.id}`}
            checked={checked}
            onChange={() => {}}
            onClick={(e) => {
              e.stopPropagation();
              selection.onToggle(req.id, e.shiftKey);
            }}
            onKeyDown={(e) => e.stopPropagation()}
            className={`mt-px h-3 w-3 shrink-0 cursor-pointer accent-forest ${
              checked || selectionActive
                ? "opacity-100"
                : "opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
            }`}
          />
        )}
        {req.is_gating && (
          <svg
            width="8"
            height="10"
            viewBox="0 0 8 10"
            fill="none"
            aria-hidden
            className="mt-px shrink-0 text-signal-oxblood"
          >
            <path d="M1 .5v9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <path d="M1 1h5L4.6 3 6 5H1z" fill="currentColor" />
          </svg>
        )}
        {showSourceKind && <SourceTypeBadge req={req} />}
        <DecisionActorChip req={req} />
        <span className="min-w-0 truncate">{ref}</span>
      </span>

      {/* The confidence bead, on the reading edge. */}
      <span className="flex justify-center pt-0.5">
        <ConfidenceIndicator
          confidence={req.confidence}
          needsReview={req.needs_review}
          unanswerable={unanswerable}
          variant="dot"
        />
      </span>

      {/* The requirement text: two lines in comfortable, one in compact, full
          on the selected row (the words are the product — never hide the row
          you are reading). The drafted-answer preview stays a hover reveal. */}
      <div className="min-w-0 pt-0.5">
        <div className="flex min-w-0 items-start gap-2">
          <CategoryTag category={req.category} className="shrink-0" />
          <p
            className={`min-w-0 leading-snug ${
              isSelected ? "" : TEXT_CLAMP[density]
            } ${req.is_gating ? "font-medium text-ink" : "text-ink"}`}
          >
            {req.text}
          </p>
          {/* Uncertainty is never hover-gated: a needs_review row wears its
              amber pill at rest (the same quiet idiom as the gating dossier),
              so a hesitant extraction looks hesitant from across the desk. */}
          {req.needs_review && (
            <span className="inline-flex shrink-0 items-center rounded border border-signal-amber/50 bg-signal-amber/10 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-signal-amber">
              Needs review
            </span>
          )}
        </div>

        {alsoOn && (
          <p className="mt-0.5 font-mono text-[11px] text-ink-muted/75">
            {alsoOn}
          </p>
        )}

        {req.needs_review && (
          <p className="mt-0.5 hidden text-sm text-ink-muted group-hover:block group-focus-visible:block">
            Low confidence. Check this one yourself.
          </p>
        )}

        {preview && (
          <p className="mt-0.5 hidden truncate text-sm text-ink-muted group-hover:block group-focus-visible:block">
            {preview}
          </p>
        )}

        {/* A gap is a to-do, not a hover secret: the unanswered-question prompt
            is ALWAYS visible, and clicking it opens the inline quick-answer
            form right here in the register. */}
        <OpenQuestionSlot
          req={req}
          density={density}
          onAnswerQuestion={onAnswerQuestion}
        />
      </div>

      {/* The status word, or for confident non-gating items a single quiet
          Approve revealed on hover or focus. One affordance only. */}
      <div className="col-start-3 flex shrink-0 flex-col items-start gap-1 pt-0 sm:col-start-auto sm:items-end sm:pt-0.5">
        {canApproveInline ? (
          <>
            <span className="group-hover:hidden group-focus-within:hidden">
              <StatusWord req={req} />
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onApprove(req.id);
              }}
              className="hidden text-xs font-medium text-forest transition-colors hover:text-forest-hover hover:underline focus:outline-none focus-visible:underline group-hover:inline group-focus-within:inline"
            >
              Approve
            </button>
          </>
        ) : (
          <StatusWord req={req} />
        )}
        {/* Collaboration presence (UI Stage 6): the oxblood blocker bead
            (louder — reads like the gating pennant's family) then the quiet
            comment count, both server-stamped and null-when-zero, so a row
            with no team discussion keeps this column exactly as it was. */}
        {(req.open_blocker_count || req.comment_count) && (
          <span className="flex flex-col items-start gap-0.5 sm:items-end">
            <BlockerMarker count={req.open_blocker_count} className="text-[11px]" />
            <CommentCountMarker count={req.comment_count} className="text-[11px]" />
          </span>
        )}
      </div>
    </div>
  );
}

// The inline gap-answer slot. When a requirement carries unanswered open
// questions, a quiet amber one-liner names the debt ("1 question needs your
// answer") — always visible, never a hover reveal. Clicking it unfolds a small
// quick-answer form under the row text: the question, a textarea, Save. Saving
// hands the text to answerOpenQuestion upstream; the unanswered list shrinks,
// so the form advances to the next question by itself and folds away when none
// remain. Without a handler (frozen surfaces) the prompt renders as plain text.
function OpenQuestionSlot({
  req,
  density,
  onAnswerQuestion,
}: {
  req: Requirement;
  density: Density;
  onAnswerQuestion?: (reqId: string, questionId: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const unanswered = (req.open_questions ?? []).filter(
    (q) => q.answer === null
  );
  if (unanswered.length === 0) return null;

  const prompt =
    unanswered.length === 1
      ? "1 question needs your answer"
      : `${unanswered.length} questions need your answers`;
  const current = unanswered[0];

  function save() {
    const trimmed = text.trim();
    if (!trimmed || !onAnswerQuestion) return;
    onAnswerQuestion(req.id, current.id, trimmed);
    setText("");
    // If this was the last question the slot unmounts with the list; otherwise
    // `current` recomputes to the next unanswered question on the next render.
    if (unanswered.length === 1) setOpen(false);
  }

  return (
    <div className={density === "compact" ? "mt-0.5" : "mt-1"}>
      {onAnswerQuestion ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="inline-flex items-center gap-1.5 text-xs text-signal-amber transition-colors hover:underline focus:outline-none focus-visible:underline"
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal-amber" />
          {prompt}
        </button>
      ) : (
        <p className="inline-flex items-center gap-1.5 text-xs text-signal-amber">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal-amber" />
          {prompt}
        </p>
      )}

      {open && onAnswerQuestion && (
        <div
          role="none"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={`cursor-default rounded-md border border-hairline bg-paper-raised px-3 shadow-[var(--depth-control)] ${
            density === "compact" ? "mt-1 py-2" : "mt-1.5 py-2.5"
          }`}
        >
          <p className="text-sm leading-snug text-ink">{current.question}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={density === "compact" ? 2 : 3}
            placeholder="Your answer"
            className="mt-1.5 w-full resize-y rounded border border-hairline bg-paper px-2 py-1.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-forest focus:ring-1 focus:ring-forest"
          />
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-ink-muted">
              {unanswered.length === 1
                ? "Last question"
                : `${unanswered.length} to answer`}
            </span>
            <button
              type="button"
              onClick={save}
              disabled={text.trim().length === 0}
              className="rounded-md bg-forest px-3 py-1 text-xs font-semibold text-paper shadow-[var(--depth-control)] transition-colors hover:bg-forest-hover disabled:cursor-not-allowed disabled:bg-ink-muted/40"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// A quiet mono chevron: points right when folded, rotates down when open. The
// direction (not colour) carries the state, so it passes the greyscale test.
function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-ink-muted transition-transform duration-150 ${
        expanded ? "rotate-90" : ""
      }`}
    >
      <path
        d="M3 1.5l4 3.5-4 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The virtualized row path (representatives.length > VIRTUALIZE_THRESHOLD):
// the group body becomes its own scroller (the sticky group header stays
// outside it), rows are windowed and absolutely positioned, and measureElement
// keeps rows honest when hover reveals the preview/low-confidence lines or the
// inline question form unfolds. No motion wrappers in here, by policy.
function VirtualizedRows({
  id,
  representatives,
  meta,
  density,
  showSourceKind,
  selectedId,
  cursorId,
  onSelect,
  onApprove,
  selection,
  onAnswerQuestion,
}: {
  id: string;
  representatives: Requirement[];
  meta: VisibleGroup["meta"];
  density: Density;
  showSourceKind: boolean;
  selectedId: string | null;
  cursorId: string | null;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  selection?: MatrixSelection;
  onAnswerQuestion?: (reqId: string, questionId: string, text: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: representatives.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE[density],
    overscan: 10,
    getItemKey: (index) => representatives[index].id,
  });

  return (
    <div
      ref={parentRef}
      id={id}
      className="mt-2 max-h-[70vh] overflow-auto overscroll-contain"
    >
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const req = representatives[item.index];
          return (
            <div
              key={item.key}
              data-index={item.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full pb-0.5"
              style={{ transform: `translateY(${item.start}px)` }}
            >
              <MatrixRow
                req={req}
                isSelected={req.id === selectedId}
                isCursor={req.id === cursorId}
                alsoCitedOn={meta.get(req.id)?.alsoCitedOn ?? []}
                density={density}
                showSourceKind={showSourceKind}
                onSelect={onSelect}
                onApprove={onApprove}
                selection={selection}
                onAnswerQuestion={onAnswerQuestion}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatrixGroup({
  group,
  expanded,
  collapsible,
  density,
  showSourceKind,
  onToggle,
  selectedId,
  cursorId,
  onSelect,
  onApprove,
  onApproveAll,
  canApproveAll,
  showCoverage,
  selection,
  onAnswerQuestion,
  reduced,
  reveal,
  groupIndex,
  getExitDelay,
}: {
  // A visible group with its display dedupe precomputed by deriveVisibleGroups
  // (one collapseDuplicates pass per group, shared with the shown counter).
  group: VisibleGroup;
  // Whether this group's rows are shown. When collapsible is false (frozen/demo
  // surfaces) this is always true and no toggle renders.
  expanded: boolean;
  collapsible: boolean;
  density: Density;
  // Whether rows show the format badge (only when the pack mixes formats).
  showSourceKind: boolean;
  onToggle: () => void;
  selectedId: string | null;
  // The keyboard cursor row (j/k), or null when the keyboard is idle.
  cursorId: string | null;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onApproveAll: (ids: string[]) => void;
  canApproveAll: boolean;
  // Criteria-lens coverage: a slim decided/total track under the group header.
  showCoverage?: boolean;
  selection?: MatrixSelection;
  onAnswerQuestion?: (reqId: string, questionId: string, text: string) => void;
  // Motion policy inputs: reduced motion renders plain divs; reveal marks the
  // one-time staged entrance (a fresh tender, never a decision re-render); the
  // group's index paces the top-down stagger; getExitDelay supplies the
  // bulk-approve cascade delay for an exiting row (0 outside a cascade).
  reduced: boolean;
  reveal: boolean;
  groupIndex: number;
  getExitDelay?: (id: string) => number;
}) {
  // Near-duplicate rows arrive already collapsed (display only — nothing is
  // dropped; each representative carries the pages its duplicates were cited on).
  // Approve-all still targets every confident representative, so the count and the
  // action stay consistent with what is on screen. See lib/matrix-derive.ts.
  const { representatives, meta } = group;
  const approvable = representatives.filter(isConfidentNonGating);
  const rowsId = `group-rows-${group.key}`;
  const decidedCount = representatives.filter(
    (req) => req.status !== "pending"
  ).length;

  const content = (
    <>
      {/* The group header stays with its rows: sticky to the top of the scroll
          so the label and count remain legible while the section runs long. A
          paper ground and a hair rule keep it reading as a register divider, not
          a floating bar. Tokens: --rule-hair (row/minor divider, same 1px
          hairline colour — no pixel change). */}
      <div className="sticky top-0 z-10 -mx-1 [border-bottom:var(--rule-hair)] bg-paper px-1 pb-2 pt-2">
        <div className="flex items-center justify-between gap-3">
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={rowsId}
            className="group/head pointer-events-auto flex min-w-0 items-center gap-2 rounded-sm text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink/40"
          >
            <Chevron expanded={expanded} />
            <h3 className="text-[12.5px] font-medium uppercase tracking-wide text-ink-muted transition-colors group-hover/head:text-ink">
              {group.label}
            </h3>
            <span className="font-mono text-[11px] text-ink-muted/75">
              {representatives.length}
            </span>
          </button>
        ) : (
          <h3 className="text-[12.5px] font-medium uppercase tracking-wide text-ink-muted">
            {group.label}
          </h3>
        )}
        {canApproveAll &&
          expanded &&
          group.key === "ready" &&
          approvable.length > 1 && (
          <button
            type="button"
            onClick={() => onApproveAll(approvable.map((req) => req.id))}
            className="text-xs font-medium text-forest transition-colors hover:text-forest-hover hover:underline"
          >
            Approve all confident ({approvable.length})
          </button>
        )}
        </div>
        {showCoverage && (
          // Criteria-lens coverage: how much of this criterion is decided,
          // as the same slim forest track the worklist header carries.
          <div
            className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-hairline"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={representatives.length}
            aria-valuenow={decidedCount}
            aria-label={`${group.label}: ${decidedCount} of ${representatives.length} decided`}
          >
            <div
              className="h-full rounded-full bg-forest transition-[width] duration-500"
              style={{
                width: `${
                  representatives.length > 0
                    ? (decidedCount / representatives.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        )}
      </div>
      {expanded &&
        // The reconciliation policy: over the threshold the group windows its
        // rows (plain divs, own scroller); under it — and with motion allowed —
        // rows are motion.divs that layout-spring between groups on approve /
        // flag and exit as a quick fade-collapse. Reduced motion gets the same
        // plain divs the frozen surfaces would.
        (representatives.length > VIRTUALIZE_THRESHOLD ? (
          <VirtualizedRows
            id={rowsId}
            representatives={representatives}
            meta={meta}
            density={density}
            showSourceKind={showSourceKind}
            selectedId={selectedId}
            cursorId={cursorId}
            onSelect={onSelect}
            onApprove={onApprove}
            selection={selection}
            onAnswerQuestion={onAnswerQuestion}
          />
        ) : reduced ? (
          <div id={rowsId} className="mt-2 flex flex-col gap-0.5">
            {representatives.map((req) => (
              <MatrixRow
                key={req.id}
                req={req}
                isSelected={req.id === selectedId}
                isCursor={req.id === cursorId}
                alsoCitedOn={meta.get(req.id)?.alsoCitedOn ?? []}
                density={density}
                showSourceKind={showSourceKind}
                onSelect={onSelect}
                onApprove={onApprove}
                selection={selection}
                onAnswerQuestion={onAnswerQuestion}
              />
            ))}
          </div>
        ) : (
          <div id={rowsId} className="mt-2 flex flex-col gap-0.5">
            {/* initial={reveal}: row entrances exist ONLY during the staged
                reveal. A row arriving later (a decision moving it between
                groups) appears in place instantly; the layout spring on its
                peers carries the movement. */}
            <AnimatePresence initial={reveal}>
              {representatives.map((req, i) => {
                const revealed = reveal && i < REVEAL_ROW_COUNT;
                const revealDelay = groupIndex * 0.06 + 0.08 + i * 0.03;
                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={revealed ? { opacity: 0, y: 6 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    // Dynamic exit variant: resolved when the exit starts, so
                    // the bulk-approve cascade delay (written in the click
                    // handler, read through a ref) is current, not the value
                    // from the row's last render.
                    exit="exit"
                    variants={{
                      exit: () => ({
                        opacity: 0,
                        height: 0,
                        overflow: "hidden",
                        transition: {
                          duration: 0.15,
                          ease: "easeOut",
                          delay: getExitDelay?.(req.id) ?? 0,
                        },
                      }),
                    }}
                    transition={{
                      layout: { type: "spring", stiffness: 550, damping: 40 },
                      ...(revealed
                        ? {
                            opacity: { duration: 0.25, delay: revealDelay },
                            y: { duration: 0.25, delay: revealDelay },
                          }
                        : undefined),
                    }}
                  >
                    <MatrixRow
                      req={req}
                      isSelected={req.id === selectedId}
                      isCursor={req.id === cursorId}
                      alsoCitedOn={meta.get(req.id)?.alsoCitedOn ?? []}
                      density={density}
                      showSourceKind={showSourceKind}
                      onSelect={onSelect}
                      onApprove={onApprove}
                      selection={selection}
                      onAnswerQuestion={onAnswerQuestion}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
    </>
  );

  // Reduced motion renders a plain section — a distinct element on purpose, so
  // a reduced-motion client's post-hydration re-render (see
  // useReducedMotionHydrationSafe) REMOUNTS away from the motion.section and
  // any in-flight entrance styles, landing on clean static DOM.
  if (reduced) return <section>{content}</section>;

  return (
    // Staged reveal only: initial={false} outside the one-time entrance, so a
    // decision re-render, a filter change, or a frozen surface never animates
    // the group in (no fade-up-on-everything).
    <motion.section
      initial={reveal ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: groupIndex * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {content}
    </motion.section>
  );
}

export function ComplianceMatrix({
  groups,
  selectedId,
  cursorId = null,
  onSelect,
  onApprove,
  activeFilter,
  activeCategories,
  sortBy,
  collapsed,
  onToggleGroup,
  density = "comfortable",
  onDensityChange,
  lens = "triage",
  onLensChange,
  awardCriteria,
  selection,
  onApproveMany,
  onAnswerQuestion,
  onEnterFocus,
  revealKey,
  getExitDelay,
}: {
  groups: TriageGroup[];
  selectedId: string | null;
  // The keyboard cursor row (j/k moves it; Enter opens it). Optional so the
  // frozen demo/hero surfaces never show a cursor ring.
  cursorId?: string | null;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  activeFilter: GroupKey | null;
  // Category filter (empty / omitted = no category filtering) and the row sort
  // order. Both optional so the frozen demo/hero surfaces keep their source
  // order untouched: when sortBy is omitted the rows are left as grouped.
  activeCategories?: Set<string>;
  sortBy?: SortKey;
  // Folded groups + the toggle handler, keyed by the visible group's string key
  // (a triage GroupKey under the triage lens, a criterion id under criteria).
  // Omitted on the frozen demo/hero surfaces, where every group stays open and
  // no toggle renders.
  collapsed?: Set<string>;
  onToggleGroup?: (key: string) => void;
  // Row density + its setter. Optional and defaulting to comfortable so the
  // frozen demo/hero surfaces render unchanged; the toggle only shows when a
  // setter is supplied.
  density?: Density;
  onDensityChange?: (density: Density) => void;
  // The grouping lens + its setter. Optional, defaulting to triage, so the
  // frozen surfaces render exactly as before; the segmented control only shows
  // when a setter is supplied.
  lens?: MatrixLens;
  onLensChange?: (lens: MatrixLens) => void;
  // The tender's published award criteria, for real names + weights on the
  // criteria-lens group headers.
  awardCriteria?: AwardCriterion[];
  // Multi-select. Omitted on frozen surfaces: no checkbox renders and the row
  // grid keeps its original geometry.
  selection?: MatrixSelection;
  // Batch approve for the group header's "Approve all confident" — lets the
  // owner make it one state pass + one undo toast. Falls back to per-row
  // onApprove calls when omitted (the frozen surfaces).
  onApproveMany?: (ids: string[]) => void;
  // Inline gap answering. Omitted on frozen surfaces: the unanswered-question
  // prompt renders as static text with no form.
  onAnswerQuestion?: (reqId: string, questionId: string, text: string) => void;
  // Entry into focus mode (the full-screen one-at-a-time review). Optional so
  // the frozen demo/hero surfaces render no affordance at all.
  onEnterFocus?: () => void;
  // The tender's identity (tender id / seed). When it CHANGES, the matrix plays
  // its one-time staged reveal: groups enter top-down, the first rows of each
  // group stagger in. Omitted (the frozen demo/hero surfaces) = no entrance,
  // ever. Decision re-renders and filter changes never replay it — the key is
  // remembered at module scope, surviving the matrix unmounting into the split.
  revealKey?: string;
  // Bulk-approve cascade: the owner's per-row exit delay (~40ms steps across
  // the affected rows). Omitted = every exit is immediate.
  getExitDelay?: (id: string) => number;
}) {
  const [query, setQuery] = useState("");
  // Reduced motion (motion/react's media-query hook, no render-time
  // window reads of our own): when set, every animated path in the matrix
  // renders static.
  const reduced = useReducedMotionHydrationSafe();
  // The staged reveal plays only while the key is unseen; the effect below
  // retires it after the first paint, so decision re-renders and filter
  // changes render with reveal=false. The seen set lives at module scope (not
  // a ref) because the matrix unmounts whenever the split opens — a remount
  // for the SAME tender must not replay the entrance. The effect never runs on
  // the server, so SSR always renders reveal=true markup and hydration stays
  // consistent with the client's first render.
  const reveal =
    !reduced && revealKey !== undefined && !seenRevealKeys.has(revealKey);
  useEffect(() => {
    if (revealKey !== undefined) seenRevealKeys.add(revealKey);
  });
  const normalisedQuery = query.trim().toLowerCase();
  // Whether any category filtering is live (for the empty-state copy below).
  const categoryFilterActive =
    activeCategories !== undefined && activeCategories.size > 0;
  // The visible worklist: search + category filter + sort + display dedupe, all
  // derived in one memoised pass (see lib/matrix-derive.ts). Each group arrives
  // with its representatives precomputed, and shownCount is the same dedupe the
  // rows use — collapseDuplicates runs exactly once per group per derivation.
  const { groups: visible, shownCount } = useMemo(
    () =>
      deriveVisibleGroups({
        groups,
        query,
        activeFilter,
        activeCategories,
        sortBy,
        lens,
        awardCriteria,
      }),
    [groups, query, activeFilter, activeCategories, sortBy, lens, awardCriteria]
  );

  // The format badge earns its slot in the crowded ref margin only when the
  // tender pack actually mixes document kinds; a single-format pack (one PDF)
  // would just repeat the same three letters down every row.
  const showSourceKind = useMemo(() => {
    const kinds = new Set<string>();
    for (const group of groups) {
      for (const req of group.items) kinds.add(sourceDocumentKind(req));
    }
    return kinds.size > 1;
  }, [groups]);

  function approveAll(ids: string[]) {
    // One batch pass (and one undo toast) when the owner provides it; the
    // frozen surfaces fall back to per-row approves.
    if (onApproveMany) onApproveMany(ids);
    else for (const id of ids) onApprove(id);
  }

  return (
    <div className="flex w-full flex-col gap-10">
      {/* Toolbar/search zone separator. Semantically a major panel zone divider
          (toolbar → matrix content) that ideally maps to --rule-section, but
          --rule-section is #d9cfbb (one step darker than hairline #e4ddce), so
          converting would change the rendered colour. Using --rule-hair instead
          to preserve pixels; this border can be upgraded to --rule-section in a
          dedicated colour pass if the distinction becomes desired. */}
      <div className="flex flex-col gap-2 [border-bottom:var(--rule-hair)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="max-w-md flex-1">
          <span className="sr-only">Search requirements</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search requirements, clauses or answers"
            className="w-full rounded-md border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-forest focus:ring-1 focus:ring-forest"
          />
        </label>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink-muted">
            {shownCount} shown
          </span>
          {onEnterFocus && (
            <button
              type="button"
              onClick={onEnterFocus}
              title="Review one at a time (Shift+F)"
              className="font-mono text-xs text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            >
              Focus
            </button>
          )}
          {onLensChange && (
            <LensToggle lens={lens} onLensChange={onLensChange} />
          )}
          {onDensityChange && (
            <DensityToggle density={density} onDensityChange={onDensityChange} />
          )}
        </div>
      </div>

      {visible.map((group, groupIndex) => {
        const collapsible = onToggleGroup !== undefined;
        // Force a group open when its rows must be seen regardless of the fold:
        // while searching (never hide a hit), when the triage filter points at
        // it (its key matches only under the triage lens; under criteria the
        // filter is row-level and never a group key), or when it holds the
        // selected row. Otherwise honour the user's fold state.
        const expanded =
          !collapsible ||
          normalisedQuery.length > 0 ||
          activeFilter === group.key ||
          group.items.some((req) => req.id === selectedId) ||
          !(collapsed?.has(group.key) ?? false);
        return (
          <MatrixGroup
            // Keyed by the reveal identity too, so a new tender remounts the
            // groups and the entrance choreography replays exactly once.
            key={revealKey !== undefined ? `${revealKey}:${group.key}` : group.key}
            group={group}
            expanded={expanded}
            collapsible={collapsible}
            density={density}
            showSourceKind={showSourceKind}
            onToggle={() => onToggleGroup?.(group.key)}
            selectedId={selectedId}
            cursorId={cursorId}
            onSelect={onSelect}
            onApprove={onApprove}
            onApproveAll={approveAll}
            canApproveAll={onApproveMany !== undefined}
            showCoverage={lens === "criteria"}
            selection={selection}
            onAnswerQuestion={onAnswerQuestion}
            reduced={reduced}
            reveal={reveal}
            groupIndex={groupIndex}
            getExitDelay={getExitDelay}
          />
        );
      })}
      {visible.length === 0 && (
        <EmptyRegister
          filtered={
            normalisedQuery.length > 0 ||
            activeFilter !== null ||
            categoryFilterActive
          }
          onClear={() => setQuery("")}
          hasQuery={normalisedQuery.length > 0}
        />
      )}
    </div>
  );
}

// The lens toggle: the same two-word segmented control register as the density
// toggle beside it. Triage groups by what each row needs from you; Criteria
// regroups the same rows under the tender's published award criteria.
function LensToggle({
  lens,
  onLensChange,
}: {
  lens: MatrixLens;
  onLensChange: (lens: MatrixLens) => void;
}) {
  const options: { key: MatrixLens; label: string }[] = [
    { key: "triage", label: "Triage" },
    { key: "criteria", label: "Criteria" },
  ];
  return (
    <div
      role="group"
      aria-label="Group rows by"
      className="inline-flex items-center overflow-hidden rounded-md border border-hairline"
    >
      {options.map((option) => {
        const active = lens === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onLensChange(option.key)}
            className={`px-2 py-1 font-mono text-[11px] transition-colors ${
              active
                ? "bg-ink/[0.06] font-medium text-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// The density toggle: a two-word segmented control in the register register, not
// a forest button. The chosen word carries an ink ground; the other rests muted.
// State (greyscale-legible) is weight and fill, never colour alone.
function DensityToggle({
  density,
  onDensityChange,
}: {
  density: Density;
  onDensityChange: (density: Density) => void;
}) {
  const options: { key: Density; label: string }[] = [
    { key: "comfortable", label: "Comfortable" },
    { key: "compact", label: "Compact" },
  ];
  return (
    <div
      role="group"
      aria-label="Row density"
      className="inline-flex items-center overflow-hidden rounded-md border border-hairline"
    >
      {options.map((option) => {
        const active = density === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onDensityChange(option.key)}
            className={`px-2 py-1 font-mono text-[11px] transition-colors ${
              active
                ? "bg-ink/[0.06] font-medium text-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// The empty state as a register leaf, not a bare sentence: a dropped clause mark
// over a calm line. Two readings. A live filter or search that matched nothing
// offers a way back; a genuinely empty view (nothing to review) simply says so.
function EmptyRegister({
  filtered,
  hasQuery,
  onClear,
}: {
  filtered: boolean;
  hasQuery: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-hairline bg-paper-raised/50 px-6 py-12 text-center">
      <span
        aria-hidden
        className="font-serif text-3xl leading-none text-ink-muted/50"
      >
        §
      </span>
      <p className="max-w-[42ch] text-sm text-ink-muted">
        {filtered
          ? "No requirements match this view."
          : "No requirements to review yet."}
      </p>
      {filtered && hasQuery && (
        <button
          type="button"
          onClick={onClear}
          className="font-mono text-xs text-ink-muted underline decoration-1 underline-offset-4 transition-colors hover:text-ink"
        >
          Clear search
        </button>
      )}
    </div>
  );
}
