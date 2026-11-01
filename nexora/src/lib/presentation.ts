import {
  Activity,
  AlarmClock,
  Ban,
  Briefcase,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CirclePause,
  CircleX,
  Clock,
  Compass,
  Crown,
  Equal,
  Eye,
  FileWarning,
  Hourglass,
  Info,
  MessageSquareWarning,
  OctagonAlert,
  Plane,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
  User,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ApprovalCategory,
  ApprovalDecision,
  AvailabilityStatus,
  BlockerSeverity,
  HealthStatus,
  InsightSeverity,
  MilestoneState,
  Priority,
  ProjectStatus,
  RiskLevel,
  RoleKey,
  SlaState,
  SubmissionStatus,
  TaskStatus,
  Tone,
  WorkloadBand,
} from "@/types";
import {
  APPROVAL_CATEGORY_LABELS,
  AVAILABILITY_LABELS,
  BLOCKER_SEVERITY_LABELS,
  DECISION_LABELS,
  HEALTH_LABELS,
  INSIGHT_SEVERITY_LABELS,
  MILESTONE_STATE_LABELS,
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  RISK_LEVEL_LABELS,
  ROLE_LABELS,
  SLA_LABELS,
  SUBMISSION_LABELS,
  TASK_STATUS_LABELS,
  WORKLOAD_BAND_LABELS,
} from "./labels";

/**
 * Visual encoding for every status. A status is never conveyed by color
 * alone: each style pairs a tone with an icon and a text label.
 * Identity values (roles, categories) use neutral or brand tones so the
 * status colors keep their meaning.
 */
export interface StatusStyle {
  readonly label: string;
  readonly tone: Tone;
  readonly icon: LucideIcon;
}

type StyleMap<K extends string> = Readonly<Record<K, StatusStyle>>;

export const HEALTH_STYLES: StyleMap<HealthStatus> = {
  "on-track": { label: HEALTH_LABELS["on-track"], tone: "good", icon: CircleCheck },
  "at-risk": { label: HEALTH_LABELS["at-risk"], tone: "warn", icon: TriangleAlert },
  "off-track": { label: HEALTH_LABELS["off-track"], tone: "bad", icon: OctagonAlert },
};

export const RISK_STYLES: StyleMap<RiskLevel> = {
  low: { label: RISK_LEVEL_LABELS.low, tone: "good", icon: ShieldCheck },
  elevated: { label: RISK_LEVEL_LABELS.elevated, tone: "warn", icon: TriangleAlert },
  high: { label: RISK_LEVEL_LABELS.high, tone: "bad", icon: OctagonAlert },
};

export const PROJECT_STATUS_STYLES: StyleMap<ProjectStatus> = {
  planning: { label: PROJECT_STATUS_LABELS.planning, tone: "info", icon: Compass },
  active: { label: PROJECT_STATUS_LABELS.active, tone: "brand", icon: Activity },
  "on-hold": { label: PROJECT_STATUS_LABELS["on-hold"], tone: "warn", icon: CirclePause },
  completed: { label: PROJECT_STATUS_LABELS.completed, tone: "good", icon: CircleCheck },
};

export const TASK_STATUS_STYLES: StyleMap<TaskStatus> = {
  backlog: { label: TASK_STATUS_LABELS.backlog, tone: "neutral", icon: CircleDashed },
  todo: { label: TASK_STATUS_LABELS.todo, tone: "neutral", icon: Circle },
  "in-progress": { label: TASK_STATUS_LABELS["in-progress"], tone: "info", icon: CircleDot },
  "in-review": { label: TASK_STATUS_LABELS["in-review"], tone: "brand", icon: Eye },
  blocked: { label: TASK_STATUS_LABELS.blocked, tone: "bad", icon: Ban },
  done: { label: TASK_STATUS_LABELS.done, tone: "good", icon: CircleCheck },
};

export const PRIORITY_STYLES: StyleMap<Priority> = {
  critical: { label: PRIORITY_LABELS.critical, tone: "bad", icon: ChevronsUp },
  high: { label: PRIORITY_LABELS.high, tone: "warn", icon: ChevronUp },
  medium: { label: PRIORITY_LABELS.medium, tone: "neutral", icon: Equal },
  low: { label: PRIORITY_LABELS.low, tone: "neutral", icon: ChevronDown },
};

export const MILESTONE_STYLES: StyleMap<MilestoneState> = {
  done: { label: MILESTONE_STATE_LABELS.done, tone: "good", icon: CircleCheck },
  overdue: { label: MILESTONE_STATE_LABELS.overdue, tone: "bad", icon: OctagonAlert },
  "due-soon": { label: MILESTONE_STATE_LABELS["due-soon"], tone: "warn", icon: Clock },
  upcoming: { label: MILESTONE_STATE_LABELS.upcoming, tone: "neutral", icon: Circle },
};

export const SLA_STYLES: StyleMap<SlaState> = {
  overdue: { label: SLA_LABELS.overdue, tone: "bad", icon: AlarmClock },
  "due-today": { label: SLA_LABELS["due-today"], tone: "warn", icon: Clock },
  "due-soon": { label: SLA_LABELS["due-soon"], tone: "warn", icon: Hourglass },
  "on-track": { label: SLA_LABELS["on-track"], tone: "neutral", icon: CalendarClock },
};

export const DECISION_STYLES: StyleMap<ApprovalDecision["status"]> = {
  pending: { label: DECISION_LABELS.pending, tone: "neutral", icon: Hourglass },
  approved: { label: DECISION_LABELS.approved, tone: "good", icon: CircleCheck },
  rejected: { label: DECISION_LABELS.rejected, tone: "bad", icon: CircleX },
  "changes-requested": {
    label: DECISION_LABELS["changes-requested"],
    tone: "warn",
    icon: MessageSquareWarning,
  },
};

export const SUBMISSION_STYLES: StyleMap<SubmissionStatus> = {
  "on-time": { label: SUBMISSION_LABELS["on-time"], tone: "good", icon: CircleCheck },
  late: { label: SUBMISSION_LABELS.late, tone: "warn", icon: Clock },
  missing: { label: SUBMISSION_LABELS.missing, tone: "bad", icon: CircleDashed },
};

export const BLOCKER_STYLES: StyleMap<BlockerSeverity> = {
  high: { label: BLOCKER_SEVERITY_LABELS.high, tone: "bad", icon: OctagonAlert },
  medium: { label: BLOCKER_SEVERITY_LABELS.medium, tone: "warn", icon: TriangleAlert },
  low: { label: BLOCKER_SEVERITY_LABELS.low, tone: "neutral", icon: Info },
};

export const WORKLOAD_STYLES: StyleMap<WorkloadBand> = {
  available: { label: WORKLOAD_BAND_LABELS.available, tone: "info", icon: Circle },
  healthy: { label: WORKLOAD_BAND_LABELS.healthy, tone: "good", icon: CircleCheck },
  stretched: { label: WORKLOAD_BAND_LABELS.stretched, tone: "warn", icon: TriangleAlert },
  overloaded: { label: WORKLOAD_BAND_LABELS.overloaded, tone: "bad", icon: OctagonAlert },
};

export const INSIGHT_STYLES: StyleMap<InsightSeverity> = {
  critical: { label: INSIGHT_SEVERITY_LABELS.critical, tone: "bad", icon: OctagonAlert },
  warning: { label: INSIGHT_SEVERITY_LABELS.warning, tone: "warn", icon: TriangleAlert },
  info: { label: INSIGHT_SEVERITY_LABELS.info, tone: "info", icon: Info },
  positive: { label: INSIGHT_SEVERITY_LABELS.positive, tone: "good", icon: TrendingUp },
};

export const AVAILABILITY_STYLES: StyleMap<AvailabilityStatus> = {
  available: { label: AVAILABILITY_LABELS.available, tone: "good", icon: Circle },
  busy: { label: AVAILABILITY_LABELS.busy, tone: "warn", icon: Clock },
  "out-of-office": { label: AVAILABILITY_LABELS["out-of-office"], tone: "neutral", icon: Plane },
};

export const ROLE_STYLES: StyleMap<RoleKey> = {
  owner: { label: ROLE_LABELS.owner, tone: "brand", icon: Crown },
  executive: { label: ROLE_LABELS.executive, tone: "neutral", icon: Briefcase },
  manager: { label: ROLE_LABELS.manager, tone: "neutral", icon: Users },
  contributor: { label: ROLE_LABELS.contributor, tone: "neutral", icon: User },
  viewer: { label: ROLE_LABELS.viewer, tone: "neutral", icon: Eye },
};

export const CATEGORY_STYLES: StyleMap<ApprovalCategory> = {
  budget: { label: APPROVAL_CATEGORY_LABELS.budget, tone: "neutral", icon: Wallet },
  hiring: { label: APPROVAL_CATEGORY_LABELS.hiring, tone: "neutral", icon: UserPlus },
  exception: { label: APPROVAL_CATEGORY_LABELS.exception, tone: "neutral", icon: FileWarning },
};

/** Meter fill carries severity: accent → warning → danger. */
export type MeterTone = "brand" | "good" | "warn" | "bad" | "muted";

export function workloadMeterTone(band: WorkloadBand | null): MeterTone {
  if (band === "overloaded") return "bad";
  if (band === "stretched") return "warn";
  if (band === null) return "muted";
  return "brand";
}

export function burnMeterTone(burn: number, progress: number): MeterTone {
  const gap = burn - progress;
  if (burn > 100 || gap >= 15) return "bad";
  if (gap >= 5) return "warn";
  return "brand";
}
