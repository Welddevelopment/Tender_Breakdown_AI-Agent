"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { TreelineDivider } from "@/components/landing/art/TreelineDivider";
import { DEMO_FACTS } from "./sample";

const PAGE_WORDS: Record<number, string> = {
  13: "Thirteen",
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

function TitleLine({
  children,
  initial = false,
  progress,
  range,
}: {
  children: ReactNode;
  initial?: boolean;
  progress: MotionValue<number>;
  range: [number, number, number, number];
}) {
  const opacity = useTransform(
    progress,
    range,
    initial ? [1, 1, 1, 0] : [0, 1, 1, 0],
  );
  const y = useTransform(
    progress,
    [range[0], range[1]],
    initial ? [0, 0] : [12, 0],
  );
  return (
    <motion.p
      className="font-mono text-2xl uppercase tracking-[0.18em] text-paper sm:text-4xl"
      style={{ opacity, y }}
    >
      {children}
    </motion.p>
  );
}

export function DemoTitleCard() {
  const wrapperRef = useRef<HTMLElement>(null);
  const enhanced = useTitleCardEnhancement();
  const { scrollY } = useScroll();
  const [range, setRange] = useState({ start: 0, end: 1 });
  const progress = useTransform(scrollY, [range.start, range.end], [0, 1], {
    clamp: true,
  });
  const contentOpacity = useTransform(progress, [0, 0.78, 1], [1, 1, 0]);

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
    <section ref={wrapperRef} className="relative h-[170vh] bg-pine">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-6">
        <motion.div
          className="flex flex-col items-center gap-5 text-center"
          style={{ opacity: contentOpacity }}
        >
          <TitleLine initial progress={progress} range={[0, 0.12, 0.2, 0.28]}>
            {lines[0]}
          </TitleLine>
          <TitleLine progress={progress} range={[0.2, 0.32, 0.4, 0.48]}>
            {lines[1]}
          </TitleLine>
          <TitleLine progress={progress} range={[0.4, 0.52, 0.6, 0.68]}>
            {lines[2]}
          </TitleLine>
          <TitleLine progress={progress} range={[0.6, 0.72, 0.82, 0.9]}>
            {lines[3]}
          </TitleLine>
        </motion.div>
      </div>
      <TreelineDivider className="absolute bottom-0 h-16 w-full text-paper sm:h-24" />
    </section>
  );
}
