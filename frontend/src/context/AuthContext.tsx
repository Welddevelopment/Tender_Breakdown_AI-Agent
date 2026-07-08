"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  getMe,
  isApiEnabled,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  type AuthUser,
} from "@/lib/api";
import { clerkEnabled } from "@/lib/env";

// The single source of truth for "who is signed in", in the one shape the whole app
// consumes (AccountMenu, AuthGate, decision attribution, comments). Two backings:
//
// - Production: Clerk. The bridge below maps Clerk's session onto this same shape, so
//   none of the consuming components change. signIn/signInWithGoogle are unused in
//   this mode (the /sign-in page renders Clerk's own UI); signOut delegates to Clerk.
// - Legacy/mock: the pre-migration self-hosted flow, kept until cutover so a deploy
//   without Clerk keys behaves exactly as before (mock showcase included).

type AuthStatus = "loading" | "authed" | "anon";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // clerkEnabled is a build-time constant: this branch never changes at runtime, and
  // Clerk hooks only ever mount inside ClerkProvider (mock builds have neither).
  if (clerkEnabled) return <ClerkAuthBridge>{children}</ClerkAuthBridge>;
  return <LegacyAuthProvider>{children}</LegacyAuthProvider>;
}

function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const user: AuthUser | null =
    isLoaded && isSignedIn && clerkUser
      ? {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
          name: clerkUser.fullName,
        }
      : null;

  const status: AuthStatus = !isLoaded ? "loading" : user ? "authed" : "anon";

  async function unsupported(): Promise<void> {
    throw new Error("Sign in happens on /sign-in when Clerk is configured.");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        signIn: unsupported,
        signInWithGoogle: unsupported,
        signOut: () => void clerkSignOut({ redirectUrl: "/" }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function LegacyAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Deterministic on server + client (env-based), so no hydration mismatch: "loading"
  // when there's a live API to check against, "anon" when there isn't.
  const [status, setStatus] = useState<AuthStatus>(() =>
    isApiEnabled() ? "loading" : "anon"
  );

  // Validate the stored session once on mount. We always call getMe (rather than
  // pre-checking the token synchronously) so every setState lands inside the promise
  // callbacks — past the async boundary, never a synchronous set in the effect body.
  useEffect(() => {
    if (!isApiEnabled()) return;
    let cancelled = false;
    getMe()
      .then((u) => {
        if (!cancelled) {
          setUser(u);
          setStatus("authed");
        }
      })
      .catch(() => {
        if (!cancelled) {
          apiLogout(); // drop any stale/expired token
          setStatus("anon");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(email: string, password: string) {
    const u = await apiLogin(email, password);
    setUser(u);
    setStatus("authed");
  }

  async function signInWithGoogle(idToken: string) {
    const u = await apiLoginWithGoogle(idToken);
    setUser(u);
    setStatus("authed");
  }

  function signOut() {
    apiLogout();
    setUser(null);
    setStatus("anon");
  }

  return (
    <AuthContext.Provider
      value={{ user, status, signIn, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
