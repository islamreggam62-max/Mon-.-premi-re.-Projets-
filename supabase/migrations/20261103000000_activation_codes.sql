-- NEXORA activation codes (Phase 2, step 1b).
--
-- Only the NEXORA owner decides who may open a company on the platform. The
-- owner issues one activation code per customer; the customer types it once,
-- when creating their company, and the code is then spent. A code can be tied
-- to the customer's email address, which makes it useless to anyone else.
--
-- Codes are never stored. The table keeps a SHA-256 hash and the last four
-- characters (to recognise a code in a list); issue_activation_code() returns
-- the code itself once, to the owner. No secret lives in the website's source
-- code, which is public.
--
-- Becoming the NEXORA owner is a one-time step in the Supabase SQL editor
-- (docs/phase-2-supabase-plan.md). No request from a browser can add one.

-- ------------------------------------------------------------ the owner
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
-- RLS on and no policy: no client role can read or change this table.
alter table public.platform_admins enable row level security;

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

-- ----------------------------------------------------- activation codes
create table public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  hint text not null check (hint ~ '^[0-9A-Z]{4}$'),
  plan text not null check (plan in ('trial', 'monthly', 'annual')),
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and email = lower(email)),
  label text not null default '' check (char_length(label) <= 120),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete set null
);
alter table public.activation_codes enable row level security;
-- The owner reads the list (hashes and hints only). Nobody writes directly.
create policy activation_codes_select on public.activation_codes for select to authenticated
  using (public.is_platform_admin());

-- Hash of a typed code in canonical form: letters and digits only, upper case,
-- without the NEXORA prefix, the look-alikes O, I and L read as 0, 1 and 1.
create function public.activation_code_hash(p_code text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(
    translate(regexp_replace(regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g'), '^NEXORA', ''), 'OIL', '011'),
    'UTF8')), 'hex');
$$;

-- NEXORA-XXXX-XXXX-XXXX-XXXX: 16 characters of the Crockford alphabet (no I,
-- L, O or U), 5 random bits each, 80 bits in all, taken from gen_random_uuid(),
-- which reads the server's cryptographic random source. The low 5 bits of every
-- UUID byte are random except in byte 6 (version 4 leaves only 4), so byte 6
-- of each UUID is skipped.
create function public.new_activation_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  raw bytea := uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid());
  body text := '';
  i integer := 0;
begin
  while char_length(body) < 16 loop
    if i % 16 <> 6 then
      body := body || substr(alphabet, get_byte(raw, i) % 32 + 1, 1);
    end if;
    i := i + 1;
  end loop;
  return 'NEXORA-' || substr(body, 1, 4) || '-' || substr(body, 5, 4) || '-' || substr(body, 9, 4) || '-' || substr(body, 13, 4);
end;
$$;

-- Issue a code (owner only). The code is returned here and nowhere else:
-- note it and send it to the customer. p_email, when given, is the only
-- account that can use it.
create function public.issue_activation_code(
  p_plan text, p_email text default null, p_label text default '', p_valid_days integer default 30)
returns table (activation_code text, code_id uuid, valid_until timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  c text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only the NEXORA owner can issue activation codes' using errcode = '42501';
  end if;
  if p_valid_days is null or p_valid_days not between 1 and 365 then
    raise exception 'A code is valid for 1 to 365 days' using errcode = '22023';
  end if;
  c := public.new_activation_code();
  insert into public.activation_codes (code_hash, hint, plan, email, label, created_by, expires_at)
  values (public.activation_code_hash(c), right(c, 4), p_plan, nullif(lower(trim(p_email)), ''),
          coalesce(p_label, ''), auth.uid(), now() + make_interval(days => p_valid_days))
  returning id, expires_at into code_id, valid_until;
  activation_code := c;
  return next;
end;
$$;

-- Cancel a code that has not been used yet (owner only).
create function public.revoke_activation_code(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only the NEXORA owner can revoke activation codes' using errcode = '42501';
  end if;
  update public.activation_codes set revoked_at = now()
    where id = p_id and used_at is null and revoked_at is null;
  if not found then
    raise exception 'No unused activation code with this id' using errcode = 'P0002';
  end if;
end;
$$;

-- ------------------------------------------- company creation needs a code
-- The old signature must go: left in place, it would create companies without one.
drop function public.create_workspace(text, text, text, text);

-- Create a company and become its owner. A customer needs an activation code
-- from the NEXORA owner; the code sets the plan and is spent. The NEXORA owner
-- may create a company without one (plan 'trial'), for demonstrations.
create function public.create_workspace(
  p_name text, p_industry text default null, p_timezone text default 'Africa/Algiers',
  p_currency text default 'USD', p_code text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  ws uuid;
  ac public.activation_codes%rowtype;
  my_email text;
begin
  if uid is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if coalesce(trim(p_code), '') = '' then
    if not public.is_platform_admin() then
      raise exception 'An activation code from NEXORA is required to create a company' using errcode = '42501';
    end if;
  else
    select * into ac from public.activation_codes
      where code_hash = public.activation_code_hash(p_code) for update;
    if not found or ac.used_at is not null or ac.revoked_at is not null or ac.expires_at < now() then
      raise exception 'This activation code is invalid, already used, or expired' using errcode = 'P0002';
    end if;
    if ac.email is not null then
      select email into my_email from auth.users where id = uid;
      if lower(coalesce(my_email, '')) <> ac.email then
        raise exception 'This activation code was issued for another email address' using errcode = '42501';
      end if;
    end if;
  end if;
  if (select count(*) from public.workspace_members where user_id = uid and role = 'owner') >= 5 then
    raise exception 'A user can own at most 5 companies' using errcode = '54000';
  end if;
  insert into public.workspaces (name, industry, timezone, currency, plan, created_by)
  values (p_name, p_industry, p_timezone, p_currency, coalesce(ac.plan, 'trial'), uid)
  returning id into ws;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws, uid, 'owner');
  if ac.id is not null then
    update public.activation_codes set used_at = now(), used_by = uid, workspace_id = ws where id = ac.id;
  end if;
  return ws;
end;
$$;

-- ---------------------------------------------- the plan is not editable
-- The plan comes from the code the owner issued, so a company's own owner and
-- admins may change only the descriptive columns (not plan, not created_by).
revoke update on public.workspaces from authenticated;
grant update (name, industry, timezone, currency) on public.workspaces to authenticated;

-- ----------------------------------------------------------------- grants
-- Supabase grants new tables and functions to anon and authenticated by
-- default; take everything back, then give only what the browser needs.
revoke all on public.platform_admins, public.activation_codes from anon, authenticated, public;
grant select on public.activation_codes to authenticated;
revoke all on function
  public.is_platform_admin(), public.activation_code_hash(text), public.new_activation_code(),
  public.issue_activation_code(text, text, text, integer), public.revoke_activation_code(uuid),
  public.create_workspace(text, text, text, text, text)
  from anon, authenticated, public;
grant execute on function
  public.is_platform_admin(), public.issue_activation_code(text, text, text, integer),
  public.revoke_activation_code(uuid), public.create_workspace(text, text, text, text, text)
  to authenticated;
