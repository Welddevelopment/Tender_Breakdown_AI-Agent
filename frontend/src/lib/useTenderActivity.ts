import { useEffect, useMemo, useRef, useState } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import {
  isApiEnabled,
  listTenderActivity,
  type TenderActivityEvent,
} from "@/lib/api";
import type { Actor } from "@/types/requirement";

// The team's activity trail as data, shared by every surface that shows "who did
// what" (the workspace-header Activity control). Live tenders read the backend's
// append-only timeline; mock/frozen tenders derive a small personal log from each
// requirement's latest decision. Extracted from the old ActivityFeed section so
// the moss-pulse gate (MOTION.md §Collaboration) is defined once, not per view.

export interface ActivityEntry {
  id: string;
  text: string;
  action: string;
  note?: string | null;
  timestamp: string;
  actor?: Actor | null;
}

export function useTenderActivity(): {
  entries: ActivityEntry[];
  // IDs currently inside their one-shot moss-pulse window (a teammate's new
  // event). State, not a ref, so callers can read it during render.
  pulsingIds: ReadonlySet<string>;
} {
  const { requirements, tenderId } = useRequirements();
  const [activity, setActivity] = useState<{
    tenderId: string;
    events: TenderActivityEvent[];
  } | null>(null);

  const [pulsingIds, setPulsingIds] = useState<ReadonlySet<string>>(new Set());
  // IDs visible at mount or on the first server load — stale, must never pulse.
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Opens once the initial server batch is absorbed; only after that do new IDs pulse.
  const liveGateRef = useRef(false);

  const requirementsById = useMemo(
    () => new Map(requirements.map((req) => [req.id, req])),
    [requirements]
  );
  const decisionRefreshKey = requirements
    .map((req) => `${req.id}:${req.decision?.timestamp ?? ""}`)
    .join("|");

  useEffect(() => {
    if (!tenderId || !isApiEnabled()) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      listTenderActivity(tenderId)
        .then((events) => {
          if (!cancelled) setActivity({ tenderId, events });
        })
        .catch(() => {});
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tenderId, decisionRefreshKey]);

  const derivedEntries: ActivityEntry[] = requirements
    .filter((r) => r.decision)
    .map((r) => ({
      id: r.id,
      text: r.text,
      action: r.decision!.action,
      note: r.decision!.note,
      timestamp: r.decision!.timestamp,
      actor: r.decision!.actor ?? null,
    }))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  const liveEvents = activity?.tenderId === tenderId ? activity.events : null;
  const serverEntries: ActivityEntry[] | null =
    liveEvents?.map((event) => {
      const req = requirementsById.get(event.req_id);
      return {
        id: event.id,
        text: req?.text ?? event.req_id,
        action: event.action,
        note: event.note,
        timestamp: event.timestamp,
        actor: event.actor ?? null,
      };
    }) ?? null;

  const entries =
    serverEntries && serverEntries.length > 0 ? serverEntries : derivedEntries;

  // Seed seenIds with whatever is visible at initial mount (local decision
  // state). Pre-existing, must never pulse. One-time snapshot; the entries
  // closure value at mount is correct.
  useEffect(() => {
    entries.forEach((e) => seenIdsRef.current.add(e.id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Each server load: first call (gate closed) absorbs the batch without pulsing
  // — the initial stale load. Subsequent calls (gate open) surface genuinely new
  // IDs, pulse them, mark them seen, and clear after --motion-panel (240ms) + buffer.
  // Intentional [activity] only: entries is derived from activity so the closure is fresh.
  useEffect(() => {
    if (!activity) return;
    if (!liveGateRef.current) {
      entries.forEach((e) => seenIdsRef.current.add(e.id));
      liveGateRef.current = true;
      return;
    }
    const newIds = entries
      .map((e) => e.id)
      .filter((id) => !seenIdsRef.current.has(id));
    entries.forEach((e) => seenIdsRef.current.add(e.id));
    if (newIds.length === 0) return;
    setPulsingIds((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });
    const t = window.setTimeout(() => {
      setPulsingIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.delete(id));
        return next;
      });
    }, 280); // outlasts --motion-panel (240ms) so animation completes cleanly
    return () => window.clearTimeout(t);
  }, [activity]); // eslint-disable-line react-hooks/exhaustive-deps

  return { entries, pulsingIds };
}
