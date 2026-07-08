-- Bidframe production schema — Supabase Postgres as the system of record.
-- Run in the Supabase SQL editor on a fresh project (or `supabase db push`).
-- Design: docs/superpowers/specs/2026-07-08-production-clerk-supabase-design.md
--
-- Identity model: Clerk is registered as a Supabase third-party auth provider, so
-- auth.jwt() carries Clerk's claims. Every row is scoped to the ACTIVE ORGANISATION
-- (Clerk session token v2 carries it as o.id) and RLS enforces that scope in the
-- database — app code cannot forget an access check that lives here.
-- The Python worker connects with the service role, which bypasses RLS by design.

-- ---- Claim helpers -------------------------------------------------------------

create or replace function public.clerk_org_id()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'o' ->> 'id', auth.jwt() ->> 'org_id')
$$;

create or replace function public.clerk_user_id()
returns text language sql stable as $$
  select auth.jwt() ->> 'sub'
$$;

-- ---- Tables --------------------------------------------------------------------

create table if not exists public.tenders (
  id               uuid primary key default gen_random_uuid(),
  org_id           text not null default public.clerk_org_id(),
  title            text not null,
  filename         text,
  status           text not null default 'processing'
                     check (status in ('processing', 'ready', 'failed')),
  error            text,
  created_by       text not null default public.clerk_user_id(),
  created_by_name  text,
  created_at       timestamptz not null default now(),
  -- Mirrors of the locked TenderResponse envelope (jsonb: shapes owned by the app)
  source_docs      jsonb not null default '[]'::jsonb,
  award_criteria   jsonb not null default '[]'::jsonb,
  capability_docs  jsonb not null default '[]'::jsonb
);
create index if not exists tenders_org_idx on public.tenders (org_id, created_at desc);

-- One row per requirement. Columns mirror the team-locked requirement JSON exactly
-- (AGENTS.md data contract — unchanged by this migration); jsonb for the nested bits.
create table if not exists public.requirements (
  pk                uuid primary key default gen_random_uuid(),
  tender_id         uuid not null references public.tenders (id) on delete cascade,
  org_id            text not null,
  seq               int  not null default 0,          -- stable display order
  req_id            text not null,                    -- e.g. req-0001 (unique per tender)
  text              text not null,
  source_page       int  not null default 0,
  source_clause     text,
  source_excerpt    text not null default '',
  type              text not null default 'mandatory' check (type in ('mandatory', 'optional')),
  is_gating         boolean not null default false,
  category          text not null default '',
  confidence        real not null default 0,
  status            text not null default 'pending'
                      check (status in ('pending', 'accepted', 'edited', 'flagged')),
  needs_review      boolean not null default false,
  decision          jsonb,
  criteria_ref      text,
  depends_on        jsonb not null default '[]'::jsonb,
  draft_answer      text,
  answer            jsonb,
  open_questions    jsonb not null default '[]'::jsonb,
  source_doc_id     text,
  source_filename   text,
  source_rect       jsonb,
  source_rect_match text,
  unique (tender_id, req_id)
);
create index if not exists requirements_tender_idx on public.requirements (tender_id, seq);
create index if not exists requirements_org_idx on public.requirements (org_id);

create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  requirement_pk uuid not null references public.requirements (pk) on delete cascade,
  tender_id    uuid not null references public.tenders (id) on delete cascade,
  org_id       text not null default public.clerk_org_id(),
  author_id    text not null default public.clerk_user_id(),
  author_name  text,
  body         text not null check (length(trim(body)) > 0),
  created_at   timestamptz not null default now()
);
create index if not exists comments_requirement_idx on public.comments (requirement_pk, created_at);

-- The extraction/draft job queue. Durable replacement for the old in-memory JOBS
-- registry: a job is a ROW, so it survives restarts and deploys; the Python worker
-- claims with FOR UPDATE SKIP LOCKED (see backend/worker.py) so N workers never
-- double-claim; attempts + claimed_at give retries and a stale-claim watchdog.
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  org_id       text not null default public.clerk_org_id(),
  tender_id    uuid not null references public.tenders (id) on delete cascade,
  kind         text not null default 'extract' check (kind in ('extract', 'draft')),
  status       text not null default 'queued'
                 check (status in ('queued', 'running', 'done', 'error')),
  attempts     int  not null default 0,
  max_attempts int  not null default 2,
  claimed_at   timestamptz,
  -- What the worker needs: storage paths + filenames of the uploaded pack, and
  -- options (provider/limit for draft jobs).
  payload      jsonb not null default '{}'::jsonb,
  -- What the UI watches: { stage, message, progress 0..1, counts... } — same shape
  -- the old polling endpoint served, so ProcessingView's rendering carries over.
  progress     jsonb not null default '{}'::jsonb,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists jobs_claim_idx on public.jobs (status, created_at);
create index if not exists jobs_tender_idx on public.jobs (tender_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists jobs_touch on public.jobs;
create trigger jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

-- ---- Attribution: unforgeable at the database ----------------------------------
-- The old FastAPI stamped decision.actor server-side so "Approved by X" couldn't be
-- forged. With clients writing under RLS, the same guarantee moves into triggers:
-- whatever a client sends, the identity fields are overwritten from the JWT.

create or replace function public.stamp_decision_actor()
returns trigger language plpgsql as $$
begin
  -- Only when a decision is present and this write is coming from an end-user
  -- session (the worker's service role has no JWT sub and must not be rewritten).
  if new.decision is not null and public.clerk_user_id() is not null
     and (tg_op = 'INSERT' or new.decision is distinct from old.decision) then
    new.decision := jsonb_set(
      new.decision,
      '{actor,id}',
      to_jsonb(public.clerk_user_id()),
      true
    );
  end if;
  return new;
end $$;

drop trigger if exists requirements_stamp_actor on public.requirements;
create trigger requirements_stamp_actor
  before insert or update on public.requirements
  for each row execute function public.stamp_decision_actor();

create or replace function public.stamp_comment_author()
returns trigger language plpgsql as $$
begin
  if public.clerk_user_id() is not null then
    new.author_id := public.clerk_user_id();
  end if;
  return new;
end $$;

drop trigger if exists comments_stamp_author on public.comments;
create trigger comments_stamp_author
  before insert on public.comments
  for each row execute function public.stamp_comment_author();

-- ---- Row Level Security ---------------------------------------------------------
-- One rule everywhere: members of the JWT's active org get at their org's rows,
-- nobody else gets anything. Jobs are deliberately narrower: an end-user session
-- can create and watch a job but never mutate one — only the worker (service role,
-- bypasses RLS) transitions job state.

alter table public.tenders          enable row level security;
alter table public.requirements     enable row level security;
alter table public.comments         enable row level security;
alter table public.jobs             enable row level security;

drop policy if exists "org members full access" on public.tenders;
create policy "org members full access" on public.tenders
  for all to authenticated
  using (org_id = public.clerk_org_id())
  with check (org_id = public.clerk_org_id());

drop policy if exists "org members full access" on public.requirements;
create policy "org members full access" on public.requirements
  for all to authenticated
  using (org_id = public.clerk_org_id())
  with check (org_id = public.clerk_org_id());

drop policy if exists "org members full access" on public.comments;
create policy "org members full access" on public.comments
  for all to authenticated
  using (org_id = public.clerk_org_id())
  with check (org_id = public.clerk_org_id());

drop policy if exists "org members create jobs" on public.jobs;
create policy "org members create jobs" on public.jobs
  for insert to authenticated
  with check (org_id = public.clerk_org_id());

drop policy if exists "org members watch jobs" on public.jobs;
create policy "org members watch jobs" on public.jobs
  for select to authenticated
  using (org_id = public.clerk_org_id());

-- ---- Realtime -------------------------------------------------------------------
-- Live collaboration: decisions, comments and job progress stream to every teammate.
-- Subscriptions respect RLS, so an org only ever hears its own rows.

do $$
begin
  alter publication supabase_realtime add table public.tenders;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.requirements;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.jobs;
exception when duplicate_object then null;
end $$;

-- ---- Storage --------------------------------------------------------------------
-- Uploaded tender packs + capability docs live at tender-docs/<org_id>/<tender_id>/…
-- Org-scoped read/write for members; the worker downloads via service role.

insert into storage.buckets (id, name, public)
values ('tender-docs', 'tender-docs', false)
on conflict (id) do nothing;

drop policy if exists "org members upload tender docs" on storage.objects;
create policy "org members upload tender docs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tender-docs'
    and (storage.foldername(name))[1] = public.clerk_org_id()
  );

drop policy if exists "org members read tender docs" on storage.objects;
create policy "org members read tender docs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tender-docs'
    and (storage.foldername(name))[1] = public.clerk_org_id()
  );
