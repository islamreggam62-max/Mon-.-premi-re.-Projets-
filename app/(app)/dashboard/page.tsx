import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FileSignature,
  FlaskConical,
  FolderKanban,
  Gauge,
  Shuffle,
  Stamp,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import {
  DemoBadge,
  DepartmentHealthBadge,
  HEALTH_TONE,
  HealthBadge,
  SeverityBadge,
  UrgencyBadge,
} from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { EXECUTIVE_BRIEF } from "@/lib/data/aiPreview";
import { APPROVALS } from "@/lib/data/approvals";
import { DAILY_REPORTS } from "@/lib/data/dailyReports";
import { KPI_BASELINES } from "@/lib/data/dashboard";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { PROJECTS } from "@/lib/data/projects";
import { TASKS } from "@/lib/data/tasks";
import { TEAM } from "@/lib/data/team";
import { APPROVAL_KIND_LABEL, DEPARTMENT_ORDER } from "@/lib/labels";
import {
  approvalUrgency,
  collectBlockers,
  computePulse,
  departmentHealth,
  formatDelta,
  healthCounts,
  indexById,
  isOpenApproval,
  operationalVelocity,
  sortByRisk,
  sortOpenApprovals,
  trendOf,
} from "@/lib/metrics";
import type { ApprovalKind, Kpi } from "@/lib/types";
import { businessDaysBack, cn, dueLabel, formatCompactCurrency, formatLongDate, pluralize } from "@/lib/utils";

const KIND_ICON: Record<ApprovalKind, LucideIcon> = {
  budget: Wallet,
  contract: FileSignature,
  hiring: UserPlus,
  exception: Shuffle,
};

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const people = indexById(TEAM);
  const previousDay = businessDaysBack(DEMO_AS_OF, 2)[1];

  // KPIs — computed from the demo records; only prior-period baselines are hand-written.
  const velocity = operationalVelocity(TASKS, DEMO_AS_OF);
  const pulse = computePulse(DAILY_REPORTS, TEAM, DEMO_AS_OF);
  const pulseYesterday = computePulse(DAILY_REPORTS, TEAM, previousDay);
  const open = sortOpenApprovals(APPROVALS.filter((a) => isOpenApproval(a.status)), DEMO_AS_OF);
  const overdueApprovals = open.filter((a) => approvalUrgency(a.dueBy, DEMO_AS_OF) === "overdue").length;
  const counts = healthCounts(PROJECTS);

  const kpis: { kpi: Kpi; icon: LucideIcon }[] = [
    {
      icon: Gauge,
      kpi: {
        id: "velocity",
        label: "Operational Velocity",
        value: `${velocity}%`,
        delta: formatDelta(velocity, KPI_BASELINES.velocityLastWeek, " pts"),
        trend: trendOf(velocity, KPI_BASELINES.velocityLastWeek),
        positiveWhenUp: true,
        hint: "Open tasks on schedule · vs. last week",
        href: "/tasks",
      },
    },
    {
      icon: FolderKanban,
      kpi: {
        id: "projects",
        label: "Active Projects",
        value: String(PROJECTS.length),
        delta: formatDelta(PROJECTS.length, KPI_BASELINES.activeProjectsQuarterStart),
        trend: trendOf(PROJECTS.length, KPI_BASELINES.activeProjectsQuarterStart),
        positiveWhenUp: true,
        hint: `${counts["on-track"]} on track · ${counts["at-risk"]} at risk · ${counts.delayed} delayed`,
        href: "/projects",
      },
    },
    {
      icon: ClipboardCheck,
      kpi: {
        id: "reports",
        label: "Daily Report Submission",
        value: `${pulse.rate}%`,
        delta: formatDelta(pulse.rate, pulseYesterday.rate, " pts"),
        trend: trendOf(pulse.rate, pulseYesterday.rate),
        positiveWhenUp: true,
        hint: `${pulse.submitted.length} of ${pulse.expected.length} submitted · vs. yesterday`,
        href: "/daily-reports",
      },
    },
    {
      icon: Stamp,
      kpi: {
        id: "approvals",
        label: "Pending Approvals",
        value: String(open.length),
        delta: formatDelta(open.length, KPI_BASELINES.openApprovalsLastWeek),
        trend: trendOf(open.length, KPI_BASELINES.openApprovalsLastWeek),
        positiveWhenUp: false,
        hint: `${overdueApprovals} overdue · vs. last week`,
        href: "/approvals",
      },
    },
  ];

  const departments = departmentHealth(TEAM, PROJECTS, DAILY_REPORTS, DEMO_AS_OF, DEPARTMENT_ORDER);
  const blockers = collectBlockers(DAILY_REPORTS, DEMO_AS_OF);
  const watchlist = sortByRisk(PROJECTS);
  const firstName = (people["u-amara"]?.name ?? "").split(" ")[0];

  return (
    <div>
      <PageHeader
        title="Executive Command Center"
        subtitle={`Welcome back, ${firstName}. Operations as of ${formatLongDate(DEMO_AS_OF)}.`}
        action={<DemoBadge label="Static demo data" />}
      />

      <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ kpi, icon }) => (
          <StatCard key={kpi.id} kpi={kpi} icon={icon} />
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Department health */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Department health"
            subtitle="Workload, today's report submission, and owned projects"
            action={
              <Link href="/team" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-semibold text-violet-300 hover:text-violet-200">
                Team <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <div
            className="hidden border-b border-hairline px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:grid md:grid-cols-[minmax(0,1.2fr)_7.5rem_minmax(0,1.3fr)_6rem_minmax(0,1fr)] md:gap-4"
            aria-hidden="true"
          >
            <span>Department</span>
            <span>Status</span>
            <span>Avg workload</span>
            <span>Reports</span>
            <span>Projects</span>
          </div>
          <ul className="divide-y divide-white/10">
            {departments.map((d) => (
              <li
                key={d.department}
                className="px-5 py-3.5 md:grid md:grid-cols-[minmax(0,1.2fr)_7.5rem_minmax(0,1.3fr)_6rem_minmax(0,1fr)] md:items-center md:gap-4"
              >
                <div className="flex items-center justify-between gap-3 md:block">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">{d.department}</p>
                    <p className="text-xs text-slate-400">
                      {pluralize(d.headcount, "person", "people")}
                      {d.reasons.length > 0 && <> · {d.reasons.join(", ")}</>}
                    </p>
                  </div>
                  <span className="md:hidden">
                    <DepartmentHealthBadge status={d.status} />
                  </span>
                </div>
                <div className="hidden md:block">
                  <DepartmentHealthBadge status={d.status} />
                </div>
                <div className="mt-3 md:mt-0">
                  {d.avgWorkload === null ? (
                    <span className="text-xs text-slate-400">On leave</span>
                  ) : (
                    <ProgressBar
                      value={d.avgWorkload}
                      tone={d.avgWorkload >= 90 ? "rose" : d.avgWorkload >= 80 ? "amber" : "emerald"}
                      showLabel
                      label={`${d.department} average workload`}
                    />
                  )}
                </div>
                <div className="mt-2 text-xs md:mt-0">
                  <span className="text-slate-400 md:hidden">Reports today: </span>
                  <span className={cn("font-semibold tabular-nums", d.reportRate === null ? "text-slate-400" : d.reportRate < 70 ? "text-amber-300" : "text-slate-100")}>
                    {d.reportRate === null ? "Not required" : `${d.reportRate}%`}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 md:mt-0">
                  {d.projects.length === 0 ? (
                    <span className="text-xs text-slate-400">—</span>
                  ) : (
                    d.projects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/projects#${p.id}`}
                        className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-hairline bg-white/[0.03] px-1.5 py-0.5 font-mono text-[11px] text-slate-200 hover:border-white/25"
                        title={`${p.name}: ${p.health}`}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            p.health === "delayed" ? "bg-status-rose" : p.health === "at-risk" ? "bg-status-amber" : "bg-status-emerald",
                          )}
                          aria-hidden="true"
                        />
                        {p.code}
                      </Link>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline px-5 py-3 text-[11px] leading-relaxed text-slate-400">
            Critical: a Delayed project or workload ≥ 90%. Watch: an At Risk project, workload ≥ 80%, or report submission
            below 70%.
          </p>
        </Card>

        {/* AI Executive Brief (preview) */}
        <Card className="border-violet/30 bg-violet/[0.06]">
          <CardHeader
            title="AI Executive Brief"
            subtitle={`For ${formatLongDate(DEMO_AS_OF)}`}
            action={<DemoBadge label="Preview" />}
          />
          <CardBody className="space-y-4">
            <p className="text-sm font-semibold leading-snug text-slate-50">{EXECUTIVE_BRIEF.headline}</p>
            <ul className="space-y-2">
              {EXECUTIVE_BRIEF.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm leading-relaxed text-slate-200">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-soft" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200">Decisions this week</p>
              <ol className="mt-2 space-y-1.5">
                {EXECUTIVE_BRIEF.decisions.map((decision, i) => (
                  <li key={decision} className="flex gap-2 text-sm text-slate-200">
                    <span className="w-4 shrink-0 text-right font-semibold tabular-nums text-violet-200">{i + 1}.</span>
                    {decision}
                  </li>
                ))}
              </ol>
            </div>
            <p className="flex items-start gap-2 rounded-lg border border-hairline bg-base-900/50 px-3 py-2 text-xs text-slate-300">
              <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
              Hand-written preview of the brief format. No AI model is connected in Phase 1.
            </p>
            <Link href="/ai-intelligence" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-semibold text-violet-300 hover:text-violet-200">
              Open AI Intelligence <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Critical blockers */}
        <Card>
          <CardHeader
            title="Critical blockers"
            subtitle={`${pluralize(blockers.length, "blocker")} in today's reports, most severe first`}
            action={
              <Link href="/daily-reports" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-semibold text-violet-300 hover:text-violet-200">
                Reports <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {blockers.map(({ blocker, report }) => {
              const author = people[report.authorId];
              return (
                <div
                  key={blocker.id}
                  className={cn(
                    "rounded-xl border bg-white/[0.02] p-3.5",
                    blocker.severity === "high" ? "border-status-rose/30" : "border-hairline",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-50">{blocker.description}</p>
                    <SeverityBadge severity={blocker.severity} />
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-xs">
                    {author && <Avatar person={author} size="xs" />}
                    <span className="text-slate-200">{author?.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Waiting on {blocker.waitingOn}</p>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Pending approvals */}
        <Card>
          <CardHeader
            title="Pending approvals"
            subtitle={`${open.length} decisions, most urgent first`}
            action={
              <Link href="/approvals" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-semibold text-violet-300 hover:text-violet-200">
                Queue <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="space-y-2">
            {open.slice(0, 5).map((a) => {
              const Icon = KIND_ICON[a.kind];
              const requester = people[a.requestedById];
              return (
                <Link
                  key={a.id}
                  href="/approvals"
                  className="focus-ring flex items-start gap-3 rounded-xl border border-hairline bg-white/[0.02] p-3 hover:border-white/20"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/15 ring-1 ring-inset ring-violet/30">
                    <Icon className="h-4 w-4 text-violet-200" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-slate-50">{a.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-400">
                      {APPROVAL_KIND_LABEL[a.kind]}
                      {a.amount !== undefined && ` · ${formatCompactCurrency(a.amount)}`}
                      {a.headcount !== undefined && ` · ${pluralize(a.headcount, "role")}`}
                      {requester && ` · ${requester.name}`}
                    </span>
                  </span>
                  <UrgencyBadge urgency={approvalUrgency(a.dueBy, DEMO_AS_OF)} />
                </Link>
              );
            })}
          </CardBody>
        </Card>

        {/* Project health */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader
            title="Project health"
            subtitle="Riskiest first"
            action={
              <Link href="/projects" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-semibold text-violet-300 hover:text-violet-200">
                Portfolio <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="space-y-1">
            {watchlist.map((p) => (
              <Link
                key={p.id}
                href={`/projects#${p.id}`}
                className="focus-ring -mx-2 block rounded-xl px-2 py-2.5 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-slate-50">{p.name.split(" — ")[0]}</p>
                  <HealthBadge health={p.health} />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar value={p.progress} tone={HEALTH_TONE[p.health]} showLabel label={`${p.name} progress`} className="flex-1" />
                  <span className="w-28 shrink-0 text-right text-xs text-slate-400">{dueLabel(p.targetDate, DEMO_AS_OF)}</span>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
