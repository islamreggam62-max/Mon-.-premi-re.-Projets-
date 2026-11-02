"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CalendarRange, FolderKanban, LayoutGrid, Rows3, Target } from "lucide-react";
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
  dayValue,
  daysUntil,
  dueLabel,
  formatCompactCurrency,
  formatDate,
  formatMonthShort,
  formatShortDate,
  percent,
  toISODate,
} from "@/lib/utils";

type HealthFilter = "all" | Health;
type View = "cards" | "table" | "timeline";
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
              { id: "timeline", label: "Timeline", icon: CalendarRange },
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
                      <p className="font-mono text-[11px] text-slate-400">
                        {p.code} · {p.department}
                      </p>
                      <h2 className="mt-0.5 text-base font-semibold text-slate-50">{p.name}</h2>
                      <p className="mt-1 text-sm text-slate-300">{p.summary}</p>
                    </div>
                    <HealthBadge health={p.health} />
                  </div>

                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-300">
                      <span>Progress</span>
                      <span className="tabular-nums text-slate-200">{p.progress}%</span>
                    </div>
                    <ProgressBar value={p.progress} tone={HEALTH_TONE[p.health]} label={`${p.name} progress`} />
                  </div>

                  <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Deadline
                      </dt>
                      <dd className="mt-1 text-slate-200">{formatDate(p.targetDate)}</dd>
                      <dd className={cn("text-xs", overdueDeadline ? "text-rose-300" : "text-slate-400")}>
                        {dueLabel(p.targetDate, asOf)}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Target className="h-3.5 w-3.5" aria-hidden="true" /> Milestones
                      </dt>
                      <dd className="mt-1 tabular-nums text-slate-200">
                        {done} of {p.milestones.length} done
                      </dd>
                      {next && (
                        <dd
                          className={cn(
                            "truncate text-xs",
                            daysUntil(next.due, asOf) < 0 ? "text-rose-300" : "text-slate-400",
                          )}
                        >
                          Next: {next.name} · {formatShortDate(next.due)}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Budget used</dt>
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
                      <span className="truncate text-xs text-slate-300">
                        Owner · <span className="text-slate-200">{owner?.name ?? "Unassigned"}</span>
                      </span>
                    </div>
                    <AvatarStack people={members} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : view === "timeline" ? (
          <TimelineView projects={visible} byId={byId} asOf={asOf} />
        ) : (
          <div className="glass overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-xs font-medium uppercase tracking-wide text-slate-400">
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
                        <p className="font-mono text-[11px] text-slate-400">{p.code}</p>
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
                        <p className="text-xs text-slate-400">{dueLabel(p.targetDate, asOf)}</p>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-300">
                        {done}/{p.milestones.length}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                        <p className="text-slate-200">{formatCompactCurrency(p.spent)}</p>
                        <p className="text-xs text-slate-400">
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

/* ----------------------------------------------------------------------------
 * Timeline (Gantt-style range bars on a shared month axis)
 * ------------------------------------------------------------------------- */

const HEALTH_BAR: Record<Health, { track: string; fill: string }> = {
  "on-track": { track: "bg-status-emerald/25", fill: "bg-status-emerald" },
  "at-risk": { track: "bg-status-amber/25", fill: "bg-status-amber" },
  delayed: { track: "bg-status-rose/25", fill: "bg-status-rose" },
};

function TimelineView({
  projects,
  byId,
  asOf,
}: {
  projects: Project[];
  byId: Record<string, Person>;
  asOf: string;
}) {
  // Domain: first day of the earliest start month → first day after the latest target month.
  const first = new Date(Math.min(...projects.map((p) => dayValue(p.startDate))));
  const last = new Date(Math.max(...projects.map((p) => dayValue(p.targetDate))));
  const domainStart = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
  const domainEnd = Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1);
  const pos = (iso: string) => ((dayValue(iso) - domainStart) / (domainEnd - domainStart)) * 100;

  const months: string[] = [];
  for (let t = domainStart; t < domainEnd; ) {
    months.push(toISODate(t));
    const d = new Date(t);
    t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  const today = pos(asOf);

  return (
    <div className="glass overflow-x-auto">
      <div className="min-w-[52rem]">
        <div className="grid grid-cols-[15rem_minmax(0,1fr)] border-b border-hairline">
          <div className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Project</div>
          <div className="relative h-11" aria-hidden="true">
            {months.map((m) => (
              <span
                key={m}
                className="absolute top-0 flex h-full items-end border-l border-hairline pb-1.5 pl-1.5 text-[11px] text-slate-400"
                style={{ left: `${pos(m)}%` }}
              >
                {formatMonthShort(m)}
              </span>
            ))}
            <span
              className="absolute top-1 -translate-x-1/2 rounded bg-violet px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style={{ left: `${today}%` }}
            >
              Today
            </span>
          </div>
        </div>

        <ul>
          {projects.map((p, index) => {
            const owner = byId[p.ownerId];
            const left = pos(p.startDate);
            const width = pos(p.targetDate) - left;
            const bar = HEALTH_BAR[p.health];
            const next = nextMilestone(p);
            const summary = `${p.name}: ${formatDate(p.startDate)} to ${formatDate(p.targetDate)}, ${p.progress}% complete, ${HEALTH_LABEL[p.health]}`;
            return (
              <li
                key={p.id}
                id={p.id}
                className="grid scroll-mt-24 grid-cols-[15rem_minmax(0,1fr)] border-b border-hairline last:border-b-0 target:bg-violet/10"
              >
                <div className="min-w-0 px-5 py-3">
                  <p className="truncate text-sm font-semibold text-slate-50">{p.name.split(" — ")[0]}</p>
                  <div className="mt-1 flex min-w-0 items-center gap-2">
                    <HealthBadge health={p.health} />
                    <span className="truncate text-xs text-slate-400">{owner?.name}</span>
                  </div>
                </div>
                <div className="relative">
                  {months.map((m) => (
                    <span
                      key={m}
                      className="absolute inset-y-0 border-l border-white/[0.05]"
                      style={{ left: `${pos(m)}%` }}
                      aria-hidden="true"
                    />
                  ))}
                  <span className="absolute inset-y-0 w-px bg-violet-soft/80" style={{ left: `${today}%` }} aria-hidden="true" />

                  <div
                    tabIndex={0}
                    aria-label={summary}
                    className={cn(
                      "focus-ring group absolute top-1/2 h-3 -translate-y-1/2 cursor-default rounded-[4px] outline-none",
                      bar.track,
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <div className={cn("h-full rounded-[4px]", bar.fill)} style={{ width: `${p.progress}%` }} />
                    <div
                      role="tooltip"
                      className={cn(
                        "pointer-events-none absolute left-0 z-20 hidden w-64 rounded-xl border border-hairline bg-base-800 p-3 text-xs shadow-2xl shadow-black/60 group-hover:block group-focus:block",
                        index === 0 ? "top-full mt-2" : "bottom-full mb-2",
                      )}
                    >
                      <p className="font-semibold text-slate-50">{p.name}</p>
                      <p className="mt-1 text-slate-300">
                        {formatShortDate(p.startDate)} → {formatDate(p.targetDate)} · {dueLabel(p.targetDate, asOf)}
                      </p>
                      <p className="mt-1 text-slate-300">
                        {p.progress}% complete · {HEALTH_LABEL[p.health]}
                      </p>
                      {next && (
                        <p className="mt-1 text-slate-400">
                          Next milestone: {next.name} · {formatShortDate(next.due)}
                        </p>
                      )}
                    </div>
                  </div>

                  {p.milestones.map((m) => {
                    const overdue = !m.done && daysUntil(m.due, asOf) < 0;
                    return (
                      <span
                        key={m.id}
                        title={`${m.name} · ${formatShortDate(m.due)} · ${m.done ? "done" : overdue ? "overdue" : "open"}`}
                        className={cn(
                          "pointer-events-auto absolute top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] ring-2 ring-base-900",
                          m.done ? "bg-slate-50" : overdue ? "border-2 border-status-rose bg-base-900" : "border-2 border-slate-300 bg-base-900",
                        )}
                        style={{ left: `${pos(m.due)}%` }}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline px-5 py-3 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-[3px] bg-slate-300" aria-hidden="true" /> Completed portion
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-[3px] bg-slate-300/25" aria-hidden="true" /> Remaining
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rotate-45 rounded-[1px] bg-slate-50" aria-hidden="true" /> Milestone done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rotate-45 rounded-[1px] border-2 border-slate-300" aria-hidden="true" /> Milestone open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rotate-45 rounded-[1px] border-2 border-status-rose" aria-hidden="true" /> Milestone overdue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-px bg-violet-soft" aria-hidden="true" /> Today · {formatShortDate(asOf)}
          </span>
          <span className="text-slate-400">Bar color = project health (see badge)</span>
        </div>
      </div>
    </div>
  );
}
