// The credibility band (landing-page-brief §7.9): an honest trust block for the
// light paper. It says where the counts come from, in plain provisional terms,
// and nothing more. No logos, no quotes, no named customers. The only evidence
// is the method: one live tender, checked by hand, every claim linked to source.
export function CredibilityBand() {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
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

      <dl className="surface-grain self-start rounded-lg border border-hairline bg-paper-raised p-5 shadow-[var(--depth-row)]">
        <div>
          <dt className="font-mono text-xs uppercase tracking-wide text-ink-muted">
            Source
          </dt>
          <dd className="mt-1 text-lg leading-relaxed text-ink">
            The SPSO cleaning ITT, a live UK public-sector tender.
          </dd>
        </div>
        <div className="mt-4 border-t border-hairline pt-4">
          <dt className="font-mono text-xs uppercase tracking-wide text-ink-muted">
            Method
          </dt>
          <dd className="mt-1 text-lg leading-relaxed text-ink">
            Every requirement checked by hand against a labelled answer key.
          </dd>
        </div>
        <div className="mt-4 border-t border-hairline pt-4">
          <dt className="font-mono text-xs uppercase tracking-wide text-ink-muted">
            Links
          </dt>
          <dd className="mt-1 text-lg leading-relaxed text-ink">
            Every claim opens the clause and page it came from.
          </dd>
        </div>
      </dl>
    </div>
  );
}
