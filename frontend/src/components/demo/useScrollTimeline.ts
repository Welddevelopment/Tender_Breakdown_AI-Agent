"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import {
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

function fallbackAnchors(count: number) {
  if (count <= 1) return [0];
  return Array.from({ length: count }, (_, i) => i * 1000);
}

function isUsableAnchors(anchors: number[], count: number) {
  if (anchors.length !== count) return false;
  return anchors.every((anchor, i) => Number.isFinite(anchor) && (i === 0 || anchor > anchors[i - 1]));
}

// The desktop /demo film is scrubbed from measured narrative anchors. Each
// [data-step] anchor is the page-scroll pixel where that section's centre
// crosses the viewport centre; the returned beat is continuous 0..N-1, so
// stage layers can physically transform between story beats.
export function useScrollTimeline(
  targetRef: RefObject<HTMLElement | null>,
  stepCount: number,
) {
  const [anchors, setAnchors] = useState(() => fallbackAnchors(stepCount));
  const output = useMemo(
    () => Array.from({ length: stepCount }, (_, i) => i),
    [stepCount],
  );

  const { scrollY } = useScroll();

  useEffect(() => {
    const root = targetRef.current;
    if (!root || stepCount <= 0) return;

    const measure = () => {
      const steps = Array.from(
        root.querySelectorAll<HTMLElement>("[data-step]"),
      );
      if (steps.length !== stepCount) {
        setAnchors(fallbackAnchors(stepCount));
        return;
      }

      const rootTop = root.getBoundingClientRect().top + window.scrollY;
      const next = steps.map((el) =>
        Math.max(
          0,
          rootTop + el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2,
        ),
      );
      setAnchors(isUsableAnchors(next, stepCount) ? next : fallbackAnchors(stepCount));
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root);
    Array.from(root.children).forEach((child) => {
      if (child instanceof HTMLElement) resizeObserver.observe(child);
    });
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [targetRef, stepCount]);

  const input = isUsableAnchors(anchors, stepCount)
    ? anchors
    : fallbackAnchors(stepCount);
  const beat = useTransform(scrollY, input, output, { clamp: true });
  // The stage reads a lightly spring-damped copy of the beat, so trackpad
  // notches and wheel steps land as one continuous camera move instead of
  // frame-perfect stutter. Near-critically damped: it settles fast and any
  // small overshoot is absorbed by the clamped useTransform ranges downstream.
  // Discrete consumers (the rounded step, one-shot re-arms) keep the raw beat.
  // Spring-tuned, not token-mapped: stiffness/damping/mass shape a continuous
  // physical response, not a fixed duration, so the --motion-* ladder doesn't
  // apply here — leave these constants as hand-tuned, not "fixed" to a token.
  const smoothBeat = useSpring(beat, {
    stiffness: 160,
    damping: 27,
    mass: 0.4,
    restDelta: 0.001,
  });

  return { beat, smoothBeat, scrollY, anchors };
}

export function useBeatStep(
  beat: MotionValue<number>,
  enabled: boolean,
  stepCount: number,
  onStep: (step: number) => void,
) {
  useMotionValueEvent(beat, "change", (value) => {
    if (!enabled || stepCount <= 0) return;
    const step = Math.max(0, Math.min(stepCount - 1, Math.round(value)));
    onStep(step);
  });
}
