import Link from "next/link";
import { ArrowRight, CircleCheck, Sparkles } from "lucide-react";
import type { ExecutiveBriefing, ISODate } from "@/types";
import type { ApprovalRow, MilestoneRow, WorkloadRow } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { describeDue, formatDate, formatMoney, formatPercent } from "@/lib/format";
import {
  CATEGORY_STYLES,
  MILESTONE_STYLES,
  SLA_STYLES,
  WORKLOAD_STYLES,
  workloadMeterTone,
} from "@/lib/presentation";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, StatusText } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { EmptyState } from "@/components/ui/notice";
import { MODULE_HREFS } from "@/components/shell/nav-items";

const linkClass =
  "inline-flex items-center gap-1 text-xs font-medium text-brand-ink hover:text-brand-ink-strong";

export function MyApprovalsPanel({
  rows,
  total,
  today,
}: {
  readonly rows: readonly ApprovalRow[];
  readonly total: number;
  readonly today: ISODate;
}) {
  return (
    <Panel
      id="my-approvals"
      title="Awaiting your decision"
      description={`${total} pending, most urgent first.`}
      action={
        <Link href="/approvals" className={linkClass}>
          Queue <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon={CircleCheck} title="Inbox zero" description="No approvals are waiting for you." />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map(({ request, requester, sla }) => {
            const category = CATEGORY_STYLES[request.details.category];
            const CategoryIcon = category.icon;
            return (
              <li key={request.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-inset ring-white/10">
                  <CategoryIcon aria-hidden="true" className="size-4 text-ink-muted" />
                  <span className="sr-only">{category.label}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-5 text-ink">{request.title}</p>
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {request.reference} · {requester.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {sla ? <StatusBadge style={SLA_STYLES[sla]} prefix="Deadline" /> : null}
                    <span className="text-[11px] text-ink-subtle">{describeDue(request.decisionDueBy, today)}</span>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                  {request.amount ? formatMoney(request.amount, { compact: true }) : "—"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function CapacityPanel({ rows }: { readonly rows: readonly WorkloadRow[] }) {
  return (
    <Panel
      id="capacity"
      title="Highest workloads"
      description="Committed hours against weekly capacity."
      action={
        <Link href="/team" className={linkClass}>
          Team <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      }
    >
      <ul className="space-y-3.5">
        {rows.map((row) => (
          <li key={row.member.id} className="flex items-center gap-3">
            <Avatar initials={row.member.initials} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm text-ink">{row.member.name}</p>
                <p className="shrink-0 text-xs font-semibold tabular-nums text-ink">
                  {row.utilization === null ? "—" : formatPercent(row.utilization)}
                </p>
              </div>
              <Meter
                className="mt-1.5"
                value={row.utilization ?? 0}
                tone={workloadMeterTone(row.band)}
                label={`${row.member.name} utilization`}
                valueText={`${formatPercent(row.utilization ?? 0)} of capacity: ${row.committedHours} of ${row.capacityHours} hours`}
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-ink-subtle">
                  {row.department.code} · {row.committedHours} h / {row.capacityHours} h
                </span>
                {row.band ? <StatusText style={WORKLOAD_STYLES[row.band]} className="text-[11px]" /> : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function MilestonesPanel({
  rows,
  today,
}: {
  readonly rows: readonly MilestoneRow[];
  readonly today: ISODate;
}) {
  return (
    <Panel
      id="milestones"
      title="Milestones: missed and next 21 days"
      description="Checkpoints across initiatives in flight."
      action={
        <Link href="/projects" className={linkClass}>
          Tracker <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="Nothing due" description="No milestones are due in the next three weeks." />
      ) : (
        <ol className="space-y-1">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.03]"
            >
              <time
                dateTime={row.dueDate}
                className={cn(
                  "w-14 shrink-0 text-xs font-semibold tabular-nums",
                  row.state === "overdue" ? "text-bad-ink" : "text-ink",
                )}
              >
                {formatDate(row.dueDate, "short")}
              </time>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{row.title}</p>
                <p className="truncate text-[11px] text-ink-subtle">
                  {row.project.code} · {describeDue(row.dueDate, today)}
                </p>
              </div>
              <StatusBadge style={MILESTONE_STYLES[row.state]} />
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function BriefingPanel({ briefing }: { readonly briefing: ExecutiveBriefing }) {
  return (
    <Panel
      id="briefing"
      title={
        <span className="inline-flex items-center gap-1.5">
          <Sparkles aria-hidden="true" className="size-4 text-brand-ink" />
          Executive briefing
        </span>
      }
      description="Synthesized from workspace signals (demo mode, rule-based)."
      className="relative overflow-hidden bg-[linear-gradient(135deg,rgb(124_58_237/0.14),transparent_55%)]"
      action={
        <Link href="/ai-intelligence" className={linkClass}>
          Full analysis <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      }
    >
      <p className="text-base font-semibold leading-6 text-ink">{briefing.headline}</p>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{briefing.paragraphs[0]}</p>
      {briefing.decisions.length > 0 ? (
        <>
          <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Decisions needed
          </h3>
          <ol className="mt-2 space-y-2">
            {briefing.decisions.map((decision, index) => (
              <li key={decision.title}>
                <Link
                  href={MODULE_HREFS[decision.module]}
                  className="flex gap-3 rounded-lg border border-line bg-canvas/40 p-2.5 transition-colors hover:border-brand-soft/40"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-soft/15 text-[11px] font-semibold text-brand-ink-strong"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm leading-5 text-ink">{decision.title}</span>
                    <span className="block text-xs text-ink-subtle">{decision.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </Panel>
  );
}
