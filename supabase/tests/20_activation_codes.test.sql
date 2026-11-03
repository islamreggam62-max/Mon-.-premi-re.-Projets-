-- Activation codes: only the NEXORA owner issues them, a customer needs one to
-- open a company, a code works once, for its own email, before it expires.
-- Run as a superuser after 00_supabase_stub.sql and the migrations.
\set ON_ERROR_STOP on
\set QUIET on

\ir helpers.sql

-- ------------------------------------------------------------------ users
insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'boss@nexora.test'),
  ('10000000-0000-4000-8000-000000000002', 'karim@client.test'),
  ('10000000-0000-4000-8000-000000000003', 'eve@intruder.test');
-- The one-time setup step: make the owner's account the NEXORA owner.
insert into public.platform_admins (user_id) values ('10000000-0000-4000-8000-000000000001');

\set boss '10000000-0000-4000-8000-000000000001'
\set karim '10000000-0000-4000-8000-000000000002'
\set eve '10000000-0000-4000-8000-000000000003'

select tests.ok((select count(*) from pg_proc where proname = 'create_workspace' and pronamespace = 'public'::regnamespace) = 1,
  'only the code-checking create_workspace exists (the old one is gone)');

-- ------------------------------------------------------ signed-out visitors
select set_config('request.jwt.claims', '', false);
set role anon;
select tests.fails('select * from public.issue_activation_code(''annual'')', '42501', 'anon cannot issue a code');
select tests.fails('select * from public.activation_codes', '42501', 'anon cannot read codes');
select tests.fails('select * from public.platform_admins', '42501', 'anon cannot read who the owner is');
reset role;

-- --------------------------------------------- a customer before any code
select tests.login(:'karim');
set role authenticated;
select tests.ok(not public.is_platform_admin(), 'a customer is not the NEXORA owner');
select tests.fails('select public.create_workspace(''Karim SARL'')', '42501', 'a customer cannot open a company without a code');
select tests.fails('select public.create_workspace(''Karim SARL'', p_code => ''  '')', '42501', 'a blank code counts as no code');
select tests.fails('select * from public.issue_activation_code(''annual'')', '42501', 'a customer cannot issue codes');
select tests.fails(format('insert into public.platform_admins (user_id) values (%L)', :'karim'), '42501', 'a customer cannot make themselves the owner');
select tests.fails('select * from public.platform_admins', '42501', 'a customer cannot read who the owner is');
select tests.fails('insert into public.activation_codes (code_hash, hint, plan, expires_at) values (repeat(''a'', 64), ''AAAA'', ''annual'', now() + interval ''1 day'')',
  '42501', 'a customer cannot plant a code of their own');
select tests.fails('select public.new_activation_code()', '42501', 'the code generator is not callable from the browser');
select tests.fails('select public.activation_code_hash(''x'')', '42501', 'the hash function is not callable from the browser');
reset role;

-- ------------------------------------------------------- the owner issues
select tests.login(:'boss');
set role authenticated;
select tests.ok(public.is_platform_admin(), 'the owner is recognised');
select activation_code as code_k, code_id as id_k from public.issue_activation_code('annual', ' Karim@Client.test ', 'Karim SARL', 30) \gset
select activation_code as code_open from public.issue_activation_code('monthly', null, 'Open code') \gset
select activation_code as code_short, code_id as id_short from public.issue_activation_code('monthly', 'eve@intruder.test', 'Short', 1) \gset
select activation_code as code_rev, code_id as id_rev from public.issue_activation_code('annual', 'eve@intruder.test', 'To revoke') \gset

select tests.ok(:'code_k' ~ '^NEXORA(-[0-9A-HJKMNP-TV-Z]{4}){4}$', 'a code looks like NEXORA-XXXX-XXXX-XXXX-XXXX, without I, L, O or U');
select tests.ok((select email from public.activation_codes where id = :'id_k') = 'karim@client.test', 'the customer email is stored trimmed and in lower case');
select tests.ok((select hint from public.activation_codes where id = :'id_k') = right(:'code_k', 4), 'only the last 4 characters are kept as a hint');
select tests.ok((select code_hash from public.activation_codes where id = :'id_k') = encode(sha256(convert_to(replace(substr(:'code_k', 8), '-', ''), 'UTF8')), 'hex'),
  'the stored value is the SHA-256 of the code');
select tests.ok((select count(*) from public.activation_codes a
                 where position(replace(substr(:'code_k', 8), '-', '') in row_to_json(a)::text) > 0
                    or position(substr(:'code_k', 8) in row_to_json(a)::text) > 0) = 0,
  'the code itself is stored nowhere');
select tests.ok((select count(*) from public.activation_codes where label in ('Karim SARL', 'Open code', 'Short', 'To revoke')) = 4, 'the owner sees the codes they issued');
select tests.fails('select * from public.issue_activation_code(''annual'', null, '''', 0)', '22023', 'a code lasts at least one day');
select tests.fails('select * from public.issue_activation_code(''annual'', null, '''', 366)', '22023', 'a code lasts at most a year');
select tests.fails('select * from public.issue_activation_code(''gold'')', '23514', 'a code names a real plan');
select tests.fails('select * from public.issue_activation_code(''annual'', ''not-an-email'')', '23514', 'a bound code needs a valid email');

-- 1000 codes: all different, every position uses all 32 characters (a stuck
-- random bit would halve one), and no look-alike letters.
create temporary table batch as
  select replace(substr(c.activation_code, 8), '-', '') as body
  from generate_series(1, 1000) g, lateral public.issue_activation_code('trial', null, 'batch ' || g) c;
select tests.ok((select count(distinct body) from batch) = 1000, '1000 codes in a row are all different');
select tests.ok((select min(n) from (select count(distinct substr(body, pos, 1)) as n from batch, generate_series(1, 16) pos group by pos) per_position) = 32,
  'each of the 16 positions uses the whole 32-character alphabet');
select tests.ok((select count(*) from batch where body ~ '[ILOU]') = 0, 'no code contains I, L, O or U');
reset role;

-- --------------------------------------------------- customers use them
select tests.login(:'eve');
set role authenticated;
select tests.fails(format('select public.create_workspace(''Eve Corp'', p_code => %L)', :'code_k'), '42501', 'a code issued for Karim does not work for anyone else');
reset role;

select tests.login(:'karim');
set role authenticated;
select tests.fails('select public.create_workspace(''Karim SARL'', p_code => ''NEXORA-AAAA-BBBB-CCCC-DDDD'')', 'P0002', 'a made-up code is refused');
-- Typed carelessly: lower case, spaces instead of dashes, O for 0 and l for 1.
select public.create_workspace('Karim SARL', 'Trading', 'Africa/Algiers', 'DZD',
  translate(lower(replace(:'code_k', '-', ' ')), '01', 'ol')) as ws_k \gset
select tests.ok((select plan from public.workspaces where id = :'ws_k') = 'annual', 'the company gets the plan of its code');
select tests.ok((select role from public.workspace_members where workspace_id = :'ws_k' and user_id = :'karim') = 'owner', 'the customer owns the company');
select tests.fails(format('select public.create_workspace(''Karim Bis'', p_code => %L)', :'code_k'), 'P0002', 'a code works only once');
select tests.ok(tests.rows(format('update public.workspaces set name = ''Karim SARL Algérie'' where id = %L', :'ws_k')) = 1, 'the customer can still rename the company');
select tests.fails(format('update public.workspaces set plan = ''annual'' where id = %L', :'ws_k'), '42501', 'the customer cannot change the plan');
select tests.fails(format('update public.workspaces set created_by = %L where id = %L', :'eve', :'ws_k'), '42501', 'the customer cannot rewrite who created the company');
select tests.ok((select count(*) from public.activation_codes) = 0, 'a customer sees no codes, not even their own');
select tests.fails(format('select public.revoke_activation_code(%L)', :'id_rev'), '42501', 'a customer cannot revoke codes');
reset role;

select tests.login(:'boss');
set role authenticated;
select tests.ok((select used_by = :'karim'::uuid and workspace_id = :'ws_k'::uuid and used_at is not null from public.activation_codes where id = :'id_k'),
  'the owner sees who used the code and for which company');
select public.revoke_activation_code(:'id_rev');
select tests.fails(format('select public.revoke_activation_code(%L)', :'id_rev'), 'P0002', 'a revoked code cannot be revoked again');
select tests.fails(format('select public.revoke_activation_code(%L)', :'id_k'), 'P0002', 'a used code cannot be revoked');
select public.create_workspace('NEXORA Demo') as ws_demo \gset
select tests.ok((select plan from public.workspaces where id = :'ws_demo') = 'trial', 'the owner can open a demo company without a code');
reset role;

update public.activation_codes set expires_at = now() - interval '1 minute' where id = :'id_short';

select tests.login(:'eve');
set role authenticated;
select tests.fails(format('select public.create_workspace(''Eve Corp'', p_code => %L)', :'code_short'), 'P0002', 'an expired code is refused');
select tests.fails(format('select public.create_workspace(''Eve Corp'', p_code => %L)', :'code_rev'), 'P0002', 'a revoked code is refused');
select public.create_workspace('Eve Corp', p_code => :'code_open') as ws_eve \gset
select tests.ok((select plan from public.workspaces where id = :'ws_eve') = 'monthly', 'a code without an email works for whoever has it');
reset role;

-- ------------------------------------------ issuing from the SQL editor
-- The editor runs as an administrator with no signed-in user: it must state
-- the owner's identity for the length of one transaction.
select set_config('request.jwt.claims', '', false);
select tests.fails('select * from public.issue_activation_code(''annual'')', '42501', 'no signed-in owner, no code');
begin;
select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
  from auth.users where email = 'boss@nexora.test';
select tests.ok((select count(*) from public.issue_activation_code('annual', 'client@entreprise.dz', 'From the SQL editor')) = 1,
  'the owner can issue a code from the SQL editor');
commit;
select tests.ok(auth.uid() is null, 'the owner identity ends with the transaction');

\echo ALL ACTIVATION CODE CHECKS PASSED
