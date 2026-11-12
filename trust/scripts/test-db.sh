#!/usr/bin/env bash
# Runs the real migrations plus the security tests against a throwaway Postgres.
#
#   bash scripts/test-db.sh                 # starts a temporary local cluster (needs Postgres 15+ binaries)
#   TEST_DATABASE_URL=postgres://... bash scripts/test-db.sh   # uses an EMPTY database you provide
#
# Never point TEST_DATABASE_URL at a real Supabase project: the shim creates roles and schemas.
set -euo pipefail
cd "$(dirname "$0")/.."

run_sql() { psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$1"; }

if [ -n "${TEST_DATABASE_URL:-}" ]; then
  DB_URL="$TEST_DATABASE_URL"
else
  BIN="$(dirname "$(command -v initdb 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/initdb | sort -V | tail -1)")"
  WORK="$(mktemp -d)"
  PORT="${TEST_PG_PORT:-54329}"
  AS=()
  if [ "$(id -u)" = "0" ]; then            # Postgres refuses to run as root
    chown postgres "$WORK"
    AS=(runuser -u postgres --)
  fi
  cleanup() { "${AS[@]}" "$BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
  trap cleanup EXIT
  "${AS[@]}" "$BIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
  "${AS[@]}" "$BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null
  DB_URL="postgresql://postgres@/postgres?host=$WORK&port=$PORT"
fi

run_sql supabase/tests/00_supabase_shim.sql
for migration in supabase/migrations/*.sql; do
  run_sql "$migration"
done
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f supabase/tests/10_security.test.sql
