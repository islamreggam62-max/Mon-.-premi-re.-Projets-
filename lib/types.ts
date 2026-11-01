/**
 * NEXORA domain model (Phase 1).
 *
 * Every entity the UI renders is typed here. Today the static demo data layer
 * in lib/data/ satisfies these interfaces; in Phase 2 the same shapes will be
 * read from Supabase, so UI components never depend on where data comes from.
 */

/** Calendar date, "YYYY-MM-DD". */
export type ISODate = string;
/** UTC timestamp, "YYYY-MM-DDTHH:mm:ssZ". */
export type ISODateTime = string;

/* ----------------------------------------------------------------------------
 * Shared
 * ------------------------------------------------------------------------- */

export type Health = "on-track" | "at-risk" | "delayed";
export type Priority = "low" | "medium" | "high" | "critical";
export type Severity = "low" | "medium" | "high";
export type Trend = "up" | "down" | "flat";

/* ----------------------------------------------------------------------------
 * Workspace & people
 * ------------------------------------------------------------------------- */

export interface Workspace {
  id: string;
  name: string;
  plan: string;
  region: string;
  current: boolean;
  /** False for workspaces shown only as a preview of multi-workspace support. */
  available: boolean;
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

export type PresenceStatus = "active" | "away" | "offline" | "on-leave";
export type AccessRole = "owner" | "admin" | "manager" | "member" | "viewer";

export interface Person {
  id: string;
  name: string;
  initials: string;
  /** Job title, e.g. "VP of Engineering". */
  title: string;
  department: Department;
  email: string;
  location: string;
  joined: ISODate;
  /** Current utilization, 0–100. */
  workload: number;
  status: PresenceStatus;
  /** Workspace permission role (RBAC). */
  accessRole: AccessRole;
  /** Whether this person is expected to file an end-of-day report. */
  reportsDaily: boolean;
}

/* ----------------------------------------------------------------------------
 * Dashboard
 * ------------------------------------------------------------------------- */

export interface Kpi {
  id: string;
  label: string;
  value: string;
  /** Period-over-period delta, e.g. "+8.2%". */
  delta: string;
  trend: Trend;
  /** Whether an upward movement is good for this metric. */
  positiveWhenUp: boolean;
  /** Comparison basis, e.g. "vs. September". */
  hint: string;
}

export type NotificationTone = "critical" | "warning" | "info";

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  time: ISODateTime;
  tone: NotificationTone;
  href: string;
}

/* ----------------------------------------------------------------------------
 * Projects
 * ------------------------------------------------------------------------- */

export interface Milestone {
  id: string;
  name: string;
  due: ISODate;
  done: boolean;
}

export interface Project {
  id: string;
  /** Short code, e.g. "ATL". */
  code: string;
  name: string;
  summary: string;
  health: Health;
  /** Completion, 0–100. */
  progress: number;
  ownerId: string;
  memberIds: string[];
  department: Department;
  startDate: ISODate;
  targetDate: ISODate;
  budget: number;
  spent: number;
  milestones: Milestone[];
  tags: string[];
}

/* ----------------------------------------------------------------------------
 * Tasks
 * ------------------------------------------------------------------------- */

export type TaskStatus = "todo" | "in-progress" | "in-review" | "blocked" | "done";

export interface Task {
  id: string;
  /** Human-readable key, e.g. "NEX-101". */
  key: string;
  title: string;
  projectId: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  due: ISODate;
  estimateHours: number;
  tags: string[];
}

/* ----------------------------------------------------------------------------
 * Daily reports
 * ------------------------------------------------------------------------- */

export interface ReportBlocker {
  id: string;
  description: string;
  /** Who or what the author is waiting on. */
  waitingOn: string;
  severity: Severity;
}

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface DailyReport {
  id: string;
  authorId: string;
  date: ISODate;
  submittedAt: ISODateTime;
  completed: string[];
  inProgress: string[];
  blockers: ReportBlocker[];
  tomorrow: string[];
  /** Self-reported energy, 1–5. */
  energy: EnergyLevel;
}

/* ----------------------------------------------------------------------------
 * Approvals
 * ------------------------------------------------------------------------- */

export type ApprovalKind = "budget" | "hiring" | "deliverable";

export type ApprovalStatus =
  | "pending"
  | "in-review"
  | "changes-requested"
  | "approved"
  | "rejected";

/** Derived from the due date relative to the demo reference day. */
export type ApprovalUrgency = "overdue" | "due-today" | "due-soon" | "on-schedule";

export interface Approval {
  id: string;
  title: string;
  kind: ApprovalKind;
  requestedById: string;
  approverId: string;
  status: ApprovalStatus;
  /** Budget requests: amount in USD. */
  amount?: number;
  /** Hiring requests: number of roles. */
  headcount?: number;
  projectId?: string;
  submitted: ISODate;
  dueBy: ISODate;
  summary: string;
  decidedAt?: ISODate;
  decisionNote?: string;
}

/* ----------------------------------------------------------------------------
 * AI Intelligence — static previews only in Phase 1
 * ------------------------------------------------------------------------- */

export type InsightKind = "risk" | "opportunity" | "recommendation";

export interface AiInsightPreview {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  impact: Priority;
  /** Demo data points the insight is written from. */
  evidence: string[];
  module: string;
  href: string;
}

export interface ReportSummaryPreview {
  id: string;
  date: ISODate;
  headline: string;
  highlights: string[];
  watchItems: string[];
}

export interface BottleneckPreview {
  id: string;
  title: string;
  area: string;
  severity: Priority;
  signal: string;
  detail: string;
  affectedIds: string[];
  suggestedAction: string;
}

/* ----------------------------------------------------------------------------
 * Settings
 * ------------------------------------------------------------------------- */

export type PermissionLevel = "full" | "edit" | "view" | "none";

export interface RoleDefinition {
  id: AccessRole;
  label: string;
  description: string;
}

export interface PermissionRow {
  module: string;
  levels: Record<AccessRole, PermissionLevel>;
}

export interface OrganizationProfile {
  legalName: string;
  displayName: string;
  industry: string;
  size: string;
  headquarters: string;
  website: string;
  fiscalYearStart: string;
  timezone: string;
  locale: string;
  currency: string;
}

export interface SecurityControl {
  id: string;
  label: string;
  description: string;
  phase: "Phase 2" | "Phase 3";
}

/* ----------------------------------------------------------------------------
 * Navigation
 * ------------------------------------------------------------------------- */

export type NavIcon =
  | "dashboard"
  | "team"
  | "projects"
  | "tasks"
  | "reports"
  | "approvals"
  | "ai"
  | "settings";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  description: string;
}
