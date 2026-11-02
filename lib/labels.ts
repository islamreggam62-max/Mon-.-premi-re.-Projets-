/** Display labels and sort orders for every enumerated domain value. */
import type {
  AccessRole,
  ApprovalKind,
  ApprovalStatus,
  ApprovalUrgency,
  Department,
  DepartmentHealthStatus,
  Health,
  PermissionLevel,
  PresenceStatus,
  Priority,
  Severity,
  SubmissionStatus,
  TaskStatus,
} from "@/lib/types";

export const HEALTH_LABEL: Record<Health, string> = {
  "on-track": "On Track",
  "at-risk": "At Risk",
  delayed: "Delayed",
};
/** Lower = riskier. */
export const HEALTH_RANK: Record<Health, number> = { delayed: 0, "at-risk": 1, "on-track": 2 };
export const HEALTH_ORDER: Health[] = ["on-track", "at-risk", "delayed"];

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
/** Lower = more urgent. */
export const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
export const PRIORITY_ORDER: Priority[] = ["low", "medium", "high", "critical"];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  "in-review": "In Review",
  blocked: "Blocked",
  done: "Done",
};
export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "in-progress", "in-review", "blocked", "done"];

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: "Pending",
  "in-review": "In Review",
  "changes-requested": "Changes Requested",
  approved: "Approved",
  rejected: "Rejected",
};
export const APPROVAL_STATUS_ORDER: ApprovalStatus[] = [
  "pending",
  "in-review",
  "changes-requested",
  "approved",
  "rejected",
];

export const APPROVAL_KIND_LABEL: Record<ApprovalKind, string> = {
  budget: "Budget",
  contract: "Contract",
  hiring: "Hiring",
  exception: "Exception",
};
export const APPROVAL_KIND_ORDER: ApprovalKind[] = ["budget", "contract", "hiring", "exception"];

export const DEPARTMENT_HEALTH_LABEL: Record<DepartmentHealthStatus, string> = {
  healthy: "Healthy",
  watch: "Watch",
  critical: "Critical",
};

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  missing: "Missing",
  excused: "Excused",
};

export const URGENCY_LABEL: Record<ApprovalUrgency, string> = {
  overdue: "Overdue",
  "due-today": "Due today",
  "due-soon": "Due soon",
  "on-schedule": "On schedule",
};
export const URGENCY_RANK: Record<ApprovalUrgency, number> = {
  overdue: 0,
  "due-today": 1,
  "due-soon": 2,
  "on-schedule": 3,
};

export const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  active: "Active",
  away: "Away",
  offline: "Offline",
  "on-leave": "On leave",
};

export const ACCESS_ROLE_LABEL: Record<AccessRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
};
export const ACCESS_ROLE_ORDER: AccessRole[] = ["owner", "admin", "manager", "member", "viewer"];

export const PERMISSION_LABEL: Record<PermissionLevel, string> = {
  full: "Full",
  edit: "Edit",
  view: "View",
  none: "None",
};

export const SEVERITY_LABEL: Record<Severity, string> = { high: "High", medium: "Medium", low: "Low" };
export const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export const DEPARTMENT_ORDER: Department[] = [
  "Executive",
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
];
