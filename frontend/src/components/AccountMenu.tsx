"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// A quiet account control for the header: who is signed in, and a way out. Text
// only, mono, muted — it never competes with the page's one primary action. Renders
// nothing when there is no signed-in account (the mock showcase build), so the
// header is unchanged there.
export function AccountMenu() {
  const { user, status, signOut } = useAuth();
  const router = useRouter();

  if (status !== "authed" || !user) return null;

  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span
        className="hidden max-w-[16ch] truncate font-mono text-ink-muted sm:inline"
        title={user.email}
      >
        {user.email}
      </span>
      <span aria-hidden className="hidden text-hairline sm:inline">
        ·
      </span>
      <button
        type="button"
        onClick={() => {
          signOut();
          router.push("/");
        }}
        className="rounded-sm text-ink-muted underline decoration-hairline decoration-1 underline-offset-4 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Sign out
      </button>
    </div>
  );
}
