"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, Columns3, ListChecks, Rows3 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityBadge, TaskStatusBadge } from "@/components/ui/Badge";
import { SearchInput, Select, ToggleChip } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  PRIORITY_RANK,
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
} from "@/lib/labels";
import { indexById, isTaskOverdue } from "@/lib/metrics";
import type { Person, Priority, Project, Task, TaskStatus } from "@/lib/types";
import { cn, dueLabel, formatShortDate } from "@/lib/utils";

type StatusFilter = "all" | TaskStatus;
type View = "list" | "board";
type SortKey = "due" | "priority" | "status";

const PRIORITY_ACCENT: Record<Priority, string> = {
  critical: "border-l-status-rose",
  high: "border-l-status-amber",
  medium: "border-l-status-sky",
  low: "border-l-slate-600",
};

export function TaskExplorer({
  tasks,
  projects,
  people,
  asOf,
  onEdit,
  onStatusChange,
}: {
  tasks: Task[];
  projects: Project[];
  people: Person[];
  asOf: string;
  /** When given, task titles open the task for editing. */
  onEdit?: (task: Task) => void;
  /** When given, the list's status column is a picker. */
  onStatusChange?: (task: Task, status: TaskStatus) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [projectId, setProjectId] = useState("all");
  const [assigneeId, setAssigneeId] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [view, setView] = useState<View>("list");
  const [sort, setSort] = useState<SortKey>("due");

  const projectsById = useMemo(() => indexById(projects), [projects]);
  const peopleById = useMemo(() => indexById(people), [people]);
  const assignees = useMemo(
    () =>
      people
        .filter((p) => tasks.some((t) => t.assigneeId === p.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [people, tasks],
  );

  // Every filter except status: drives the status tab counts and the board columns.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (!q || t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q)) &&
        (priorities.length === 0 || priorities.includes(t.priority)) &&
        (projectId === "all" || t.projectId === projectId) &&
        (assigneeId === "all" || t.assigneeId === assigneeId) &&
        (!overdueOnly || isTaskOverdue(t, asOf)),
    );
  }, [tasks, query, priorities, projectId, assigneeId, overdueOnly, asOf]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.due.localeCompare(b.due);
      if (sort === "status")
        return TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status) || a.due.localeCompare(b.due);
      return a.due.localeCompare(b.due) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    });
  }, [filtered, sort]);

  const listItems = sorted.filter((t) => status === "all" || t.status === status);

  const statusTabs = [
    { id: "all" as StatusFilter, label: "All", count: filtered.length },
    ...TASK_STATUS_ORDER.map((s) => ({
      id: s as StatusFilter,
      label: TASK_STATUS_LABEL[s],
      count: filtered.filter((t) => t.status === s).length,
    })),
  ];

  const filtersActive =
    query !== "" || priorities.length > 0 || projectId !== "all" || assigneeId !== "all" || overdueOnly || status !== "all";

  function togglePriority(p: Priority) {
    setPriorities((current) => (current.includes(p) ? current.filter((x) => x !== p) : [...current, p]));
  }

  function reset() {
    setQuery("");
    setStatus("all");
    setPriorities([]);
    setProjectId("all");
    setAssigneeId("all");
    setOverdueOnly(false);
  }

  const visibleCount = view === "list" ? listItems.length : filtered.length;

  return (
    <div>
      {/* Filters */}
      <div className="glass p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
          <SearchInput
            value={query}
            onChange={setQuery}
            label="Search tasks"
            placeholder="Search by title or key (NEX-101)…"
            className="sm:col-span-2 lg:col-span-1 lg:self-end"
          />
          <Select
            label="Project"
            value={projectId}
            onChange={setProjectId}
            options={[
              { value: "all", label: "All projects" },
              ...projects.map((p) => ({ value: p.id, label: p.name.split(" — ")[0] })),
            ]}
          />
          <Select
            label="Assignee"
            value={assigneeId}
            onChange={setAssigneeId}
            options={[{ value: "all", label: "Everyone" }, ...assignees.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <Select<SortKey>
            label="Sort by"
            value={sort}
            onChange={setSort}
            options={[
              { value: "due", label: "Deadline (soonest)" },
              { value: "priority", label: "Priority" },
              { value: "status", label: "Status" },
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-slate-400" id="priority-filter-label">
            Priority
          </span>
          <div role="group" aria-labelledby="priority-filter-label" className="flex flex-wrap gap-2">
            {PRIORITY_ORDER.map((p) => (
              <ToggleChip key={p} pressed={priorities.includes(p)} onToggle={() => togglePriority(p)}>
                {PRIORITY_LABEL[p]}
              </ToggleChip>
            ))}
          </div>
          <span className="mx-1 hidden h-4 w-px bg-hairline sm:inline-block" aria-hidden="true" />
          <ToggleChip pressed={overdueOnly} onToggle={() => setOverdueOnly((v) => !v)}>
            <Clock className="h-3 w-3" aria-hidden="true" /> Overdue only
          </ToggleChip>
          {filtersActive && (
            <button type="button" onClick={reset} className="ml-auto text-xs font-medium text-violet-300 hover:text-violet-200">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* View controls */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        {view === "list" ? (
          <Tabs items={statusTabs} value={status} onChange={setStatus} ariaLabel="Filter by status" className="md:flex-1" />
        ) : (
          <p className="text-sm text-slate-300">Board grouped by status</p>
        )}
        <Tabs<View>
          variant="pill"
          ariaLabel="Choose view"
          value={view}
          onChange={setView}
          items={[
            { id: "list", label: "List", icon: Rows3 },
            { id: "board", label: "Board", icon: Columns3 },
          ]}
        />
      </div>

      <p className="mt-4 text-xs text-slate-400" aria-live="polite">
        Showing {visibleCount} of {tasks.length} tasks
      </p>

      {visibleCount === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ListChecks}
            title="No tasks match these filters"
            description="Adjust the filters or clear them to see every task."
            action={
              <button type="button" onClick={reset} className="btn btn-secondary">
                Clear filters
              </button>
            }
          />
        </div>
      ) : view === "list" ? (
        <div className="glass mt-4 overflow-hidden">
          <div
            className="hidden border-b border-hairline px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_6.5rem_8rem_7.5rem] md:gap-4"
            aria-hidden="true"
          >
            <span>Task</span>
            <span>Project</span>
            <span>Assignee</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Deadline</span>
          </div>
          <ul className="divide-y divide-white/5">
            {listItems.map((t) => {
              const project = projectsById[t.projectId];
              const assignee = peopleById[t.assigneeId];
              const overdue = isTaskOverdue(t, asOf);
              return (
                <li
                  key={t.id}
                  className="px-4 py-4 hover:bg-white/[0.02] md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_6.5rem_8rem_7.5rem] md:items-center md:gap-4 md:px-5 md:py-3"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-slate-400">{t.key}</p>
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(t)}
                        className={cn(
                          "focus-ring rounded text-left text-sm font-medium hover:underline",
                          t.status === "done" ? "text-slate-400 line-through" : "text-slate-100",
                        )}
                      >
                        {t.title}
                      </button>
                    ) : (
                      <p className={cn("text-sm font-medium", t.status === "done" ? "text-slate-400 line-through" : "text-slate-100")}>
                        {t.title}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 md:contents">
                    <div className="min-w-0 text-sm">
                      {project && (
                        <Link
                          href={`/projects#${project.id}`}
                          className="focus-ring block truncate rounded text-violet-300 hover:text-violet-200 hover:underline"
                        >
                          {project.name.split(" — ")[0]}
                        </Link>
                      )}
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      {assignee && <Avatar person={assignee} size="xs" />}
                      <span className="truncate text-sm text-slate-300">{assignee?.name ?? "Unassigned"}</span>
                    </div>
                    <div>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <div>
                      {onStatusChange ? (
                        <select
                          value={t.status}
                          onChange={(event) => onStatusChange(t, event.target.value as TaskStatus)}
                          aria-label={`Status of ${t.title}`}
                          className="field w-auto py-1 text-xs"
                        >
                          {TASK_STATUS_ORDER.map((st) => (
                            <option key={st} value={st}>
                              {TASK_STATUS_LABEL[st]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <TaskStatusBadge status={t.status} />
                      )}
                    </div>
                    <div className={cn("text-xs tabular-nums", overdue ? "text-rose-300" : "text-slate-300")}>
                      <span className="text-slate-200">{formatShortDate(t.due)}</span>
                      <span className="block">{t.status === "done" ? "Completed" : dueLabel(t.due, asOf)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <div className="grid min-w-max auto-cols-[16.5rem] grid-flow-col gap-4 2xl:min-w-0 2xl:auto-cols-fr">
            {TASK_STATUS_ORDER.map((col) => {
              const items = sorted.filter((t) => t.status === col);
              return (
                <section key={col} aria-labelledby={`col-${col}`} className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 id={`col-${col}`} className="text-sm font-semibold text-slate-200">
                      {TASK_STATUS_LABEL[col]}
                    </h2>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs tabular-nums text-slate-300">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-hairline bg-white/[0.015] p-2">
                    {items.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No tasks</p>}
                    {items.map((t) => {
                      const project = projectsById[t.projectId];
                      const assignee = peopleById[t.assigneeId];
                      const overdue = isTaskOverdue(t, asOf);
                      return (
                        <article
                          key={t.id}
                          className={cn(
                            "rounded-xl border border-l-2 border-hairline bg-base-900/70 p-3.5 shadow-glass",
                            PRIORITY_ACCENT[t.priority],
                          )}
                        >
                          <p className="font-mono text-[11px] text-slate-400">{t.key}</p>
                          {onEdit ? (
                            <button
                              type="button"
                              onClick={() => onEdit(t)}
                              className="focus-ring mt-0.5 rounded text-left text-sm font-medium leading-snug text-slate-100 hover:underline"
                            >
                              {t.title}
                            </button>
                          ) : (
                            <p className="mt-0.5 text-sm font-medium leading-snug text-slate-100">{t.title}</p>
                          )}
                          {project && (
                            <Link
                              href={`/projects#${project.id}`}
                              className="focus-ring mt-1.5 block truncate rounded text-xs text-violet-300 hover:underline"
                            >
                              {project.name.split(" — ")[0]}
                            </Link>
                          )}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <PriorityBadge priority={t.priority} />
                            <span className={cn("inline-flex items-center gap-1 text-xs tabular-nums", overdue ? "text-rose-300" : "text-slate-300")}>
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {t.status === "done" ? formatShortDate(t.due) : dueLabel(t.due, asOf)}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
                            <span className="flex min-w-0 items-center gap-2">
                              {assignee && <Avatar person={assignee} size="xs" />}
                              <span className="truncate text-xs text-slate-300">{assignee?.name}</span>
                            </span>
                            <span className="text-xs text-slate-400">{t.estimateHours}h</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
