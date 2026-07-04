"use client";

// Collaboration activity: who did what, newest first, derived from each requirement's recorded
// decision (actor + action + timestamp). Read-only — the decision already carries the actor once
// the backend stamps it. On a solo/frozen tender it degrades to a personal action log ("you …").

import { useRequirements } from "@/context/RequirementsContext";
import { useAuth } from "@/context/AuthContext";
import { actorLabel, collaboratorFor } from "@/lib/collaborators";

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

export function ActivityFeed() {
  const { requirements } = useRequirements();
  const { user } = useAuth();

  const entries = requirements
    .filter((r) => r.decision)
    .map((r) => ({ req: r, d: r.decision! }))
    .sort((a, b) => (a.d.timestamp < b.d.timestamp ? 1 : -1));

  if (entries.length === 0) return null;

  return (
    <section
      aria-label="Team activity"
      className="rounded-lg border border-hairline bg-paper-raised p-4 shadow-[var(--depth-sheet)]"
    >
      <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
        Activity
      </h3>
      <ul className="flex flex-col gap-2.5">
        {entries.slice(0, 12).map(({ req, d }) => {
          const who = actorLabel(d.actor, user?.id);
          const collab = d.actor ? collaboratorFor(d.actor) : null;
          return (
            <li key={req.id} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-paper"
                style={{ backgroundColor: collab?.color ?? "var(--color-ink-muted)" }}
              >
                {collab?.initials ?? "•"}
              </span>
              <p className="min-w-0 text-sm leading-snug text-ink">
                <span className="font-medium">{who}</span>{" "}
                <span className="text-ink-muted">{VERB[d.action] ?? d.action}</span>{" "}
                <span className="italic">
                  &ldquo;{req.text.length > 64 ? `${req.text.slice(0, 64)}…` : req.text}&rdquo;
                </span>
                <span className="ml-1 font-mono text-[11px] text-ink-muted">· {timeAgo(d.timestamp)}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
