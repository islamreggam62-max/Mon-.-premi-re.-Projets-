/** STATIC DEMONSTRATION DATA — not connected to any backend. See lib/data/meta.ts. */
import type {
  GovernancePolicy,
  OrganizationProfile,
  PermissionRow,
  RoleDefinition,
  SecurityControl,
} from "@/lib/types";

/** Workspace governance rules (read-only preview; enforced in Phase 2). */
export const GOVERNANCE_POLICIES: GovernancePolicy[] = [
  {
    id: "gov-budget",
    area: "Approvals",
    title: "Budget sign-off thresholds",
    rule: "Up to $25K: department head. $25K–$100K: CEO. Above $100K: CEO and CFO.",
    owner: "Tomás Varga · CFO",
  },
  {
    id: "gov-contract",
    area: "Approvals",
    title: "Contract review",
    rule: "Every contract above $50K needs legal review before executive sign-off.",
    owner: "Amara Okonkwo · CEO",
  },
  {
    id: "gov-hiring",
    area: "Approvals",
    title: "Hiring requests",
    rule: "New roles need the department head and CEO; backfills need the department head only.",
    owner: "Priya Nair · Operations",
  },
  {
    id: "gov-exception",
    area: "Approvals",
    title: "Operational exceptions",
    rule: "Discounts above 20% and deadline changes over two weeks need CEO approval.",
    owner: "Amara Okonkwo · CEO",
  },
  {
    id: "gov-reports",
    area: "Daily reports",
    title: "Submission window",
    rule: "Reports are due by 7:00 PM local time on business days; people on leave are excused.",
    owner: "Priya Nair · Operations",
  },
  {
    id: "gov-escalation",
    area: "Escalation",
    title: "Overdue approvals",
    rule: "Approvals escalate to the approver's manager 24 hours after the due date.",
    owner: "Priya Nair · Operations",
  },
  {
    id: "gov-retention",
    area: "Data",
    title: "Report retention",
    rule: "Daily reports are retained for 24 months, then archived.",
    owner: "Tomás Varga · CFO",
  },
];

export const ORGANIZATION: OrganizationProfile = {
  legalName: "Nexora Technologies, Inc. (demo)",
  displayName: "NEXORA HQ",
  industry: "Enterprise software",
  size: "51–200 employees",
  headquarters: "New York, United States",
  website: "nexora.example",
  fiscalYearStart: "January",
  timezone: "America/New_York (UTC−05:00)",
  locale: "English (United States)",
  currency: "USD — US Dollar",
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  { id: "owner", label: "Owner", description: "Full control, including billing and workspace deletion." },
  { id: "admin", label: "Admin", description: "Manages members, settings, and integrations." },
  { id: "manager", label: "Manager", description: "Runs teams and projects; approves within delegated limits." },
  { id: "member", label: "Member", description: "Executes tasks and submits daily reports." },
  { id: "viewer", label: "Viewer", description: "Read-only access to dashboards and projects." },
];

export const PERMISSIONS: PermissionRow[] = [
  { module: "Dashboard", levels: { owner: "full", admin: "full", manager: "view", member: "view", viewer: "view" } },
  { module: "Team", levels: { owner: "full", admin: "full", manager: "edit", member: "view", viewer: "view" } },
  { module: "Projects", levels: { owner: "full", admin: "full", manager: "edit", member: "edit", viewer: "view" } },
  { module: "Tasks", levels: { owner: "full", admin: "full", manager: "edit", member: "edit", viewer: "view" } },
  { module: "Daily Reports", levels: { owner: "full", admin: "full", manager: "view", member: "edit", viewer: "none" } },
  { module: "Approvals", levels: { owner: "full", admin: "full", manager: "edit", member: "none", viewer: "none" } },
  { module: "AI Intelligence", levels: { owner: "full", admin: "full", manager: "view", member: "none", viewer: "none" } },
  { module: "Settings", levels: { owner: "full", admin: "edit", manager: "none", member: "none", viewer: "none" } },
  { module: "Billing", levels: { owner: "full", admin: "view", manager: "none", member: "none", viewer: "none" } },
];

export const SECURITY_CONTROLS: SecurityControl[] = [
  {
    id: "sso",
    label: "Single sign-on (SAML / OIDC)",
    description: "Require members to sign in through your identity provider.",
    phase: "Phase 2",
  },
  {
    id: "mfa",
    label: "Enforce two-factor authentication",
    description: "Block access for members without a second factor.",
    phase: "Phase 2",
  },
  {
    id: "sessions",
    label: "Session timeout policy",
    description: "Sign members out after a period of inactivity.",
    phase: "Phase 2",
  },
  {
    id: "audit",
    label: "Audit log export",
    description: "Export sign-ins, permission changes, and approvals.",
    phase: "Phase 2",
  },
  {
    id: "ip",
    label: "IP allowlist",
    description: "Restrict workspace access to approved networks.",
    phase: "Phase 3",
  },
  {
    id: "residency",
    label: "Data residency",
    description: "Pin workspace data to a chosen region.",
    phase: "Phase 3",
  },
];
