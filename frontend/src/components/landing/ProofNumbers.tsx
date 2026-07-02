// The proof ledger on the pine band: three poster-scale mono figures, each
// with a plain-language label. The rows stay stacked and the figures stay at
// text-6xl through the sm range, because at 8xl "18 / 19" plus the side-by-side
// grid squeezes the label into a sliver between 640 and 767px; the two-column
// treatment and the 8xl/9xl steps engage from md. The figure itself never
// wraps mid-record. Labels stay at paper/75, which clears AA on pine.
const PROOF_ROWS: { figure: string; label: string }[] = [
  { figure: "Every", label: "deal-breaker caught" },
  {
    figure: "18 / 19",
    label: "requirements found, the last one flagged for you",
  },
  {
    figure: "0",
    label: "answers invented, every claim links to your document",
  },
];

export function ProofNumbers() {
  return (
    <dl className="border-t border-paper/15">
      {PROOF_ROWS.map(({ figure, label }) => (
        <div
          key={figure}
          className="grid grid-cols-1 items-baseline gap-x-8 gap-y-2 border-b border-paper/15 py-8 md:grid-cols-[minmax(0,auto)_1fr] md:gap-x-12 md:py-10"
        >
          <dt className="whitespace-nowrap font-mono text-6xl font-medium leading-[0.85] tracking-tight text-paper md:text-8xl lg:text-9xl">
            {figure}
          </dt>
          <dd className="text-lg leading-relaxed text-paper/75 sm:text-xl">
            {label}
          </dd>
        </div>
      ))}
    </dl>
  );
}
