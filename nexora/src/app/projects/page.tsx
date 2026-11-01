import type { Metadata } from "next";
import { CircleCheck, FolderKanban, OctagonAlert, TriangleAlert, Wallet } from "lucide-react";
import { getProjectsView } from "@/lib/queries";
import { formatMoney, formatPercent } from "@/lib/format";
import { MiniStat, MiniStatGrid } from "@/components/ui/mini-stat";
import { PageHeader } from "@/components/ui/page-header";
import { MilestoneTracker } from "@/components/projects/milestone-tracker";
import { ProjectPortfolio } from "@/components/projects/project-portfolio";

export const metadata: Metadata = {
  title: "Projects",
  description: "Strategic initiatives, milestone tracking and delivery risk.",
};

export default function ProjectsPage() {
  const view = getProjectsView();
  const { stats } = view;
  const burn = stats.budget.amount > 0 ? (stats.spent.amount / stats.budget.amount) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Portfolio"
        title="Projects"
        description="Strategic initiatives with their milestones, budgets and an independent, signal-based view of delivery risk."
      />
      <MiniStatGrid>
        <MiniStat icon={FolderKanban} label="In flight" value={stats.inFlight} context="Active and planning" />
        <MiniStat icon={OctagonAlert} label="Off track" value={stats.offTrack} context="By signals" />
        <MiniStat icon={TriangleAlert} label="At risk" value={stats.atRisk} context="By signals" />
        <MiniStat icon={CircleCheck} label="Completed" value={stats.completed} context="Delivered and closed" />
        <MiniStat
          icon={Wallet}
          label="Budget in flight"
          value={formatMoney(stats.budget, { compact: true })}
          context={`${formatMoney(stats.spent, { compact: true })} spent (${formatPercent(burn)})`}
        />
      </MiniStatGrid>
      <ProjectPortfolio projects={view.projects} today={view.today} />
      <MilestoneTracker milestones={view.upcomingMilestones} today={view.today} />
    </div>
  );
}
