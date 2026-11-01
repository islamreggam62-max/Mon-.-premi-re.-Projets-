import type {
  ApprovalCategory,
  ApprovalDecision,
  AvailabilityStatus,
  BlockerSeverity,
  HealthStatus,
  InsightCategory,
  InsightSeverity,
  IntegrationCategory,
  MilestoneState,
  ModuleKey,
  PermissionLevel,
  Priority,
  ProjectStatus,
  RiskLevel,
  RoleKey,
  SlaState,
  SubmissionStatus,
  TaskStatus,
  WorkloadBand,
} from "@/types";

/** Display vocabulary. Plain strings only, so analytics can phrase text without UI code. */

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  team: "Team",
  projects: "Projects",
  tasks: "Tasks",
  "daily-reports": "Daily Reports",
  approvals: "Approvals",
  "ai-intelligence": "AI Intelligence",
  settings: "Settings",
};

export const HEALTH_LABELS: Record<HealthStatus, string> = {
  "on-track": "On track",
  "at-risk": "At risk",
  "off-track": "Off track",
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low risk",
  elevated: "Elevated risk",
  high: "High risk",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  "on-hold": "On hold",
  completed: "Completed",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  "in-progress": "In progress",
  "in-review": "In review",
  blocked: "Blocked",
  done: "Done",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const ROLE_LABELS: Record<RoleKey, string> = {
  owner: "Owner",
  executive: "Executive",
  manager: "Manager",
  contributor: "Contributor",
  viewer: "Viewer",
};

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  busy: "Busy",
  "out-of-office": "Out of office",
};

export const WORKLOAD_BAND_LABELS: Record<WorkloadBand, string> = {
  available: "Has capacity",
  healthy: "Healthy",
  stretched: "Stretched",
  overloaded: "Overloaded",
};

export const MILESTONE_STATE_LABELS: Record<MilestoneState, string> = {
  done: "Done",
  overdue: "Missed",
  "due-soon": "Due soon",
  upcoming: "Upcoming",
};

export const APPROVAL_CATEGORY_LABELS: Record<ApprovalCategory, string> = {
  budget: "Budget",
  hiring: "Hiring",
  exception: "Exception",
};

export const DECISION_LABELS: Record<ApprovalDecision["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  "changes-requested": "Changes requested",
};

export const SLA_LABELS: Record<SlaState, string> = {
  overdue: "Past deadline",
  "due-today": "Due today",
  "due-soon": "Due soon",
  "on-track": "Within deadline",
};

export const SUBMISSION_LABELS: Record<SubmissionStatus, string> = {
  "on-time": "On time",
  late: "Late",
  missing: "Missing",
};

export const BLOCKER_SEVERITY_LABELS: Record<BlockerSeverity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const INSIGHT_SEVERITY_LABELS: Record<InsightSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Note",
  positive: "Positive",
};

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  delivery: "Delivery",
  capacity: "Capacity",
  budget: "Budget",
  governance: "Governance",
  reporting: "Reporting",
  momentum: "Momentum",
};

export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  full: "Full access",
  limited: "Limited",
  none: "No access",
};

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  communication: "Communication",
  identity: "Identity",
  productivity: "Productivity",
  engineering: "Engineering",
  data: "Data",
};
