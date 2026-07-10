"use client";

import { useEffect, useRef } from "react";
import type { CapabilityDoc, Requirement } from "@/types/requirement";

// The answer-side mirror of SourceVerifyOverlay (the matrix's "See it in the
// document"): click Show evidence on a drafted answer and its grounding opens in
// a focused split — the answer claim on one side, every backing receipt on the
// other, each read as "Backed by your {doc}, p.{page}" with the verbatim excerpt
// it was drafted from. Reuses the drawer's dialog semantics (scrim, Esc, focus).
//
// Honest boundary: there is no fetch URL for a bidder's capability document yet
// (api.ts resolves tender source docs only), so this does NOT render the page —
// it shows the exact wording Bidframe pulled, and says so, rather than faking a
// render. When the capability-doc endpoint lands this is where the page view
// slots in, exactly as PdfSourceView does for the tender side.

interface AnswerEvidenceOverlayProps {
  requirement: Requirement;
  capabilityDocs: CapabilityDoc[];
  onClose: () => void;
}

export function AnswerEvidenceOverlay({
  requirement,
  capabilityDocs,
  onClose,
}: AnswerEvidenceOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const answer = requirement.answer ?? null;

  useEffect(() => {
    dialogRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function docName(docId: string): string {
    return capabilityDocs.find((d) => d.doc_id === docId)?.filename ?? docId;
  }

  const refs = answer?.evidence_refs ?? [];

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
        aria-label="Evidence behind this answer"
        tabIndex={-1}
        className="panel-enter relative flex h-[min(90vh,900px)] w-[min(96vw,1100px)] flex-col divide-y-2 divide-ink overflow-hidden rounded-xl bg-paper-raised shadow-[var(--depth-sheet)] outline-none min-[1100px]:flex-row min-[1100px]:divide-x-2 min-[1100px]:divide-y-0"
      >
        {/* Claim side: the requirement and the answer it drafted. */}
        <div className="flex min-h-0 flex-col overflow-y-auto p-5 sm:p-6 min-[1100px]:w-[380px] min-[1100px]:shrink-0">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[12.5px] font-medium uppercase tracking-wide text-ink-muted">
              Your answer
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

          <p className="mt-3 max-w-[64ch] text-sm leading-relaxed text-ink-muted">
            {requirement.text}
          </p>

          {answer ? (
            <p className="mt-4 max-w-[64ch] whitespace-pre-wrap border-l-2 border-forest/50 pl-3 text-base leading-relaxed text-ink">
              {answer.text}
            </p>
          ) : (
            <p className="mt-4 max-w-[64ch] text-sm leading-relaxed text-ink-muted">
              No draft yet.
            </p>
          )}
        </div>

        {/* Evidence side: the receipts this answer was drafted from. */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-paper p-5 sm:p-6">
          <p className="font-mono text-[12.5px] font-medium uppercase tracking-wide text-ink-muted">
            Backed by your documents
          </p>

          {refs.length === 0 ? (
            <p className="mt-4 max-w-[64ch] text-sm leading-relaxed text-ink-muted">
              This answer isn&rsquo;t linked to a capability document yet. Upload
              the evidence it should cite so the response is backed and checkable.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-5">
              {refs.map((ref, index) => (
                <li key={`${ref.doc_id}-${index}`}>
                  <p className="font-mono text-xs text-accent">
                    Backed by your {docName(ref.doc_id)}, p.{ref.page}
                  </p>
                  <p className="mt-2 max-w-[64ch] rounded bg-paper-recessed p-2.5 font-mono text-xs leading-relaxed text-accent shadow-[var(--depth-pressed)]">
                    &ldquo;{ref.excerpt}&rdquo;
                  </p>
                </li>
              ))}
            </ul>
          )}

          {refs.length > 0 && (
            <p className="mt-6 max-w-[64ch] font-mono text-[11px] leading-relaxed text-ink-muted">
              Shown from your document&rsquo;s extracted text &mdash; this is the
              exact wording Bidframe drafted from. Open the file itself to read it
              in place.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
