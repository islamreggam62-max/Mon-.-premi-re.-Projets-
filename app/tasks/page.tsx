import type { Metadata } from "next";
import { CircleAlert, Clock, ListTodo, OctagonX } from "lucide-react";
import { DemoBadge } from "@/components/ui/Badge";
import { MiniStat } from "@/components/ui/MiniStat";
import { PageHeader } from "@/components/ui/PageHeader";
import { TaskExplorer } from "@/components/tasks/TaskExplorer";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { PROJECTS } from "@/lib/data/projects";
import { TASKS } from "@/lib/data/tasks";
import { TEAM } from "@/lib/data/team";
import { isTaskOverdue } from "@/lib/metrics";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  const open = TASKS.filter((t) => t.status !== "done");
  const critical = open.filter((t) => t.priority === "critical").length;
  const overdue = TASKS.filter((t) => isTaskOverdue(t, DEMO_AS_OF)).length;
  const blocked = TASKS.filter((t) => t.status === "blocked").length;

  return (
    <div>
      <PageHeader
        title="Task Execution"
        subtitle="Every task across the portfolio, with priority, status, owner, and project link."
        action={<DemoBadge label="Static demo data" />}
      />

      <section aria-label="Task summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={ListTodo} label="Open tasks" value={String(open.length)} hint={`of ${TASKS.length} total`} />
        <MiniStat icon={CircleAlert} label="Critical open" value={String(critical)} tone={critical ? "rose" : "default"} />
        <MiniStat icon={Clock} label="Overdue" value={String(overdue)} tone={overdue ? "rose" : "default"} />
        <MiniStat icon={OctagonX} label="Blocked" value={String(blocked)} tone={blocked ? "amber" : "default"} />
      </section>

      <TaskExplorer tasks={TASKS} projects={PROJECTS} people={TEAM} asOf={DEMO_AS_OF} />
    </div>
  );
}
