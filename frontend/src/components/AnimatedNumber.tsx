"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

// A count that ticks to its value on a spring instead of jumping — the header
// triage-line counts and the "verified X of Y" line. `from` sets the mount
// value (the staged reveal keys these by tender and passes from={0}, so the
// counters tick up from zero once per tender, never on decision re-renders).
// Reduced motion jumps straight to the value — no tick, matching the repo's
// prefers-reduced-motion discipline. Server markup always shows the mount
// value, so hydration stays consistent; suppressHydrationWarning covers the
// reduced-motion jump.
export function AnimatedNumber({
  value,
  from,
  className,
}: {
  value: number;
  from?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const count = useMotionValue(from ?? value);
  const rounded = useTransform(count, (v) => String(Math.round(v)));

  useEffect(() => {
    if (reduced) {
      count.jump(value);
      return;
    }
    const controls = animate(count, value, {
      type: "spring",
      stiffness: 110,
      damping: 22,
    });
    return () => controls.stop();
  }, [value, reduced, count]);

  return (
    <motion.span className={className} suppressHydrationWarning>
      {rounded}
    </motion.span>
  );
}
