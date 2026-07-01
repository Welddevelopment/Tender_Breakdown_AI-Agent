"use client";

import { useState } from "react";
import Link from "next/link";
import { useRequirements } from "@/context/RequirementsContext";
import { deriveTriage } from "@/lib/triage";
import { sourceDocUrl } from "@/lib/api";
import { ComplianceMatrix } from "@/components/ComplianceMatrix";
import { GatingHero } from "@/components/GatingHero";
import { GraphView } from "@/components/GraphView";
import { SourceVerifyOverlay } from "@/components/SourceVerifyOverlay";
import { DemoScrolly } from "@/components/demo/DemoScrolly";
import { BookDemoButton } from "@/components/landing/BookDemoButton";
import { BotanicalSprig } from "@/components/landing/BotanicalSprig";
import { BrandLogo } from "@/components/BrandLogo";

// A read-only walkthrough of the product for cold visitors arriving from the
// landing "See the demo" links. It opens with a CINEMATIC SCROLL (DemoScrolly):
// a pinned stage that transforms through the pipeline — a tender read into a
// matrix, the deal-breaker lifting out, confidence shown honestly, answers with
// receipts, the approval stamp, the graph — while short narrative steps scroll
// past. Then, below the story, the same pipeline is shown for real on a frozen
// tender: the real GatingHero + ComplianceMatrix and the relationship graph,
// NON-INTERACTIVE (no-op handlers + pointer-events-none) except one scripted
// proof — "see a deal-breaker in the document" opens the real SPSO page. Dressed
// in the Civic Record language throughout. The only actions are "Book a demo"
// and the source-verify overlay.

const noop = () => {};

export function DemoView() {
  const { requirements, title } = useRequirements();
  const triage = deriveTriage(requirements);
  // One scripted proof moment: the frozen worklist can't be clicked, so a deal-breaker
  // gets its own "see it in the document" button that opens the real SPSO page,
  // scrolled to and highlighting the exact line. The demo's trust payoff.
  const [verifyOpen, setVerifyOpen] = useState(false);
  const dealBreaker =
    requirements.find((r) => r.is_gating) ?? requirements[0] ?? null;
  const demoPdfUrl = dealBreaker
    ? sourceDocUrl({
        tenderId: null,
        docId: dealBreaker.source_doc_id ?? null,
        filename: dealBreaker.source_filename ?? null,
      })
    : null;

  return (
    <div className="min-h-screen bg-paper paper-grid">
      {/* A minimal masthead, not the product SectionNav (no Upload/Answers/Graph). */}
      <header className="border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-6 py-4">
          <Link
            href="/"
            aria-label="Bidframe, home"
            className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <BrandLogo className="h-7 w-auto" />
          </Link>
          <BookDemoButton location="demo-masthead" variant="link" />
        </div>
      </header>

      {/* Intro — tees up the scroll story. */}
      <section className="mx-auto max-w-[1160px] px-6 pb-6 pt-12 sm:pt-16">
        <div className="hero-enter relative max-w-[46rem]">
          <BotanicalSprig className="pointer-events-none absolute -left-3 -top-3 hidden h-14 w-14 text-forest/30 sm:block" />
          <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
            The product, end to end
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            From a hundred-page tender to a reviewed bid
          </h1>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-muted">
            Scroll to watch Bidframe read one public-sector tender. The
            deal-breakers surface first, it flags what it is unsure of, and it
            drafts each answer from your own documents with a citation.
          </p>
          <div className="mt-6">
            <BookDemoButton location="demo-intro" />
          </div>
        </div>
      </section>

      {/* The cinematic scroll: pinned stage + stepping narrative. */}
      <section aria-label="How Bidframe works, step by step">
        <DemoScrolly />
      </section>

      {/* The same pipeline, for real, on a frozen tender — the hands-on example. */}
      <section className="mx-auto max-w-[1160px] px-6 py-16 sm:py-20">
        <div className="relative max-w-[46rem]">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
            Worked example, read-only
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-muted">
            This is the real thing, on one real tender. Nothing here is yours to
            upload or break, but every requirement links back to its clause, and
            you can open the document to check any line.
          </p>
        </div>

        {/* The worklist on a grainy raised sheet, frozen (read-only). */}
        <div className="relative mt-8">
          <BotanicalSprig className="pointer-events-none absolute -right-3 -top-4 z-10 hidden h-16 w-16 rotate-180 text-forest/40 sm:block" />
          <div className="surface-grain rounded-xl border border-hairline bg-paper-raised p-5 shadow-[var(--depth-sheet)] sm:p-7">
            <h3 className="mb-5 border-b border-hairline pb-3 font-serif text-lg font-semibold text-ink">
              The requirements, read and triaged
            </h3>
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
            {dealBreaker && demoPdfUrl && (
              <div className="mt-5 border-t border-hairline pt-4">
                <button
                  type="button"
                  onClick={() => setVerifyOpen(true)}
                  className="inline-flex items-center gap-2 font-mono text-xs text-forest transition-colors hover:text-forest-hover hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
                >
                  See a deal-breaker in the document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* The relationship graph, annotated. */}
        <div className="mt-16">
          <h3 className="font-serif text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl">
            How the requirements connect
          </h3>
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
        </div>
      </section>

      {verifyOpen && dealBreaker && (
        <SourceVerifyOverlay
          requirement={dealBreaker}
          pdfUrl={demoPdfUrl}
          onClose={() => setVerifyOpen(false)}
        />
      )}

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
      <h4 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
        {oxblood && (
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-signal-oxblood ring-1 ring-ink/40"
          />
        )}
        {title}
      </h4>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
