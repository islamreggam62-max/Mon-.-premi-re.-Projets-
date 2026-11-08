-- Test helpers shared by the *.test.sql files (each includes it with \ir).
-- Each check raises on failure, so a test file stops at the first broken rule.

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

-- SQLSTATE and message a statement fails with ('OK' if it succeeds); its effects are rolled back.
create or replace function tests.error_of(stmt text) returns text
language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    return sqlstate || ' ' || sqlerrm;
  end;
  return 'OK';
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

-- Act as a signed-in user (call as superuser, then switch role).
create or replace function tests.login(uid uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false);
$$;
