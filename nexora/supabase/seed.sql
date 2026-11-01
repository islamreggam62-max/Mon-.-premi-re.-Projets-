-- =============================================================================
--  NEXORA — seed data (optional)
-- =============================================================================
--  Loads the same sample data the UI shows in demo mode into a fixed demo
--  workspace, so a freshly connected project isn't empty. Runs automatically
--  with `supabase db reset` (as superuser, so it bypasses RLS).
--
--  To SEE this data in the app, your signed-in user's profile must point at the
--  demo workspace. After signing up, run once (SQL editor):
--
--    update public.profiles
--       set workspace_id = '11111111-1111-1111-1111-111111111111'
--     where id = auth.uid();
--
--  …or copy these rows into your own workspace_id instead.
-- =============================================================================

insert into public.workspaces (id, name)
values ('11111111-1111-1111-1111-111111111111', 'NEXORA Demo Workspace')
on conflict (id) do nothing;

-- Use a session variable to avoid repeating the UUID.
\set ws '11111111-1111-1111-1111-111111111111'

-- Team ------------------------------------------------------------------------
insert into public.team_members (workspace_id, name, role, department, email, status, utilization, active_tasks, initials) values
(:'ws','Amelia Hart','Chief Operating Officer','Executive','amelia.hart@demo.nexora.app','active',72,5,'AH'),
(:'ws','Daniel Okafor','VP Engineering','Engineering','daniel.okafor@demo.nexora.app','active',88,9,'DO'),
(:'ws','Sofia Marchetti','Head of Product','Product','sofia.marchetti@demo.nexora.app','away',81,7,'SM'),
(:'ws','Liam Chen','Finance Director','Finance','liam.chen@demo.nexora.app','active',64,4,'LC'),
(:'ws','Priya Nair','Design Lead','Design','priya.nair@demo.nexora.app','offline',90,8,'PN'),
(:'ws','Marcus Webb','Sales Manager','Revenue','marcus.webb@demo.nexora.app','active',77,6,'MW'),
(:'ws','Yuki Tanaka','Data Scientist','Engineering','yuki.tanaka@demo.nexora.app','away',69,3,'YT'),
(:'ws','Noah Williams','People Operations','People','noah.williams@demo.nexora.app','active',58,4,'NW');

-- Projects --------------------------------------------------------------------
insert into public.projects (workspace_id, name, client, status, progress, lead, budget_used, budget_total, due_date, team) values
(:'ws','Atlas Platform Migration','Internal','On track',68,'Daniel Okafor',320000,500000,'2026-12-15','{DO,YT,PN}'),
(:'ws','Northwind CRM Rollout','Northwind Group','At risk',41,'Sofia Marchetti',185000,260000,'2026-11-28','{SM,MW,LC}'),
(:'ws','Aurora Mobile App','Aurora Retail','On track',82,'Priya Nair',410000,450000,'2026-11-10','{PN,DO}'),
(:'ws','Q4 Market Expansion','Internal','Delayed',23,'Marcus Webb',96000,300000,'2026-12-31','{MW,AH,LC}'),
(:'ws','Compliance Automation','Meridian Bank','On track',55,'Liam Chen',140000,240000,'2027-01-20','{LC,YT}'),
(:'ws','Brand Refresh 2027','Internal','Completed',100,'Priya Nair',88000,90000,'2026-10-05','{PN,SM}');

-- Tasks -----------------------------------------------------------------------
insert into public.tasks (workspace_id, title, project, assignee, assignee_initials, priority, state, due, sort_order) values
(:'ws','Finalize data migration runbook','Atlas Platform Migration','Daniel Okafor','DO','High','In progress','Today',1),
(:'ws','Northwind stakeholder review deck','Northwind CRM Rollout','Sofia Marchetti','SM','Urgent','In review','Tomorrow',2),
(:'ws','Aurora checkout accessibility pass','Aurora Mobile App','Priya Nair','PN','Medium','In progress','Nov 3',3),
(:'ws','Draft Q4 expansion budget model','Q4 Market Expansion','Liam Chen','LC','High','Backlog','Nov 5',4),
(:'ws','Automate SOC2 evidence collection','Compliance Automation','Yuki Tanaka','YT','Medium','In progress','Nov 7',5),
(:'ws','Onboarding flow usability test','Aurora Mobile App','Priya Nair','PN','Low','Backlog','Nov 9',6),
(:'ws','CRM data mapping sign-off','Northwind CRM Rollout','Marcus Webb','MW','High','In review','Nov 4',7),
(:'ws','Publish migration retrospective','Atlas Platform Migration','Daniel Okafor','DO','Low','Done','Oct 29',8),
(:'ws','Finance close automation spec','Compliance Automation','Liam Chen','LC','Medium','Backlog','Nov 12',9),
(:'ws','Executive KPI definitions','Internal','Amelia Hart','AH','Urgent','In progress','Today',10);

-- Daily reports ---------------------------------------------------------------
insert into public.daily_reports (workspace_id, author, initials, role, report_date, summary, done, blockers, mood) values
(:'ws','Daniel Okafor','DO','VP Engineering','2026-10-31','Migration dry-run completed on staging with zero data loss.',
  '{"Completed staging dry-run","Reviewed rollback plan","Paired with Yuki on ETL edge cases"}','{"Awaiting prod DB window approval"}','Good'),
(:'ws','Sofia Marchetti','SM','Head of Product','2026-10-31','Northwind rollout timeline tightened — flagging capacity risk.',
  '{"Finalized requirements v3","Ran stakeholder sync"}','{"CRM data mapping sign-off pending","One engineer out next week"}','Okay'),
(:'ws','Priya Nair','PN','Design Lead','2026-10-31','Aurora app design system is ready for engineering handoff.',
  '{"Shipped component specs","Completed accessibility audit","Recorded walkthrough"}','{}','Great'),
(:'ws','Marcus Webb','MW','Sales Manager','2026-10-30','Pipeline healthy, two deals slipping to next quarter.',
  '{"Closed Meridian expansion","Updated forecast"}','{"Legal review backlog"}','Good');

-- Approvals -------------------------------------------------------------------
insert into public.approvals (workspace_id, title, type, requested_by, initials, amount, submitted, priority) values
(:'ws','Expand cloud compute budget (Atlas)','Budget','Daniel Okafor','DO','$45,000','2h ago','High'),
(:'ws','Senior Data Engineer offer','Hiring','Noah Williams','NW','$168,000/yr','5h ago','Urgent'),
(:'ws','Northwind master services agreement','Contract','Sofia Marchetti','SM',null,'1d ago','High'),
(:'ws','Production database admin access','Access','Yuki Tanaka','YT',null,'1d ago','Medium');

-- AI insights -----------------------------------------------------------------
insert into public.ai_insights (workspace_id, title, detail, category, confidence) values
(:'ws','Northwind CRM Rollout is trending toward delay','Progress is 41% with 28 days remaining and a pending data-mapping sign-off. Reallocating one engineer could recover roughly 6 days.','Risk',82),
(:'ws','Revenue is pacing 3.3% ahead of target','October revenue of $1.24M exceeds the $1.20M target. If current pace holds, the quarter closes ~$180K above plan.','Forecast',76),
(:'ws','Design team utilization is near capacity','Priya Nair and the design pod are averaging 90% utilization across two projects. Consider deferring the Brand Refresh follow-up.','Efficiency',88),
(:'ws','Meridian account shows expansion signal','Compliance Automation is on track and under budget. The account profile matches past upsell patterns — a strong candidate for a Q1 proposal.','Opportunity',71);

-- Activity feed ---------------------------------------------------------------
insert into public.activity_events (workspace_id, actor, initials, action, target) values
(:'ws','Daniel Okafor','DO','completed','staging migration dry-run'),
(:'ws','Amelia Hart','AH','approved','Q4 marketing budget'),
(:'ws','Priya Nair','PN','submitted','Aurora design handoff'),
(:'ws','Marcus Webb','MW','closed','Meridian expansion deal'),
(:'ws','Sofia Marchetti','SM','flagged a risk on','Northwind CRM Rollout');

-- KPIs ------------------------------------------------------------------------
insert into public.kpis (workspace_id, key, label, value, raw, delta_pct, trend, hint, sort_order) values
(:'ws','revenue','Monthly Revenue','$1.24M',1240000,12.4,'up','vs. last month',1),
(:'ws','active-projects','Active Projects','28',28,6.1,'up','4 launching this week',2),
(:'ws','team-utilization','Team Utilization','86%',86,-2.3,'down','target 80–90%',3),
(:'ws','open-approvals','Open Approvals','4',4,-33.0,'down','down from 6',4);

-- Revenue series --------------------------------------------------------------
insert into public.revenue_points (workspace_id, month, revenue, target, sort_order) values
(:'ws','Apr',820,800,1),(:'ws','May',910,860,2),(:'ws','Jun',870,900,3),
(:'ws','Jul',1020,960,4),(:'ws','Aug',1110,1040,5),(:'ws','Sep',1180,1120,6),
(:'ws','Oct',1240,1200,7);

-- Activity series -------------------------------------------------------------
insert into public.activity_points (workspace_id, day, tasks, reports, sort_order) values
(:'ws','Mon',42,18,1),(:'ws','Tue',55,22,2),(:'ws','Wed',48,20,3),
(:'ws','Thu',63,24,4),(:'ws','Fri',58,26,5),(:'ws','Sat',21,7,6),(:'ws','Sun',14,4,7);
