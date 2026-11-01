import type { Metadata } from "next";
import { Mail, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { type MemberStatus } from "@/lib/demo-data";
import { getTeam } from "@/lib/data";

export const metadata: Metadata = { title: "Team" };

const statusTone: Record<MemberStatus, BadgeTone> = {
  active: "success",
  away: "warning",
  offline: "neutral",
};

const statusLabel: Record<MemberStatus, string> = {
  active: "Active",
  away: "Away",
  offline: "Offline",
};

export default async function TeamPage() {
  const team = await getTeam();
  const active = team.filter((m) => m.status === "active").length;
  const avgUtil = team.length
    ? Math.round(
        team.reduce((acc, m) => acc + m.utilization, 0) / team.length
      )
    : 0;
  const departments = new Set(team.map((m) => m.department)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="People, roles and current workload across the organization."
        actions={
          <Button>
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Members" value={String(team.length)} />
        <MiniStat label="Active now" value={String(active)} />
        <MiniStat label="Avg. utilization" value={`${avgUtil}%`} />
        <MiniStat label="Departments" value={String(departments)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {team.map((m) => {
          const utilTone =
            m.utilization >= 90
              ? "danger"
              : m.utilization >= 80
                ? "warning"
                : "brand";
          return (
            <Card key={m.id} sheen>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={m.initials} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {m.name}
                      </p>
                      <p className="truncate text-xs text-muted">{m.role}</p>
                    </div>
                  </div>
                  <Badge tone={statusTone[m.status]} dot>
                    {statusLabel[m.status]}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="nx-chip">{m.department}</span>
                  <span className="nx-chip">{m.activeTasks} tasks</span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-subtle">Utilization</span>
                    <span className="font-medium text-muted">
                      {m.utilization}%
                    </span>
                  </div>
                  <Progress
                    value={m.utilization}
                    tone={utilTone}
                    className="mt-1.5"
                  />
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-subtle">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{m.email}</span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="nx-card nx-sheen p-4">
      <p className="text-xs uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
