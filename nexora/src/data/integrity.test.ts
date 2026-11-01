import { describe, expect, it } from "vitest";
import { toDayNumber, zonedDateTime } from "@/lib/dates";
import { approvals } from "./approvals";
import { dailyReports } from "./daily-reports";
import { reportingComplianceHistory, weeklyThroughputHistory } from "./metrics";
import { projects } from "./projects";
import { notificationRules, permissions, roles } from "./settings";
import { tasks } from "./tasks";
import { departments, members } from "./team";
import { workspace } from "./workspace";

/**
 * The query layer throws on unknown references at render time; these tests
 * catch a broken demo dataset before it ever reaches a page.
 */
const memberIds = new Set(members.map((member) => member.id));
const departmentIds = new Set(departments.map((department) => department.id));
const projectIds = new Set(projects.map((project) => project.id));
const taskIds = new Set(tasks.map((task) => task.id));
const today = toDayNumber(workspace.today);

const unique = (values: readonly string[]) => new Set(values).size === values.length;

describe("demo data integrity", () => {
  it("uses unique identifiers and keys", () => {
    expect(unique(members.map((member) => member.id))).toBe(true);
    expect(unique(members.map((member) => member.email))).toBe(true);
    expect(unique(departments.map((department) => department.code))).toBe(true);
    expect(unique(projects.map((project) => project.code))).toBe(true);
    expect(unique(projects.flatMap((project) => project.milestones.map((milestone) => milestone.id)))).toBe(true);
    expect(unique(tasks.map((task) => task.id))).toBe(true);
    expect(unique(tasks.map((task) => task.key))).toBe(true);
    expect(unique(approvals.map((request) => request.reference))).toBe(true);
    expect(unique(notificationRules.map((rule) => rule.id))).toBe(true);
  });

  it("resolves every member, department, project and task reference", () => {
    expect(memberIds.has(workspace.currentUserId)).toBe(true);
    for (const department of departments) {
      const head = members.find((member) => member.id === department.headId);
      expect(head?.departmentId, `${department.id} head`).toBe(department.id);
    }
    for (const member of members) {
      expect(departmentIds.has(member.departmentId)).toBe(true);
      if (member.managerId) expect(memberIds.has(member.managerId), member.id).toBe(true);
    }
    for (const project of projects) {
      expect(memberIds.has(project.ownerId)).toBe(true);
      expect(departmentIds.has(project.departmentId)).toBe(true);
      for (const id of project.memberIds) expect(memberIds.has(id), `${project.id}/${id}`).toBe(true);
    }
    for (const task of tasks) {
      expect(projectIds.has(task.projectId), task.key).toBe(true);
      expect(memberIds.has(task.assigneeId), task.key).toBe(true);
    }
    for (const report of dailyReports) {
      expect(memberIds.has(report.memberId)).toBe(true);
      const lines = [...report.completed, ...report.inProgress, ...report.blockers, ...report.tomorrowPlan];
      for (const line of lines) if (line.taskId) expect(taskIds.has(line.taskId), report.id).toBe(true);
      for (const blocker of report.blockers) {
        if (blocker.needsHelpFromId) expect(memberIds.has(blocker.needsHelpFromId)).toBe(true);
      }
    }
    for (const request of approvals) {
      expect(memberIds.has(request.requesterId)).toBe(true);
      expect(memberIds.has(request.approverId)).toBe(true);
      expect(departmentIds.has(request.departmentId)).toBe(true);
      if (request.projectId) expect(projectIds.has(request.projectId)).toBe(true);
      if (request.decision.status !== "pending") {
        expect(request.decision.decidedById, request.reference).toBe(request.approverId);
      }
    }
  });

  it("keeps dates coherent with the reference date", () => {
    for (const project of projects) {
      expect(toDayNumber(project.startDate)).toBeLessThan(toDayNumber(project.targetDate));
      expect(project.progress).toBeGreaterThanOrEqual(0);
      expect(project.progress).toBeLessThanOrEqual(100);
      for (const milestone of project.milestones) {
        if (milestone.completedOn) expect(toDayNumber(milestone.completedOn)).toBeLessThanOrEqual(today);
      }
      if (project.status === "completed") expect(project.completedOn).not.toBeNull();
    }
    for (const task of tasks) {
      if (task.status === "done") expect(toDayNumber(task.completedOn), task.key).toBeLessThanOrEqual(today);
    }
    for (const report of dailyReports) {
      expect(zonedDateTime(report.submittedAt, workspace.timeZone).date).toBe(report.date);
      expect(Date.parse(report.submittedAt)).toBeLessThanOrEqual(Date.parse(workspace.asOf));
    }
    for (const point of [...weeklyThroughputHistory.map((p) => p.weekStart), ...reportingComplianceHistory.map((p) => p.date)]) {
      expect(toDayNumber(point)).toBeLessThan(today);
    }
    for (const point of reportingComplianceHistory) {
      expect(point.onTime).toBeLessThanOrEqual(point.submitted);
      expect(point.submitted).toBeLessThanOrEqual(point.expected);
    }
  });

  it("defines a grant for every role on every permission", () => {
    const roleKeys = roles.map((role) => role.key);
    for (const permission of permissions) {
      expect(Object.keys(permission.grants).sort()).toEqual([...roleKeys].sort());
      for (const grant of Object.values(permission.grants)) {
        expect(grant.level === "limited", permission.id).toBe(grant.scope !== null);
      }
    }
  });
});
