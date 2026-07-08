"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { useAuth } from "@/context/AuthContext";
import { clerkEnabled } from "@/lib/env";

// The account control for the header: a Teams link, then an unmistakable
// account chip — initial avatar + first name (the email's local part) in a
// bordered pill, so it reads as "this is you", not another nav link. Clicking
// the chip opens a small menu with the full email and Sign out (the only way
// out; no bare Sign out button crowding the header). Escape and click-outside
// close it. Renders nothing when there is no signed-in account (the mock
// showcase build), so the header is unchanged there.

// "bob@bidframe.co.uk" → "Bob". Placeholder until proper profiles (Clerk)
// carry a real display name.
function displayName(email: string): string {
  const local = email.split("@")[0] || email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function AccountMenu() {
  const { user, status, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (status !== "authed" || !user) return null;

  const name = displayName(user.email);

  return (
    <div ref={rootRef} className="relative flex items-center gap-3 text-xs">
      {/* Production: every row is scoped to the ACTIVE org, so multi-team users
          switch here. hidePersonal — Bidframe data always lives in a team. */}
      {clerkEnabled && (
        <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/upload" />
      )}
      <Link
        href="/teams"
        className="rounded-sm font-mono text-ink-muted underline decoration-hairline decoration-1 underline-offset-4 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Teams
      </Link>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Signed in as ${user.email}`}
        className="flex items-center gap-2 rounded-full border border-hairline bg-paper-raised py-1 pl-1 pr-3 shadow-[var(--depth-row)] transition-colors hover:border-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <span
          aria-hidden
          className="flex h-6 w-6 items-center justify-center rounded-full bg-forest font-serif text-[13px] font-semibold text-paper"
        >
          {name.charAt(0)}
        </span>
        <span className="font-medium text-ink">{name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-md border border-hairline bg-paper-raised p-1 shadow-[var(--depth-sheet)]"
        >
          <p className="px-2.5 pb-2 pt-2 text-left">
            <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Signed in as
            </span>
            <span className="mt-0.5 block break-all font-mono text-xs text-ink">
              {user.email}
            </span>
          </p>
          <div className="border-t border-hairline" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
              router.push("/");
            }}
            className="mt-1 block w-full rounded px-2.5 py-2 text-left text-xs text-ink-muted transition-colors hover:bg-paper-recessed hover:text-ink"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
