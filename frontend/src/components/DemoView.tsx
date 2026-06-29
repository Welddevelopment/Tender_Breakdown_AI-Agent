"use client";

import Link from "next/link";
import { useRequirements } from "@/context/RequirementsContext";
import { deriveTriage } from "@/lib/triage";
import { ComplianceMatrix } from "@/components/ComplianceMatrix";
import { GatingHero } from "@/components/GatingHero";
import { BookDemoButton } from "@/components/landing/BookDemoButton";
import { mockTender } from "@/data/mock-requirements";

// A read-only walkthrough of the product for cold visitors arriving from the
// landing "See the demo" links. It shows the real GatingHero + ComplianceMatrix
// over the demo tender, exactly as the product renders them, but NON-INTERACTIVE:
// no upload, no product nav, no selecting or approving. Handlers are no-ops and
// the matrix is pointer-events-none, so a visitor just watches it work and cannot
// break the moment. The content stays in the accessibility tree so it still reads;
// the only actions are "Book a demo" and an opt-in link into the live product.

const noop = () => {};

export function DemoView() {
  const { requirements } = useRequirements();
  const triage = deriveTriage(requirements);

  return (
    <div className="min-h-screen bg-paper">
      {/* A minimal masthead, not the product's SectionNav (no Upload/Answers/Graph). */}
      <header className="border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="rounded-sm font-mono text-sm font-medium uppercase tracking-[0.2em] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Bidframe
          </Link>
          <BookDemoButton location="demo-masthead" variant="link" />
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] px-6 py-10">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-hairline pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
              Worked example, read-only
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-ink">
              {mockTender.title}
            </h1>
          </div>
          <Link
            href="/review"
            className="rounded-sm text-sm text-ink-muted underline decoration-hairline decoration-1 underline-offset-4 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Open the interactive version
          </Link>
        </div>

        {/* The real product, frozen: no-op handlers plus pointer-events-none make
            it look-but-do-not-touch, while staying readable. */}
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

        <div className="mt-12 border-t border-hairline pt-8">
          <p className="max-w-[60ch] text-lg leading-relaxed text-ink">
            This is Bidframe reading one real tender. Book fifteen minutes and we
            will run it on a tender you already know.
          </p>
          <div className="mt-6">
            <BookDemoButton location="demo-footer" />
          </div>
        </div>
      </main>
    </div>
  );
}
