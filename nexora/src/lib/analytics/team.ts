import type {
  Department,
  DepartmentSummary,
  ISODate,
  Task,
  TeamMember,
  WorkloadBand,
  WorkloadEntry,
} from "@/types";
import { diffInDays } from "@/lib/dates";
import { isOverdue } from "./tasks";

/** Bands: <70 available · 70–90 healthy · 90–100 stretched · >100 overloaded. */
export function workloadBand(utilization: number): WorkloadBand {
  if (utilization > 100) return "overloaded";
  if (utilization >= 90) return "stretched";
  if (utilization >= 70) return "healthy";
  return "available";
}

export function isAway(member: TeamMember, date: ISODate): boolean {
  return (
    member.availability.status === "out-of-office" &&
    diffInDays(date, member.availability.until) >= 0
  );
}

/** Null when the member is away or carries no delivery capacity. */
export function utilization(member: TeamMember, date: ISODate): number | null {
  if (member.weeklyCapacityHours <= 0 || isAway(member, date)) return null;
  return (member.committedHours / member.weeklyCapacityHours) * 100;
}

export function buildWorkload(
  members: readonly TeamMember[],
  tasks: readonly Task[],
  today: ISODate,
): WorkloadEntry[] {
  return members.map((member) => {
    const open = tasks.filter((task) => task.assigneeId === member.id && task.status !== "done");
    const value = utilization(member, today);
    return {
      memberId: member.id,
      utilization: value,
      band: value === null ? null : workloadBand(value),
      openTasks: open.length,
      overdueTasks: open.filter((task) => isOverdue(task, today)).length,
    };
  });
}

export function summarizeDepartments(
  departments: readonly Department[],
  members: readonly TeamMember[],
  workload: readonly WorkloadEntry[],
): DepartmentSummary[] {
  const byMember = new Map(workload.map((entry) => [entry.memberId, entry]));
  return departments.map((department) => {
    const staff = members.filter((member) => member.departmentId === department.id);
    const values = staff
      .map((member) => byMember.get(member.id)?.utilization)
      .filter((value): value is number => typeof value === "number");
    return {
      departmentId: department.id,
      headcount: staff.length,
      averageUtilization:
        values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
      overloaded: values.filter((value) => value > 100).length,
    };
  });
}

export function averageUtilization(workload: readonly WorkloadEntry[]): number | null {
  const values = workload
    .map((entry) => entry.utilization)
    .filter((value): value is number => value !== null);
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
