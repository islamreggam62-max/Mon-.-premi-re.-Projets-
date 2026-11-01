import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TEAM } from "@/lib/data/team";
import type { Department, Person } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Team" };

const STATUS_DOT: Record<Person["status"], string> = {
  active: "bg-status-emerald",
  away: "bg-status-amber",
  offline: "bg-slate-500",
};

function workloadTone(w: number): "emerald" | "amber" | "rose" {
  if (w >= 90) return "rose";
  if (w >= 75) return "amber";
  return "emerald";
}

export default function TeamPage() {
  const departments = [...new Set(TEAM.map((p) => p.department))] as Department[];
  const avgWorkload = Math.round(
    TEAM.reduce((s, p) => s + p.workload, 0) / TEAM.length,
  );
  const overloaded = TEAM.filter((p) => p.workload >= 90).length;

  return (
    <div>
      <PageHeader
        title="Team & Organization"
        subtitle="Directory, departments, roles, and current workloads."
      />

      <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="People" value={String(TEAM.length)} />
        <MiniStat label="Departments" value={String(departments.length)} />
        <MiniStat label="Avg workload" value={`${avgWorkload}%`} />
        <MiniStat label="Overloaded" value={String(overloaded)} tone="rose" />
      </section>

      <div className="space-y-6">
        {departments.map((dept) => {
          const members = TEAM.filter((p) => p.department === dept);
          return (
            <Card key={dept}>
              <CardHeader
                title={dept}
                subtitle={`${members.length} ${members.length === 1 ? "person" : "people"}`}
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {members.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-hairline bg-white/[0.02] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar person={p} size="lg" />
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-base-900",
                              STATUS_DOT[p.status],
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">
                            {p.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">{p.role}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {p.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                          <span>Workload</span>
                          <span className="tabular-nums">{p.workload}%</span>
                        </div>
                        <ProgressBar value={p.workload} tone={workloadTone(p.workload)} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "rose";
}) {
  return (
    <div className="glass p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "rose" ? "text-status-rose" : "text-slate-50",
        )}
      >
        {value}
      </p>
    </div>
  );
}
