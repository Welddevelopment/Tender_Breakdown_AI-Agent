"use client";

import { useEffect, useRef, useState } from "react";
import type { Requirement } from "@/types/requirement";
import { PdfSourceView, type MatchKind } from "./PdfSourceView";

// The claim ↔ source split (graph-and-verification-deep-plan.md Part B, #1): click
// a claim's source and the tender page opens beside it with the exact line
// highlighted, so the promise "never take our word for it" is shown, not asserted.
// A focused overlay over the current screen, reusing the drawer's dialog semantics
// (scrim, Esc, focus). Wide viewports read side by side; below the split
// breakpoint they stack, claim over document (layout.md section 5).

interface SourceVerifyOverlayProps {
  requirement: Requirement;
  // The resolved source PDF (live tender doc or a static demo copy), or null when
  // no PDF is available and we fall back to the excerpt as the proof.
  pdfUrl: string | null;
  onClose: () => void;
}

export function SourceVerifyOverlay({
  requirement,
  pdfUrl,
  onClose,
}: SourceVerifyOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [match, setMatch] = useState<MatchKind | null>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const ref = requirement.source_clause
    ? `p.${requirement.source_page}, ${requirement.source_clause}`
    : `p.${requirement.source_page}`;
  // "Open the page" escape hatch: the raw PDF at the right page, in a new tab.
  const openPageHref = pdfUrl ? `${pdfUrl}#page=${requirement.source_page}` : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 transition-opacity motion-reduce:transition-none"
      />

      {/* Sheet */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Source in the tender"
        tabIndex={-1}
        className="relative flex h-[min(90vh,900px)] w-[min(96vw,1100px)] flex-col divide-y-2 divide-ink overflow-hidden rounded-xl bg-paper-raised shadow-[var(--depth-sheet)] outline-none min-[1100px]:flex-row min-[1100px]:divide-x-2 min-[1100px]:divide-y-0"
      >
        {/* Claim side */}
        <div className="flex min-h-0 flex-col overflow-y-auto p-5 sm:p-6 min-[1100px]:w-[380px] min-[1100px]:shrink-0">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[12.5px] font-medium uppercase tracking-wide text-ink-muted">
              In the tender
            </p>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 -mt-1 rounded-sm p-1 font-mono text-xs text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            >
              Close
            </button>
          </div>

          {requirement.is_gating && (
            <p className="mt-4 border-l-2 border-signal-oxblood-frame pl-3 font-mono text-xs text-signal-oxblood">
              Deal-breaker
            </p>
          )}

          <p className="mt-3 max-w-[64ch] text-base leading-relaxed text-ink">
            {requirement.text}
          </p>

          <p className="mt-4 font-mono text-xs text-accent">{ref}</p>
          {requirement.source_filename && (
            <p
              className="truncate font-mono text-xs text-accent/70"
              title={requirement.source_filename}
            >
              {requirement.source_filename}
            </p>
          )}

          <p className="mt-3 rounded bg-paper-recessed p-2.5 font-mono text-xs leading-relaxed text-accent shadow-[var(--depth-pressed)]">
            &ldquo;{requirement.source_excerpt}&rdquo;
          </p>

          <div className="mt-auto pt-5">
            <MatchSignal kind={pdfUrl ? match : "unlocated"} page={requirement.source_page} />
            {openPageHref && (
              <a
                href={openPageHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block font-mono text-xs text-forest transition-colors hover:text-forest-hover hover:underline"
              >
                Open the page
              </a>
            )}
          </div>
        </div>

        {/* Document side */}
        <div className="min-h-0 flex-1 bg-paper">
          {pdfUrl ? (
            <PdfSourceView
              pdfUrl={pdfUrl}
              page={requirement.source_page}
              excerpt={requirement.source_excerpt}
              onMatch={setMatch}
            />
          ) : (
            <p className="p-6 font-mono text-xs leading-relaxed text-ink-muted">
              The document isn&rsquo;t available here. The exact wording, above, is
              what Bidframe read from p.{requirement.source_page}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// The honest match signal: a word beside a mark, never a score. Forest when the
// excerpt is on the page verbatim, amber when it is only a close match, muted
// while we look or when we can't pin the line (copywriting.md — show the source,
// never overclaim).
function MatchSignal({
  kind,
  page,
}: {
  kind: MatchKind | null;
  page: number;
}) {
  if (kind === null) {
    return (
      <p className="font-mono text-xs text-ink-muted">Finding the line…</p>
    );
  }
  if (kind === "exact") {
    return (
      <p className="flex items-center gap-2 font-mono text-xs text-ink">
        <span aria-hidden className="text-forest">
          ✓
        </span>
        Matches the tender, p.{page}
      </p>
    );
  }
  if (kind === "approximate") {
    return (
      <p className="flex items-center gap-2 font-mono text-xs text-ink">
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full bg-signal-amber ring-1 ring-ink/30"
        />
        Close match, check the wording
      </p>
    );
  }
  return (
    <p className="font-mono text-xs text-ink-muted">
      Shown from the extracted text
    </p>
  );
}
