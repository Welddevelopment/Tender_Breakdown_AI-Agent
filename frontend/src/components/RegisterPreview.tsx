// A faint, non-interactive echo of the compliance matrix grid: the blank official
// register the upload will be filed into. It keeps the same column rhythm as a
// real matrix row (ComplianceMatrix: [ref margin · confidence bead · requirement
// line]) but renders every cell empty, as ruled ledger lines, so the idle upload
// screen shows the shape of its own output without inventing any data.
//
// It is grain-free and unlifted on purpose: this is the recessed form lying under
// the raised intake slot, not a working surface (design-language: depth means
// focus). The bottom fades out under a mask, so the register reads as continuing
// past the frame rather than stopping in a hard, symmetric box.

// Varied line widths so the rows never read as three identical demo rows
// (SLOP-CHECK: real content, not suspiciously clean placeholders). These are the
// resting blank state; a later pass fills them from the live job as it reads.
const ROWS: { width: string }[] = [
  { width: "84%" },
  { width: "61%" },
  { width: "92%" },
  { width: "47%" },
  { width: "74%" },
  { width: "68%" },
];

export function RegisterPreview({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`select-none ${className}`}
      style={{
        maskImage: "linear-gradient(to bottom, #000 52%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, #000 52%, transparent)",
      }}
    >
      <ul className="flex flex-col">
        {ROWS.map((row, i) => (
          <li
            key={i}
            className="grid grid-cols-[46px_30px_1fr] items-center gap-x-3 border-t border-hairline px-2.5 py-3.5 first:border-t-0"
          >
            {/* the register margin, where the real clause ref will sit */}
            <span
              className="h-2 justify-self-end rounded-full bg-hairline"
              style={{ width: 22 }}
            />
            {/* the confidence bead, hollow: a status lands here once it is read */}
            <span className="h-3.5 w-3.5 justify-self-center rounded-full border border-hairline" />
            {/* the requirement line */}
            <span
              className="h-2.5 rounded-full bg-hairline"
              style={{ width: row.width, opacity: 0.72 }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
