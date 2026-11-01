import type {
  DepartmentId,
  HealthStatus,
  ISODate,
  MemberId,
  ModuleKey,
  ProjectId,
} from "./common";

/** Semantic color role. Status tones always ship with an icon and a label. */
export type Tone = "good" | "warn" | "bad" | "info" | "brand" | "neutral";

// ---------------------------------------------------------------- Workload

export const WORKLOAD_BANDS = ["available", "healthy", "stretched", "overloaded"] as const;
export type WorkloadBand = (typeof WORKLOAD_BANDS)[number];

export interface WorkloadEntry {
  readonly memberId: MemberId;
  /** Committed ÷ capacity × 100; null when the member carries no capacity. */
  readonly utilization: number | null;
  readonly band: WorkloadBand | null;
  readonly openTasks: number;
  readonly overdueTasks: number;
}

export interface DepartmentSummary {
  readonly departmentId: DepartmentId;
  readonly headcount: number;
  readonly averageUtilization: number | null;
  readonly overloaded: number;
}

// ---------------------------------------------------------------- Milestones

export const MILESTONE_STATES = ["done", "overdue", "due-soon", "upcoming"] as const;
export type MilestoneState = (typeof MILESTONE_STATES)[number];

// ---------------------------------------------------------------- Approvals

export const SLA_STATES = ["overdue", "due-today", "due-soon", "on-track"] as const;
export type SlaState = (typeof SLA_STATES)[number];

// ---------------------------------------------------------------- Check-ins

export interface ComplianceSnapshot {
  readonly date: ISODate;
  readonly expected: readonly MemberId[];
  readonly onTime: readonly MemberId[];
  readonly late: readonly MemberId[];
  readonly missing: readonly MemberId[];
  /** Submitted ÷ expected × 100. */
  readonly rate: number;
}

// ---------------------------------------------------------------- Risk

export const RISK_FACTOR_KEYS = [
  "schedule",
  "budget",
  "overdue-tasks",
  "blocked-tasks",
  "reported-blockers",
  "missed-milestones",
] as const;
export type RiskFactorKey = (typeof RISK_FACTOR_KEYS)[number];

export interface RiskFactor {
  readonly key: RiskFactorKey;
  readonly label: string;
  readonly points: number;
  readonly maxPoints: number;
  /** Plain-language evidence, e.g. "61% done with 82% of the schedule elapsed". */
  readonly detail: string;
}

export const RISK_LEVELS = ["low", "elevated", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface ProjectRiskAssessment {
  readonly projectId: ProjectId;
  /** 0–100, the sum of factor points, capped. */
  readonly score: number;
  readonly level: RiskLevel;
  readonly factors: readonly RiskFactor[];
  readonly reportedHealth: HealthStatus;
  /** The RAG status the signals support. */
  readonly signalHealth: HealthStatus;
  /** True when signals are worse than the owner's reported status. */
  readonly optimismGap: boolean;
}

// ---------------------------------------------------------------- Insights

export const INSIGHT_SEVERITIES = ["critical", "warning", "info", "positive"] as const;
export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number];

export const INSIGHT_CATEGORIES = [
  "delivery",
  "capacity",
  "budget",
  "governance",
  "reporting",
  "momentum",
] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

/**
 * A rule-derived observation about the workspace. Every number in `title`,
 * `summary` and `evidence` is computed from the data layer at render time.
 */
export interface Insight {
  readonly id: `ins-${string}`;
  readonly severity: InsightSeverity;
  readonly category: InsightCategory;
  readonly title: string;
  readonly summary: string;
  readonly evidence: readonly string[];
  readonly recommendation: string;
  readonly module: ModuleKey;
}

// ---------------------------------------------------------------- Briefing

export interface BriefingDecision {
  readonly title: string;
  readonly detail: string;
  readonly tone: Tone;
  readonly module: ModuleKey;
}

/** Narrative summary assembled from computed figures (no model involved). */
export interface ExecutiveBriefing {
  readonly headline: string;
  readonly paragraphs: readonly string[];
  readonly decisions: readonly BriefingDecision[];
}

// ---------------------------------------------------------------- KPIs

export type KpiFormat = "count" | "percent" | "currency";

export interface KpiDelta {
  /** Signed change vs. the comparison period, in the KPI's own unit. */
  readonly value: number;
  readonly comparison: string;
  /** Whether an increase is good news for this KPI. */
  readonly higherIsBetter: boolean;
}

export interface Kpi {
  readonly id: `kpi-${string}`;
  readonly label: string;
  readonly value: number;
  readonly format: KpiFormat;
  readonly context: string;
  readonly delta: KpiDelta | null;
  /** Oldest → newest; the last point is the current period. */
  readonly trend: readonly number[] | null;
  readonly trendLabel: string | null;
  readonly tone: Tone;
  readonly module: ModuleKey;
}

// ---------------------------------------------------------------- Series

export interface ThroughputBar {
  readonly weekStart: ISODate;
  readonly completed: number;
  readonly isCurrent: boolean;
}
