/**
 * Pure, deterministic derivations over domain data.
 * No data imports: callers pass the records in, so the same functions work on
 * static demo data today and Supabase results in Phase 2.
 */
import { t } from "@/lib/i18n/core";
import { HEALTH_RANK, PRIORITY_RANK, SEVERITY_RANK, URGENCY_RANK, translated } from "@/lib/labels";
import type {
  Approval,
  ApprovalStatus,
  ApprovalUrgency,
  DailyReport,
  Department,
  DepartmentHealthStatus,
  Health,
  Person,
  Project,
  ReportBlocker,
  SubmissionStatus,
  Task,
} from "@/lib/types";
import { businessDaysBack, daysUntil, percent } from "@/lib/utils";

export function indexById<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

/* ----------------------------------------------------------------------------
 * Daily reports
 * ------------------------------------------------------------------------- */

/** People expected to file a report: opted in and not on leave. */
export function expectedReporters(people: readonly Person[]): Person[] {
  return people.filter((p) => p.reportsDaily && p.status !== "on-leave");
}

export interface ReportPulse {
  date: string;
  expected: Person[];
  submitted: DailyReport[];
  missing: Person[];
  /** Submission rate, 0–100. */
  rate: number;
  blockerCount: number;
  /** Mean energy of submitted reports, or null when none were submitted. */
  avgEnergy: number | null;
}

export function computePulse(
  reports: readonly DailyReport[],
  people: readonly Person[],
  date: string,
): ReportPulse {
  const expected = expectedReporters(people);
  const expectedIds = new Set(expected.map((p) => p.id));
  const submitted = reports.filter((r) => r.date === date && expectedIds.has(r.authorId));
  const submittedIds = new Set(submitted.map((r) => r.authorId));
  const missing = expected.filter((p) => !submittedIds.has(p.id));
  const blockerCount = submitted.reduce((n, r) => n + r.blockers.length, 0);
  const avgEnergy = submitted.length
    ? submitted.reduce((sum, r) => sum + r.energy, 0) / submitted.length
    : null;
  return {
    date,
    expected,
    submitted,
    missing,
    rate: percent(submitted.length, expected.length),
    blockerCount,
    avgEnergy,
  };
}

export interface BlockerEntry {
  blocker: ReportBlocker;
  report: DailyReport;
}

/** Blockers raised in reports for `date`, most severe first. */
export function collectBlockers(reports: readonly DailyReport[], date: string): BlockerEntry[] {
  return reports
    .filter((r) => r.date === date)
    .flatMap((report) => report.blockers.map((blocker) => ({ blocker, report })))
    .sort((a, b) => SEVERITY_RANK[a.blocker.severity] - SEVERITY_RANK[b.blocker.severity]);
}

/* ----------------------------------------------------------------------------
 * Approvals
 * ------------------------------------------------------------------------- */

export const OPEN_APPROVAL_STATUSES: readonly ApprovalStatus[] = [
  "pending",
  "in-review",
  "changes-requested",
];

export function isOpenApproval(status: ApprovalStatus): boolean {
  return OPEN_APPROVAL_STATUSES.includes(status);
}

/** Overdue (past due), due today, due within 3 days, or on schedule. */
export function approvalUrgency(dueBy: string, asOf: string): ApprovalUrgency {
  const d = daysUntil(dueBy, asOf);
  if (d < 0) return "overdue";
  if (d === 0) return "due-today";
  if (d <= 3) return "due-soon";
  return "on-schedule";
}

/** Open approvals ordered by urgency, then due date. */
export function sortOpenApprovals(items: readonly Approval[], asOf: string): Approval[] {
  return [...items].sort((a, b) => {
    const u = URGENCY_RANK[approvalUrgency(a.dueBy, asOf)] - URGENCY_RANK[approvalUrgency(b.dueBy, asOf)];
    return u !== 0 ? u : daysUntil(a.dueBy, asOf) - daysUntil(b.dueBy, asOf);
  });
}

/* ----------------------------------------------------------------------------
 * Projects & tasks
 * ------------------------------------------------------------------------- */

export function healthCounts(projects: readonly Project[]): Record<Health, number> {
  const counts: Record<Health, number> = { "on-track": 0, "at-risk": 0, delayed: 0 };
  for (const p of projects) counts[p.health] += 1;
  return counts;
}

/** Riskiest first, then nearest deadline. */
export function sortByRisk(projects: readonly Project[]): Project[] {
  return [...projects].sort(
    (a, b) =>
      HEALTH_RANK[a.health] - HEALTH_RANK[b.health] ||
      a.targetDate.localeCompare(b.targetDate),
  );
}

export function nextMilestone(project: Project) {
  return [...project.milestones]
    .filter((m) => !m.done)
    .sort((a, b) => a.due.localeCompare(b.due))[0];
}

export function isTaskOverdue(task: Task, asOf: string): boolean {
  return task.status !== "done" && daysUntil(task.due, asOf) < 0;
}

export function comparePriority(a: Task, b: Task): number {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}

/* ----------------------------------------------------------------------------
 * People
 * ------------------------------------------------------------------------- */

export type WorkloadBand = "healthy" | "stretched" | "overloaded" | "unavailable";

export function workloadBand(person: Person): WorkloadBand {
  if (person.status === "on-leave") return "unavailable";
  if (person.workload >= 90) return "overloaded";
  if (person.workload >= 75) return "stretched";
  return "healthy";
}

export const WORKLOAD_BAND_LABEL: Record<WorkloadBand, string> = translated({
  healthy: "Healthy",
  stretched: "Stretched",
  overloaded: "Overloaded",
  unavailable: "Unavailable",
});

/* ----------------------------------------------------------------------------
 * Daily report compliance
 * ------------------------------------------------------------------------- */

/** Submission dates per person: earlier history plus the dates of full reports. */
export function submissionLog(
  reports: readonly DailyReport[],
  history: Readonly<Record<string, readonly string[]>>,
): Record<string, Set<string>> {
  const log: Record<string, Set<string>> = {};
  for (const [personId, dates] of Object.entries(history)) log[personId] = new Set(dates);
  for (const r of reports) (log[r.authorId] ??= new Set()).add(r.date);
  return log;
}

export interface ComplianceDay {
  date: string;
  status: SubmissionStatus;
}

export interface Compliance {
  /** Whether the person is expected to report (opted in, not on leave). */
  expected: boolean;
  submittedToday: boolean;
  /**
   * Consecutive business days with a report. Counts from today when today's
   * report is in; otherwise from the previous business day (today still open).
   */
  streak: number;
  /** Share of the window's business days with a report, 0–100. */
  rate: number;
  /** Window, oldest first. */
  days: ComplianceDay[];
}

export function computeCompliance(
  person: Person,
  log: Record<string, Set<string>>,
  asOf: string,
  window = 10,
): Compliance {
  const expected = person.reportsDaily && person.status !== "on-leave";
  const dates = log[person.id] ?? new Set<string>();
  const windowDays = businessDaysBack(asOf, window); // newest first

  if (!expected) {
    return {
      expected,
      submittedToday: false,
      streak: 0,
      rate: 0,
      days: [...windowDays].reverse().map((date) => ({ date, status: "excused" })),
    };
  }

  const submittedToday = dates.has(asOf);
  const run = submittedToday ? windowDays : windowDays.slice(1);
  let streak = 0;
  for (const d of run) {
    if (!dates.has(d)) break;
    streak += 1;
  }
  const submittedCount = windowDays.filter((d) => dates.has(d)).length;

  return {
    expected,
    submittedToday,
    streak,
    rate: percent(submittedCount, windowDays.length),
    days: [...windowDays]
      .reverse()
      .map((date) => ({ date, status: dates.has(date) ? "submitted" : "missing" })),
  };
}

/* ----------------------------------------------------------------------------
 * Department health
 * ------------------------------------------------------------------------- */

export interface DepartmentHealthRow {
  department: Department;
  headcount: number;
  /** Mean workload of members not on leave, 0–100 (null when nobody is available). */
  avgWorkload: number | null;
  /** Today's submission rate among expected reporters (null when nobody is expected). */
  reportRate: number | null;
  projects: Project[];
  status: DepartmentHealthStatus;
  reasons: string[];
}

/**
 * Rules (documented so the status is explainable):
 * - critical: a department-owned project is Delayed, or average workload ≥ 90%
 * - watch: a project is At Risk, average workload ≥ 80%, or today's report rate < 70%
 * - healthy: otherwise
 */
export function departmentHealth(
  people: readonly Person[],
  projects: readonly Project[],
  reports: readonly DailyReport[],
  asOf: string,
  order: readonly Department[],
): DepartmentHealthRow[] {
  return order
    .map((department) => {
      const members = people.filter((p) => p.department === department);
      const available = members.filter((p) => p.status !== "on-leave");
      const avgWorkload = available.length
        ? Math.round(available.reduce((s, p) => s + p.workload, 0) / available.length)
        : null;
      const expected = expectedReporters(members);
      const submitted = expected.filter((p) => reports.some((r) => r.date === asOf && r.authorId === p.id));
      const reportRate = expected.length ? percent(submitted.length, expected.length) : null;
      const owned = projects.filter((p) => p.department === department);

      const reasons: string[] = [];
      let status: DepartmentHealthStatus = "healthy";
      const delayed = owned.filter((p) => p.health === "delayed");
      const atRisk = owned.filter((p) => p.health === "at-risk");
      if (delayed.length) reasons.push(t("{codes} delayed", { codes: delayed.map((p) => p.code).join(", ") }));
      if (avgWorkload !== null && avgWorkload >= 90) reasons.push(t("workload {n}%", { n: avgWorkload }));
      if (reasons.length) status = "critical";

      if (status !== "critical") {
        if (atRisk.length) reasons.push(t("{codes} at risk", { codes: atRisk.map((p) => p.code).join(", ") }));
        if (avgWorkload !== null && avgWorkload >= 80) reasons.push(t("workload {n}%", { n: avgWorkload }));
        if (reportRate !== null && reportRate < 70) reasons.push(t("reports {n}%", { n: reportRate }));
        if (reasons.length) status = "watch";
      }

      return { department, headcount: members.length, avgWorkload, reportRate, projects: owned, status, reasons };
    })
    .filter((row) => row.headcount > 0);
}

/* ----------------------------------------------------------------------------
 * KPIs
 * ------------------------------------------------------------------------- */

/** Operational velocity: share of open tasks that are on schedule (not overdue, not blocked). */
export function operationalVelocity(tasks: readonly Task[], asOf: string): number {
  const open = tasks.filter((t) => t.status !== "done");
  const onSchedule = open.filter((t) => t.status !== "blocked" && !isTaskOverdue(t, asOf));
  return percent(onSchedule.length, open.length);
}

/** Signed delta with a unit, e.g. "+10 pts", "-2", "0". */
export function formatDelta(current: number, previous: number, unit = ""): string {
  const d = current - previous;
  const sign = d > 0 ? "+" : d < 0 ? "−" : "";
  return `${sign}${Math.abs(d)}${unit}`;
}

export function trendOf(current: number, previous: number): "up" | "down" | "flat" {
  return current > previous ? "up" : current < previous ? "down" : "flat";
}

/* ----------------------------------------------------------------------------
 * Risk radar
 * ------------------------------------------------------------------------- */

export type RiskLevel = "high" | "elevated" | "moderate" | "low";

export function riskLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 50) return "elevated";
  if (score >= 30) return "moderate";
  return "low";
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  high: "High",
  elevated: "Elevated",
  moderate: "Moderate",
  low: "Low",
};
