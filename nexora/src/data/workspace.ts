import type { DailyReportPolicy, Workspace } from "@/types";

/**
 * Demo workspace. "Meridian Holdings" is fictional; e-mail addresses use the
 * reserved `.example` domain (RFC 2606).
 */
export const workspace: Workspace = {
  id: "ws-meridian",
  name: "Meridian Holdings",
  slug: "meridian",
  plan: "Enterprise · Phase 1 preview",
  timeZone: "Africa/Algiers",
  locale: "en-US",
  currency: "USD",
  weekStartsOn: "monday",
  fiscalYearStartMonth: 1,
  asOf: "2026-10-30T19:00:00+01:00",
  today: "2026-10-30",
  currentUserId: "mbr-amina",
};

export const dailyReportPolicy: DailyReportPolicy = {
  deadline: "18:00",
  reminderAt: "17:30",
  requiredRoles: ["manager", "contributor"],
  escalateAfterMissedDays: 2,
};
