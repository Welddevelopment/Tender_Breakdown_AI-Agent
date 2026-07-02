// The credibility band (landing-page-brief §7.9): an honest trust block for the
// light paper. It says where the counts come from, in plain provisional terms,
// and nothing more. No logos, no quotes, no named customers. The only evidence
// is the method: one live tender, checked by hand, every claim linked to source.
export function CredibilityBand() {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start md:gap-12">
      <div>
        <h3 className="text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          How we measured this
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          These are counts from one real tender, not a benchmark set. We ran Bidframe
          on a live UK public-sector cleaning contract and checked every requirement
          by hand against an answer key we labelled first. It reads for the deal-breakers,
          the pass or fail gates, and on this tender it caught every one.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Bidframe is built for SME bidders and small bid-writing consultancies. Every
          claim it makes links back to the clause and page it came from, so you can
          check it yourself rather than take our word for it.
        </p>
      </div>

      <div className="surface-grain self-start overflow-hidden rounded-lg border border-hairline bg-paper-raised shadow-[var(--depth-sheet)]">
        <div className="flex items-center justify-between border-b border-hairline bg-paper px-5 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            Audit sample
          </span>
          <span className="font-mono text-[11px] text-ink-muted">one live tender</span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-hairline border-b border-hairline">
          <Metric figure="1" label="tender" />
          <Metric figure="100%" label="manual check" />
          <Metric figure="all" label="claims linked" />
        </div>

        <dl className="divide-y divide-hairline">
          <AuditRow
            term="Source"
            detail="The SPSO cleaning ITT, a live UK public-sector tender."
          />
          <AuditRow
            term="Method"
            detail="Every requirement checked by hand against a labelled answer key."
          />
          <AuditRow
            term="Links"
            detail="Every claim opens the clause and page it came from."
          />
        </dl>

        <div className="border-t border-hairline bg-paper px-5 py-3">
          <p className="font-mono text-xs leading-relaxed text-ink-muted">
            Benchmark claim: none. This is an auditable worked example.
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({ figure, label }: { figure: string; label: string }) {
  return (
    <div className="px-4 py-5 text-center">
      <p className="font-mono text-2xl leading-none text-ink">{figure}</p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </p>
    </div>
  );
}

function AuditRow({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="grid gap-2 p-5 sm:grid-cols-[112px_1fr]">
      <dt className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">
        {term}
      </dt>
      <dd className="text-base leading-relaxed text-ink">{detail}</dd>
    </div>
  );
}
