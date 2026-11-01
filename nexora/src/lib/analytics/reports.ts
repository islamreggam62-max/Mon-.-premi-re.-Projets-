import type {
  ComplianceSnapshot,
  DailyReport,
  DailyReportPolicy,
  ISODate,
  MemberId,
  ReportBlocker,
  ReportingCompliancePoint,
  SubmissionStatus,
  TeamMember,
} from "@/types";
import { compareClockTimes, zonedDateTime } from "@/lib/dates";
import { isAway } from "./team";

/** Members expected to check in on `date`: required roles, not away. */
export function expectedReporters(
  members: readonly TeamMember[],
  policy: DailyReportPolicy,
  date: ISODate,
): TeamMember[] {
  return members.filter(
    (member) => policy.requiredRoles.includes(member.role) && !isAway(member, date),
  );
}

/** On time when submitted on the report date, no later than the deadline. */
export function submissionStatus(
  report: DailyReport | undefined,
  policy: DailyReportPolicy,
  timeZone: string,
): SubmissionStatus {
  if (!report) return "missing";
  const local = zonedDateTime(report.submittedAt, timeZone);
  const sameDay = local.date === report.date;
  return sameDay && compareClockTimes(local.time, policy.deadline) <= 0 ? "on-time" : "late";
}

export function complianceSnapshot(
  members: readonly TeamMember[],
  reports: readonly DailyReport[],
  policy: DailyReportPolicy,
  date: ISODate,
  timeZone: string,
): ComplianceSnapshot {
  const expected = expectedReporters(members, policy, date);
  const byMember = new Map(
    reports.filter((report) => report.date === date).map((report) => [report.memberId, report]),
  );
  const onTime: TeamMember["id"][] = [];
  const late: TeamMember["id"][] = [];
  const missing: TeamMember["id"][] = [];
  for (const member of expected) {
    const status = submissionStatus(byMember.get(member.id), policy, timeZone);
    if (status === "on-time") onTime.push(member.id);
    else if (status === "late") late.push(member.id);
    else missing.push(member.id);
  }
  const submitted = onTime.length + late.length;
  return {
    date,
    expected: expected.map((member) => member.id),
    onTime,
    late,
    missing,
    rate: expected.length > 0 ? (submitted / expected.length) * 100 : 100,
  };
}

/**
 * People named as "needs help from" on more than one blocker, most-needed
 * first. Ties are all returned: picking one would misstate the bottleneck.
 */
export function blockerBottlenecks(
  blockers: readonly ReportBlocker[],
): { readonly memberId: MemberId; readonly count: number }[] {
  const counts = new Map<MemberId, number>();
  for (const blocker of blockers) {
    if (blocker.needsHelpFromId) {
      counts.set(blocker.needsHelpFromId, (counts.get(blocker.needsHelpFromId) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([memberId, count]) => ({ memberId, count }))
    .sort((a, b) => b.count - a.count);
}

/** History plus today's live snapshot, as submission-rate percentages. */
export function complianceTrend(
  history: readonly ReportingCompliancePoint[],
  today: ComplianceSnapshot,
): { readonly date: ISODate; readonly rate: number }[] {
  const past = history
    .filter((point) => point.date < today.date)
    .map((point) => ({
      date: point.date,
      rate: point.expected > 0 ? (point.submitted / point.expected) * 100 : 100,
    }));
  return [...past, { date: today.date, rate: today.rate }];
}
