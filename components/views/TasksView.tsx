"use client";

import { t } from "@/lib/i18n/core";
import { useState } from "react";
import { CircleAlert, Clock, ListTodo, OctagonX } from "lucide-react";
import { TaskFormDialog } from "@/components/forms/TaskForm";
import { TaskExplorer } from "@/components/tasks/TaskExplorer";
import { EmptyState } from "@/components/ui/EmptyState";
import { MiniStat } from "@/components/ui/MiniStat";
import { PageHeader } from "@/components/ui/PageHeader";
import { isTaskOverdue } from "@/lib/metrics";
import { asOfDay } from "@/lib/store/derived";
import { useNexora } from "@/lib/store/StoreProvider";
import type { Task } from "@/lib/types";
import { HeaderActions, NewButton } from "./shared";

export function TasksView() {
  const { data, actions } = useNexora();
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const asOf = asOfDay(data);
  const tasks = data.tasks;

  const open = tasks.filter((t) => t.status !== "done");
  const critical = open.filter((t) => t.priority === "critical").length;
  const overdue = tasks.filter((t) => isTaskOverdue(t, asOf)).length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;

  return (
    <div>
      <PageHeader
        title="Task Execution"
        subtitle="Every task across the portfolio, with priority, status, owner, and project link."
        action={<HeaderActions label="New task" onNew={() => setEditing("new")} />}
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Create tasks, assign them to your team, and follow them from To do to Done."
          action={<NewButton label="New task" onClick={() => setEditing("new")} />}
        />
      ) : (
        <>
          <section aria-label={t("Task summary")} className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MiniStat icon={ListTodo} label="Open tasks" value={String(open.length)} hint={t("of {n} total", { n: tasks.length })} />
            <MiniStat icon={CircleAlert} label="Critical open" value={String(critical)} tone={critical ? "rose" : "default"} />
            <MiniStat icon={Clock} label="Overdue" value={String(overdue)} tone={overdue ? "rose" : "default"} />
            <MiniStat icon={OctagonX} label="Blocked" value={String(blocked)} tone={blocked ? "amber" : "default"} />
          </section>
          <TaskExplorer
            tasks={tasks}
            projects={data.projects}
            people={data.people}
            asOf={asOf}
            onEdit={setEditing}
            onStatusChange={(task, status) => actions.setTaskStatus(task.id, status)}
          />
        </>
      )}

      <TaskFormDialog open={editing !== null} onClose={() => setEditing(null)} task={editing === "new" || editing === null ? undefined : editing} />
    </div>
  );
}
