import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  taskStates,
  type TaskPriority,
  type TaskState,
} from "@/lib/demo-data";
import { getTasks } from "@/lib/data";

export const metadata: Metadata = { title: "Tasks" };

const priorityTone: Record<TaskPriority, BadgeTone> = {
  Low: "neutral",
  Medium: "info",
  High: "warning",
  Urgent: "danger",
};

const columnAccent: Record<TaskState, string> = {
  Backlog: "bg-subtle",
  "In progress": "bg-violet-400",
  "In review": "bg-info",
  Done: "bg-success",
};

export default async function TasksPage() {
  const tasks = await getTasks();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Work items across every project, organized by stage."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStates.map((state) => {
          const items = tasks.filter((t) => t.state === state);
          return (
            <section
              key={state}
              className="nx-panel flex flex-col gap-3 p-3"
              aria-label={`${state} column`}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${columnAccent[state]}`}
                  />
                  <h2 className="text-sm font-semibold text-foreground">
                    {state}
                  </h2>
                </div>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-subtle">
                  {items.length}
                </span>
              </div>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-subtle">
                    No tasks
                  </p>
                ) : (
                  items.map((t) => (
                    <article
                      key={t.id}
                      className="nx-card nx-sheen cursor-default p-3 transition hover:border-border-strong/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={priorityTone[t.priority]}>
                          {t.priority}
                        </Badge>
                        <span className="text-[11px] text-subtle">
                          Due {t.due}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                        {t.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-subtle">
                        {t.project}
                      </p>
                      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5">
                        <Avatar initials={t.assigneeInitials} size="sm" />
                        <span className="truncate text-xs text-muted">
                          {t.assignee}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
