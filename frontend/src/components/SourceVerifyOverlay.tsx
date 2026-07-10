"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Requirement } from "@/types/requirement";
import { openAuthedDocument } from "@/lib/api";
import {
  hasPdfSource,
  sourceDocumentKind,
  sourceKindLabel,
  sourceRefLabel,
} from "@/lib/source-doc";
import type { MatchKind } from "@/lib/text-match";
import { PdfSourceView } from "./PdfSourceView";
import { DocxSourceView } from "./DocxSourceView";
import { SheetSourceView } from "./SheetSourceView";

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
  // The resolved raw DOCX/XLSX/CSV file (live tender doc or a static demo copy),
  // or null when this requirement isn't Office-sourced or no copy is available.
  rawDocUrl?: string | null;
  onClose: () => void;
}

export function SourceVerifyOverlay({
  requirement,
  pdfUrl,
  rawDocUrl = null,
  onClose,
}: SourceVerifyOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [match, setMatch] = useState<MatchKind | null>(null);

  // Focus the sheet on open. Focus RETURN on close is owned by the caller (it
  // knows the trigger and restores it after unmount) — doing it here from an
  // unmount cleanup is unreliable: the browser sends focus to <body> when the
  // focused dialog is removed, after React's synchronous cleanup, overriding it.
  useEffect(() => {
    dialogRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // The overlay is the top layer: consume the Esc so it closes ONLY the
      // overlay, not the split panel underneath. The panel's Esc handler skips a
      // `defaultPrevented` event ("one Esc, one close, top layer first"), but it
      // listens in the bubble phase and mounts first — so a bubble-phase
      // preventDefault here would land too late. Capture-phase + stopPropagation
      // makes this fire before the panel and keeps the event from reaching it,
      // so the trigger button stays mounted for focus-return on close.
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const ref = sourceRefLabel(requirement);
  const isPdf = hasPdfSource(requirement);
  const kind = sourceDocumentKind(requirement);
  const sourceKind = sourceKindLabel(requirement);
  const hasRenderableSource = Boolean(pdfUrl || rawDocUrl);
  // "Open the page" escape hatch: the raw PDF at the right page, in a new tab.
  // A click handler rather than an <a>: the document URL carries no token, so
  // the new tab is fed an authenticated blob (openAuthedDocument).
  function openPage() {
    if (!pdfUrl) return;
    void openAuthedDocument(pdfUrl, requirement.source_page).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Couldn't open the page.")
    );
  }

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
        className="panel-enter relative flex h-[min(90vh,900px)] w-[min(96vw,1100px)] flex-col divide-y-2 divide-ink overflow-hidden rounded-xl bg-paper-raised shadow-[var(--depth-sheet)] outline-none min-[1100px]:flex-row min-[1100px]:divide-x-2 min-[1100px]:divide-y-0"
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
            <MatchSignal
              kind={hasRenderableSource ? match : "unlocated"}
              page={requirement.source_page}
              isPdf={isPdf}
            />
            {pdfUrl && (
              <button
                type="button"
                onClick={openPage}
                className="mt-3 inline-block font-mono text-xs text-forest transition-colors hover:text-forest-hover hover:underline"
              >
                Open the page
              </button>
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
          ) : rawDocUrl && kind === "word" ? (
            <DocxSourceView
              docUrl={rawDocUrl}
              excerpt={requirement.source_excerpt}
              onMatch={setMatch}
            />
          ) : rawDocUrl && (kind === "excel" || kind === "csv") ? (
            <SheetSourceView
              docUrl={rawDocUrl}
              isCsv={kind === "csv"}
              sourceClause={requirement.source_clause ?? null}
              excerpt={requirement.source_excerpt}
              onMatch={setMatch}
            />
          ) : (
            <p className="p-6 font-mono text-xs leading-relaxed text-ink-muted">
              {isPdf
                ? "The source PDF is not available here. The exact wording above is what Bidframe read from the tender."
                : `This ${sourceKind} source isn't available to render here. The exact wording above is what Bidframe read from it.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// The honest match signal, as one shared vocabulary: a word beside a mark, never
// a score. Forest when the excerpt is on the page verbatim, amber when it is only
// a close match, muted when we can't pin the line (copywriting.md — show the
// source, never overclaim). This wording is canonical: the overlay's claim side
// and the split's persistent evidence pane both read from here, so the product
// never describes the same match two different ways.
export function matchSignalLabel(
  kind: MatchKind,
  page: number,
  isPdf = true
): string {
  if (kind === "exact") {
    return isPdf ? `Matches the tender, p.${page}` : "Matches the document";
  }
  if (kind === "approximate") return "Close match, check the wording";
  return "Shown from the extracted text";
}

function MatchSignal({
  kind,
  page,
  isPdf,
}: {
  kind: MatchKind | null;
  page: number;
  isPdf: boolean;
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
        {matchSignalLabel(kind, page, isPdf)}
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
        {matchSignalLabel(kind, page, isPdf)}
      </p>
    );
  }
  return (
    <p className="font-mono text-xs text-ink-muted">
      {matchSignalLabel(kind, page, isPdf)}
    </p>
  );
}
