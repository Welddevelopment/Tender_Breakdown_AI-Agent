"use client";

import { useMemo } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import {
  sourceDocumentKindFromFilename,
  sourceKindName,
  sourceKindShortLabel,
  type SourceDocumentKind,
} from "@/lib/source-doc";
import { deriveTriage } from "@/lib/triage";

const SOURCE_BADGE_TONE: Record<SourceDocumentKind, string> = {
  pdf: "border-ink/20 bg-paper text-ink-muted",
  word: "border-forest/30 bg-forest/5 text-forest",
  excel: "border-accent/35 bg-accent/5 text-accent",
  csv: "border-signal-amber/40 bg-signal-amber/10 text-ink",
  document: "border-hairline bg-paper text-ink-muted",
};

// Live decision tally for the demo shell: short enough to sit above the matrix,
// but still explicit that every approval, edit, and flag is human-owned.
export function ControlPanel() {
  const { requirements, sourceDocs } = useRequirements();

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
    const docs =
      sourceDocs.length > 0
        ? sourceDocs
        : Array.from(
            new Map(
              requirements
                .filter((r) => r.source_filename)
                .map((r) => [
                  r.source_filename as string,
                  {
                    doc_id: r.source_doc_id ?? r.source_filename ?? "",
                    filename: r.source_filename as string,
                    page_count: 0,
                  },
                ])
            ).values()
          );
    const sourceFiles = docs.map((doc) => {
      const kind = sourceDocumentKindFromFilename(doc.filename);
      const count = requirements.filter(
        (req) =>
          req.source_doc_id === doc.doc_id ||
          req.source_filename === doc.filename
      ).length;
      return { ...doc, kind, count };
    });
    const formatCounts = sourceFiles.reduce(
      (acc, doc) => {
        acc[doc.kind] = (acc[doc.kind] ?? 0) + 1;
        return acc;
      },
      {} as Partial<Record<SourceDocumentKind, number>>
    );
    const formatSummary = (Object.entries(formatCounts) as Array<
      [SourceDocumentKind, number]
    >)
      .map(([kind, count]) => `${count} ${sourceKindName(kind)}`)
      .join(" · ");
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
      sourceFiles,
      formatSummary,
    };
  }, [requirements, sourceDocs]);

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
        {s.sourceFiles.length > 0 && (
          <div className="mb-3 rounded-md border border-hairline/90 bg-paper/80 px-4 py-3 shadow-[var(--depth-pressed)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                Tender pack: {s.sourceFiles.length} document
                {s.sourceFiles.length === 1 ? "" : "s"}
              </p>
              {s.formatSummary && (
                <p className="font-mono text-[11px] text-ink-muted">
                  {s.formatSummary}
                </p>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.sourceFiles.map((doc) => (
                <span
                  key={doc.doc_id || doc.filename}
                  title={doc.filename}
                  className="inline-flex max-w-full items-center gap-1.5 rounded border border-hairline bg-paper-recessed px-2 py-1 font-mono text-[11px] text-ink shadow-[var(--depth-pressed)]"
                >
                  <span
                    className={`inline-flex h-4 shrink-0 items-center rounded border px-1 text-[9px] font-medium leading-none ${SOURCE_BADGE_TONE[doc.kind]}`}
                    aria-hidden
                  >
                    {sourceKindShortLabel(doc.kind)}
                  </span>
                  <span className="max-w-[18rem] truncate">{doc.filename}</span>
                  <span className="shrink-0 text-ink-muted">
                    {doc.count} req{doc.count === 1 ? "" : "s"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
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
