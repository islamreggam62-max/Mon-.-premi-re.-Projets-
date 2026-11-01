/**
 * =============================================================================
 *  NEXORA — data-access layer
 * =============================================================================
 *  Server-only. Every page reads the workspace's data through these async
 *  getters instead of touching Supabase or the demo module directly.
 *
 *  Behavior:
 *    • Supabase NOT configured  → return the labeled demo data (demo mode).
 *    • Supabase configured       → query Supabase (Row-Level Security scopes
 *                                   results to the signed-in user's workspace).
 *    • Query throws (e.g. tables not migrated yet) → log and fall back to demo
 *                                   data so the UI never crashes during setup.
 *
 *  Do not import this file from a Client Component — it uses next/headers.
 * =============================================================================
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";
import {
  kpis as demoKpis,
  revenueSeries as demoRevenue,
  activitySeries as demoActivity,
  team as demoTeam,
  projects as demoProjects,
  tasks as demoTasks,
  dailyReports as demoReports,
  approvals as demoApprovals,
  aiInsights as demoInsights,
  recentActivity as demoRecentActivity,
  type Kpi,
  type RevenuePoint,
  type ActivityPoint,
  type TeamMember,
  type Project,
  type TaskItem,
  type DailyReport,
  type Approval,
  type AiInsight,
  type ActivityEvent,
} from "@/lib/demo-data";

type Tables = Database["public"]["Tables"];

/** Whether the current response is being served from live Supabase data. */
export function isLiveData(): boolean {
  return isSupabaseConfigured();
}

function logFallback(resource: string, error: unknown) {
  console.warn(
    `[nexora/data] "${resource}" query failed; falling back to demo data.`,
    error instanceof Error ? error.message : error
  );
}

/** Generic helper: run a query when configured, else return demo data. */
async function load<T>(
  resource: string,
  demo: T,
  run: (supabase: ReturnType<typeof createClient>) => Promise<T>
): Promise<T> {
  if (!isSupabaseConfigured()) return demo;
  try {
    return await run(createClient());
  } catch (error) {
    logFallback(resource, error);
    return demo;
  }
}

// ---- formatting helpers -----------------------------------------------------

function formatReportDate(iso: string): string {
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---- row → UI mappers -------------------------------------------------------

const mapKpi = (r: Tables["kpis"]["Row"]): Kpi => ({
  id: r.key,
  label: r.label,
  value: r.value,
  raw: Number(r.raw),
  deltaPct: Number(r.delta_pct),
  trend: r.trend,
  hint: r.hint,
});

const mapRevenue = (r: Tables["revenue_points"]["Row"]): RevenuePoint => ({
  month: r.month,
  revenue: Number(r.revenue),
  target: Number(r.target),
});

const mapActivity = (r: Tables["activity_points"]["Row"]): ActivityPoint => ({
  day: r.day,
  tasks: Number(r.tasks),
  reports: Number(r.reports),
});

const mapTeam = (r: Tables["team_members"]["Row"]): TeamMember => ({
  id: r.id,
  name: r.name,
  role: r.role,
  department: r.department,
  email: r.email,
  status: r.status,
  utilization: Number(r.utilization),
  activeTasks: Number(r.active_tasks),
  initials: r.initials,
});

const mapProject = (r: Tables["projects"]["Row"]): Project => ({
  id: r.id,
  name: r.name,
  client: r.client,
  status: r.status,
  progress: Number(r.progress),
  lead: r.lead,
  budgetUsed: Number(r.budget_used),
  budgetTotal: Number(r.budget_total),
  dueDate: r.due_date,
  team: r.team ?? [],
});

const mapTask = (r: Tables["tasks"]["Row"]): TaskItem => ({
  id: r.id,
  title: r.title,
  project: r.project,
  assignee: r.assignee,
  assigneeInitials: r.assignee_initials,
  priority: r.priority,
  state: r.state,
  due: r.due,
});

const mapReport = (r: Tables["daily_reports"]["Row"]): DailyReport => ({
  id: r.id,
  author: r.author,
  initials: r.initials,
  role: r.role,
  date: formatReportDate(r.report_date),
  summary: r.summary,
  done: r.done ?? [],
  blockers: r.blockers ?? [],
  mood: r.mood,
});

const mapApproval = (r: Tables["approvals"]["Row"]): Approval => ({
  id: r.id,
  title: r.title,
  type: r.type,
  requestedBy: r.requested_by,
  initials: r.initials,
  amount: r.amount ?? undefined,
  submitted: r.submitted,
  priority: r.priority,
});

const mapInsight = (r: Tables["ai_insights"]["Row"]): AiInsight => ({
  id: r.id,
  title: r.title,
  detail: r.detail,
  category: r.category,
  confidence: Number(r.confidence),
});

const mapEvent = (r: Tables["activity_events"]["Row"]): ActivityEvent => ({
  id: r.id,
  actor: r.actor,
  initials: r.initials,
  action: r.action,
  target: r.target,
  time: relativeTime(r.created_at),
});

// ---- public getters ---------------------------------------------------------

export function getKpis(): Promise<Kpi[]> {
  return load("kpis", demoKpis, async (s) => {
    const { data, error } = await s
      .from("kpis")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map(mapKpi);
  });
}

export function getRevenueSeries(): Promise<RevenuePoint[]> {
  return load("revenue_points", demoRevenue, async (s) => {
    const { data, error } = await s
      .from("revenue_points")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map(mapRevenue);
  });
}

export function getActivitySeries(): Promise<ActivityPoint[]> {
  return load("activity_points", demoActivity, async (s) => {
    const { data, error } = await s
      .from("activity_points")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map(mapActivity);
  });
}

export function getTeam(): Promise<TeamMember[]> {
  return load("team_members", demoTeam, async (s) => {
    const { data, error } = await s
      .from("team_members")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapTeam);
  });
}

export function getProjects(): Promise<Project[]> {
  return load("projects", demoProjects, async (s) => {
    const { data, error } = await s
      .from("projects")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapProject);
  });
}

export function getTasks(): Promise<TaskItem[]> {
  return load("tasks", demoTasks, async (s) => {
    const { data, error } = await s
      .from("tasks")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map(mapTask);
  });
}

export function getDailyReports(): Promise<DailyReport[]> {
  return load("daily_reports", demoReports, async (s) => {
    const { data, error } = await s
      .from("daily_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapReport);
  });
}

export function getApprovals(): Promise<Approval[]> {
  return load("approvals", demoApprovals, async (s) => {
    const { data, error } = await s
      .from("approvals")
      .select("*")
      .eq("decision", "pending")
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapApproval);
  });
}

export function getAiInsights(): Promise<AiInsight[]> {
  return load("ai_insights", demoInsights, async (s) => {
    const { data, error } = await s
      .from("ai_insights")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapInsight);
  });
}

export function getRecentActivity(): Promise<ActivityEvent[]> {
  return load("activity_events", demoRecentActivity, async (s) => {
    const { data, error } = await s
      .from("activity_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  });
}
