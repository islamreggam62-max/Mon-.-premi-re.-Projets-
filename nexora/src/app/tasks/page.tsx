import type { Metadata } from "next";
import { getTasksView } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { TaskExplorer } from "@/components/tasks/task-explorer";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Task execution board and list with priorities, statuses and owners.",
};

export default function TasksPage() {
  const view = getTasksView();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Execution"
        title="Tasks"
        description="Every task across initiatives. Overdue work rises to the top; blocked tasks show why."
      />
      <TaskExplorer tasks={view.tasks} projects={view.projects} assignees={view.assignees} today={view.today} />
    </div>
  );
}
