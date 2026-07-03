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
// The scan is causal: a conductor below measures each register row's position
// in the sheet and writes it as a --scan-delay, so rows resolve from raw
// blurred text to the structured record exactly as the light beam passes them,
// confidence beads pop in its wake, and the beam then snaps back and "catches"
// on the deal-breaker, which settles last and heaviest in oxblood. The whole
// sequence re-arms when the sheet re-enters the viewport, so scroll-back
// visitors see the resolve too.
//
// The card is inert (non-interactive, out of the tab order and the a11y tree)
// with a plain text description for screen readers, because here it is an
// illustration, not the working worklist. Reduced motion and no-JS both land on
// the composed resting tilt (the raw state only exists under data-scan="run").

const noop = () => {};

// The beam travels the sheet over ~1.5s of the sweep keyframe; a row at
// vertical fraction f of the sheet resolves at SCAN_START + f * SCAN_TRAVEL.
const SCAN_START_MS = 150;
const SCAN_TRAVEL_MS = 1500;

export function HeroResolve() {
  const { requirements } = useRequirements();
  const cardRef = useRef<HTMLDivElement>(null);

  // Remove the illustration from the tab order and the a11y tree once mounted.
  useEffect(() => {
    if (cardRef.current) cardRef.current.inert = true;
  }, []);

  // The scan conductor: measure the rows, hand each its beam-crossing time,
  // and run the scan — on load, and again whenever the sheet re-enters the
  // viewport after fully leaving it.
  useEffect(() => {
    const sheet = cardRef.current;
    if (!sheet) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const run = () => {
      const rect = sheet.getBoundingClientRect();
      if (rect.height === 0) return;
      const rows = sheet.querySelectorAll<HTMLElement>(
        '.hero-matrix div[role="button"]',
      );
      rows.forEach((el) => {
        const r = el.getBoundingClientRect();
        const frac = Math.min(
          Math.max((r.top + r.height / 2 - rect.top) / rect.height, 0),
          1,
        );
        el.style.setProperty(
          "--scan-delay",
          `${Math.round(SCAN_START_MS + frac * SCAN_TRAVEL_MS)}ms`,
        );
        el.classList.add("hero-scan-item");
      });
      // Re-trigger cleanly: drop the attribute, force a reflow so the
      // animations reset, then re-arm.
      sheet.removeAttribute("data-scan");
      void sheet.offsetWidth;
      sheet.setAttribute("data-scan", "run");
    };

    // First run starts just before the sheet-file entrance makes the card
    // visible, so no composed rows flash before the raw state lands.
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
      { threshold: 0.35 },
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
        aria-label="Open the worked example on the demo tender"
        className="hero-product-halo relative isolate block [perspective:1600px] rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
      >
        <div
          ref={cardRef}
          aria-hidden="true"
          className="hero-sheet surface-grain relative mx-auto max-w-[1100px] overflow-hidden rounded-xl border border-forest/55 bg-paper-raised p-5 shadow-[var(--depth-hero-sheet)] sm:p-7 lg:p-8"
        >
          <span aria-hidden="true" className="hero-resolve-scan" />
          {/* The deal-breaker callout sits on top but settles last: the beam
              catches on it after the sweep and it lands under the oxblood
              flash (hero-gate-settle). */}
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
