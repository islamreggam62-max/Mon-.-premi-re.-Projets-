import type {
  ClockTime,
  CurrencyCode,
  ISODate,
  ISODateTime,
  MemberId,
  ModuleKey,
  WorkspaceId,
} from "./common";
import type { RoleKey } from "./team";

export interface Workspace {
  readonly id: WorkspaceId;
  readonly name: string;
  readonly slug: string;
  readonly plan: string;
  /** IANA time zone used for deadlines and timestamps. */
  readonly timeZone: string;
  /** BCP 47 locale used for every number and date format. */
  readonly locale: string;
  readonly currency: CurrencyCode;
  readonly weekStartsOn: "monday" | "sunday";
  /** 1 = January. */
  readonly fiscalYearStartMonth: number;
  /**
   * Reference instant for the demo dataset. Every relative computation
   * ("overdue", "this week", "due today") is anchored here, never to the
   * runtime clock, so pages prerender deterministically.
   */
  readonly asOf: ISODateTime;
  /** Calendar date of `asOf` in the workspace time zone. */
  readonly today: ISODate;
  /** The signed-in member in this demo session. */
  readonly currentUserId: MemberId;
}

export interface DailyReportPolicy {
  /** Local workspace time after which a check-in counts as late. */
  readonly deadline: ClockTime;
  readonly reminderAt: ClockTime;
  /** Roles expected to submit a daily check-in. */
  readonly requiredRoles: readonly RoleKey[];
  readonly escalateAfterMissedDays: number;
}

export const NOTIFICATION_CHANNELS = ["in-app", "email", "slack"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export interface NotificationRule {
  readonly id: `ntf-${string}`;
  readonly label: string;
  readonly description: string;
  readonly channels: readonly NotificationChannel[];
  readonly enabled: boolean;
}

export const PERMISSION_LEVELS = ["full", "limited", "none"] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

export interface PermissionGrant {
  readonly level: PermissionLevel;
  /** What "limited" means for this role, e.g. "Own department". */
  readonly scope: string | null;
}

export interface RoleDefinition {
  readonly key: RoleKey;
  readonly label: string;
  readonly description: string;
}

export interface Permission {
  readonly id: `perm-${string}`;
  readonly module: ModuleKey;
  readonly label: string;
  readonly grants: Readonly<Record<RoleKey, PermissionGrant>>;
}

export const INTEGRATION_CATEGORIES = [
  "communication",
  "identity",
  "productivity",
  "engineering",
  "data",
] as const;
export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

/** Phase 1 ships no live connectors: every integration renders as "not connected". */
export interface Integration {
  readonly id: `int-${string}`;
  readonly name: string;
  readonly category: IntegrationCategory;
  readonly description: string;
}

export interface SecurityPolicy {
  readonly enforceTwoFactor: boolean;
  readonly singleSignOn: "not-configured" | "saml" | "oidc";
  readonly sessionTimeoutHours: number;
  readonly dataRegion: string;
  readonly auditLogRetentionDays: number;
}
