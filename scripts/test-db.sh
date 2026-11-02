#!/usr/bin/env bash
# Applies the Supabase migrations to an empty Postgres (15+) and runs the
# database tests once each.
#   DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
# The database must be disposable: the script installs a stand-in for
# Supabase's auth schema (supabase/tests/00_supabase_stub.sql).
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL to a disposable Postgres database}"
cd "$(dirname "$0")/.."
run() { psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 "$@"; }

run -f supabase/tests/00_supabase_stub.sql
for migration in supabase/migrations/*.sql; do
  echo "migrate: $migration"
  run -f "$migration"
done

for test in supabase/tests/[1-9]*.test.sql; do
  echo "test: $test"
  if ! out=$(run -f "$test" 2>&1); then
    echo "$out" | grep -E "PASS|FAIL|ERROR" | tail -20
    echo "FAILED: $test"
    exit 1
  fi
  echo "  $(echo "$out" | grep -c 'PASS:') checks passed"
done
