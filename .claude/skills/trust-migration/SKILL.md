---
name: trust-migration
description: >-
  Add or change something in the TRUST database safely: a table, column, policy, function or storage rule. Use for any change under trust/supabase. تعديل قاعدة بيانات TRUST بأمان مع اختبار.
---

# TRUST — change the database

The database is where tenant isolation and the workflow rules live. A change here
is a security change. Dispatch `trust-database-engineer` for the work and
`trust-tenant-security-reviewer` for the review; do not let one agent do both.

## Rules

1. **A new numbered migration.** Never edit a migration that may already be applied
   to a project. (Editing `0001`/`0002` is acceptable only while no project has them.)
2. **Every tenant table** has `org_id`, row-level security enabled, a policy per
   operation it allows, explicit column-level grants, and composite `(id, org_id)`
   foreign keys to its parent.
3. **Server-only data** (AI results, evidence flags, usage, audit) has no insert,
   update or delete grant for `authenticated`.
4. **Functions:** `security definer` only when needed, always `set search_path = ''`,
   the authorisation check first, execute revoked from `public` and `anon`.
5. **Never trust a stored path or a caller's argument** with the service role.
   Derive from ids; validate.
6. **Counts that gate money or limits** are kept where users cannot delete them.

## Method

1. Write the test first in `trust/supabase/tests/10_security.test.sql`: what a member
   of another organisation, a lower role and an anonymous caller must not be able to
   do, and what the intended role can do.
2. Write the migration.
3. Run `npm run test:db` and paste the result.
4. **Break it on purpose once:** in a scratch copy, remove the new policy or check and
   confirm the new test fails. A test that cannot fail proves nothing.
5. Update `trust/docs/SECURITY.md` if a guarantee was added or changed.

## Report

What each role can now do that it could not before, the test output, the result of
the deliberate break, and anything not covered.

$ARGUMENTS
