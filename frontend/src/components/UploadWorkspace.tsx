"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { DEMO_TENDER_TITLE } from "@/data/demo-tender";
import { AppMain } from "./AppMain";
import { CurrentTenderStrip } from "./CurrentTenderStrip";
import { DocumentHeader } from "./DocumentHeader";
import { TendersList } from "./TendersList";
import { UploadDropzone } from "./UploadDropzone";

// The upload→matrix resolve (layout.md §9): the one showpiece transition plays
// IN PLACE. When an extraction finishes, the library workspace files itself
// away and the real MatrixView mounts in the same frame — its existing staged
// entrance (rows staggering in, the triage line landing) is the second beat of
// one motion, not a separate page's animation. The URL then flips to /review
// via history.replaceState, which Next's router treats as a shallow update:
// SectionNav re-highlights, refresh lands on the real review page, and nothing
// remounts — so the entrance never double-plays and the counters never re-tick.
//
// MatrixView is dynamically imported and warmed after mount, so the /upload
// route's first paint doesn't carry the matrix bundle but the chunk is long
// since resident by the time an extraction (8s scripted, 30s+ live) resolves.
const MatrixView = dynamic(
  () => import("./MatrixView").then((m) => m.MatrixView),
  { ssr: false }
);

type ResolvePhase = "library" | "filing" | "matrix";

export function UploadWorkspace() {
  const [phase, setPhase] = useState<ResolvePhase>("library");
  const timerRef = useRef<number | null>(null);

  // Warm the matrix chunk while the user is still staging files.
  useEffect(() => {
    import("./MatrixView");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  // The canonical URL follows the resolved surface. replaceState (not push):
  // Back from the matrix should leave the app, not replay the upload.
  useEffect(() => {
    if (phase !== "matrix") return;
    window.history.replaceState(null, "", "/review");
  }, [phase]);

  function beginResolve() {
    if (phase !== "library") return;
    // Reduced motion skips the filing beat and lands on the composed matrix.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("matrix");
      return;
    }
    setPhase("filing");
    timerRef.current = window.setTimeout(() => setPhase("matrix"), 360);
  }

  if (phase === "matrix") {
    return <MatrixView title={DEMO_TENDER_TITLE} />;
  }

  return (
    <div className={phase === "filing" ? "resolve-filing" : undefined}>
      <DocumentHeader title="Tender library" showReference={false} />
      <AppMain>
        {/* One page, two halves: drop a new tender pack at the top, and the
            library of every tender you have uploaded directly beneath it —
            both visible without scrolling. */}
        <div className="mx-auto max-w-2xl pt-6">
          <CurrentTenderStrip />
          <UploadDropzone onResolve={beginResolve} />
        </div>
        <section
          id="your-tenders"
          aria-label="Your tenders"
          className="mx-auto mt-10 max-w-2xl scroll-mt-24"
        >
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
            <h2 className="font-serif text-lg font-semibold leading-snug text-ink">
              Your tenders
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
              Click to reopen
            </p>
          </div>
          <div className="mt-3">
            <TendersList />
          </div>
        </section>
      </AppMain>
    </div>
  );
}
