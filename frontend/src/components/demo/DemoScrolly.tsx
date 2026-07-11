"use client";

import { useEffect, useRef, useState } from "react";
import { STEPS, type Step } from "./steps";
import { BeatVisual, ScrollyStage } from "./ScrollyStage";
import { MountOnView } from "./MountOnView";
import { useBeatStep, useScrollTimeline } from "./useScrollTimeline";
import { BookDemoButton } from "@/components/landing/BookDemoButton";

// The cinematic scroll for /demo: a pinned "stage" that transforms through the
// pipeline while the narrative steps scroll past. Wide, motion-allowed viewports
// use a scroll-scrubbed motion timeline; mobile and reduced motion keep the
// readable stacked renderer.
//
// Accessible + robust by construction, the Reveal.tsx way: the markup renders
// the readable STACKED fallback by default (SSR, no-JS, and reduced motion get
// it as-is). On the client one three-way mode picks the path: "static"
// (reduced motion — today's composed states, zero motion), "mobile" (motion OK
// below lg — stacked layout, but each beat visual mounts on scroll-into-view
// so its one-shots replay, with a sticky progress pill), or "scrub" (motion OK
// at lg+ — the pinned split, driven by the spring-damped scroll timeline). The
// stage is illustrative (aria-hidden); the narrative copy is the a11y source
// of truth in every mode.

// Matches --ease-settle exactly; tokenised so the class speaks the shared vocabulary.
const EASE = "ease-[var(--ease-settle)]";
const FINALE_STEP = STEPS.length;
const STORY_BEATS = STEPS.length + 1;
type ScrollyMode = "static" | "mobile" | "scrub";

// The narrative beat: a mono kicker, a Fraunces heading, one or two sentences.
// In the pinned path the inactive steps dim so the active one reads; in the
// stacked fallback every step reads at full strength.
function StepCopy({ step, active }: { step: Step; active: boolean }) {
  return (
    <div
      className={`max-w-[40ch] transition-opacity duration-[var(--motion-feature)] ${EASE} ${
        active ? "opacity-100" : "opacity-40"
      }`}
    >
      <p
        className={`font-mono text-xs uppercase tracking-wide transition-colors duration-[var(--motion-feature)] ${
          active ? "text-forest" : "text-ink-muted"
        }`}
      >
        {step.kicker}
      </p>
      <h2 className="mt-3 font-serif text-3xl font-semibold leading-snug tracking-tight text-ink sm:text-4xl">
        {step.heading}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">{step.body}</p>
    </div>
  );
}

// The quiet close of the scroll story. The page's real proof (the worked
// example on a genuine tender) sits directly below, so this is a bridge, not
// the destination: the copy hands the reader down the page, and the CTA
// demotes to a link so the page keeps one primary action further on.
function ClosingCta() {
  return (
    <div className="mt-20 flex flex-col items-center gap-5 border-t border-hairline pt-12 text-center">
      <p className="max-w-[42ch] text-lg leading-relaxed text-ink-muted">
        That is the whole pipeline. Below, the same pipeline on the real
        Bradwell tender.
      </p>
      <BookDemoButton location="demo-scrolly-closing" variant="link" />
    </div>
  );
}

function FinaleCopy() {
  return (
    <div className="max-w-[40ch]">
      <p className="font-mono text-xs uppercase tracking-wide text-forest">
        Filed
      </p>
      <h2 className="mt-3 font-serif text-3xl font-semibold leading-snug tracking-tight text-ink sm:text-4xl">
        Ready for the real tender
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">
        That is the whole pipeline. Below, the same pipeline runs on a real
        Bradwell tender.
      </p>
      <div className="mt-5">
        <BookDemoButton location="demo-scrolly-finale" variant="link" />
      </div>
    </div>
  );
}

function MobileBeatDots({ active }: { active: number }) {
  return (
    <div
      aria-hidden
      className="sticky top-3 z-20 mx-auto mb-10 flex w-fit items-center gap-3 rounded-full border border-hairline bg-paper-raised/95 px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-ink-muted shadow-[var(--depth-row)] backdrop-blur"
    >
      <span className="tabular-nums">
        {String(active + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
      </span>
      <span className="flex items-center gap-1.5">
        {STEPS.map((step, i) => (
          <span
            key={step.id}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === active ? "bg-forest" : "bg-hairline"
            }`}
          />
        ))}
      </span>
    </div>
  );
}

// `intro` is the page's opening copy, owned by the page and passed in so the
// scrolly can fold it into the layout: in the enhanced path it becomes the
// first block of the narrative column (so the pinned stage is on screen from
// the very first scroll pixel, with no dead viewport between the intro and the
// story); in the stacked fallback it simply renders above the steps. It is NOT
// a [data-step], so the observer and the rail ignore it.
export function DemoScrolly({ intro }: { intro?: React.ReactNode }) {
  const [activeStep, setActiveStep] = useState(0);
  const [mode, setMode] = useState<ScrollyMode>("static");
  const narrativeRef = useRef<HTMLDivElement>(null);
  const { beat, smoothBeat } = useScrollTimeline(narrativeRef, STORY_BEATS);

  // Decide whether to enhance: wide viewport AND motion allowed. Read on the
  // client only, and keep it live so resizing or toggling reduced motion in
  // dev switches paths cleanly.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const sync = () => {
      if (!motion.matches) setMode("static");
      else setMode(wide.matches ? "scrub" : "mobile");
    };
    sync();
    wide.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  // The continuous beat drives the stage. The rounded beat still powers the
  // rail and the existing one-shot details, so the old CSS choreography remains
  // useful without controlling the film.
  const scrub = mode === "scrub";
  const mobile = mode === "mobile";

  useBeatStep(beat, scrub, STORY_BEATS, setActiveStep);

  useEffect(() => {
    if (!mobile) return;
    const root = narrativeRef.current;
    if (!root) return;
    const steps = Array.from(
      root.querySelectorAll<HTMLElement>("[data-mobile-step]"),
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveStep(Number((entry.target as HTMLElement).dataset.mobileStep ?? "0"));
          }
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    steps.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mobile]);

  // Fallback (default / mobile / reduced motion): steps in normal flow, each
  // followed by its own beat visual in its composed final state. No pinning,
  // no observer, reads perfectly with zero motion.
  if (!scrub) {
    return (
      <div ref={narrativeRef} className="mx-auto max-w-[40rem] px-6 py-8">
        {mobile ? <MobileBeatDots active={activeStep} /> : null}
        {intro ? <div className="mb-16">{intro}</div> : null}
        <ol className="flex flex-col gap-16">
          {STEPS.map((step, i) => (
            <li key={step.id} data-mobile-step={i}>
              <StepCopy step={step} active />
              <MountOnView enabled={mobile} minHeight={300}>
                <div className="mt-6 flex justify-center" aria-hidden inert>
                  <BeatVisual step={i} animate={mobile} />
                </div>
              </MountOnView>
            </li>
          ))}
        </ol>
        <ClosingCta />
      </div>
    );
  }

  // Enhanced (wide + motion): a split layout. Tall narrative steps scroll on
  // the left; the stage stays pinned and centred on the right, transforming
  // as the active step changes.
  return (
    <div className="mx-auto max-w-[1160px] px-6">
      <div className="grid grid-cols-[minmax(18rem,24rem)_1fr] gap-12 xl:gap-16">
        <div ref={narrativeRef} className="relative">
          {intro ? (
            <div className="flex min-h-[calc(100vh-8rem)] flex-col justify-center">
              {intro}
            </div>
          ) : null}
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              data-step={i}
              className="flex min-h-[80vh] flex-col justify-center py-12"
            >
              <StepCopy step={step} active={i === activeStep} />
            </div>
          ))}
          <div
            data-step={FINALE_STEP}
            className="flex min-h-[90vh] flex-col justify-center py-12"
          >
            <FinaleCopy />
          </div>
        </div>
        <div>
          <div className="sticky top-0 flex h-screen items-center justify-center">
            <ScrollyStage step={activeStep} beat={smoothBeat} />
          </div>
        </div>
      </div>
    </div>
  );
}
