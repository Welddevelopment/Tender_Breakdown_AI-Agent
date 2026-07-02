import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { ApprovalStamp } from "@/components/ApprovalStamp";
import { GatingHero } from "@/components/GatingHero";
import { CategoryTag } from "@/components/CategoryTag";
import {
  SAMPLE,
  SAMPLE_GATING,
  SAMPLE_ANSWERED,
  DEMO_FACTS,
  WALL_PARAGRAPHS,
} from "./sample";
import { STEPS } from "./steps";

// The pinned "stage" for the /demo cinematic scroll — a persistent scene, not a
// slideshow. Five layers are mounted ONCE and each derives a phase from the
// active step (pure functions of `step`: no effects, no state, no timers), so
// scrolling transforms one continuous scene: the document wall is scanned and
// resolves into the requirement register, the two gating rows flare and compose
// into the deal-breaker dossier, confidence beads pop onto the SAME rows, the
// answer earns its stamp, and the relationship map draws itself on. All
// sequencing is CSS transition-delays and one-shot animations on class change.
// The stage is illustrative only (aria-hidden + inert); the narrative copy is
// the a11y source of truth. BeatVisual renders the composed FINAL state of each
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
                    className={`rounded-[2px] px-0.5 [box-decoration-break:clone] transition-colors duration-500 ${
                      lit
                        ? "bg-signal-oxblood/15 text-signal-oxblood delay-500"
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

function ExtractionThread({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden
      className={`extraction-thread pointer-events-none absolute inset-0 h-full w-full text-accent/55 transition-opacity duration-500 ${
        active ? "opacity-100 delay-[450ms]" : "opacity-0 delay-0"
      }`}
      viewBox="0 0 520 420"
      preserveAspectRatio="none"
    >
      <path
        d="M72 146 C 180 122, 224 120, 286 134 S 406 154, 470 122"
        fill="none"
        pathLength={1}
        stroke="currentColor"
        strokeDasharray="1"
        strokeWidth="1.4"
      />
      <path
        d="M84 190 C 190 198, 226 190, 292 198 S 408 218, 474 208"
        fill="none"
        opacity="0.7"
        pathLength={1}
        stroke="currentColor"
        strokeDasharray="1"
        strokeWidth="1"
      />
    </svg>
  );
}

function ExtractionLedger({ active }: { active: boolean }) {
  return (
    <div
      className={`extraction-ledger absolute right-3 top-5 hidden w-36 rounded-md border border-hairline bg-paper-raised p-3 font-mono text-[9px] uppercase tracking-[0.11em] text-ink-muted shadow-[var(--depth-row)] transition-[opacity,transform] duration-500 lg:block ${
        active
          ? "translate-x-0 opacity-100 delay-[1050ms]"
          : "translate-x-4 opacity-0 delay-0"
      }`}
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
    </div>
  );
}

/* ------------------------------------------------------------ register ---- */

// A single requirement row of the register. The bead (real segmented
// ConfidenceIndicator) is ALWAYS mounted so row heights never jump — it pops in
// (opacity/scale, origin-left) when the honesty beat arrives. The oxblood flare
// on the gating rows is a colour transition on an always-present left rule, so
// nothing reflows when they light up.
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
}: {
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
}) {
  return (
    <li
      key={index}
      className={`flex flex-col gap-1.5 border-b border-l-2 border-b-hairline py-2.5 pl-3 transition-[opacity,transform,border-color,background-color] duration-500 ${EASE} last:border-b-0 ${
        flare && isGating
          ? "border-l-signal-oxblood bg-signal-oxblood/10"
          : "border-l-transparent bg-transparent"
      } ${rowShown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
      style={{ transitionDelay: `${rowDelayMs}ms` }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <CategoryTag category={category} />
        <span
          className={`inline-flex origin-left transition-[opacity,transform] duration-500 ${EASE} ${
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
    </li>
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
}: {
  step: number;
  composed?: boolean;
  composedBeads?: boolean;
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
          ? `Read, with confidence shown · five of ${DEMO_FACTS.requirements}`
          : `Every requirement, pulled out · five of ${DEMO_FACTS.requirements} shown`}
      </p>
      <ul>
        {SAMPLE.map((r, i) => (
          <Row
            key={r.id}
            index={i}
            text={r.text}
            page={r.source_page}
            clause={r.source_clause}
            category={r.category}
            confidence={r.confidence}
            needsReview={r.needs_review}
            isGating={r.is_gating}
            rowShown={rowsShown}
            rowDelayMs={staggerRows ? 900 + i * 90 : 0}
            flare={flare}
            beadShown={beadsShown}
            beadDelayMs={popBeads ? 400 + i * 80 : 0}
          />
        ))}
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
          Backed by your Capability Statement, p.
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

/* --------------------------------------------------------------- graph ---- */

// Beat 7 — a lightweight relationship map. Requirement register-cards on the
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
          className={`transition-opacity duration-500 ${
            drawn ? "opacity-100 delay-[450ms]" : "opacity-0 delay-0"
          }`}
          fill="none"
          stroke="var(--color-forest)"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />

        {/* Left column — requirement register cards. */}
        <RegisterCard y={18} label="ISO 9001" gating />
        <RegisterCard y={76} label="Cyber Ess.+" gating />
        <RegisterCard y={134} label="Case studies" />

        {/* Right column — award-criterion tabs. */}
        <CriterionTab y={44} label="Criterion 1" hasGating />
        <CriterionTab y={122} label="Criterion 2" />
      </svg>
    </div>
  );
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

const LAYER_BASE = `absolute inset-0 flex items-center justify-center transition-[opacity,transform] ${EASE}`;

// Steps 0–1. Full page at rest; scanned then receding as the register takes
// over (the 900ms delay hands over exactly as the scan bar finishes its pass).
function WallLayer({ step }: { step: number }) {
  const phase = step <= 0 ? "read" : step === 1 ? "resolving" : "gone";
  const cls =
    phase === "read"
      ? "opacity-100 translate-y-0 scale-100 duration-700 delay-0"
      : phase === "resolving"
        ? "opacity-0 -translate-y-3 scale-[0.97] duration-700 delay-[900ms]"
        : "opacity-0 -translate-y-3 scale-[0.97] duration-500 delay-0";
  return (
    <div className={`${LAYER_BASE} z-10 ${cls}`}>
      <WallDocument phase={phase === "gone" ? "resolving" : phase} />
    </div>
  );
}

// Steps 1–3. ONE register, three beats: stagger in behind the receding wall,
// recede under the rising dossier (flare first — the 300ms container delay
// leaves the oxblood flash readable), return with the beads popping on.
function RegisterLayer({ step }: { step: number }) {
  const phase =
    step < 1
      ? "before"
      : step === 1
        ? "resolve"
        : step === 2
          ? "recede"
          : step === 3
            ? "beads"
            : "after";
  const cls =
    phase === "before"
      ? "opacity-0 translate-y-4 scale-100 duration-500 delay-0"
      : phase === "resolve"
        ? "opacity-100 translate-y-0 scale-100 duration-500 delay-[900ms]"
        : phase === "recede"
          ? "opacity-40 translate-y-3 scale-[0.98] duration-700 delay-300"
          : phase === "beads"
            ? "opacity-100 translate-y-0 scale-100 duration-700 delay-200"
            : "opacity-0 -translate-y-6 scale-100 duration-500 delay-0";
  return (
    <div className={`${LAYER_BASE} z-20 ${cls}`}>
      <RegisterSheet step={step} />
    </div>
  );
}

// Step 2 — the poster moment. The dossier rises over the dimmed register at the
// widest slot; its two ledger lines write on after it lands (arbitrary variants
// reach GatingHero's <li>s — the component itself is untouched).
function DealBreakerLayer({ step }: { step: number }) {
  const phase = step < 2 ? "before" : step === 2 ? "in" : "after";
  const cls =
    phase === "before"
      ? "opacity-0 translate-y-8 scale-[0.96] duration-700 delay-0 [&_li]:opacity-0 [&_li]:translate-y-2"
      : phase === "in"
        ? "opacity-100 translate-y-0 scale-100 duration-700 delay-[350ms] [&_li]:opacity-100 [&_li]:translate-y-0 [&_li]:transition-[opacity,transform] [&_li]:duration-500 [&_li:nth-of-type(1)]:delay-[550ms] [&_li:nth-of-type(2)]:delay-[700ms]"
        : "opacity-0 -translate-y-8 scale-[0.98] duration-500 delay-0 [&_li]:opacity-100 [&_li]:translate-y-0";
  return (
    <div className={`${LAYER_BASE} z-30 ${cls}`}>
      <div className="w-full max-w-[34rem]">
        <GatingHero requirements={SAMPLE_GATING} />
      </div>
    </div>
  );
}

// Steps 4–5. The answer persists across both beats; the only change at step 5
// is the stamp mounting inside .stamp-emphasis (its one-shot settle + the
// typed audit line are pure CSS on mount).
function AnswerLayer({ step }: { step: number }) {
  const phase = step < 4 ? "before" : step <= 5 ? "in" : "after";
  const cls =
    phase === "before"
      ? "opacity-0 translate-y-6 duration-700 delay-0"
      : phase === "in"
        ? "opacity-100 translate-y-0 duration-700 delay-150"
        : "opacity-0 -translate-y-6 duration-500 delay-0";
  return (
    <div className={`${LAYER_BASE} z-20 ${cls}`}>
      <AnswerCard withStamp={step >= 5} emphasis />
    </div>
  );
}

// Step 6. `drawn` is stateless (step >= 6): scrolling past flips the [data-draw]
// wrapper hidden→shown and the wires draw; scrolling back re-arms it (the
// un-draw is masked by the layer fading out). The attribute itself is always
// rendered — removing it once shown would snap the strokes.
function GraphLayer({ step }: { step: number }) {
  const phase = step < 6 ? "before" : "in";
  const cls =
    phase === "before"
      ? "opacity-0 translate-y-6 duration-700 delay-0"
      : "opacity-100 translate-y-0 duration-700 delay-150";
  return (
    <div className={`${LAYER_BASE} z-20 ${cls}`}>
      <GraphVisual drawn={step >= 6} />
    </div>
  );
}

/* ------------------------------------------------------------- exports ---- */

// The composed FINAL state of one beat, for the stacked fallback (SSR, no-JS,
// reduced motion, mobile): found line lit, rows in, beads shown, stamp static
// (default settle, no emphasis), wires drawn. No choreography ever runs here.
export function BeatVisual({ step }: { step: number }) {
  switch (STEPS[step]?.stage) {
    case "wall":
      return <WallDocument phase="composed" />;
    case "rows":
      return <RegisterSheet step={step} composed />;
    case "dealbreaker":
      return (
        <div className="w-full max-w-[34rem]">
          <GatingHero requirements={SAMPLE_GATING} />
        </div>
      );
    case "honesty":
      return <RegisterSheet step={step} composed composedBeads />;
    case "answer":
      return <AnswerCard withStamp={false} />;
    case "approval":
      return <AnswerCard withStamp />;
    case "graph":
      return <GraphVisual drawn />;
    default:
      return null;
  }
}

// The enhanced pinned stage: one persistent scene of five layers, each a pure
// function of `step`. Illustrative, so aria-hidden + inert.
export function ScrollyStage({ step }: { step: number }) {
  return (
    <div
      className="demo-stage-frame relative h-[min(36rem,calc(100vh-6rem))] w-full"
      aria-hidden
      inert
    >
      <ExtractionThread active={step === 1} />
      <ExtractionLedger active={step === 1} />
      <WallLayer step={step} />
      <RegisterLayer step={step} />
      <DealBreakerLayer step={step} />
      <AnswerLayer step={step} />
      <GraphLayer step={step} />
    </div>
  );
}
