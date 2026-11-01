import { CalendarDays, ListChecks, TriangleAlert } from "lucide-react";
import type { ISODate } from "@/types";
import type { ProjectRow } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { describeDue, formatDate, formatMoney, formatPercent, pluralize } from "@/lib/format";
import {
  burnMeterTone,
  HEALTH_STYLES,
  MILESTONE_STYLES,
  PRIORITY_STYLES,
  PROJECT_STATUS_STYLES,
  RISK_STYLES,
} from "@/lib/presentation";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";

const DOT_TONE = {
  done: "bg-good border-good",
  overdue: "bg-bad border-bad",
  "due-soon": "bg-warn border-warn",
  upcoming: "bg-surface border-mark-muted",
} as const;

export function ProjectCard({ project, today }: { readonly project: ProjectRow; readonly today: ISODate }) {
  const headingId = `project-${project.id}`;
  return (
    <Card aria-labelledby={headingId} className="flex h-full flex-col">
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{project.code}</Badge>
          <StatusBadge style={PROJECT_STATUS_STYLES[project.status]} prefix="Status" />
          <StatusBadge style={PRIORITY_STYLES[project.priority]} prefix="Priority" />
        </div>
        <div>
          <h3 id={headingId} className="text-base font-semibold text-ink">
            {project.name}
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink-muted">{project.summary}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar initials={project.owner.initials} size="sm" />
            <p className="min-w-0 truncate text-xs text-ink-muted">
              <span className="text-ink">{project.owner.name}</span> · {project.department.name}
            </p>
          </div>
          <AvatarStack people={project.team} label="Team" />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <dt className="text-[11px] uppercase tracking-wider text-ink-subtle">Reported</dt>
          <dd className="mt-1">
            <StatusBadge style={HEALTH_STYLES[project.reportedHealth]} />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] uppercase tracking-wider text-ink-subtle">Signals</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-1.5">
            {project.risk ? (
              <>
                <StatusBadge style={RISK_STYLES[project.risk.level]} />
                <span className="text-xs tabular-nums text-ink-subtle">{project.risk.score}/100</span>
              </>
            ) : (
              <span className="text-xs text-ink-subtle">Not scored (closed)</span>
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="flex justify-between text-[11px] uppercase tracking-wider text-ink-subtle">
            <span>Progress</span>
            <span className="normal-case tracking-normal tabular-nums">
              {formatPercent(project.progress)} · {formatPercent(project.scheduleElapsed)} time
            </span>
          </dt>
          <dd className="mt-1.5">
            <Meter
              value={project.progress}
              label={`${project.name} progress`}
              valueText={`${formatPercent(project.progress)} complete with ${formatPercent(project.scheduleElapsed)} of the schedule elapsed`}
            />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="flex justify-between text-[11px] uppercase tracking-wider text-ink-subtle">
            <span>Budget</span>
            <span className="normal-case tracking-normal tabular-nums">
              {formatMoney(project.spent, { compact: true })} / {formatMoney(project.budget, { compact: true })}
            </span>
          </dt>
          <dd className="mt-1.5">
            <Meter
              value={project.budgetBurn}
              tone={burnMeterTone(project.budgetBurn, project.progress)}
              label={`${project.name} budget used`}
              valueText={`${formatPercent(project.budgetBurn)} of the budget spent`}
            />
          </dd>
        </div>
      </dl>

      <div className="flex-1 px-4 py-4 sm:px-5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Milestones</h4>
        <ol className="mt-3 space-y-0">
          {project.milestones.map((milestone, index) => {
            const style = MILESTONE_STYLES[milestone.state];
            const last = index === project.milestones.length - 1;
            return (
              <li key={milestone.id} className="relative flex gap-3 pb-3 last:pb-0">
                {!last ? (
                  <span aria-hidden="true" className="absolute left-[5px] top-3.5 h-full w-px bg-line-strong" />
                ) : null}
                <span
                  aria-hidden="true"
                  className={cn("relative mt-1 size-[11px] shrink-0 rounded-full border-2", DOT_TONE[milestone.state])}
                />
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p
                    className={cn(
                      "min-w-0 text-sm",
                      milestone.state === "done" ? "text-ink-muted" : "text-ink",
                    )}
                  >
                    {milestone.title}
                    <span className="sr-only"> — {style.label}</span>
                  </p>
                  <p className="shrink-0 text-xs tabular-nums text-ink-subtle">
                    {milestone.state === "overdue" ? (
                      <span className="inline-flex items-center gap-1 font-medium text-bad-ink">
                        <TriangleAlert aria-hidden="true" className="size-3" />
                        Missed {formatDate(milestone.dueDate, "short")}
                      </span>
                    ) : milestone.state === "done" && milestone.completedOn ? (
                      `Done ${formatDate(milestone.completedOn, "short")}`
                    ) : (
                      formatDate(milestone.dueDate, "short")
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-ink-muted sm:px-5">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" className="size-3.5 text-ink-subtle" />
          {project.completedOn
            ? `Completed ${formatDate(project.completedOn)}`
            : `${formatDate(project.targetDate)} · ${describeDue(project.targetDate, today)}`}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ListChecks aria-hidden="true" className="size-3.5 text-ink-subtle" />
          {pluralize(project.openTasks, "open task")}
          {project.overdueTasks > 0 ? <span className="text-bad-ink">· {project.overdueTasks} overdue</span> : null}
        </span>
      </div>
    </Card>
  );
}
