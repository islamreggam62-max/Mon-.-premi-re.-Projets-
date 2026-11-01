import type {
  DepartmentId,
  HealthStatus,
  ISODate,
  MemberId,
  MilestoneId,
  Money,
  Priority,
  ProjectId,
} from "./common";

export const PROJECT_STATUSES = ["planning", "active", "on-hold", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/**
 * A dated checkpoint. Its state (done, overdue, due soon, upcoming) is derived
 * from `dueDate` and `completedOn` rather than stored, so it can never drift
 * out of sync with the calendar.
 */
export interface Milestone {
  readonly id: MilestoneId;
  readonly title: string;
  readonly dueDate: ISODate;
  readonly completedOn: ISODate | null;
}

export interface Project {
  readonly id: ProjectId;
  /** Short portfolio code, e.g. `ATLAS`. */
  readonly code: string;
  readonly name: string;
  readonly summary: string;
  readonly ownerId: MemberId;
  readonly departmentId: DepartmentId;
  readonly status: ProjectStatus;
  /**
   * Red/amber/green status as last reported by the project owner. NEXORA
   * computes an independent signal-based risk view and flags disagreements.
   */
  readonly reportedHealth: HealthStatus;
  readonly priority: Priority;
  readonly startDate: ISODate;
  readonly targetDate: ISODate;
  readonly completedOn: ISODate | null;
  /** Percent complete (0–100) from the owner's latest status update. */
  readonly progress: number;
  readonly budget: Money;
  readonly spent: Money;
  readonly memberIds: readonly MemberId[];
  readonly milestones: readonly Milestone[];
}
