import type { Kpi } from "@/types";
import { formatMoney, pluralize } from "@/lib/format";
import { isPending, slaState, sumMoney } from "./approvals";
import type { PortfolioSnapshot } from "./snapshot";
import { isOverdue } from "./tasks";
import { averageUtilization } from "./team";

/** The six headline numbers of the Executive Command Center. */
export function buildKpis(s: PortfolioSnapshot): Kpi[] {
  const offTrack = s.risks.filter((risk) => risk.signalHealth === "off-track").length;
  const atRisk = s.risks.filter((risk) => risk.signalHealth === "at-risk").length;

  const thisWeek = s.throughput[s.throughput.length - 1];
  const lastWeek = s.throughput[s.throughput.length - 2];

  const overdue = s.tasks.filter((task) => isOverdue(task, s.today));
  const overdueCritical = overdue.filter((task) => task.priority === "critical").length;

  const pending = s.approvals.filter(isPending);
  const pendingValue = sumMoney(
    pending.map((request) => request.amount),
    s.currency,
  );
  const pastDeadline = pending.filter((request) => slaState(request, s.today) === "overdue").length;

  const compliance = s.compliance;
  const yesterday = s.complianceRates[s.complianceRates.length - 2];

  const utilization = averageUtilization(s.workload) ?? 0;
  const overloaded = s.workload.filter((entry) => entry.band === "overloaded").length;

  return [
    {
      id: "kpi-initiatives",
      label: "Initiatives in flight",
      value: s.risks.length,
      format: "count",
      context: `${offTrack} off track · ${atRisk} at risk (signals)`,
      delta: null,
      trend: null,
      trendLabel: null,
      tone: offTrack > 0 ? "bad" : atRisk > 0 ? "warn" : "good",
      module: "projects",
    },
    {
      id: "kpi-throughput",
      label: "Tasks completed this week",
      value: thisWeek?.completed ?? 0,
      format: "count",
      context: "Across all initiatives",
      delta:
        thisWeek && lastWeek
          ? {
              value: thisWeek.completed - lastWeek.completed,
              comparison: "vs last week",
              higherIsBetter: true,
            }
          : null,
      trend: s.throughput.map((point) => point.completed),
      trendLabel: `Weekly completions, last ${s.throughput.length} weeks`,
      tone: "brand",
      module: "tasks",
    },
    {
      id: "kpi-overdue",
      label: "Overdue tasks",
      value: overdue.length,
      format: "count",
      context: `${overdueCritical} critical priority`,
      delta: null,
      trend: null,
      trendLabel: null,
      tone: overdue.length > 0 ? "bad" : "good",
      module: "tasks",
    },
    {
      id: "kpi-approvals",
      label: "Pending approvals",
      value: pending.length,
      format: "count",
      context: `${formatMoney(pendingValue.total, { compact: true })} · ${pastDeadline} past deadline`,
      delta: null,
      trend: null,
      trendLabel: null,
      tone: pastDeadline > 0 ? "warn" : "neutral",
      module: "approvals",
    },
    {
      id: "kpi-compliance",
      label: "Check-in compliance",
      value: compliance.rate,
      format: "percent",
      context: `${compliance.onTime.length + compliance.late.length} of ${compliance.expected.length} submitted today`,
      delta: yesterday
        ? { value: compliance.rate - yesterday.rate, comparison: "vs yesterday", higherIsBetter: true }
        : null,
      trend: s.complianceRates.map((point) => point.rate),
      trendLabel: `Daily submission rate, last ${s.complianceRates.length} working days`,
      tone: compliance.rate >= 90 ? "good" : compliance.rate >= 80 ? "warn" : "bad",
      module: "daily-reports",
    },
    {
      id: "kpi-utilization",
      label: "Team utilization",
      value: utilization,
      format: "percent",
      context: `${pluralize(overloaded, "person", "people")} over capacity`,
      delta: null,
      trend: null,
      trendLabel: null,
      tone: overloaded > 0 ? "warn" : "good",
      module: "team",
    },
  ];
}
