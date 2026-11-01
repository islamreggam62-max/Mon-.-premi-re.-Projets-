"use client";

import { useMemo, useState } from "react";
import { CalendarDays, FolderKanban, LayoutGrid, Rows3, Target } from "lucide-react";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { HEALTH_TONE, HealthBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { HEALTH_LABEL, HEALTH_ORDER, HEALTH_RANK } from "@/lib/labels";
import { indexById, nextMilestone } from "@/lib/metrics";
import type { Health, Person, Project } from "@/lib/types";
import {
  cn,
  daysUntil,
  dueLabel,
  formatCompactCurrency,
  formatDate,
  formatShortDate,
  percent,
} from "@/lib/utils";

type HealthFilter = "all" | Health;
type View = "cards" | "table";
type SortKey = "deadline" | "risk" | "progress" | "name";

export function ProjectPortfolio({
  projects,
  people,
  asOf,
}: {
  projects: Project[];
  people: Person[];
  asOf: string;
}) {
  const [health, setHealth] = useState<HealthFilter>("all");
  const [view, setView] = useState<View>("cards");
  const [sort, setSort] = useState<SortKey>("risk");
  const byId = useMemo(() => indexById(people), [people]);

  const tabs = useMemo(
    () => [
      { id: "all" as HealthFilter, label: "All", count: projects.length },
      ...HEALTH_ORDER.map((h) => ({
        id: h as HealthFilter,
        label: HEALTH_LABEL[h],
        count: projects.filter((p) => p.health === h).length,
      })),
    ],
    [projects],
  );

  const visible = useMemo(() => {
    const list = projects.filter((p) => health === "all" || p.health === health);
    return [...list].sort((a, b) => {
      switch (sort) {
        case "deadline":
          return a.targetDate.localeCompare(b.targetDate);
        case "progress":
          return b.progress - a.progress;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return HEALTH_RANK[a.health] - HEALTH_RANK[b.health] || a.targetDate.localeCompare(b.targetDate);
      }
    });
  }, [projects, health, sort]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Tabs items={tabs} value={health} onChange={setHealth} ariaLabel="Filter by health" className="lg:flex-1" />
        <div className="flex items-end gap-3">
          <Select<SortKey>
            label="Sort by"
            value={sort}
            onChange={setSort}
            options={[
              { value: "risk", label: "Risk (highest first)" },
              { value: "deadline", label: "Deadline (soonest)" },
              { value: "progress", label: "Progress (most complete)" },
              { value: "name", label: "Name (A–Z)" },
            ]}
            className="w-52"
          />
          <Tabs<View>
            variant="pill"
            ariaLabel="Choose view"
            value={view}
            onChange={setView}
            items={[
              { id: "cards", label: "Cards", icon: LayoutGrid },
              { id: "table", label: "Table", icon: Rows3 },
            ]}
          />
        </div>
      </div>

      <div className="mt-6">
        {visible.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects with this health status" />
        ) : view === "cards" ? (
          <ul className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {visible.map((p) => {
              const owner = byId[p.ownerId];
              const members = [p.ownerId, ...p.memberIds].map((id) => byId[id]).filter(Boolean);
              const done = p.milestones.filter((m) => m.done).length;
              const next = nextMilestone(p);
              const burn = percent(p.spent, p.budget);
              const overdueDeadline = daysUntil(p.targetDate, asOf) < 0;
              return (
                <li
                  key={p.id}
                  id={p.id}
                  className="glass flex scroll-mt-24 flex-col p-5 motion-safe:animate-fade-in target:ring-2 target:ring-violet/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-slate-500">
                        {p.code} · {p.department}
                      </p>
                      <h2 className="mt-0.5 text-base font-semibold text-slate-50">{p.name}</h2>
                      <p className="mt-1 text-sm text-slate-400">{p.summary}</p>
                    </div>
                    <HealthBadge health={p.health} />
                  </div>

                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span className="tabular-nums text-slate-200">{p.progress}%</span>
                    </div>
                    <ProgressBar value={p.progress} tone={HEALTH_TONE[p.health]} label={`${p.name} progress`} />
                  </div>

                  <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Deadline
                      </dt>
                      <dd className="mt-1 text-slate-200">{formatDate(p.targetDate)}</dd>
                      <dd className={cn("text-xs", overdueDeadline ? "text-rose-300" : "text-slate-500")}>
                        {dueLabel(p.targetDate, asOf)}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Target className="h-3.5 w-3.5" aria-hidden="true" /> Milestones
                      </dt>
                      <dd className="mt-1 tabular-nums text-slate-200">
                        {done} of {p.milestones.length} done
                      </dd>
                      {next && (
                        <dd
                          className={cn(
                            "truncate text-xs",
                            daysUntil(next.due, asOf) < 0 ? "text-rose-300" : "text-slate-500",
                          )}
                        >
                          Next: {next.name} · {formatShortDate(next.due)}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Budget used</dt>
                      <dd className="mt-1 tabular-nums text-slate-200">
                        {formatCompactCurrency(p.spent)} / {formatCompactCurrency(p.budget)}
                      </dd>
                      <dd className="mt-1.5">
                        <ProgressBar
                          value={burn}
                          tone={burn - p.progress >= 20 ? "rose" : "violet"}
                          label={`${p.name} budget used`}
                        />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4">
                    <div className="flex min-w-0 items-center gap-2">
                      {owner && <Avatar person={owner} size="sm" />}
                      <span className="truncate text-xs text-slate-400">
                        Owner · <span className="text-slate-200">{owner?.name ?? "Unassigned"}</span>
                      </span>
                    </div>
                    <AvatarStack people={members} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="glass overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-5 py-3">Project</th>
                  <th scope="col" className="px-3 py-3">Health</th>
                  <th scope="col" className="px-3 py-3">Progress</th>
                  <th scope="col" className="px-3 py-3">Owner</th>
                  <th scope="col" className="px-3 py-3">Deadline</th>
                  <th scope="col" className="px-3 py-3">Milestones</th>
                  <th scope="col" className="px-5 py-3 text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visible.map((p) => {
                  const owner = byId[p.ownerId];
                  const done = p.milestones.filter((m) => m.done).length;
                  return (
                    <tr key={p.id} id={p.id} className="scroll-mt-24 hover:bg-white/[0.02] target:bg-violet/10">
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <p className="font-medium text-slate-100">{p.name}</p>
                        <p className="font-mono text-[11px] text-slate-500">{p.code}</p>
                      </th>
                      <td className="px-3 py-3">
                        <HealthBadge health={p.health} />
                      </td>
                      <td className="w-44 px-3 py-3">
                        <ProgressBar value={p.progress} tone={HEALTH_TONE[p.health]} showLabel label={`${p.name} progress`} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {owner && <Avatar person={owner} size="xs" />}
                          <span className="whitespace-nowrap text-slate-300">{owner?.name}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <p className="text-slate-200">{formatShortDate(p.targetDate)}</p>
                        <p className="text-xs text-slate-500">{dueLabel(p.targetDate, asOf)}</p>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-300">
                        {done}/{p.milestones.length}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                        <p className="text-slate-200">{formatCompactCurrency(p.spent)}</p>
                        <p className="text-xs text-slate-500">
                          of {formatCompactCurrency(p.budget)} · {percent(p.spent, p.budget)}%
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
