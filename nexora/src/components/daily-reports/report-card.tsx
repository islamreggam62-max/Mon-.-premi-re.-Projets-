import { CalendarArrowUp, CircleCheck, CircleDot, FlaskConical, OctagonAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReportLine, ReportRow } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { formatHours, formatTime } from "@/lib/format";
import { BLOCKER_STYLES, SUBMISSION_STYLES } from "@/lib/presentation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/** A report shown in the feed; `demo` marks one written in this session. */
export type FeedReport = ReportRow & { readonly demo?: boolean };

function TaskChip({ taskKey }: { readonly taskKey: string | null }) {
  if (!taskKey) return null;
  return (
    <span className="ml-1.5 inline-block rounded bg-white/[0.06] px-1 align-middle font-mono text-[10px] text-ink-subtle">
      {taskKey}
    </span>
  );
}

function Section({
  title,
  icon: Icon,
  iconClass,
  lines,
  empty,
}: {
  readonly title: string;
  readonly icon: LucideIcon;
  readonly iconClass: string;
  readonly lines: readonly ReportLine[];
  readonly empty: string;
}) {
  return (
    <div className="min-w-0">
      <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
        <Icon aria-hidden="true" className={cn("size-3.5", iconClass)} />
        {title}
      </h4>
      {lines.length === 0 ? (
        <p className="mt-1.5 text-xs text-ink-subtle">{empty}</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {lines.map((line) => (
            <li key={line.text} className="text-sm leading-5 text-ink-muted">
              {line.text}
              <TaskChip taskKey={line.taskKey} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReportCard({
  report,
  timeZone,
}: {
  readonly report: FeedReport;
  readonly timeZone: string;
}) {
  const headingId = `report-${report.id}`;
  return (
    <Card aria-labelledby={headingId} className={cn("p-4 sm:p-5", report.demo && "border-brand-soft/40")}>
      <header className="flex flex-wrap items-start gap-3">
        <Avatar initials={report.author.initials} />
        <div className="min-w-0 flex-1">
          <h3 id={headingId} className="text-sm font-semibold text-ink">
            {report.author.name}
          </h3>
          <p className="text-xs text-ink-subtle">
            {report.author.title} · {report.department.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs tabular-nums text-ink-muted">
            <span className="sr-only">Submitted at </span>
            {formatTime(report.submittedAt, timeZone)}
          </span>
          {report.demo ? (
            <Badge tone="brand" icon={FlaskConical}>
              Demo · not saved
            </Badge>
          ) : (
            <StatusBadge style={SUBMISSION_STYLES[report.status]} prefix="Submission" />
          )}
          <Badge tone="neutral">{formatHours(report.hoursLogged)}</Badge>
        </div>
      </header>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Section
          title="Completed"
          icon={CircleCheck}
          iconClass="text-good"
          lines={report.completed}
          empty="Nothing reported"
        />
        <Section
          title="In progress"
          icon={CircleDot}
          iconClass="text-info"
          lines={report.inProgress}
          empty="Nothing reported"
        />
        <div className="min-w-0">
          <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            <OctagonAlert aria-hidden="true" className="size-3.5 text-bad" />
            Blockers
          </h4>
          {report.blockers.length === 0 ? (
            <p className="mt-1.5 text-xs text-ink-subtle">No blockers</p>
          ) : (
            <ul className="mt-1.5 space-y-2">
              {report.blockers.map((blocker) => (
                <li key={blocker.text} className="rounded-lg border border-bad-base/20 bg-bad-base/[0.06] p-2.5">
                  <p className="text-sm leading-5 text-ink">
                    {blocker.text}
                    <TaskChip taskKey={blocker.taskKey} />
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                    <StatusBadge style={BLOCKER_STYLES[blocker.severity]} prefix="Severity" />
                    {blocker.needsHelpFrom ? <span>Needs {blocker.needsHelpFrom.name}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Section
          title="Tomorrow's plan"
          icon={CalendarArrowUp}
          iconClass="text-brand-ink"
          lines={report.tomorrowPlan}
          empty="No plan given"
        />
      </div>
    </Card>
  );
}
