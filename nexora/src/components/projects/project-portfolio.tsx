"use client";

import { useState } from "react";
import { FolderSearch } from "lucide-react";
import type { ISODate } from "@/types";
import type { ProjectRow } from "@/lib/queries";
import { ToggleGroup } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/notice";
import { ProjectCard } from "./project-card";

type Filter = "in-flight" | "attention" | "completed" | "all";

const FILTERS: Record<Filter, (project: ProjectRow) => boolean> = {
  "in-flight": (project) => project.risk !== null,
  attention: (project) => project.risk !== null && project.risk.level !== "low",
  completed: (project) => project.status === "completed",
  all: () => true,
};

export function ProjectPortfolio({
  projects,
  today,
}: {
  readonly projects: readonly ProjectRow[];
  readonly today: ISODate;
}) {
  const [filter, setFilter] = useState<Filter>("in-flight");
  const visible = projects.filter(FILTERS[filter]);
  const count = (key: Filter) => projects.filter(FILTERS[key]).length;

  return (
    <section aria-labelledby="portfolio-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="portfolio-heading" className="text-sm font-semibold text-ink">
          Portfolio
        </h2>
        <ToggleGroup<Filter>
          label="Filter initiatives"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "in-flight", label: "In flight", count: count("in-flight") },
            { value: "attention", label: "Needs attention", count: count("attention") },
            { value: "completed", label: "Completed", count: count("completed") },
            { value: "all", label: "All", count: count("all") },
          ]}
        />
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={FolderSearch} title="No initiatives in this view" />
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {visible.map((project) => (
            <li key={project.id} className="min-w-0">
              <ProjectCard project={project} today={today} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
