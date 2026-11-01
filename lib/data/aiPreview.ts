/**
 * STATIC DEMONSTRATION DATA — AI Intelligence preview (Phase 1).
 *
 * Hand-written examples of how NEXORA will present AI output. No model is
 * called and nothing here is generated at runtime. The UI badges every item
 * as a static preview.
 */
import type { AiInsightPreview, BottleneckPreview, ReportSummaryPreview } from "@/lib/types";

export const AI_INSIGHTS: AiInsightPreview[] = [
  {
    id: "ai-1",
    kind: "risk",
    impact: "critical",
    title: "Atlas cutover is the Q4 critical path",
    body: "Billing extraction and the failover runbook both sit with engineers above 90% workload, and the infrastructure budget request is now overdue. A one-week slip would push the multi-region milestone past the Summit GA date.",
    evidence: [
      "Mateo Alvarez at 96% workload",
      "NEX-102 failover runbook is Blocked",
      "Atlas infrastructure budget approval is overdue",
    ],
    module: "Projects",
    href: "/projects#p-atlas",
  },
  {
    id: "ai-2",
    kind: "risk",
    impact: "high",
    title: "Forge delay is now a launch dependency",
    body: "Marketing's GA narrative is waiting on a final logo set from Forge, which is Delayed at 29% after missing its core-primitives milestone. The dependency shows up in daily reports but in neither project plan.",
    evidence: [
      "Forge: 29% complete, 59% of budget spent",
      "Core primitives milestone missed on Oct 26",
      "Devon Carter reported a logo-set blocker on Oct 29",
    ],
    module: "Projects",
    href: "/projects#p-forge",
  },
  {
    id: "ai-3",
    kind: "recommendation",
    impact: "high",
    title: "Decide the ML backfill before the budget request",
    body: "The Horizon backfill reduces key-person risk at no infrastructure cost and is due today. Deciding it ahead of the $85K Atlas request keeps Q1 hiring on plan.",
    evidence: [
      "Senior ML Engineer approval is due today",
      "Ranking model v1 depends on a single engineer",
    ],
    module: "Approvals",
    href: "/approvals",
  },
  {
    id: "ai-4",
    kind: "opportunity",
    impact: "medium",
    title: "Ledger is ahead — free up reviewer time",
    body: "Ledger is 88% complete with only audit sign-off left. Operations has room over the next two weeks to take failover-drill coordination off Engineering.",
    evidence: ["Ledger: 3 of 4 milestones done", "Priya Nair: no open blockers this week"],
    module: "Projects",
    href: "/projects#p-ledger",
  },
  {
    id: "ai-5",
    kind: "risk",
    impact: "medium",
    title: "Energy is lowest where work is blocked",
    body: "Today's two lowest energy scores (2/5) come from people waiting on unresolved decisions — design naming and staging capacity. Low energy tends to precede slips.",
    evidence: [
      "Mei Lin: energy 2/5, blocked on the naming decision",
      "Hana Kowalski: energy 2/5, blocked on staging quota",
    ],
    module: "Daily Reports",
    href: "/daily-reports",
  },
];

export const REPORT_SUMMARIES: ReportSummaryPreview[] = [
  {
    id: "rs-1030",
    date: "2026-10-30",
    headline: "Engineering is absorbing the Atlas crunch; Design is waiting on one decision.",
    highlights: [
      "The auth service load test closed with p99 under 180 ms at 3× peak.",
      "The Ledger audit checklist and Q3 close package are on track.",
      "Product and Design agreed the Horizon preview UI scope.",
    ],
    watchItems: [
      "Billing migration validation is waiting on Finance's invoice export.",
      "Forge primitives are stalled pending the token naming decision.",
      "Staging quota is preventing failover drills.",
    ],
  },
  {
    id: "rs-1029",
    date: "2026-10-29",
    headline: "Commercial momentum is strong; launch assets depend on Forge.",
    highlights: [
      "The third Summit pilot contract was countersigned.",
      "The Beacon health-score definition was signed off.",
      "A Forge recovery plan was drafted.",
    ],
    watchItems: [
      "The pilot #4 discount exception needs CEO sign-off.",
      "The final logo set for GA has not been delivered.",
    ],
  },
];

export const BOTTLENECKS: BottleneckPreview[] = [
  {
    id: "bn-1",
    severity: "critical",
    title: "Key-person load in Engineering",
    area: "People",
    signal: "2 engineers above 90% workload own 4 critical or high tasks",
    detail:
      "Mateo Alvarez and Hana Kowalski own billing extraction, the failover runbook, and the health-score pipeline across two projects.",
    affectedIds: ["u-mateo", "u-hana"],
    suggestedAction:
      "Move failover-drill coordination to Operations and pause NEX-105 until billing extraction lands.",
  },
  {
    id: "bn-2",
    severity: "high",
    title: "Undecided token naming convention",
    area: "Decision",
    signal: "1 overdue decision blocking 2 tasks and 1 milestone",
    detail:
      "NEX-111 is overdue and its owner is away; NEX-110 and the Forge core-primitives milestone are waiting on it.",
    affectedIds: ["u-yuki", "u-mei"],
    suggestedAction: "Delegate the decision to Mei Lin with a 48-hour deadline.",
  },
  {
    id: "bn-3",
    severity: "high",
    title: "Approval queue latency",
    area: "Approvals",
    signal: "1 overdue, 3 due within 3 days",
    detail: "Budget and hiring decisions are clustering at the end of the week.",
    affectedIds: ["u-amara"],
    suggestedAction: "Hold a 20-minute decision block on Monday morning.",
  },
  {
    id: "bn-4",
    severity: "medium",
    title: "Cross-team data handoff",
    area: "Dependencies",
    signal: "A Finance export is gating an Engineering migration",
    detail:
      "Billing migration validation needs the historical invoice export, which Finance has scheduled for Monday.",
    affectedIds: ["u-tomas", "u-mateo"],
    suggestedAction: "Agree on a partial export today to unblock validation.",
  },
];
