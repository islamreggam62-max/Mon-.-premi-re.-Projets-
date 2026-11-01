/** STATIC DEMONSTRATION DATA — not connected to any backend. See lib/data/meta.ts. */
import type { AppNotification, Kpi } from "@/lib/types";

export const KPIS: Kpi[] = [
  {
    id: "k-arr",
    label: "Annual Recurring Revenue",
    value: "$12.4M",
    delta: "+8.2%",
    trend: "up",
    positiveWhenUp: true,
    hint: "vs. September",
  },
  {
    id: "k-nrr",
    label: "Net Revenue Retention",
    value: "114%",
    delta: "+3 pts",
    trend: "up",
    positiveWhenUp: true,
    hint: "trailing 12 months",
  },
  {
    id: "k-burn",
    label: "Monthly Net Burn",
    value: "$540K",
    delta: "+6.1%",
    trend: "up",
    positiveWhenUp: false,
    hint: "vs. September",
  },
  {
    id: "k-ontime",
    label: "On-time Milestones",
    value: "82%",
    delta: "-4 pts",
    trend: "down",
    positiveWhenUp: true,
    hint: "quarter to date",
  },
];

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
    title: "Launch kit in review",
    detail: "The Summit GA launch kit is waiting for your sign-off.",
    time: "2026-10-29T16:12:00Z",
    href: "/approvals",
  },
];
