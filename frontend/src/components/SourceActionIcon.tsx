// One small source glyph shared by every "look at the source" action — the
// panel's "See it in the document", the gating block's verify link, and the
// matrix split header's "Show source" — so source proof reads as one recognisable
// first-class affordance wherever it appears (UI Stage 3; UI-IMPROVEMENT-PLAN
// Decision 4). Greyscale-legible: a source-document silhouette carries the
// meaning, not the forest colour it pairs with.
export function SourceActionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* A page with a folded corner and two text lines: the source document. */}
      <path
        d="M3 1.6h4.3L11 5.3v6.1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2.6a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M7.2 1.8v3.3h3.3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M4.4 7.6h5M4.4 9.6h3.1"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
