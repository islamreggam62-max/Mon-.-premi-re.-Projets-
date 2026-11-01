-- =============================================================================
--  NEXORA — initial schema (Phase 2)
-- =============================================================================
--  Run with the Supabase CLI (`supabase db push` / `supabase db reset`) or paste
--  into the Supabase SQL editor. This file was NOT executed in the build session
--  that created it — it is provided for you to apply against your own project.
--
--  Multi-tenant model: every business row carries a workspace_id. A signed-in
--  user belongs to exactly one workspace via their profile, and Row-Level
--  Security restricts every read/write to that workspace.
-- =============================================================================

-- gen_random_uuid() lives in pgcrypto (preinstalled on Supabase).
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Core tenancy tables
-- -----------------------------------------------------------------------------
create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  full_name    text not null,
  role         text not null default 'Member',
  email        text not null,
  initials     text not null default '??',
  timezone     text not null default 'UTC',
  created_at   timestamptz not null default now()
);
create index if not exists profiles_workspace_idx on public.profiles (workspace_id);

-- -----------------------------------------------------------------------------
-- Helper: the workspace of the current user (SECURITY DEFINER avoids RLS
-- recursion when policies reference profiles).
-- -----------------------------------------------------------------------------
create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.profiles where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Business tables
-- -----------------------------------------------------------------------------
create table if not exists public.team_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null,
  role         text not null,
  department   text not null,
  email        text not null,
  status       text not null default 'offline' check (status in ('active','away','offline')),
  utilization  int  not null default 0 check (utilization between 0 and 100),
  active_tasks int  not null default 0,
  initials     text not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null,
  client       text not null default 'Internal',
  status       text not null default 'On track' check (status in ('On track','At risk','Delayed','Completed')),
  progress     int  not null default 0 check (progress between 0 and 100),
  lead         text not null default '',
  budget_used  numeric not null default 0,
  budget_total numeric not null default 0,
  due_date     date,
  team         text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create table if not exists public.tasks (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  title             text not null,
  project           text not null default '',
  assignee          text not null default '',
  assignee_initials text not null default '??',
  priority          text not null default 'Medium' check (priority in ('Low','Medium','High','Urgent')),
  state             text not null default 'Backlog' check (state in ('Backlog','In progress','In review','Done')),
  due               text not null default '',
  sort_order        int  not null default 0,
  created_at        timestamptz not null default now()
);

create table if not exists public.daily_reports (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  author       text not null,
  initials     text not null,
  role         text not null default '',
  report_date  date not null default current_date,
  summary      text not null default '',
  done         text[] not null default '{}',
  blockers     text[] not null default '{}',
  mood         text not null default 'Good' check (mood in ('Great','Good','Okay','Blocked')),
  created_at   timestamptz not null default now()
);

create table if not exists public.approvals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title        text not null,
  type         text not null check (type in ('Expense','Hiring','Contract','Access','Budget')),
  requested_by text not null,
  initials     text not null,
  amount       text,
  submitted    text not null default '',
  priority     text not null default 'Medium' check (priority in ('Low','Medium','High','Urgent')),
  decision     text not null default 'pending' check (decision in ('pending','approved','rejected')),
  created_at   timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title        text not null,
  detail       text not null,
  category     text not null check (category in ('Risk','Opportunity','Efficiency','Forecast')),
  confidence   int  not null default 0 check (confidence between 0 and 100),
  created_at   timestamptz not null default now()
);

create table if not exists public.activity_events (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor        text not null,
  initials     text not null,
  action       text not null,
  target       text not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.kpis (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  key          text not null,
  label        text not null,
  value        text not null,
  raw          numeric not null default 0,
  delta_pct    numeric not null default 0,
  trend        text not null default 'up' check (trend in ('up','down')),
  hint         text not null default '',
  sort_order   int  not null default 0
);

create table if not exists public.revenue_points (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  month        text not null,
  revenue      int  not null default 0,
  target       int  not null default 0,
  sort_order   int  not null default 0
);

create table if not exists public.activity_points (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  day          text not null,
  tasks        int  not null default 0,
  reports      int  not null default 0,
  sort_order   int  not null default 0
);

-- index workspace_id on every business table for fast tenant filtering
create index if not exists team_members_ws_idx     on public.team_members (workspace_id);
create index if not exists projects_ws_idx         on public.projects (workspace_id);
create index if not exists tasks_ws_idx            on public.tasks (workspace_id);
create index if not exists daily_reports_ws_idx    on public.daily_reports (workspace_id);
create index if not exists approvals_ws_idx        on public.approvals (workspace_id);
create index if not exists ai_insights_ws_idx      on public.ai_insights (workspace_id);
create index if not exists activity_events_ws_idx  on public.activity_events (workspace_id);
create index if not exists kpis_ws_idx             on public.kpis (workspace_id);
create index if not exists revenue_points_ws_idx   on public.revenue_points (workspace_id);
create index if not exists activity_points_ws_idx  on public.activity_points (workspace_id);

-- -----------------------------------------------------------------------------
-- Row-Level Security
-- -----------------------------------------------------------------------------
alter table public.workspaces      enable row level security;
alter table public.profiles        enable row level security;
alter table public.team_members    enable row level security;
alter table public.projects        enable row level security;
alter table public.tasks           enable row level security;
alter table public.daily_reports   enable row level security;
alter table public.approvals       enable row level security;
alter table public.ai_insights     enable row level security;
alter table public.activity_events enable row level security;
alter table public.kpis            enable row level security;
alter table public.revenue_points  enable row level security;
alter table public.activity_points enable row level security;

-- workspaces: a member can read their own workspace
drop policy if exists "read own workspace" on public.workspaces;
create policy "read own workspace" on public.workspaces
  for select to authenticated
  using (id = public.current_workspace_id());

-- profiles: read everyone in your workspace; update only your own row
drop policy if exists "read workspace profiles" on public.profiles;
create policy "read workspace profiles" on public.profiles
  for select to authenticated
  using (workspace_id = public.current_workspace_id());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- business tables: full access scoped to the caller's workspace.
-- One uniform policy per table keeps the model easy to audit.
do $$
declare t text;
begin
  foreach t in array array[
    'team_members','projects','tasks','daily_reports','approvals',
    'ai_insights','activity_events','kpis','revenue_points','activity_points'
  ]
  loop
    execute format('drop policy if exists "workspace access" on public.%I;', t);
    execute format($f$
      create policy "workspace access" on public.%I
        for all to authenticated
        using (workspace_id = public.current_workspace_id())
        with check (workspace_id = public.current_workspace_id());
    $f$, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Auto-provision a workspace + profile when a new auth user signs up.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1)
  );

  insert into public.workspaces (name)
  values (coalesce(new.raw_user_meta_data ->> 'workspace_name', display_name || '''s workspace'))
  returning id into ws_id;

  insert into public.profiles (id, workspace_id, full_name, email, initials)
  values (
    new.id,
    ws_id,
    display_name,
    new.email,
    upper(left(regexp_replace(display_name, '[^A-Za-z]', '', 'g') || 'X', 2))
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Realtime: publish the feeds the UI subscribes to in later work.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.activity_events';
    execute 'alter publication supabase_realtime add table public.approvals';
  end if;
exception when duplicate_object then
  null;
end $$;
