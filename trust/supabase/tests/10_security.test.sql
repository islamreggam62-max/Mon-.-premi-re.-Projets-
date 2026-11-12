-- TRUST — database security tests. Run by scripts/test-db.sh after the migrations.
-- Each check raises on failure, so the script stops at the first broken guarantee.
\set ON_ERROR_STOP on
\set QUIET on

create schema test;
grant usage on schema test to anon, authenticated, service_role;

create table test.results (n serial, name text);
grant all on test.results, test.results_n_seq to anon, authenticated, service_role;

create function test.pass(_name text) returns void language sql as $$
  insert into test.results (name) values (_name);
$$;

-- Become a signed-in user / anon / the server, like PostgREST does per request.
create function test.as_user(_id uuid, _email text) returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', _id, 'email', _email)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function test.as_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
end $$;
create function test.as_service() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'service_role', true);
end $$;
create function test.as_admin() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create function test.denied(_name text, _sql text, _expect text default null) returns void language plpgsql as $$
declare _msg text;
begin
  begin
    execute _sql;
  exception when others then
    _msg := sqlerrm;
    if _expect is not null and _msg !~* _expect then
      raise exception 'FAIL [%]: expected error like "%", got "%"', _name, _expect, _msg;
    end if;
    perform test.pass(_name);
    return;
  end;
  raise exception 'FAIL [%]: statement was allowed: %', _name, _sql;
end $$;

create function test.count_is(_name text, _sql text, _expected bigint) returns void language plpgsql as $$
declare _n bigint;
begin
  execute 'select count(*) from (' || _sql || ') q' into _n;
  if _n <> _expected then
    raise exception 'FAIL [%]: expected % row(s), got %', _name, _expected, _n;
  end if;
  perform test.pass(_name);
end $$;

create function test.is_true(_name text, _sql text) returns void language plpgsql as $$
declare _ok boolean;
begin
  execute 'select (' || _sql || ')' into _ok;
  if _ok is not true then
    raise exception 'FAIL [%]: condition is not true: %', _name, _sql;
  end if;
  perform test.pass(_name);
end $$;
create function test.affects(_name text, _sql text, _expected bigint) returns void language plpgsql as $$
declare _n bigint;
begin
  execute _sql;
  get diagnostics _n = row_count;
  if _n <> _expected then
    raise exception 'FAIL [%]: expected % affected row(s), got %', _name, _expected, _n;
  end if;
  perform test.pass(_name);
end $$;
grant execute on all functions in schema test to anon, authenticated, service_role;

begin;
do $$
declare
  alice uuid := '00000000-0000-0000-0000-00000000000a';  -- owner of org 1
  bob   uuid := '00000000-0000-0000-0000-00000000000b';  -- owner of org 2 (the outsider)
  carol uuid := '00000000-0000-0000-0000-00000000000c';  -- viewer in org 1
  dave  uuid := '00000000-0000-0000-0000-00000000000d';  -- reviewer in org 1
  erin  uuid := '00000000-0000-0000-0000-00000000000e';  -- manager in org 1
  frank uuid := '00000000-0000-0000-0000-00000000000f';  -- admin in org 1
  org1 uuid; org2 uuid; c1 uuid; c2 uuid; d1 uuid := gen_random_uuid(); a1 uuid; a2 uuid;
  tok text; rev uuid; r_crit uuid; r_manual uuid; ob uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    (alice, 'alice@one.test', '{"full_name":"Alice"}'), (bob, 'bob@two.test', '{}'),
    (carol, 'carol@one.test', '{}'), (dave, 'dave@one.test', '{}'),
    (erin, 'erin@one.test', '{}'), (frank, 'frank@one.test', '{}');
  perform test.count_is('profile is created for every new user', 'select 1 from public.profiles', 6);

  -- ------------------------------------------------------------ anonymous
  perform test.as_anon();
  perform test.denied('anon cannot read contracts', 'select * from public.contracts', 'permission denied');
  perform test.denied('anon cannot read profiles', 'select * from public.profiles', 'permission denied');
  perform test.denied('anon cannot read audit log', 'select * from public.audit_log', 'permission denied');
  perform test.denied('anon cannot create an organisation', $q$select public.create_organization('X corp')$q$, 'permission denied');
  perform test.denied('anon cannot call the server-only results function',
    $q$select public.store_analysis_results(gen_random_uuid(), '{}'::jsonb)$q$, 'permission denied');

  -- -------------------------------------------------------- organisations
  perform test.as_user(alice, 'alice@one.test');
  org1 := public.create_organization('Org One');
  perform test.count_is('creator becomes owner', format('select 1 from public.memberships where org_id=%L and user_id=%L and role=''owner''', org1, alice), 1);
  perform test.count_is('trial subscription is created', format('select 1 from public.subscriptions where org_id=%L and plan=''trial''', org1), 1);
  perform test.denied('members cannot insert memberships directly',
    format('insert into public.memberships (org_id, user_id, role) values (%L, %L, ''admin'')', org1, bob), 'permission denied');
  perform test.denied('members cannot edit their subscription',
    format('update public.subscriptions set contract_limit = 9999 where org_id=%L', org1), 'permission denied');
  perform test.denied('organisations cannot be inserted directly',
    format('insert into public.organizations (name, created_by) values (''Rogue'', %L)', alice), 'permission denied');

  perform test.as_user(bob, 'bob@two.test');
  org2 := public.create_organization('Org Two');

  -- ----------------------------------------------------------- invitations
  perform test.as_user(alice, 'alice@one.test');
  tok := public.create_invitation(org1, 'Carol@One.test', 'viewer');
  perform test.count_is('raw invitation token is never stored',
    format('select 1 from public.invitations where token_hash = %L', tok), 0);
  perform test.denied('owner role cannot be invited',
    format('select public.create_invitation(%L, ''x@one.test'', ''owner'')', org1), 'owner_cannot_be_invited');

  perform test.as_user(bob, 'bob@two.test');
  perform test.denied('invitation is bound to the invited email',
    format('select public.accept_invitation(%L)', tok), 'invitation_email_mismatch');
  perform test.denied('outsider cannot invite into another organisation',
    format('select public.create_invitation(%L, ''bob@two.test'', ''admin'')', org1), 'forbidden');

  perform test.as_user(carol, 'carol@one.test');
  perform public.accept_invitation(tok);
  perform test.count_is('invited user joins with the invited role',
    format('select 1 from public.memberships where org_id=%L and user_id=%L and role=''viewer''', org1, carol), 1);
  perform test.denied('invitation token cannot be reused',
    format('select public.accept_invitation(%L)', tok), 'invitation_invalid_or_expired');

  perform test.as_user(alice, 'alice@one.test');
  tok := public.create_invitation(org1, 'dave@one.test', 'reviewer');
  perform test.as_user(dave, 'dave@one.test');
  perform public.accept_invitation(tok);

  perform test.as_user(alice, 'alice@one.test');
  tok := public.create_invitation(org1, 'erin@one.test', 'manager');
  perform test.as_user(erin, 'erin@one.test');
  perform test.denied('seat limit of the plan is enforced',
    format('select public.accept_invitation(%L)', tok), 'plan_limit_seats');
  perform test.as_service();
  update public.subscriptions set seat_limit = 10 where org_id = org1;
  perform test.as_user(erin, 'erin@one.test');
  perform public.accept_invitation(tok);

  perform test.as_user(alice, 'alice@one.test');
  tok := public.create_invitation(org1, 'frank@one.test', 'admin');
  perform test.as_user(frank, 'frank@one.test');
  perform public.accept_invitation(tok);

  -- ------------------------------------------------------ role management
  perform test.as_user(frank, 'frank@one.test');
  perform test.denied('admin cannot promote to admin',
    format('select public.set_member_role(%L, %L, ''admin'')', org1, erin), 'forbidden');
  perform test.denied('admin cannot demote the owner',
    format('select public.set_member_role(%L, %L, ''viewer'')', org1, alice), 'forbidden');
  perform test.denied('admin cannot invite another admin',
    format('select public.create_invitation(%L, ''z@one.test'', ''admin'')', org1), 'only_owner_invites_admin');
  perform test.as_user(erin, 'erin@one.test');
  perform test.denied('manager cannot change roles',
    format('select public.set_member_role(%L, %L, ''manager'')', org1, carol), 'forbidden');
  perform test.denied('manager cannot remove a member',
    format('select public.remove_member(%L, %L)', org1, carol), 'forbidden');
  perform test.as_user(alice, 'alice@one.test');
  perform test.denied('the last owner cannot be demoted',
    format('select public.set_member_role(%L, %L, ''admin'')', org1, alice), 'last_owner');
  perform test.denied('the last owner cannot leave',
    format('select public.remove_member(%L, %L)', org1, alice), 'last_owner');

  -- ------------------------------------------------------------- contracts
  perform test.as_user(carol, 'carol@one.test');
  perform test.denied('viewer cannot create a contract',
    format('insert into public.contracts (org_id, title, created_by) values (%L, ''V'', %L)', org1, carol), 'row-level security');

  perform test.as_user(erin, 'erin@one.test');
  insert into public.contracts (org_id, title, counterparty, expiration_date, notice_period_days, auto_renews, created_by)
    values (org1, 'Supply agreement', 'ACME', date '2027-06-30', 90, true, erin) returning id into c1;
  perform test.is_true('notice deadline is derived from expiry and notice period',
    format('(select notice_deadline from public.contracts where id=%L) = date ''2027-04-01''', c1));
  perform test.denied('created_by cannot be forged',
    format('insert into public.contracts (org_id, title, created_by) values (%L, ''F'', %L)', org1, alice), 'row-level security');
  perform test.denied('status cannot be set on insert',
    format('insert into public.contracts (org_id, title, created_by, status) values (%L, ''S'', %L, ''approved'')', org1, erin), 'permission denied');
  perform test.denied('status cannot be edited directly (approval needs a review)',
    format('update public.contracts set status = ''approved'' where id=%L', c1), 'permission denied');
  perform test.denied('risk score cannot be edited by users',
    format('update public.contracts set risk_score = 0 where id=%L', c1), 'permission denied');
  perform test.affects('manager cannot delete a contract',
    format('delete from public.contracts where id=%L', c1), 0);

  perform test.as_user(bob, 'bob@two.test');
  insert into public.contracts (org_id, title, created_by) values (org2, 'Org2 lease', bob) returning id into c2;

  -- ------------------------------------------------------ tenant isolation
  perform test.count_is('outsider sees only their own organisation', 'select 1 from public.organizations', 1);
  perform test.count_is('outsider sees no contract of org 1', format('select 1 from public.contracts where org_id=%L', org1), 0);
  perform test.count_is('outsider sees no member of org 1', format('select 1 from public.memberships where org_id=%L', org1), 0);
  perform test.count_is('outsider sees no profile of org 1 members', format('select 1 from public.profiles where id=%L', alice), 0);
  perform test.count_is('outsider sees no invitation of org 1', format('select 1 from public.invitations where org_id=%L', org1), 0);
  perform test.count_is('outsider sees no subscription of org 1', format('select 1 from public.subscriptions where org_id=%L', org1), 0);
  perform test.denied('outsider cannot create a contract in org 1',
    format('insert into public.contracts (org_id, title, created_by) values (%L, ''X'', %L)', org1, bob), 'row-level security');
  perform test.affects('outsider update of an org 1 contract touches nothing',
    format('update public.contracts set title=''pwned'' where id=%L', c1), 0);
  perform test.denied('a document cannot point at another organisation''s contract',
    format($q$insert into public.documents (id, org_id, contract_id, storage_path, filename, mime_type, size_bytes, sha256, uploaded_by)
              values (gen_random_uuid(), %L, %L, %L, 'x.pdf', 'application/pdf', 10, repeat('a', 64), %L)$q$,
           org2, c1, org2 || '/' || c1 || '/x.pdf', bob), 'foreign key');
  perform test.denied('outsider cannot attach a document to org 1',
    format($q$insert into public.documents (id, org_id, contract_id, storage_path, filename, mime_type, size_bytes, sha256, uploaded_by)
              values (gen_random_uuid(), %L, %L, %L, 'x.pdf', 'application/pdf', 10, repeat('a', 64), %L)$q$,
           org1, c1, org1 || '/' || c1 || '/x.pdf', bob), 'row-level security');
  perform test.denied('outsider cannot request a review in org 1',
    format('select public.request_review(%L, %L)', c1, dave), 'forbidden');
  perform test.denied('outsider cannot write audit events for org 1',
    format($q$select public.log_audit_event(%L, 'document.downloaded', 'document', null, '{}')$q$, org1), 'forbidden');

  -- -------------------------------------------------- documents & analyses
  perform test.as_user(erin, 'erin@one.test');
  insert into public.documents (id, org_id, contract_id, storage_path, filename, mime_type, size_bytes, sha256, uploaded_by)
    values (d1, org1, c1, org1 || '/' || c1 || '/' || d1 || '.pdf', 'supply.pdf', 'application/pdf', 1234, repeat('b', 64), erin);
  perform test.denied('storage path must sit inside the organisation folder',
    format($q$insert into public.documents (id, org_id, contract_id, storage_path, filename, mime_type, size_bytes, sha256, uploaded_by)
              values (gen_random_uuid(), %L, %L, %L, 'x.pdf', 'application/pdf', 10, repeat('a', 64), %L)$q$,
           org1, c1, org2 || '/' || c1 || '/x.pdf', erin), 'check constraint');
  perform test.denied('only PDF and DOCX are accepted',
    format($q$insert into public.documents (id, org_id, contract_id, storage_path, filename, mime_type, size_bytes, sha256, uploaded_by)
              values (gen_random_uuid(), %L, %L, %L, 'x.exe', 'application/x-msdownload', 10, repeat('a', 64), %L)$q$,
           org1, c1, org1 || '/' || c1 || '/x.exe', erin), 'check constraint');
  perform test.denied('users cannot write extracted page text',
    format('insert into public.document_pages (document_id, org_id, page_number, content) values (%L, %L, 1, ''fake'')', d1, org1), 'permission denied');
  insert into public.analyses (org_id, contract_id, document_id, requested_by) values (org1, c1, d1, erin) returning id into a1;
  perform test.denied('users cannot mark an analysis completed',
    format('update public.analyses set status = ''completed'' where id=%L', a1), 'permission denied');
  perform test.denied('users cannot call the server-only results function',
    format($q$select public.store_analysis_results(%L, '{}'::jsonb)$q$, a1), 'permission denied');
  perform test.denied('users cannot insert an AI finding',
    format($q$insert into public.risks (org_id, contract_id, category, severity, title, explanation, created_by, source)
              values (%L, %L, 'liability', 'low', 't', 'e', %L, 'ai')$q$, org1, c1, erin), 'permission denied');
  perform test.denied('users cannot mark evidence as verified',
    format($q$insert into public.risks (org_id, contract_id, category, severity, title, explanation, created_by, evidence_verified)
              values (%L, %L, 'liability', 'low', 't', 'e', %L, true)$q$, org1, c1, erin), 'permission denied');

  -- ------------------------------------------- server stores the AI results
  perform test.as_service();
  perform public.store_analysis_results(a1, jsonb_build_object(
    'summary', 'Supply agreement with ACME.', 'document_language', 'en',
    'model', 'test-model', 'prompt_version', 'test', 'input_tokens', 10, 'output_tokens', 5,
    'parties', jsonb_build_array(jsonb_build_object('name', 'ACME', 'role', 'Supplier', 'page_number', 1, 'quote', 'ACME Ltd', 'evidence_verified', true)),
    'facts', jsonb_build_array(jsonb_build_object('field', 'expiration_date', 'label', 'Expiry', 'value_text', '30 June 2027', 'value_date', '2027-06-30', 'page_number', 2, 'quote', 'until 30 June 2027', 'evidence_verified', true)),
    'obligations', jsonb_build_array(jsonb_build_object('responsible_party', 'Buyer', 'category', 'payment', 'description', 'Pay within 30 days', 'due_date', '2026-12-01', 'page_number', 3, 'quote', 'within thirty (30) days', 'evidence_verified', true)),
    'risks', jsonb_build_array(
      jsonb_build_object('evidence_kind', 'quote', 'category', 'liability', 'severity', 'critical', 'title', 'Unlimited liability', 'explanation', 'e', 'recommendation', 'r', 'page_number', 4, 'quote', 'without limitation', 'evidence_verified', true),
      jsonb_build_object('evidence_kind', 'quote', 'category', 'termination', 'severity', 'high', 'title', 'Unverified quote', 'explanation', 'e', 'page_number', 5, 'quote', 'not in the document', 'evidence_verified', false),
      jsonb_build_object('evidence_kind', 'absence', 'category', 'missing_clause', 'severity', 'high', 'title', 'No force majeure clause', 'explanation', 'e', 'evidence_verified', true))));
  perform test.count_is('analysis is stored as completed', format('select 1 from public.analyses where id=%L and status=''completed'' and finished_at is not null', a1), 1);
  perform test.count_is('three AI risks stored', format('select 1 from public.risks where contract_id=%L and source=''ai''', c1), 3);
  perform test.count_is('an absence finding can never be flagged as quote-verified',
    format('select 1 from public.risks where contract_id=%L and evidence_kind=''absence'' and evidence_verified', c1), 0);
  perform test.is_true('score counts only quote-verified findings (1 critical = 40, high)',
    format('(select risk_score = 40 and risk_level = ''high'' from public.contracts where id=%L)', c1));
  perform test.denied('a finished analysis cannot be overwritten',
    format($q$select public.store_analysis_results(%L, '{}'::jsonb)$q$, a1), 'analysis_already_finished');

  -- ------------------------------------------------------ findings workflow
  select id into r_crit from public.risks where contract_id = c1 and severity = 'critical';
  perform test.as_user(carol, 'carol@one.test');
  perform test.count_is('viewer can read findings', format('select 1 from public.risks where contract_id=%L', c1), 3);
  perform test.affects('viewer cannot change a risk status',
    format('update public.risks set status=''dismissed'' where id=%L', r_crit), 0);

  perform test.as_user(erin, 'erin@one.test');
  perform test.denied('nobody can rewrite an AI finding',
    format('update public.risks set title = ''harmless'' where id=%L', r_crit), 'permission denied');
  perform test.denied('nobody can change the evidence of a finding',
    format('update public.risks set evidence_verified = false where id=%L', r_crit), 'permission denied');
  perform test.denied('nobody can downgrade the severity of a finding',
    format('update public.risks set severity = ''low'' where id=%L', r_crit), 'permission denied');
  update public.risks set status = 'mitigated', resolution_note = 'Cap negotiated' where id = r_crit;
  perform test.is_true('resolution is stamped with the acting user',
    format('(select resolved_by = %L and resolved_at is not null from public.risks where id=%L)', erin, r_crit));
  perform test.is_true('score drops when the risk is mitigated',
    format('(select risk_score = 0 and risk_level = ''low'' from public.contracts where id=%L)', c1));
  insert into public.risks (org_id, contract_id, category, severity, title, explanation, created_by)
    values (org1, c1, 'payment', 'medium', 'Manual finding', 'Seen by counsel', erin) returning id into r_manual;
  perform test.is_true('manual findings count toward the score (medium = 8)',
    format('(select risk_score = 8 from public.contracts where id=%L)', c1));
  perform test.affects('AI findings cannot be deleted, even by policy',
    format('delete from public.risks where id=%L', r_crit), 0);

  select id into ob from public.obligations where contract_id = c1;
  update public.obligations set assignee_id = carol where id = ob;
  perform test.as_user(carol, 'carol@one.test');
  update public.obligations set status = 'done' where id = ob;
  perform test.is_true('assignee can complete their obligation',
    format('(select status = ''done'' and completed_at is not null from public.obligations where id=%L)', ob));
  perform test.denied('assignee cannot move the due date',
    format('update public.obligations set due_date = date ''2030-01-01'' where id=%L', ob), 'forbidden');
  perform test.denied('nobody can rewrite an obligation text',
    format('update public.obligations set description = ''x'' where id=%L', ob), 'permission denied');

  -- -------------------------------------------------------- review workflow
  perform test.as_user(erin, 'erin@one.test');
  perform test.denied('a requester cannot review their own contract',
    format('select public.request_review(%L, %L)', c1, erin), 'reviewer_must_differ');
  perform test.denied('a viewer is not an eligible reviewer',
    format('select public.request_review(%L, %L)', c1, carol), 'reviewer_not_eligible');
  perform test.denied('a reviewer from another organisation is not eligible',
    format('select public.request_review(%L, %L)', c1, bob), 'reviewer_not_eligible');
  rev := public.request_review(c1, dave);
  perform test.is_true('contract moves to in_review', format('(select status = ''in_review'' from public.contracts where id=%L)', c1));
  perform test.denied('only one pending review per contract',
    format('select public.request_review(%L, %L)', c1, frank), 'contract_not_in_draft');
  perform test.denied('the record is frozen while a review is pending',
    format('update public.contracts set expiration_date = date ''2035-01-01'' where id=%L', c1), 'contract_under_review');
  perform test.denied('documents cannot be swapped while a review is pending',
    format($q$insert into public.documents (id, org_id, contract_id, storage_path, filename, mime_type, size_bytes, sha256, uploaded_by)
              values (gen_random_uuid(), %L, %L, %L, 'swap.pdf', 'application/pdf', 10, repeat('c', 64), %L)$q$,
           org1, c1, org1 || '/' || c1 || '/swap.pdf', erin), 'contract_under_review');
  update public.risks set resolution_note = 'Cap negotiated (confirmed)' where id = r_crit;
  perform test.pass('findings can still be triaged while a review is pending');
  perform test.as_service();
  update public.memberships set role = 'viewer' where org_id = org1 and user_id = dave;
  perform test.as_user(dave, 'dave@one.test');
  perform test.denied('a reviewer who lost the reviewing role cannot decide',
    format('select public.decide_review(%L, ''approved'', null)', rev), 'forbidden');
  perform test.as_service();
  update public.memberships set role = 'reviewer' where org_id = org1 and user_id = dave;
  perform test.as_user(erin, 'erin@one.test');
  perform test.denied('the requester cannot decide the review',
    format('select public.decide_review(%L, ''approved'', null)', rev), 'forbidden');
  perform test.as_user(frank, 'frank@one.test');
  perform test.denied('an admin who is not the reviewer cannot decide',
    format('select public.decide_review(%L, ''approved'', null)', rev), 'forbidden');
  perform test.as_user(dave, 'dave@one.test');
  perform test.denied('a rejection needs a written reason',
    format('select public.decide_review(%L, ''rejected'', ''  '')', rev), 'comment_required');
  perform public.decide_review(rev, 'approved', null);
  perform test.is_true('approval moves the contract to approved', format('(select status = ''approved'' from public.contracts where id=%L)', c1));
  perform test.denied('a review cannot be decided twice',
    format('select public.decide_review(%L, ''rejected'', ''changed my mind'')', rev), 'review_already_decided');

  perform test.as_user(erin, 'erin@one.test');
  perform public.set_contract_status(c1, 'active');
  perform test.denied('lifecycle cannot jump back to approved',
    format('select public.set_contract_status(%L, ''approved'')', c1), 'invalid_status_transition');
  perform test.as_user(carol, 'carol@one.test');
  perform test.denied('viewer cannot change the lifecycle status',
    format('select public.set_contract_status(%L, ''terminated'')', c1), 'forbidden');

  -- -------------------------------------------------------------- deadlines
  perform test.as_user(alice, 'alice@one.test');
  perform test.count_is('deadlines list expiry and notice dates', format('select 1 from public.deadlines where contract_id=%L and kind in (''expiration'',''notice'')', c1), 2);
  perform test.as_user(bob, 'bob@two.test');
  perform test.count_is('deadlines view respects tenant isolation', format('select 1 from public.deadlines where org_id=%L', org1), 0);
  perform test.count_is('outsider sees no finding of org 1', format('select 1 from public.risks where org_id=%L', org1), 0);
  perform test.count_is('outsider sees no obligation of org 1', format('select 1 from public.obligations where org_id=%L', org1), 0);
  perform test.count_is('outsider sees no analysis of org 1', format('select 1 from public.analyses where org_id=%L', org1), 0);
  perform test.count_is('outsider sees no review of org 1', format('select 1 from public.reviews where org_id=%L', org1), 0);

  -- ---------------------------------------------------------- re-analysis
  perform test.as_user(erin, 'erin@one.test');
  insert into public.analyses (org_id, contract_id, document_id, requested_by) values (org1, c1, d1, erin) returning id into a2;
  perform test.as_service();
  perform public.store_analysis_results(a2, jsonb_build_object('summary', 'v2', 'model', 'm', 'prompt_version', 'p',
    'risks', jsonb_build_array(jsonb_build_object('category', 'liability', 'severity', 'high', 'title', 'New', 'explanation', 'e', 'page_number', 1, 'quote', 'q', 'evidence_verified', true))));
  perform test.count_is('earlier AI findings are kept but superseded', format('select 1 from public.risks where contract_id=%L and source=''ai'' and superseded', c1), 3);
  perform test.count_is('manual findings survive a re-analysis', format('select 1 from public.risks where id=%L and not superseded', r_manual), 1);
  perform test.is_true('score reflects the latest analysis plus manual findings (20 + 8)',
    format('(select risk_score = 28 from public.contracts where id=%L)', c1));

  -- ------------------------------------------------------------ plan limits
  update public.subscriptions set contract_limit = 1, monthly_analysis_limit = 2 where org_id = org1;
  perform test.as_user(erin, 'erin@one.test');
  perform test.denied('contract limit of the plan is enforced',
    format('insert into public.contracts (org_id, title, created_by) values (%L, ''Second'', %L)', org1, erin), 'plan_limit_contracts');
  perform test.denied('monthly analysis limit of the plan is enforced',
    format('insert into public.analyses (org_id, contract_id, document_id, requested_by) values (%L, %L, %L, %L)', org1, c1, d1, erin), 'plan_limit_analyses');

  -- ------------------------------------------------------------ audit trail
  perform test.as_user(erin, 'erin@one.test');
  perform test.count_is('manager cannot read the audit log', 'select 1 from public.audit_log', 0);
  perform test.denied('users cannot write audit rows directly',
    format('insert into public.audit_log (org_id, action, entity_type) values (%L, ''x.y'', ''x'')', org1), 'permission denied');
  perform public.log_audit_event(org1, 'document.downloaded', 'document', d1, '{}');
  perform test.denied('users cannot imitate system audit entries',
    format($q$select public.log_audit_event(%L, 'contract.created', 'contract', %L, '{}')$q$, org1, c1), 'invalid_audit_event');
  perform test.denied('a download event must name a document of the same organisation',
    format($q$select public.log_audit_event(%L, 'document.downloaded', 'document', %L, '{}')$q$, org1, c2), 'invalid_audit_event');
  perform test.as_user(alice, 'alice@one.test');
  perform test.count_is('contract creation is audited with its actor',
    format('select 1 from public.audit_log where action=''contract.created'' and entity_id=%L and actor_id=%L', c1, erin), 1);
  perform test.count_is('review decision is audited',
    format('select 1 from public.audit_log where action=''review.updated'' and actor_id=%L and metadata->>''status_to''=''approved''', dave), 1);
  perform test.count_is('risk status change is audited',
    format('select 1 from public.audit_log where action=''risk.updated'' and entity_id=%L and metadata->>''status_to''=''mitigated''', r_crit), 1);
  perform test.count_is('membership changes are audited', format('select 1 from public.audit_log where action=''membership.created'' and org_id=%L', org1), 5);
  perform test.count_is('server-side writes are audited as system (no actor)',
    format('select 1 from public.audit_log where action=''analysis.updated'' and actor_id is null and org_id=%L', org1), 2);
  perform test.count_is('explicit events are recorded', 'select 1 from public.audit_log where action=''document.downloaded''', 1);
  perform test.count_is('owner sees only their organisation''s audit log', format('select 1 from public.audit_log where org_id <> %L', org1), 0);
  perform test.denied('owner cannot delete audit rows', 'delete from public.audit_log', 'permission denied');
  perform test.as_service();
  perform test.denied('even the server cannot alter audit rows', 'update public.audit_log set action = ''x.y''', 'append-only');
  perform test.denied('even the server cannot delete audit rows', 'delete from public.audit_log', 'append-only');
  perform test.denied('even the server cannot truncate the audit log', 'truncate public.audit_log', 'append-only');

  -- ---------------------------------------------------------------- storage
  perform test.as_user(erin, 'erin@one.test');
  insert into storage.objects (bucket_id, name) values ('contracts', org1 || '/' || c1 || '/' || d1 || '.pdf');
  perform test.denied('a file cannot be uploaded into another organisation''s folder',
    format('insert into storage.objects (bucket_id, name) values (''contracts'', %L)', org2 || '/' || c2 || '/evil.pdf'), 'row-level security');
  perform test.denied('a file path without an organisation folder is rejected',
    'insert into storage.objects (bucket_id, name) values (''contracts'', ''loose.pdf'')', 'row-level security');
  perform test.as_user(carol, 'carol@one.test');
  perform test.count_is('members can read their organisation''s files', 'select 1 from storage.objects', 1);
  perform test.denied('viewer cannot upload files',
    format('insert into storage.objects (bucket_id, name) values (''contracts'', %L)', org1 || '/' || c1 || '/v.pdf'), 'row-level security');
  perform test.as_user(bob, 'bob@two.test');
  perform test.count_is('outsider cannot read org 1 files', 'select 1 from storage.objects', 0);
  perform test.as_anon();
  perform test.count_is('anon cannot read any file', 'select 1 from storage.objects', 0);

  perform test.as_admin();
end $$;

\set QUIET off
\pset tuples_only on
select count(*) || ' database security checks passed' from test.results;
rollback;
