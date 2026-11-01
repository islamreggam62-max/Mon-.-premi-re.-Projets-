import type { DepartmentId, ISODate, MemberId } from "./common";

export const ROLE_KEYS = ["owner", "executive", "manager", "contributor", "viewer"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export interface Department {
  readonly id: DepartmentId;
  readonly name: string;
  /** Short code used in dense tables, e.g. `OPS`. */
  readonly code: string;
  readonly headId: MemberId;
  readonly mission: string;
}

export interface AvailableStatus {
  readonly status: "available";
}

export interface BusyStatus {
  readonly status: "busy";
  readonly note: string;
}

export interface OutOfOfficeStatus {
  readonly status: "out-of-office";
  /** Last day away (inclusive). */
  readonly until: ISODate;
}

export type Availability = AvailableStatus | BusyStatus | OutOfOfficeStatus;
export type AvailabilityStatus = Availability["status"];

export interface TeamMember {
  readonly id: MemberId;
  readonly name: string;
  readonly title: string;
  readonly email: string;
  readonly departmentId: DepartmentId;
  readonly role: RoleKey;
  readonly managerId: MemberId | null;
  readonly location: string;
  /** IANA time zone, e.g. `Africa/Algiers`. */
  readonly timeZone: string;
  readonly availability: Availability;
  /** Contracted hours per week; 0 for observers who carry no delivery load. */
  readonly weeklyCapacityHours: number;
  /** Hours committed in the current planning week across all initiatives. */
  readonly committedHours: number;
  readonly joinedOn: ISODate;
}
