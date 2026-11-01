import "server-only";

import type {
  ApprovalRequest,
  Availability,
  BlockerSeverity,
  DailyReportPolicy,
  DepartmentId,
  ExecutiveBriefing,
  Insight,
  Integration,
  ISODate,
  ISODateTime,
  Kpi,
  MemberId,
  Milestone,
  MilestoneState,
  Money,
  NotificationRule,
  Permission,
  Priority,
  Project,
  ProjectId,
  ProjectRiskAssessment,
  ProjectStatus,
  RoleDefinition,
  RoleKey,
  SecurityPolicy,
  SlaState,
  SubmissionStatus,
  Task,
  TaskId,
  ThroughputBar,
  Workspace,
  WorkloadBand,
} from "@/types";
import { approvals } from "@/data/approvals";
import { dailyReports } from "@/data/daily-reports";
import { reportingComplianceHistory, weeklyThroughputHistory } from "@/data/metrics";
import { projects } from "@/data/projects";
import {
  integrations,
  notificationRules,
  permissions,
  roles,
  securityPolicy,
} from "@/data/settings";
import { tasks } from "@/data/tasks";
import { departments, members } from "@/data/team";
import { dailyReportPolicy, workspace } from "@/data/workspace";
import { compareByUrgency, isPending, slaState } from "@/lib/analytics/approvals";
import { buildBriefing } from "@/lib/analytics/briefing";
import { deriveInsights } from "@/lib/analytics/insights";
import { buildKpis } from "@/lib/analytics/kpis";
import {
  budgetBurn,
  isInFlight,
  milestoneState,
  nextMilestone,
  scheduleElapsed,
} from "@/lib/analytics/projects";
import { submissionStatus } from "@/lib/analytics/reports";
import { buildSnapshot } from "@/lib/analytics/snapshot";
import { isOverdue } from "@/lib/analytics/tasks";
import { averageUtilization, summarizeDepartments } from "@/lib/analytics/team";
import { diffInDays } from "@/lib/dates";
import { initials } from "@/lib/format";

/**
 * Read model for the UI — the one seam between the static demo data layer and
 * the views. Pages call these functions and pass plain, serializable view
 * models to components; no component imports `@/data` directly.
 *
 * Phase 2 swaps the `@/data` imports for a real data source here, without
 * touching the analytics or the UI.
 */

const snapshot = buildSnapshot({
  today: workspace.today,
  timeZone: workspace.timeZone,
  currency: workspace.currency,
  departments,
  members,
  projects,
  tasks,
  reports: dailyReports,
  approvals,
  reportPolicy: dailyReportPolicy,
  throughputHistory: weeklyThroughputHistory,
  complianceHistory: reportingComplianceHistory,
});

// ------------------------------------------------------------------ Lookups

const memberById = new Map(members.map((member) => [member.id, member]));
const departmentById = new Map(departments.map((department) => [department.id, department]));
const projectById = new Map(projects.map((project) => [project.id, project]));
const taskById = new Map(tasks.map((task) => [task.id, task]));
const workloadByMember = new Map(snapshot.workload.map((entry) => [entry.memberId, entry]));
const riskByProject = new Map(snapshot.risks.map((risk) => [risk.projectId, risk]));

function required<K, V>(map: ReadonlyMap<K, V>, key: K, kind: string): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Unknown ${kind}: ${String(key)}`);
  return value;
}

// ------------------------------------------------------------------ Shared view models

export interface MemberRef {
  readonly id: MemberId;
  readonly name: string;
  readonly initials: string;
  readonly title: string;
}

export interface ProjectRef {
  readonly id: ProjectId;
  readonly code: string;
  readonly name: string;
}

function memberRef(id: MemberId): MemberRef {
  const member = required(memberById, id, "member");
  return { id, name: member.name, initials: initials(member.name), title: member.title };
}

function projectRef(id: ProjectId): ProjectRef {
  const project = required(projectById, id, "project");
  return { id, code: project.code, name: project.name };
}

export interface MilestoneRow extends Milestone {
  readonly state: MilestoneState;
  readonly project: ProjectRef;
}

export interface ProjectRow {
  readonly id: ProjectId;
  readonly code: string;
  readonly name: string;
  readonly summary: string;
  readonly owner: MemberRef;
  readonly department: { readonly id: DepartmentId; readonly code: string; readonly name: string };
  readonly status: ProjectStatus;
  readonly priority: Priority;
  readonly progress: number;
  readonly scheduleElapsed: number;
  readonly budget: Money;
  readonly spent: Money;
  readonly budgetBurn: number;
  readonly startDate: ISODate;
  readonly targetDate: ISODate;
  readonly completedOn: ISODate | null;
  /** Null for initiatives no longer in flight (completed or on hold). */
  readonly risk: ProjectRiskAssessment | null;
  readonly reportedHealth: Project["reportedHealth"];
  readonly milestones: readonly MilestoneRow[];
  readonly nextMilestone: MilestoneRow | null;
  readonly team: readonly MemberRef[];
  readonly openTasks: number;
  readonly overdueTasks: number;
}

function projectRow(project: Project): ProjectRow {
  const department = required(departmentById, project.departmentId, "department");
  const ref = { id: project.id, code: project.code, name: project.name };
  const milestones = project.milestones.map((milestone) => ({
    ...milestone,
    state: milestoneState(milestone, workspace.today),
    project: ref,
  }));
  const next = nextMilestone(project);
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    summary: project.summary,
    owner: memberRef(project.ownerId),
    department: { id: department.id, code: department.code, name: department.name },
    status: project.status,
    priority: project.priority,
    progress: project.progress,
    scheduleElapsed: scheduleElapsed(project, workspace.today),
    budget: project.budget,
    spent: project.spent,
    budgetBurn: budgetBurn(project),
    startDate: project.startDate,
    targetDate: project.targetDate,
    completedOn: project.completedOn,
    risk: riskByProject.get(project.id) ?? null,
    reportedHealth: project.reportedHealth,
    milestones,
    nextMilestone: next ? (milestones.find((milestone) => milestone.id === next.id) ?? null) : null,
    team: project.memberIds.map(memberRef),
    openTasks: projectTasks.filter((task) => task.status !== "done").length,
    overdueTasks: projectTasks.filter((task) => isOverdue(task, workspace.today)).length,
  };
}

/** In-flight first, highest risk first; completed initiatives last. */
function compareProjectRows(a: ProjectRow, b: ProjectRow): number {
  const flight = Number(b.risk !== null) - Number(a.risk !== null);
  if (flight !== 0) return flight;
  return (b.risk?.score ?? 0) - (a.risk?.score ?? 0);
}

export interface WorkloadRow {
  readonly member: MemberRef;
  readonly department: { readonly id: DepartmentId; readonly code: string; readonly name: string };
  readonly availability: Availability;
  readonly utilization: number | null;
  readonly band: WorkloadBand | null;
  readonly committedHours: number;
  readonly capacityHours: number;
  readonly openTasks: number;
  readonly overdueTasks: number;
}

function workloadRow(id: MemberId): WorkloadRow {
  const member = required(memberById, id, "member");
  const department = required(departmentById, member.departmentId, "department");
  const entry = required(workloadByMember, id, "workload entry");
  return {
    member: memberRef(id),
    department: { id: department.id, code: department.code, name: department.name },
    availability: member.availability,
    utilization: entry.utilization,
    band: entry.band,
    committedHours: member.committedHours,
    capacityHours: member.weeklyCapacityHours,
    openTasks: entry.openTasks,
    overdueTasks: entry.overdueTasks,
  };
}

export interface ApprovalRow {
  readonly request: ApprovalRequest;
  readonly requester: MemberRef;
  readonly approver: MemberRef;
  readonly department: string;
  readonly project: ProjectRef | null;
  readonly sla: SlaState | null;
  readonly decidedBy: MemberRef | null;
}

function approvalRow(request: ApprovalRequest): ApprovalRow {
  return {
    request,
    requester: memberRef(request.requesterId),
    approver: memberRef(request.approverId),
    department: required(departmentById, request.departmentId, "department").name,
    project: request.projectId ? projectRef(request.projectId) : null,
    sla: slaState(request, workspace.today),
    decidedBy: request.decision.status === "pending" ? null : memberRef(request.decision.decidedById),
  };
}

export interface ContextView {
  readonly today: ISODate;
  readonly asOf: ISODateTime;
  readonly timeZone: string;
}

const context: ContextView = {
  today: workspace.today,
  asOf: workspace.asOf,
  timeZone: workspace.timeZone,
};

// ------------------------------------------------------------------ Shell

export interface ShellView extends ContextView {
  readonly workspaceName: string;
  readonly plan: string;
  readonly currentUser: MemberRef;
  /** Items awaiting the signed-in user, per module. */
  readonly badges: { readonly approvals: number };
}

export function getShellView(): ShellView {
  return {
    ...context,
    workspaceName: workspace.name,
    plan: workspace.plan,
    currentUser: memberRef(workspace.currentUserId),
    badges: {
      approvals: approvals.filter(
        (request) => isPending(request) && request.approverId === workspace.currentUserId,
      ).length,
    },
  };
}

// ------------------------------------------------------------------ Dashboard

export interface DashboardView extends ContextView {
  readonly firstName: string;
  readonly kpis: readonly Kpi[];
  readonly projects: readonly ProjectRow[];
  readonly alerts: readonly Insight[];
  readonly throughput: readonly ThroughputBar[];
  readonly myApprovals: readonly ApprovalRow[];
  readonly myApprovalsTotal: number;
  readonly capacity: readonly WorkloadRow[];
  readonly milestones: readonly MilestoneRow[];
  readonly briefing: ExecutiveBriefing;
}

/** Milestone horizon shown on the dashboard, in days. */
const DASHBOARD_MILESTONE_HORIZON = 21;

export function getDashboardView(): DashboardView {
  const insights = deriveInsights(snapshot);
  const mine = approvals
    .filter((request) => isPending(request) && request.approverId === workspace.currentUserId)
    .sort(compareByUrgency);
  const inFlight = projects.filter(isInFlight).map(projectRow).sort(compareProjectRows);
  const milestones = inFlight
    .flatMap((project) => project.milestones)
    .filter(
      (milestone) =>
        milestone.state === "overdue" ||
        (milestone.state !== "done" &&
          diffInDays(workspace.today, milestone.dueDate) <= DASHBOARD_MILESTONE_HORIZON),
    )
    .sort((a, b) => diffInDays(b.dueDate, a.dueDate));
  const capacity = snapshot.workload
    .filter((entry) => entry.utilization !== null)
    .sort((a, b) => (b.utilization ?? 0) - (a.utilization ?? 0))
    .slice(0, 5)
    .map((entry) => workloadRow(entry.memberId));

  return {
    ...context,
    firstName: required(memberById, workspace.currentUserId, "member").name.split(" ")[0] ?? "",
    kpis: buildKpis(snapshot),
    projects: inFlight,
    alerts: insights
      .filter((insight) => insight.severity === "critical" || insight.severity === "warning")
      .slice(0, 5),
    throughput: snapshot.throughput,
    myApprovals: mine.slice(0, 3).map(approvalRow),
    myApprovalsTotal: mine.length,
    capacity,
    milestones,
    briefing: buildBriefing(snapshot),
  };
}

// ------------------------------------------------------------------ Team

export interface DepartmentRow {
  readonly id: DepartmentId;
  readonly name: string;
  readonly code: string;
  readonly mission: string;
  readonly head: MemberRef;
  readonly headcount: number;
  readonly averageUtilization: number | null;
  readonly overloaded: number;
}

export interface MemberRow extends WorkloadRow {
  readonly email: string;
  readonly role: RoleKey;
  readonly manager: MemberRef | null;
  readonly location: string;
  readonly timeZone: string;
}

export interface TeamView extends ContextView {
  readonly departments: readonly DepartmentRow[];
  readonly members: readonly MemberRow[];
  readonly stats: {
    readonly headcount: number;
    readonly departments: number;
    readonly averageUtilization: number | null;
    readonly overloaded: number;
    readonly away: number;
  };
}

export function getTeamView(): TeamView {
  const summaries = summarizeDepartments(departments, members, snapshot.workload);
  return {
    ...context,
    departments: departments.map((department) => {
      const summary = summaries.find((candidate) => candidate.departmentId === department.id);
      return {
        id: department.id,
        name: department.name,
        code: department.code,
        mission: department.mission,
        head: memberRef(department.headId),
        headcount: summary?.headcount ?? 0,
        averageUtilization: summary?.averageUtilization ?? null,
        overloaded: summary?.overloaded ?? 0,
      };
    }),
    members: members.map((member) => ({
      ...workloadRow(member.id),
      email: member.email,
      role: member.role,
      manager: member.managerId ? memberRef(member.managerId) : null,
      location: member.location,
      timeZone: member.timeZone,
    })),
    stats: {
      headcount: members.length,
      departments: departments.length,
      averageUtilization: averageUtilization(snapshot.workload),
      overloaded: snapshot.workload.filter((entry) => entry.band === "overloaded").length,
      away: snapshot.workload.filter(
        (entry) =>
          entry.utilization === null &&
          required(memberById, entry.memberId, "member").availability.status === "out-of-office",
      ).length,
    },
  };
}

// ------------------------------------------------------------------ Projects

export interface ProjectsView extends ContextView {
  readonly projects: readonly ProjectRow[];
  readonly upcomingMilestones: readonly MilestoneRow[];
  readonly stats: {
    readonly inFlight: number;
    readonly completed: number;
    readonly offTrack: number;
    readonly atRisk: number;
    readonly budget: Money;
    readonly spent: Money;
  };
}

export function getProjectsView(): ProjectsView {
  const rows = projects.map(projectRow).sort(compareProjectRows);
  const inFlight = rows.filter((row) => row.risk !== null);
  const usd = (pick: (row: ProjectRow) => Money): Money => ({
    amount: inFlight
      .map(pick)
      .filter((money) => money.currency === workspace.currency)
      .reduce((total, money) => total + money.amount, 0),
    currency: workspace.currency,
  });
  return {
    ...context,
    projects: rows,
    upcomingMilestones: inFlight
      .flatMap((row) => row.milestones)
      .filter((milestone) => milestone.state !== "done")
      .sort((a, b) => diffInDays(b.dueDate, a.dueDate)),
    stats: {
      inFlight: inFlight.length,
      completed: rows.filter((row) => row.status === "completed").length,
      offTrack: inFlight.filter((row) => row.risk?.signalHealth === "off-track").length,
      atRisk: inFlight.filter((row) => row.risk?.signalHealth === "at-risk").length,
      budget: usd((row) => row.budget),
      spent: usd((row) => row.spent),
    },
  };
}

// ------------------------------------------------------------------ Tasks

export interface TaskRow {
  readonly task: Task;
  readonly project: ProjectRef;
  readonly assignee: MemberRef;
  readonly overdue: boolean;
}

export interface TasksView extends ContextView {
  readonly tasks: readonly TaskRow[];
  readonly projects: readonly ProjectRef[];
  readonly assignees: readonly MemberRef[];
}

export function getTasksView(): TasksView {
  const rows = tasks.map((task) => ({
    task,
    project: projectRef(task.projectId),
    assignee: memberRef(task.assigneeId),
    overdue: isOverdue(task, workspace.today),
  }));
  const assigneeIds = [...new Set(tasks.map((task) => task.assigneeId))];
  return {
    ...context,
    tasks: rows,
    projects: projects.map((project) => projectRef(project.id)),
    assignees: assigneeIds
      .map(memberRef)
      .sort((a, b) => a.name.localeCompare(b.name, "en")),
  };
}

// ------------------------------------------------------------------ Daily reports

export interface ReportLine {
  readonly text: string;
  readonly taskKey: string | null;
}

export interface ReportBlockerLine extends ReportLine {
  readonly severity: BlockerSeverity;
  readonly needsHelpFrom: MemberRef | null;
}

export interface ReportRow {
  readonly id: string;
  readonly author: MemberRef;
  readonly department: { readonly id: DepartmentId; readonly name: string };
  readonly submittedAt: ISODateTime;
  readonly status: Exclude<SubmissionStatus, "missing">;
  readonly hoursLogged: number;
  readonly completed: readonly ReportLine[];
  readonly inProgress: readonly ReportLine[];
  readonly blockers: readonly ReportBlockerLine[];
  readonly tomorrowPlan: readonly ReportLine[];
}

export interface DailyReportsView extends ContextView {
  readonly policy: DailyReportPolicy;
  readonly currentUser: MemberRef;
  readonly currentUserDepartment: { readonly id: DepartmentId; readonly name: string };
  /** Whether the signed-in member's role is required to check in. */
  readonly currentUserRequired: boolean;
  readonly reports: readonly ReportRow[];
  readonly missing: readonly MemberRef[];
  readonly expected: number;
  readonly onTime: number;
  readonly late: number;
  readonly rate: number;
  readonly trend: readonly { readonly date: ISODate; readonly rate: number }[];
  readonly departments: readonly { readonly id: DepartmentId; readonly name: string }[];
}

const taskKeyOf = (id: TaskId | null): string | null =>
  id === null ? null : (taskById.get(id)?.key ?? null);

export function getDailyReportsView(): DailyReportsView {
  const today = dailyReports.filter((report) => report.date === workspace.today);
  const rows: ReportRow[] = today
    .map((report): ReportRow => {
      const author = required(memberById, report.memberId, "member");
      const department = required(departmentById, author.departmentId, "department");
      const status = submissionStatus(report, dailyReportPolicy, workspace.timeZone);
      return {
        id: report.id,
        author: memberRef(report.memberId),
        department: { id: department.id, name: department.name },
        submittedAt: report.submittedAt,
        status: status === "missing" ? "late" : status,
        hoursLogged: report.hoursLogged,
        completed: report.completed.map((line) => ({ text: line.text, taskKey: taskKeyOf(line.taskId) })),
        inProgress: report.inProgress.map((line) => ({ text: line.text, taskKey: taskKeyOf(line.taskId) })),
        blockers: report.blockers.map((line) => ({
          text: line.text,
          taskKey: taskKeyOf(line.taskId),
          severity: line.severity,
          needsHelpFrom: line.needsHelpFromId ? memberRef(line.needsHelpFromId) : null,
        })),
        tomorrowPlan: report.tomorrowPlan.map((line) => ({ text: line.text, taskKey: taskKeyOf(line.taskId) })),
      };
    })
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));

  const c = snapshot.compliance;
  const me = required(memberById, workspace.currentUserId, "member");
  const myDepartment = required(departmentById, me.departmentId, "department");
  return {
    ...context,
    policy: dailyReportPolicy,
    currentUser: memberRef(workspace.currentUserId),
    currentUserDepartment: { id: myDepartment.id, name: myDepartment.name },
    currentUserRequired: dailyReportPolicy.requiredRoles.includes(me.role),
    reports: rows,
    missing: c.missing.map(memberRef),
    expected: c.expected.length,
    onTime: c.onTime.length,
    late: c.late.length,
    rate: c.rate,
    trend: snapshot.complianceRates,
    departments: departments.map((department) => ({ id: department.id, name: department.name })),
  };
}

// ------------------------------------------------------------------ Approvals

export interface ApprovalsView extends ContextView {
  readonly rows: readonly ApprovalRow[];
  readonly currentUser: MemberRef;
  readonly currency: Workspace["currency"];
}

export function getApprovalsView(): ApprovalsView {
  return {
    ...context,
    rows: approvals.slice().sort(compareByUrgency).map(approvalRow),
    currentUser: memberRef(workspace.currentUserId),
    currency: workspace.currency,
  };
}

// ------------------------------------------------------------------ AI Intelligence

export interface RiskRow extends ProjectRiskAssessment {
  readonly project: ProjectRef & { readonly owner: MemberRef; readonly targetDate: ISODate };
}

export interface IntelligenceView extends ContextView {
  readonly briefing: ExecutiveBriefing;
  readonly insights: readonly Insight[];
  readonly risks: readonly RiskRow[];
  readonly scope: {
    readonly initiatives: number;
    readonly tasks: number;
    readonly checkIns: number;
    readonly approvals: number;
    readonly people: number;
  };
}

export function getIntelligenceView(): IntelligenceView {
  return {
    ...context,
    briefing: buildBriefing(snapshot),
    insights: deriveInsights(snapshot),
    risks: snapshot.risks
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((risk) => {
        const project = required(projectById, risk.projectId, "project");
        return {
          ...risk,
          project: {
            ...projectRef(project.id),
            owner: memberRef(project.ownerId),
            targetDate: project.targetDate,
          },
        };
      }),
    scope: {
      initiatives: projects.length,
      tasks: tasks.length,
      checkIns: dailyReports.length,
      approvals: approvals.length,
      people: members.length,
    },
  };
}

// ------------------------------------------------------------------ Settings

export interface SettingsView {
  readonly workspace: Workspace;
  readonly reportPolicy: DailyReportPolicy;
  readonly notificationRules: readonly NotificationRule[];
  readonly roles: readonly RoleDefinition[];
  readonly permissions: readonly Permission[];
  readonly integrations: readonly Integration[];
  readonly security: SecurityPolicy;
  readonly roleCounts: Readonly<Record<RoleKey, number>>;
}

export function getSettingsView(): SettingsView {
  const roleCounts: Record<RoleKey, number> = {
    owner: 0,
    executive: 0,
    manager: 0,
    contributor: 0,
    viewer: 0,
  };
  for (const member of members) roleCounts[member.role] += 1;
  return {
    workspace,
    reportPolicy: dailyReportPolicy,
    notificationRules,
    roles,
    permissions,
    integrations,
    security: securityPolicy,
    roleCounts,
  };
}
