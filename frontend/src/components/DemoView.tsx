"use client";

import Link from "next/link";
import { useRequirements } from "@/context/RequirementsContext";
import { deriveTriage } from "@/lib/triage";
import { ComplianceMatrix } from "@/components/ComplianceMatrix";
import { GatingHero } from "@/components/GatingHero";
import { GraphView } from "@/components/GraphView";
import { BookDemoButton } from "@/components/landing/BookDemoButton";
import { BotanicalSprig } from "@/components/landing/BotanicalSprig";
import { BrandLogo } from "@/components/BrandLogo";
import { mockTender } from "@/data/mock-requirements";

// A read-only walkthrough of the product for cold visitors arriving from the
// landing "See the demo" links. It shows the real GatingHero + ComplianceMatrix
// and the relationship graph over the demo tender, dressed in the Civic Record
// language (paper grid, grainy raised sheets, ink bands, forest sprigs, staggered
// reveals) so it sits with the hi-fi landing. The worklist is NON-INTERACTIVE
// (no-op handlers + pointer-events-none): no upload, no SectionNav, nothing to
// break. The content stays in the a11y tree so it reads; the only actions are
// "Book a demo" and an opt-in link into the live product at /review.

const noop = () => {};

export function DemoView() {
  const { requirements } = useRequirements();
  const triage = deriveTriage(requirements);

  return (
    <div className="min-h-screen bg-paper paper-grid">
      {/* A minimal masthead, not the product SectionNav (no Upload/Answers/Graph). */}
      <header className="border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-6 py-4">
          <Link
            href="/"
            aria-label="Bidframe — home"
            className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <BrandLogo className="h-7 w-auto" />
          </Link>
          <BookDemoButton location="demo-masthead" variant="link" />
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] px-6 py-12 sm:py-16">
        {/* Intro */}
        <div className="hero-enter relative">
          <BotanicalSprig className="pointer-events-none absolute -left-3 -top-3 hidden h-14 w-14 text-forest/30 sm:block" />
          <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
            Worked example, read-only
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {mockTender.title}
          </h1>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-muted">
            This is Bidframe reading one real public-sector tender. The
            deal-breakers surface first, every requirement links back to its
            clause, and nothing here is yours to upload or break.
          </p>
          <div className="mt-6">
            <BookDemoButton location="demo-intro" />
          </div>
        </div>

        {/* The worklist on a grainy raised sheet, frozen (read-only). */}
        <section className="hero-enter-2 relative mt-12">
          <BotanicalSprig className="pointer-events-none absolute -right-3 -top-4 z-10 hidden h-16 w-16 rotate-180 text-forest/40 sm:block" />
          <div className="surface-grain rounded-xl border border-hairline bg-paper-raised p-5 shadow-[var(--depth-sheet)] sm:p-7">
            <h2 className="mb-5 border-b border-hairline pb-3 font-serif text-lg font-semibold text-ink">
              The requirements, read and triaged
            </h2>
            <div className="pointer-events-none select-none">
              <GatingHero />
              <ComplianceMatrix
                groups={triage.groups}
                selectedId={null}
                onSelect={noop}
                onApprove={noop}
                activeFilter={null}
              />
            </div>
          </div>
        </section>

        {/* The relationship graph, annotated. */}
        <section className="hero-enter-3 mt-16">
          <h2 className="font-serif text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl">
            How the requirements connect
          </h2>
          <p className="mt-3 max-w-[64ch] text-lg leading-relaxed text-ink-muted">
            Every requirement is mapped to the award criterion that scores it and
            to the others it depends on, so you see where the marks live and what
            has to be answered in order.
          </p>

          {/* The annotations: what to look for in the graph below. */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Annotation oxblood title="Deal-breakers stay lit">
              Gating requirements glow oxblood here as on the worklist. Miss one
              and the whole bid is void.
            </Annotation>
            <Annotation title="Mapped to the marks">
              Each links to the award criterion it scores against, on the right, so
              you can see where the marks live.
            </Annotation>
            <Annotation title="Dependencies drawn">
              Dashed forest lines show which requirement depends on which, so
              nothing gets answered out of order.
            </Annotation>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-paper-raised p-3 shadow-[var(--depth-sheet)] sm:p-4">
            <GraphView interactive={false} />
          </div>
        </section>
      </main>

      {/* Closing call to action, on an ink band (Civic Record). */}
      <section className="bg-ink">
        <div className="mx-auto max-w-[1160px] px-6 py-16 text-center sm:py-20">
          <h2 className="font-serif text-2xl font-semibold leading-snug text-paper sm:text-3xl">
            See it on a tender you already know
          </h2>
          <p className="mx-auto mt-3 max-w-[56ch] text-lg leading-relaxed text-paper/70">
            The quickest way to judge Bidframe is to watch it read a tender you
            have already bid. Book fifteen minutes and bring one.
          </p>
          <div className="mt-7 flex justify-center">
            <BookDemoButton location="demo-closing" tone="dark" size="lg" />
          </div>
        </div>
      </section>

      {/* Footer. */}
      <footer className="bg-ink text-paper">
        <div className="mx-auto max-w-[1160px] px-6 py-8">
          <BrandLogo reversed className="h-7 w-auto" />
        </div>
      </footer>
    </div>
  );
}

// A small annotation card pointing out what to read in the graph. The oxblood
// variant carries the deal-breaker dot, greyscale-safe with its label.
function Annotation({
  title,
  oxblood = false,
  children,
}: {
  title: string;
  oxblood?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-paper-raised p-4 shadow-[var(--depth-row)]">
      <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
        {oxblood && (
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-signal-oxblood ring-1 ring-ink/40"
          />
        )}
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
