# NEXORA — Phase 2 plan: Supabase integration

> Planning document only. Nothing in this file is implemented in Phase 1.

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
