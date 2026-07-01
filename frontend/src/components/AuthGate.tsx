"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isApiEnabled } from "@/lib/api";

// Wraps the product routes (upload, matrix, answers, graph). Bidframe is paid, so
// these are closed to anyone without a signed-in account: an anonymous visitor is
// sent to /login (remembering where they were headed). While the stored token is
// being validated we hold a calm placeholder rather than flashing the app.
//
// When there is no live API configured (the mock showcase build) there is nothing
// to protect, so the gate passes straight through — the deployed demo still works.

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isApiEnabled() && status === "anon") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // No backend to gate against → the mock showcase renders openly.
  if (!isApiEnabled()) return <>{children}</>;
  if (status === "authed") return <>{children}</>;

  // "loading" (validating the token) or "anon" (about to redirect): a quiet hold.
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
        {status === "loading" ? "Checking your session" : "Redirecting to sign in"}
      </p>
    </div>
  );
}
