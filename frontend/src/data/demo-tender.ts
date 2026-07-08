import type { Tender } from "@/types/requirement";

// The one place the app lazy-loads the no-backend demo tender (the Bradwell
// prebake). A dynamic import keeps the ~42K JSON out of the shared client
// bundle every authed route pays for (pilot-roadmap/frontend-jawad.md A2) —
// callers pull it only when the mock seed or the scripted upload replay
// actually needs it. Server components (review/demo/pitch/showcase pages) keep
// their own direct imports; those are route-scoped and don't leak.
let cached: Promise<Tender> | null = null;

export function loadDemoTender(): Promise<Tender> {
  if (!cached) {
    cached = import("@/data/bradwell-prebake.json").then(
      (m) => m.default as unknown as Tender
    );
  }
  return cached;
}

// Static metadata for surfaces that need a label before (or without) the full
// tender payload. Keep in sync with bradwell-prebake.json.
export const DEMO_TENDER_TITLE =
  "Grounds Maintenance Tender – Bradwell Common & Heelands (Demo)";
