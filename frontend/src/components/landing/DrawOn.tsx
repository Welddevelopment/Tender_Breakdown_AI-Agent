"use client";

import { useEffect, useRef } from "react";

// The engraving counterpart to Reveal: instead of settling content into place,
// it lets the botanical line art below the fold draw itself in as you arrive,
// the way an engraver's stroke crosses the plate. The globals.css draw-on rules
// key off data-draw and the pathLength={1} every art path carries, so a single
// dasharray transition covers all of the sanctioned illustrations.
//
// Accessible by construction: the markup renders with no draw state, so SSR,
// no-JS, and reduced-motion all show the finished engraving. Only on the
// client, and only when motion is allowed, does it arm the hidden start state
// (imperatively, via the ref) and then draw on intersection. The targets sit
// below the fold, so the one-frame arm happens off-screen and is never seen.
// Fires once, then disconnects.

export function DrawOn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.dataset.draw = "hidden";
    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.dataset.draw = "shown";
            obs.disconnect();
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ "--draw-delay": `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </div>
  );
}
