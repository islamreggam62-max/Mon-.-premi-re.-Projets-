import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PriorityBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TASK_COLUMNS, TASKS } from "@/lib/data/tasks";
import { projectsById } from "@/lib/data/projects";
import { person } from "@/lib/data/team";
import type { Priority } from "@/lib/types";
import { cn, formatDate, relativeDay } from "@/lib/utils";

export const metadata: Metadata = { title: "Tasks" };

const TODAY = new Date("2026-11-01");

const PRIORITY_BORDER: Record<Priority, string> = {
  critical: "border-l-status-rose",
  high: "border-l-status-amber",
  medium: "border-l-status-sky",
  low: "border-l-slate-600",
};

export default function TasksPage() {
  const open = TASKS.filter((t) => t.status !== "done").length;
  const critical = TASKS.filter(
    (t) => t.priority === "critical" && t.status !== "done",
  ).length;

  return (
    <div>
      <PageHeader
        title="Task Execution Board"
        subtitle="Granular execution across all initiatives, by status and priority."
        action={
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-lg border border-hairline bg-white/[0.03] px-2.5 py-1 tabular-nums">
              {open} open
            </span>
            <span className="rounded-lg border border-status-rose/25 bg-status-rose/10 px-2.5 py-1 tabular-nums text-status-rose">
              {critical} critical
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {TASK_COLUMNS.map((col) => {
          const items = TASKS.filter((t) => t.status === col.id);
          return (
            <section key={col.id} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-slate-200">{col.label}</h2>
                <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs tabular-nums text-slate-400">
                  {items.length}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-hairline py-8 text-center text-xs text-slate-600">
                    Empty
                  </div>
                )}
                {items.map((t) => {
                  const assignee = person(t.assigneeId);
                  const proj = projectsById[t.projectId];
                  const overdue =
                    t.status !== "done" && new Date(t.due) < TODAY;
                  return (
                    <article
                      key={t.id}
                      className={cn(
                        "rounded-xl border border-hairline border-l-2 bg-white/[0.03] p-3.5 shadow-glass transition-colors hover:border-white/15",
                        PRIORITY_BORDER[t.priority],
                      )}
                    >
                      <p className="text-sm font-medium leading-snug text-slate-100">
                        {t.title}
                      </p>
                      {proj && (
                        <p className="mt-1.5 line-clamp-1 text-xs text-slate-500">
                          {proj.name}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <PriorityBadge priority={t.priority} />
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs tabular-nums",
                            overdue ? "text-status-rose" : "text-slate-400",
                          )}
                          title={formatDate(t.due)}
                        >
                          <Clock className="h-3 w-3" />
                          {relativeDay(t.due, TODAY)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
                        <div className="flex items-center gap-2">
                          {assignee && <Avatar person={assignee} size="sm" />}
                          <span className="text-xs text-slate-400">
                            {assignee?.name.split(" ")[0] ?? "Unassigned"}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{t.estimate}h</span>
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
  );
}
