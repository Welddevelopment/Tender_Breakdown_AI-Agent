"use client";

import { useEffect, useRef } from "react";

// A calm scroll reveal for the landing's two "record" surfaces (the proof ledger
// and the before/after table): the figures settle into place as you arrive, the
// way the rest of the record settles on load. SLOP-CHECK bans fade-up-on-
// everything, so this is used sparingly and only where a sequential fill-in
// reads as the record being written, never on prose.
//
// Accessible by construction: the markup renders with no reveal state, so SSR,
// no-JS, and reduced-motion all show the content already in place. Only on the
// client, and only when motion is allowed, does it arm the hidden start state
// (imperatively, via the ref) and then reveal on intersection. The targets sit
// below the fold, so the one-frame arm happens off-screen and is never seen.
// Fires once, then disconnects.

export function Reveal({
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

    el.dataset.reveal = "hidden";
    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.dataset.reveal = "shown";
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
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </div>
  );
}
