/**
 * Pure, deterministic derivations over domain data.
 * No data imports: callers pass the records in, so the same functions work on
 * static demo data today and Supabase results in Phase 2.
 */
import { HEALTH_RANK, PRIORITY_RANK, SEVERITY_RANK, URGENCY_RANK } from "@/lib/labels";
import type {
  Approval,
  ApprovalStatus,
  ApprovalUrgency,
  DailyReport,
  Health,
  Person,
  Project,
  ReportBlocker,
  Task,
} from "@/lib/types";
import { daysUntil, percent } from "@/lib/utils";

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

export const WORKLOAD_BAND_LABEL: Record<WorkloadBand, string> = {
  healthy: "Healthy",
  stretched: "Stretched",
  overloaded: "Overloaded",
  unavailable: "Unavailable",
};
