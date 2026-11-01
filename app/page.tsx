import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CircleAlert,
  Info,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { HealthBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { ACTIVITY, ALERTS, KPIS } from "@/lib/data/dashboard";
import { PROJECTS } from "@/lib/data/projects";
import { person } from "@/lib/data/team";
import { cn, formatTime } from "@/lib/utils";

const SEVERITY = {
  critical: { icon: CircleAlert, tone: "text-status-rose", ring: "ring-status-rose/25 bg-status-rose/10" },
  warning: { icon: AlertTriangle, tone: "text-status-amber", ring: "ring-status-amber/25 bg-status-amber/10" },
  info: { icon: Info, tone: "text-status-sky", ring: "ring-status-sky/25 bg-status-sky/10" },
} as const;

export default function DashboardPage() {
  const watch = [...PROJECTS]
    .sort((a, b) => rank(a.health) - rank(b.health))
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Executive Command Center"
        subtitle="A live read on revenue, delivery, and risk across the business."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <StatCard key={kpi.id} kpi={kpi} />
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Project health"
              subtitle="Initiatives ranked by risk"
              action={
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-soft hover:text-violet"
                >
                  All projects <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <CardBody className="space-y-4">
              {watch.map((p) => {
                const owner = person(p.ownerId);
                return (
                  <Link
                    key={p.id}
                    href="/projects"
                    className="block rounded-xl border border-hairline bg-white/[0.02] p-4 transition-colors hover:border-white/15"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {p.name}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                          {p.description}
                        </p>
                      </div>
                      <HealthBadge health={p.health} />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar
                        value={p.progress}
                        tone={toneFor(p.health)}
                        showLabel
                      />
                      {owner && <Avatar person={owner} size="sm" />}
                    </div>
                  </Link>
                );
              })}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader title="Priority alerts" subtitle="Needs executive attention" />
            <CardBody className="space-y-3">
              {ALERTS.map((a) => {
                const s = SEVERITY[a.severity];
                const Icon = s.icon;
                return (
                  <div key={a.id} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                        s.ring,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", s.tone)} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100">{a.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{a.detail}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                        {a.source} · {formatTime(a.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Recent activity" subtitle="Across every module" />
            <CardBody>
              <ul className="space-y-4">
                {ACTIVITY.map((entry) => {
                  const actor = person(entry.actorId);
                  if (!actor) return null;
                  return (
                    <li key={entry.id} className="flex items-center gap-3">
                      <Avatar person={actor} size="sm" />
                      <p className="min-w-0 flex-1 text-sm text-slate-300">
                        <span className="font-medium text-slate-100">{actor.name}</span>{" "}
                        {entry.action}{" "}
                        <span className="text-slate-200">“{entry.target}”</span>
                      </p>
                      <span className="shrink-0 text-xs tabular-nums text-slate-500">
                        {formatTime(entry.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="h-full border-violet/20 bg-violet/[0.06]">
            <CardBody className="flex h-full flex-col">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-violet/15 px-2.5 py-0.5 text-xs font-medium text-violet-soft ring-1 ring-inset ring-violet/30">
                <TrendingUp className="h-3.5 w-3.5" /> AI Synthesis
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-50">
                Atlas is the Q4 critical path
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">
                Two critical tasks share a single engineer at 94% utilization. A
                one-week slip cascades into the multi-region milestone and the Summit
                GA date.
              </p>
              <Link
                href="/ai-intelligence"
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-violet-soft hover:text-violet"
              >
                Open AI Intelligence <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function rank(h: string): number {
  return h === "off-track" ? 0 : h === "at-risk" ? 1 : 2;
}

function toneFor(h: string): "violet" | "emerald" | "amber" | "rose" {
  if (h === "off-track") return "rose";
  if (h === "at-risk") return "amber";
  return "emerald";
}
