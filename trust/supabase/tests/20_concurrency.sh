#!/usr/bin/env bash
# Concurrency tests: two sessions acting at the same moment, with committed data.
# Run by scripts/test-db.sh after the single-session tests. Needs $DB_URL.
#
# Each scenario starts session A, which takes its lock and then sleeps inside its
# transaction; session B starts while A is still open. A correct rule makes B wait
# for A and then decide on the committed state. A broken rule lets both through.
set -euo pipefail
: "${DB_URL:?DB_URL must be set}"

ORG=10000000-0000-4000-8000-000000000001
ALICE=10000000-0000-4000-8000-0000000000a1   # owner
BOB=10000000-0000-4000-8000-0000000000b1     # owner
ERIN=10000000-0000-4000-8000-0000000000e1    # manager
DAVE=10000000-0000-4000-8000-0000000000d1    # reviewer
C1=10000000-0000-4000-8000-0000000000c1
DOC=10000000-0000-4000-8000-0000000000f1

q() { psql "$DB_URL" -v ON_ERROR_STOP=1 -qtAX -c "$1"; }

# Signed-in session: the JWT claims and role that PostgREST would set.
as_user() {
  local uid=$1 email=$2; shift 2
  printf "set role authenticated;\nset request.jwt.claims = '{\"sub\":\"%s\",\"email\":\"%s\"}';\n%s\n" "$uid" "$email" "$*"
}

# Committed fixture, written as the database owner.
q "
insert into auth.users (id, email) values
  ('$ALICE','alice@c.test'), ('$BOB','bob@c.test'), ('$ERIN','erin@c.test'), ('$DAVE','dave@c.test');
insert into public.organizations (id, name, created_by) values ('$ORG', 'Concurrency Org', '$ALICE');
insert into public.subscriptions (org_id, seat_limit) values ('$ORG', 10);
insert into public.memberships (org_id, user_id, role) values
  ('$ORG','$ALICE','owner'), ('$ORG','$BOB','owner'), ('$ORG','$ERIN','manager'), ('$ORG','$DAVE','reviewer');
insert into public.contracts (id, org_id, title, created_by) values ('$C1', '$ORG', 'Race contract', '$ERIN');
" >/dev/null

passed=0
pass() { echo "  ok: $1"; passed=$((passed + 1)); }
fail() { echo "FAIL [$1]: $2" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Two owners demote each other at the same moment. The organisation must
#    keep at least one owner.
out_a=$(mktemp); out_b=$(mktemp)
{ as_user "$ALICE" alice@c.test "begin; select public.set_member_role('$ORG', '$BOB', 'admin'); select pg_sleep(1.5); commit;"; } \
  | psql "$DB_URL" -qtAX >"$out_a" 2>&1 &
pid_a=$!
sleep 0.4
{ as_user "$BOB" bob@c.test "begin; select public.set_member_role('$ORG', '$ALICE', 'admin'); commit;"; } \
  | psql "$DB_URL" -qtAX >"$out_b" 2>&1 || true
wait "$pid_a" || true
owners=$(q "select count(*) from public.memberships where org_id = '$ORG' and role = 'owner'")
[ "$owners" -ge 1 ] || fail "two owners demoting each other at once leave at least one owner" \
  "owners left: $owners. A: $(tr '\n' ' ' <"$out_a") B: $(tr '\n' ' ' <"$out_b")"
grep -q "forbidden\|last_owner" "$out_b" || fail "the second demotion is refused once the first has committed" \
  "B output: $(tr '\n' ' ' <"$out_b")"
pass "two owners demoting each other at once leave at least one owner"
rm -f "$out_a" "$out_b"

# ---------------------------------------------------------------------------
# 2. A document is added while a review is being requested. Either the document
#    lands before the contract is locked, or it is refused: it must never be
#    attached to a contract that is under review.
out_a=$(mktemp); out_b=$(mktemp)
{ as_user "$ERIN" erin@c.test "begin; select public.request_review('$C1', '$DAVE'); select pg_sleep(1.5); commit;"; } \
  | psql "$DB_URL" -qtAX >"$out_a" 2>&1 &
pid_a=$!
sleep 0.4
{ as_user "$ERIN" erin@c.test "insert into public.documents (id, org_id, contract_id, storage_path, filename, mime_type, size_bytes, sha256, uploaded_by)
    values ('$DOC', '$ORG', '$C1', '$ORG/$C1/$DOC.pdf', 'late.pdf', 'application/pdf', 10, repeat('a', 64), '$ERIN');"; } \
  | psql "$DB_URL" -v ON_ERROR_STOP=1 -qtAX >"$out_b" 2>&1 || true
wait "$pid_a" || true
status=$(q "select status from public.contracts where id = '$C1'")
docs=$(q "select count(*) from public.documents where contract_id = '$C1'")
[ "$status" = "in_review" ] || fail "the review request commits" "status: $status. A: $(tr '\n' ' ' <"$out_a")"
[ "$docs" = "0" ] || fail "no document is attached to a contract once it is under review" \
  "documents: $docs. B: $(tr '\n' ' ' <"$out_b")"
grep -q "contract_locked" "$out_b" || fail "the late document is refused with contract_locked" "B: $(tr '\n' ' ' <"$out_b")"
pass "a document added during a review request is refused, not slipped in"

echo " $passed concurrency checks passed"
