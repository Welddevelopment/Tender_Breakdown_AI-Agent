"use client";

// Share a tender with another Bidframe account (collaboration). Live-product only — hidden on the
// frozen/mock build where there's no backend to grant access. Owner invites by email; everyone with
// access is shown as a coloured avatar. The backend enforces owner-only + registered-account.

import { useEffect, useRef, useState } from "react";
import {
  getTeams,
  isApiEnabled,
  listMembers,
  shareTender,
  shareTenderWithTeam,
  type Team,
  type TenderMember,
} from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";
import { collaboratorFor } from "@/lib/collaborators";

export function ShareControl() {
  const { tenderId } = useRequirements();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<TenderMember[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamBusy, setTeamBusy] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Moss-pulse gate (MOTION.md §Collaboration): IDs currently in their pulse window.
  // State (not ref) so it is safe to read during render. Refs below are private to
  // event handlers — they track which IDs are already seen (initial load snapshot).
  const [pulsingMemberIds, setPulsingMemberIds] = useState<ReadonlySet<string>>(
    new Set()
  );
  // IDs present in the initial listMembers call — chips from this load must never pulse.
  const initialMemberIdsRef = useRef<Set<string>>(new Set());
  const membersLoadedRef = useRef(false);

  const enabled = isApiEnabled() && !!tenderId;

  useEffect(() => {
    if (!enabled || !tenderId) return;
    listMembers(tenderId)
      .then((m) => {
        setMembers(m);
        // Snapshot initial member IDs once — chips from this load are pre-existing
        // and must never pulse.
        if (!membersLoadedRef.current) {
          membersLoadedRef.current = true;
          initialMemberIdsRef.current = new Set(m.map((mem) => mem.id));
        }
      })
      .catch(() => setMembers([]));
    getTeams().then(setTeams).catch(() => setTeams([]));
  }, [enabled, tenderId]);

  // Mark newly-added member IDs for a one-time moss-pulse, then clear after the
  // animation window (--motion-panel 240ms + buffer). Called from async handlers,
  // not during render, so ref access here is safe.
  function markNewMembers(nextMembers: TenderMember[]) {
    const newIds = nextMembers
      .map((m) => m.id)
      .filter((id) => !initialMemberIdsRef.current.has(id));
    if (newIds.length === 0) return;
    setPulsingMemberIds((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });
    window.setTimeout(() => {
      setPulsingMemberIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => {
          next.delete(id);
          // Promote to initialIds so reopening the dialog never re-pulses the chip.
          initialMemberIdsRef.current.add(id);
        });
        return next;
      });
    }, 280); // slightly past --motion-panel (240ms) so animation completes cleanly
  }

  async function shareWithTeam(team: Team) {
    if (!tenderId || teamBusy) return;
    setTeamBusy(team.id);
    setError(null);
    setSuccess(null);
    try {
      await shareTenderWithTeam(tenderId, team.id);
      const nextMembers = await listMembers(tenderId);
      markNewMembers(nextMembers);
      setMembers(nextMembers);
      setSuccess(`Shared with ${team.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't share with the team.");
    } finally {
      setTeamBusy(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!enabled) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenderId || !email.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const nextMembers = await shareTender(tenderId, email.trim());
      const sharedWith = email.trim();
      markNewMembers(nextMembers);
      setMembers(nextMembers);
      setEmail("");
      setSuccess(`Shared with ${sharedWith}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't share.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-md border border-hairline bg-paper-raised px-3 py-1.5 text-sm text-ink shadow-[var(--depth-control)] transition-colors hover:border-forest hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
      >
        <span className="flex -space-x-1" aria-hidden>
          {members.slice(0, 3).map((member) => {
            const c = collaboratorFor(member);
            return (
              <span
                key={member.id}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-paper font-mono text-[8px] font-semibold text-paper"
                style={{ backgroundColor: c.color }}
              >
                {c.initials}
              </span>
            );
          })}
          {members.length === 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-paper bg-ink-muted font-mono text-[8px] font-semibold text-paper">
              Y
            </span>
          )}
        </span>
        Share tender
        {members.length > 1 && (
          <span className="font-mono text-xs text-ink-muted">{members.length}</span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/18 px-4 pt-24 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-tender-title"
            className="panel-enter surface-grain w-full max-w-md rounded-md border border-ink/25 bg-paper-raised p-5 shadow-[var(--depth-sheet)]"
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-hairline pb-3">
              <div>
                <h2
                  id="share-tender-title"
                  className="font-serif text-xl leading-tight text-ink"
                >
                  Share this tender
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  Invite a colleague with a Bidframe account. Decisions stay
                  attributed to each person.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-hairline bg-paper px-2 py-1 font-mono text-xs uppercase tracking-wide text-ink-muted transition-colors hover:border-forest hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
              >
                Close
              </button>
            </div>

            <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              People with access
            </p>
            <ul className="mb-4 flex flex-col gap-2">
              {members.map((m) => {
                const c = collaboratorFor(m);
                // Pulse once when a newly-invited member chip first appears.
                // Chips present in the initial listMembers response never pulse.
                const isNew = pulsingMemberIds.has(m.id);
                return (
                  <li
                    key={m.id}
                    className={`flex items-center gap-2.5 rounded-md border border-hairline bg-paper/80 px-2.5 py-2 text-sm${isNew ? " moss-pulse" : ""}`}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-paper"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.initials}
                    </span>
                    <span className="min-w-0 truncate text-ink">{c.name}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                      {m.role}
                    </span>
                  </li>
                );
              })}
              {members.length === 0 && (
                <li className="rounded-md border border-hairline bg-paper/80 px-2.5 py-2 text-sm text-ink-muted">
                  Just you, for now.
                </li>
              )}
            </ul>

            <form onSubmit={submit} className="flex flex-col gap-2">
              <label
                htmlFor="share-email"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted"
              >
                Invite by email
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  id="share-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSuccess(null);
                    setError(null);
                  }}
                  placeholder="colleague@firm.co.uk"
                  className="min-w-0 flex-1 rounded-md border border-hairline bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-forest focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="rounded-md bg-forest px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover disabled:opacity-50"
                >
                  {busy ? "Sharing" : "Share"}
                </button>
              </div>
              {success && <p className="text-xs text-forest">{success}</p>}
              {error && <p className="text-xs text-signal-oxblood">{error}</p>}
              <p className="text-[11px] text-ink-muted">
                The server grants access and records who made each decision.
              </p>
            </form>

            {teams.length > 0 && (
              <div className="mt-5 border-t border-hairline pt-4">
                <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Or share with a team
                </p>
                <ul className="flex flex-col gap-2">
                  {teams.map((team) => (
                    <li
                      key={team.id}
                      className="flex items-center gap-2.5 rounded-md border border-hairline bg-paper/80 px-2.5 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate text-ink">{team.name}</span>
                      <span className="font-mono text-[10px] text-ink-muted">
                        {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
                      </span>
                      <button
                        type="button"
                        onClick={() => shareWithTeam(team)}
                        disabled={teamBusy !== null}
                        className="ml-auto shrink-0 rounded-md border border-hairline bg-paper px-2.5 py-1 font-mono text-[11px] font-medium text-ink transition-colors hover:border-forest hover:text-forest disabled:opacity-50"
                      >
                        {teamBusy === team.id ? "Sharing…" : "Share"}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-ink-muted">
                  Everyone on the team gets access. Manage teams under{" "}
                  <span className="font-medium text-ink">Teams</span> in the header.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
