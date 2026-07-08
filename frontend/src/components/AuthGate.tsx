"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isApiEnabled } from "@/lib/api";
import { clerkEnabled } from "@/lib/env";
import { OrgGate } from "@/components/OrgGate";

// Wraps the product routes (upload, matrix, answers, graph). Bidframe is paid, so
// these are closed to anyone without a signed-in account.
//
// Production (Clerk configured): proxy.ts already redirects anonymous visitors to
// /sign-in before this ever renders — the gate's remaining job is the ORG step:
// every data row is team-scoped, so a user with no active organisation is walked
// through creating/joining one (OrgGate) instead of hitting an empty, broken app.
//
// Legacy (API mode): redirect anonymous visitors to /login as before.
// Mock showcase (nothing configured): passes straight through — the demo still works.

export function AuthGate({ children }: { children: React.ReactNode }) {
  if (clerkEnabled) return <OrgGate>{children}</OrgGate>;
  return <LegacyAuthGate>{children}</LegacyAuthGate>;
}

function LegacyAuthGate({ children }: { children: React.ReactNode }) {
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
