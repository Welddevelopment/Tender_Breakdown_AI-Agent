"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addTeamMember,
  createTeam,
  getTeamMembers,
  getTeams,
  isApiEnabled,
  removeTeamMember,
  type Team,
  type TeamMember,
} from "@/lib/api";
import { collaboratorFor } from "@/lib/collaborators";

// Persistent teams: create a team, add authenticated teammates to it once, and every
// tender shared with the team is visible to all of them (the sharing happens from a
// tender's Share control). Live-product only — the mock/showcase build has no accounts,
// so it degrades to an honest note. Owner-only actions (add / remove) are hidden for
// members; the backend enforces the same rule regardless.

export function TeamsManager() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Used by event handlers (create) to refetch after a change.
  const refreshTeams = useCallback(async () => {
    try {
      const t = await getTeams();
      setTeams(t);
      setSelectedId((cur) => cur ?? (t[0]?.id ?? null));
    } catch {
      setError("Couldn't load your teams. Check the connection, then try again.");
    }
  }, []);

  // Initial load — setState lands in the promise callback (past the async boundary),
  // the codebase's pattern for effect-driven fetches (see TendersList).
  useEffect(() => {
    if (!isApiEnabled()) return;
    let cancelled = false;
    getTeams()
      .then((t) => {
        if (cancelled) return;
        setTeams(t);
        setSelectedId((cur) => cur ?? (t[0]?.id ?? null));
      })
      .catch(() => {
        if (!cancelled)
          setError("Couldn't load your teams. Check the connection, then try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    setError(null);
    try {
      const team = await createTeam(name);
      setNewName("");
      await refreshTeams();
      setSelectedId(team.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the team.");
    } finally {
      setCreating(false);
    }
  }

  if (!isApiEnabled()) {
    return (
      <p className="max-w-[60ch] text-sm text-ink-muted">
        Teams let you share tenders with a group of teammates at once. They appear
        here once Bidframe is connected to the live reader — this preview has no
        accounts to add.
      </p>
    );
  }

  const selected = teams?.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      {/* Left: create + list */}
      <section aria-label="Your teams">
        <form onSubmit={onCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setError(null);
            }}
            placeholder="New team name"
            aria-label="New team name"
            className="min-w-0 flex-1 rounded-md border border-hairline bg-paper-raised px-3 py-2 text-sm text-ink shadow-[var(--depth-control)] outline-none transition-colors focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/40"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="shrink-0 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper shadow-[var(--depth-control)] transition-colors hover:bg-forest-hover disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-signal-oxblood">{error}</p>}

        {teams === null ? (
          <p className="mt-6 text-sm text-ink-muted">Loading your teams…</p>
        ) : teams.length === 0 ? (
          <p className="mt-6 text-sm text-ink-muted">
            No teams yet. Create one, then add teammates by email.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col">
            {teams.map((team) => {
              const active = team.id === selectedId;
              return (
                <li
                  key={team.id}
                  className="border-t border-hairline first:border-t-0"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(team.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-center justify-between gap-3 px-2 py-3 text-left transition-colors hover:bg-paper-raised ${
                      active ? "bg-paper-raised" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-base font-medium text-ink">
                        {team.name}
                      </span>
                      <span className="font-mono text-xs text-ink-muted">
                        {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
                        {" · "}
                        {team.myRole}
                      </span>
                    </span>
                    {active && (
                      <span aria-hidden className="shrink-0 font-mono text-xs text-forest">
                        ←
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Right: selected team's members */}
      <section aria-label="Team members">
        {selected ? (
          <TeamDetail
            key={selected.id}
            team={selected}
            onChanged={refreshTeams}
          />
        ) : (
          <p className="text-sm text-ink-muted">
            Select a team to see its members.
          </p>
        )}
      </section>
    </div>
  );
}

function TeamDetail({ team, onChanged }: { team: Team; onChanged: () => void }) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isOwner = team.myRole === "owner";

  useEffect(() => {
    let cancelled = false;
    getTeamMembers(team.id)
      .then((m) => {
        if (!cancelled) setMembers(m);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the team's members.");
      });
    return () => {
      cancelled = true;
    };
  }, [team.id]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setMembers(await addTeamMember(team.id, value));
      setEmail("");
      setNotice(`Added ${value}.`);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add them.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(memberId: string) {
    setError(null);
    setNotice(null);
    try {
      setMembers(await removeTeamMember(team.id, memberId));
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove them.");
    }
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold leading-tight text-ink">
        {team.name}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Everyone here can open and decide on any tender shared with the team.
        {isOwner
          ? " Add teammates by email — they need a Bidframe account first (signing in with Google creates one)."
          : " Only the team owner can add or remove members."}
      </p>

      <ul className="mt-5 flex flex-col gap-2">
        {members === null ? (
          <li className="text-sm text-ink-muted">Loading members…</li>
        ) : (
          members.map((m) => {
            const c = collaboratorFor(m);
            return (
              <li
                key={m.id}
                className="flex items-center gap-2.5 rounded-md border border-hairline bg-paper/80 px-2.5 py-2 text-sm"
              >
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-paper"
                  style={{ backgroundColor: c.color }}
                >
                  {c.initials}
                </span>
                <span className="min-w-0 truncate text-ink">{c.name}</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                  {m.role}
                </span>
                {isOwner && m.role !== "owner" && (
                  <button
                    type="button"
                    onClick={() => onRemove(m.id)}
                    className="rounded-sm font-mono text-[10px] uppercase tracking-wide text-ink-muted underline decoration-hairline underline-offset-2 transition-colors hover:text-signal-oxblood"
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })
        )}
      </ul>

      {isOwner && (
        <form onSubmit={onAdd} className="mt-4 flex flex-col gap-2">
          <label
            htmlFor="add-team-member"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted"
          >
            Add a teammate by email
          </label>
          <div className="flex gap-2">
            <input
              id="add-team-member"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setNotice(null);
              }}
              placeholder="colleague@firm.co.uk"
              className="min-w-0 flex-1 rounded-md border border-hairline bg-paper px-2.5 py-1.5 text-sm text-ink outline-none focus:border-forest"
            />
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="shrink-0 rounded-md bg-forest px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add"}
            </button>
          </div>
          {notice && <p className="text-xs text-forest">{notice}</p>}
          {error && <p className="text-xs text-signal-oxblood">{error}</p>}
        </form>
      )}
      {!isOwner && error && (
        <p className="mt-3 text-xs text-signal-oxblood">{error}</p>
      )}
    </div>
  );
}
