"use client";

import { useState } from "react";
import { CircleCheck, CircleDollarSign, Clock3, FolderKanban, TriangleAlert } from "lucide-react";
import { ProjectFormDialog } from "@/components/forms/ProjectForm";
import { ProjectPortfolio } from "@/components/projects/ProjectPortfolio";
import { EmptyState } from "@/components/ui/EmptyState";
import { MiniStat } from "@/components/ui/MiniStat";
import { PageHeader } from "@/components/ui/PageHeader";
import { healthCounts } from "@/lib/metrics";
import { asOfDay } from "@/lib/store/derived";
import { useNexora } from "@/lib/store/StoreProvider";
import type { Project } from "@/lib/types";
import { daysUntil, formatCompactCurrency, percent } from "@/lib/utils";
import { HeaderActions, NewButton } from "./shared";

export function ProjectsView() {
  const { data } = useNexora();
  const [editing, setEditing] = useState<Project | "new" | null>(null);
  const asOf = asOfDay(data);
  const projects = data.projects;

  const counts = healthCounts(projects);
  const budget = projects.reduce((sum, p) => sum + p.budget, 0);
  const spent = projects.reduce((sum, p) => sum + p.spent, 0);
  const dueIn30 = projects.filter((p) => {
    const d = daysUntil(p.targetDate, asOf);
    return d >= 0 && d <= 30;
  }).length;

  return (
    <div>
      <PageHeader
        title="Strategic Projects"
        subtitle="Portfolio health, progress, owners, and deadlines across every initiative."
        action={<HeaderActions label="New project" onNew={() => setEditing("new")} />}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Add your strategic initiatives with an owner, a target date, a budget, and milestones."
          action={<NewButton label="New project" onClick={() => setEditing("new")} />}
        />
      ) : (
        <>
          <section aria-label="Portfolio summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MiniStat icon={CircleCheck} label="On Track" value={String(counts["on-track"])} tone="emerald" />
            <MiniStat icon={TriangleAlert} label="At Risk / Delayed" value={`${counts["at-risk"]} / ${counts.delayed}`} tone="amber" />
            <MiniStat icon={Clock3} label="Deadlines in 30 days" value={String(dueIn30)} />
            <MiniStat
              icon={CircleDollarSign}
              label="Budget used"
              value={budget > 0 ? `${percent(spent, budget)}%` : "—"}
              hint={budget > 0 ? `${formatCompactCurrency(spent)} of ${formatCompactCurrency(budget)}` : "no budget entered"}
            />
          </section>
          <ProjectPortfolio projects={projects} people={data.people} asOf={asOf} onEdit={setEditing} />
        </>
      )}

      <ProjectFormDialog open={editing !== null} onClose={() => setEditing(null)} project={editing === "new" || editing === null ? undefined : editing} />
    </div>
  );
}
