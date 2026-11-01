import type {
  DailyReport,
  HealthStatus,
  ISODate,
  Project,
  ProjectRiskAssessment,
  RiskFactor,
  RiskLevel,
  Task,
} from "@/types";
import { formatPercent } from "@/lib/format";
import { budgetBurn, milestoneState, scheduleElapsed } from "./projects";
import { isOverdue } from "./tasks";

/**
 * Transparent, rule-based delivery risk. Each factor is capped and explained in
 * plain language; the score is the sum of rounded factor points (max 100), so
 * the breakdown shown in the UI always adds up to the headline number.
 */
export const RISK_MODEL = {
  schedule: { maxPoints: 30, perPercentagePoint: 0.8 },
  budget: { maxPoints: 20, perPercentagePoint: 0.6 },
  overdueTasks: { maxPoints: 20, perTask: 6 },
  blockedTasks: { maxPoints: 15, perTask: 5 },
  reportedBlockers: { maxPoints: 10, perSeverity: { high: 4, medium: 2, low: 1 } },
  missedMilestones: { maxPoints: 20, perMilestone: 10 },
} as const;

export const RISK_THRESHOLDS = { elevated: 30, high: 60 } as const;

const HEALTH_RANK: Record<HealthStatus, number> = { "on-track": 0, "at-risk": 1, "off-track": 2 };

export function riskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.high) return "high";
  if (score >= RISK_THRESHOLDS.elevated) return "elevated";
  return "low";
}

export function healthForLevel(level: RiskLevel): HealthStatus {
  if (level === "high") return "off-track";
  if (level === "elevated") return "at-risk";
  return "on-track";
}

const capped = (value: number, max: number): number => Math.min(max, Math.round(value));

const listKeys = (tasks: readonly Task[]): string =>
  tasks
    .slice(0, 3)
    .map((task) => task.key)
    .join(", ") + (tasks.length > 3 ? ` +${tasks.length - 3}` : "");

export function assessProjectRisk(
  project: Project,
  tasks: readonly Task[],
  reports: readonly DailyReport[],
  today: ISODate,
): ProjectRiskAssessment {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const taskIds = new Set(projectTasks.map((task) => task.id));

  const elapsed = scheduleElapsed(project, today);
  const scheduleLag = Math.max(0, elapsed - project.progress);
  const burn = budgetBurn(project);
  const burnAhead = Math.max(0, burn - project.progress);
  const overdue = projectTasks.filter((task) => isOverdue(task, today));
  const blocked = projectTasks.filter((task) => task.status === "blocked");
  const blockers = reports
    .filter((report) => report.date === today)
    .flatMap((report) => report.blockers)
    .filter((blocker) => blocker.taskId !== null && taskIds.has(blocker.taskId));
  const missed = project.milestones.filter(
    (milestone) => milestoneState(milestone, today) === "overdue",
  );

  const blockerWeight = blockers.reduce(
    (sum, blocker) => sum + RISK_MODEL.reportedBlockers.perSeverity[blocker.severity],
    0,
  );

  const factors: RiskFactor[] = [
    {
      key: "schedule",
      label: "Schedule",
      maxPoints: RISK_MODEL.schedule.maxPoints,
      points: capped(scheduleLag * RISK_MODEL.schedule.perPercentagePoint, RISK_MODEL.schedule.maxPoints),
      detail: `${formatPercent(project.progress)} complete with ${formatPercent(elapsed)} of the schedule elapsed`,
    },
    {
      key: "budget",
      label: "Budget burn",
      maxPoints: RISK_MODEL.budget.maxPoints,
      points: capped(burnAhead * RISK_MODEL.budget.perPercentagePoint, RISK_MODEL.budget.maxPoints),
      detail: `${formatPercent(burn)} of budget spent for ${formatPercent(project.progress)} of the scope`,
    },
    {
      key: "overdue-tasks",
      label: "Overdue tasks",
      maxPoints: RISK_MODEL.overdueTasks.maxPoints,
      points: capped(overdue.length * RISK_MODEL.overdueTasks.perTask, RISK_MODEL.overdueTasks.maxPoints),
      detail:
        overdue.length === 0
          ? "No overdue tasks"
          : `${overdue.length} overdue (${listKeys(overdue)})`,
    },
    {
      key: "blocked-tasks",
      label: "Blocked tasks",
      maxPoints: RISK_MODEL.blockedTasks.maxPoints,
      points: capped(blocked.length * RISK_MODEL.blockedTasks.perTask, RISK_MODEL.blockedTasks.maxPoints),
      detail:
        blocked.length === 0 ? "Nothing blocked" : `${blocked.length} blocked (${listKeys(blocked)})`,
    },
    {
      key: "reported-blockers",
      label: "Blockers in check-ins",
      maxPoints: RISK_MODEL.reportedBlockers.maxPoints,
      points: capped(blockerWeight, RISK_MODEL.reportedBlockers.maxPoints),
      detail:
        blockers.length === 0
          ? "No blockers reported today"
          : `${blockers.length} raised today (${blockers.filter((b) => b.severity === "high").length} high severity)`,
    },
    {
      key: "missed-milestones",
      label: "Missed milestones",
      maxPoints: RISK_MODEL.missedMilestones.maxPoints,
      points: capped(
        missed.length * RISK_MODEL.missedMilestones.perMilestone,
        RISK_MODEL.missedMilestones.maxPoints,
      ),
      detail:
        missed.length === 0
          ? "All due milestones met"
          : missed.map((milestone) => milestone.title).join(", "),
    },
  ];

  const score = Math.min(
    100,
    factors.reduce((sum, factor) => sum + factor.points, 0),
  );
  const level = riskLevel(score);
  const signalHealth = healthForLevel(level);

  return {
    projectId: project.id,
    score,
    level,
    factors,
    reportedHealth: project.reportedHealth,
    signalHealth,
    optimismGap: HEALTH_RANK[signalHealth] > HEALTH_RANK[project.reportedHealth],
  };
}
