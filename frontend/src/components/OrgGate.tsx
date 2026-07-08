"use client";

import { CreateOrganization, useAuth as useClerkAuth } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/env";

// Every Bidframe row is scoped to a Clerk organisation (the team), so a signed-in
// user with no active org can't see or create anything yet — this gate turns that
// dead end into the create-or-join step. Invited users accept Clerk's email invite
// and land straight in their team's workspace instead.

export function OrgGate({ children }: { children: React.ReactNode }) {
  // Mock/legacy builds have no ClerkProvider — hooks stay inside the inner component.
  if (!clerkEnabled) return <>{children}</>;
  return <OrgGateInner>{children}</OrgGateInner>;
}

function OrgGateInner({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId, orgId } = useClerkAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          Checking your session
        </p>
      </div>
    );
  }
  // Signed-out visitors only ever reach public routes (proxy.ts guards the rest).
  if (!userId) return <>{children}</>;

  if (!orgId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">
            Set up your team
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Bidframe workspaces are shared with your team. Create one to get
            started — or, if a colleague invited you, accept the invite email and
            the team appears here.
          </p>
        </div>
        <CreateOrganization afterCreateOrganizationUrl="/upload" />
      </main>
    );
  }

  return <>{children}</>;
}
