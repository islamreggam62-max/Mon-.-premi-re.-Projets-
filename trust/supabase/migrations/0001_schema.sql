-- TRUST — core schema, multi-tenant isolation (RLS), workflow RPCs, audit trail.
--
-- Design rules enforced here, in the database, not only in the app:
--   1. Every tenant row carries org_id; every table has RLS; access = membership.
--   2. Children reference parents with composite (id, org_id) foreign keys, so a
--      row can never point at another organisation's contract or document.
--   3. AI-generated content and its "evidence verified" flag are written only by
--      the server (service role). Signed-in users can change workflow status,
--      never the finding or its evidence.
--   4. Memberships, reviews and contract status change only through the RPCs
--      below, which enforce role checks and separation of duties.
--   5. audit_log is append-only and filled by triggers.

create schema if not exists private;

-- ---------------------------------------------------------------- enums ----
create type public.org_role as enum ('owner', 'admin', 'manager', 'reviewer', 'viewer');
create type public.contract_status as enum ('draft', 'in_review', 'approved', 'active', 'expired', 'terminated');
create type public.risk_severity as enum ('low', 'medium', 'high', 'critical');
create type public.risk_status as enum ('open', 'accepted', 'mitigated', 'dismissed');
create type public.obligation_status as enum ('open', 'in_progress', 'done', 'waived');
create type public.review_status as enum ('pending', 'approved', 'rejected', 'changes_requested', 'cancelled');
create type public.analysis_status as enum ('queued', 'extracting', 'analyzing', 'completed', 'failed');
create type public.finding_source as enum ('ai', 'manual');
-- 'quote'   : backed by a verbatim quotation located in the document.
-- 'absence' : something the document does NOT contain; cannot be quote-checked.
create type public.evidence_kind as enum ('quote', 'absence');
create type public.plan_tier as enum ('trial', 'starter', 'business', 'enterprise');

-- --------------------------------------------------------------- tables ----
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete restrict,
  email text not null check (email = lower(email) and position('@' in email) > 1),
  role public.org_role not null check (role <> 'owner'),
  token_hash text not null unique,           -- sha256 of the token; the token itself is never stored
  invited_by uuid not null references auth.users (id),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitations_org_idx on public.invitations (org_id);

-- Billing state. Written only by the server (payment-provider webhook).
-- The limits below are PLACEHOLDERS: pricing and plan limits are a commercial
-- decision for the project owner.
create table public.subscriptions (
  org_id uuid primary key references public.organizations (id) on delete restrict,
  plan public.plan_tier not null default 'trial',
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  seat_limit int not null default 3 check (seat_limit > 0),
  contract_limit int not null default 10 check (contract_limit > 0),
  monthly_analysis_limit int not null default 20 check (monthly_analysis_limit > 0),
  current_period_end timestamptz not null default now() + interval '14 days',
  provider_customer_id text,
  provider_subscription_id text,
  updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  counterparty text,
  our_party text,                            -- which party "we" are; sets the risk perspective
  contract_type text,
  description text,
  status public.contract_status not null default 'draft',
  effective_date date,
  expiration_date date,
  auto_renews boolean,
  renewal_term_months int check (renewal_term_months is null or renewal_term_months > 0),
  notice_period_days int check (notice_period_days is null or notice_period_days between 0 and 3650),
  -- last day on which notice of non-renewal / termination can still be given
  notice_deadline date generated always as (expiration_date - notice_period_days) stored,
  total_value numeric(18, 2) check (total_value is null or total_value >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  governing_law text,
  owner_id uuid,                             -- a member of this organisation (constraint below)
  risk_score int check (risk_score is null or risk_score between 0 and 100),
  risk_level public.risk_severity,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  -- when the member leaves, only owner_id is cleared
  foreign key (org_id, owner_id) references public.memberships (org_id, user_id) on delete set null (owner_id),
  check (expiration_date is null or effective_date is null or expiration_date >= effective_date)
);
create index contracts_org_idx on public.contracts (org_id, status);
create index contracts_expiry_idx on public.contracts (org_id, expiration_date);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  contract_id uuid not null,
  storage_path text not null unique,
  filename text not null check (char_length(filename) between 1 and 255),
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  page_count int,
  uploaded_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (id, org_id),
  unique (id, contract_id),
  foreign key (contract_id, org_id) references public.contracts (id, org_id) on delete cascade,
  -- The path is exactly "<org_id>/<contract_id>/<id>.<pdf|docx>": nothing in it is chosen by
  -- the caller, so it can never contain "..", a query string or another tenant's folder.
  check (storage_path = org_id::text || '/' || contract_id::text || '/' || id::text
         || case mime_type when 'application/pdf' then '.pdf' else '.docx' end)
);
create index documents_contract_idx on public.documents (contract_id);

create table public.document_pages (
  document_id uuid not null,
  org_id uuid not null,
  page_number int not null check (page_number >= 1),
  content text not null,
  primary key (document_id, page_number),
  foreign key (document_id, org_id) references public.documents (id, org_id) on delete cascade
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  contract_id uuid not null,
  document_id uuid not null,
  status public.analysis_status not null default 'queued',
  model text,
  prompt_version text,
  document_language text,
  summary text,
  error text,
  input_tokens int,
  output_tokens int,
  requested_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (id, org_id),
  foreign key (contract_id, org_id) references public.contracts (id, org_id) on delete cascade,
  foreign key (document_id, org_id) references public.documents (id, org_id) on delete cascade,
  foreign key (document_id, contract_id) references public.documents (id, contract_id) on delete cascade
);
create index analyses_contract_idx on public.analyses (contract_id, created_at desc);
create unique index analyses_one_running_idx on public.analyses (contract_id)
  where status in ('queued', 'extracting', 'analyzing');

-- What was consumed, kept apart from the rows that consumed it: deleting a contract
-- or a document does not give the quota back.
create table public.usage_events (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete restrict,
  kind text not null check (kind in ('analysis')),
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index usage_events_org_idx on public.usage_events (org_id, kind, created_at);
create index usage_events_day_idx on public.usage_events (kind, created_at);

create table public.contract_parties (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  contract_id uuid not null,
  analysis_id uuid not null,
  name text not null,
  role text,
  page_number int,
  clause_ref text,
  quote text,
  evidence_verified boolean not null default false,
  superseded boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (contract_id, org_id) references public.contracts (id, org_id) on delete cascade,
  foreign key (analysis_id, org_id) references public.analyses (id, org_id) on delete cascade
);
create index contract_parties_contract_idx on public.contract_parties (contract_id) where not superseded;

create table public.contract_facts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  contract_id uuid not null,
  analysis_id uuid not null,
  field text not null check (field in (
    'effective_date', 'expiration_date', 'auto_renews', 'renewal_term_months',
    'notice_period_days', 'total_value', 'governing_law', 'payment_terms',
    'liability_cap', 'dispute_resolution', 'other')),
  label text not null,
  value_text text not null,
  value_date date,
  value_number numeric(18, 2),
  currency text,
  page_number int,
  clause_ref text,
  quote text,
  evidence_verified boolean not null default false,
  superseded boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (contract_id, org_id) references public.contracts (id, org_id) on delete cascade,
  foreign key (analysis_id, org_id) references public.analyses (id, org_id) on delete cascade
);
create index contract_facts_contract_idx on public.contract_facts (contract_id) where not superseded;

create table public.risks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  contract_id uuid not null,
  analysis_id uuid,
  source public.finding_source not null default 'manual',
  evidence_kind public.evidence_kind not null default 'quote',
  category text not null,
  severity public.risk_severity not null,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  explanation text not null,
  recommendation text,
  page_number int,
  clause_ref text,
  quote text,
  evidence_verified boolean not null default false,
  superseded boolean not null default false,
  status public.risk_status not null default 'open',
  resolution_note text,
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (contract_id, org_id) references public.contracts (id, org_id) on delete cascade,
  foreign key (analysis_id, org_id) references public.analyses (id, org_id) on delete cascade,
  check ((source = 'ai') = (analysis_id is not null)),
  -- a person cannot attest machine verification; only AI findings carry the flag
  check (source = 'ai' or evidence_verified = false)
);
create index risks_contract_idx on public.risks (contract_id) where not superseded;
create index risks_org_open_idx on public.risks (org_id, severity) where not superseded and status = 'open';

create table public.obligations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  contract_id uuid not null,
  analysis_id uuid,
  source public.finding_source not null default 'manual',
  responsible_party text,
  category text not null default 'other',
  description text not null check (char_length(btrim(description)) between 1 and 2000),
  due_date date,
  recurrence text,
  page_number int,
  clause_ref text,
  quote text,
  evidence_verified boolean not null default false,
  superseded boolean not null default false,
  status public.obligation_status not null default 'open',
  assignee_id uuid,                          -- a member of this organisation (constraint below)
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (contract_id, org_id) references public.contracts (id, org_id) on delete cascade,
  foreign key (analysis_id, org_id) references public.analyses (id, org_id) on delete cascade,
  foreign key (org_id, assignee_id) references public.memberships (org_id, user_id) on delete set null (assignee_id),
  check ((source = 'ai') = (analysis_id is not null)),
  check (source = 'ai' or evidence_verified = false)
);
create index obligations_contract_idx on public.obligations (contract_id) where not superseded;
create index obligations_due_idx on public.obligations (org_id, due_date) where not superseded;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  contract_id uuid not null,
  requested_by uuid not null references auth.users (id),
  reviewer_id uuid not null references auth.users (id),
  status public.review_status not null default 'pending',
  comment text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  foreign key (contract_id, org_id) references public.contracts (id, org_id) on delete cascade,
  check (requested_by <> reviewer_id)        -- separation of duties
);
create index reviews_reviewer_idx on public.reviews (org_id, reviewer_id, status);
create unique index reviews_one_pending_idx on public.reviews (contract_id) where status = 'pending';

create table public.audit_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete restrict,
  actor_id uuid,                              -- null = system (server-side job)
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_org_idx on public.audit_log (org_id, created_at desc);

-- ----------------------------------------------------- helper functions ----
-- SECURITY DEFINER so RLS policies can consult memberships without recursing
-- into the policies of memberships itself. Kept in a schema the API does not expose.
create function private.is_member(_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = _org and m.user_id = (select auth.uid()));
$$;

create function private.has_role(_org uuid, _roles public.org_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = _org and m.user_id = (select auth.uid()) and m.role = any (_roles));
$$;

create function private.shares_org_with(_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships mine
    join public.memberships theirs on theirs.org_id = mine.org_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = _user);
$$;

create function private.try_uuid(_value text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return _value::uuid;
exception when others then
  return null;
end $$;

create function private.require_user() returns uuid
language plpgsql stable set search_path = '' as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  return _uid;
end $$;

-- ------------------------------------------------------------- triggers ----
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger contracts_touch before update on public.contracts
  for each row execute function private.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function private.touch_updated_at();

-- Plan limits.
create function private.enforce_contract_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare _sub public.subscriptions; _count int;
begin
  select * into _sub from public.subscriptions where org_id = new.org_id for update;
  if _sub.status = 'canceled' then
    raise exception 'subscription_inactive' using errcode = 'P0001';
  end if;
  select count(*) into _count from public.contracts where org_id = new.org_id;
  if _sub.contract_limit is not null and _count >= _sub.contract_limit then
    raise exception 'plan_limit_contracts' using errcode = 'P0001',
      hint = 'The organisation has reached the contract limit of its plan.';
  end if;
  return new;
end $$;
create trigger contracts_plan_limit before insert on public.contracts
  for each row execute function private.enforce_contract_limit();

-- Gate for starting an AI analysis. Usage is counted in usage_events, which nobody
-- can delete, so removing contracts or documents does not reset the monthly quota.
create function private.enforce_analysis_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare _sub public.subscriptions; _count int;
begin
  select * into _sub from public.subscriptions where org_id = new.org_id for update;
  if _sub.status = 'canceled' then
    raise exception 'subscription_inactive' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.contracts where id = new.contract_id and status = 'in_review') then
    raise exception 'contract_locked' using errcode = 'P0001',
      hint = 'Findings cannot be regenerated while a review is pending.';
  end if;
  -- A job that never finished must not block the contract for ever.
  update public.analyses
    set status = 'failed', error = 'The analysis did not finish.', finished_at = now()
    where contract_id = new.contract_id
      and status in ('queued', 'extracting', 'analyzing')
      and created_at < now() - interval '15 minutes';
  select count(*) into _count from public.usage_events
    where org_id = new.org_id and kind = 'analysis' and created_at >= date_trunc('month', now());
  if _sub.monthly_analysis_limit is not null and _count >= _sub.monthly_analysis_limit then
    raise exception 'plan_limit_analyses' using errcode = 'P0001',
      hint = 'The organisation has used all AI analyses included in its plan this month.';
  end if;
  insert into public.usage_events (org_id, kind, actor_id) values (new.org_id, 'analysis', auth.uid());
  return new;
end $$;
create trigger analyses_plan_limit before insert on public.analyses
  for each row execute function private.enforce_analysis_limit();

-- Contract risk score: deterministic, computed here from findings — never taken
-- from the model. Counts open and accepted risks that are either AI findings whose
-- quotation was located in the document, or manual entries. Unverified AI findings
-- and "absence" findings do not move the score until a person records them manually.
create function private.recompute_contract_risk(_contract uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare _score int; _analysed boolean;
begin
  select least(100, coalesce(sum(case severity
      when 'critical' then 40 when 'high' then 20 when 'medium' then 8 else 2 end), 0))::int
    into _score
    from public.risks
    where contract_id = _contract and not superseded
      and status in ('open', 'accepted')
      and (source = 'manual' or (evidence_verified and evidence_kind = 'quote'));

  select exists (select 1 from public.analyses where contract_id = _contract and status = 'completed')
      or exists (select 1 from public.risks where contract_id = _contract and not superseded)
    into _analysed;

  update public.contracts set
    risk_score = case when _analysed then _score end,
    risk_level = case
      when not _analysed then null
      when _score >= 60 then 'critical'::public.risk_severity
      when _score >= 30 then 'high'::public.risk_severity
      when _score >= 10 then 'medium'::public.risk_severity
      else 'low'::public.risk_severity end
  where id = _contract;
end $$;

create function private.risks_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.recompute_contract_risk(coalesce(new.contract_id, old.contract_id));
  return null;
end $$;
create trigger risks_recompute after insert or update or delete on public.risks
  for each row execute function private.risks_changed();

create function private.stamp_risk_resolution() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'open' then
      new.resolved_by := null; new.resolved_at := null;
    else
      new.resolved_by := auth.uid(); new.resolved_at := now();
    end if;
  end if;
  return new;
end $$;
create trigger risks_stamp before update on public.risks
  for each row execute function private.stamp_risk_resolution();

create function private.stamp_obligation_completion() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    new.completed_at := case when new.status = 'done' then now() end;
  end if;
  return new;
end $$;
create trigger obligations_stamp before update on public.obligations
  for each row execute function private.stamp_obligation_completion();

-- What is under review, approved or in force must stay what was submitted. In those
-- states the contract record and its documents are locked; to change them the contract
-- is reopened as a draft (set_contract_status) and goes through review again.
-- Still allowed: status moves (made only by the workflow functions), the computed risk
-- fields, and owner_id (reassigning who follows the contract, or a member leaving).
create function private.lock_contract_record() returns trigger
language plpgsql set search_path = '' as $$
declare
  -- notice_deadline is generated: it is not yet computed on NEW in a BEFORE trigger
  _skip text[] := array['status', 'risk_score', 'risk_level', 'updated_at', 'notice_deadline', 'owner_id'];
begin
  if old.status in ('in_review', 'approved', 'active')
     and (to_jsonb(new) - _skip) is distinct from (to_jsonb(old) - _skip) then
    raise exception 'contract_locked' using errcode = 'P0001',
      hint = 'Reopen the contract as a draft to change its record.';
  end if;
  return new;
end $$;
create trigger contracts_lock before update on public.contracts
  for each row execute function private.lock_contract_record();

create function private.lock_contract_documents() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  _contract uuid := case when tg_op = 'DELETE' then old.contract_id else new.contract_id end;
  _status public.contract_status;
begin
  -- FOR SHARE waits for a review request that is being recorded on this contract.
  select status into _status from public.contracts where id = _contract for share;
  if not found then
    return coalesce(new, old);                -- the contract itself is being deleted
  end if;
  if _status in ('in_review', 'approved', 'active') then
    raise exception 'contract_locked' using errcode = 'P0001',
      hint = 'Reopen the contract as a draft to add or remove documents.';
  end if;
  -- Deleting an analysed document would silently delete its findings with it.
  if tg_op = 'DELETE' and exists (select 1 from public.analyses where document_id = old.id) then
    raise exception 'document_has_analyses' using errcode = 'P0001',
      hint = 'A document that has been analysed is kept with its findings.';
  end if;
  return coalesce(new, old);
end $$;
create trigger documents_lock before insert or delete on public.documents
  for each row execute function private.lock_contract_documents();

-- An assignee who is not a manager may move the status of their obligation, nothing else.
create function private.guard_obligation_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null
     and not private.has_role(new.org_id, array['owner', 'admin', 'manager']::public.org_role[])
     and ((new.assignee_id is not null and new.assignee_id is distinct from old.assignee_id)
          or new.due_date is distinct from old.due_date) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger obligations_guard before update on public.obligations
  for each row execute function private.guard_obligation_update();

-- Audit trail. One generic trigger; TG_ARGV[0] = entity type, TG_ARGV[1] = id column.
create function private.audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  _new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  _old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  _row jsonb := coalesce(_new, _old);
  _meta jsonb := '{}'::jsonb;
  _changed text[];
begin
  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into _changed
      from jsonb_each(_new) n
      where n.value is distinct from _old -> n.key and n.key <> 'updated_at';
    if _changed is null then
      return null;                            -- nothing actually changed
    end if;
    _meta := jsonb_build_object('changed', _changed);
    if _new ? 'status' and _new -> 'status' is distinct from _old -> 'status' then
      _meta := _meta || jsonb_build_object('status_from', _old -> 'status', 'status_to', _new -> 'status');
    end if;
    if _new ? 'role' and _new -> 'role' is distinct from _old -> 'role' then
      _meta := _meta || jsonb_build_object('role_from', _old -> 'role', 'role_to', _new -> 'role');
    end if;
  end if;
  insert into public.audit_log (org_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    (_row ->> 'org_id')::uuid,
    auth.uid(),
    tg_argv[0] || '.' || case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end,
    tg_argv[0],
    (_row ->> tg_argv[1])::uuid,
    _meta);
  return null;
end $$;

create trigger audit_contracts after insert or update or delete on public.contracts
  for each row execute function private.audit('contract', 'id');
create trigger audit_documents after insert or delete on public.documents
  for each row execute function private.audit('document', 'id');
create trigger audit_analyses after insert or update on public.analyses
  for each row execute function private.audit('analysis', 'id');
create trigger audit_risks after insert or update or delete on public.risks
  for each row execute function private.audit('risk', 'id');
create trigger audit_obligations after insert or update or delete on public.obligations
  for each row execute function private.audit('obligation', 'id');
create trigger audit_reviews after insert or update on public.reviews
  for each row execute function private.audit('review', 'id');
create trigger audit_memberships after insert or update or delete on public.memberships
  for each row execute function private.audit('membership', 'user_id');
create trigger audit_invitations after insert or update or delete on public.invitations
  for each row execute function private.audit('invitation', 'id');
create trigger audit_subscriptions after update on public.subscriptions
  for each row execute function private.audit('subscription', 'org_id');

create function private.audit_is_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = '42501';
end $$;
create trigger audit_log_no_change before update or delete on public.audit_log
  for each row execute function private.audit_is_append_only();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.audit_is_append_only();
create trigger usage_events_no_change before update or delete on public.usage_events
  for each row execute function private.audit_is_append_only();
create trigger usage_events_no_truncate before truncate on public.usage_events
  for each statement execute function private.audit_is_append_only();

-- ------------------------------------------------------------------ RPC ----
create function public.create_organization(_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare _uid uuid := private.require_user(); _org uuid;
begin
  if (select count(*) from public.organizations where created_by = _uid) >= 5 then
    raise exception 'too_many_organizations' using errcode = 'P0001';
  end if;
  insert into public.organizations (name, created_by) values (btrim(_name), _uid) returning id into _org;
  insert into public.subscriptions (org_id) values (_org);
  insert into public.memberships (org_id, user_id, role) values (_org, _uid, 'owner');
  return _org;
end $$;

-- Returns the invitation token ONCE. Only its hash is stored.
create function public.create_invitation(_org uuid, _email text, _role public.org_role) returns text
language plpgsql security definer set search_path = '' as $$
declare
  _uid uuid := private.require_user();
  _token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  _clean text := lower(btrim(_email));
begin
  if not private.has_role(_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if _role = 'owner' then
    raise exception 'owner_cannot_be_invited' using errcode = 'P0001';
  end if;
  if _role = 'admin' and not private.has_role(_org, array['owner']::public.org_role[]) then
    raise exception 'only_owner_invites_admin' using errcode = '42501';
  end if;
  delete from public.invitations where org_id = _org and email = _clean and accepted_at is null;
  insert into public.invitations (org_id, email, role, token_hash, invited_by)
  values (_org, _clean, _role, encode(sha256(convert_to(_token, 'UTF8')), 'hex'), _uid);
  return _token;
end $$;

create function public.accept_invitation(_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  _uid uuid := private.require_user();
  _email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  _inv public.invitations;
  _seats int; _used int;
begin
  select * into _inv from public.invitations
    where token_hash = encode(sha256(convert_to(_token, 'UTF8')), 'hex')
    for update;
  if not found or _inv.accepted_at is not null or _inv.expires_at < now() then
    raise exception 'invitation_invalid_or_expired' using errcode = 'P0001';
  end if;
  -- The address must match AND be confirmed: the claim alone proves nothing if the
  -- project ever allows sign-in before email confirmation.
  if _inv.email <> _email or not exists (
       select 1 from auth.users u
       where u.id = _uid and lower(u.email) = _inv.email and u.email_confirmed_at is not null) then
    raise exception 'invitation_email_mismatch' using errcode = '42501';
  end if;
  if exists (select 1 from public.memberships where org_id = _inv.org_id and user_id = _uid) then
    update public.invitations set accepted_at = now() where id = _inv.id;
    return _inv.org_id;
  end if;
  select seat_limit into _seats from public.subscriptions where org_id = _inv.org_id for update;
  select count(*) into _used from public.memberships where org_id = _inv.org_id;
  if _seats is not null and _used >= _seats then
    raise exception 'plan_limit_seats' using errcode = 'P0001';
  end if;
  insert into public.memberships (org_id, user_id, role) values (_inv.org_id, _uid, _inv.role);
  update public.invitations set accepted_at = now() where id = _inv.id;
  return _inv.org_id;
end $$;

create function public.set_member_role(_org uuid, _user uuid, _role public.org_role) returns void
language plpgsql security definer set search_path = '' as $$
declare _uid uuid := private.require_user(); _current public.org_role; _is_owner boolean;
begin
  perform 1 from public.organizations where id = _org for update;
  _is_owner := private.has_role(_org, array['owner']::public.org_role[]);
  if not private.has_role(_org, array['owner', 'admin']::public.org_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select role into _current from public.memberships where org_id = _org and user_id = _user for update;
  if not found then
    raise exception 'member_not_found' using errcode = 'P0001';
  end if;
  -- only an owner may grant or remove the owner and admin roles
  if not _is_owner and (_current in ('owner', 'admin') or _role in ('owner', 'admin')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if _current = 'owner' and _role <> 'owner'
     and (select count(*) from public.memberships where org_id = _org and role = 'owner') <= 1 then
    raise exception 'last_owner' using errcode = 'P0001';
  end if;
  update public.memberships set role = _role where org_id = _org and user_id = _user;
end $$;

create function public.remove_member(_org uuid, _user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare _uid uuid := private.require_user(); _current public.org_role;
begin
  -- Outsiders learn nothing about who belongs to an organisation.
  if not private.is_member(_org) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform 1 from public.organizations where id = _org for update;
  select role into _current from public.memberships where org_id = _org and user_id = _user for update;
  if not found then
    raise exception 'member_not_found' using errcode = 'P0001';
  end if;
  if _user <> _uid then                        -- anyone may leave; removing others needs rights
    if not private.has_role(_org, array['owner', 'admin']::public.org_role[]) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if _current in ('owner', 'admin') and not private.has_role(_org, array['owner']::public.org_role[]) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
  end if;
  if _current = 'owner'
     and (select count(*) from public.memberships where org_id = _org and role = 'owner') <= 1 then
    raise exception 'last_owner' using errcode = 'P0001';
  end if;
  delete from public.memberships where org_id = _org and user_id = _user;
end $$;

create function public.request_review(_contract uuid, _reviewer uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare _uid uuid := private.require_user(); _c public.contracts; _review uuid;
begin
  select * into _c from public.contracts where id = _contract for update;
  if not found or not private.has_role(_c.org_id, array['owner', 'admin', 'manager']::public.org_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if _c.status <> 'draft' then
    raise exception 'contract_not_in_draft' using errcode = 'P0001';
  end if;
  if _reviewer = _uid then
    raise exception 'reviewer_must_differ_from_requester' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.memberships
                 where org_id = _c.org_id and user_id = _reviewer
                   and role in ('owner', 'admin', 'reviewer')) then
    raise exception 'reviewer_not_eligible' using errcode = 'P0001';
  end if;
  insert into public.reviews (org_id, contract_id, requested_by, reviewer_id)
  values (_c.org_id, _contract, _uid, _reviewer) returning id into _review;
  update public.contracts set status = 'in_review' where id = _contract;
  return _review;
end $$;

create function public.decide_review(_review uuid, _decision public.review_status, _comment text) returns void
language plpgsql security definer set search_path = '' as $$
declare _uid uuid := private.require_user(); _r public.reviews;
begin
  select * into _r from public.reviews where id = _review for update;
  -- the named reviewer, and only while they still hold a role that may review
  if not found or _r.reviewer_id <> _uid
     or not private.has_role(_r.org_id, array['owner', 'admin', 'reviewer']::public.org_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if _r.status <> 'pending' then
    raise exception 'review_already_decided' using errcode = 'P0001';
  end if;
  if _decision is null or _decision not in ('approved', 'rejected', 'changes_requested') then
    raise exception 'invalid_decision' using errcode = 'P0001';
  end if;
  if _decision <> 'approved' and nullif(btrim(coalesce(_comment, '')), '') is null then
    raise exception 'comment_required' using errcode = 'P0001';
  end if;
  update public.reviews
    set status = _decision, comment = nullif(btrim(coalesce(_comment, '')), ''), decided_at = now()
    where id = _review;
  update public.contracts
    set status = case when _decision = 'approved' then 'approved' else 'draft' end::public.contract_status
    where id = _r.contract_id and status = 'in_review';
end $$;

-- Withdraws a pending review: by the person who asked for it, or an owner or admin.
create function public.cancel_review(_review uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare _uid uuid := private.require_user(); _r public.reviews;
begin
  select * into _r from public.reviews where id = _review for update;
  if not found or not private.is_member(_r.org_id)
     or not (_r.requested_by = _uid or private.has_role(_r.org_id, array['owner', 'admin']::public.org_role[])) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if _r.status <> 'pending' then
    raise exception 'review_already_decided' using errcode = 'P0001';
  end if;
  update public.reviews set status = 'cancelled', decided_at = now() where id = _review;
  update public.contracts set status = 'draft' where id = _r.contract_id and status = 'in_review';
end $$;

-- Lifecycle moves that do not need a review. Approval itself only comes from decide_review.
create function public.set_contract_status(_contract uuid, _status public.contract_status) returns void
language plpgsql security definer set search_path = '' as $$
declare _uid uuid := private.require_user(); _c public.contracts;
begin
  select * into _c from public.contracts where id = _contract for update;
  if not found or not private.has_role(_c.org_id, array['owner', 'admin', 'manager']::public.org_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not (
       (_c.status = 'approved' and _status = 'active')
    or (_c.status in ('approved', 'active') and _status in ('expired', 'terminated'))
    or (_c.status in ('approved', 'active', 'expired', 'terminated') and _status = 'draft')
  ) then
    raise exception 'invalid_status_transition' using errcode = 'P0001';
  end if;
  update public.contracts set status = _status where id = _contract;
end $$;

-- Server-only: records that a member was given a download link. It is not callable by
-- users, so the audit log cannot be flooded or given misleading entries from the API.
create function public.record_document_download(_document uuid, _actor uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare _org uuid;
begin
  select org_id into _org from public.documents where id = _document;
  if not found or not exists (
       select 1 from public.memberships where org_id = _org and user_id = _actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.audit_log (org_id, actor_id, action, entity_type, entity_id)
  values (_org, _actor, 'document.downloaded', 'document', _document);
end $$;

-- Server-only: stores one finished analysis atomically. Earlier AI findings of the
-- same contract are kept for the record but flagged superseded.
create function public.store_analysis_results(_analysis uuid, _payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare _a public.analyses;
begin
  select * into _a from public.analyses where id = _analysis for update;
  if not found then
    raise exception 'analysis_not_found' using errcode = 'P0001';
  end if;
  if _a.status in ('completed', 'failed') then
    raise exception 'analysis_already_finished' using errcode = 'P0001';
  end if;

  update public.contract_parties set superseded = true where contract_id = _a.contract_id and not superseded;
  update public.contract_facts set superseded = true where contract_id = _a.contract_id and not superseded;
  update public.risks set superseded = true
    where contract_id = _a.contract_id and source = 'ai' and not superseded;
  update public.obligations set superseded = true
    where contract_id = _a.contract_id and source = 'ai' and not superseded;

  insert into public.contract_parties
    (org_id, contract_id, analysis_id, name, role, page_number, clause_ref, quote, evidence_verified)
  select _a.org_id, _a.contract_id, _a.id, x.name, x.role, x.page_number, x.clause_ref, x.quote,
         coalesce(x.evidence_verified, false)
  from jsonb_to_recordset(coalesce(_payload -> 'parties', '[]'::jsonb)) as x(
    name text, role text, page_number int, clause_ref text, quote text, evidence_verified boolean);

  insert into public.contract_facts
    (org_id, contract_id, analysis_id, field, label, value_text, value_date, value_number, currency,
     page_number, clause_ref, quote, evidence_verified)
  select _a.org_id, _a.contract_id, _a.id, x.field, x.label, x.value_text, x.value_date, x.value_number,
         x.currency, x.page_number, x.clause_ref, x.quote, coalesce(x.evidence_verified, false)
  from jsonb_to_recordset(coalesce(_payload -> 'facts', '[]'::jsonb)) as x(
    field text, label text, value_text text, value_date date, value_number numeric, currency text,
    page_number int, clause_ref text, quote text, evidence_verified boolean);

  insert into public.obligations
    (org_id, contract_id, analysis_id, source, responsible_party, category, description, due_date,
     recurrence, page_number, clause_ref, quote, evidence_verified)
  select _a.org_id, _a.contract_id, _a.id, 'ai', x.responsible_party, coalesce(x.category, 'other'),
         x.description, x.due_date, x.recurrence, x.page_number, x.clause_ref, x.quote,
         coalesce(x.evidence_verified, false)
  from jsonb_to_recordset(coalesce(_payload -> 'obligations', '[]'::jsonb)) as x(
    responsible_party text, category text, description text, due_date date, recurrence text,
    page_number int, clause_ref text, quote text, evidence_verified boolean);

  insert into public.risks
    (org_id, contract_id, analysis_id, source, evidence_kind, category, severity, title, explanation,
     recommendation, page_number, clause_ref, quote, evidence_verified)
  select _a.org_id, _a.contract_id, _a.id, 'ai', coalesce(x.evidence_kind, 'quote')::public.evidence_kind,
         x.category, x.severity::public.risk_severity, x.title, x.explanation, x.recommendation,
         x.page_number, x.clause_ref, x.quote,
         coalesce(x.evidence_verified, false) and coalesce(x.evidence_kind, 'quote') = 'quote'
  from jsonb_to_recordset(coalesce(_payload -> 'risks', '[]'::jsonb)) as x(
    evidence_kind text, category text, severity text, title text, explanation text, recommendation text,
    page_number int, clause_ref text, quote text, evidence_verified boolean);

  update public.analyses set
    status = 'completed',
    summary = _payload ->> 'summary',
    document_language = _payload ->> 'document_language',
    model = _payload ->> 'model',
    prompt_version = _payload ->> 'prompt_version',
    input_tokens = (_payload ->> 'input_tokens')::int,
    output_tokens = (_payload ->> 'output_tokens')::int,
    error = null,
    finished_at = now()
  where id = _analysis;

  perform private.recompute_contract_risk(_a.contract_id);
end $$;

-- ----------------------------------------------------------------- view ----
create view public.deadlines with (security_invoker = true) as
  select c.org_id, c.id as contract_id, c.title as contract_title, 'expiration'::text as kind,
         'Contract expires'::text as label, c.expiration_date as due_date, null::uuid as obligation_id
    from public.contracts c
    where c.expiration_date is not null and c.status not in ('expired', 'terminated')
  union all
  select c.org_id, c.id, c.title, 'notice',
         case when c.auto_renews then 'Last day to give notice before automatic renewal'
              else 'Last day to give notice' end,
         c.notice_deadline, null::uuid
    from public.contracts c
    where c.notice_deadline is not null and c.status not in ('expired', 'terminated')
  union all
  select o.org_id, o.contract_id, c.title, 'obligation', o.description, o.due_date, o.id
    from public.obligations o
    join public.contracts c on c.id = o.contract_id
    where o.due_date is not null and not o.superseded and o.status in ('open', 'in_progress');

-- ------------------------------------------------------------------ RLS ----
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.contracts enable row level security;
alter table public.documents enable row level security;
alter table public.document_pages enable row level security;
alter table public.analyses enable row level security;
alter table public.contract_parties enable row level security;
alter table public.contract_facts enable row level security;
alter table public.risks enable row level security;
alter table public.obligations enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_log enable row level security;
alter table public.usage_events enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_org_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy organizations_select on public.organizations for select to authenticated
  using (private.is_member(id));
create policy organizations_update on public.organizations for update to authenticated
  using (private.has_role(id, array['owner', 'admin']::public.org_role[]))
  with check (private.has_role(id, array['owner', 'admin']::public.org_role[]));

create policy memberships_select on public.memberships for select to authenticated
  using (private.is_member(org_id));

create policy invitations_select on public.invitations for select to authenticated
  using (private.has_role(org_id, array['owner', 'admin']::public.org_role[]));
create policy invitations_delete on public.invitations for delete to authenticated
  using (private.has_role(org_id, array['owner', 'admin']::public.org_role[]));

create policy subscriptions_select on public.subscriptions for select to authenticated
  using (private.is_member(org_id));

create policy contracts_select on public.contracts for select to authenticated
  using (private.is_member(org_id));
create policy contracts_insert on public.contracts for insert to authenticated
  with check (private.has_role(org_id, array['owner', 'admin', 'manager']::public.org_role[])
              and created_by = (select auth.uid()));
create policy contracts_update on public.contracts for update to authenticated
  using (private.has_role(org_id, array['owner', 'admin', 'manager']::public.org_role[]))
  with check (private.has_role(org_id, array['owner', 'admin', 'manager']::public.org_role[]));
create policy contracts_delete on public.contracts for delete to authenticated
  using (private.has_role(org_id, array['owner', 'admin']::public.org_role[]));

create policy documents_select on public.documents for select to authenticated
  using (private.is_member(org_id));
create policy documents_insert on public.documents for insert to authenticated
  with check (private.has_role(org_id, array['owner', 'admin', 'manager']::public.org_role[])
              and uploaded_by = (select auth.uid()));
create policy documents_delete on public.documents for delete to authenticated
  using (private.has_role(org_id, array['owner', 'admin']::public.org_role[]));

create policy document_pages_select on public.document_pages for select to authenticated
  using (private.is_member(org_id));

create policy analyses_select on public.analyses for select to authenticated
  using (private.is_member(org_id));
create policy analyses_insert on public.analyses for insert to authenticated
  with check (private.has_role(org_id, array['owner', 'admin', 'manager']::public.org_role[])
              and requested_by = (select auth.uid()));

create policy contract_parties_select on public.contract_parties for select to authenticated
  using (private.is_member(org_id));
create policy contract_facts_select on public.contract_facts for select to authenticated
  using (private.is_member(org_id));

create policy risks_select on public.risks for select to authenticated
  using (private.is_member(org_id));
create policy risks_insert on public.risks for insert to authenticated
  with check (private.has_role(org_id, array['owner', 'admin', 'manager', 'reviewer']::public.org_role[])
              and source = 'manual' and created_by = (select auth.uid()));
create policy risks_update on public.risks for update to authenticated
  using (private.has_role(org_id, array['owner', 'admin', 'manager', 'reviewer']::public.org_role[]))
  with check (private.has_role(org_id, array['owner', 'admin', 'manager', 'reviewer']::public.org_role[]));
create policy risks_delete on public.risks for delete to authenticated
  using (source = 'manual' and private.has_role(org_id, array['owner', 'admin']::public.org_role[]));

create policy obligations_select on public.obligations for select to authenticated
  using (private.is_member(org_id));
create policy obligations_insert on public.obligations for insert to authenticated
  with check (private.has_role(org_id, array['owner', 'admin', 'manager']::public.org_role[])
              and source = 'manual' and created_by = (select auth.uid()));
create policy obligations_update on public.obligations for update to authenticated
  using (private.has_role(org_id, array['owner', 'admin', 'manager']::public.org_role[])
         or assignee_id = (select auth.uid()))
  with check (private.is_member(org_id));
create policy obligations_delete on public.obligations for delete to authenticated
  using (source = 'manual' and private.has_role(org_id, array['owner', 'admin']::public.org_role[]));

create policy reviews_select on public.reviews for select to authenticated
  using (private.is_member(org_id));

create policy usage_events_select on public.usage_events for select to authenticated
  using (private.is_member(org_id));

create policy audit_log_select on public.audit_log for select to authenticated
  using (private.has_role(org_id, array['owner', 'admin']::public.org_role[]));

-- --------------------------------------------------------------- grants ----
-- Least privilege, stated explicitly (Supabase grants ALL by default).
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

grant usage on schema private to authenticated, service_role;
grant execute on function private.is_member(uuid), private.has_role(uuid, public.org_role[]),
  private.shares_org_with(uuid), private.try_uuid(text) to authenticated, service_role;

grant select on public.profiles, public.organizations, public.memberships, public.invitations,
  public.subscriptions, public.contracts, public.documents, public.document_pages, public.analyses,
  public.contract_parties, public.contract_facts, public.risks, public.obligations, public.reviews,
  public.audit_log, public.usage_events, public.deadlines to authenticated;

grant update (full_name) on public.profiles to authenticated;
grant update (name) on public.organizations to authenticated;
grant delete on public.invitations to authenticated;

-- status, risk_score and risk_level are deliberately absent: they change only through
-- the RPCs and the risk trigger.
grant insert (org_id, title, counterparty, our_party, contract_type, description, effective_date,
              expiration_date, auto_renews, renewal_term_months, notice_period_days, total_value,
              currency, governing_law, owner_id, created_by) on public.contracts to authenticated;
grant update (title, counterparty, our_party, contract_type, description, effective_date,
              expiration_date, auto_renews, renewal_term_months, notice_period_days, total_value,
              currency, governing_law, owner_id) on public.contracts to authenticated;
grant delete on public.contracts to authenticated;

grant insert (id, org_id, contract_id, storage_path, filename, mime_type, size_bytes, sha256, uploaded_by)
  on public.documents to authenticated;
grant delete on public.documents to authenticated;

grant insert (org_id, contract_id, document_id, requested_by) on public.analyses to authenticated;

grant insert (org_id, contract_id, category, severity, title, explanation, recommendation,
              page_number, clause_ref, quote, created_by) on public.risks to authenticated;
grant update (status, resolution_note) on public.risks to authenticated;
grant delete on public.risks to authenticated;

grant insert (org_id, contract_id, responsible_party, category, description, due_date, recurrence,
              page_number, clause_ref, quote, assignee_id, created_by) on public.obligations to authenticated;
grant update (status, assignee_id, due_date) on public.obligations to authenticated;
grant delete on public.obligations to authenticated;

grant execute on function
  public.create_organization(text),
  public.create_invitation(uuid, text, public.org_role),
  public.accept_invitation(text),
  public.set_member_role(uuid, uuid, public.org_role),
  public.remove_member(uuid, uuid),
  public.request_review(uuid, uuid),
  public.decide_review(uuid, public.review_status, text),
  public.cancel_review(uuid),
  public.set_contract_status(uuid, public.contract_status)
  to authenticated;

grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
