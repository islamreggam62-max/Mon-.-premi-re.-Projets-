/** STATIC DEMONSTRATION DATA — not connected to any backend. See lib/data/meta.ts. */
import type { AppNotification, KpiBaselines } from "@/lib/types";

/**
 * Prior-period values for KPI deltas. Current values are computed from the
 * demo records (tasks, projects, reports, approvals); only these baselines
 * are hand-written, because the demo does not model weekly history.
 */
export const KPI_BASELINES: KpiBaselines = {
  velocityLastWeek: 85,
  activeProjectsQuarterStart: 5,
  openApprovalsLastWeek: 4,
};

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "n-1",
    tone: "critical",
    title: "Approval overdue",
    detail: "Atlas infrastructure budget ($85K) passed its due date.",
    time: "2026-10-30T08:05:00Z",
    href: "/approvals",
  },
  {
    id: "n-2",
    tone: "warning",
    title: "Forge marked Delayed",
    detail: "The core primitives milestone was missed on Oct 26.",
    time: "2026-10-30T07:40:00Z",
    href: "/projects#p-forge",
  },
  {
    id: "n-3",
    tone: "warning",
    title: "3 daily reports missing",
    detail: "Yuki Tanaka, Nadia Benali, and Devon Carter haven't submitted today.",
    time: "2026-10-30T19:30:00Z",
    href: "/daily-reports",
  },
  {
    id: "n-4",
    tone: "info",
    title: "Reseller agreement in review",
    detail: "The Helix Partners agreement ($240K) is waiting for your sign-off.",
    time: "2026-10-29T16:12:00Z",
    href: "/approvals",
  },
];
