import type { ISODate, MemberId, Priority, ProjectId, TaskId } from "./common";

export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "blocked",
  "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

interface TaskBase {
  readonly id: TaskId;
  /** Human-facing key, e.g. `NX-1101`. */
  readonly key: string;
  readonly title: string;
  readonly projectId: ProjectId;
  readonly assigneeId: MemberId;
  readonly priority: Priority;
  readonly dueDate: ISODate;
  readonly estimateHours: number;
}

export interface OpenTask extends TaskBase {
  readonly status: "backlog" | "todo" | "in-progress" | "in-review";
}

/** A blocked task must say why; the reason feeds escalation and risk views. */
export interface BlockedTask extends TaskBase {
  readonly status: "blocked";
  readonly blockedReason: string;
}

export interface CompletedTask extends TaskBase {
  readonly status: "done";
  readonly completedOn: ISODate;
}

export type Task = OpenTask | BlockedTask | CompletedTask;
