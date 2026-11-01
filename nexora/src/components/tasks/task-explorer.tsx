"use client";

import { useMemo, useState } from "react";
import { Ban, Columns3, List, SearchX } from "lucide-react";
import { PRIORITIES, TASK_STATUSES } from "@/types";
import type { ISODate, Priority, TaskStatus } from "@/types";
import type { MemberRef, ProjectRef, TaskRow } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { diffInDays } from "@/lib/dates";
import { describeDue, formatDate, formatHours, pluralize } from "@/lib/format";
import { PRIORITY_LABELS } from "@/lib/labels";
import { PRIORITY_STYLES, TASK_STATUS_STYLES } from "@/lib/presentation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge, StatusText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SearchField, SelectField, ToggleGroup } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/notice";

type View = "board" | "list";
const ALL = "all";

const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function DueText({ row, today }: { readonly row: TaskRow; readonly today: ISODate }) {
  if (row.task.status === "done") {
    return <span className="text-ink-subtle">Done {formatDate(row.task.completedOn, "short")}</span>;
  }
  return (
    <span className={cn(row.overdue ? "font-medium text-bad-ink" : "text-ink-subtle")}>
      {formatDate(row.task.dueDate, "short")} · {describeDue(row.task.dueDate, today)}
    </span>
  );
}

function TaskCard({ row, today }: { readonly row: TaskRow; readonly today: ISODate }) {
  const { task } = row;
  const priority = PRIORITY_STYLES[task.priority];
  const PriorityIcon = priority.icon;
  return (
    <article
      aria-label={`${task.key}: ${task.title}`}
      className={cn(
        "rounded-lg border bg-surface p-3 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
        row.overdue ? "border-bad-base/30" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-mono text-ink-subtle">{task.key}</span>
        <span className="inline-flex items-center gap-1 text-ink-muted">
          <PriorityIcon aria-hidden="true" className="size-3.5" />
          {priority.label}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-medium leading-5 text-ink">{task.title}</p>
      {task.status === "blocked" ? (
        <p className="mt-2 flex gap-1.5 rounded-md bg-bad-base/10 px-2 py-1.5 text-xs leading-4 text-bad-ink">
          <Ban aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {task.blockedReason}
        </p>
      ) : null}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <Badge tone="brand">{row.project.code}</Badge>
        <span className="text-[11px]">
          <DueText row={row} today={today} />
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5">
        <Avatar initials={row.assignee.initials} size="xs" />
        <span className="truncate text-xs text-ink-muted">{row.assignee.name}</span>
        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-ink-subtle">
          {formatHours(task.estimateHours)}
        </span>
      </div>
    </article>
  );
}

export function TaskExplorer({
  tasks,
  projects,
  assignees,
  today,
}: {
  readonly tasks: readonly TaskRow[];
  readonly projects: readonly ProjectRef[];
  readonly assignees: readonly MemberRef[];
  readonly today: ISODate;
}) {
  const [view, setView] = useState<View>("board");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState<string>(ALL);
  const [assignee, setAssignee] = useState<string>(ALL);
  const [priority, setPriority] = useState<Priority | typeof ALL>(ALL);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks
      .filter((row) => {
        if (project !== ALL && row.project.id !== project) return false;
        if (assignee !== ALL && row.assignee.id !== assignee) return false;
        if (priority !== ALL && row.task.priority !== priority) return false;
        if (overdueOnly && !row.overdue) return false;
        if (!needle) return true;
        return `${row.task.key} ${row.task.title} ${row.project.name} ${row.assignee.name}`
          .toLowerCase()
          .includes(needle);
      })
      .slice()
      .sort(
        (a, b) =>
          Number(b.overdue) - Number(a.overdue) ||
          diffInDays(b.task.dueDate, a.task.dueDate) ||
          PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority],
      );
  }, [tasks, query, project, assignee, priority, overdueOnly]);

  const byStatus = (status: TaskStatus) => filtered.filter((row) => row.task.status === status);
  const overdueCount = tasks.filter((row) => row.overdue).length;

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
          <SearchField
            label="Search tasks"
            placeholder="Search key, title, owner…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <SelectField label="Initiative" value={project} onChange={(event) => setProject(event.target.value)}>
            <option value={ALL}>All initiatives</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} · {item.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
            <option value={ALL}>All assignees</option>
            {assignees.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority | typeof ALL)}
          >
            <option value={ALL}>Any priority</option>
            {PRIORITIES.map((key) => (
              <option key={key} value={key}>
                {PRIORITY_LABELS[key]}
              </option>
            ))}
          </SelectField>
          <button
            type="button"
            aria-pressed={overdueOnly}
            onClick={() => setOverdueOnly((value) => !value)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
              overdueOnly
                ? "border-bad-base/40 bg-bad-base/15 text-bad-ink"
                : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            Overdue only
            <span className="rounded bg-white/[0.06] px-1 tabular-nums">{overdueCount}</span>
          </button>
        </div>
      </Card>

      {/* Every status at a glance, including columns the board scrolls past. */}
      <ul aria-label="Tasks by status" className="flex flex-wrap gap-2">
        {TASK_STATUSES.map((status) => (
          <li
            key={status}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface/60 px-2.5 py-1.5"
          >
            <StatusText style={TASK_STATUS_STYLES[status]} />
            <span className="text-xs font-semibold tabular-nums text-ink">{byStatus(status).length}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          {pluralize(filtered.length, "task")} shown of {tasks.length}
        </p>
        <ToggleGroup<View>
          label="Layout"
          value={view}
          onChange={setView}
          options={[
            { value: "board", label: "Board", icon: Columns3 },
            { value: "list", label: "List", icon: List },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={SearchX} title="No tasks match these filters" description="Clear a filter or broaden the search." />
      ) : view === "board" ? (
        <div
          role="region"
          aria-label="Task board, scrolls horizontally"
          tabIndex={0}
          className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          <div className="grid w-max auto-cols-[17rem] grid-flow-col gap-3 2xl:w-full 2xl:auto-cols-fr">
            {TASK_STATUSES.map((status) => {
              const style = TASK_STATUS_STYLES[status];
              const items = byStatus(status);
              return (
                <section
                  key={status}
                  aria-label={`${style.label}, ${pluralize(items.length, "task")}`}
                  className="flex min-w-0 flex-col rounded-xl border border-line bg-canvas/40 p-2"
                >
                  <header className="flex items-center justify-between px-1.5 pb-2 pt-1">
                    <StatusText style={style} />
                    <span className="rounded-md bg-white/[0.06] px-1.5 text-[11px] tabular-nums text-ink-muted">
                      {items.length}
                    </span>
                  </header>
                  <ul className="space-y-2">
                    {items.map((row) => (
                      <li key={row.task.id}>
                        <TaskCard row={row} today={today} />
                      </li>
                    ))}
                    {items.length === 0 ? (
                      <li className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-ink-subtle">
                        Nothing here
                      </li>
                    ) : null}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[60rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-subtle">
                  <th scope="col" className="px-5 py-2.5 font-medium">Task</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Initiative</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Assignee</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Priority</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((row) => (
                  <tr key={row.task.id} className="transition-colors hover:bg-white/[0.02]">
                    <th scope="row" className="max-w-md px-5 py-2.5 font-normal">
                      <span className="mr-2 font-mono text-xs text-ink-subtle">{row.task.key}</span>
                      <span className="text-ink">{row.task.title}</span>
                      {row.task.status === "blocked" ? (
                        <p className="mt-0.5 text-xs text-bad-ink">{row.task.blockedReason}</p>
                      ) : null}
                    </th>
                    <td className="px-3 py-2.5">
                      <Badge tone="brand">{row.project.code}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <Avatar initials={row.assignee.initials} size="xs" />
                        <span className="text-ink-muted">{row.assignee.name}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusText style={PRIORITY_STYLES[row.task.priority]} className="text-ink-muted" />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge style={TASK_STATUS_STYLES[row.task.status]} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right text-xs">
                      <DueText row={row} today={today} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line lg:hidden">
            {filtered.map((row) => (
              <li key={row.task.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm text-ink">
                    <span className="mr-1.5 font-mono text-xs text-ink-subtle">{row.task.key}</span>
                    {row.task.title}
                  </p>
                  <StatusBadge style={TASK_STATUS_STYLES[row.task.status]} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <Badge tone="brand">{row.project.code}</Badge>
                  <span className="text-ink-muted">{row.assignee.name}</span>
                  <StatusText style={PRIORITY_STYLES[row.task.priority]} className="text-ink-muted" />
                  <DueText row={row} today={today} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
