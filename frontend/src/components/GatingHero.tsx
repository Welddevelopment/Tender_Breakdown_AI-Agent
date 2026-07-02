"use client";

import { useRequirements } from "@/context/RequirementsContext";
import { alsoCitedLabel, collapseDuplicates } from "@/lib/dedupe";
import type { Requirement } from "@/types/requirement";

// The deal-breaker dossier (layout.md sections 3, 7; design-language). The one
// element that carries real alarm, so it is the one place bold signal colour is
// earned: an oxblood header bar, a "would be rejected" stamp that mirrors the
// forest approval stamp (the two decisions are a matched pair), each disqualifier
// set as a ruled dossier line with its clause citation in the mono margin, over a
// faint oxblood wash. Depth means focus, so this lifts above the matrix.
// Conditional on gating items.
//
// The recall-first extractor emits the same disqualifier several times (the SPSO
// 06/11/2013 deadline alone appears on multiple rows). We collapse near-duplicates
// for display via collapseDuplicates so the dossier shows the TRUE unique
// deal-breakers and an honest count, nothing is dropped, each surviving line notes
// the other pages the same requirement was cited on. See lib/dedupe.ts.

// The rejection stamp: the oxblood counterpart to ApprovalStamp, set slightly
// off-axis the way an officer stamps a form. Shape and word carry it, so it reads
// with colour switched off.
function RejectionStamp() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border-2 border-signal-oxblood-frame px-2.5 py-1 text-signal-oxblood [transform:rotate(-3deg)]"
      aria-hidden="true"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-mono text-[11px] font-medium uppercase tracking-wide">
        Would be rejected
      </span>
    </span>
  );
}

export function GatingHero({
  onSelect,
  requirements,
}: {
  onSelect?: (id: string) => void;
  requirements?: Requirement[];
}) {
  const ctx = useRequirements();
  const source = requirements ?? ctx.requirements;
  const { representatives: gating, meta } = collapseDuplicates(
    source.filter((r) => r.is_gating)
  );

  if (gating.length === 0) {
    return null;
  }

  const many = gating.length !== 1;

  return (
    <section className="surface-grain overflow-hidden rounded-lg border border-signal-oxblood-frame bg-[color-mix(in_oklab,var(--color-signal-oxblood)_5%,var(--color-paper-raised))] shadow-[var(--depth-sheet)]">
      {/* The oxblood header bar: the earned bold colour. */}
      <div className="flex items-center gap-2 bg-signal-oxblood px-5 py-2 text-paper">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M10 2.6 18 16.5H2Z"
            fill="currentColor"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <rect x="9.1" y="7.2" width="1.8" height="5" rx="0.9" fill="var(--color-signal-oxblood)" />
          <circle cx="10" cy="14.4" r="1.05" fill="var(--color-signal-oxblood)" />
        </svg>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em]">
          Deal-breaker{many ? "s" : ""}
        </p>
      </div>

      <div className="p-5">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <h2 className="font-serif text-lg font-semibold leading-snug text-ink">
            {gating.length} requirement{many ? "s" : ""} that would disqualify
            the bid if missed
          </h2>
          <RejectionStamp />
        </div>

        <ul className="mt-4 flex flex-col">
          {gating.map((req, i) => {
            const alsoOn = alsoCitedLabel(meta.get(req.id)?.alsoCitedOn ?? []);
            return (
              <li
                key={req.id}
                className={`grid grid-cols-[auto_1fr] items-start gap-x-3 py-3 ${
                  i > 0 ? "border-t border-signal-oxblood-frame/20" : ""
                }`}
              >
                {/* The ledger index, in the mono record voice. */}
                <span className="pt-0.5 font-mono text-xs font-medium text-signal-oxblood">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => onSelect?.(req.id)}
                  className={`text-left text-sm leading-snug text-ink ${
                    onSelect ? "transition-colors hover:text-forest" : ""
                  }`}
                >
                  <span className={onSelect ? "hover:underline" : ""}>
                    {req.text}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-ink-muted">
                    p.{req.source_page}
                    {req.source_clause ? ` · ${req.source_clause}` : ""}
                    {alsoOn ? ` · ${alsoOn}` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* The track record, in the mono record voice. A measured benchmark, not
            a claim about the tender on screen: it backs the catch above. The
            numbers are the locked, honest ones (demo-narrative.md). */}
        <p className="mt-4 border-t border-hairline pt-3 font-mono text-xs leading-relaxed text-ink-muted">
          Measured on a real public-sector tender, Bidframe caught every
          deal-breaker and flagged the rest for you.
        </p>
      </div>
    </section>
  );
}
