"use client";

import { createContext, useContext, useMemo } from "react";
import { useSession } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseEnabled, supabaseUrl } from "@/lib/env";

// The Supabase client, authenticated as the current Clerk user, delivered via
// context. SupabaseProvider mounts ONLY inside ClerkProvider (see app/layout.tsx),
// so Clerk hooks never run on the mock/legacy builds — consumers there just read
// the context default (null) and branch. The accessToken hook re-mints the Clerk
// token per request (they're short-lived) and also feeds Realtime channel auth, so
// subscriptions respect the same org-scoped RLS as queries.

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  const client = useMemo(() => {
    if (!supabaseEnabled || !session) return null;
    return createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => (await session.getToken()) ?? null,
    });
  }, [session]);

  return (
    <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
  );
}

// Null in mock/legacy modes, and briefly null in production while the Clerk
// session loads — callers branch on it.
export function useSupabase(): SupabaseClient | null {
  return useContext(SupabaseContext);
}
