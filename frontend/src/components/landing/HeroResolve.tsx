"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRequirements } from "@/context/RequirementsContext";
import { deriveTriage } from "@/lib/triage";
import { ComplianceMatrix } from "@/components/ComplianceMatrix";
import { GatingHero } from "@/components/GatingHero";

// The hero showpiece (landing-page-brief §6): the real product resolving, not a
// faked graphic, presented as a tilted sheet filed into the register (the
// supabase-style product tilt, on our warm paper). The actual GatingHero and
// ComplianceMatrix render over the demo tender.
//
// The register assembles itself: a conductor below hands each row a staggered
// --pop-delay, so the rows pop into the sheet top to bottom, confidence beads
// snap in a beat behind their row, and the oxblood deal-breaker settles last
// and heaviest. The sequence re-arms only when the sheet has fully left the
// viewport and returns, so scroll-back visitors see the assembly again without
// the card ever dimming mid-view.
//
// The card is inert (non-interactive, out of the tab order and the a11y tree)
// with a plain text description for screen readers, because here it is an
// illustration, not the working worklist. Reduced motion and no-JS both land on
// the composed resting tilt (the hidden states only exist under
// data-scan="run").

const noop = () => {};

const POP_START_MS = 120;
const POP_STEP_MS = 60;
const GATE_LAG_MS = 320;

export function HeroResolve() {
  const { requirements } = useRequirements();
  const cardRef = useRef<HTMLDivElement>(null);

  // Remove the illustration from the tab order and the a11y tree once mounted.
  useEffect(() => {
    if (cardRef.current) cardRef.current.inert = true;
  }, []);

  // The assembly conductor: hand each row its pop time, the deal-breaker the
  // final beat, and run — on load, and again only after the sheet has FULLY
  // left the viewport and come back (threshold 0 means isIntersecting only
  // goes false at zero visible pixels, so the card never re-dims mid-view).
  useEffect(() => {
    const sheet = cardRef.current;
    if (!sheet) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const run = () => {
      const rows = sheet.querySelectorAll<HTMLElement>(
        '.hero-matrix div[role="button"]',
      );
      rows.forEach((el, i) => {
        el.style.setProperty(
          "--pop-delay",
          `${POP_START_MS + i * POP_STEP_MS}ms`,
        );
        el.classList.add("hero-pop-item");
      });
      sheet.style.setProperty(
        "--gate-delay",
        `${POP_START_MS + rows.length * POP_STEP_MS + GATE_LAG_MS}ms`,
      );
      // Re-trigger cleanly: drop the attribute, force a reflow so the
      // animations reset, then re-arm.
      sheet.removeAttribute("data-scan");
      void sheet.offsetWidth;
      sheet.setAttribute("data-scan", "run");
    };

    // First run starts just before the sheet-file entrance makes the card
    // visible, so no composed rows flash before the hidden state lands.
    const timer = window.setTimeout(run, 200);

    let wasOut = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            wasOut = true;
          } else if (wasOut) {
            wasOut = false;
            run();
          }
        }
      },
      { threshold: 0 },
    );
    io.observe(sheet);
    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  const triage = deriveTriage(requirements);
  // Trim to a compact register: a few rows per group, so the sheet reads as a
  // page, not the full worklist.
  const groups = triage.groups
    .map((g) => ({ ...g, items: g.items.slice(0, 3) }))
    .filter((g) => g.items.length > 0);

  return (
    <figure className="hero-stage relative m-0">
      <span className="sr-only">
        A public-sector tender resolving into a checklist of requirements, with
        the disqualifying deal-breaker settled at the top.
      </span>
      {/* The whole product shot is an obvious one-click entry into the worked
          example on the mock tender, so outreach traffic with no PDF of their own
          can feel the product in seconds. The inner sheet stays inert and
          aria-hidden (an illustration); the Link carries the accessible name. */}
      <Link
        href="/demo"
        aria-label="See it run on the demo tender"
        className="hero-product-halo relative isolate block [perspective:1600px] rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
      >
        <div
          ref={cardRef}
          aria-hidden="true"
          className="hero-sheet surface-grain relative mx-auto max-w-[1100px] overflow-hidden rounded-xl border border-forest/55 bg-paper-raised p-5 shadow-[var(--depth-hero-sheet)] sm:p-7 lg:p-8"
        >
          {/* The deal-breaker callout sits on top but settles last, after the
              register has assembled (hero-gate-settle at --gate-delay). */}
          <div data-scan-gate>
            <GatingHero />
          </div>
          {/* The register resolves row by row under the beam. It composes to
              the available width on phones, with the row status dropping under
              the requirement text instead of relying on a cropped fixed-width
              sheet. */}
          <div className="mt-6">
            <div className="hero-matrix">
              <ComplianceMatrix
                groups={groups}
                selectedId={null}
                onSelect={noop}
                onApprove={noop}
                activeFilter={null}
                density="compact"
              />
            </div>
          </div>
        </div>
      </Link>
    </figure>
  );
}
