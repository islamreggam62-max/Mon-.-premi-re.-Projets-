import type {
  Integration,
  NotificationRule,
  Permission,
  PermissionGrant,
  RoleDefinition,
  SecurityPolicy,
} from "@/types";

export const roles: readonly RoleDefinition[] = [
  {
    key: "owner",
    label: "Workspace owner",
    description: "Full control, including security, billing and approval limits.",
  },
  {
    key: "executive",
    label: "Executive",
    description: "Portfolio-wide visibility; decides within delegated limits.",
  },
  {
    key: "manager",
    label: "Manager",
    description: "Runs a team: tasks, check-ins and first-level approvals.",
  },
  {
    key: "contributor",
    label: "Contributor",
    description: "Executes tasks and submits daily check-ins.",
  },
  {
    key: "viewer",
    label: "Viewer",
    description: "Read-only access for board observers and auditors.",
  },
];

const full: PermissionGrant = { level: "full", scope: null };
const none: PermissionGrant = { level: "none", scope: null };
const limited = (scope: string): PermissionGrant => ({ level: "limited", scope });

/** Role × capability matrix shown as a read-only preview in Settings. */
export const permissions: readonly Permission[] = [
  {
    id: "perm-dashboard-view",
    module: "dashboard",
    label: "View the executive command center",
    grants: {
      owner: full,
      executive: full,
      manager: limited("Own department KPIs"),
      contributor: none,
      viewer: limited("Read-only, no financials"),
    },
  },
  {
    id: "perm-team-manage",
    module: "team",
    label: "Manage people, departments and roles",
    grants: {
      owner: full,
      executive: limited("Own function"),
      manager: limited("Direct reports"),
      contributor: none,
      viewer: none,
    },
  },
  {
    id: "perm-projects-edit",
    module: "projects",
    label: "Create and edit initiatives and milestones",
    grants: {
      owner: full,
      executive: full,
      manager: limited("Initiatives they own"),
      contributor: none,
      viewer: none,
    },
  },
  {
    id: "perm-tasks-manage",
    module: "tasks",
    label: "Create, assign and update tasks",
    grants: {
      owner: full,
      executive: full,
      manager: full,
      contributor: limited("Assigned tasks"),
      viewer: none,
    },
  },
  {
    id: "perm-reports-submit",
    module: "daily-reports",
    label: "Submit daily check-ins",
    grants: {
      owner: limited("Optional"),
      executive: limited("Optional"),
      manager: full,
      contributor: full,
      viewer: none,
    },
  },
  {
    id: "perm-reports-read",
    module: "daily-reports",
    label: "Read team check-ins",
    grants: {
      owner: full,
      executive: full,
      manager: limited("Own team"),
      contributor: limited("Own check-ins"),
      viewer: none,
    },
  },
  {
    id: "perm-approvals-decide",
    module: "approvals",
    label: "Decide approval requests",
    grants: {
      owner: full,
      executive: limited("Up to $250K, own function"),
      manager: limited("Up to $25K"),
      contributor: none,
      viewer: none,
    },
  },
  {
    id: "perm-ai-access",
    module: "ai-intelligence",
    label: "Use AI Intelligence",
    grants: {
      owner: full,
      executive: full,
      manager: limited("Own department scope"),
      contributor: none,
      viewer: none,
    },
  },
  {
    id: "perm-settings-admin",
    module: "settings",
    label: "Manage workspace settings, security and billing",
    grants: {
      owner: full,
      executive: none,
      manager: none,
      contributor: none,
      viewer: none,
    },
  },
];

export const notificationRules: readonly NotificationRule[] = [
  {
    id: "ntf-approval-sla",
    label: "Approval deadline alerts",
    description: "Notify approvers 24 hours before a decision is due, and again when it is overdue.",
    channels: ["in-app", "email"],
    enabled: true,
  },
  {
    id: "ntf-blockers",
    label: "Blocker escalation",
    description: "Escalate high-severity blockers to the initiative owner and department head.",
    channels: ["in-app", "email"],
    enabled: true,
  },
  {
    id: "ntf-daily-digest",
    label: "Daily executive digest",
    description: "A 07:30 summary of portfolio risk, pending approvals and missing check-ins.",
    channels: ["email"],
    enabled: true,
  },
  {
    id: "ntf-report-reminder",
    label: "Check-in reminders",
    description: "Remind expected members who have not submitted by the reminder time.",
    channels: ["in-app"],
    enabled: true,
  },
  {
    id: "ntf-weekly-briefing",
    label: "Weekly intelligence briefing",
    description: "Friday synthesis of delivery risk, capacity and momentum.",
    channels: ["email"],
    enabled: false,
  },
];

export const integrations: readonly Integration[] = [
  {
    id: "int-slack",
    name: "Slack",
    category: "communication",
    description: "Route alerts, approvals and daily digests to channels.",
  },
  {
    id: "int-teams",
    name: "Microsoft Teams",
    category: "communication",
    description: "Approval cards and blocker escalations inside Teams.",
  },
  {
    id: "int-entra",
    name: "Microsoft Entra ID",
    category: "identity",
    description: "SAML / OIDC single sign-on and SCIM user provisioning.",
  },
  {
    id: "int-google",
    name: "Google Workspace",
    category: "productivity",
    description: "Calendar-aware workload and Google sign-in.",
  },
  {
    id: "int-jira",
    name: "Jira",
    category: "engineering",
    description: "Two-way task sync for engineering squads.",
  },
  {
    id: "int-warehouse",
    name: "Data warehouse export",
    category: "data",
    description: "Scheduled export of portfolio metrics to your BI stack.",
  },
];

export const securityPolicy: SecurityPolicy = {
  enforceTwoFactor: true,
  singleSignOn: "not-configured",
  sessionTimeoutHours: 12,
  dataRegion: "EU (Frankfurt)",
  auditLogRetentionDays: 365,
};
