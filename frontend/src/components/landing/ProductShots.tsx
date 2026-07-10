// Three product shots for the landing page: a priority queue, a traceable source
// view, and an answer approval workflow. The layouts are landing-specific staging
// (the gallery frame, the split source view), but the STATE GRAMMAR is composed
// from the real app components — the confidence stamp, the answer-state badge,
// the category tag, and the approval stamp — so the page can never drift from the
// product it is selling. They stay static/inert (no context, no interaction).

import { ApprovalStamp } from "@/components/ApprovalStamp";
import { AnswerStateBadge } from "@/components/AnswerStateBadge";
import { CategoryTag } from "@/components/CategoryTag";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";

export function ProductGalleryFrame({
  children,
  label,
  tone = "default",
}: {
  children: React.ReactNode;
  label: string;
  tone?: "default" | "alert" | "source" | "answer";
}) {
  const toneClass =
    tone === "alert"
      ? "forest-product-object-alert"
      : tone === "source"
        ? "forest-product-object-source"
        : tone === "answer"
          ? "forest-product-object-answer"
          : "";

  return (
    <div className={`forest-product-object ${toneClass}`}>
      <span className="forest-product-object__plate" aria-hidden />
      <div className="forest-product-object__label">
        <span>{label}</span>
        <span>live UI</span>
      </div>
      <div className="forest-product-object__card">{children}</div>
    </div>
  );
}

// The deal-breaker: a priority panel with one selected gate lifted above the
// normal requirements, so "first" is visible before the prose explains it.
export function DealBreakerCard() {
  return (
    <div className="card-live surface-grain w-full min-w-0 overflow-hidden rounded-lg border border-hairline bg-paper-raised shadow-[var(--depth-sheet)]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-hairline bg-paper px-4 py-3 sm:px-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Priority register
        </span>
        <span className="rounded-sm border border-signal-oxblood-frame/35 bg-paper-raised px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-signal-oxblood">
          surfaced first
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="rounded-md border border-signal-oxblood-frame/35 bg-paper shadow-[var(--depth-row)]">
          <div className="border-l-[3px] border-signal-oxblood-frame px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="font-mono text-xs font-medium uppercase tracking-wide text-signal-oxblood">
                Deal-breaker
              </p>
              <span className="font-mono text-[11px] text-ink-muted">
                p.14 / Section 4.2.1
              </span>
            </div>
            <p className="mt-3 text-base leading-snug text-ink sm:text-lg">
              The supplier must hold ISO 9001 certification for the full
              contract term.
            </p>
            <p className="mt-3 border-t border-hairline pt-3 font-mono text-xs leading-relaxed text-signal-oxblood">
              Miss it and the bid is rejected.
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-hairline rounded-md border border-hairline bg-paper/60">
          <PriorityRow
            refLabel="4.2.2"
            label="Public liability insurance"
            confidence={0.62}
          />
          <PriorityRow
            refLabel="6.1"
            label="TUPE schedule acknowledged"
            confidence={0.9}
          />
        </div>
      </div>
    </div>
  );
}

// A normal (non-gating) requirement row under the deal-breaker. The confidence
// mark is the real app component, so the four-tier grammar (and its greyscale-safe
// dot) matches the matrix exactly.
function PriorityRow({
  refLabel,
  label,
  confidence,
}: {
  refLabel: string;
  label: string;
  confidence: number;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-3 text-sm sm:grid-cols-[58px_minmax(0,1fr)_auto] sm:gap-3 sm:px-4">
      <span className="font-mono text-[11px] text-ink-muted">{refLabel}</span>
      <span className="truncate text-ink-muted">{label}</span>
      <ConfidenceIndicator confidence={confidence} variant="dot" size="sm" />
    </div>
  );
}

// The clause: a traceability view with a selected requirement and a source
// drawer. The page and clause numbers sit in the margin, not as decoration.
export function ClauseCard() {
  return (
    <div className="card-live surface-grain w-full min-w-0 overflow-hidden rounded-lg border border-hairline bg-paper-raised shadow-[var(--depth-sheet)]">
      <div className="grid grid-cols-[56px_minmax(0,1fr)] border-b border-hairline bg-paper sm:grid-cols-[72px_minmax(0,1fr)]">
        <div className="border-r border-hairline px-3 py-3 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-accent sm:px-4 sm:text-[11px] sm:tracking-[0.12em]">
          Source
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-3 sm:px-4">
          <span className="min-w-0 font-mono text-[11px] text-ink-muted">
            clicked from requirement row
          </span>
          <span className="font-mono text-[11px] text-accent">open clause</span>
        </div>
      </div>

      <div className="grid min-w-0 gap-0 md:grid-cols-[72px_1fr]">
        <div className="border-b border-hairline px-4 py-3 text-left font-mono text-xs leading-relaxed text-accent md:border-r md:border-b-0 md:py-5 md:text-right">
          4.2.1
          <br />
          p.14
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <div className="rounded-md border border-accent/25 bg-accent-soft/55 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
              Requirement
            </p>
            <p className="mt-2 text-base leading-snug text-ink sm:text-lg">
              The supplier must hold ISO 9001 certification.
            </p>
          </div>

          <div className="mx-8 h-5 border-l border-accent/45" aria-hidden />

          <div className="rounded-md bg-paper-recessed p-4 shadow-[var(--depth-pressed)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              Tender excerpt
            </p>
            <p className="mt-2 border-l-2 border-accent pl-4 font-mono text-xs leading-relaxed text-ink-muted">
              &ldquo;Tenderers shall hold and maintain certification to ISO 9001
              for the duration of the contract.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// The answer: a drafted response from your documents, with a receipt attached
// before the approval stamp. It reads as a workflow, not a static quote.
export function AnswerCard() {
  return (
    <div className="card-live surface-grain w-full min-w-0 overflow-hidden rounded-lg border border-hairline bg-paper-raised shadow-[var(--depth-sheet)]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-hairline bg-paper px-4 py-3 sm:px-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Answer workspace
        </span>
        {/* The real answer-state badge — same component the /answers panel uses. */}
        <AnswerStateBadge state="auto" />
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-2 rounded-md border border-hairline bg-paper/70 p-4">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              Requirement
            </p>
            <CategoryTag category="Quality" />
          </div>
          <p className="text-base leading-snug text-ink sm:text-lg">
            The supplier must hold ISO 9001 certification.
          </p>
        </div>

        <div className="mt-4 rounded-md border-l-2 border-forest bg-paper p-4 shadow-[var(--depth-row)]">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-forest">
              Draft answer
            </p>
            <span className="font-mono text-[11px] text-ink-muted">line 1 of 1</span>
          </div>
          <p className="mt-3 leading-relaxed text-ink">
            We hold ISO 9001:2015, certified by a UKAS-accredited body, valid
            for the full contract term.
          </p>
          <div className="mt-4 rounded-sm border border-accent/25 bg-accent-soft/60 px-3 py-2">
            <p className="font-mono text-xs leading-relaxed text-accent">
              Receipt: Capability Statement, p.4. Matched to ISO 9001:2015
              certificate record.
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-hairline pt-5">
          <ApprovalStamp />
        </div>
      </div>
    </div>
  );
}
