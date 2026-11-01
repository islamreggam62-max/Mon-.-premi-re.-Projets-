/**
 * NEXORA domain model.
 * Strict TypeScript interfaces for every entity surfaced in the UI.
 * The UI layer consumes these exclusively; the demo data layer satisfies them.
 */

/* ----------------------------------------------------------------------------
 * Shared primitives
 * ------------------------------------------------------------------------- */

export type Health = "on-track" | "at-risk" | "off-track";
export type Priority = "critical" | "high" | "medium" | "low";
export type Trend = "up" | "down" | "flat";

export interface Person {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: Department;
  email: string;
  /** 0–100 current utilization. */
  workload: number;
  status: "active" | "away" | "offline";
}

export type Department =
  | "Executive"
  | "Engineering"
  | "Product"
  | "Design"
  | "Sales"
  | "Marketing"
  | "Operations"
  | "Finance";

/* ----------------------------------------------------------------------------
 * Dashboard (/)
 * ------------------------------------------------------------------------- */

export interface Kpi {
  id: string;
  label: string;
  value: string;
  /** Period-over-period delta, e.g. "+12.4%". */
  delta: string;
  trend: Trend;
  /** Whether an upward movement is good for this metric. */
  positiveWhenUp: boolean;
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  source: string;
  timestamp: string;
}

export interface ActivityEntry {
  id: string;
  actorId: string;
  action: string;
  target: string;
  timestamp: string;
}

/* ----------------------------------------------------------------------------
 * Projects (/projects)
 * ------------------------------------------------------------------------- */

export interface Milestone {
  id: string;
  name: string;
  due: string;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  health: Health;
  /** 0–100 completion. */
  progress: number;
  ownerId: string;
  memberIds: string[];
  startDate: string;
  targetDate: string;
  budget: number;
  spent: number;
  milestones: Milestone[];
  tags: string[];
}

/* ----------------------------------------------------------------------------
 * Tasks (/tasks)
 * ------------------------------------------------------------------------- */

export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  projectId: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  due: string;
  /** Estimate in hours. */
  estimate: number;
  tags: string[];
}

/* ----------------------------------------------------------------------------
 * Daily reports (/daily-reports)
 * ------------------------------------------------------------------------- */

export interface DailyReport {
  id: string;
  authorId: string;
  date: string;
  completed: string[];
  inProgress: string[];
  blockers: string[];
  tomorrow: string[];
  /** Self-reported mood/energy 1–5. */
  sentiment: number;
}

/* ----------------------------------------------------------------------------
 * Approvals (/approvals)
 * ------------------------------------------------------------------------- */

export type ApprovalKind = "budget" | "hiring" | "exception" | "procurement" | "policy";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Approval {
  id: string;
  title: string;
  kind: ApprovalKind;
  requestedById: string;
  status: ApprovalStatus;
  amount?: number;
  submitted: string;
  dueBy: string;
  priority: Priority;
  summary: string;
}

/* ----------------------------------------------------------------------------
 * AI Intelligence (/ai-intelligence)
 * ------------------------------------------------------------------------- */

export type InsightKind = "risk" | "opportunity" | "synthesis" | "recommendation";

export interface AiInsight {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  /** Model confidence 0–100. */
  confidence: number;
  impact: Priority;
  relatedModule: string;
}

/* ----------------------------------------------------------------------------
 * Navigation
 * ------------------------------------------------------------------------- */

export interface NavItem {
  href: string;
  label: string;
  /** lucide-react icon name resolved in the Sidebar. */
  icon: string;
  description: string;
}
