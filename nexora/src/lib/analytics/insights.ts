import type {
  Insight,
  InsightSeverity,
  MemberId,
  RiskFactorKey,
  TaskId,
} from "@/types";
import {
  describeDue,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  formatSigned,
  joinList,
  pluralize,
} from "@/lib/format";
import { BLOCKER_SEVERITY_LABELS, HEALTH_LABELS, RISK_LEVEL_LABELS } from "@/lib/labels";
import { isPending, slaState, sumMoney } from "./approvals";
import { budgetBurn, isInFlight } from "./projects";
import { blockerBottlenecks } from "./reports";
import type { PortfolioSnapshot } from "./snapshot";
import { mean } from "./stats";
import { averageUtilization } from "./team";

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  positive: 3,
};

/** First move for the factor contributing most to a project's risk. */
const RECOVERY_PLAYBOOK: Record<RiskFactorKey, string> = {
  schedule:
    "Re-baseline the plan with the owner and agree a recovery path before the next milestone.",
  budget: "Freeze discretionary spend and review the forecast-to-complete with Finance.",
  "overdue-tasks": "Reassign or re-scope the overdue tasks this week and confirm new dates.",
  "blocked-tasks": "Name an owner for every blocked task and escalate the dependencies today.",
  "reported-blockers": "Clear the blockers raised in check-ins before adding new scope.",
  "missed-milestones":
    "Hold a recovery review for the missed milestone and commit to a new, evidence-based date.",
};

/** Budget burn running this many points ahead of progress is flagged. */
const BURN_GAP_THRESHOLD = 15;
/** Check-in compliance below this rate (%) is a warning rather than a note. */
const COMPLIANCE_WARNING_RATE = 80;

/**
 * Rule-based executive insights. Every figure is computed from the snapshot,
 * so the AI Intelligence page and the dashboard alerts can never disagree
 * with the module pages they link to.
 */
export function deriveInsights(s: PortfolioSnapshot): Insight[] {
  const memberName = (id: MemberId | null): string =>
    s.members.find((member) => member.id === id)?.name ?? "an unassigned owner";
  const taskKey = (id: TaskId | null): string | null =>
    s.tasks.find((task) => task.id === id)?.key ?? null;
  const projectById = new Map(s.projects.map((project) => [project.id, project]));
  const insights: Insight[] = [];

  // 1 — Initiatives at high delivery risk.
  const highRisk = s.risks.filter((risk) => risk.level === "high").sort((a, b) => b.score - a.score);
  for (const risk of highRisk) {
    const project = projectById.get(risk.projectId);
    if (!project) continue;
    const drivers = risk.factors
      .filter((factor) => factor.points > 0)
      .sort((a, b) => b.points - a.points);
    const lead = drivers[0];
    insights.push({
      id: `ins-risk-${project.code.toLowerCase()}`,
      severity: "critical",
      category: "delivery",
      title: `${project.name} is at high delivery risk`,
      summary: `Risk score ${risk.score}/100, driven mainly by ${drivers
        .slice(0, 2)
        .map((factor) => factor.label.toLowerCase())
        .join(" and ")}. Target date: ${formatDate(project.targetDate)}.`,
      evidence: drivers.map((factor) => `${factor.label}: ${factor.detail}`),
      recommendation: RECOVERY_PLAYBOOK[lead?.key ?? "schedule"],
      module: "projects",
    });
  }

  // 2 — Reported status more optimistic than the signals.
  for (const risk of s.risks.filter((candidate) => candidate.optimismGap)) {
    const project = projectById.get(risk.projectId);
    if (!project) continue;
    const drivers = risk.factors
      .filter((factor) => factor.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
    insights.push({
      id: `ins-gap-${project.code.toLowerCase()}`,
      severity: "warning",
      category: "governance",
      title: `${project.name}: reported ${HEALTH_LABELS[risk.reportedHealth]}, signals say ${HEALTH_LABELS[risk.signalHealth]}`,
      summary:
        "The owner's status update is more optimistic than the schedule, budget and task signals support.",
      evidence: [
        `Reported status: ${HEALTH_LABELS[risk.reportedHealth]}`,
        `Signal-based score: ${risk.score}/100 (${RISK_LEVEL_LABELS[risk.level].toLowerCase()})`,
        ...drivers.map((factor) => `${factor.label}: ${factor.detail}`),
      ],
      recommendation: `Ask ${memberName(project.ownerId)} for an evidence-based status update before the next steering review.`,
      module: "projects",
    });
  }

  // 3 — People over capacity.
  const overloaded = s.workload
    .filter((entry) => entry.band === "overloaded")
    .sort((a, b) => (b.utilization ?? 0) - (a.utilization ?? 0));
  if (overloaded.length > 0) {
    const average = averageUtilization(s.workload);
    insights.push({
      id: "ins-capacity",
      severity: "warning",
      category: "capacity",
      title: `${pluralize(overloaded.length, "person", "people")} over capacity this week`,
      summary: `${overloaded
        .slice(0, 2)
        .map((entry) => `${memberName(entry.memberId)} (${formatPercent(entry.utilization ?? 0)})`)
        .join(" and ")} carry the heaviest load.${
        average === null ? "" : ` Team average: ${formatPercent(average)}.`
      }`,
      evidence: overloaded.map((entry) => {
        const member = s.members.find((candidate) => candidate.id === entry.memberId);
        const hours = member ? ` — ${member.committedHours} h of ${member.weeklyCapacityHours} h` : "";
        const overdue = entry.overdueTasks > 0 ? `, ${entry.overdueTasks} overdue` : "";
        return `${memberName(entry.memberId)}: ${formatPercent(entry.utilization ?? 0)}${hours}; ${pluralize(entry.openTasks, "open task")}${overdue}`;
      }),
      recommendation:
        "Rebalance work away from overloaded people, or defer low-priority tasks, before taking on new commitments.",
      module: "team",
    });
  }

  // 4 — Approval deadlines.
  const pending = s.approvals.filter(isPending);
  const late = pending.filter((request) => slaState(request, s.today) === "overdue");
  const dueToday = pending.filter((request) => slaState(request, s.today) === "due-today");
  if (late.length > 0 || dueToday.length > 0) {
    const value = sumMoney(
      pending.map((request) => request.amount),
      s.currency,
    );
    insights.push({
      id: "ins-approvals",
      severity: late.length > 0 ? "warning" : "info",
      category: "governance",
      title:
        late.length > 0
          ? `${pluralize(late.length, "approval")} past the decision deadline`
          : `${pluralize(dueToday.length, "approval")} due today`,
      summary: `${pluralize(pending.length, "request")} pending, worth ${formatMoney(value.total, { compact: true })}. ${
        late.length > 0 ? `${late.length} late` : "None late"
      }, ${dueToday.length} due today.`,
      evidence: [...late, ...dueToday].map(
        (request) =>
          `${request.reference} · ${request.title} · ${
            request.amount ? formatMoney(request.amount, { compact: true }) : "No amount"
          } · ${describeDue(request.decisionDueBy, s.today)}`,
      ),
      recommendation: "Decide or delegate today: late decisions are holding up delivery work.",
      module: "approvals",
    });
  }

  // 5 — Blockers raised in today's check-ins.
  const blockers = s.reports
    .filter((report) => report.date === s.today)
    .flatMap((report) => report.blockers.map((blocker) => ({ ...blocker, authorId: report.memberId })));
  if (blockers.length > 0) {
    const high = blockers.filter((blocker) => blocker.severity === "high");
    const bottlenecks = blockerBottlenecks(blockers);
    const helperNames = joinList(bottlenecks.map((entry) => memberName(entry.memberId)));
    insights.push({
      id: "ins-blockers",
      severity: high.length >= 3 ? "critical" : "warning",
      category: "delivery",
      title: `${pluralize(blockers.length, "blocker")} raised in today's check-ins`,
      summary: `${high.length} high severity.${
        bottlenecks.length > 0
          ? ` Most-needed to unblock: ${joinList(
              bottlenecks.map((entry) => `${memberName(entry.memberId)} (${entry.count})`),
            )}.`
          : ""
      }`,
      evidence: blockers
        .slice()
        .sort((a, b) => Number(b.severity === "high") - Number(a.severity === "high"))
        .map((blocker) => {
          const key = taskKey(blocker.taskId);
          return `${BLOCKER_SEVERITY_LABELS[blocker.severity]}: ${blocker.text}${key ? ` (${key})` : ""} — raised by ${memberName(blocker.authorId)}`;
        }),
      recommendation:
        bottlenecks.length > 0
          ? `Ask ${helperNames} to clear these dependencies first thing tomorrow.`
          : "Give every blocker a named owner at tomorrow's stand-up.",
      module: "daily-reports",
    });
  }

  // 6 — Spend running ahead of delivered scope.
  const burning = s.projects
    .filter(isInFlight)
    .map((project) => ({ project, burn: budgetBurn(project) }))
    .filter(({ project, burn }) => burn - project.progress >= BURN_GAP_THRESHOLD)
    .sort((a, b) => b.burn - b.project.progress - (a.burn - a.project.progress));
  if (burning.length > 0) {
    insights.push({
      id: "ins-budget",
      severity: "warning",
      category: "budget",
      title: `${pluralize(burning.length, "initiative")} spending ahead of progress`,
      summary: `Spend exceeds delivered scope by ${BURN_GAP_THRESHOLD} points or more on ${burning
        .map(({ project }) => project.name)
        .join(" and ")}.`,
      evidence: burning.map(
        ({ project, burn }) =>
          `${project.name}: ${formatPercent(burn)} of ${formatMoney(project.budget, { compact: true })} spent, ${formatPercent(project.progress)} complete`,
      ),
      recommendation:
        "Review forecast-to-complete with Finance and release contingency only against a re-baselined plan.",
      module: "projects",
    });
  }

  // 7 — Check-in compliance.
  {
    const c = s.compliance;
    const submitted = c.onTime.length + c.late.length;
    const previous = mean(
      s.complianceRates.filter((point) => point.date !== s.today).map((point) => point.rate),
    );
    const missingOverloaded = c.missing.filter(
      (id) => s.workload.find((entry) => entry.memberId === id)?.band === "overloaded",
    );
    insights.push({
      id: "ins-reporting",
      severity: c.rate < COMPLIANCE_WARNING_RATE ? "warning" : "info",
      category: "reporting",
      title: `Check-in compliance at ${formatPercent(c.rate)} today`,
      summary: `${submitted} of ${c.expected.length} submitted (${c.late.length} late).${
        c.missing.length > 0
          ? ` Missing: ${c.missing.map((id) => memberName(id)).join(", ")}.`
          : " Nobody is missing."
      }`,
      evidence: [
        `On time: ${c.onTime.length} · Late: ${c.late.length} · Missing: ${c.missing.length}`,
        ...(previous === null ? [] : [`Previous working days averaged ${formatPercent(previous)}`]),
        ...missingOverloaded.map((id) => `${memberName(id)} is missing and is also over capacity`),
      ],
      recommendation:
        c.missing.length > 0
          ? "Follow up with the missing members today: silent days are where blockers hide."
          : "Keep the cadence; no follow-up needed.",
      module: "daily-reports",
    });
  }

  // 8 — Throughput momentum.
  const current = s.throughput[s.throughput.length - 1];
  const priorWeeks = s.throughput.slice(-5, -1);
  const priorAverage = mean(priorWeeks.map((point) => point.completed));
  const lastWeek = priorWeeks[priorWeeks.length - 1];
  if (current && priorAverage !== null && lastWeek) {
    const up = current.completed >= priorAverage;
    insights.push({
      id: "ins-momentum",
      severity: up ? "positive" : "info",
      category: "momentum",
      title: up
        ? `Throughput up: ${pluralize(current.completed, "task")} completed this week`
        : `Throughput below average: ${pluralize(current.completed, "task")} this week`,
      summary: `${formatSigned(current.completed - lastWeek.completed)} vs last week; the 4-week average is ${formatNumber(priorAverage, 1)}.`,
      evidence: priorWeeks.map(
        (point) => `Week of ${formatDate(point.weekStart, "short")}: ${pluralize(point.completed, "task")}`,
      ),
      recommendation: up
        ? "Protect the focus time of the squads driving the increase."
        : "Check whether blockers or overload explain the dip before adding scope.",
      module: "tasks",
    });
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
