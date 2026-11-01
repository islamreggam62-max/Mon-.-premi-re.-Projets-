import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  PackageCheck,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { DemoBadge, HealthBadge, HEALTH_TONE, SeverityBadge, UrgencyBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RingProgress } from "@/components/ui/RingProgress";
import { StatCard } from "@/components/ui/StatCard";
import { AI_INSIGHTS } from "@/lib/data/aiPreview";
import { APPROVALS } from "@/lib/data/approvals";
import { DAILY_REPORTS } from "@/lib/data/dailyReports";
import { KPIS } from "@/lib/data/dashboard";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { PROJECTS } from "@/lib/data/projects";
import { TEAM } from "@/lib/data/team";
import { APPROVAL_KIND_LABEL, HEALTH_LABEL, HEALTH_ORDER } from "@/lib/labels";
import {
  approvalUrgency,
  collectBlockers,
  computePulse,
  healthCounts,
  indexById,
  isOpenApproval,
  sortByRisk,
  sortOpenApprovals,
} from "@/lib/metrics";
import type { ApprovalKind, Health, InsightKind } from "@/lib/types";
import { cn, dueLabel, formatCompactCurrency, formatLongDate, formatShortDate, pluralize } from "@/lib/utils";

const KIND_ICON: Record<ApprovalKind, typeof Wallet> = {
  budget: Wallet,
  hiring: UserPlus,
  deliverable: PackageCheck,
};

const INSIGHT_ICON: Record<InsightKind, typeof Wallet> = {
  risk: ShieldAlert,
  opportunity: TrendingUp,
  recommendation: Lightbulb,
};

const HEALTH_SEGMENT: Record<Health, string> = {
  "on-track": "bg-status-emerald",
  "at-risk": "bg-status-amber",
  delayed: "bg-status-rose",
};

export default function DashboardPage() {
  const people = indexById(TEAM);
  const pulse = computePulse(DAILY_REPORTS, TEAM, DEMO_AS_OF);
  const blockers = collectBlockers(DAILY_REPORTS, DEMO_AS_OF);
  const openApprovals = sortOpenApprovals(APPROVALS.filter((a) => isOpenApproval(a.status)), DEMO_AS_OF);
  const counts = healthCounts(PROJECTS);
  const watchlist = sortByRisk(PROJECTS);
  const topInsights = AI_INSIGHTS.slice(0, 2);
  const firstName = (people["u-amara"]?.name ?? "").split(" ")[0];

  return (
    <div>
      <PageHeader
        title="Executive Command Center"
        subtitle={`Welcome back, ${firstName}. The state of the business as of ${formatLongDate(DEMO_AS_OF)}.`}
        action={<DemoBadge label="Static demo data" />}
      />

      {/* KPIs */}
      <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <StatCard key={kpi.id} kpi={kpi} />
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Project health overview */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Project health overview"
            subtitle={`${PROJECTS.length} strategic initiatives, riskiest first`}
            action={
              <Link href="/projects" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-violet-300 hover:text-violet-200">
                Portfolio <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              {HEALTH_ORDER.map((h) =>
                counts[h] > 0 ? (
                  <div
                    key={h}
                    className={HEALTH_SEGMENT[h]}
                    style={{ width: `${(counts[h] / PROJECTS.length) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
              {HEALTH_ORDER.map((h) => (
                <li key={h} className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", HEALTH_SEGMENT[h])} aria-hidden="true" />
                  {HEALTH_LABEL[h]} <span className="font-semibold tabular-nums text-slate-200">{counts[h]}</span>
                </li>
              ))}
            </ul>

            <ul className="mt-5 divide-y divide-white/5">
              {watchlist.map((p) => {
                const owner = people[p.ownerId];
                return (
                  <li key={p.id}>
                    <Link
                      href={`/projects#${p.id}`}
                      className="focus-ring -mx-2 grid grid-cols-1 items-center gap-2 rounded-xl px-2 py-3 hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatShortDate(p.targetDate)} · {dueLabel(p.targetDate)}
                        </p>
                      </div>
                      <ProgressBar
                        value={p.progress}
                        tone={HEALTH_TONE[p.health]}
                        showLabel
                        label={`${p.name} completion`}
                      />
                      <div className="flex items-center gap-2">
                        {owner && <Avatar person={owner} size="xs" />}
                        <span className="truncate text-xs text-slate-400">{owner?.name}</span>
                      </div>
                      <HealthBadge health={p.health} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        {/* Daily report submission pulse */}
        <Card>
          <CardHeader
            title="Daily report pulse"
            subtitle={`Submissions for ${formatShortDate(DEMO_AS_OF)}`}
            action={
              <Link href="/daily-reports" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-violet-300 hover:text-violet-200">
                Reports <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody>
            <div className="flex items-center gap-5">
              <RingProgress
                value={pulse.rate}
                label="Daily report submission rate"
                caption="submitted"
                tone={pulse.rate >= 80 ? "emerald" : pulse.rate >= 60 ? "amber" : "rose"}
              />
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Received</dt>
                  <dd className="font-semibold tabular-nums text-slate-100">
                    {pulse.submitted.length} of {pulse.expected.length} expected
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Blockers raised</dt>
                  <dd className="font-semibold tabular-nums text-rose-300">{pulse.blockerCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Average energy</dt>
                  <dd className="font-semibold tabular-nums text-slate-100">
                    {pulse.avgEnergy === null ? "—" : `${pulse.avgEnergy.toFixed(1)} / 5`}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="mt-5 border-t border-hairline pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Not yet submitted · {pulse.missing.length}
              </p>
              {pulse.missing.length === 0 ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Everyone has reported.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {pulse.missing.map((p) => (
                    <li key={p.id} className="flex items-center gap-2.5">
                      <Avatar person={p} size="xs" />
                      <span className="text-sm text-slate-300">{p.name}</span>
                      <span className="ml-auto truncate text-xs text-slate-500">{p.department}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Active blockers */}
        <Card>
          <CardHeader
            title="Active blockers"
            subtitle={`${pluralize(blockers.length, "blocker")} raised in today's reports`}
          />
          <CardBody className="space-y-3">
            {blockers.map(({ blocker, report }) => {
              const author = people[report.authorId];
              return (
                <div key={blocker.id} className="rounded-xl border border-hairline bg-white/[0.02] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-100">{blocker.description}</p>
                    <SeverityBadge severity={blocker.severity} />
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-xs">
                    {author && <Avatar person={author} size="xs" />}
                    <span className="text-slate-300">{author?.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Waiting on {blocker.waitingOn}</p>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Pending approvals */}
        <Card>
          <CardHeader
            title="Pending approvals"
            subtitle={`${openApprovals.length} decisions awaiting sign-off`}
            action={
              <Link href="/approvals" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-violet-300 hover:text-violet-200">
                Queue <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="space-y-2">
            {openApprovals.slice(0, 5).map((a) => {
              const Icon = KIND_ICON[a.kind];
              const requester = people[a.requestedById];
              return (
                <Link
                  key={a.id}
                  href="/approvals"
                  className="focus-ring flex items-start gap-3 rounded-xl border border-hairline bg-white/[0.02] p-3 hover:border-white/15"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/10 ring-1 ring-inset ring-violet/25">
                    <Icon className="h-4 w-4 text-violet-300" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-slate-100">{a.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
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

        {/* AI preview */}
        <Card className="border-violet/25 bg-violet/[0.05] lg:col-span-2 xl:col-span-1">
          <CardHeader
            title="AI Intelligence"
            subtitle="How executive insights will appear"
            action={<DemoBadge label="Preview" />}
          />
          <CardBody className="space-y-4">
            {topInsights.map((insight) => {
              const KindIcon = INSIGHT_ICON[insight.kind];
              return (
                <div key={insight.id}>
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-violet-300">
                    <KindIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {insight.kind}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{insight.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-400">{insight.body}</p>
                </div>
              );
            })}
            <p className="rounded-lg border border-hairline bg-base-900/40 px-3 py-2 text-xs text-slate-500">
              Static, hand-written preview. No AI model is connected in Phase 1.
            </p>
            <Link href="/ai-intelligence" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-violet-300 hover:text-violet-200">
              Open AI Intelligence <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
