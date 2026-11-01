import type { DailyReport } from "@/types";

/** Check-ins submitted on the reference date (Friday 30 October 2026). */
export const dailyReports: readonly DailyReport[] = [
  {
    id: "rpt-20261030-claire",
    memberId: "mbr-claire",
    date: "2026-10-30",
    submittedAt: "2026-10-30T17:05:00+01:00",
    completed: [
      { text: "Travel policy update approved and published", taskId: "tsk-1403" },
      { text: "Board pack outline circulated to the executive committee", taskId: null },
    ],
    inProgress: [{ text: "Recruiting partner RFP — vendor longlist drafted", taskId: "tsk-1603" }],
    blockers: [],
    tomorrowPlan: [
      { text: "Consolidate executive-committee pre-reads for Monday", taskId: null },
      { text: "Brief Amina on the Atlas contingency request", taskId: null },
    ],
    hoursLogged: 8.5,
  },
  {
    id: "rpt-20261030-priya",
    memberId: "mbr-priya",
    date: "2026-10-30",
    submittedAt: "2026-10-30T16:55:00+01:00",
    completed: [
      { text: "Reviewed UAT scripts with Finance key users", taskId: "tsk-1105" },
      { text: "Sprint review for the Helios and Atlas squads", taskId: null },
    ],
    inProgress: [{ text: "Accessibility fixes — 14 of 22 issues resolved", taskId: "tsk-1203" }],
    blockers: [],
    tomorrowPlan: [
      { text: "Security-review dry run for Helios", taskId: null },
      { text: "Rebalance Mateo's Atlas tickets across the squad", taskId: "tsk-1102" },
    ],
    hoursLogged: 8,
  },
  {
    id: "rpt-20261030-fatima",
    memberId: "mbr-fatima",
    date: "2026-10-30",
    submittedAt: "2026-10-30T16:40:00+01:00",
    completed: [{ text: "Interview scorecards finalized for six role families", taskId: "tsk-1604" }],
    inProgress: [{ text: "Hiring budget model — Engineering and Revenue inputs received", taskId: "tsk-1602" }],
    blockers: [],
    tomorrowPlan: [{ text: "Review the Senior Data Engineer request with Priya", taskId: null }],
    hoursLogged: 7.5,
  },
  {
    id: "rpt-20261030-karim",
    memberId: "mbr-karim",
    date: "2026-10-30",
    submittedAt: "2026-10-30T17:15:00+01:00",
    completed: [{ text: "Recalibrated 40 of 64 warehouse sensors", taskId: "tsk-1501" }],
    inProgress: [{ text: "IoT pilot data-quality report", taskId: "tsk-1501" }],
    blockers: [
      {
        text: "Vendor master cleansing stalled: 112 suppliers are missing tax IDs",
        taskId: "tsk-1104",
        severity: "high",
        needsHelpFromId: "mbr-lina",
      },
    ],
    tomorrowPlan: [{ text: "Finish sensor recalibration at the Oran hub", taskId: "tsk-1501" }],
    hoursLogged: 8,
  },
  {
    id: "rpt-20261030-mei",
    memberId: "mbr-mei",
    date: "2026-10-30",
    submittedAt: "2026-10-30T17:30:00+01:00",
    completed: [{ text: "Savings tracker added to the monthly close pack", taskId: "tsk-1405" }],
    inProgress: [
      { text: "Chart of accounts sign-off — two entities left", taskId: "tsk-1110" },
      { text: "SaaS license consolidation — 61% of seats reviewed", taskId: "tsk-1401" },
    ],
    blockers: [
      {
        text: "Two carriers refuse to reopen rates before Q1, so wave-1 savings are at risk",
        taskId: "tsk-1402",
        severity: "medium",
        needsHelpFromId: "mbr-youssef",
      },
    ],
    tomorrowPlan: [{ text: "Agree GL reconciliation tolerances with Nour for dry run #2", taskId: "tsk-1101" }],
    hoursLogged: 9,
  },
  {
    id: "rpt-20261030-lina",
    memberId: "mbr-lina",
    date: "2026-10-30",
    submittedAt: "2026-10-30T17:48:00+01:00",
    completed: [{ text: "October carrier scorecards shared with Finance", taskId: null }],
    inProgress: [{ text: "Carrier renegotiation — 8 of 10 agreed in principle", taskId: "tsk-1402" }],
    blockers: [
      {
        text: "Customs broker agreement still awaiting Legal sign-off; the hub rollout plan cannot start",
        taskId: "tsk-1504",
        severity: "high",
        needsHelpFromId: "mbr-thomas",
      },
    ],
    tomorrowPlan: [
      { text: "Escalate the two carriers refusing to reopen rates", taskId: "tsk-1402" },
      { text: "Sequence the hub rollout with Youssef", taskId: "tsk-1505" },
    ],
    hoursLogged: 9.5,
  },
  {
    id: "rpt-20261030-nour",
    memberId: "mbr-nour",
    date: "2026-10-30",
    submittedAt: "2026-10-30T17:52:00+01:00",
    completed: [{ text: "Traced 9 points of the missing ETA events to a time-zone bug", taskId: "tsk-1502" }],
    inProgress: [{ text: "GL balance reconciliation for dry run #2", taskId: "tsk-1101" }],
    blockers: [
      {
        text: "Dry run #2 cannot start until reconciliation tolerances are agreed with Finance",
        taskId: "tsk-1107",
        severity: "high",
        needsHelpFromId: "mbr-mei",
      },
    ],
    tomorrowPlan: [
      { text: "Ship the ETA time-zone fix to staging", taskId: "tsk-1502" },
      { text: "Pair with Mei on tolerance thresholds", taskId: "tsk-1101" },
    ],
    hoursLogged: 9,
  },
  {
    id: "rpt-20261030-hugo",
    memberId: "mbr-hugo",
    date: "2026-10-30",
    submittedAt: "2026-10-30T18:22:00+01:00",
    completed: [{ text: "Load test passed at 5,000 concurrent sessions", taskId: "tsk-1206" }],
    inProgress: [{ text: "Pen-test remediation — session handling", taskId: "tsk-1201" }],
    blockers: [
      {
        text: "Control tower alerts need data-quality sign-off on the IoT pilot",
        taskId: "tsk-1503",
        severity: "medium",
        needsHelpFromId: "mbr-youssef",
      },
    ],
    tomorrowPlan: [{ text: "Role mapping for the first 120 ERP accounts", taskId: "tsk-1103" }],
    hoursLogged: 8.5,
  },
  {
    id: "rpt-20261030-ines",
    memberId: "mbr-ines",
    date: "2026-10-30",
    submittedAt: "2026-10-30T18:41:00+01:00",
    completed: [{ text: "First-pass review of the customs broker data-sharing clauses", taskId: "tsk-1504" }],
    inProgress: [{ text: "Policy attestation workflow — Finance pilot", taskId: "tsk-1701" }],
    blockers: [
      {
        text: "Licensing authority requires notarized board resolutions (about five working days)",
        taskId: "tsk-1301",
        severity: "high",
        needsHelpFromId: "mbr-thomas",
      },
    ],
    tomorrowPlan: [{ text: "Prepare the notarization pack with Thomas", taskId: "tsk-1301" }],
    hoursLogged: 9.5,
  },
];
