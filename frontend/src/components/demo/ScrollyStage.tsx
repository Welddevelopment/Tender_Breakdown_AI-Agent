import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { ApprovalStamp } from "@/components/ApprovalStamp";
import { SAMPLE, SAMPLE_GATING, SAMPLE_ANSWERED } from "./sample";
import { STEPS } from "./steps";

// The pinned "stage" for the /demo cinematic scroll. It holds one product visual
// that transforms through the beats: as the narrative steps scroll past, the
// active beat's visual is shown and the others fade out. Each beat is a single,
// self-contained element built from the sample data, styled in the Civic Record
// language (paper grid, grainy raised sheets, oxblood status edges, forest answer
// edges) and reusing the REAL ConfidenceIndicator and ApprovalStamp components,
// so the whole stage is illustrative only — aria-hidden, with the narrative copy
// as the a11y source of truth. Depth means focus: only the deal-breaker card
// lifts; the scanning rows stay quiet.

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

// A short, realistic clause reference in the mono record voice.
function clauseRef(page: number, clause: string | null) {
  return `p.${page}${clause ? ` · ${clause}` : ""}`;
}

// Beat 1 — a dense, faint wall of tender prose. The disqualifier hides in plain
// sight: one line carries a quiet oxblood tick, indistinguishable at a glance.
function WallVisual() {
  // Deterministic bar widths (no Math.random — it is unavailable and would break
  // SSR/hydration); grouped into three paragraphs of "unreadable body text".
  const paras = [
    [96, 88, 92, 70],
    [90, 84, 78, 94, 60],
    [86, 92, 74, 88],
  ];
  return (
    <div className="w-full max-w-[30rem] rounded-lg border border-hairline bg-paper-recessed p-6 shadow-[var(--depth-pressed)]">
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        One tender · 96 pages
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {paras.map((para, pi) => (
          <div key={pi} className="flex flex-col gap-2">
            {para.map((w, li) => {
              // The single deal-breaker line, lost among the rest.
              const isCatch = pi === 1 && li === 2;
              return (
                <span
                  key={li}
                  className={`h-2 rounded-full ${
                    isCatch ? "bg-signal-oxblood/30" : "bg-ink/10"
                  }`}
                  style={{ width: `${w}%` }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// A single quiet requirement row (the scanning matrix): clause ref, text, and an
// optional confidence bead. No grain, no lift — depth is reserved for the card.
function Row({
  text,
  page,
  clause,
  confidence,
  needsReview,
  withBead,
}: {
  text: string;
  page: number;
  clause: string | null;
  confidence: number;
  needsReview: boolean;
  withBead: boolean;
}) {
  return (
    <li
      className={`grid items-start gap-x-3 border-b border-hairline py-2.5 last:border-0 ${
        withBead ? "grid-cols-[auto_1fr]" : "grid-cols-[1fr]"
      }`}
    >
      {withBead && (
        <span className="mt-0.5">
          <ConfidenceIndicator
            confidence={confidence}
            needsReview={needsReview}
            variant="dot"
            size="sm"
          />
        </span>
      )}
      <p className="text-sm leading-snug text-ink">
        {text}
        <span className="ml-2 font-mono text-[11px] text-ink-muted">
          {clauseRef(page, clause)}
        </span>
      </p>
    </li>
  );
}

// Beats 2 & 4 — the triaged requirement list. Beat 2 shows quiet rows; beat 4
// lets the confidence beads arrive (the low-confidence, flagged row reads amber).
function RowsVisual({ withBeads }: { withBeads: boolean }) {
  return (
    <div className="w-full max-w-[32rem] rounded-lg border border-hairline bg-paper-raised p-5 shadow-[var(--depth-row)]">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        {withBeads ? "Read, with confidence shown" : "Every requirement, pulled out"}
      </p>
      <ul>
        {SAMPLE.map((r) => (
          <Row
            key={r.id}
            text={r.text}
            page={r.source_page}
            clause={r.source_clause}
            confidence={r.confidence}
            needsReview={r.needs_review}
            withBead={withBeads}
          />
        ))}
      </ul>
    </div>
  );
}

// Beat 3 — the deal-breaker card. The one element that lifts: a grainy raised
// sheet with a deep oxblood-frame reading edge and bright oxblood alarm dots.
// Matches the real GatingHero exactly (same classes), driven by the sample gates.
function DealBreakerVisual() {
  const n = SAMPLE_GATING.length;
  return (
    <section className="surface-grain w-full max-w-[32rem] rounded-r-lg border-y border-r border-hairline border-l-[3px] border-l-signal-oxblood-frame bg-paper-raised p-5 shadow-[var(--depth-sheet)]">
      <p className="font-mono text-xs font-medium uppercase tracking-wide text-signal-oxblood">
        Deal-breaker{n !== 1 ? "s" : ""}
      </p>
      <h2 className="mt-2 font-serif text-lg font-semibold leading-snug text-ink">
        {n} requirement{n !== 1 ? "s" : ""} that would disqualify the bid if
        missed
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {SAMPLE_GATING.map((req) => (
          <li
            key={req.id}
            className="grid grid-cols-[auto_1fr] items-start gap-x-2.5 text-sm text-ink"
          >
            <span
              className="mt-[5px] h-[11px] w-[11px] shrink-0 rounded-full bg-signal-oxblood shadow-[0_0_0_1px_rgba(33,29,23,0.5),inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(33,29,23,0.3)]"
              aria-hidden
            />
            <span className="leading-snug">
              {req.text}
              <span className="ml-2 font-mono text-xs text-ink-muted">
                {clauseRef(req.source_page, req.source_clause)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Beats 5 & 6 — the grounded answer with its receipt (forest reading edge + the
// mono citation line), and the approval stamp settling on when you sign it off.
function AnswerVisual({ withStamp }: { withStamp: boolean }) {
  const req = SAMPLE_ANSWERED;
  const answer = req.answer;
  return (
    <div className="surface-grain w-full max-w-[32rem] rounded-lg border border-hairline bg-paper-raised p-5 shadow-[var(--depth-row)]">
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
      <div
        className={`mt-4 transition-opacity duration-500 ${EASE} ${
          withStamp ? "opacity-100" : "opacity-0"
        }`}
      >
        {withStamp ? (
          <ApprovalStamp />
        ) : (
          // Reserve the row height so the stamp settles in without a jump.
          <span className="block h-6" aria-hidden />
        )}
      </div>
    </div>
  );
}

// Beat 7 — a lightweight relationship map. Requirement register-cards on the
// left wire to the award criteria that score them; the gating card and its
// wiring stay lit oxblood, and a dashed forest line marks a dependency. A
// schematic nod to the real GraphView, kept cheap so the pinned stage stays calm.
function GraphVisual() {
  return (
    <div className="w-full max-w-[32rem] rounded-lg border border-hairline bg-paper-recessed p-5 shadow-[var(--depth-pressed)]">
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
        {/* gating requirement -> criterion 1 (oxblood) */}
        <path
          d="M140 34 C 178 34, 182 58, 214 58"
          fill="none"
          stroke="var(--color-signal-oxblood)"
          strokeWidth="1.6"
        />
        {/* second requirement -> criterion 1 */}
        <path
          d="M140 92 C 180 92, 184 66, 214 66"
          fill="none"
          stroke="var(--color-forest)"
          strokeWidth="1.4"
          opacity="0.7"
        />
        {/* third requirement -> criterion 2 */}
        <path
          d="M140 150 C 180 150, 186 136, 214 136"
          fill="none"
          stroke="var(--color-forest)"
          strokeWidth="1.4"
          opacity="0.7"
        />
        {/* dependency between two requirements (dashed forest) */}
        <path
          d="M40 52 C 20 68, 20 76, 40 92"
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
        stroke={gating ? "var(--color-signal-oxblood-frame)" : "var(--color-hairline)"}
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
      <rect
        x={214}
        y={y}
        width={96}
        height={28}
        rx={5}
        fill="var(--color-ink)"
      />
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

// The single beat visual for a step index. Reused by both render paths: the
// enhanced pinned stage stacks all of these and cross-fades to the active one;
// the stacked fallback renders each inline beneath its narrative step.
export function BeatVisual({ step }: { step: number }) {
  switch (STEPS[step]?.stage) {
    case "wall":
      return <WallVisual />;
    case "rows":
      return <RowsVisual withBeads={false} />;
    case "dealbreaker":
      return <DealBreakerVisual />;
    case "honesty":
      return <RowsVisual withBeads />;
    case "answer":
      return <AnswerVisual withStamp={false} />;
    case "approval":
      return <AnswerVisual withStamp />;
    case "graph":
      return <GraphVisual />;
    default:
      return null;
  }
}

// The enhanced pinned stage: every beat rendered absolutely in one fixed frame,
// only the active one lifted into view. Illustrative, so aria-hidden.
export function ScrollyStage({ step }: { step: number }) {
  return (
    <div
      className="relative flex h-[26rem] w-full items-center justify-center"
      aria-hidden
    >
      {STEPS.map((s, i) => {
        const active = i === step;
        return (
          <div
            key={s.id}
            className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-700 ${EASE} ${
              active
                ? "opacity-100 translate-y-0"
                : "pointer-events-none translate-y-3 opacity-0"
            }`}
          >
            <BeatVisual step={i} />
          </div>
        );
      })}
    </div>
  );
}
