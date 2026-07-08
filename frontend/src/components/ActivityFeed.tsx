"use client";

// Collaboration activity: who did what, newest first. Live tenders read the
// backend's append-only activity timeline; mock/frozen tenders derive a small
// personal log from each requirement's latest decision.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import { useAuth } from "@/context/AuthContext";
import {
  isApiEnabled,
  listTenderActivity,
  type TenderActivityEvent,
} from "@/lib/api";
import { actorLabel, collaboratorFor } from "@/lib/collaborators";
import type { Actor } from "@/types/requirement";

const VERB: Record<string, string> = {
  approve: "approved",
  edit: "edited",
  flag: "flagged",
};

interface FeedEntry {
  id: string;
  text: string;
  action: string;
  note?: string | null;
  timestamp: string;
  actor?: Actor | null;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function ActivityFeed() {
  const { requirements, tenderId } = useRequirements();
  const { user } = useAuth();
  const [open, setOpen] = useState(true);
  const [activity, setActivity] = useState<{
    tenderId: string;
    events: TenderActivityEvent[];
  } | null>(null);

  // Moss-pulse gate (MOTION.md §Collaboration): IDs currently in their pulse window.
  // State (not ref) so it is safe to read during render. Refs below are private to
  // effects — they track which IDs are already seen and whether the gate is open.
  const [pulsingIds, setPulsingIds] = useState<ReadonlySet<string>>(new Set());
  // IDs visible at mount or on the first server load — these are stale and must never pulse.
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

  const derivedEntries: FeedEntry[] = requirements
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
  const serverEntries: FeedEntry[] | null =
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

  // Seed seenIds with whatever entries are visible at initial mount (derived from
  // local decision state). These are pre-existing and must never pulse.
  // Intentional empty-deps: one-time snapshot; entries closure value at mount is correct.
  useEffect(() => {
    entries.forEach((e) => seenIdsRef.current.add(e.id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Each time server activity arrives: on first call (gate closed) absorb the full
  // batch without pulsing — those are the initial stale load. On subsequent calls
  // (gate open) new IDs are not yet in seenIds so they pulse; this effect then
  // marks them seen and schedules cleanup after --motion-panel (240ms) + buffer.
  // Intentional [activity] only: entries is derived from activity so closure is fresh.
  useEffect(() => {
    if (!activity) return;
    if (!liveGateRef.current) {
      // First server load: absorb without pulsing, open the gate.
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

  if (entries.length === 0) return null;

  return (
    <section
      aria-label="Team activity"
      className="rounded-lg border border-hairline bg-paper-raised shadow-[var(--depth-sheet)]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          Activity
          <span className="ml-2 normal-case tracking-normal text-ink-muted/80">
            {entries.length} action{entries.length === 1 ? "" : "s"}
          </span>
        </h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="font-mono text-[11px] uppercase tracking-wide text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open && (
        <ul className="flex max-h-52 flex-col gap-2.5 overflow-y-auto px-4 pb-4">
          {entries.slice(0, 12).map((entry) => {
            const who = actorLabel(entry.actor, user?.id);
            const collab = entry.actor ? collaboratorFor(entry.actor) : null;
            const clipped =
              entry.text.length > 64
                ? `${entry.text.slice(0, 64)}...`
                : entry.text;
            // Pulse once when this entry arrives after the live gate opens.
            // Pre-existing entries (seeded at mount or on first server load) never pulse.
            const isNew = pulsingIds.has(entry.id);
            return (
              <li
                key={entry.id}
                className={`flex items-start gap-2.5${isNew ? " moss-pulse" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-paper"
                  style={{
                    backgroundColor: collab?.color ?? "var(--color-ink-muted)",
                  }}
                >
                  {collab?.initials ?? "-"}
                </span>
                <p className="min-w-0 text-sm leading-snug text-ink">
                  <span className="font-medium">{who}</span>{" "}
                  <span className="text-ink-muted">
                    {VERB[entry.action] ?? entry.action}
                  </span>{" "}
                  <span className="italic">&ldquo;{clipped}&rdquo;</span>
                  <span className="ml-1 font-mono text-[11px] text-ink-muted">
                    · {timeAgo(entry.timestamp)}
                  </span>
                  {entry.note ? (
                    <span className="block truncate text-xs text-ink-muted">
                      {entry.note}
                    </span>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
