"use client";

import { useEffect } from "react";
import type { Requirement } from "@/types/requirement";
import { useRequirements } from "@/context/RequirementsContext";
import {
  downloadCsv,
  prettyCategory,
  requirementsToCsv,
  slugify,
  statusWord,
  summarize,
  summaryLine,
  type ResponseSummary,
} from "@/lib/export";

// The end of the worklist: the deliverable the master plan promises ("export the
// matrix + decisions"). Two artifacts, both client-side so they work with no
// backend: a printable response pack (one document per requirement with its
// decision, drafted answer, and citation) and the matrix as a CSV. The completion
// banner is the quiet "you're done" moment that sits above the resting matrix and
// opens this.

function formatStamp(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Shown above the resting matrix once every requirement has a decision.
export function CompletionBanner({
  summary,
  onExport,
}: {
  summary: ResponseSummary;
  onExport: () => void;
}) {
  return (
    <section className="surface-grain mb-8 rounded-lg border border-hairline bg-paper-raised p-5 shadow-[var(--depth-sheet)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-wide text-forest">
            Review complete
          </p>
          <h2 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-ink">
            Every requirement reviewed
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{summaryLine(summary)}</p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="shrink-0 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
        >
          Export response
        </button>
      </div>
    </section>
  );
}

// The export overlay: the summary and the two export actions, over the printable
// response pack. While it is open, body.bf-exporting scopes the print stylesheet
// so only the pack prints (globals.css), leaving normal printing elsewhere alone.
export function ExportDialog({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const { requirements, capabilityDocs } = useRequirements();
  const summary = summarize(requirements);

  useEffect(() => {
    document.body.classList.add("bf-exporting");
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("bf-exporting");
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function docName(docId: string): string {
    return capabilityDocs.find((d) => d.doc_id === docId)?.filename ?? docId;
  }

  function onCsv() {
    downloadCsv(`bidframe-${slugify(title)}.csv`, requirementsToCsv(requirements));
  }

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-ink/40"
      role="dialog"
      aria-modal="true"
      aria-label="Export your response"
      onClick={onClose}
    >
      <div
        className="mx-auto my-8 w-full max-w-3xl px-4"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Controls. */}
        <div className="surface-grain rounded-t-lg border border-hairline bg-paper-raised p-5 shadow-[var(--depth-sheet)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
                Export
              </p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-ink">
                Your response is ready
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {summaryLine(summary)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Close
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
            >
              Print response pack
            </button>
            <button
              type="button"
              onClick={onCsv}
              className="rounded-md border border-hairline px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
            >
              Download matrix (CSV)
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            The response pack opens your browser print dialogue. Choose Save as
            PDF to keep a copy.
          </p>
        </div>

        {/* The printable response pack. */}
        <div
          id="bf-response-pack"
          className="border border-t-0 border-hairline bg-paper-raised px-7 py-6"
        >
          <header className="border-b-2 border-ink pb-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              Bidframe · Response pack
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold leading-tight text-ink">
              {title}
            </h1>
            <p className="mt-1 font-mono text-[11px] text-ink-muted">
              {summary.total} requirement{summary.total === 1 ? "" : "s"} ·{" "}
              {summaryLine(summary)}
            </p>
          </header>

          <ol className="mt-5 flex flex-col gap-5">
            {requirements.map((req) => (
              <PackItem key={req.id} req={req} docName={docName} />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function PackItem({
  req,
  docName,
}: {
  req: Requirement;
  docName: (docId: string) => string;
}) {
  const ref = req.source_clause
    ? `${req.source_clause} · p.${req.source_page}`
    : `p.${req.source_page}`;
  const answer = req.answer?.text ?? req.draft_answer ?? null;
  const evidence = req.answer?.evidence_refs ?? [];

  return (
    <li className="break-inside-avoid border-t border-hairline pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-[11px] text-ink-muted">
        <span>{ref}</span>
        <span className={req.is_gating ? "text-signal-oxblood" : undefined}>
          {req.is_gating ? "Deal-breaker" : prettyCategory(req.category)}
        </span>
      </div>
      <p className="mt-1 text-sm leading-snug text-ink">{req.text}</p>
      <p className="mt-2 font-mono text-[11px] text-ink-muted">
        Decision: {statusWord(req.status)}
        {req.decision?.timestamp ? `, ${formatStamp(req.decision.timestamp)}` : ""}
      </p>
      {req.decision?.note && (
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          {req.decision.note}
        </p>
      )}
      {answer && (
        <div className="mt-2 border-l-2 border-forest/50 pl-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {answer}
          </p>
          {evidence.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {evidence.map((e, index) => (
                <li
                  key={`${e.doc_id}-${index}`}
                  className="font-mono text-[11px] text-ink-muted"
                >
                  Backed by {docName(e.doc_id)}, p.{e.page}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
