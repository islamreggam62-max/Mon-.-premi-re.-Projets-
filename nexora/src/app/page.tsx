import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getDashboardView } from "@/lib/queries";
import { zonedDateTime } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { AlertList } from "@/components/dashboard/alert-list";
import {
  BriefingPanel,
  CapacityPanel,
  MilestonesPanel,
  MyApprovalsPanel,
} from "@/components/dashboard/panels";
import { ProjectHealthPanel } from "@/components/dashboard/project-health";
import { ThroughputChart } from "@/components/dashboard/throughput-chart";
import { buttonClass } from "@/components/ui/controls";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { MODULE_HREFS } from "@/components/shell/nav-items";

export const metadata: Metadata = {
  // The layout's title template only applies to child segments, not to this page.
  title: { absolute: "Command Center · NEXORA" },
  description: "Executive command center: KPIs, initiative health, alerts and decisions.",
};

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const view = getDashboardView();
  const hour = Number(zonedDateTime(view.asOf, view.timeZone).time.slice(0, 2));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Executive Command Center"
        title={`${greeting(hour)}, ${view.firstName}`}
        description={`${formatDate(view.today, "long")}. Portfolio health, execution and the decisions waiting on you.`}
        actions={
          <Link href="/ai-intelligence" className={buttonClass("primary")}>
            <Sparkles aria-hidden="true" className="size-4" />
            Executive briefing
          </Link>
        }
      />

      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Key indicators
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
          {view.kpis.map((kpi) => (
            <StatTile key={kpi.id} kpi={kpi} href={MODULE_HREFS[kpi.module]} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <BriefingPanel briefing={view.briefing} />
        <AlertList alerts={view.alerts} />
      </div>

      <ProjectHealthPanel projects={view.projects} today={view.today} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ThroughputChart bars={view.throughput} />
        <MyApprovalsPanel rows={view.myApprovals} total={view.myApprovalsTotal} today={view.today} />
        <CapacityPanel rows={view.capacity} />
        <MilestonesPanel rows={view.milestones} today={view.today} />
      </div>
    </div>
  );
}
