import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import type { ProjectRow } from "@/lib/queries";
import { describeDue, formatDate, formatMoney, formatPercent } from "@/lib/format";
import { burnMeterTone, HEALTH_STYLES, RISK_STYLES } from "@/lib/presentation";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";

function RiskCell({ project }: { readonly project: ProjectRow }) {
  if (!project.risk) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge style={RISK_STYLES[project.risk.level]} prefix="Signals" />
      <span className="text-xs tabular-nums text-ink-subtle">{project.risk.score}/100</span>
      {project.risk.optimismGap ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warn-ink">
          <TriangleAlert aria-hidden="true" className="size-3" />
          Reported status optimistic
        </span>
      ) : null}
    </div>
  );
}

function ProgressCell({ project }: { readonly project: ProjectRow }) {
  return (
    <div className="w-full min-w-24">
      <div className="mb-1 flex justify-between text-[11px] tabular-nums text-ink-subtle">
        <span>{formatPercent(project.progress)}</span>
        <span>{formatPercent(project.scheduleElapsed)} time</span>
      </div>
      <Meter
        value={project.progress}
        label={`${project.name} progress`}
        valueText={`${formatPercent(project.progress)} complete, ${formatPercent(project.scheduleElapsed)} of schedule elapsed`}
      />
    </div>
  );
}

function BudgetCell({ project }: { readonly project: ProjectRow }) {
  return (
    <div className="w-full min-w-24">
      <div className="mb-1 flex justify-between text-[11px] tabular-nums text-ink-subtle">
        <span>{formatPercent(project.budgetBurn)}</span>
        <span>{formatMoney(project.budget, { compact: true })}</span>
      </div>
      <Meter
        value={project.budgetBurn}
        tone={burnMeterTone(project.budgetBurn, project.progress)}
        label={`${project.name} budget used`}
        valueText={`${formatPercent(project.budgetBurn)} of ${formatMoney(project.budget)} spent`}
      />
    </div>
  );
}

export function ProjectHealthPanel({
  projects,
  today,
  className,
}: {
  readonly projects: readonly ProjectRow[];
  readonly today: ProjectRow["targetDate"];
  readonly className?: string;
}) {
  return (
    <Panel
      id="initiative-health"
      title="Initiative health"
      description="Owner-reported status next to NEXORA's signal-based risk, highest risk first."
      className={className}
      bodyClassName="px-0 sm:px-0 pb-2"
      action={
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-ink hover:text-brand-ink-strong"
        >
          All initiatives <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      }
    >
      {/* Desktop: a real table for screen-reader navigation by row and column. */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-y border-line text-[11px] uppercase tracking-wider text-ink-subtle">
              <th scope="col" className="px-5 py-2 font-medium">Initiative</th>
              <th scope="col" className="px-3 py-2 font-medium">Progress</th>
              <th scope="col" className="px-3 py-2 font-medium">Budget</th>
              <th scope="col" className="px-3 py-2 font-medium">Reported</th>
              <th scope="col" className="px-3 py-2 font-medium">Signals</th>
              <th scope="col" className="px-5 py-2 text-right font-medium">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {projects.map((project) => (
              <tr key={project.id} className="align-middle transition-colors hover:bg-white/[0.02]">
                <th scope="row" className="min-w-56 px-5 py-3 font-normal">
                  <div className="flex items-center gap-3">
                    <Avatar initials={project.owner.initials} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{project.name}</p>
                      <p className="truncate text-xs text-ink-subtle">
                        {project.code} · {project.owner.name}
                      </p>
                    </div>
                  </div>
                </th>
                <td className="w-36 px-3 py-3">
                  <ProgressCell project={project} />
                </td>
                <td className="w-36 px-3 py-3">
                  <BudgetCell project={project} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge style={HEALTH_STYLES[project.reportedHealth]} prefix="Reported" />
                </td>
                <td className="px-3 py-3">
                  <RiskCell project={project} />
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <p className="text-xs font-medium tabular-nums text-ink">{formatDate(project.targetDate)}</p>
                  <p className="text-[11px] text-ink-subtle">{describeDue(project.targetDate, today)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones and tablets: one card per initiative, same facts. */}
      <ul className="divide-y divide-line border-t border-line lg:hidden">
        {projects.map((project) => (
          <li key={project.id} className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink">{project.name}</p>
                <p className="text-xs text-ink-subtle">
                  {project.code} · {project.owner.name} · {formatDate(project.targetDate, "short")}
                </p>
              </div>
              <StatusBadge style={HEALTH_STYLES[project.reportedHealth]} prefix="Reported" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ProgressCell project={project} />
              <BudgetCell project={project} />
            </div>
            <RiskCell project={project} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
