const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Upload the tender",
    body: "Drop in the PDF. Bidframe reads it and finds every requirement, with its source.",
  },
  {
    n: "02",
    title: "Review the worklist",
    body: "Each requirement comes with its confidence and its clause reference. The deal-breakers and the uncertain ones are flagged. You approve, edit, or flag each one.",
  },
  {
    n: "03",
    title: "Draft your answers",
    body: "Bidframe drafts each answer from your own documents and shows where it came from. It asks you only what it cannot find.",
  },
];

// The method as one ruled ledger row: a single continuous rule across the top
// of the three steps (not three broken segments), a forest node where each step
// begins, hairline dividers between the columns, and the step number set as a
// two-digit register numeral. On mobile the steps stack and each carries its
// own rule, so the node still has a line to sit on.
export function HowItWorks() {
  return (
    <ol className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x lg:divide-hairline lg:border-t lg:border-hairline">
      {STEPS.map(({ n, title, body }, i) => (
        <li
          key={n}
          className={`relative border-t border-hairline pt-6 pb-7 lg:border-t-0 lg:pb-0 ${
            i === 0
              ? "lg:pr-8 xl:pr-10"
              : i === STEPS.length - 1
                ? "lg:pl-8 xl:pl-10"
                : "lg:px-8 xl:px-10"
          }`}
        >
          {/* The node: a small forest point sitting on the through-line,
              marking where this step's column begins. */}
          <span
            aria-hidden
            className="absolute -top-[3.5px] left-0 h-[7px] w-[7px] rounded-full bg-forest"
          />
          <span className="font-mono text-sm font-medium tracking-[0.08em] text-forest">
            {n}
          </span>
          <h3 className="mt-3 font-serif text-lg font-semibold leading-tight tracking-tight text-ink sm:text-xl">
            {title}
          </h3>
          <p className="mt-3 max-w-[42ch] text-base leading-relaxed text-ink-muted lg:text-lg">
            {body}
          </p>
        </li>
      ))}
    </ol>
  );
}
