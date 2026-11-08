"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  Circle,
  ClipboardCheck,
  FileSignature,
  FlaskConical,
  FolderKanban,
  Gauge,
  ListChecks,
  Shuffle,
  Stamp,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { DepartmentHealthBadge, DemoBadge, HEALTH_TONE, HealthBadge, SeverityBadge, UrgencyBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { EXECUTIVE_BRIEF } from "@/lib/data/aiPreview";
import { KPI_BASELINES } from "@/lib/data/dashboard";
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
  isTaskOverdue,
  operationalVelocity,
  sortByRisk,
  sortOpenApprovals,
  trendOf,
} from "@/lib/metrics";
import { asOfDay, currentUser } from "@/lib/store/derived";
import type { NexoraData } from "@/lib/store/schema";
import { useNexora } from "@/lib/store/StoreProvider";
import type { ApprovalKind, Kpi } from "@/lib/types";
import { businessDaysBack, cn, dueLabel, formatCompactCurrency, formatLongDate, pluralize } from "@/lib/utils";
import { DataBadge } from "./shared";

const KIND_ICON: Record<ApprovalKind, LucideIcon> = {
  budget: Wallet,
  contract: FileSignature,
  hiring: UserPlus,
  exception: Shuffle,
};

const LINK = "focus-ring inline-flex items-center gap-1 rounded text-xs font-semibold text-violet-300 hover:text-violet-200";

/**
 * The command center. Every figure is computed from the device data. Week-over-
 * week comparisons need history: the sample has hand-written baselines; for a
 * real company only the day-over-day report rate is shown, from real reports.
 */
export function DashboardView() {
  const { data } = useNexora();
  const sample = data.mode === "sample";
  const asOf = asOfDay(data);
  const people = indexById(data.people);
  const previousDay = businessDaysBack(asOf, 2)[1];

  const velocity = operationalVelocity(data.tasks, asOf);
  const openTasks = data.tasks.filter((t) => t.status !== "done").length;
  const pulse = computePulse(data.reports, data.people, asOf);
  const pulseYesterday = computePulse(data.reports, data.people, previousDay);
  const open = sortOpenApprovals(data.approvals.filter((a) => isOpenApproval(a.status)), asOf);
  const overdueApprovals = open.filter((a) => approvalUrgency(a.dueBy, asOf) === "overdue").length;
  const counts = healthCounts(data.projects);

  const kpis: { kpi: Kpi; icon: LucideIcon }[] = [
    {
      icon: Gauge,
      kpi: {
        id: "velocity",
        label: "Operational Velocity",
        value: openTasks ? `${velocity}%` : "—",
        delta: sample ? formatDelta(velocity, KPI_BASELINES.velocityLastWeek, " pts") : "",
        trend: sample ? trendOf(velocity, KPI_BASELINES.velocityLastWeek) : "flat",
        positiveWhenUp: true,
        hint: openTasks ? `Open tasks on schedule${sample ? " · vs. last week" : ` · ${pluralize(openTasks, "open task")}`}` : "No open tasks",
        href: "/tasks",
      },
    },
    {
      icon: FolderKanban,
      kpi: {
        id: "projects",
        label: "Active Projects",
        value: String(data.projects.length),
        delta: sample ? formatDelta(data.projects.length, KPI_BASELINES.activeProjectsQuarterStart) : "",
        trend: sample ? trendOf(data.projects.length, KPI_BASELINES.activeProjectsQuarterStart) : "flat",
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
        value: pulse.expected.length ? `${pulse.rate}%` : "—",
        delta: pulse.expected.length ? formatDelta(pulse.rate, pulseYesterday.rate, " pts") : "",
        trend: trendOf(pulse.rate, pulseYesterday.rate),
        positiveWhenUp: true,
        hint: pulse.expected.length
          ? `${pulse.submitted.length} of ${pulse.expected.length} submitted · vs. yesterday`
          : "Nobody is set to file daily reports",
        href: "/daily-reports",
      },
    },
    {
      icon: Stamp,
      kpi: {
        id: "approvals",
        label: "Pending Approvals",
        value: String(open.length),
        delta: sample ? formatDelta(open.length, KPI_BASELINES.openApprovalsLastWeek) : "",
        trend: sample ? trendOf(open.length, KPI_BASELINES.openApprovalsLastWeek) : "flat",
        positiveWhenUp: false,
        hint: `${overdueApprovals} overdue${sample ? " · vs. last week" : ""}`,
        href: "/approvals",
      },
    },
  ];

  const departments = departmentHealth(data.people, data.projects, data.reports, asOf, DEPARTMENT_ORDER);
  const blockers = collectBlockers(data.reports, asOf);
  const watchlist = sortByRisk(data.projects);
  const firstName = currentUser(data)?.name.split(" ")[0] ?? "";

  return (
    <div>
      <PageHeader
        title="Executive Command Center"
        subtitle={`Welcome back${firstName ? `, ${firstName}` : ""}. Operations as of ${formatLongDate(asOf)}.`}
        action={<DataBadge />}
      />

      {!sample && <GettingStarted data={data} />}

      <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ kpi, icon }) => (
          <StatCard key={kpi.id} kpi={kpi} icon={icon} />
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Department health"
            subtitle="Workload, today's report submission, and owned projects"
            action={
              <Link href="/team" className={LINK}>
                Team <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          {departments.length === 0 ? (
            <CardBody>
              <p className="text-sm text-slate-400">Add team members to see each department&apos;s workload and reports.</p>
            </CardBody>
          ) : (
            <>
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
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          d.reportRate === null ? "text-slate-400" : d.reportRate < 70 ? "text-amber-300" : "text-slate-100",
                        )}
                      >
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
                Critical: a Delayed project or workload ≥ 90%. Watch: an At Risk project, workload ≥ 80%, or report
                submission below 70%.
              </p>
            </>
          )}
        </Card>

        {sample ? <SampleBrief asOf={asOf} /> : <TodayAtAGlance data={data} asOf={asOf} />}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="Critical blockers"
            subtitle={`${pluralize(blockers.length, "blocker")} in today's reports, most severe first`}
            action={
              <Link href="/daily-reports" className={LINK}>
                Reports <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {blockers.length === 0 && <p className="text-sm text-slate-400">No blockers in today&apos;s reports.</p>}
            {blockers.map(({ blocker, report }) => {
              const author = people[report.authorId];
              return (
                <div
                  key={blocker.id}
                  className={cn("rounded-xl border bg-white/[0.02] p-3.5", blocker.severity === "high" ? "border-status-rose/30" : "border-hairline")}
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

        <Card>
          <CardHeader
            title="Pending approvals"
            subtitle={`${pluralize(open.length, "decision")}, most urgent first`}
            action={
              <Link href="/approvals" className={LINK}>
                Queue <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="space-y-2">
            {open.length === 0 && <p className="text-sm text-slate-400">Nothing waiting on a decision.</p>}
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
                  <UrgencyBadge urgency={approvalUrgency(a.dueBy, asOf)} />
                </Link>
              );
            })}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader
            title="Project health"
            subtitle="Riskiest first"
            action={
              <Link href="/projects" className={LINK}>
                Portfolio <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="space-y-1">
            {watchlist.length === 0 && <p className="text-sm text-slate-400">No projects yet.</p>}
            {watchlist.map((p) => (
              <Link key={p.id} href={`/projects#${p.id}`} className="focus-ring -mx-2 block rounded-xl px-2 py-2.5 hover:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-slate-50">{p.name.split(" — ")[0]}</p>
                  <HealthBadge health={p.health} />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar value={p.progress} tone={HEALTH_TONE[p.health]} showLabel label={`${p.name} progress`} className="flex-1" />
                  <span className="w-28 shrink-0 text-right text-xs text-slate-400">{dueLabel(p.targetDate, asOf)}</span>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/** The sample's hand-written brief, labelled as a preview. */
function SampleBrief({ asOf }: { asOf: string }) {
  return (
    <Card className="border-violet/30 bg-violet/[0.06]">
      <CardHeader title="AI Executive Brief" subtitle={`For ${formatLongDate(asOf)}`} action={<DemoBadge label="Preview" />} />
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
          Hand-written preview of the brief format. No AI model is connected.
        </p>
        <Link href="/ai-intelligence" className={LINK}>
          Open AI Intelligence <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardBody>
    </Card>
  );
}

/** Plain counts from the user's records: what needs attention today. No AI involved. */
function TodayAtAGlance({ data, asOf }: { data: NexoraData; asOf: string }) {
  const overdueTasks = data.tasks.filter((t) => isTaskOverdue(t, asOf)).length;
  const blockedTasks = data.tasks.filter((t) => t.status === "blocked").length;
  const dueToday = data.tasks.filter((t) => t.status !== "done" && t.due === asOf).length;
  const open = data.approvals.filter((a) => isOpenApproval(a.status));
  const overdueApprovals = open.filter((a) => approvalUrgency(a.dueBy, asOf) === "overdue").length;
  const pulse = computePulse(data.reports, data.people, asOf);
  const missing = pulse.expected.length - pulse.submitted.length;
  const delayed = data.projects.filter((p) => p.health === "delayed").length;
  const atRisk = data.projects.filter((p) => p.health === "at-risk").length;

  type Item = { label: string; count: number; href: string; tone: "rose" | "amber" };
  const all: Item[] = [
    { label: pluralize(overdueApprovals, "approval") + " past the decision date", count: overdueApprovals, href: "/approvals", tone: "rose" },
    { label: pluralize(overdueTasks, "task") + " overdue", count: overdueTasks, href: "/tasks", tone: "rose" },
    { label: pluralize(delayed, "project") + " delayed", count: delayed, href: "/projects", tone: "rose" },
    { label: pluralize(blockedTasks, "task") + " blocked", count: blockedTasks, href: "/tasks", tone: "amber" },
    { label: pluralize(dueToday, "task") + " due today", count: dueToday, href: "/tasks", tone: "amber" },
    { label: pluralize(atRisk, "project") + " at risk", count: atRisk, href: "/projects", tone: "amber" },
    { label: `${pluralize(missing, "daily report")} not in yet today`, count: missing, href: "/daily-reports", tone: "amber" },
  ];
  const items = all.filter((i) => i.count > 0);

  return (
    <Card>
      <CardHeader title="Needs attention today" subtitle={formatLongDate(asOf)} />
      <CardBody className="space-y-3">
        {items.length === 0 ? (
          <p className="flex items-start gap-2 text-sm text-slate-300">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
            Nothing overdue, blocked, or delayed in your records.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.label}>
                <Link
                  href={i.href}
                  className="focus-ring flex items-center gap-2 rounded-lg border border-hairline bg-white/[0.02] px-3 py-2 text-sm text-slate-100 hover:border-white/20"
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", i.tone === "rose" ? "bg-status-rose" : "bg-status-amber")} aria-hidden="true" />
                  <span className="flex-1">{i.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs leading-relaxed text-slate-400">Counted from your records on this device.</p>
      </CardBody>
    </Card>
  );
}

/** First steps for a new company; hidden once every step is done. */
function GettingStarted({ data }: { data: NexoraData }) {
  const steps: { done: boolean; label: string; href: string }[] = [
    { done: data.people.length > 1, label: "Add your team", href: "/team" },
    { done: data.projects.length > 0, label: "Create a project", href: "/projects" },
    { done: data.tasks.length > 0, label: "Assign a task", href: "/tasks" },
    { done: data.reports.length > 0, label: "Record a daily report", href: "/daily-reports" },
    { done: data.approvals.length > 0, label: "Log an approval request", href: "/approvals" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  return (
    <section aria-labelledby="getting-started" className="glass mb-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="getting-started" className="flex items-center gap-2 text-sm font-semibold text-slate-50">
          <ListChecks className="h-4 w-4 text-violet-300" aria-hidden="true" />
          Set up {data.company.name}
        </h2>
        <span className="text-xs text-slate-400">
          {doneCount} of {steps.length} done
        </span>
      </div>
      <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={cn(
                "focus-ring flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                s.done ? "border-hairline text-slate-400" : "border-violet/30 bg-violet/[0.06] text-slate-100 hover:border-violet/50",
              )}
            >
              {s.done ? (
                <CircleCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
              )}
              <span className={cn(s.done && "line-through")}>{s.label}</span>
              <span className="sr-only">{s.done ? "(done)" : "(to do)"}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-400">
        Everything is saved on this device.{" "}
        <Link href="/settings#data" className="text-violet-300 underline-offset-2 hover:underline">
          Back up your data
        </Link>{" "}
        regularly.
      </p>
    </section>
  );
}
