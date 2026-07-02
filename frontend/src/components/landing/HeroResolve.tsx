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
// ComplianceMatrix render over the demo tender; the register settles on load and
// the oxblood deal-breaker settles last and heaviest. The sheet tilts toward the
// cursor (mouse parallax) when motion is allowed.
//
// The card is inert (non-interactive, out of the tab order and the a11y tree)
// with a plain text description for screen readers, because here it is an
// illustration, not the working worklist. Reduced motion and no-JS both land on
// the composed resting tilt.

const noop = () => {};

// How far the cursor tips the sheet from its resting angle, in degrees.
const TILT_RANGE = 3;

export function HeroResolve() {
  const { requirements } = useRequirements();
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);

  // Remove the illustration from the tab order and the a11y tree once mounted.
  useEffect(() => {
    if (cardRef.current) cardRef.current.inert = true;
  }, []);

  // Mouse parallax: nudge --rx/--ry around the resting tilt. Pointer-fine only,
  // and disabled under reduced motion, so touch and motion-sensitive users keep
  // the static composed angle.
  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;
    const fine = window.matchMedia("(pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty("--rx", `${5 - py * TILT_RANGE}deg`);
        card.style.setProperty("--ry", `${-6 + px * TILT_RANGE}deg`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const triage = deriveTriage(requirements);
  // Trim to a compact register: a few rows per group, so the sheet reads as a
  // page, not the full worklist.
  const groups = triage.groups
    .map((g) => ({ ...g, items: g.items.slice(0, 3) }))
    .filter((g) => g.items.length > 0);

  return (
    <figure ref={stageRef} className="hero-stage relative m-0">
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
        className="group block [perspective:1600px] rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
      >
        <div
          ref={cardRef}
          aria-hidden="true"
          className="hero-sheet surface-grain mx-auto max-w-[960px] rounded-xl border border-forest/45 bg-paper-raised p-5 shadow-[var(--depth-sheet-pine)] transition-shadow group-hover:shadow-[0_18px_44px_-18px_rgba(22,48,31,0.38)] sm:p-7"
        >
          {/* The deal-breaker callout sits on top but settles last (longer delay). */}
          <div className="hr-settle" style={{ animationDelay: "560ms" }}>
            <GatingHero />
          </div>
          {/* The register fills in first. */}
          <div className="hr-settle mt-6" style={{ animationDelay: "140ms" }}>
            <ComplianceMatrix
              groups={groups}
              selectedId={null}
              onSelect={noop}
              onApprove={noop}
              activeFilter={null}
            />
          </div>
        </div>
        <span className="mt-5 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-paper px-3.5 py-1.5 text-xs font-medium text-ink shadow-[var(--depth-control)] transition-transform group-hover:-translate-y-0.5">
            Open the worked example
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M2.5 7h9M8 3.5 11.5 7 8 10.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </Link>
    </figure>
  );
}
