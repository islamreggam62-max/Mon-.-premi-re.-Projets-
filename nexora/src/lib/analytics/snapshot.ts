import type {
  ApprovalRequest,
  ComplianceSnapshot,
  CurrencyCode,
  DailyReport,
  DailyReportPolicy,
  Department,
  ISODate,
  Project,
  ProjectRiskAssessment,
  ReportingCompliancePoint,
  Task,
  TeamMember,
  ThroughputBar,
  WeeklyThroughputPoint,
  WorkloadEntry,
} from "@/types";
import { isInFlight } from "./projects";
import { complianceSnapshot, complianceTrend } from "./reports";
import { assessProjectRisk } from "./risk";
import { weeklyThroughput } from "./tasks";
import { buildWorkload } from "./team";

export interface SnapshotInput {
  readonly today: ISODate;
  readonly timeZone: string;
  readonly currency: CurrencyCode;
  readonly departments: readonly Department[];
  readonly members: readonly TeamMember[];
  readonly projects: readonly Project[];
  readonly tasks: readonly Task[];
  readonly reports: readonly DailyReport[];
  readonly approvals: readonly ApprovalRequest[];
  readonly reportPolicy: DailyReportPolicy;
  readonly throughputHistory: readonly WeeklyThroughputPoint[];
  readonly complianceHistory: readonly ReportingCompliancePoint[];
}

/** Raw records plus every derived figure the modules share. */
export interface PortfolioSnapshot extends SnapshotInput {
  readonly risks: readonly ProjectRiskAssessment[];
  readonly workload: readonly WorkloadEntry[];
  readonly compliance: ComplianceSnapshot;
  readonly complianceRates: readonly { readonly date: ISODate; readonly rate: number }[];
  readonly throughput: readonly ThroughputBar[];
}

export function buildSnapshot(input: SnapshotInput): PortfolioSnapshot {
  const compliance = complianceSnapshot(
    input.members,
    input.reports,
    input.reportPolicy,
    input.today,
    input.timeZone,
  );
  return {
    ...input,
    risks: input.projects
      .filter(isInFlight)
      .map((project) => assessProjectRisk(project, input.tasks, input.reports, input.today)),
    workload: buildWorkload(input.members, input.tasks, input.today),
    compliance,
    complianceRates: complianceTrend(input.complianceHistory, compliance),
    throughput: weeklyThroughput(input.throughputHistory, input.tasks, input.today),
  };
}
