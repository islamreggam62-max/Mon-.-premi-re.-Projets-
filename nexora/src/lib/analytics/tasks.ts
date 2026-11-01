import { TASK_STATUSES } from "@/types";
import type { ISODate, Task, TaskStatus, ThroughputBar, WeeklyThroughputPoint } from "@/types";
import { addDays, diffInDays, isWithin, startOfWeek } from "@/lib/dates";

export function isOverdue(task: Task, today: ISODate): boolean {
  return task.status !== "done" && diffInDays(today, task.dueDate) < 0;
}

export function isOpen(task: Task): boolean {
  return task.status !== "done";
}

export function countByStatus(tasks: readonly Task[]): Record<TaskStatus, number> {
  const counts = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as Record<
    TaskStatus,
    number
  >;
  for (const task of tasks) counts[task.status] += 1;
  return counts;
}

export function completedWithin(tasks: readonly Task[], from: ISODate, to: ISODate): number {
  return tasks.filter((task) => task.status === "done" && isWithin(task.completedOn, from, to))
    .length;
}

/**
 * Weekly completions: warehouse history for past weeks plus the current week
 * computed from task records, so the chart, the KPI and the task board agree.
 */
export function weeklyThroughput(
  history: readonly WeeklyThroughputPoint[],
  tasks: readonly Task[],
  today: ISODate,
): ThroughputBar[] {
  const currentWeek = startOfWeek(today);
  const past = history
    .filter((point) => diffInDays(point.weekStart, currentWeek) > 0)
    .map((point) => ({ weekStart: point.weekStart, completed: point.completed, isCurrent: false }));
  const current = completedWithin(tasks, currentWeek, addDays(currentWeek, 6));
  return [...past, { weekStart: currentWeek, completed: current, isCurrent: true }];
}
