---
name: trust-check
description: >-
  Run every automated check of the TRUST application and report the results honestly. Use before a commit, a push, a release gate, or whenever someone asks "does it still work?". فحص شامل لتطبيق TRUST.
---

# TRUST — run every check

Run these from `trust/`, in this order, and stop to investigate at the first failure.

```bash
npm run lint
npm run typecheck
npm test                 # unit tests
npm run test:db          # real migrations on a throwaway Postgres + security tests
npm run build
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=smoke npx next build
npm run test:smoke       # every page, phone and desktop size, with fixture data
```

If the root project changed too, run `npm run lint`, `npx tsc --noEmit` and
`npx next build` at the repository root: NEXORA must keep building.

## Report

One table: check, result, and for a failure the first error with its file and line.
Then say plainly what these checks do **not** cover:

- The render smoke test uses fixed sample data. It proves pages render; it proves
  nothing about data or permissions.
- The database tests run on plain Postgres with a stand-in for Supabase's roles and
  storage schema, not on a Supabase project.
- No check calls the live Claude API.

Never skip, weaken or delete a failing test to get a green run. If a test is wrong,
say why and fix the test in its own change.

$ARGUMENTS
