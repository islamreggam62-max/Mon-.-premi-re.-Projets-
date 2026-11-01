import type { ActivityEntry, Alert, Kpi } from "@/lib/types";

export const KPIS: Kpi[] = [
  {
    id: "k-arr",
    label: "Annual Recurring Revenue",
    value: "$12.4M",
    delta: "+8.2%",
    trend: "up",
    positiveWhenUp: true,
  },
  {
    id: "k-nrr",
    label: "Net Revenue Retention",
    value: "114%",
    delta: "+3 pts",
    trend: "up",
    positiveWhenUp: true,
  },
  {
    id: "k-burn",
    label: "Monthly Net Burn",
    value: "$540K",
    delta: "+6.1%",
    trend: "up",
    positiveWhenUp: false,
  },
  {
    id: "k-velocity",
    label: "Delivery Velocity",
    value: "92 pts",
    delta: "-4.0%",
    trend: "down",
    positiveWhenUp: true,
  },
];

export const ALERTS: Alert[] = [
  {
    id: "al-1",
    severity: "critical",
    title: "Atlas at risk of Q4 slip",
    detail: "Billing extraction and failover both depend on one engineer at 94%.",
    source: "AI Intelligence",
    timestamp: "2026-10-31T16:40:00Z",
  },
  {
    id: "al-2",
    severity: "warning",
    title: "Forge off-track (29%)",
    detail: "Design system blocking the Summit GA logo set.",
    source: "Projects",
    timestamp: "2026-10-31T14:10:00Z",
  },
  {
    id: "al-3",
    severity: "warning",
    title: "3 approvals due within 5 days",
    detail: "Infra budget, ML backfill, and a Forge deadline exception are pending.",
    source: "Approvals",
    timestamp: "2026-10-31T09:05:00Z",
  },
  {
    id: "al-4",
    severity: "info",
    title: "Ledger nearing completion",
    detail: "Only audit sign-off remains before close.",
    source: "Projects",
    timestamp: "2026-10-30T18:30:00Z",
  },
];

export const ACTIVITY: ActivityEntry[] = [
  {
    id: "ac-1",
    actorId: "u-mateo",
    action: "completed task",
    target: "Auth service load testing",
    timestamp: "2026-10-31T17:02:00Z",
  },
  {
    id: "ac-2",
    actorId: "u-nadia",
    action: "submitted approval",
    target: "Enterprise discount exception — pilot #3",
    timestamp: "2026-10-31T15:20:00Z",
  },
  {
    id: "ac-3",
    actorId: "u-hana",
    action: "moved to review",
    target: "Signal ingestion event schema",
    timestamp: "2026-10-31T13:48:00Z",
  },
  {
    id: "ac-4",
    actorId: "u-eli",
    action: "filed daily report",
    target: "Oct 31 check-in",
    timestamp: "2026-10-31T11:15:00Z",
  },
  {
    id: "ac-5",
    actorId: "u-tomas",
    action: "approved procurement",
    target: "Enterprise observability platform",
    timestamp: "2026-10-30T19:00:00Z",
  },
];
