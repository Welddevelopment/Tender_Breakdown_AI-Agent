"use client";

// Share a tender with another Bidframe account (collaboration). Live-product only — hidden on the
// frozen/mock build where there's no backend to grant access. Owner invites by email; everyone with
// access is shown as a coloured avatar. The backend enforces owner-only + registered-account.

import { useEffect, useState } from "react";
import { isApiEnabled, listMembers, shareTender, type TenderMember } from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";
import { collaboratorFor } from "@/lib/collaborators";

export function ShareControl() {
  const { tenderId } = useRequirements();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<TenderMember[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const enabled = isApiEnabled() && !!tenderId;

  useEffect(() => {
    if (!open || !enabled || !tenderId) return;
    listMembers(tenderId).then(setMembers).catch(() => setMembers([]));
  }, [open, enabled, tenderId]);

  if (!enabled) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenderId || !email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setMembers(await shareTender(tenderId, email.trim()));
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't share.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-md border border-hairline bg-paper-raised px-3 py-1.5 text-sm text-ink transition-colors hover:border-forest hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
      >
        <span aria-hidden="true">👥</span>
        Share
        {members.length > 1 && (
          <span className="font-mono text-xs text-ink-muted">{members.length}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-hairline bg-paper-raised p-4 shadow-[var(--depth-sheet)]">
          <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            People with access
          </p>
          <ul className="mb-3 flex flex-col gap-2">
            {members.map((m) => {
              const c = collaboratorFor(m);
              return (
                <li key={m.id} className="flex items-center gap-2.5 text-sm">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-paper"
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
              <li className="text-sm text-ink-muted">Just you, for now.</li>
            )}
          </ul>
          <form onSubmit={submit} className="flex flex-col gap-2">
            <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
              Invite by email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@firm.co.uk"
                className="min-w-0 flex-1 rounded-md border border-hairline bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-forest focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="rounded-md bg-forest px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover disabled:opacity-50"
              >
                {busy ? "…" : "Share"}
              </button>
            </div>
            {error && <p className="text-xs text-signal-oxblood">{error}</p>}
            <p className="text-[11px] text-ink-muted">
              They need a Bidframe account. Only the owner can share.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
