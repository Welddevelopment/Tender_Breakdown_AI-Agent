import styles from "./RegisterPreview.module.css";

// A faint, non-interactive echo of the compliance matrix grid: the blank official
// register the upload will be filed into. It keeps the same column rhythm as a
// real matrix row (ComplianceMatrix: [ref margin · confidence bead · requirement
// line]) but renders every cell as ruled ledger lines, so the idle upload screen
// shows the shape of its own output without inventing any data.
//
// During extraction the same register stays on stage and inks itself in: as
// `filled` climbs with the job's requirement count, rows fill top to bottom —
// the ref margin takes accent (traceable to source), the bead takes a status
// tier, the requirement line darkens from ruled blank to written entry. The
// empty form becoming the filled matrix is the product's whole thesis, played
// in miniature. Each row fills exactly once (a class swap on already-mounted
// spans, so the one-shot ink-in never replays), calm and reduced-motion safe.
//
// It is grain-free and unlifted on purpose: this is the recessed form lying under
// the raised intake slot, not a working surface (design-language: depth means
// focus). The bottom fades out under a mask, so the register reads as continuing
// past the frame rather than stopping in a hard, symmetric box.

// Varied line widths so the rows never read as three identical demo rows
// (SLOP-CHECK: real content, not suspiciously clean placeholders). Tiers are the
// bead's status colour once the row is inked — mostly confident, one uncertain,
// one deal-breaker — matching the honest mix a real extraction lands with.
type RowTier = "ok" | "warn" | "gate";

const ROWS: { width: string; tier: RowTier }[] = [
  { width: "84%", tier: "ok" },
  { width: "61%", tier: "ok" },
  { width: "92%", tier: "gate" },
  { width: "47%", tier: "warn" },
  { width: "74%", tier: "ok" },
  { width: "68%", tier: "ok" },
];

// Signal palette as status only: the bead is a mark, never a surface. The
// deal-breaker bead is the two-tone alarm — oxblood fill in an oxblood-frame
// edge — same grammar as the matrix rows it foreshadows.
const BEAD_TIER: Record<RowTier, string> = {
  ok: "bg-signal-light-green",
  warn: "bg-signal-yellow",
  gate: "border border-signal-oxblood-frame bg-signal-oxblood",
};

export function RegisterPreview({
  className = "",
  filled = 0,
}: {
  className?: string;
  /** Requirements found so far; rows ink in top-to-bottom, clamped to the sketch. */
  filled?: number;
}) {
  const inkedRows = Math.max(0, Math.min(ROWS.length, filled));
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
        {ROWS.map((row, i) => {
          const inked = i < inkedRows;
          return (
            <li
              key={i}
              className="grid grid-cols-[46px_30px_1fr] items-center gap-x-3 border-t border-hairline px-2.5 py-3.5 first:border-t-0"
            >
              {/* the register margin: blank rule until read, then the clause
                  ref's place takes accent — traceable to source */}
              <span
                className={`h-2 justify-self-end rounded-full ${
                  inked ? `bg-accent/60 ${styles.inkRef}` : "bg-hairline"
                }`}
                style={{ width: 22 }}
              />
              {/* the confidence bead: hollow until a status lands in it */}
              <span
                className={`h-3.5 w-3.5 justify-self-center rounded-full ${
                  inked
                    ? `${BEAD_TIER[row.tier]} ${styles.inkBead}`
                    : "border border-hairline"
                }`}
              />
              {/* the requirement line, written in over the ruled blank */}
              <span
                className={`h-2.5 rounded-full ${
                  inked ? `bg-ink/40 ${styles.inkLine}` : "bg-hairline"
                }`}
                style={{ width: row.width, opacity: inked ? undefined : 0.72 }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
