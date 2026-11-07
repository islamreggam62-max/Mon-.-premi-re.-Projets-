# NEXORA — Phase 2 plan: Supabase integration

> **Status (step 1 done):** the core schema, row-level security, and the
> multi-step functions are implemented in `supabase/migrations/20261102000000_core.sql`;
> owner-issued activation codes in `supabase/migrations/20261103000000_activation_codes.sql`.
> They are covered by `supabase/tests/10_tenancy.test.sql` (67 checks: tenant isolation,
> roles, invites, approvals and their audit trail, separation of duties: nobody decides
> their own request, only the owner manages admins, a viewer writes nothing) and `supabase/tests/20_activation_codes.test.sql`
> (47 checks: who may issue and use a code, single use, expiry, email binding,
> nothing stored in clear). Run them with `DATABASE_URL=… scripts/test-db.sh`; CI runs
> them in `.github/workflows/database.yml`. The app does not use the database yet
> (next steps below).

## Architecture decision: static site + database security

The site is a static export on GitHub Pages, so there is no Node server for Server
Actions or middleware. The browser uses the Supabase client with the public anon key,
and **Row-Level Security is the security boundary**: every table is protected in the
database, and multi-step changes run in `security definer` functions that check the
caller themselves (`create_workspace`, `accept_invite`, `decide_approval`,
`set_member_role`). Work that needs a secret (AI calls, Google/Microsoft
integrations, payment webhooks) goes in Supabase Edge Functions, never in the browser.

Implemented in step 1 (a leaner cut of the schema below): `profiles`, `workspaces`
(one company = one workspace), `departments`, `workspace_members`,
`workspace_invites`, `projects`, `tasks`, `daily_reports` (completed work and
priorities as arrays), `report_blockers`, `approvals`, `approval_events`. Composite
foreign keys stop a row from pointing at another company's project or at a
non-member.

## Activation codes: only the owner opens companies

A customer cannot create a company on their own. The NEXORA owner issues an
activation code (`NEXORA-XXXX-XXXX-XXXX-XXXX`, 80 random bits) for one customer;
the customer types it once when creating their company. The code sets the plan
(`trial`, `monthly`, `annual`), can be tied to the customer's email, expires (1 to
365 days, 30 by default) and works once. The database keeps only its SHA-256 hash
and last four characters, so the code is shown once, to the owner, and appears
nowhere in the site's public source code. A company's own owner and admins cannot
change its plan.

Owner steps in the Supabase SQL editor, once the owner's account exists
(Authentication → Users):

```sql
-- Once: make your account the NEXORA owner.
insert into public.platform_admins (user_id)
select id from auth.users where email = 'islamreggam62@gmail.com';

-- For each customer: issue a code (run the block as one query).
begin;
select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
  from auth.users where email = 'islamreggam62@gmail.com';
select * from public.issue_activation_code('annual', 'directeur@entreprise.dz', 'Entreprise X', 30);
commit;

-- Your codes (hints only) and who used them.
select hint, plan, email, label, expires_at, used_at, revoked_at
from public.activation_codes order by created_at desc;

-- Cancel an unused code.
update public.activation_codes set revoked_at = now()
where hint = 'XXXX' and used_at is null and revoked_at is null;
```

The editor runs as a database administrator with no signed-in user, hence the
`set_config` line, which states the owner's identity for that transaction only.
Keep Supabase's "Confirm email" setting on: an email-bound code trusts the email
of the signed-in account. A screen for issuing codes belongs to step 2.

## Next steps

1. Supabase project (owner): create it, run the migration in the SQL editor, add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as repository
   variables, set the Auth site URL and redirect URLs to the site.
2. Sign-up / sign-in, company creation with an activation code and onboarding,
   team invites, roles, and an owner screen to issue codes.
3. Projects, tasks, daily reports, and approvals on real data (the demo stays as is).
4. Dashboard computed from real records.
5. Then: AI brief (Edge Function, usage tracking), data import, payments.

---

Original plan (kept for reference):

## Goal

Replace the static demo data layer (`lib/data/*`) with Supabase (Postgres, Auth, Row-Level
Security) **without changing UI components**. Components already receive typed props from
server pages, so the swap happens behind the page loaders.

```
Phase 1:  app/<page>.tsx ──imports──▶ lib/data/*.ts (static)        ──▶ components (props)
Phase 2:  app/<page>.tsx ──awaits───▶ lib/repositories/*.ts (Supabase) ──▶ components (same props)
```

## Schema (Postgres)

Conventions: `uuid` primary keys (`gen_random_uuid()`), `timestamptz` for instants, `date` for
calendar days, money as `bigint` **cents**, every business table carries `workspace_id`.

### Enums

| Enum | Values (match `lib/types.ts`) |
|---|---|
| `health` | `on-track`, `at-risk`, `delayed` |
| `priority` | `low`, `medium`, `high`, `critical` |
| `task_status` | `todo`, `in-progress`, `in-review`, `blocked`, `done` |
| `approval_kind` | `budget`, `contract`, `hiring`, `exception` |
| `approval_status` | `pending`, `in-review`, `changes-requested`, `approved`, `rejected` |
| `access_role` | `owner`, `admin`, `manager`, `member`, `viewer` |
| `presence_status` | `active`, `away`, `offline`, `on-leave` |
| `severity` | `low`, `medium`, `high` |
| `report_section` | `completed`, `priority` |
| `governance_area` | `approvals`, `daily_reports`, `escalation`, `data` |

### Tables

| Table | Key columns | Notes |
|---|---|---|
| `organizations` | `name`, `legal_name`, `industry`, `size`, `headquarters`, `website`, `fiscal_year_start`, `timezone`, `locale`, `currency` | Settings → Organization |
| `workspaces` | `organization_id`, `name`, `slug` (unique), `plan`, `region` | Workspace switcher |
| `profiles` | `id` = `auth.users.id`, `full_name`, `email`, `avatar_url` | One per login |
| `departments` | `workspace_id`, `name`, `lead_member_id` | Replaces the `Department` union |
| `workspace_members` | PK (`workspace_id`, `user_id`), `access_role`, `title`, `department_id`, `location`, `joined_on`, `status`, `reports_daily`, `workload` (0–100 check) | Team directory + RBAC |
| `projects` | `workspace_id`, `code`, `name`, `summary`, `health`, `progress` (0–100), `owner_id`, `department_id`, `start_on`, `target_on`, `budget_cents`, `spent_cents`, `tags text[]` | |
| `project_members` | PK (`project_id`, `user_id`) | |
| `milestones` | `project_id`, `name`, `due_on`, `done_at` | `done` = `done_at is not null` |
| `tasks` | `workspace_id`, `project_id`, `key` (unique per workspace), `title`, `assignee_id`, `status`, `priority`, `due_on`, `estimate_hours`, `tags text[]` | |
| `daily_reports` | `workspace_id`, `author_id`, `report_date`, `submitted_at`, `energy` (1–5 check); unique (`workspace_id`, `author_id`, `report_date`) | One report per person per day |
| `daily_report_items` | `report_id`, `section`, `body`, `position`, `task_id` (nullable) | Completed Work / Priorities |
| `report_blockers` | `report_id`, `description`, `waiting_on_user_id` (nullable), `waiting_on_text`, `severity`, `resolved_at` | Feeds "Critical blockers" |
| `member_leave` | `workspace_id`, `member_id`, `starts_on`, `ends_on`, `reason` | Excuses report expectations (streaks never penalize leave) |
| `holidays` | `workspace_id`, `holiday_on`, `name` | Business-day calendar for submission tracking |
| `approvals` | `workspace_id`, `kind`, `title`, `summary`, `requested_by`, `approver_id`, `status`, `amount_cents`, `currency`, `counterparty`, `headcount`, `project_id`, `submitted_on`, `due_on`, `decided_at`, `decision_note` | Checks: `amount_cents` required for `budget` and `contract`; `counterparty` for `contract`; `headcount` for `hiring` |
| `approval_events` | `approval_id`, `actor_id`, `from_status`, `to_status`, `note`, `created_at` | Append-only audit trail of decisions |
| `kpi_snapshots` | `workspace_id`, `metric`, `period_start`, `period_end`, `value`, `unit` | Dashboard KPIs (imported or computed) |
| `notifications` | `workspace_id`, `user_id`, `tone`, `title`, `detail`, `href`, `read_at` | Bell menu |
| `governance_policies` | `workspace_id`, `area`, `title`, `rule`, `owner_id`, `config jsonb` (thresholds, cutoffs, SLAs), `updated_by`, `updated_at` | Settings → Governance; `config` drives enforcement |

AI tables (`ai_insights`, `ai_runs`, `risk_snapshots` for the risk radar) belong to the AI phase, not Phase 2.

### Indexes

`tasks (workspace_id, status)`, `tasks (assignee_id)`, `tasks (project_id)`,
`daily_reports (workspace_id, report_date)`, `approvals (workspace_id, status, due_on)`,
`report_blockers (report_id) where resolved_at is null`.

Derived values stay derived, never stored. Today they are computed by the pure functions in
`lib/metrics.ts`; in Phase 2 the heavier ones become SQL views:

| View | Replaces | Logic |
|---|---|---|
| `report_compliance_v` | `computeCompliance` | Business days (`generate_series` minus weekends, `holidays`, `member_leave`) left-joined to `daily_reports`; streak = consecutive submitted days ending today (or yesterday while today is open) |
| `department_health_v` | `departmentHealth` | Critical: an owned project Delayed or avg workload ≥ 90%; Watch: At Risk project, workload ≥ 80%, or today's submission < 70% |
| `operational_velocity_v` | `operationalVelocity` | Share of open tasks neither blocked nor past `due_on` |

Approval urgency, overdue flags, and health counts stay in application code.

## Row-Level Security

Enable RLS on every table. Two `security definer` helpers:

- `is_member(ws uuid) → boolean`
- `has_role(ws uuid, roles access_role[]) → boolean`

Policies mirror the Phase 1 permission matrix (`lib/data/settings.ts`):

| Area | Read | Write |
|---|---|---|
| Projects, tasks | any member | manager+ (members: tasks assigned to them) |
| Daily reports | author; manager+ for their workspace | author only, for their own `report_date` |
| Approvals | requester, approver, admin+ | insert: manager+; status change: approver, admin+ |
| Settings, roles | admin+ | owner/admin; only the owner can transfer ownership |
| Governance policies | any member | admin+; changes written to an audit log |
| Billing | owner (admin read-only) | owner |

## Application changes

1. Add `@supabase/supabase-js` and `@supabase/ssr`; create server and browser clients.
2. Generate types (`supabase gen types typescript`) and map rows to the existing `lib/types.ts`
   shapes inside `lib/repositories/*` (cents → dollars, `done_at` → `done`).
3. Turn page loaders into `async` server components that call repositories.
4. Mutations through Server Actions with input validation: approval decisions (writing an
   `approval_events` row in the same transaction), daily report submission (new form), role
   changes, settings saves.
5. Auth: Supabase Auth (email magic link first; SSO in the Security roadmap), middleware to
   protect routes, sign-out in the profile menu.
6. Secrets: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
   (git-ignored). The service-role key is server-only and never exposed to the client.
7. Keep demo mode available as a seed script (`supabase/seed.sql`) generated from `lib/data/*`.
