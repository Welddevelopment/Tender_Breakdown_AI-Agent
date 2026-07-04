"use client";

import { useMemo } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import { deriveTriage } from "@/lib/triage";

// Live decision tally for the demo shell: short enough to sit above the matrix,
// but still explicit that every approval, edit, and flag is human-owned.
export function ControlPanel() {
  const { requirements } = useRequirements();

  const s = useMemo(() => {
    const openQ = requirements.reduce(
      (n, r) => n + (r.open_questions?.filter((q) => !q.answer).length ?? 0),
      0
    );
    const accepted = requirements.filter((r) => r.status === "accepted").length;
    const edited = requirements.filter(
      (r) => r.status === "edited" || r.answer?.state === "human_edited"
    ).length;
    const flagged = requirements.filter((r) => r.status === "flagged").length;
    // What Bidframe found — the same triage the matrix groups use, so these
    // headline counts can never disagree with the register below.
    const triage = deriveTriage(requirements);
    return {
      total: requirements.length,
      dealBreakers: requirements.filter((r) => r.is_gating).length,
      toVerify: triage.counts["to-verify"],
      needsYou: triage.counts["needs-you"],
      openQ,
      accepted,
      edited,
      flagged,
      decided: accepted + edited + flagged,
    };
  }, [requirements]);

  return (
    <section
      aria-label="How Bidframe keeps you in control"
      className="surface-grain border-b border-hairline bg-paper-raised/75 px-6 py-3 shadow-[var(--depth-row)]"
    >
      <div className="mx-auto max-w-6xl">
        {/* What Bidframe found — the headline read of the tender, above the
            human decision log. Deal-breakers carry the one earned alarm colour. */}
        <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-hairline/90 bg-paper/80 px-4 py-3 text-sm shadow-[var(--depth-pressed)] sm:grid-cols-4">
          <div>
            <dt className="text-ink-muted">Requirements found</dt>
            <dd className="mt-0.5 font-mono text-xl leading-none text-ink">
              {s.total}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Deal-breakers</dt>
            <dd className="mt-0.5 font-mono text-xl leading-none text-signal-oxblood">
              {s.dealBreakers}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Need verification</dt>
            <dd className="mt-0.5 font-mono text-xl leading-none text-ink">
              {s.toVerify}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Need your input</dt>
            <dd className="mt-0.5 font-mono text-xl leading-none text-ink">
              {s.needsYou}
            </dd>
          </div>
        </dl>
        <aside className="grid gap-3 rounded-md border border-hairline/90 bg-paper/80 px-4 py-3 shadow-[var(--depth-pressed)] lg:grid-cols-[9rem_minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
          <div className="flex items-baseline justify-between gap-3 border-b border-hairline/70 pb-2 lg:block lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Decision log
            </p>
            <span className="font-mono text-xs tabular-nums text-ink lg:mt-1 lg:block">
              {s.decided}/{s.total}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-ink-muted">Approved by user</dt>
              <dd className="mt-0.5 font-mono text-lg leading-none text-ink">
                {s.accepted}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Edited by user</dt>
              <dd className="mt-0.5 font-mono text-lg leading-none text-ink">
                {s.edited}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Flagged for colleague</dt>
              <dd className="mt-0.5 font-mono text-lg leading-none text-ink">
                {s.flagged}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Questions remaining</dt>
              <dd className="mt-0.5 font-mono text-lg leading-none text-ink">
                {s.openQ}
              </dd>
            </div>
          </dl>
          <p className="border-t border-hairline/70 pt-2 text-sm leading-relaxed text-ink-muted lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            {s.decided === 0 ? (
              <>
                <span className="font-mono text-ink">0 approved</span> - every
                line is pending <span className="text-forest">your</span> review.
              </>
            ) : (
              <>
                <span className="font-mono text-ink">{s.decided}</span> decided
                by you ({s.accepted} approved · {s.edited} edited · {s.flagged}{" "}
                flagged) · {s.total - s.decided} still pending your review.
              </>
            )}
          </p>
        </aside>
      </div>
    </section>
  );
}
