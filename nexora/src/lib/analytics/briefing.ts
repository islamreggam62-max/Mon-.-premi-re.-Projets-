import type { BriefingDecision, ExecutiveBriefing, MemberId } from "@/types";
import {
  describeDue,
  formatMoney,
  formatPercent,
  formatSigned,
  joinList,
  pluralize,
} from "@/lib/format";
import { HEALTH_LABELS } from "@/lib/labels";
import { compareByUrgency, isPending, slaState, sumMoney } from "./approvals";
import { blockerBottlenecks } from "./reports";
import type { PortfolioSnapshot } from "./snapshot";
import { isOverdue } from "./tasks";

/**
 * Executive briefing assembled from computed figures with fixed sentence
 * templates. Phase 1 involves no language model: what reads as synthesis is
 * deterministic, reproducible and traceable to the module pages.
 */
export function buildBriefing(s: PortfolioSnapshot): ExecutiveBriefing {
  const name = (id: MemberId | null): string =>
    s.members.find((member) => member.id === id)?.name ?? "Unassigned";
  const projectById = new Map(s.projects.map((project) => [project.id, project]));

  const counts = {
    onTrack: s.risks.filter((risk) => risk.signalHealth === "on-track").length,
    atRisk: s.risks.filter((risk) => risk.signalHealth === "at-risk").length,
    offTrack: s.risks.filter((risk) => risk.signalHealth === "off-track").length,
  };
  const ranked = s.risks.slice().sort((a, b) => b.score - a.score);
  const attention = ranked.filter((risk) => risk.level === "high");
  const gaps = s.risks.filter((risk) => risk.optimismGap);

  const headline =
    attention.length > 0
      ? `${attention.length} of ${s.risks.length} initiatives need executive attention`
      : `All ${s.risks.length} initiatives are within tolerance`;

  const topRisks = attention
    .map((risk) => {
      const project = projectById.get(risk.projectId);
      return project ? `${project.name} (${risk.score})` : null;
    })
    .filter((label): label is string => label !== null);
  const gapSentence = gaps
    .map((risk) => {
      const project = projectById.get(risk.projectId);
      return project
        ? ` ${project.name} is still reported ${HEALTH_LABELS[risk.reportedHealth]} by its owner.`
        : "";
    })
    .join("");

  const portfolio =
    `Signals put ${counts.onTrack} initiatives on track, ${counts.atRisk} at risk and ${counts.offTrack} off track.` +
    (topRisks.length > 0 ? ` The highest risk sits with ${topRisks.join(" and ")}.` : "") +
    gapSentence;

  const thisWeek = s.throughput[s.throughput.length - 1];
  const lastWeek = s.throughput[s.throughput.length - 2];
  const overdue = s.tasks.filter((task) => isOverdue(task, s.today)).length;
  const blocked = s.tasks.filter((task) => task.status === "blocked").length;
  const blockers = s.reports
    .filter((report) => report.date === s.today)
    .flatMap((report) => report.blockers);
  const execution =
    `The team completed ${pluralize(thisWeek?.completed ?? 0, "task")} this week` +
    (thisWeek && lastWeek
      ? ` (${formatSigned(thisWeek.completed - lastWeek.completed)} vs last week)`
      : "") +
    `, while ${overdue} are overdue and ${blocked} blocked. Today's check-ins raised ${pluralize(blockers.length, "blocker")}.`;

  const overloaded = s.workload
    .filter((entry) => entry.band === "overloaded")
    .sort((a, b) => (b.utilization ?? 0) - (a.utilization ?? 0));
  const pending = s.approvals.filter(isPending).sort(compareByUrgency);
  const pendingValue = sumMoney(
    pending.map((request) => request.amount),
    s.currency,
  );
  const late = pending.filter((request) => slaState(request, s.today) === "overdue");
  const lead = overloaded[0];
  const people =
    (overloaded.length > 0 && lead
      ? `${pluralize(overloaded.length, "person is", "people are")} over capacity, led by ${name(lead.memberId)} at ${formatPercent(lead.utilization ?? 0)}. `
      : "Nobody is over capacity. ") +
    `${pluralize(pending.length, "approval")} worth ${formatMoney(pendingValue.total, { compact: true })} await a decision; ${late.length} ${late.length === 1 ? "is" : "are"} past the deadline.`;

  const decisions: BriefingDecision[] = pending
    .filter((request) => {
      const state = slaState(request, s.today);
      return state === "overdue" || state === "due-today";
    })
    .map((request) => ({
      title: `Decide ${request.reference}: ${request.title}`,
      detail: `${request.amount ? `${formatMoney(request.amount, { compact: true })} · ` : ""}${describeDue(request.decisionDueBy, s.today)}`,
      tone: slaState(request, s.today) === "overdue" ? "bad" : "warn",
      module: "approvals",
    }));

  const bottlenecks = blockerBottlenecks(blockers);
  if (bottlenecks.length > 0) {
    const waiting = bottlenecks.reduce((total, entry) => total + entry.count, 0);
    decisions.push({
      title: `Unblock the work waiting on ${joinList(bottlenecks.map((entry) => name(entry.memberId)))}`,
      detail: `${pluralize(waiting, "blocker")} from today's check-ins depend on them`,
      tone: "warn",
      module: "daily-reports",
    });
  }
  for (const risk of gaps) {
    const project = projectById.get(risk.projectId);
    if (!project) continue;
    decisions.push({
      title: `Request an evidence-based status for ${project.name}`,
      detail: `Reported ${HEALTH_LABELS[risk.reportedHealth]}; signals score ${risk.score}/100`,
      tone: "warn",
      module: "projects",
    });
  }

  return {
    headline,
    paragraphs: [portfolio, execution, people],
    decisions: decisions.slice(0, 4),
  };
}
