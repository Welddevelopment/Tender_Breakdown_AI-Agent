"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getMe,
  isApiEnabled,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  type AuthUser,
} from "@/lib/api";

// Bidframe is a paid product, so the live app is gated behind an account. This
// context is the single source of truth for "who is signed in": it validates the
// stored token against GET /auth/me on load, and exposes signIn / signOut. The
// route gate (AuthGate) and the header read from it.
//
// status: "loading" while we check the token, "authed" once /auth/me confirms it,
// "anon" otherwise. When there is no live API (the mock showcase build), there is
// nothing to protect — status settles to "anon" and AuthGate passes straight through.

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
