import { useEffect, useState } from "react";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { ApprovalStamp } from "@/components/ApprovalStamp";
import { GatingHero } from "@/components/GatingHero";
import { CategoryTag } from "@/components/CategoryTag";
import { GraphView } from "@/components/GraphView";
import {
  CommentCountMarker,
  BlockerMarker,
} from "@/components/CollaborationMarkers";
import { FernFrond } from "@/components/landing/art/FernFrond";
import { PineBranch } from "@/components/landing/art/PineBranch";
import { motion, useTransform, type MotionValue } from "motion/react";
import { GhostCursor } from "./GhostCursor";
import { StageChrome } from "./StageChrome";
import {
  SAMPLE,
  SAMPLE_EXTENDED,
  SAMPLE_GATING,
  SAMPLE_ANSWERED,
  DEMO_FACTS,
  WALL_PARAGRAPHS,
} from "./sample";
import { STEPS } from "./steps";

// The pinned "stage" for the /demo cinematic scroll — a persistent scene, not a
// slideshow. Layers are mounted ONCE and driven by the continuous, spring-
// damped `beat` MotionValue (see useScrollTimeline): each layer binds its
// opacity/y/scale to a window of the beat, so scrolling physically transforms
// one continuous scene — the document wall recedes as the register rises, the
// gating row lifts out (LiftProxy) and lands as the dossier, the answer earns
// its stamp, the real GraphView appears, and the finale stamp slams over a
// pine wash. Discrete one-shots (wall scan, stamp settle, wire draw, frame
// jolt) still key off the rounded `step`, so they replay on re-entry. The
// stage is illustrative only (aria-hidden + inert); the narrative copy is the
// a11y source of truth. BeatVisual renders the composed FINAL state of each
// beat for the stacked fallback (SSR / no-JS / reduced motion / mobile), so
// that path never depends on choreography.

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

// A short, realistic clause reference in the mono record voice.
function clauseRef(page: number, clause: string | null) {
  return `p.${page}${clause ? ` · ${clause}` : ""}`;
}

/* ---------------------------------------------------------------- wall ---- */

// Beat 1 — a real document, not a skeleton: two justified columns of tiny serif
// tender prose (several lines verbatim from the sample excerpts), an honest
// mono header quoting the true counts, and a mono page footer. The catch
// sentence hides in plain sight until the scan pass lights it oxblood.
//   phase "read"      — untouched page, catch indistinguishable.
//   phase "resolving" — the .wall-scan bar sweeps once; catch lights (delay 500ms).
//   phase "composed"  — stacked-fallback final state: found line lit, no sweep.
function WallDocument({
  phase,
}: {
  phase: "read" | "resolving" | "composed";
}) {
  const lit = phase !== "read";
  return (
    <div className="wall-cinema relative w-full max-w-[31rem]">
      <span aria-hidden className="wall-evidence-sheet wall-evidence-sheet-a" />
      <span aria-hidden className="wall-evidence-sheet wall-evidence-sheet-b" />
      <div className="wall-document relative overflow-hidden rounded-lg border border-hairline bg-paper-raised p-6 shadow-[var(--depth-sheet)]">
        {/* The read-pass: a quiet highlight bar sweeping the sheet once. Mounted
            only while resolving so the one-shot keyframe replays on re-entry. */}
        {phase === "resolving" && (
          <>
            <span
              aria-hidden
              className="wall-scan pointer-events-none absolute inset-x-0 top-0 h-1/5 border-b border-forest/40 bg-forest/10"
            />
            <span
              aria-hidden
              className="wall-crosshair pointer-events-none absolute left-0 right-0 top-[41%] border-t border-signal-oxblood/35"
            />
          </>
        )}
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          One tender · {DEMO_FACTS.pages} pages · {DEMO_FACTS.requirements}{" "}
          requirements inside
        </p>
        <div className="mt-4 columns-2 gap-5 text-justify font-serif text-[7px] leading-[11px] text-ink/70 [hyphens:auto]">
          {WALL_PARAGRAPHS.map((para, i) => (
            <p key={i} className="mb-2">
              {para.lead}
              {para.catch && (
                <>
                  {" "}
                  <span
                    data-wall-catch
                    className={`rounded-[2px] px-0.5 [box-decoration-break:clone] transition-colors duration-[var(--motion-feature)] ${
                      lit
                        ? "bg-signal-oxblood/15 text-signal-oxblood delay-[var(--motion-feature)]"
                        : "bg-transparent text-ink/70 delay-0"
                    }`}
                  >
                    {para.catch}
                  </span>
                </>
              )}
              {para.tail && <> {para.tail}</>}
            </p>
          ))}
        </div>
        <p className="mt-3 flex items-baseline justify-between border-t border-hairline pt-2 font-mono text-[9px] text-ink-muted">
          <span>{DEMO_FACTS.docTitle}</span>
          <span>p.7 of {DEMO_FACTS.pages}</span>
        </p>
      </div>
      {phase === "resolving" && (
        <span
          aria-hidden
          className="wall-readout surface-grain absolute -right-4 bottom-5 hidden rounded-md border border-accent/25 bg-paper-raised px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-accent shadow-[var(--depth-row)] sm:block"
        >
          Clause locked · 4.2.1
        </span>
      )}
    </div>
  );
}

function ExtractionThread({ beat }: { beat: MotionValue<number> }) {
  const opacity = useTransform(beat, [0.45, 0.7, 1.15, 1.4], [0, 1, 1, 0]);
  const pathLength = useTransform(beat, [0.5, 1.1], [0, 1]);
  return (
    <motion.svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[15] h-full w-full text-accent/55"
      viewBox="0 0 520 420"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <motion.path
        d="M72 146 C 180 122, 224 120, 286 134 S 406 154, 470 122"
        fill="none"
        stroke="currentColor"
        strokeDasharray="1"
        strokeWidth="1.4"
        style={{ pathLength }}
      />
      <motion.path
        d="M84 190 C 190 198, 226 190, 292 198 S 408 218, 474 208"
        fill="none"
        opacity="0.7"
        stroke="currentColor"
        strokeDasharray="1"
        strokeWidth="1"
        style={{ pathLength }}
      />
    </motion.svg>
  );
}

function ExtractionLedger({ beat }: { beat: MotionValue<number> }) {
  const opacity = useTransform(beat, [0.7, 1.05, 1.45], [0, 1, 0]);
  const x = useTransform(beat, [0.7, 1.05], [16, 0]);
  return (
    <motion.div
      className="absolute right-3 top-5 z-[35] hidden w-36 rounded-md border border-hairline bg-paper-raised p-3 font-mono text-[9px] uppercase tracking-[0.11em] text-ink-muted shadow-[var(--depth-row)] lg:block"
      style={{ opacity, x }}
      aria-hidden
    >
      <div className="flex items-center justify-between border-b border-hairline pb-2">
        <span>Read pass</span>
        <span className="text-forest">live</span>
      </div>
      <div className="mt-2 space-y-1.5">
        <span className="block h-1.5 w-full rounded-sm bg-forest/25" />
        <span className="block h-1.5 w-5/6 rounded-sm bg-signal-oxblood/25" />
        <span className="block h-1.5 w-3/4 rounded-sm bg-accent/20" />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ register ---- */

// A single requirement row of the register. The bead (real segmented
// ConfidenceIndicator) is ALWAYS mounted so row heights never jump — it pops in
// (opacity/scale, origin-left) when the honesty beat arrives. The oxblood flare
// on the gating rows is a colour transition on an always-present left rule, so
// nothing reflows when they light up.
type RowProps = {
  index: number;
  text: string;
  page: number;
  clause: string | null;
  category: string;
  confidence: number;
  needsReview: boolean;
  isGating: boolean;
  rowShown: boolean;
  rowDelayMs: number;
  flare: boolean;
  beadShown: boolean;
  beadDelayMs: number;
  scrubStyle?: {
    opacity: MotionValue<number>;
    y: MotionValue<number>;
  };
};

function Row({
  index,
  text,
  page,
  clause,
  category,
  confidence,
  needsReview,
  isGating,
  rowShown,
  rowDelayMs,
  flare,
  beadShown,
  beadDelayMs,
  scrubStyle,
}: RowProps) {
  const className = `flex flex-col gap-1.5 border-b border-l-2 border-b-hairline py-2.5 pl-3 transition-[opacity,transform,border-color,background-color] duration-[var(--motion-feature)] ${EASE} last:border-b-0 ${
    flare && isGating
      ? "border-l-signal-oxblood bg-signal-oxblood/10"
      : "border-l-transparent bg-transparent"
  } ${rowShown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`;

  const content = (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <CategoryTag category={category} />
        <span
          className={`inline-flex origin-left transition-[opacity,transform] duration-[var(--motion-feature)] ${EASE} ${
            beadShown ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
          style={{ transitionDelay: `${beadDelayMs}ms` }}
        >
          <ConfidenceIndicator
            confidence={confidence}
            needsReview={needsReview}
            variant="word"
            size="sm"
          />
        </span>
      </div>
      <p className="text-sm leading-snug text-ink">
        {text}
        <span className="ml-2 font-mono text-[11px] text-ink-muted">
          {clauseRef(page, clause)}
        </span>
      </p>
    </>
  );

  if (scrubStyle) {
    return (
      <motion.li key={index} className={className} style={scrubStyle}>
        {content}
      </motion.li>
    );
  }

  return (
    <li
      key={index}
      className={className}
      style={{ transitionDelay: `${rowDelayMs}ms` }}
    >
      {content}
    </li>
  );
}

function ScrubRow({
  beat,
  rowStart,
  ...props
}: RowProps & {
  beat: MotionValue<number>;
  rowStart: number;
}) {
  const opacity = useTransform(beat, [rowStart, rowStart + 0.25], [0, 1]);
  const y = useTransform(beat, [rowStart, rowStart + 0.25], [28, 0]);
  return (
    <Row
      {...props}
      rowShown
      rowDelayMs={0}
      scrubStyle={{ opacity, y }}
    />
  );
}

// Beats 2–4 — the ONE mounted requirement register. In the enhanced stage the
// same five rows persist across three beats: they stagger in as the wall
// resolves (900 + i*90ms), the gating pair flares oxblood before the dossier
// composes over them, and the confidence beads pop onto the same rows
// (400 + i*80ms) when the register returns. `composed` renders the stacked
// fallback's final state (rows in, flare off, beads per `composedBeads`).
function RegisterSheet({
  step,
  composed = false,
  composedBeads = false,
  beat,
  rows = SAMPLE,
}: {
  step: number;
  composed?: boolean;
  composedBeads?: boolean;
  beat?: MotionValue<number>;
  rows?: typeof SAMPLE;
}) {
  const rowsShown = composed || step >= 1;
  const staggerRows = !composed && step === 1;
  const flare = !composed && step === 2;
  const beadsShown = composed ? composedBeads : step >= 3;
  const popBeads = !composed && step === 3;
  return (
    <div className="w-full max-w-[32rem] rounded-lg border border-hairline bg-paper-raised p-5 shadow-[var(--depth-row)]">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        {beadsShown
          ? `Read, with confidence shown · ${rows.length} of ${DEMO_FACTS.requirements}`
          : `Every requirement, pulled out · ${rows.length} of ${DEMO_FACTS.requirements} shown`}
      </p>
      <ul>
        {rows.map((r, i) => {
          const props: RowProps = {
            index: i,
            text: r.text,
            page: r.source_page,
            clause: r.source_clause,
            category: r.category,
            confidence: r.confidence,
            needsReview: r.needs_review,
            isGating: r.is_gating,
            rowShown: rowsShown,
            rowDelayMs: staggerRows ? 900 + i * 90 : 0,
            flare,
            beadShown: beadsShown,
            beadDelayMs: popBeads ? 400 + i * 80 : 0,
          };
          return beat ? (
            <ScrubRow
              key={r.id}
              {...props}
              beat={beat}
              rowStart={0.72 + i * 0.045}
            />
          ) : (
            <Row key={r.id} {...props} />
          );
        })}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------- answer ---- */

// Beats 5 & 6 — the grounded answer with its receipt (forest reading edge + the
// mono citation line). The stamp mounts when the approval beat arrives; in the
// enhanced stage it is wrapped in .stamp-emphasis so the CSS hooks swap in the
// bigger settle and type the audit line on (CSS-only — ApprovalStamp itself is
// untouched and product surfaces keep the default settle).
function AnswerCard({
  withStamp,
  emphasis = false,
}: {
  withStamp: boolean;
  emphasis?: boolean;
}) {
  const req = SAMPLE_ANSWERED;
  const answer = req.answer;
  return (
    <div className="surface-grain w-full max-w-[34rem] rounded-lg border border-hairline bg-paper-raised p-6 shadow-[var(--depth-row)]">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
        Requirement
      </p>
      <p className="mt-1 leading-snug text-ink">{req.text}</p>
      <div className="mt-4 rounded-md border-l-2 border-forest bg-paper p-3">
        <p className="leading-relaxed text-ink">{answer?.text}</p>
        <p className="mt-2 font-mono text-xs text-ink-muted">
          Backed by your Insurance Certificates, p.
          {answer?.evidence_refs[0]?.page ?? 4}.
        </p>
      </div>
      <div className="mt-4">
        {withStamp ? (
          emphasis ? (
            <span className="stamp-emphasis">
              <ApprovalStamp />
            </span>
          ) : (
            <ApprovalStamp />
          )
        ) : (
          // Reserve the row height so the stamp settles in without a jump.
          <span className="block h-7" aria-hidden />
        )}
      </div>
    </div>
  );
}

function SourceThread({ beat }: { beat: MotionValue<number> }) {
  const opacity = useTransform(beat, [4.05, 4.25, 4.85, 5.2], [0, 1, 1, 0]);
  const pathLength = useTransform(beat, [4.15, 4.75], [0, 1]);
  return (
    <motion.svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 h-full w-full text-forest/60"
      viewBox="0 0 620 340"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <motion.path
        d="M240 210 C 300 210, 324 142, 386 142 S 488 136, 548 106"
        fill="none"
        stroke="currentColor"
        strokeDasharray="1"
        strokeWidth="1.3"
        style={{ pathLength }}
      />
    </motion.svg>
  );
}

function SourcePagePanel() {
  const req = SAMPLE_ANSWERED;
  const excerpt = req.source_excerpt;
  const [lead, tail] = excerpt.includes(req.text)
    ? excerpt.split(req.text)
    : [excerpt, ""];

  return (
    <div className="relative min-h-[18rem] rounded-md border border-hairline bg-paper-raised p-4 shadow-[var(--depth-row)]">
      <p className="flex items-baseline justify-between border-b border-hairline pb-2 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
        <span>{req.source_clause}</span>
        <span>p.{req.source_page}</span>
      </p>
      <div className="mt-4 space-y-3 font-serif text-[10px] leading-[17px] text-ink/70">
        <p>
          {lead}
          <span className="rounded-[2px] bg-forest/15 px-1 text-forest ring-1 ring-forest/40 [box-decoration-break:clone]">
            {req.text}
          </span>
          {tail}
        </p>
        <p>
          Certificates shall name the tendering entity and remain valid for the
          full contract term.
        </p>
        <p>
          The Council may request renewal evidence during mobilisation and at
          each anniversary of the contract.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ collab ---- */

// Beat 7 (new) — the same insurance-gate requirement the answer/approval
// beats already centre on, now shown with the real collaboration markers
// (CollaborationMarkers.tsx, Stage 6) in its meta cluster, plus a static
// oxblood note that a blocker holds the bid until it's resolved. Record voice,
// no alarm animation — the marker components themselves are already static by
// design, so this beat composes cleanly with zero motion under reduced-motion.
function CollaborationCard() {
  const req = SAMPLE_ANSWERED;
  return (
    <div className="surface-grain w-full max-w-[34rem] rounded-lg border border-hairline bg-paper-raised p-6 shadow-[var(--depth-row)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <CategoryTag category={req.category} />
        <span className="font-mono text-xs text-ink-muted">
          {clauseRef(req.source_page, req.source_clause)}
        </span>
      </div>
      <p className="mt-2 leading-snug text-ink">{req.text}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline pt-3">
        <BlockerMarker count={req.open_blocker_count} />
        <CommentCountMarker count={req.comment_count} />
      </div>
      <div className="mt-4 rounded-md border-l-2 border-l-signal-oxblood bg-signal-oxblood/10 p-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-signal-oxblood">
          Held
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink">
          An open blocker keeps this requirement out of the export until
          someone resolves it — so nothing ships with an unanswered objection.
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- graph ---- */

// Beat 8 — a lightweight relationship map. Requirement register-cards on the
// left wire to the award criteria that score them; the gating cards and their
// wiring stay lit oxblood, and a dashed forest line marks a dependency. The
// solid wires carry pathLength={1} inside an .art-lines group, so the shared
// [data-draw] CSS (globals.css) draws them on with per-path --draw-delay
// staggers when `drawn` flips the wrapper hidden→shown. The dashed dependency
// cannot draw (a dash pattern has no single stroke to reveal), so it fades in
// last instead. Under reduced motion the draw rules never apply, so `drawn`
// simply means "wires visible".
function GraphVisual({ drawn }: { drawn: boolean }) {
  const wire = (delayMs: number) =>
    ({ "--draw-delay": `${delayMs}ms` }) as React.CSSProperties;
  return (
    <div
      data-draw={drawn ? "shown" : "hidden"}
      className="w-full max-w-[32rem] rounded-lg border border-hairline bg-paper-recessed p-5 shadow-[var(--depth-pressed)]"
    >
      <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        Requirements · criteria · dependencies
      </p>
      <svg
        viewBox="0 0 320 190"
        className="w-full"
        role="presentation"
        aria-hidden
      >
        {/* Wiring, drawn under the cards. */}
        <g className="art-lines">
          {/* gating requirement -> criterion 1 (oxblood) */}
          <path
            d="M140 34 C 178 34, 182 58, 214 58"
            pathLength={1}
            style={wire(0)}
            fill="none"
            stroke="var(--color-signal-oxblood)"
            strokeWidth="1.6"
          />
          {/* second requirement -> criterion 1 */}
          <path
            d="M140 92 C 180 92, 184 66, 214 66"
            pathLength={1}
            style={wire(150)}
            fill="none"
            stroke="var(--color-forest)"
            strokeWidth="1.4"
            opacity="0.7"
          />
          {/* third requirement -> criterion 2 */}
          <path
            d="M140 150 C 180 150, 186 136, 214 136"
            pathLength={1}
            style={wire(300)}
            fill="none"
            stroke="var(--color-forest)"
            strokeWidth="1.4"
            opacity="0.7"
          />
        </g>
        {/* dependency between two requirements (dashed forest, fades in last) */}
        <path
          d="M40 52 C 20 68, 20 76, 40 92"
          className={`transition-opacity duration-[var(--motion-feature)] ${
            // 450ms is bespoke — it sits between --motion-process (360ms, 25%
            // off) and --motion-feature (520ms, 13.5% off), outside the ~12%
            // swap threshold, so it stays a literal rather than picking a
            // token that would shift the wire's landing beat.
            drawn ? "opacity-100 delay-[450ms]" : "opacity-0 delay-0"
          }`}
          fill="none"
          stroke="var(--color-forest)"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />

        {/* Left column — requirement register cards. */}
        <RegisterCard y={18} label="Insurance" gating />
        <RegisterCard y={76} label="Pricing gate" gating />
        <RegisterCard y={134} label="References" />

        {/* Right column — award-criterion tabs. */}
        <CriterionTab y={44} label="Mandatory" hasGating />
        <CriterionTab y={122} label="Quality" />
      </svg>
    </div>
  );
}

function MobileGraphVisual() {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return <GraphVisual drawn={drawn} />;
}

function RegisterCard({
  y,
  label,
  gating = false,
}: {
  y: number;
  label: string;
  gating?: boolean;
}) {
  return (
    <g>
      <rect
        x={10}
        y={y}
        width={130}
        height={32}
        rx={5}
        fill="var(--color-paper-raised)"
        stroke={
          gating ? "var(--color-signal-oxblood-frame)" : "var(--color-hairline)"
        }
        strokeWidth={gating ? 2 : 1}
      />
      {gating && (
        <circle cx={24} cy={y + 16} r={4} fill="var(--color-signal-oxblood)" />
      )}
      <text
        x={gating ? 36 : 22}
        y={y + 20}
        className="font-sans"
        fontSize="11"
        fill="var(--color-ink)"
      >
        {label}
      </text>
    </g>
  );
}

function CriterionTab({
  y,
  label,
  hasGating = false,
}: {
  y: number;
  label: string;
  hasGating?: boolean;
}) {
  return (
    <g>
      <rect x={214} y={y} width={96} height={28} rx={5} fill="var(--color-ink)" />
      {hasGating && (
        <circle cx={226} cy={y + 14} r={3.5} fill="var(--color-signal-oxblood)" />
      )}
      <text
        x={hasGating ? 236 : 226}
        y={y + 18}
        className="font-mono"
        fontSize="10"
        fill="var(--color-paper)"
      >
        {label}
      </text>
    </g>
  );
}

/* -------------------------------------------------------------- layers ---- */

// Each layer is mounted once and derives a phase string from `step`. Movement
// between phases is class change only; entry/exit choreography lives in
// per-phase transition-delays. Layers share the frame (absolute inset-0) and
// centre their sheet.

const LAYER_BASE = "absolute inset-0 flex items-center justify-center will-change-transform";

function StageAmbient({ beat }: { beat: MotionValue<number> }) {
  const backgroundColor = useTransform(
    beat,
    [0, 1.4, 3.25, 5.35, STEPS.length],
    ["#f6f2e9", "#efe7d6", "#e8ebdd", "#d7dec9", "#16301f"],
  );
  return (
    <motion.div
      aria-hidden
      className="absolute inset-4 z-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(44,86,64,0.08)]"
      style={{ backgroundColor }}
    />
  );
}

function StageForestFrame({ beat }: { beat: MotionValue<number> }) {
  const foliageOpacity = useTransform(beat, [0, STEPS.length], [0.14, 0.32]);
  const vignetteOpacity = useTransform(beat, [0, STEPS.length], [0.08, 0.36]);
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-9 bottom-5 z-50 hidden text-forest sm:block"
        style={{ opacity: foliageOpacity }}
      >
        <FernFrond className="h-64 w-auto -rotate-12" />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-12 top-3 z-50 hidden text-forest md:block"
        style={{ opacity: foliageOpacity }}
      >
        <PineBranch className="h-36 w-auto rotate-12" />
      </motion.div>
      <motion.span
        aria-hidden
        className="stage-vignette pointer-events-none absolute inset-0 z-50 rounded-2xl"
        style={{ opacity: vignetteOpacity }}
      />
    </>
  );
}

// Steps 0–1. Full page at rest; scanned then receding as the register takes
// over (the 900ms delay hands over exactly as the scan bar finishes its pass).
function WallLayer({
  step,
  beat,
}: {
  step: number;
  beat: MotionValue<number>;
}) {
  const phase = step <= 0 ? "read" : "resolving";
  const opacity = useTransform(beat, [0, 1.45, 2], [1, 1, 0]);
  const y = useTransform(beat, [0, 1.1, 2], [0, -8, -32]);
  const scale = useTransform(beat, [0, 2], [1, 0.94]);
  return (
    <motion.div className={`${LAYER_BASE} z-10`} style={{ opacity, y, scale }}>
      <WallDocument phase={phase} />
    </motion.div>
  );
}

// Steps 1–3. ONE register, three beats: stagger in behind the receding wall,
// recede under the rising dossier (flare first — the 300ms container delay
// leaves the oxblood flash readable), return with the beads popping on.
function RegisterLayer({
  step,
  beat,
}: {
  step: number;
  beat: MotionValue<number>;
}) {
  const opacity = useTransform(
    beat,
    [0.55, 1, 1.85, 2.2, 2.75, 3, 3.65, 4],
    [0, 1, 1, 0.4, 0.45, 1, 1, 0],
  );
  const y = useTransform(
    beat,
    [0.55, 1, 2.2, 3, 4],
    [28, 0, 14, 0, -28],
  );
  const scale = useTransform(beat, [0.55, 1, 2.2, 3, 4], [0.98, 1, 0.98, 1, 0.98]);
  return (
    <motion.div className={`${LAYER_BASE} z-20`} style={{ opacity, y, scale }}>
      <div className="w-full max-w-[36rem]">
        <StageChrome url="bidframe.app/review">
          <div className="h-[28rem] overflow-hidden px-4 py-3">
            <div className="origin-top scale-[0.82]">
              <RegisterSheet step={step} beat={beat} rows={SAMPLE_EXTENDED} />
            </div>
          </div>
        </StageChrome>
      </div>
    </motion.div>
  );
}

function LiftProxy({ beat }: { beat: MotionValue<number> }) {
  const opacity = useTransform(beat, [1.72, 1.88, 2.18, 2.36], [0, 1, 1, 0]);
  const y = useTransform(beat, [1.78, 2.18], [118, -82]);
  const scale = useTransform(beat, [1.78, 2.18], [1, 1.28]);
  return (
    <motion.div
      aria-hidden
      className="surface-grain absolute left-1/2 top-1/2 z-[25] w-[min(27rem,82%)] rounded-md border-l-4 border-l-signal-oxblood border-y-hairline border-r-hairline bg-paper-raised px-4 py-3 shadow-[var(--depth-row)]"
      style={{ opacity, x: "-50%", y, scale }}
    >
      <p className="font-mono text-[10px] uppercase tracking-wide text-signal-oxblood">
        Deal-breaker
      </p>
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink">
        {SAMPLE_GATING[0]?.text}
      </p>
    </motion.div>
  );
}

// Step 2 — the poster moment. The dossier rises over the dimmed register at the
// widest slot; its two ledger lines write on after it lands (arbitrary variants
// reach GatingHero's <li>s — the component itself is untouched).
function DealBreakerLayer({
  step,
  beat,
}: {
  step: number;
  beat: MotionValue<number>;
}) {
  const phase = step < 2 ? "before" : step === 2 ? "in" : "after";
  const opacity = useTransform(beat, [1.55, 2, 2.85, 3.2], [0, 1, 1, 0]);
  const y = useTransform(beat, [1.55, 2, 3.2], [64, 0, -44]);
  const scale = useTransform(beat, [1.55, 2, 3.2], [0.9, 1, 0.98]);
  const cls =
    phase === "before"
      ? "[&_li]:opacity-0 [&_li]:translate-y-2"
      : phase === "in"
        ? "[&_li]:opacity-100 [&_li]:translate-y-0 [&_li]:transition-[opacity,transform] [&_li]:duration-[var(--motion-feature)] [&_li:nth-of-type(1)]:delay-[var(--motion-feature)] [&_li:nth-of-type(2)]:delay-[var(--motion-hero)]"
        : "[&_li]:opacity-100 [&_li]:translate-y-0";
  return (
    <motion.div
      className={`${LAYER_BASE} z-30 ${cls}`}
      style={{ opacity, y, scale }}
    >
      <div className="w-full max-w-[34rem]">
        <GatingHero requirements={SAMPLE_GATING} />
      </div>
    </motion.div>
  );
}

// Steps 4–5. The answer persists across both beats; the only change at step 5
// is the stamp mounting inside .stamp-emphasis (its one-shot settle + the
// typed audit line are pure CSS on mount).
function AnswerLayer({
  step,
  beat,
}: {
  step: number;
  beat: MotionValue<number>;
}) {
  const opacity = useTransform(beat, [3.55, 4, 5.85, 6.15], [0, 1, 1, 0]);
  const y = useTransform(beat, [3.55, 4, 6.15], [48, 0, -48]);
  return (
    <motion.div className={`${LAYER_BASE} z-20`} style={{ opacity, y }}>
      <div className="w-full max-w-[40rem]">
        <StageChrome url="bidframe.app/answers/iso-9001">
          <div className="relative grid min-h-[24rem] gap-4 p-4 md:grid-cols-[1.12fr_0.88fr]">
            <SourceThread beat={beat} />
            <div className="relative z-10 flex items-center">
              <AnswerCard withStamp={step >= 5} emphasis />
            </div>
            <div className="relative z-10 hidden md:block">
              <SourcePagePanel />
            </div>
          </div>
        </StageChrome>
      </div>
    </motion.div>
  );
}

// Step 6 (new) — a single beat, same shape as DealBreakerLayer: ramps in a
// beat early, holds, fades out into step 7 (the graph). Static end-state is
// CollaborationCard, which is just markup — nothing here depends on motion.
function CollaborationLayer({ beat }: { beat: MotionValue<number> }) {
  const opacity = useTransform(beat, [5.55, 6, 6.85, 7.2], [0, 1, 1, 0]);
  const y = useTransform(beat, [5.55, 6, 7.2], [44, 0, -34]);
  return (
    <motion.div className={`${LAYER_BASE} z-20`} style={{ opacity, y }}>
      <CollaborationCard />
    </motion.div>
  );
}

// Step 7. `drawn` is stateless (step >= 7): scrolling past flips the [data-draw]
// wrapper hidden→shown and the wires draw; scrolling back re-arms it (the
// un-draw is masked by the layer fading out). The attribute itself is always
// rendered — removing it once shown would snap the strokes.
function GraphLayer({ beat }: { beat: MotionValue<number> }) {
  const opacity = useTransform(beat, [6.55, 7, 7.55, 7.85], [0, 1, 1, 0]);
  const y = useTransform(beat, [6.55, 7, 7.85], [34, 0, -24]);
  return (
    <motion.div className={`${LAYER_BASE} z-20`} style={{ opacity, y }}>
      <div className="w-full max-w-[34rem]">
        <StageChrome url="bidframe.app/graph">
          <div className="pointer-events-none h-[22rem] select-none">
            <GraphView
              interactive={false}
              embedded
              chrome="min"
              filter={(r) => r.is_gating}
            />
          </div>
        </StageChrome>
      </div>
    </motion.div>
  );
}

function FinaleLayer({ beat }: { beat: MotionValue<number> }) {
  const opacity = useTransform(beat, [7.45, 7.85, STEPS.length], [0, 1, 1]);
  const washOpacity = useTransform(beat, [7.35, STEPS.length], [0, 1]);
  const stampScale = useTransform(beat, [7.55, STEPS.length], [1.6, 1]);
  const stampRotate = useTransform(beat, [7.55, STEPS.length], [-8, -3]);
  const stampY = useTransform(beat, [7.55, STEPS.length], [44, 0]);

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden rounded-2xl"
      style={{ opacity }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-pine"
        style={{ opacity: washOpacity }}
      />
      <motion.div
        className="finale-stamp relative z-10 flex aspect-[1.55/1] w-[min(34rem,82%)] items-center justify-center border-4 border-signal-oxblood bg-paper-raised/95 shadow-[var(--depth-sheet)]"
        style={{
          rotate: stampRotate,
          scale: stampScale,
          y: stampY,
        }}
      >
        <span className="font-mono text-5xl font-semibold uppercase tracking-[0.18em] text-signal-oxblood sm:text-7xl">
          Approved
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------- exports ---- */

// The composed FINAL state of one beat, for the stacked fallback (SSR, no-JS,
// reduced motion, mobile): found line lit, rows in, beads shown, stamp static
// (default settle, no emphasis), wires drawn. No choreography ever runs here.
export function BeatVisual({
  step,
  animate = false,
}: {
  step: number;
  animate?: boolean;
}) {
  switch (STEPS[step]?.stage) {
    case "wall":
      return <WallDocument phase={animate ? "resolving" : "composed"} />;
    case "rows":
      return animate ? (
        <RegisterSheet step={1} />
      ) : (
        <RegisterSheet step={step} composed />
      );
    case "dealbreaker":
      return (
        <div className="w-full max-w-[34rem]">
          <GatingHero
            requirements={SAMPLE_GATING}
            className={animate ? "mobile-dealbreaker-pop" : undefined}
          />
        </div>
      );
    case "honesty":
      return animate ? (
        <RegisterSheet step={3} />
      ) : (
        <RegisterSheet step={step} composed composedBeads />
      );
    case "answer":
      return <AnswerCard withStamp={false} />;
    case "approval":
      return <AnswerCard withStamp />;
    case "collaboration":
      return <CollaborationCard />;
    case "graph":
      return animate ? <MobileGraphVisual /> : <GraphVisual drawn />;
    default:
      return null;
  }
}

// The enhanced pinned stage: one persistent scene of five layers, each a pure
// function of `step`. Illustrative, so aria-hidden + inert.
export function ScrollyStage({
  step,
  beat,
}: {
  step: number;
  beat: MotionValue<number>;
}) {
  const [slam, setSlam] = useState(false);

  useEffect(() => {
    if (step !== STEPS.length) return;
    let timeout: number | undefined;
    const frame = requestAnimationFrame(() => {
      setSlam(true);
      timeout = window.setTimeout(() => setSlam(false), 280);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [step]);

  return (
    <div
      className="demo-stage-frame relative h-[min(36rem,calc(100vh-6rem))] w-full"
      data-slam={slam ? "true" : undefined}
      aria-hidden
      inert
    >
      <StageAmbient beat={beat} />
      <ExtractionThread beat={beat} />
      <ExtractionLedger beat={beat} />
      <WallLayer step={step} beat={beat} />
      <RegisterLayer step={step} beat={beat} />
      <LiftProxy beat={beat} />
      <DealBreakerLayer step={step} beat={beat} />
      <AnswerLayer step={step} beat={beat} />
      <CollaborationLayer beat={beat} />
      <GraphLayer beat={beat} />
      <FinaleLayer beat={beat} />
      <StageForestFrame beat={beat} />
      <GhostCursor beat={beat} />
    </div>
  );
}
