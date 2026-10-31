/**
 * =============================================================================
 *  NEXORA — DEMO DATA  (Phase 1)
 * =============================================================================
 *  Every value in this file is static, fictional sample data used only to
 *  design and preview the interface. There is NO backend, NO database and
 *  NO AI inference behind any of it. Do not treat these figures as real.
 *  When Supabase is wired up in Phase 2, these exports are what the data
 *  layer will replace.
 * =============================================================================
 */

export const IS_DEMO_DATA = true;

export interface Kpi {
  id: string;
  label: string;
  value: string;
  raw: number;
  deltaPct: number; // positive = up vs. previous period
  trend: "up" | "down";
  hint: string;
}

export const kpis: Kpi[] = [
  {
    id: "revenue",
    label: "Monthly Revenue",
    value: "$1.24M",
    raw: 1240000,
    deltaPct: 12.4,
    trend: "up",
    hint: "vs. last month",
  },
  {
    id: "active-projects",
    label: "Active Projects",
    value: "28",
    raw: 28,
    deltaPct: 6.1,
    trend: "up",
    hint: "4 launching this week",
  },
  {
    id: "team-utilization",
    label: "Team Utilization",
    value: "86%",
    raw: 86,
    deltaPct: -2.3,
    trend: "down",
    hint: "target 80–90%",
  },
  {
    id: "open-approvals",
    label: "Open Approvals",
    value: "4",
    raw: 4,
    deltaPct: -33.0,
    trend: "down",
    hint: "down from 6",
  },
];

export interface RevenuePoint {
  month: string;
  revenue: number;
  target: number;
}

export const revenueSeries: RevenuePoint[] = [
  { month: "Apr", revenue: 820, target: 800 },
  { month: "May", revenue: 910, target: 860 },
  { month: "Jun", revenue: 870, target: 900 },
  { month: "Jul", revenue: 1020, target: 960 },
  { month: "Aug", revenue: 1110, target: 1040 },
  { month: "Sep", revenue: 1180, target: 1120 },
  { month: "Oct", revenue: 1240, target: 1200 },
];

export interface ActivityPoint {
  day: string;
  tasks: number;
  reports: number;
}

export const activitySeries: ActivityPoint[] = [
  { day: "Mon", tasks: 42, reports: 18 },
  { day: "Tue", tasks: 55, reports: 22 },
  { day: "Wed", tasks: 48, reports: 20 },
  { day: "Thu", tasks: 63, reports: 24 },
  { day: "Fri", tasks: 58, reports: 26 },
  { day: "Sat", tasks: 21, reports: 7 },
  { day: "Sun", tasks: 14, reports: 4 },
];

export type MemberStatus = "active" | "away" | "offline";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  status: MemberStatus;
  utilization: number;
  activeTasks: number;
  initials: string;
}

export const team: TeamMember[] = [
  { id: "u1", name: "Amelia Hart", role: "Chief Operating Officer", department: "Executive", email: "amelia.hart@demo.nexora.app", status: "active", utilization: 72, activeTasks: 5, initials: "AH" },
  { id: "u2", name: "Daniel Okafor", role: "VP Engineering", department: "Engineering", email: "daniel.okafor@demo.nexora.app", status: "active", utilization: 88, activeTasks: 9, initials: "DO" },
  { id: "u3", name: "Sofia Marchetti", role: "Head of Product", department: "Product", email: "sofia.marchetti@demo.nexora.app", status: "away", utilization: 81, activeTasks: 7, initials: "SM" },
  { id: "u4", name: "Liam Chen", role: "Finance Director", department: "Finance", email: "liam.chen@demo.nexora.app", status: "active", utilization: 64, activeTasks: 4, initials: "LC" },
  { id: "u5", name: "Priya Nair", role: "Design Lead", department: "Design", email: "priya.nair@demo.nexora.app", status: "offline", utilization: 90, activeTasks: 8, initials: "PN" },
  { id: "u6", name: "Marcus Webb", role: "Sales Manager", department: "Revenue", email: "marcus.webb@demo.nexora.app", status: "active", utilization: 77, activeTasks: 6, initials: "MW" },
  { id: "u7", name: "Yuki Tanaka", role: "Data Scientist", department: "Engineering", email: "yuki.tanaka@demo.nexora.app", status: "away", utilization: 69, activeTasks: 3, initials: "YT" },
  { id: "u8", name: "Noah Williams", role: "People Operations", department: "People", email: "noah.williams@demo.nexora.app", status: "active", utilization: 58, activeTasks: 4, initials: "NW" },
];

export type ProjectStatus = "On track" | "At risk" | "Delayed" | "Completed";

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  lead: string;
  budgetUsed: number;
  budgetTotal: number;
  dueDate: string;
  team: string[];
}

export const projects: Project[] = [
  { id: "p1", name: "Atlas Platform Migration", client: "Internal", status: "On track", progress: 68, lead: "Daniel Okafor", budgetUsed: 320000, budgetTotal: 500000, dueDate: "2026-12-15", team: ["DO", "YT", "PN"] },
  { id: "p2", name: "Northwind CRM Rollout", client: "Northwind Group", status: "At risk", progress: 41, lead: "Sofia Marchetti", budgetUsed: 185000, budgetTotal: 260000, dueDate: "2026-11-28", team: ["SM", "MW", "LC"] },
  { id: "p3", name: "Aurora Mobile App", client: "Aurora Retail", status: "On track", progress: 82, lead: "Priya Nair", budgetUsed: 410000, budgetTotal: 450000, dueDate: "2026-11-10", team: ["PN", "DO"] },
  { id: "p4", name: "Q4 Market Expansion", client: "Internal", status: "Delayed", progress: 23, lead: "Marcus Webb", budgetUsed: 96000, budgetTotal: 300000, dueDate: "2026-12-31", team: ["MW", "AH", "LC"] },
  { id: "p5", name: "Compliance Automation", client: "Meridian Bank", status: "On track", progress: 55, lead: "Liam Chen", budgetUsed: 140000, budgetTotal: 240000, dueDate: "2027-01-20", team: ["LC", "YT"] },
  { id: "p6", name: "Brand Refresh 2027", client: "Internal", status: "Completed", progress: 100, lead: "Priya Nair", budgetUsed: 88000, budgetTotal: 90000, dueDate: "2026-10-05", team: ["PN", "SM"] },
];

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskState = "Backlog" | "In progress" | "In review" | "Done";

export interface TaskItem {
  id: string;
  title: string;
  project: string;
  assignee: string;
  assigneeInitials: string;
  priority: TaskPriority;
  state: TaskState;
  due: string;
}

export const tasks: TaskItem[] = [
  { id: "t1", title: "Finalize data migration runbook", project: "Atlas Platform Migration", assignee: "Daniel Okafor", assigneeInitials: "DO", priority: "High", state: "In progress", due: "Today" },
  { id: "t2", title: "Northwind stakeholder review deck", project: "Northwind CRM Rollout", assignee: "Sofia Marchetti", assigneeInitials: "SM", priority: "Urgent", state: "In review", due: "Tomorrow" },
  { id: "t3", title: "Aurora checkout accessibility pass", project: "Aurora Mobile App", assignee: "Priya Nair", assigneeInitials: "PN", priority: "Medium", state: "In progress", due: "Nov 3" },
  { id: "t4", title: "Draft Q4 expansion budget model", project: "Q4 Market Expansion", assignee: "Liam Chen", assigneeInitials: "LC", priority: "High", state: "Backlog", due: "Nov 5" },
  { id: "t5", title: "Automate SOC2 evidence collection", project: "Compliance Automation", assignee: "Yuki Tanaka", assigneeInitials: "YT", priority: "Medium", state: "In progress", due: "Nov 7" },
  { id: "t6", title: "Onboarding flow usability test", project: "Aurora Mobile App", assignee: "Priya Nair", assigneeInitials: "PN", priority: "Low", state: "Backlog", due: "Nov 9" },
  { id: "t7", title: "CRM data mapping sign-off", project: "Northwind CRM Rollout", assignee: "Marcus Webb", assigneeInitials: "MW", priority: "High", state: "In review", due: "Nov 4" },
  { id: "t8", title: "Publish migration retrospective", project: "Atlas Platform Migration", assignee: "Daniel Okafor", assigneeInitials: "DO", priority: "Low", state: "Done", due: "Oct 29" },
  { id: "t9", title: "Finance close automation spec", project: "Compliance Automation", assignee: "Liam Chen", assigneeInitials: "LC", priority: "Medium", state: "Backlog", due: "Nov 12" },
  { id: "t10", title: "Executive KPI definitions", project: "Internal", assignee: "Amelia Hart", assigneeInitials: "AH", priority: "Urgent", state: "In progress", due: "Today" },
];

export const taskStates: TaskState[] = ["Backlog", "In progress", "In review", "Done"];

export interface DailyReport {
  id: string;
  author: string;
  initials: string;
  role: string;
  date: string;
  summary: string;
  done: string[];
  blockers: string[];
  mood: "Great" | "Good" | "Okay" | "Blocked";
}

export const dailyReports: DailyReport[] = [
  {
    id: "r1",
    author: "Daniel Okafor",
    initials: "DO",
    role: "VP Engineering",
    date: "Oct 31, 2026",
    summary: "Migration dry-run completed on staging with zero data loss.",
    done: ["Completed staging dry-run", "Reviewed rollback plan", "Paired with Yuki on ETL edge cases"],
    blockers: ["Awaiting prod DB window approval"],
    mood: "Good",
  },
  {
    id: "r2",
    author: "Sofia Marchetti",
    initials: "SM",
    role: "Head of Product",
    date: "Oct 31, 2026",
    summary: "Northwind rollout timeline tightened — flagging capacity risk.",
    done: ["Finalized requirements v3", "Ran stakeholder sync"],
    blockers: ["CRM data mapping sign-off pending", "One engineer out next week"],
    mood: "Okay",
  },
  {
    id: "r3",
    author: "Priya Nair",
    initials: "PN",
    role: "Design Lead",
    date: "Oct 31, 2026",
    summary: "Aurora app design system is ready for engineering handoff.",
    done: ["Shipped component specs", "Completed accessibility audit", "Recorded walkthrough"],
    blockers: [],
    mood: "Great",
  },
  {
    id: "r4",
    author: "Marcus Webb",
    initials: "MW",
    role: "Sales Manager",
    date: "Oct 30, 2026",
    summary: "Pipeline healthy, two deals slipping to next quarter.",
    done: ["Closed Meridian expansion", "Updated forecast"],
    blockers: ["Legal review backlog"],
    mood: "Good",
  },
];

export type ApprovalType = "Expense" | "Hiring" | "Contract" | "Access" | "Budget";

export interface Approval {
  id: string;
  title: string;
  type: ApprovalType;
  requestedBy: string;
  initials: string;
  amount?: string;
  submitted: string;
  priority: TaskPriority;
}

export const approvals: Approval[] = [
  { id: "a1", title: "Expand cloud compute budget (Atlas)", type: "Budget", requestedBy: "Daniel Okafor", initials: "DO", amount: "$45,000", submitted: "2h ago", priority: "High" },
  { id: "a2", title: "Senior Data Engineer offer", type: "Hiring", requestedBy: "Noah Williams", initials: "NW", amount: "$168,000/yr", submitted: "5h ago", priority: "Urgent" },
  { id: "a3", title: "Northwind master services agreement", type: "Contract", requestedBy: "Sofia Marchetti", initials: "SM", submitted: "1d ago", priority: "High" },
  { id: "a4", title: "Production database admin access", type: "Access", requestedBy: "Yuki Tanaka", initials: "YT", submitted: "1d ago", priority: "Medium" },
];

export interface AiInsight {
  id: string;
  title: string;
  detail: string;
  category: "Risk" | "Opportunity" | "Efficiency" | "Forecast";
  confidence: number;
}

/**
 * NOTE: These "insights" are hand-written placeholder text. No model is
 * generating them. They exist only to show how the AI Intelligence surface
 * will present recommendations once a real engine is connected in a later
 * phase.
 */
export const aiInsights: AiInsight[] = [
  {
    id: "i1",
    title: "Northwind CRM Rollout is trending toward delay",
    detail: "Progress is 41% with 28 days remaining and a pending data-mapping sign-off. Reallocating one engineer could recover roughly 6 days.",
    category: "Risk",
    confidence: 82,
  },
  {
    id: "i2",
    title: "Revenue is pacing 3.3% ahead of target",
    detail: "October revenue of $1.24M exceeds the $1.20M target. If current pace holds, the quarter closes ~$180K above plan.",
    category: "Forecast",
    confidence: 76,
  },
  {
    id: "i3",
    title: "Design team utilization is near capacity",
    detail: "Priya Nair and the design pod are averaging 90% utilization across two projects. Consider deferring the Brand Refresh follow-up.",
    category: "Efficiency",
    confidence: 88,
  },
  {
    id: "i4",
    title: "Meridian account shows expansion signal",
    detail: "Compliance Automation is on track and under budget. The account profile matches past upsell patterns — a strong candidate for a Q1 proposal.",
    category: "Opportunity",
    confidence: 71,
  },
];

export interface ActivityEvent {
  id: string;
  actor: string;
  initials: string;
  action: string;
  target: string;
  time: string;
}

export const recentActivity: ActivityEvent[] = [
  { id: "e1", actor: "Daniel Okafor", initials: "DO", action: "completed", target: "staging migration dry-run", time: "12m ago" },
  { id: "e2", actor: "Amelia Hart", initials: "AH", action: "approved", target: "Q4 marketing budget", time: "48m ago" },
  { id: "e3", actor: "Priya Nair", initials: "PN", action: "submitted", target: "Aurora design handoff", time: "1h ago" },
  { id: "e4", actor: "Marcus Webb", initials: "MW", action: "closed", target: "Meridian expansion deal", time: "3h ago" },
  { id: "e5", actor: "Sofia Marchetti", initials: "SM", action: "flagged a risk on", target: "Northwind CRM Rollout", time: "4h ago" },
];
