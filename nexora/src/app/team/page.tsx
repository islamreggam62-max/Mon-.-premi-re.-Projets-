import type { Metadata } from "next";
import { Building2, Gauge, OctagonAlert, Plane, Users } from "lucide-react";
import { getTeamView } from "@/lib/queries";
import { formatPercent } from "@/lib/format";
import { MiniStat, MiniStatGrid } from "@/components/ui/mini-stat";
import { PageHeader } from "@/components/ui/page-header";
import { DepartmentGrid } from "@/components/team/department-grid";
import { TeamDirectory } from "@/components/team/team-directory";

export const metadata: Metadata = {
  title: "Team",
  description: "Organization directory, departments, roles and workloads.",
};

export default function TeamPage() {
  const view = getTeamView();
  const { stats } = view;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Team"
        description="Who does what, where they sit in the organization and how much capacity they have left this week."
      />
      <MiniStatGrid>
        <MiniStat icon={Users} label="Headcount" value={stats.headcount} context="Including board observer" />
        <MiniStat icon={Building2} label="Departments" value={stats.departments} />
        <MiniStat
          icon={Gauge}
          label="Average utilization"
          value={stats.averageUtilization === null ? "—" : formatPercent(stats.averageUtilization)}
          context="Committed vs. capacity"
        />
        <MiniStat icon={OctagonAlert} label="Over capacity" value={stats.overloaded} context="Above 100% this week" />
        <MiniStat icon={Plane} label="Out of office" value={stats.away} context="Excluded from load" />
      </MiniStatGrid>
      <DepartmentGrid departments={view.departments} />
      <TeamDirectory members={view.members} departments={view.departments} />
    </div>
  );
}
