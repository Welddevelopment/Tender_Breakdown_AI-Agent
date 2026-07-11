"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { TreelineDivider } from "@/components/landing/art/TreelineDivider";
import { DEMO_FACTS } from "./sample";

const PAGE_WORDS: Record<number, string> = {
  13: "Thirteen",
  34: "Thirty-four",
};

function useTitleCardEnhancement() {
  const [enhanced, setEnhanced] = useState(false);

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

  return enhanced;
}

// The demo's opening title card. The four lines appear on LOAD (a mount
// stagger — never gated behind scroll, so the fold is never an empty pine
// band); scrolling through the short sticky section drifts the card up and
// fades it out into the treeline. Static/mobile/reduced-motion get a plain
// pine band with all lines visible.
export function DemoTitleCard() {
  const wrapperRef = useRef<HTMLElement>(null);
  const enhanced = useTitleCardEnhancement();
  const { scrollY } = useScroll();
  const [range, setRange] = useState({ start: 0, end: 1 });
  const rawProgress = useTransform(scrollY, [range.start, range.end], [0, 1], {
    clamp: true,
  });
  // Same light damping as the scrolly's beat, so the title card and the film
  // below it share one camera feel.
  // Spring-tuned, not token-mapped: this shapes a continuous physical
  // response (stiffness/damping/mass), not a fixed duration, so it
  // intentionally sits outside the --motion-* ladder — leave as-is.
  const progress = useSpring(rawProgress, {
    stiffness: 160,
    damping: 27,
    mass: 0.4,
    restDelta: 0.001,
  });
  const contentOpacity = useTransform(progress, [0, 0.55, 1], [1, 1, 0]);
  const contentY = useTransform(progress, [0.45, 1], [0, -48]);

  const pageWord = PAGE_WORDS[DEMO_FACTS.pages] ?? String(DEMO_FACTS.pages);
  const lines = [
    "One tender.",
    `${pageWord} pages.`,
    `${DEMO_FACTS.requirements} requirements.`,
    "Watch.",
  ];

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const measure = () => {
      const top = wrapper.getBoundingClientRect().top + window.scrollY;
      setRange({
        start: top,
        end: Math.max(top + 1, top + wrapper.offsetHeight - window.innerHeight),
      });
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(wrapper);
    window.addEventListener("resize", measure);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (!enhanced) {
    return (
      <section className="relative bg-pine px-6 py-20 text-paper">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-4">
          {lines.map((line) => (
            <p
              key={line}
              className="font-mono text-2xl uppercase tracking-[0.18em] sm:text-4xl"
            >
              {line}
            </p>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={wrapperRef} className="relative h-[150vh] bg-pine">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-6">
        <motion.div
          className="flex flex-col items-center gap-5 text-center"
          style={{ opacity: contentOpacity, y: contentY }}
        >
          {lines.map((line, i) => (
            <p
              key={line}
              className="hero-enter font-mono text-2xl uppercase tracking-[0.18em] text-paper sm:text-4xl"
              // Per-line stagger delay, not a duration (the animation itself is
              // .hero-enter's var(--motion-hero)) — ~--motion-process tier
              // (360ms, ~12.5% off), bespoke, left as-is.
              style={{ animationDelay: `${i * 320}ms` }}
            >
              {line}
            </p>
          ))}
        </motion.div>
      </div>
      <TreelineDivider className="absolute bottom-0 h-16 w-full text-paper sm:h-24" />
    </section>
  );
}
