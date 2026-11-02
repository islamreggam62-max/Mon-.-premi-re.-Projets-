-- Tenant isolation and role checks for the core schema.
-- Run as a superuser after 00_supabase_stub.sql and the migrations:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/10_tenancy.test.sql
-- Each check raises on failure, so the script stops at the first broken rule.
\set ON_ERROR_STOP on
\set QUIET on

-- ---------------------------------------------------------------- helpers
create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

create or replace function tests.ok(cond boolean, label text) returns void
language plpgsql as $$
begin
  if cond is not true then
    raise exception 'FAIL: %', label;
  end if;
  raise notice 'PASS: %', label;
end;
$$;

-- Run a statement and require a given SQLSTATE (its effects are rolled back).
create or replace function tests.fails(stmt text, state text, label text) returns void
language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if sqlstate = state then
      raise notice 'PASS: % (% %)', label, sqlstate, sqlerrm;
      return;
    end if;
    raise exception 'FAIL: % (expected %, got %: %)', label, state, sqlstate, sqlerrm;
  end;
  raise exception 'FAIL: % (expected error %, but it succeeded)', label, state;
end;
$$;

-- Number of rows a statement touched (0 means RLS silently filtered it).
create or replace function tests.rows(stmt text) returns bigint
language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

-- Act as a signed-in user (call as superuser, then switch role).
create or replace function tests.login(uid uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false);
$$;

-- ------------------------------------------------------------------ users
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'amina@acme.test',   '{"full_name":"Amina (owner, Acme)"}'),
  ('b0000000-0000-4000-8000-00000000000b', 'bilal@beta.test',   '{"full_name":"Bilal (owner, Beta)"}'),
  ('c0000000-0000-4000-8000-00000000000c', 'chahra@acme.test',  '{"full_name":"Chahra (member, Acme)"}'),
  ('d0000000-0000-4000-8000-00000000000d', 'dalil@other.test',  '{"full_name":"Dalil (stranger)"}'),
  ('e0000000-0000-4000-8000-00000000000e', 'meriem@acme.test',  '{"full_name":"Meriem (manager, Acme)"}'),
  ('f0000000-0000-4000-8000-00000000000f', 'vanessa@acme.test', '{"full_name":"Vanessa (viewer, Acme)"}');

select tests.ok((select count(*) from public.profiles) = 6, 'a profile is created for every new user');

\set ua 'a0000000-0000-4000-8000-00000000000a'
\set ub 'b0000000-0000-4000-8000-00000000000b'
\set uc 'c0000000-0000-4000-8000-00000000000c'
\set ud 'd0000000-0000-4000-8000-00000000000d'
\set um 'e0000000-0000-4000-8000-00000000000e'
\set uv 'f0000000-0000-4000-8000-00000000000f'

-- ------------------------------------------------------ signed-out visitors
set role anon;
select tests.fails('select * from public.workspaces', '42501', 'anon cannot read companies');
select tests.fails('select public.create_workspace(''Nope'')', '42501', 'anon cannot create a company');
reset role;

-- ------------------------------------------------- two independent companies
select tests.login(:'ua');
set role authenticated;
select public.create_workspace('Acme Industries', 'Manufacturing') as ws_a \gset
reset role;

select tests.login(:'ub');
set role authenticated;
select public.create_workspace('Beta Logistics', 'Logistics') as ws_b \gset
insert into public.projects (workspace_id, code, name) values (:'ws_b', 'BETA', 'Beta secret project') returning id as proj_b \gset
reset role;

select tests.login(:'ua');
set role authenticated;
select tests.ok((select count(*) from public.workspaces) = 1, 'owner A sees only their own company');
select tests.ok((select role from public.workspace_members where workspace_id = :'ws_a' and user_id = :'ua') = 'owner', 'creator becomes owner');
insert into public.departments (workspace_id, name) values (:'ws_a', 'Operations') returning id as dept_ops \gset
insert into public.projects (workspace_id, code, name, department_id) values (:'ws_a', 'ATLAS', 'Atlas rollout', :'dept_ops') returning id as proj_a \gset
select tests.ok((select count(*) from public.projects) = 1, 'A sees only Acme projects (not Beta''s)');
select tests.fails(format('insert into public.projects (workspace_id, code, name) values (%L, ''HACK'', ''Injected'')', :'ws_b'), '42501', 'A cannot write into another company');
select tests.ok(tests.rows(format('update public.projects set name = ''Renamed'' where id = %L', :'proj_b')) = 0, 'A cannot update another company''s project');
select tests.ok(tests.rows(format('delete from public.projects where id = %L', :'proj_b')) = 0, 'A cannot delete another company''s project');
select tests.fails(format('insert into public.tasks (workspace_id, project_id, title) values (%L, %L, ''Cross link'')', :'ws_a', :'proj_b'), '23503', 'a task cannot point at another company''s project');
select tests.fails(format('insert into public.tasks (workspace_id, title, assignee_id) values (%L, ''Assign outsider'', %L)', :'ws_a', :'ub'), '23503', 'a task cannot be assigned to a non-member');
select tests.fails(format('insert into public.workspace_members (workspace_id, user_id, role) values (%L, %L, ''admin'')', :'ws_a', :'ud'), '42501', 'members cannot be added directly (invite only)');

-- invites
insert into public.workspace_invites (workspace_id, email, role) values (:'ws_a', 'chahra@acme.test', 'member') returning token as tok_c \gset
insert into public.workspace_invites (workspace_id, email, role) values (:'ws_a', 'meriem@acme.test', 'manager') returning token as tok_m \gset
insert into public.workspace_invites (workspace_id, email, role) values (:'ws_a', 'vanessa@acme.test', 'viewer') returning token as tok_v \gset
select tests.ok(length(:'tok_c') = 64, 'invite tokens are 64 hex characters');
select tests.fails(format('insert into public.workspace_invites (workspace_id, email, role) values (%L, ''x@acme.test'', ''owner'')', :'ws_a'), '23514', 'an invite can never grant ownership');
reset role;

-- B cannot see A's invites, nor invite into Acme
select tests.login(:'ub');
set role authenticated;
select tests.ok((select count(*) from public.workspace_invites) = 0, 'B cannot read Acme''s invites');
select tests.fails(format('insert into public.workspace_invites (workspace_id, email) values (%L, ''spy@beta.test'')', :'ws_a'), '42501', 'B cannot invite people into Acme');
reset role;

-- A stranger cannot use someone else's invite
select tests.login(:'ud');
set role authenticated;
select tests.fails(format('select public.accept_invite(%L)', :'tok_c'), '42501', 'an invite only works for its own email address');
select tests.fails('select public.accept_invite(''not-a-real-token'')', 'P0002', 'an unknown invite token is refused');
reset role;

-- The invited people join
select tests.login(:'uc'); set role authenticated;
select tests.ok(public.accept_invite(:'tok_c') = :'ws_a'::uuid, 'member C joins Acme with their invite');
select tests.fails(format('select public.accept_invite(%L)', :'tok_c'), 'P0002', 'an invite cannot be used twice');
reset role;
select tests.login(:'um'); set role authenticated; select public.accept_invite(:'tok_m'); reset role;
select tests.login(:'uv'); set role authenticated; select public.accept_invite(:'tok_v'); reset role;

-- ------------------------------------------------------------- member C
select tests.login(:'uc');
set role authenticated;
select tests.ok((select count(*) from public.projects) = 1, 'member C sees Acme''s project');
select tests.ok((select count(*) from public.profiles) = 4, 'C sees colleagues'' profiles only (A, M, V and self)');
select tests.fails(format('insert into public.projects (workspace_id, code, name) values (%L, ''NOPE'', ''Member project'')', :'ws_a'), '42501', 'a member cannot create projects');
insert into public.tasks (workspace_id, project_id, title, assignee_id) values (:'ws_a', :'proj_a', 'Prepare supplier list', :'uc') returning id as task_c \gset
select tests.fails(format('insert into public.tasks (workspace_id, title, assignee_id) values (%L, ''Task for the boss'', %L)', :'ws_a', :'ua'), '42501', 'a member cannot assign tasks to others');
select tests.ok(tests.rows(format('update public.tasks set status = ''in-progress'' where id = %L', :'task_c')) = 1, 'a member updates their own task');
select tests.fails(format('update public.tasks set assignee_id = %L where id = %L', :'ua', :'task_c'), '42501', 'a member cannot hand their task to someone else');
insert into public.daily_reports (workspace_id, report_date, completed, priorities)
  values (:'ws_a', current_date, '{"Called 3 suppliers"}', '{"Finish the list"}') returning id as report_c \gset
insert into public.report_blockers (report_id, description, waiting_on, severity) values (:'report_c', 'Waiting for the purchase budget', 'Amina', 'high');
select tests.fails(format('insert into public.daily_reports (workspace_id, author_id, report_date) values (%L, %L, current_date)', :'ws_a', :'ua'), '42501', 'nobody can file a report in someone else''s name');
select tests.fails(format('insert into public.daily_reports (workspace_id, report_date) values (%L, current_date - 10)', :'ws_a'), '42501', 'reports cannot be back-dated');
select tests.fails(format('insert into public.approvals (workspace_id, kind, title, approver_id, amount_cents) values (%L, ''budget'', ''Member request'', %L, 100)', :'ws_a', :'ua'), '42501', 'a member cannot submit approval requests');
select tests.fails(format('select public.set_member_role(%L, %L, ''admin'')', :'ws_a', :'uc'), '42501', 'a member cannot promote themselves');
reset role;

-- ------------------------------------------------------------- viewer V
select tests.login(:'uv');
set role authenticated;
select tests.ok((select count(*) from public.tasks) = 1, 'a viewer can read tasks');
select tests.fails(format('insert into public.tasks (workspace_id, title, assignee_id) values (%L, ''Viewer task'', %L)', :'ws_a', :'uv'), '42501', 'a viewer cannot create tasks, even for themselves');
select tests.ok((select count(*) from public.daily_reports) = 0, 'a viewer cannot read other people''s reports');
reset role;

-- ------------------------------------------------------------ manager M
select tests.login(:'um');
set role authenticated;
select tests.ok((select count(*) from public.daily_reports) = 1, 'a manager reads the team''s reports');
select tests.ok((select count(*) from public.report_blockers where resolved_at is null) = 1, 'a manager sees open blockers');
insert into public.approvals (workspace_id, kind, title, approver_id, amount_cents, project_id)
  values (:'ws_a', 'budget', 'Purchase budget for suppliers', :'ua', 1500000, :'proj_a') returning id as appr \gset
select tests.fails(format('insert into public.approvals (workspace_id, kind, title, approver_id, amount_cents) values (%L, ''budget'', ''To a member'', %L, 100)', :'ws_a', :'uc'), '42501', 'the approver must be a manager or above');
select tests.fails(format('insert into public.approvals (workspace_id, kind, title, approver_id) values (%L, ''budget'', ''No amount'', %L)', :'ws_a', :'ua'), '23514', 'a budget request needs an amount');
select tests.fails(format('insert into public.approvals (workspace_id, kind, title, approver_id, status) values (%L, ''exception'', ''Pre-approved'', %L, ''approved'')', :'ws_a', :'ua'), '42501', 'a request cannot be created already approved');
select tests.ok(tests.rows(format('update public.approvals set status = ''approved'' where id = %L', :'appr')) = 0, 'status cannot be changed by a direct update');
reset role;

-- C cannot see or decide the approval
select tests.login(:'uc');
set role authenticated;
select tests.ok((select count(*) from public.approvals) = 0, 'a member does not see approvals they are not part of');
select tests.fails(format('select public.decide_approval(%L, ''approved'')', :'appr'), '42501', 'a member cannot decide an approval');
reset role;

-- B (other company) cannot decide either
select tests.login(:'ub');
set role authenticated;
select tests.fails(format('select public.decide_approval(%L, ''approved'')', :'appr'), '42501', 'another company''s owner cannot decide');
reset role;

-- A decides; the decision is recorded
select tests.login(:'ua');
set role authenticated;
select tests.ok(public.decide_approval(:'appr', 'approved', 'Go ahead') = 'approved', 'the approver approves');
select tests.ok((select decided_at is not null from public.approvals where id = :'appr'), 'decision time is recorded');
select tests.ok((select count(*) from public.approval_events where approval_id = :'appr' and to_status = 'approved' and actor_id = :'ua') = 1, 'the decision is written to the audit trail');
select tests.fails(format('select public.decide_approval(%L, ''rejected'')', :'appr'), '55000', 'a decided request cannot be decided again');
select tests.fails('insert into public.approval_events (approval_id, actor_id, from_status, to_status) select id, auth.uid(), ''pending'', ''approved'' from public.approvals limit 1', '42501', 'nobody can write audit events directly');

-- roles
select public.set_member_role(:'ws_a', :'uc', 'manager');
select tests.ok((select role from public.workspace_members where user_id = :'uc' and workspace_id = :'ws_a') = 'manager', 'the owner promotes a member');
select tests.fails(format('select public.set_member_role(%L, %L, ''owner'')', :'ws_a', :'uc'), '42501', 'ownership cannot be handed over by role change');
select tests.fails(format('select public.set_member_role(%L, %L, ''member'')', :'ws_a', :'ua'), '42501', 'the owner''s role cannot be changed');
select tests.ok(tests.rows(format('delete from public.workspace_members where workspace_id = %L and user_id = %L', :'ws_a', :'ua')) = 0, 'nobody can remove the owner');
reset role;

-- Manager M cannot manage admins
select tests.login(:'um');
set role authenticated;
select tests.fails(format('select public.set_member_role(%L, %L, ''viewer'')', :'ws_a', :'uc'), '42501', 'a manager cannot change roles');
reset role;

-- B still sees nothing from Acme, anywhere
select tests.login(:'ub');
set role authenticated;
select tests.ok(
  (select count(*) from public.tasks) + (select count(*) from public.daily_reports) + (select count(*) from public.report_blockers)
  + (select count(*) from public.approvals) + (select count(*) from public.approval_events) + (select count(*) from public.departments)
  + (select count(*) from public.workspace_members where workspace_id = :'ws_a') = 0,
  'no Acme data leaks to Beta (tasks, reports, blockers, approvals, audit, departments, members)');
select tests.ok((select count(*) from public.profiles) = 1, 'B sees only their own profile');
reset role;

\echo ALL TENANCY CHECKS PASSED
