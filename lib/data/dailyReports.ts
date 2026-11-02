/** STATIC DEMONSTRATION DATA — not connected to any backend. See lib/data/meta.ts. */
import type { DailyReport, ISODate } from "@/lib/types";

/** Full report content for the two most recent business days. */
export const DAILY_REPORTS: DailyReport[] = [
  /* ---- Friday, Oct 30 (demo "today") ---------------------------------- */
  {
    id: "dr-1030-mateo",
    authorId: "u-mateo",
    date: "2026-10-30",
    submittedAt: "2026-10-30T17:42:00Z",
    completed: [
      "Closed the auth load test — p99 under 180 ms at 3× peak",
      "Paired with Hana on billing extraction seams",
    ],
    priorities: [
      "Billing service data-access layer (NEX-101)",
      "Finish billing repository interfaces",
      "Review the failover runbook draft",
    ],
    blockers: [
      {
        id: "b-1030-mateo-1",
        description: "Historical invoice export needed to validate the billing migration",
        waitingOn: "Tomás Varga · Finance",
        severity: "high",
      },
    ],
    energy: 3,
  },
  {
    id: "dr-1030-hana",
    authorId: "u-hana",
    date: "2026-10-30",
    submittedAt: "2026-10-30T18:05:00Z",
    completed: ["Signal ingestion schema submitted for review (NEX-104)"],
    priorities: [
      "Health score data pipeline (NEX-115)",
      "Backfill 12 months of usage data",
      "Address schema review comments",
    ],
    blockers: [
      {
        id: "b-1030-hana-1",
        description: "Staging cluster quota is too low to run failover drills",
        waitingOn: "Liam Fitzgerald · Engineering",
        severity: "medium",
      },
    ],
    energy: 2,
  },
  {
    id: "dr-1030-mei",
    authorId: "u-mei",
    date: "2026-10-30",
    submittedAt: "2026-10-30T16:30:00Z",
    completed: ["Token audit reconciled against live surfaces"],
    priorities: [
      "Core button and badge primitives (NEX-110)",
      "Prepare naming options for a decision",
    ],
    blockers: [
      {
        id: "b-1030-mei-1",
        description: "Token naming convention still undecided — downstream specs on hold",
        waitingOn: "Yuki Tanaka · Design",
        severity: "high",
      },
    ],
    energy: 2,
  },
  {
    id: "dr-1030-priya",
    authorId: "u-priya",
    date: "2026-10-30",
    submittedAt: "2026-10-30T15:55:00Z",
    completed: [
      "Dunning retry policy sent for review (NEX-114)",
      "Customer success capacity model finalized",
    ],
    priorities: ["Beacon outreach sequencing", "Walk Tomás through the audit evidence checklist"],
    blockers: [],
    energy: 4,
  },
  {
    id: "dr-1030-liam",
    authorId: "u-liam",
    date: "2026-10-30",
    submittedAt: "2026-10-30T19:10:00Z",
    completed: [
      "Approved revised service boundaries for billing",
      "Weekly engineering staffing review",
    ],
    priorities: ["Rebalance failover work off Mateo", "Raise the staging quota for Hana"],
    blockers: [],
    energy: 3,
  },
  {
    id: "dr-1030-sana",
    authorId: "u-sana",
    date: "2026-10-30",
    submittedAt: "2026-10-30T17:20:00Z",
    completed: ["Horizon preview UI scope agreed with Design"],
    priorities: [
      "Ranking model evaluation plan",
      "Draft the evaluation rubric with Mateo",
      "Insight card copy (NEX-106)",
    ],
    blockers: [
      {
        id: "b-1030-sana-1",
        description: "Legal review of AI data-processing terms still pending",
        waitingOn: "External counsel",
        severity: "medium",
      },
    ],
    energy: 4,
  },
  {
    id: "dr-1030-tomas",
    authorId: "u-tomas",
    date: "2026-10-30",
    submittedAt: "2026-10-30T16:48:00Z",
    completed: ["Q3 close package shared with the board"],
    priorities: [
      "Audit sign-off evidence checklist (NEX-113)",
      "Send the historical invoice export to Engineering",
    ],
    blockers: [],
    energy: 4,
  },

  /* ---- Thursday, Oct 29 ------------------------------------------------ */
  {
    id: "dr-1029-mateo",
    authorId: "u-mateo",
    date: "2026-10-29",
    submittedAt: "2026-10-29T18:12:00Z",
    completed: ["Billing service boundary diagram updated"],
    priorities: ["Wrap up the auth load test (NEX-103)", "Start the billing data-access layer"],
    blockers: [],
    energy: 4,
  },
  {
    id: "dr-1029-hana",
    authorId: "u-hana",
    date: "2026-10-29",
    submittedAt: "2026-10-29T17:36:00Z",
    completed: ["Health score pipeline schema drafted"],
    priorities: ["Submit the signal ingestion schema for review (NEX-104)"],
    blockers: [],
    energy: 3,
  },
  {
    id: "dr-1029-nadia",
    authorId: "u-nadia",
    date: "2026-10-29",
    submittedAt: "2026-10-29T16:50:00Z",
    completed: ["Third pilot contract countersigned"],
    priorities: ["Pilot customer onboarding flows (NEX-108)", "Kick off onboarding with pilot #3"],
    blockers: [
      {
        id: "b-1029-nadia-1",
        description: "Discount exception for pilot #4 needs executive sign-off",
        waitingOn: "Amara Okonkwo · CEO",
        severity: "medium",
      },
    ],
    energy: 5,
  },
  {
    id: "dr-1029-devon",
    authorId: "u-devon",
    date: "2026-10-29",
    submittedAt: "2026-10-29T15:20:00Z",
    completed: ["Launch landing page wireframe"],
    priorities: ["GA announcement narrative (NEX-107)", "Draft the customer launch email"],
    blockers: [
      {
        id: "b-1029-devon-1",
        description: "Final logo set for GA not yet delivered by Forge",
        waitingOn: "Design team",
        severity: "low",
      },
    ],
    energy: 4,
  },
  {
    id: "dr-1029-yuki",
    authorId: "u-yuki",
    date: "2026-10-29",
    submittedAt: "2026-10-29T14:05:00Z",
    completed: ["Forge recovery plan drafted"],
    priorities: ["Token naming options", "Out of office Friday — back Monday"],
    blockers: [],
    energy: 3,
  },
  {
    id: "dr-1029-priya",
    authorId: "u-priya",
    date: "2026-10-29",
    submittedAt: "2026-10-29T16:10:00Z",
    completed: ["Beacon health score definition signed off"],
    priorities: ["Finalize the customer success capacity model (NEX-117)"],
    blockers: [],
    energy: 4,
  },
];

/**
 * Earlier submission dates (Oct 19–28) per person, used for compliance streaks.
 * Content for these days is not part of the demo; Oct 29–30 come from DAILY_REPORTS.
 */
export const REPORT_HISTORY: Record<string, ISODate[]> = {
  "u-mateo": ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28"],
  "u-hana": ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28"],
  "u-mei": ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-28"],
  "u-priya": ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28"],
  "u-liam": ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28"],
  "u-sana": ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28"],
  "u-tomas": ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28"],
  "u-yuki": ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28"],
  "u-nadia": ["2026-10-19", "2026-10-21", "2026-10-22", "2026-10-26", "2026-10-27", "2026-10-28"],
  "u-devon": ["2026-10-20", "2026-10-23", "2026-10-27"],
};
