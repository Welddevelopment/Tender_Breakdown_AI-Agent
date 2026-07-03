"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { Seal } from "./art/Seal";

// The hero's layered forest backdrop, extracted from Landing so the scene can
// move: woodland, scrim, graph grid, canopy shadow, foreground arch, and the
// fern understory. On fine pointers at >=1024px (and only when motion is
// allowed) the layers get true depth — scroll parallax at different rates plus
// a slight spring-smoothed pointer drift — so the headline sits in the forest
// rather than on a photograph. Everywhere else this renders the exact static
// markup the server sent: SSR, mobile, touch, and reduced motion all land on
// the composed still scene. The dawn wash and the canopy drift are pure CSS on
// the painted spans themselves (globals.css), so they need no JS here.
//
// Each parallaxed layer is pre-scaled slightly so its edges never pull away
// from the band while it travels; the leaf shadow keeps its own inner span
// because the CSS canopy-drift animation owns that element's transform.

const ENHANCE_QUERY = "(min-width: 1024px) and (pointer: fine)";
const MOTION_OK_QUERY = "(prefers-reduced-motion: no-preference)";

export function ForestHeroLayers() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const queries = [
      window.matchMedia(ENHANCE_QUERY),
      window.matchMedia(MOTION_OK_QUERY),
    ];
    const update = () => setEnhanced(queries.every((q) => q.matches));
    update();
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Pointer drift: -1..1 across the viewport, spring-smoothed so the forest
  // sways rather than tracks.
  const pointerX = useMotionValue(0);
  const mx = useSpring(pointerX, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (!enhanced) return;
    const onMove = (e: PointerEvent) => {
      pointerX.set((e.clientX / window.innerWidth) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enhanced, pointerX]);

  // Far layers drift down and with the pointer; near layers rise against the
  // scroll and counter the pointer, which is what reads as depth.
  const woodlandY = useTransform(scrollYProgress, [0, 1], [0, 26]);
  const leafY = useTransform(scrollYProgress, [0, 1], [0, 44]);
  const foregroundY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const botanicalsY = useTransform(scrollYProgress, [0, 1], [0, -64]);
  const woodlandX = useTransform(mx, (v) => v * 6);
  const leafX = useTransform(mx, (v) => v * 8);
  // The foreground's resting CSS transform is translateX(-50%); the inline
  // motion transform replaces it, so the centring is folded in here.
  const foregroundX = useTransform(mx, (v) => `calc(-50% + ${v * -10}px)`);
  const botanicalsX = useTransform(mx, (v) => v * -12);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
    >
      {enhanced ? (
        <>
          <motion.span
            className="forest-hero__woodland absolute inset-0 will-change-transform"
            style={{ y: woodlandY, x: woodlandX, scale: 1.05 }}
          />
          <span className="forest-hero__scrim absolute inset-0" />
          <span className="forest-hero__grid absolute inset-0" />
          <motion.span
            className="absolute inset-x-0 top-0 z-[3] h-[58%] will-change-transform"
            style={{ y: leafY, x: leafX, scale: 1.08 }}
          >
            <span className="forest-hero__leaf-shadow absolute inset-0" />
          </motion.span>
          <motion.span
            className="forest-hero__foreground absolute inset-x-0 bottom-0 h-[34%] will-change-transform"
            style={{ x: foregroundX, y: foregroundY, scale: 1.08 }}
          />
          <motion.span
            className="forest-hero__botanicals absolute inset-x-0 bottom-0 h-[48%] will-change-transform"
            style={{ y: botanicalsY, x: botanicalsX, scale: 1.05 }}
          />
        </>
      ) : (
        <>
          <span className="forest-hero__woodland absolute inset-0" />
          <span className="forest-hero__scrim absolute inset-0" />
          <span className="forest-hero__grid absolute inset-0" />
          <span className="forest-hero__leaf-shadow absolute inset-x-0 top-0 h-[58%]" />
          <span className="forest-hero__foreground absolute inset-x-0 bottom-0 h-[34%]" />
          <span className="forest-hero__botanicals absolute inset-x-0 bottom-0 h-[48%]" />
        </>
      )}
      <span className="forest-hero__dawn absolute inset-0" />
      <Seal
        id="seal-hero"
        className="absolute left-[6%] top-[43%] hidden h-32 w-32 -translate-y-1/2 -rotate-[8deg] text-paper/[0.14] md:block lg:h-44 lg:w-44"
      />
    </div>
  );
}
