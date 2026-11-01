/** STATIC DEMONSTRATION DATA — not connected to any backend. See lib/data/meta.ts. */
import type {
  OrganizationProfile,
  PermissionRow,
  RoleDefinition,
  SecurityControl,
} from "@/lib/types";

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
