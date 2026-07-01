"use client";

import { useEffect, useRef, useState } from "react";
import { STEPS, type Step } from "./steps";
import { BeatVisual, ScrollyStage } from "./ScrollyStage";

// The cinematic scroll for /demo: a pinned "stage" that transforms through the
// pipeline while the narrative steps scroll past. Technique is the repo's own
// (IntersectionObserver only, CSS transitions only — the Reveal.tsx contract),
// no scroll libraries, no new deps.
//
// Accessible + robust by construction, the Reveal.tsx way: the markup renders
// the readable STACKED fallback by default (SSR, no-JS, reduced motion, and
// mobile all get it). Only on the client, and only when the viewport is wide
// AND motion is allowed, do we ENHANCE into the pinned split. That one flag also
// covers both required fallbacks (mobile < lg OR reduced motion) with a single
// stacked renderer. The stage is illustrative (aria-hidden); the narrative copy
// is the a11y source of truth.

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

// The narrative beat: a mono kicker, a Fraunces heading, one or two sentences.
// In the pinned path the inactive steps dim so the active one reads; in the
// stacked fallback every step reads at full strength.
function StepCopy({ step, active }: { step: Step; active: boolean }) {
  return (
    <div
      className={`max-w-[40ch] transition-opacity duration-500 ${EASE} ${
        active ? "opacity-100" : "opacity-40"
      }`}
    >
      <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
        {step.kicker}
      </p>
      <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl">
        {step.heading}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">{step.body}</p>
    </div>
  );
}

export function DemoScrolly() {
  const [activeStep, setActiveStep] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const narrativeRef = useRef<HTMLDivElement>(null);

  // Decide whether to enhance: wide viewport AND motion allowed. Read on the
  // client only, and keep it live so resizing or toggling reduced motion in
  // dev switches paths cleanly.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const sync = () => setEnhanced(wide.matches && motion.matches);
    sync();
    wide.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  // Drive the active beat from the narrative steps crossing the viewport centre.
  // One observer over the [data-step] sections; the trigger band is the middle
  // ~10% of the viewport (rootMargin -45%/-45%). setState here is from the
  // observer callback (not synchronous in the effect body), which is fine.
  useEffect(() => {
    if (!enhanced) return;
    const root = narrativeRef.current;
    if (!root) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.step ?? "0"
            );
            setActiveStep(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    steps.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [enhanced]);

  // Fallback (default / mobile / reduced motion): steps in normal flow, each
  // followed by its own beat visual in its composed final state. No pinning,
  // no observer, reads perfectly with zero motion.
  if (!enhanced) {
    return (
      <div className="mx-auto max-w-[40rem] px-6 py-8">
        <ol className="flex flex-col gap-16">
          {STEPS.map((step, i) => (
            <li key={step.id}>
              <StepCopy step={step} active />
              <div className="mt-6 flex justify-center">
                <BeatVisual step={i} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // Enhanced (wide + motion): a two-column split. Tall narrative steps scroll on
  // the left; the stage stays pinned and centred on the right, transforming as
  // the active step changes.
  return (
    <div className="mx-auto max-w-[1160px] px-6">
      <div className="grid grid-cols-[minmax(18rem,24rem)_1fr] gap-12 xl:gap-16">
        <div ref={narrativeRef}>
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              data-step={i}
              className="flex min-h-screen flex-col justify-center py-20"
            >
              <StepCopy step={step} active={i === activeStep} />
            </div>
          ))}
        </div>
        <div>
          <div className="sticky top-0 flex h-screen items-center justify-center">
            <ScrollyStage step={activeStep} />
          </div>
        </div>
      </div>
    </div>
  );
}
