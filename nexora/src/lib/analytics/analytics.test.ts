import { describe, expect, it } from "vitest";
import type { DailyReport, Project, ProjectId, Task } from "@/types";
import { approvals } from "@/data/approvals";
import { dailyReports } from "@/data/daily-reports";
import { reportingComplianceHistory, weeklyThroughputHistory } from "@/data/metrics";
import { projects } from "@/data/projects";
import { tasks } from "@/data/tasks";
import { departments, members } from "@/data/team";
import { dailyReportPolicy, workspace } from "@/data/workspace";
import { slaState, sumMoney } from "./approvals";
import { buildBriefing } from "./briefing";
import { deriveInsights } from "./insights";
import { buildKpis } from "./kpis";
import { blockerBottlenecks, submissionStatus } from "./reports";
import { assessProjectRisk, riskLevel } from "./risk";
import { buildSnapshot } from "./snapshot";
import { workloadBand } from "./team";

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

const riskOf = (id: ProjectId) => {
  const risk = snapshot.risks.find((candidate) => candidate.projectId === id);
  if (!risk) throw new Error(`No risk assessment for ${id}`);
  return risk;
};

describe("delivery risk model", () => {
  it("scores the demo portfolio as designed", () => {
    expect(riskOf("prj-scv")).toMatchObject({ score: 88, level: "high", optimismGap: false });
    expect(riskOf("prj-atlas")).toMatchObject({ score: 72, level: "high", signalHealth: "off-track" });
    expect(riskOf("prj-northstar")).toMatchObject({ score: 36, level: "elevated" });
    expect(riskOf("prj-cost")).toMatchObject({ score: 34, level: "elevated" });
    for (const id of ["prj-helios", "prj-talent", "prj-reghub"] as const) {
      expect(riskOf(id).level).toBe("low");
    }
  });

  it("flags only owners who report better health than the signals support", () => {
    const gaps = snapshot.risks.filter((risk) => risk.optimismGap).map((risk) => risk.projectId);
    expect(gaps).toEqual(["prj-atlas"]);
  });

  it("makes the factor breakdown add up to the headline score", () => {
    for (const risk of snapshot.risks) {
      const total = risk.factors.reduce((sum, factor) => sum + factor.points, 0);
      expect(risk.score).toBe(Math.min(100, total));
      for (const factor of risk.factors) expect(factor.points).toBeLessThanOrEqual(factor.maxPoints);
    }
  });

  it("does not score closed initiatives", () => {
    expect(snapshot.risks.some((risk) => risk.projectId === "prj-brand")).toBe(false);
  });

  it("caps the score at 100 and maps thresholds to levels", () => {
    const base = projects.find((project) => project.id === "prj-scv") as Project;
    const doomed: Project = {
      ...base,
      progress: 0,
      spent: { amount: base.budget.amount * 2, currency: "USD" },
    };
    const extraTasks: Task[] = Array.from({ length: 6 }, (_, index) => ({
      id: `tsk-x${index}`,
      key: `NX-X${index}`,
      title: "Synthetic blocked task",
      projectId: base.id,
      assigneeId: "mbr-nour",
      priority: "high",
      dueDate: "2026-10-01",
      estimateHours: 1,
      status: "blocked",
      blockedReason: "Synthetic",
    }));
    const assessed = assessProjectRisk(doomed, [...tasks, ...extraTasks], dailyReports, workspace.today);
    expect(assessed.score).toBe(100);
    expect(riskLevel(29)).toBe("low");
    expect(riskLevel(30)).toBe("elevated");
    expect(riskLevel(60)).toBe("high");
  });
});

describe("daily check-ins", () => {
  it("computes today's compliance from records", () => {
    const c = snapshot.compliance;
    expect(c.expected).toHaveLength(11); // managers + contributors, minus Julia (out of office)
    expect(c.onTime).toHaveLength(7);
    expect(c.late).toEqual(["mbr-hugo", "mbr-ines"]);
    expect(c.missing).toEqual(["mbr-mateo", "mbr-omar"]);
    expect(Math.round(c.rate)).toBe(82);
  });

  it("treats the deadline minute as on time and the next as late", () => {
    const base = dailyReports[0] as DailyReport;
    const at = (time: string): DailyReport => ({
      ...base,
      submittedAt: `2026-10-30T${time}:00+01:00`,
    });
    expect(submissionStatus(at("18:00"), dailyReportPolicy, "Africa/Algiers")).toBe("on-time");
    expect(submissionStatus(at("18:01"), dailyReportPolicy, "Africa/Algiers")).toBe("late");
    expect(submissionStatus(undefined, dailyReportPolicy, "Africa/Algiers")).toBe("missing");
  });

  it("reports every tied bottleneck instead of picking one", () => {
    const bottlenecks = blockerBottlenecks(dailyReports.flatMap((report) => report.blockers));
    expect(bottlenecks).toHaveLength(2);
    expect(bottlenecks).toEqual(
      expect.arrayContaining([
        { memberId: "mbr-thomas", count: 2 },
        { memberId: "mbr-youssef", count: 2 },
      ]),
    );
  });
});

describe("workload, throughput and approvals", () => {
  it("bands utilization at the documented thresholds", () => {
    expect(workloadBand(69.9)).toBe("available");
    expect(workloadBand(70)).toBe("healthy");
    expect(workloadBand(90)).toBe("stretched");
    expect(workloadBand(100)).toBe("stretched");
    expect(workloadBand(100.1)).toBe("overloaded");
  });

  it("excludes people who are away or carry no capacity", () => {
    const julia = snapshot.workload.find((entry) => entry.memberId === "mbr-julia");
    const victor = snapshot.workload.find((entry) => entry.memberId === "mbr-victor");
    expect(julia?.utilization).toBeNull();
    expect(victor?.utilization).toBeNull();
    expect(snapshot.workload.filter((entry) => entry.band === "overloaded")).toHaveLength(4);
  });

  it("computes the current week from task records, not history", () => {
    const current = snapshot.throughput[snapshot.throughput.length - 1];
    expect(current).toEqual({ weekStart: "2026-10-26", completed: 10, isCurrent: true });
    expect(snapshot.throughput).toHaveLength(weeklyThroughputHistory.length + 1);
  });

  it("tracks decision deadlines and refuses to mix currencies silently", () => {
    const states = Object.fromEntries(approvals.map((request) => [request.id, slaState(request, workspace.today)]));
    expect(states["apr-0412"]).toBe("overdue");
    expect(states["apr-0416"]).toBe("due-today");
    expect(states["apr-0408"]).toBeNull(); // decided
    const total = sumMoney(
      [{ amount: 100, currency: "USD" }, { amount: 50, currency: "EUR" }, null],
      "USD",
    );
    expect(total).toEqual({ total: { amount: 100, currency: "USD" }, excluded: 1 });
  });
});

describe("narrative layer", () => {
  const insights = deriveInsights(snapshot);
  const kpis = buildKpis(snapshot);
  const briefing = buildBriefing(snapshot);

  it("orders insights by severity", () => {
    const order = { critical: 0, warning: 1, info: 2, positive: 3 } as const;
    const ranks = insights.map((insight) => order[insight.severity]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(new Set(insights.map((insight) => insight.id)).size).toBe(insights.length);
  });

  it("keeps the KPIs consistent with the module data", () => {
    const value = (id: string) => kpis.find((kpi) => kpi.id === id)?.value;
    expect(value("kpi-initiatives")).toBe(7);
    expect(value("kpi-throughput")).toBe(10);
    expect(value("kpi-overdue")).toBe(9);
    expect(value("kpi-approvals")).toBe(7);
  });

  it("puts overdue approvals first in the decisions list", () => {
    expect(briefing.headline).toBe("2 of 7 initiatives need executive attention");
    expect(briefing.decisions[0]?.title).toContain("APR-2026-0412");
    expect(briefing.decisions[1]?.title).toContain("APR-2026-0416");
  });
});
