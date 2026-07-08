# Production setup — Clerk + Supabase (Bobby's ~15 minutes)

The code builds and tests keyless (mock mode). These dashboard steps are the only human
part; do them once and paste the keys where shown.

## 1. Clerk (dashboard.clerk.com) — ~5 min

1. Create application **Bidframe**. Enable **Google** and **Email** as sign-in options.
2. **Configure → Organizations → Enable organizations.** (This IS the teams feature —
   invite emails, roles, member management all come from here.)
3. **Configure → Integrations → Supabase → Activate**, and copy the **Clerk domain** it
   shows (needed in step 2.2).
4. **API keys**: copy the **Publishable key** and **Secret key**.

## 2. Supabase (supabase.com/dashboard) — ~5 min

1. Create project **bidframe** (pick a strong DB password, London region).
2. **Authentication → Sign In / Providers → Third Party Auth → Add integration → Clerk**,
   paste the Clerk domain from step 1.3.
3. **SQL Editor** → paste + run `supabase/migrations/0001_production_init.sql`.
4. **SQL Editor** → paste + run `supabase/tests/rls_and_triggers.sql` — all four checks
   must read `true` (org isolation, two forgery guards, job immutability).
5. Copy from **Project Settings → API**: the **Project URL** and **anon (public) key**;
   and the **service_role key** (worker only — never goes in the frontend).
   From **Project Settings → Database**: the **connection string** (URI) for the worker.

## 3. Paste the keys — ~5 min

**Vercel (frontend)** — Project → Settings → Environment Variables (+ same in
`frontend/.env.local` for local dev):

    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
    CLERK_SECRET_KEY=sk_...
    NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>

**Fly (worker)** — `fly secrets set` on the worker app:

    DATABASE_URL=<supabase connection string>
    SUPABASE_URL=https://<project>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=<service_role key>
    OPENAI_API_KEY=<existing key>

## Notes

- **No keys set → mock mode**: the app runs the demo build exactly as today. Nothing
  breaks while this is half-configured.
- Google sign-in comes from Clerk now — the old Google Cloud OAuth client
  (docs/setup-google-teams.md) is superseded and can be deleted once this ships.
- The service-role key bypasses RLS by design; it lives only on the Fly worker.
