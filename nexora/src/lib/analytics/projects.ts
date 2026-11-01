import type { ISODate, Milestone, MilestoneState, Project } from "@/types";
import { diffInDays } from "@/lib/dates";

/** Window, in days, in which an open milestone counts as "due soon". */
export const MILESTONE_SOON_DAYS = 14;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Initiatives that are still being delivered (risk applies to these). */
export function isInFlight(project: Project): boolean {
  return project.status === "active" || project.status === "planning";
}

/** Share of the planned schedule that has elapsed, 0–100. */
export function scheduleElapsed(project: Project, today: ISODate): number {
  const total = diffInDays(project.startDate, project.targetDate);
  if (total <= 0) return 100;
  return clamp((diffInDays(project.startDate, today) / total) * 100, 0, 100);
}

/** Spent ÷ budget × 100; can exceed 100 when over budget. */
export function budgetBurn(project: Project): number {
  return project.budget.amount > 0 ? (project.spent.amount / project.budget.amount) * 100 : 0;
}

export function milestoneState(milestone: Milestone, today: ISODate): MilestoneState {
  if (milestone.completedOn !== null) return "done";
  const days = diffInDays(today, milestone.dueDate);
  if (days < 0) return "overdue";
  if (days <= MILESTONE_SOON_DAYS) return "due-soon";
  return "upcoming";
}

/** The earliest milestone not yet completed, or null when all are done. */
export function nextMilestone(project: Project): Milestone | null {
  const open = project.milestones
    .filter((milestone) => milestone.completedOn === null)
    .sort((a, b) => diffInDays(b.dueDate, a.dueDate));
  return open[0] ?? null;
}
