import type { ReportingCompliancePoint, WeeklyThroughputPoint } from "@/types";

/**
 * Warehouse-style history for periods before the reference week. The current
 * week is computed from task records (see `lib/analytics/tasks.ts`).
 */
export const weeklyThroughputHistory: readonly WeeklyThroughputPoint[] = [
  { weekStart: "2026-09-07", completed: 6 },
  { weekStart: "2026-09-14", completed: 7 },
  { weekStart: "2026-09-21", completed: 9 },
  { weekStart: "2026-09-28", completed: 7 },
  { weekStart: "2026-10-05", completed: 8 },
  { weekStart: "2026-10-12", completed: 11 },
  { weekStart: "2026-10-19", completed: 8 },
];

/**
 * Daily check-in compliance for the working days before the reference date.
 * The reference date itself is computed from `daily-reports.ts`.
 */
export const reportingComplianceHistory: readonly ReportingCompliancePoint[] = [
  { date: "2026-10-19", expected: 12, submitted: 11, onTime: 10 },
  { date: "2026-10-20", expected: 12, submitted: 12, onTime: 11 },
  { date: "2026-10-21", expected: 12, submitted: 10, onTime: 9 },
  { date: "2026-10-22", expected: 12, submitted: 11, onTime: 10 },
  { date: "2026-10-23", expected: 12, submitted: 9, onTime: 8 },
  { date: "2026-10-26", expected: 11, submitted: 10, onTime: 9 },
  { date: "2026-10-27", expected: 11, submitted: 11, onTime: 9 },
  { date: "2026-10-28", expected: 11, submitted: 10, onTime: 8 },
  { date: "2026-10-29", expected: 11, submitted: 10, onTime: 9 },
];
