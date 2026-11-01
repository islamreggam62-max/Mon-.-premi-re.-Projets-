import type { ISODate } from "./common";

/**
 * Historical aggregates, as a reporting warehouse would provide them. They
 * cover periods *before* the reference date only; the current period is always
 * computed live from entity records so the two never disagree.
 */
export interface WeeklyThroughputPoint {
  /** Monday of the week. */
  readonly weekStart: ISODate;
  readonly completed: number;
}

export interface ReportingCompliancePoint {
  readonly date: ISODate;
  readonly expected: number;
  readonly submitted: number;
  readonly onTime: number;
}
