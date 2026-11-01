import type { DailyReportId, ISODate, ISODateTime, MemberId, TaskId } from "./common";

/** One line of a structured check-in, optionally linked to a task. */
export interface ReportEntry {
  readonly text: string;
  readonly taskId: TaskId | null;
}

export const BLOCKER_SEVERITIES = ["high", "medium", "low"] as const;
export type BlockerSeverity = (typeof BLOCKER_SEVERITIES)[number];

export interface ReportBlocker extends ReportEntry {
  readonly severity: BlockerSeverity;
  /** Who can unblock it, when the author knows. */
  readonly needsHelpFromId: MemberId | null;
}

/** End-of-day check-in: Completed, In Progress, Blockers, Tomorrow's Plan. */
export interface DailyReport {
  readonly id: DailyReportId;
  readonly memberId: MemberId;
  readonly date: ISODate;
  readonly submittedAt: ISODateTime;
  readonly completed: readonly ReportEntry[];
  readonly inProgress: readonly ReportEntry[];
  readonly blockers: readonly ReportBlocker[];
  readonly tomorrowPlan: readonly ReportEntry[];
  readonly hoursLogged: number;
}

export const SUBMISSION_STATUSES = ["on-time", "late", "missing"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
