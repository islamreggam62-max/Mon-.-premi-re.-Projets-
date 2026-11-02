import type { Metadata } from "next";
import { CircleCheck, CircleDollarSign, Clock3, TriangleAlert } from "lucide-react";
import { DemoBadge } from "@/components/ui/Badge";
import { MiniStat } from "@/components/ui/MiniStat";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectPortfolio } from "@/components/projects/ProjectPortfolio";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { PROJECTS } from "@/lib/data/projects";
import { TEAM } from "@/lib/data/team";
import { healthCounts } from "@/lib/metrics";
import { daysUntil, formatCompactCurrency, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  const counts = healthCounts(PROJECTS);
  const budget = PROJECTS.reduce((sum, p) => sum + p.budget, 0);
  const spent = PROJECTS.reduce((sum, p) => sum + p.spent, 0);
  const dueIn30 = PROJECTS.filter((p) => {
    const d = daysUntil(p.targetDate, DEMO_AS_OF);
    return d >= 0 && d <= 30;
  }).length;

  return (
    <div>
      <PageHeader
        title="Strategic Projects"
        subtitle="Portfolio health, progress, owners, and deadlines across every initiative."
        action={<DemoBadge label="Static demo data" />}
      />

      <section aria-label="Portfolio summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={CircleCheck} label="On Track" value={String(counts["on-track"])} tone="emerald" />
        <MiniStat
          icon={TriangleAlert}
          label="At Risk / Delayed"
          value={`${counts["at-risk"]} / ${counts.delayed}`}
          tone="amber"
        />
        <MiniStat icon={Clock3} label="Deadlines in 30 days" value={String(dueIn30)} />
        <MiniStat
          icon={CircleDollarSign}
          label="Budget used"
          value={`${percent(spent, budget)}%`}
          hint={`${formatCompactCurrency(spent)} of ${formatCompactCurrency(budget)}`}
        />
      </section>

      <ProjectPortfolio projects={PROJECTS} people={TEAM} asOf={DEMO_AS_OF} />
    </div>
  );
}
