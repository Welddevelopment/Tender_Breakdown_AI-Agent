// Build-time env flags for the production stack. NEXT_PUBLIC_* values are inlined by
// Next, so these are safe to import from client components.
//
// Three states, checked in this order everywhere:
//   clerkEnabled + supabase → the production app (Clerk auth, Supabase data)
//   legacy API mode         → NEXT_PUBLIC_API_BASE_URL only (pre-migration live mode,
//                             retired at cutover — see lib/api.ts isApiEnabled())
//   nothing set             → mock/demo build (public showcase, no accounts)

export const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// The production data path is only on when BOTH halves are configured — a half-set
// deployment falls back rather than half-working.
export const supabaseEnabled = clerkEnabled && !!supabaseUrl && !!supabaseAnonKey;
