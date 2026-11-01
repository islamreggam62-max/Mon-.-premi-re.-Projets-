import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  CircleDot,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ActivityChart } from "@/components/charts/activity-chart";
import {
  getKpis,
  getRevenueSeries,
  getActivitySeries,
  getRecentActivity,
  getProjects,
  getApprovals,
  getAiInsights,
} from "@/lib/data";

export default async function DashboardPage() {
  const [kpis, revenueSeries, activitySeries, recentActivity, projects, approvals, aiInsights] =
    await Promise.all([
      getKpis(),
      getRevenueSeries(),
      getActivitySeries(),
      getRecentActivity(),
      getProjects(),
      getApprovals(),
      getAiInsights(),
    ]);

  const topProjects = projects
    .filter((p) => p.status !== "Completed")
    .slice(0, 4);
  const signal = aiInsights[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        description="A single pane of glass across revenue, delivery, people and decisions."
        actions={
          <>
            <Button variant="outline" size="md">
              Last 30 days
            </Button>
            <Button size="md">
              <Sparkles className="h-4 w-4" />
              Ask NEXORA
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Revenue + AI signal */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card sheen className="lg:col-span-2">
          <CardHeader
            title="Revenue vs. Target"
            subtitle="Monthly, in thousands USD"
            action={
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full bg-violet-400" />
                  Revenue
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full bg-info" />
                  Target
                </span>
              </div>
            }
          />
          <CardBody>
            <RevenueChart data={revenueSeries} />
          </CardBody>
        </Card>

        <Card sheen className="flex flex-col">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-300" />
                AI Signal
              </span>
            }
            subtitle="Top recommendation"
            action={<Badge tone="brand">Preview</Badge>}
          />
          <CardBody className="flex flex-1 flex-col">
            {signal ? (
              <>
                <Badge tone="danger" dot className="w-fit">
                  {signal.category}
                </Badge>
                <p className="mt-3 text-sm font-semibold leading-snug text-foreground">
                  {signal.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {signal.detail}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">
                No insights for this workspace yet.
              </p>
            )}
            <div className="mt-auto pt-4">
              {signal ? (
                <>
                  <div className="flex items-center justify-between text-xs text-subtle">
                    <span>Model confidence (illustrative)</span>
                    <span className="font-medium text-muted">
                      {signal.confidence}%
                    </span>
                  </div>
                  <Progress value={signal.confidence} className="mt-2" />
                </>
              ) : null}
              <Link
                href="/ai-intelligence"
                className="nx-focus mt-4 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-violet-300 hover:text-violet-200"
              >
                View all insights
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Activity + recent feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card sheen className="lg:col-span-2">
          <CardHeader
            title="Weekly Activity"
            subtitle="Tasks completed and reports filed"
            action={
              <span className="inline-flex items-center gap-1.5 text-xs text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                +14% vs. last week
              </span>
            }
          />
          <CardBody>
            <ActivityChart data={activitySeries} />
          </CardBody>
        </Card>

        <Card sheen>
          <CardHeader title="Recent Activity" subtitle="Across the workspace" />
          <CardBody className="space-y-4">
            {recentActivity.map((e) => (
              <div key={e.id} className="flex items-start gap-3">
                <Avatar initials={e.initials} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">
                    <span className="font-medium">{e.actor}</span>{" "}
                    <span className="text-muted">{e.action}</span>{" "}
                    <span className="font-medium">{e.target}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-subtle">{e.time}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Projects snapshot + approvals */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card sheen className="lg:col-span-2">
          <CardHeader
            title="Active Projects"
            subtitle="Delivery health at a glance"
            action={
              <Link
                href="/projects"
                className="nx-focus inline-flex items-center gap-1 rounded-lg text-xs font-medium text-violet-300 hover:text-violet-200"
              >
                All projects <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="space-y-4">
            {topProjects.map((p) => {
              const tone =
                p.status === "On track"
                  ? "success"
                  : p.status === "At risk"
                    ? "warning"
                    : "danger";
              return (
                <div key={p.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {p.name}
                      </p>
                      <p className="text-xs text-subtle">{p.client}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden text-xs text-muted sm:inline">
                        {p.progress}%
                      </span>
                      <Badge tone={tone} dot>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={p.progress}
                    tone={
                      tone === "success"
                        ? "brand"
                        : tone === "warning"
                          ? "warning"
                          : "danger"
                    }
                  />
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card sheen>
          <CardHeader
            title="Awaiting Approval"
            subtitle={`${approvals.length} open requests`}
            action={
              <Link
                href="/approvals"
                className="nx-focus inline-flex items-center gap-1 rounded-lg text-xs font-medium text-violet-300 hover:text-violet-200"
              >
                Review <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {approvals.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border/70 bg-surface-2/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="info">{a.type}</Badge>
                  <span className="text-[11px] text-subtle">{a.submitted}</span>
                </div>
                <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                  {a.title}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-subtle">
                  <CircleDot className="h-3 w-3" />
                  {a.requestedBy}
                  {a.amount ? (
                    <span className="ml-auto font-medium text-muted">
                      {a.amount}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
