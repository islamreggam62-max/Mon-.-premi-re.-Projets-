import type { Metadata } from "next";
import { Activity, Building2, Gauge, TriangleAlert } from "lucide-react";
import { DemoBadge } from "@/components/ui/Badge";
import { MiniStat } from "@/components/ui/MiniStat";
import { PageHeader } from "@/components/ui/PageHeader";
import { TeamDirectory } from "@/components/team/TeamDirectory";
import { TEAM } from "@/lib/data/team";
import { workloadBand } from "@/lib/metrics";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  const available = TEAM.filter((p) => p.status !== "on-leave");
  const avgWorkload = Math.round(available.reduce((sum, p) => sum + p.workload, 0) / available.length);
  const overloaded = TEAM.filter((p) => workloadBand(p) === "overloaded").length;
  const active = TEAM.filter((p) => p.status === "active").length;
  const departments = new Set(TEAM.map((p) => p.department)).size;

  return (
    <div>
      <PageHeader
        title="Team & Organization"
        subtitle="Company directory with roles, departments, status, and current workload."
        action={<DemoBadge label="Static demo data" />}
      />

      <section aria-label="Team summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={Activity} label="Active now" value={`${active} / ${TEAM.length}`} hint="people online" />
        <MiniStat icon={Building2} label="Departments" value={String(departments)} />
        <MiniStat icon={Gauge} label="Avg workload" value={`${avgWorkload}%`} hint="excluding leave" />
        <MiniStat
          icon={TriangleAlert}
          label="Overloaded"
          value={String(overloaded)}
          hint="at 90% or above"
          tone={overloaded > 0 ? "rose" : "default"}
        />
      </section>

      <TeamDirectory people={TEAM} />
    </div>
  );
}
