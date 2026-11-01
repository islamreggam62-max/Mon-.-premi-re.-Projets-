import type { Metadata } from "next";
import { CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { type ProjectStatus } from "@/lib/demo-data";
import { getProjects } from "@/lib/data";

export const metadata: Metadata = { title: "Projects" };

const statusTone: Record<ProjectStatus, BadgeTone> = {
  "On track": "success",
  "At risk": "warning",
  Delayed: "danger",
  Completed: "info",
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Portfolio of active initiatives with delivery and budget health."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      {/* Status filter chips (visual only in Phase 1) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="nx-chip border-violet-500/30 bg-violet-500/15 text-violet-200">
          All · {projects.length}
        </span>
        {(["On track", "At risk", "Delayed", "Completed"] as ProjectStatus[]).map(
          (s) => (
            <span key={s} className="nx-chip">
              {s} · {projects.filter((p) => p.status === s).length}
            </span>
          )
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {projects.map((p) => {
          const budgetPct = Math.round((p.budgetUsed / p.budgetTotal) * 100);
          const budgetTone =
            budgetPct >= 95 ? "danger" : budgetPct >= 80 ? "warning" : "brand";
          return (
            <Card key={p.id} sheen>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-subtle">
                      {p.client} · Lead {p.lead}
                    </p>
                  </div>
                  <Badge tone={statusTone[p.status]} dot>
                    {p.status}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-subtle">Progress</span>
                    <span className="font-medium text-muted">{p.progress}%</span>
                  </div>
                  <Progress
                    value={p.progress}
                    tone={p.status === "Completed" ? "success" : "brand"}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-subtle">Budget</span>
                    <span className="font-medium text-muted">
                      {formatCurrency(p.budgetUsed, true)} /{" "}
                      {formatCurrency(p.budgetTotal, true)}
                    </span>
                  </div>
                  <Progress
                    value={budgetPct}
                    tone={budgetTone}
                    className="mt-1.5"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <AvatarStack items={p.team} />
                  <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due {formatDate(p.dueDate)}
                  </span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
