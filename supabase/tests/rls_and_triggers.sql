-- Production security checks — run in the Supabase SQL editor AFTER the migration.
-- Everything rolls back; expected results in comments. All four must pass before
-- real customer data touches this database.

begin;
set local role authenticated;

-- ---- 1. Org isolation: org B never sees org A ----------------------------------
set local request.jwt.claims to
  '{"sub":"user_a","role":"authenticated","o":{"id":"org_a"}}';
insert into public.tenders (org_id, title, created_by) values ('org_a', 'A tender', 'user_a');
select count(*) = 1 as org_a_sees_own from public.tenders;          -- expect: true

set local request.jwt.claims to
  '{"sub":"user_b","role":"authenticated","o":{"id":"org_b"}}';
select count(*) = 0 as org_b_sees_nothing from public.tenders;      -- expect: true

-- ---- 2. Decision attribution cannot be forged -----------------------------------
set local request.jwt.claims to
  '{"sub":"user_a","role":"authenticated","o":{"id":"org_a"}}';
insert into public.requirements (tender_id, org_id, req_id, text, decision)
select id, 'org_a', 'req-0001', 'Must hold ISO 9001.',
       '{"action":"approve","note":"","timestamp":"2026-07-08T12:00:00Z",
         "actor":{"id":"FORGED-someone-else","email":"evil@example.com"}}'::jsonb
from public.tenders limit 1;
select (decision -> 'actor' ->> 'id') = 'user_a' as actor_stamped_from_jwt
from public.requirements;                                            -- expect: true

-- ---- 3. Comment author cannot be forged ------------------------------------------
insert into public.comments (requirement_pk, tender_id, org_id, author_id, body)
select pk, tender_id, 'org_a', 'FORGED-id', 'who owns the ISO evidence?'
from public.requirements limit 1;
select author_id = 'user_a' as comment_author_stamped from public.comments;  -- expect: true

-- ---- 4. End-user sessions cannot mutate jobs (worker-only transitions) -----------
insert into public.jobs (org_id, tender_id, payload)
select 'org_a', id, '{}'::jsonb from public.tenders limit 1;
update public.jobs set status = 'done';
select count(*) = 0 as users_cannot_touch_job_state
from public.jobs where status = 'done';                              -- expect: true
-- (RLS has no UPDATE policy for authenticated on jobs: the update above silently
--  matches zero rows. Only the service-role worker moves job state.)

rollback;
