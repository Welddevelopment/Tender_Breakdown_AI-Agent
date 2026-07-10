"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { actorLabel, collaboratorFor } from "@/lib/collaborators";
import { useTenderActivity } from "@/lib/useTenderActivity";

// The workspace header's Activity control: a compact button carrying a quiet
// action count that opens the team's audit trail in an anchored popover — actor,
// action, object, time, newest first (the record voice, not a chat log). The
// button pulses once when a teammate's event arrives (MOTION.md §Collaboration),
// then rests. Self-hides until there is recorded activity, so API-off surfaces
// (frozen worked-example, hero embed, /demo) render nothing. Promoted out of the
// /review body so activity is reachable from every app route (UI Stage 2).

const VERB: Record<string, string> = {
  approve: "approved",
  edit: "edited",
  flag: "flagged",
};

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

export function ActivityControl() {
  const { entries, pulsingIds } = useTenderActivity();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Any pulsing id = a teammate event landed while the trail was closed; the
  // trigger itself pulses once so the header reads "something changed".
  const hasNew = pulsingIds.size > 0;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  if (entries.length === 0) return null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`ui-btn inline-flex items-center gap-1.5 rounded-md border border-hairline bg-paper-raised px-2.5 py-1.5 text-sm text-ink shadow-[var(--depth-control)] hover:border-forest hover:text-forest${
          hasNew ? " moss-pulse" : ""
        }`}
      >
        Activity
        <span className="font-mono text-xs text-ink-muted">
          {entries.length}
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Team activity"
          className="panel-enter absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] rounded-lg border border-ink/20 bg-paper-raised shadow-[var(--depth-sheet)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Activity
              <span className="ml-2 normal-case tracking-normal text-ink-muted/80">
                {entries.length} action{entries.length === 1 ? "" : "s"}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="rounded border border-hairline bg-paper px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted transition-colors hover:border-forest hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            >
              Close
            </button>
          </div>
          <ul className="flex max-h-72 flex-col gap-2.5 overflow-y-auto px-4 py-3">
            {entries.slice(0, 12).map((entry) => {
              const who = actorLabel(entry.actor, user?.id);
              const collab = entry.actor ? collaboratorFor(entry.actor) : null;
              const clipped =
                entry.text.length > 64
                  ? `${entry.text.slice(0, 64)}...`
                  : entry.text;
              // Pulse once when this entry arrives after the live gate opens.
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
        </div>
      )}
    </div>
  );
}
