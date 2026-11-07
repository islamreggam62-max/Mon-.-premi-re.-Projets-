-- NEXORA core schema (Phase 2, step 1).
--
-- One company = one workspace. Every business row carries workspace_id, and
-- Row-Level Security confines each signed-in user to the workspaces they
-- belong to; their role decides what they may write. The browser talks to the
-- database directly with the public (anon) key, so these policies ARE the
-- security boundary: nothing here may rely on the client behaving.
--
-- Multi-step changes (create a company, accept an invite, decide an approval,
-- change a role) go through security-definer functions that check the caller
-- themselves.

-- ---------------------------------------------------------------- enums
create type public.access_role as enum ('owner', 'admin', 'manager', 'member', 'viewer');
create type public.health as enum ('on-track', 'at-risk', 'delayed');
create type public.priority as enum ('low', 'medium', 'high', 'critical');
create type public.task_status as enum ('todo', 'in-progress', 'in-review', 'blocked', 'done');
create type public.approval_kind as enum ('budget', 'contract', 'hiring', 'exception');
create type public.approval_status as enum ('pending', 'in-review', 'changes-requested', 'approved', 'rejected');
create type public.severity as enum ('low', 'medium', 'high');

-- --------------------------------------------------------------- tables
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  email text not null default '',
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  industry text check (char_length(industry) <= 80),
  timezone text not null default 'Africa/Algiers' check (char_length(timezone) <= 64),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  plan text not null default 'trial' check (plan in ('trial', 'monthly', 'annual')),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  unique (workspace_id, name),
  unique (workspace_id, id)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.access_role not null default 'member',
  title text not null default '' check (char_length(title) <= 120),
  department_id uuid,
  reports_daily boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  foreign key (workspace_id, department_id) references public.departments (workspace_id, id) on delete set null (department_id)
);

create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.access_role not null default 'member' check (role <> 'owner'),
  -- 64 hex characters from two random UUIDs (244 random bits), no extension needed.
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9]{2,8}$'),
  name text not null check (char_length(name) between 2 and 120),
  summary text not null default '' check (char_length(summary) <= 2000),
  health public.health not null default 'on-track',
  progress smallint not null default 0 check (progress between 0 and 100),
  owner_id uuid,
  department_id uuid,
  start_on date,
  target_on date,
  budget_cents bigint check (budget_cents >= 0),
  spent_cents bigint not null default 0 check (spent_cents >= 0),
  created_at timestamptz not null default now(),
  unique (workspace_id, code),
  unique (workspace_id, id),
  check (target_on is null or start_on is null or target_on >= start_on),
  foreign key (workspace_id, owner_id) references public.workspace_members (workspace_id, user_id) on delete set null (owner_id),
  foreign key (workspace_id, department_id) references public.departments (workspace_id, id) on delete set null (department_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid,
  title text not null check (char_length(title) between 2 and 200),
  assignee_id uuid,
  status public.task_status not null default 'todo',
  priority public.priority not null default 'medium',
  due_on date,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A task can only point at a project and an assignee of its own company.
  foreign key (workspace_id, project_id) references public.projects (workspace_id, id) on delete set null (project_id),
  foreign key (workspace_id, assignee_id) references public.workspace_members (workspace_id, user_id) on delete set null (assignee_id)
);

create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  author_id uuid not null default auth.uid(),
  report_date date not null,
  completed text[] not null default '{}' check (cardinality(completed) <= 20),
  priorities text[] not null default '{}' check (cardinality(priorities) <= 20),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, author_id, report_date),
  foreign key (workspace_id, author_id) references public.workspace_members (workspace_id, user_id) on delete cascade
);

create table public.report_blockers (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports (id) on delete cascade,
  description text not null check (char_length(description) between 3 and 500),
  waiting_on text check (char_length(waiting_on) <= 120),
  severity public.severity not null default 'medium',
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id)
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind public.approval_kind not null,
  title text not null check (char_length(title) between 3 and 200),
  summary text not null default '' check (char_length(summary) <= 2000),
  requested_by uuid not null default auth.uid() references auth.users (id),
  approver_id uuid not null references auth.users (id),
  status public.approval_status not null default 'pending',
  amount_cents bigint check (amount_cents >= 0),
  counterparty text check (char_length(counterparty) <= 200),
  headcount smallint check (headcount > 0),
  project_id uuid,
  submitted_at timestamptz not null default now(),
  due_on date,
  decided_at timestamptz,
  decision_note text check (char_length(decision_note) <= 2000),
  foreign key (workspace_id, project_id) references public.projects (workspace_id, id) on delete set null (project_id),
  check (kind not in ('budget', 'contract') or amount_cents is not null),
  check (kind <> 'contract' or counterparty is not null),
  check (kind <> 'hiring' or headcount is not null)
);

create table public.approval_events (
  id bigint generated always as identity primary key,
  approval_id uuid not null references public.approvals (id) on delete cascade,
  actor_id uuid not null references auth.users (id),
  from_status public.approval_status not null,
  to_status public.approval_status not null,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- indexes
create index workspace_members_user_idx on public.workspace_members (user_id);
create index tasks_workspace_status_idx on public.tasks (workspace_id, status);
create index tasks_assignee_idx on public.tasks (assignee_id);
create index tasks_project_idx on public.tasks (project_id);
create index daily_reports_workspace_date_idx on public.daily_reports (workspace_id, report_date);
create index report_blockers_open_idx on public.report_blockers (report_id) where resolved_at is null;
create index approvals_workspace_status_idx on public.approvals (workspace_id, status, due_on);
create index approval_events_approval_idx on public.approval_events (approval_id);
create index workspace_invites_workspace_idx on public.workspace_invites (workspace_id);

-- -------------------------------------------------------------- helpers
-- Security definer so policies on workspace_members can call them without recursion.
create function public.is_member(ws uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

create function public.has_role(ws uuid, roles public.access_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid() and m.role = any (roles)
  );
$$;

-- Two users share a company (to show each other's names).
create function public.shares_workspace(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members a
    join public.workspace_members b on b.workspace_id = a.workspace_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();
create trigger daily_reports_touch before update on public.daily_reports
  for each row execute function public.touch_updated_at();

-- A profile row for every new login.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''), coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------- row-level security
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.departments enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_reports enable row level security;
alter table public.report_blockers enable row level security;
alter table public.approvals enable row level security;
alter table public.approval_events enable row level security;

-- Profiles: yourself, and people of your companies.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_workspace(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Workspaces: members read; owner and admins edit. Creation goes through create_workspace().
create policy workspaces_select on public.workspaces for select to authenticated
  using (public.is_member(id));
create policy workspaces_update on public.workspaces for update to authenticated
  using (public.has_role(id, '{owner,admin}')) with check (public.has_role(id, '{owner,admin}'));

-- Departments: members read; owner and admins manage.
create policy departments_select on public.departments for select to authenticated
  using (public.is_member(workspace_id));
create policy departments_write on public.departments for all to authenticated
  using (public.has_role(workspace_id, '{owner,admin}')) with check (public.has_role(workspace_id, '{owner,admin}'));

-- Members: members read the directory. Role changes go through set_member_role().
-- Anyone but the owner may leave; the owner removes anyone else; admins remove
-- non-admins (only the owner manages admins, as in set_member_role).
create policy members_select on public.workspace_members for select to authenticated
  using (public.is_member(workspace_id));
create policy members_delete on public.workspace_members for delete to authenticated
  using (
    role <> 'owner' and (
      user_id = auth.uid()
      or public.has_role(workspace_id, '{owner}')
      or (role <> 'admin' and public.has_role(workspace_id, '{admin}'))
    )
  );

-- Invites: owner and admins only; only the owner may invite an admin.
-- Accepting goes through accept_invite().
create policy invites_select on public.workspace_invites for select to authenticated
  using (public.has_role(workspace_id, '{owner,admin}'));
create policy invites_insert on public.workspace_invites for insert to authenticated
  with check (
    public.has_role(workspace_id, '{owner,admin}') and invited_by = auth.uid() and accepted_at is null
    and (role <> 'admin' or public.has_role(workspace_id, '{owner}'))
  );
create policy invites_delete on public.workspace_invites for delete to authenticated
  using (public.has_role(workspace_id, '{owner,admin}'));

-- Projects: members read; managers and above write.
create policy projects_select on public.projects for select to authenticated
  using (public.is_member(workspace_id));
create policy projects_write on public.projects for all to authenticated
  using (public.has_role(workspace_id, '{owner,admin,manager}'))
  with check (public.has_role(workspace_id, '{owner,admin,manager}'));

-- Tasks: members read; managers and above write; a member may add and update
-- tasks assigned to themselves (viewers are read-only).
create policy tasks_select on public.tasks for select to authenticated
  using (public.is_member(workspace_id));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (
    created_by = auth.uid() and (
      public.has_role(workspace_id, '{owner,admin,manager}')
      or (public.has_role(workspace_id, '{member}') and assignee_id = auth.uid())
    )
  );
create policy tasks_update on public.tasks for update to authenticated
  using (
    public.has_role(workspace_id, '{owner,admin,manager}')
    or (public.has_role(workspace_id, '{member}') and assignee_id = auth.uid())
  )
  with check (
    public.has_role(workspace_id, '{owner,admin,manager}')
    or (public.has_role(workspace_id, '{member}') and assignee_id = auth.uid())
  );
create policy tasks_delete on public.tasks for delete to authenticated
  using (public.has_role(workspace_id, '{owner,admin,manager}'));

-- Daily reports: the author and managers+ read; only the author writes, for
-- yesterday, today, or tomorrow (a day of slack covers time zones).
create policy reports_select on public.daily_reports for select to authenticated
  using (author_id = auth.uid() or public.has_role(workspace_id, '{owner,admin,manager}'));
create policy reports_insert on public.daily_reports for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.has_role(workspace_id, '{owner,admin,manager,member}')
    and report_date between current_date - 1 and current_date + 1
  );
create policy reports_update on public.daily_reports for update to authenticated
  using (
    author_id = auth.uid()
    and public.has_role(workspace_id, '{owner,admin,manager,member}')
    and report_date between current_date - 1 and current_date + 1
  )
  with check (
    author_id = auth.uid()
    and public.has_role(workspace_id, '{owner,admin,manager,member}')
    and report_date between current_date - 1 and current_date + 1
  );

-- Blockers follow their report: visible with it; the author adds and edits
-- (while not a viewer); managers+ may also update them (to resolve).
create policy blockers_select on public.report_blockers for select to authenticated
  using (exists (select 1 from public.daily_reports r where r.id = report_id));
create policy blockers_insert on public.report_blockers for insert to authenticated
  with check (exists (
    select 1 from public.daily_reports r
    where r.id = report_id and r.author_id = auth.uid()
      and public.has_role(r.workspace_id, '{owner,admin,manager,member}')
  ));
create policy blockers_update on public.report_blockers for update to authenticated
  using (exists (
    select 1 from public.daily_reports r
    where r.id = report_id and (
      (r.author_id = auth.uid() and public.has_role(r.workspace_id, '{owner,admin,manager,member}'))
      or public.has_role(r.workspace_id, '{owner,admin,manager}')
    )
  ));

-- Approvals: requester, approver, and owner/admins read; managers+ submit, to a
-- manager+ approver other than themselves. Decisions go through decide_approval().
create policy approvals_select on public.approvals for select to authenticated
  using (
    requested_by = auth.uid() or approver_id = auth.uid()
    or public.has_role(workspace_id, '{owner,admin}')
  );
create policy approvals_insert on public.approvals for insert to authenticated
  with check (
    requested_by = auth.uid()
    and approver_id <> requested_by
    and status = 'pending' and decided_at is null
    and public.has_role(workspace_id, '{owner,admin,manager}')
    and exists (
      select 1 from public.workspace_members m
      where m.workspace_id = approvals.workspace_id and m.user_id = approvals.approver_id
        and m.role in ('owner', 'admin', 'manager')
    )
  );

create policy approval_events_select on public.approval_events for select to authenticated
  using (exists (select 1 from public.approvals a where a.id = approval_id));

-- -------------------------------------------------------------- functions
-- Create a company and make the caller its owner.
create function public.create_workspace(p_name text, p_industry text default null, p_timezone text default 'Africa/Algiers', p_currency text default 'USD')
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  ws uuid;
begin
  if uid is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if (select count(*) from public.workspace_members where user_id = uid and role = 'owner') >= 5 then
    raise exception 'A user can own at most 5 companies' using errcode = '54000';
  end if;
  insert into public.workspaces (name, industry, timezone, currency, created_by)
  values (p_name, p_industry, p_timezone, p_currency, uid)
  returning id into ws;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws, uid, 'owner');
  return ws;
end;
$$;

-- Join a company with an invite sent to your own email address.
create function public.accept_invite(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  my_email text;
  inv public.workspace_invites%rowtype;
begin
  if uid is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  select email into my_email from auth.users where id = uid;
  select * into inv from public.workspace_invites where token = p_token for update;
  if not found or inv.accepted_at is not null or inv.expires_at < now() then
    raise exception 'This invitation is invalid or has expired' using errcode = 'P0002';
  end if;
  if lower(inv.email) <> lower(coalesce(my_email, '')) then
    raise exception 'This invitation was sent to another email address' using errcode = '42501';
  end if;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, uid, inv.role)
  on conflict (workspace_id, user_id) do nothing;
  update public.workspace_invites set accepted_at = now(), accepted_by = uid where id = inv.id;
  return inv.workspace_id;
end;
$$;

-- Approve, reject, ask for changes, or start a review; recorded in approval_events.
-- The approver or an owner/admin decides, never the requester. A missing request
-- and a forbidden one give the same error, so outsiders learn nothing.
create function public.decide_approval(p_id uuid, p_status public.approval_status, p_note text default null)
returns public.approval_status
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  a public.approvals%rowtype;
begin
  select * into a from public.approvals where id = p_id for update;
  if not found or uid is null or not (a.approver_id = uid or public.has_role(a.workspace_id, '{owner,admin}')) then
    raise exception 'This request is not yours to decide' using errcode = '42501';
  end if;
  if a.requested_by = uid then
    raise exception 'Nobody decides a request they submitted' using errcode = '42501';
  end if;
  if a.status in ('approved', 'rejected') then
    raise exception 'This request is already decided' using errcode = '55000';
  end if;
  if p_status = 'pending' or p_status = a.status then
    raise exception 'Choose a new status' using errcode = '22023';
  end if;
  update public.approvals
    set status = p_status,
        decided_at = case when p_status in ('approved', 'rejected') then now() end,
        decision_note = coalesce(p_note, decision_note)
    where id = p_id;
  insert into public.approval_events (approval_id, actor_id, from_status, to_status, note)
  values (p_id, uid, a.status, p_status, p_note);
  return p_status;
end;
$$;

-- Change a member's role. Owner/admins manage manager/member/viewer; only the
-- owner grants or removes admin; the owner's own role never changes here. The
-- caller is checked first, so a non-admin learns nothing about the members.
create function public.set_member_role(p_workspace uuid, p_user uuid, p_role public.access_role)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  target public.access_role;
begin
  if not public.has_role(p_workspace, '{owner,admin}') then
    raise exception 'Only the owner or an admin can change roles' using errcode = '42501';
  end if;
  select role into target from public.workspace_members where workspace_id = p_workspace and user_id = p_user;
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
  if p_role = 'owner' or target = 'owner' then
    raise exception 'Ownership cannot be changed here' using errcode = '42501';
  end if;
  if (p_role = 'admin' or target = 'admin') and not public.has_role(p_workspace, '{owner}') then
    raise exception 'Only the owner manages admins' using errcode = '42501';
  end if;
  update public.workspace_members set role = p_role where workspace_id = p_workspace and user_id = p_user;
end;
$$;

-- ----------------------------------------------------------------- grants
-- Signed-out visitors get nothing; signed-in users get table access that RLS narrows.
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon, public;
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles, public.workspaces, public.departments, public.workspace_members,
  public.workspace_invites, public.projects, public.tasks, public.daily_reports,
  public.report_blockers, public.approvals, public.approval_events
  to authenticated;
grant execute on function
  public.is_member(uuid), public.has_role(uuid, public.access_role[]), public.shares_workspace(uuid),
  public.create_workspace(text, text, text, text), public.accept_invite(text),
  public.decide_approval(uuid, public.approval_status, text),
  public.set_member_role(uuid, uuid, public.access_role)
  to authenticated;
