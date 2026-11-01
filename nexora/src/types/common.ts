/**
 * Shared primitives for every NEXORA domain entity.
 *
 * Identifiers are template-literal types: a ProjectId can never be passed
 * where a MemberId is expected, which catches cross-entity wiring mistakes at
 * compile time rather than in the UI.
 */

/** Calendar date, ISO-8601 `YYYY-MM-DD`, read in the workspace time zone. */
export type ISODate = `${number}-${number}-${number}`;

/** Instant with an explicit UTC offset, e.g. `2026-10-30T17:42:00+01:00`. */
export type ISODateTime = `${ISODate}T${string}`;

/** 24-hour wall-clock time, `HH:MM`. */
export type ClockTime = `${number}:${number}`;

export type WorkspaceId = `ws-${string}`;
export type DepartmentId = `dep-${string}`;
export type MemberId = `mbr-${string}`;
export type ProjectId = `prj-${string}`;
export type MilestoneId = `ms-${string}`;
export type TaskId = `tsk-${string}`;
export type DailyReportId = `rpt-${string}`;
export type ApprovalId = `apr-${string}`;

export const CURRENCY_CODES = ["USD", "EUR", "GBP", "AED", "SGD", "DZD"] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export const PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Delivery health on the red/amber/green scale executives already use. */
export const HEALTH_STATUSES = ["on-track", "at-risk", "off-track"] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

/** The eight NEXORA modules. Drives navigation, RBAC and deep links. */
export const MODULE_KEYS = [
  "dashboard",
  "team",
  "projects",
  "tasks",
  "daily-reports",
  "approvals",
  "ai-intelligence",
  "settings",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];
