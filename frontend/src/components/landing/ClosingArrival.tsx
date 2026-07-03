"use client";

import { useEffect, useRef } from "react";

import { BookDemoButton } from "./BookDemoButton";
import { DrawOn } from "./DrawOn";
import { Reveal } from "./Reveal";
import { PineBranch } from "./art/PineBranch";
import { Seal } from "./art/Seal";
import { TreelineDivider } from "./art/TreelineDivider";

// The closing as an arrival, not a section (Pine band 2): when the band scrolls
// in, two foreground tree silhouettes part outward, warm light blooms in the
// centre, and the response card rises into it under a lantern halo, with a few
// fireflies drifting on the pine ground. The choreography is the Reveal
// contract writ large: the composed, arrived state is the default markup; the
// "out" states are armed client-side only (and only when motion is allowed),
// then a one-shot IntersectionObserver flips data-arrive to "in". SSR, no-JS,
// and reduced motion all land on the finished clearing.

const CONTAINER = "mx-auto w-full max-w-[1160px] px-4 sm:px-6";

export function ClosingArrival() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.arrive = "out";
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.arrive = "in";
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="closing-forest relative overflow-hidden border-t border-paper/10 bg-pine"
    >
      <span aria-hidden className="closing-forest__image absolute inset-0" />
      <span aria-hidden className="closing-forest__shadow absolute inset-0" />
      <span aria-hidden className="closing-forest__bloom absolute inset-0" />
      <span
        aria-hidden
        className="closing-forest__silhouette closing-forest__silhouette--l"
      />
      <span
        aria-hidden
        className="closing-forest__silhouette closing-forest__silhouette--r"
      />
      <span aria-hidden className="closing-firefly closing-firefly--1 hidden lg:block" />
      <span aria-hidden className="closing-firefly closing-firefly--2 hidden lg:block" />
      <span aria-hidden className="closing-firefly closing-firefly--3 hidden lg:block" />
      <span aria-hidden className="closing-firefly closing-firefly--4 hidden lg:block" />
      <TreelineDivider
        flip
        className="absolute inset-x-0 top-0 h-16 w-full text-pine-deep/25 sm:h-24"
      />
      <DrawOn className="pointer-events-none absolute -left-12 -top-8">
        <PineBranch className="h-44 w-auto text-paper/[0.11]" />
      </DrawOn>
      <div className={`${CONTAINER} relative z-10 py-24 sm:py-32`}>
        <Seal
          id="seal-closing"
          className="absolute right-[6%] top-1/2 hidden h-52 w-52 -translate-y-1/2 rotate-[7deg] text-paper/25 lg:block"
        />
        <Reveal className="closing-card-rise">
          <div className="closing-card-frame relative z-10 mx-auto max-w-[720px]">
            <span aria-hidden className="closing-forest__halo" />
            <div className="surface-grain closing-card relative rounded-lg border border-hairline bg-paper-raised p-8 text-center shadow-[var(--depth-sheet)] sm:p-11">
              <p className="mx-auto mb-4 font-mono text-xs uppercase tracking-[0.2em] text-forest/85">
                You&apos;ve reached the clearing
              </p>
              <h2 className="mx-auto max-w-[18ch] text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
                See it on a tender you already know
              </h2>
              <p className="mx-auto mt-5 max-w-[44ch] text-lg leading-relaxed text-ink-muted">
                Bring a tender you have already bid. In fifteen minutes, you
                will see the gates, sources, and answer record resolve in front
                of you.
              </p>
              <div className="mt-8 flex justify-center">
                <BookDemoButton location="closing" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
