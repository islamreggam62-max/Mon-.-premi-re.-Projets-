import type { Metadata } from "next";
import { CalendarDays, Check, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { HealthBadge, Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AvatarStack, Avatar } from "@/components/ui/Avatar";
import { PROJECTS } from "@/lib/data/projects";
import { person } from "@/lib/data/team";
import type { Health } from "@/lib/types";
import { cn, formatCurrency, formatDate, percent, relativeDay } from "@/lib/utils";

export const metadata: Metadata = { title: "Projects" };

const TODAY = new Date("2026-11-01");

function toneFor(h: Health): "violet" | "emerald" | "amber" | "rose" {
  if (h === "off-track") return "rose";
  if (h === "at-risk") return "amber";
  return "emerald";
}

export default function ProjectsPage() {
  const counts = {
    "on-track": PROJECTS.filter((p) => p.health === "on-track").length,
    "at-risk": PROJECTS.filter((p) => p.health === "at-risk").length,
    "off-track": PROJECTS.filter((p) => p.health === "off-track").length,
  };

  return (
    <div>
      <PageHeader
        title="Strategic Initiatives"
        subtitle="Portfolio of projects with milestone trackers and budget burn."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="emerald" dot>
              {counts["on-track"]} on track
            </Badge>
            <Badge tone="amber" dot>
              {counts["at-risk"]} at risk
            </Badge>
            <Badge tone="rose" dot>
              {counts["off-track"]} off track
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {PROJECTS.map((p) => {
          const owner = person(p.ownerId);
          const members = [p.ownerId, ...p.memberIds]
            .map((id) => person(id))
            .filter(Boolean) as NonNullable<ReturnType<typeof person>>[];
          const doneMilestones = p.milestones.filter((m) => m.done).length;
          const burn = percent(p.spent, p.budget);

          return (
            <Card key={p.id} className="flex flex-col">
              <CardHeader
                title={p.name}
                subtitle={p.description}
                action={<HealthBadge health={p.health} />}
              />
              <CardBody className="flex flex-1 flex-col gap-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                    <span>Completion</span>
                    <span className="tabular-nums">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} tone={toneFor(p.health)} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <span>
                      Due {formatDate(p.targetDate)}
                      <span className="ml-1 text-slate-500">
                        ({relativeDay(p.targetDate, TODAY)})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Target className="h-4 w-4 text-slate-500" />
                    <span>
                      {doneMilestones}/{p.milestones.length} milestones
                    </span>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                    <span>Budget burn</span>
                    <span className="tabular-nums">
                      {formatCurrency(p.spent)} / {formatCurrency(p.budget)}
                    </span>
                  </div>
                  <ProgressBar value={burn} tone={burn >= 90 ? "rose" : "violet"} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Milestones
                  </p>
                  <ul className="space-y-1.5">
                    {p.milestones.map((m) => (
                      <li key={m.id} className="flex items-center gap-2.5 text-sm">
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
                            m.done
                              ? "bg-status-emerald/15 text-status-emerald ring-status-emerald/30"
                              : "bg-white/5 text-transparent ring-white/10",
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span
                          className={cn(
                            "flex-1",
                            m.done ? "text-slate-400 line-through" : "text-slate-200",
                          )}
                        >
                          {m.name}
                        </span>
                        <span className="text-xs tabular-nums text-slate-500">
                          {formatDate(m.due)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-hairline pt-4">
                  <div className="flex items-center gap-2">
                    {owner && <Avatar person={owner} size="sm" />}
                    <span className="text-xs text-slate-400">
                      Owner · {owner?.name ?? "—"}
                    </span>
                  </div>
                  <AvatarStack people={members} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
