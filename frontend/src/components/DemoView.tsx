"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRequirements } from "@/context/RequirementsContext";
import { GROUP_ORDER, deriveTriage } from "@/lib/triage";
import { sourceDocUrl } from "@/lib/api";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ComplianceMatrix } from "@/components/ComplianceMatrix";
import { GatingHero } from "@/components/GatingHero";
import { GraphView } from "@/components/GraphView";
import { SourceVerifyOverlay } from "@/components/SourceVerifyOverlay";
import { DemoScrolly } from "@/components/demo/DemoScrolly";
import { DemoTitleCard } from "@/components/demo/DemoTitleCard";
import { MountOnView } from "@/components/demo/MountOnView";
import { DEMO_FACTS } from "@/components/demo/sample";
import { BookDemoButton } from "@/components/landing/BookDemoButton";
import { BotanicalSprig } from "@/components/landing/BotanicalSprig";
import { ClosingArrival } from "@/components/landing/ClosingArrival";
import { DrawOn } from "@/components/landing/DrawOn";
import { FernFrond } from "@/components/landing/art/FernFrond";
import { TreelineDivider } from "@/components/landing/art/TreelineDivider";
import { Reveal } from "@/components/landing/Reveal";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { BrandLogo } from "@/components/BrandLogo";

// A read-only walkthrough of the product for cold visitors arriving from the
// landing "See the demo" links. It opens with a CINEMATIC SCROLL (DemoScrolly):
// a pinned stage that transforms through the pipeline — a tender read into a
// matrix, the deal-breaker lifting out, confidence shown honestly, answers with
// receipts, the approval stamp, the graph — while short narrative steps scroll
// past. The page's intro copy is passed INTO DemoScrolly (`intro` prop) so it
// sits beside the pinned stage from the first scroll pixel, with no dead
// viewport. Then, below the story, the same pipeline is shown for real on a
// frozen tender: the real GatingHero + ComplianceMatrix and the relationship
// graph, NON-INTERACTIVE (no-op handlers + pointer-events-none) except one
// scripted proof — "see a deal-breaker in the document" opens the real Bradwell
// page. Dressed in the Civic Record language and, since the forest uplift, the
// landing's woodland palette: a pine title card, forest kickers, a drawn fern
// by the worked example, the shared ClosingArrival clearing, and SiteFooter.

const noop = () => {};

export function DemoView() {
  const { requirements, title } = useRequirements();
  const triage = deriveTriage(requirements);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set<string>(GROUP_ORDER)
  );
  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  // One scripted proof moment: the frozen worklist can't be clicked, so a deal-breaker
  // gets its own "see it in the document" button that opens the real Bradwell page,
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
  const proof = {
    pages: DEMO_FACTS.pages,
    requirements: requirements.length,
    dealBreakers: requirements.filter((r) => r.is_gating).length,
    draftedAnswers: requirements.filter((r) => r.answer?.state === "auto").length,
    openQuestions: requirements.reduce(
      (total, req) =>
        total + (req.open_questions?.filter((q) => !q.answer).length ?? 0),
      0
    ),
  };

  return (
    <div className="landing-scope min-h-screen bg-paper paper-grid">
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

      {/* The cinematic scroll: pinned stage + stepping narrative. The intro
          copy lives INSIDE the scrolly (via the `intro` prop) as the first
          block of the narrative column, so the pinned stage is beside it from
          the first pixel — no dead viewport between intro and first beat. */}
      <DemoTitleCard />
      <section
        aria-label="How Bidframe works, step by step"
        className="demo-scrolly-chapter border-b border-moss-line"
      >
        <DemoScrolly
          intro={
            <div className="hero-enter relative">
              <DrawOn
                mode="scroll"
                className="pointer-events-none absolute -left-3 -top-3 hidden text-forest/30 sm:block"
              >
                <BotanicalSprig className="h-14 w-14" />
              </DrawOn>
              <p className="font-mono text-xs uppercase tracking-wide text-forest">
                The product, end to end
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink">
                From a public tender to a reviewed bid
              </h1>
              <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-muted">
                Scroll to watch Bidframe read the Bradwell grounds tender. The
                deal-breakers surface first, it flags what is missing, and it
                drafts each answer only where your documents support it.
              </p>
              <div className="mt-6">
                <BookDemoButton location="demo-intro" />
              </div>
            </div>
          }
        />
      </section>

      <DemoProofBand proof={proof} />

      {/* The same pipeline, for real, on a frozen tender — the hands-on example.
          overflow-x-clip (never overflow-hidden, and never on an ancestor of the
          scrolly grid — that kills sticky) lets the fern bleed off the left edge
          without horizontal scroll. */}
      <section
        className="demo-worked-example overflow-x-clip"
        data-worked-example
      >
        <div className="mx-auto max-w-[1160px] px-6 py-16 sm:py-20">
          <Reveal className="relative max-w-[46rem]" delay={80}>
            <DrawOn className="pointer-events-none absolute -left-28 -top-6 hidden xl:block">
              <FernFrond className="h-[20rem] w-auto text-forest/25" />
            </DrawOn>
            <p className="font-mono text-xs uppercase tracking-wide text-forest">
              Worked example, read-only
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
              {title}
            </h2>
            <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-muted">
              This is the real thing, on one real tender. Nothing here is yours
              to upload or break, but every requirement links back to its
              clause, and you can open the document to check any line.
            </p>
          </Reveal>

        {/* The worklist on a grainy raised sheet, frozen (read-only). */}
        <div className="relative mt-8">
          <DrawOn
            mode="scroll"
            className="pointer-events-none absolute -right-3 -top-4 z-10 hidden rotate-180 text-forest/40 sm:block"
          >
            <BotanicalSprig className="h-16 w-16" />
          </DrawOn>
          <MountOnView enabled minHeight={760}>
            <div className="surface-grain rounded-xl border border-hairline bg-paper-raised p-5 shadow-[var(--depth-sheet)] sm:p-7">
              <h3 className="mb-5 border-b border-hairline pb-3 font-serif text-lg font-semibold text-ink">
                The requirements, read and triaged
              </h3>
              <div className="pointer-events-none select-none">
                <GatingHero className="gating-flare-once" />
                <ComplianceMatrix
                  groups={triage.groups}
                  selectedId={null}
                  onSelect={noop}
                  onApprove={noop}
                  activeFilter={null}
                  collapsed={collapsedGroups}
                  onToggleGroup={toggleGroup}
                  revealKey="demo-bradwell"
                />
              </div>
              {dealBreaker && demoPdfUrl && (
                <div className="mt-5 border-t border-hairline pt-4">
                  <button
                    type="button"
                    onClick={() => setVerifyOpen(true)}
                    className="lantern-pulse relative inline-flex items-center gap-2 font-mono text-xs text-forest transition-colors hover:text-forest-hover hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
                  >
                    See a deal-breaker in the document
                  </button>
                </div>
              )}
            </div>
          </MountOnView>
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
        </div>
      </section>

      {verifyOpen && dealBreaker && (
        <SourceVerifyOverlay
          requirement={dealBreaker}
          pdfUrl={demoPdfUrl}
          onClose={() => setVerifyOpen(false)}
        />
      )}

      <ClosingArrival
        heading="See it on a tender you already know"
        body="The quickest way to judge Bidframe is to watch it read a tender you have already bid. Book fifteen minutes and bring one."
        ctaLocation="demo-closing"
      />

      {/* Shared site footer (pine, flipped treeline sits under the pine band). */}
      <SiteFooter />
    </div>
  );
}

function DemoProofBand({
  proof,
}: {
  proof: {
    pages: number;
    requirements: number;
    dealBreakers: number;
    draftedAnswers: number;
    openQuestions: number;
  };
}) {
  const rows = [
    { label: "pages read", value: proof.pages },
    { label: "requirements found", value: proof.requirements },
    { label: "deal-breakers flagged", value: proof.dealBreakers, alarm: true },
    { label: "answers drafted from evidence", value: proof.draftedAnswers },
    { label: "question left for the user", value: proof.openQuestions },
  ];

  return (
    <section className="demo-proof-band proof-band relative isolate overflow-x-clip bg-pine text-paper">
      <span aria-hidden className="proof-band__image absolute inset-0" />
      <span aria-hidden className="proof-band__leaf-shadow absolute inset-0" />
      <TreelineDivider className="absolute inset-x-0 bottom-0 h-16 w-full text-paper sm:h-24" />
      <div className="relative z-10 mx-auto grid max-w-[1160px] gap-10 px-6 py-20 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <Reveal className="max-w-[34rem]">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-paper/60">
            Bradwell run, frozen for the stage
          </p>
          <h2 className="mt-3 text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-paper sm:text-5xl">
            The guided film lands on the same tender.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-paper/72">
            No backend, no key, no theatre pretending to be live inference. This
            is a real pre-baked run, shown slowly enough to inspect.
          </p>
        </Reveal>
        <Reveal className="demo-proof-ledger surface-grain rounded-lg border border-paper/20 bg-paper/[0.08] p-4 shadow-[var(--depth-sheet-pine)] sm:p-5">
          <dl className="grid gap-px overflow-hidden rounded-md border border-paper/18 bg-paper/15 sm:grid-cols-5">
            {rows.map((row) => (
              <div
                key={row.label}
                className="bg-pine/82 px-4 py-5 sm:px-3 sm:py-6"
              >
                <dt className="min-h-[2.5rem] font-mono text-[10px] uppercase tracking-[0.13em] text-paper/55">
                  {row.label}
                </dt>
                <dd
                  className={`mt-3 font-mono text-4xl font-semibold tabular-nums leading-none sm:text-5xl ${
                    row.alarm ? "text-signal-amber" : "text-paper"
                  }`}
                >
                  <AnimatedNumber value={row.value} from={0} />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
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
