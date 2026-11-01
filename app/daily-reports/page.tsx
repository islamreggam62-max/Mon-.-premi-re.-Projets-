import type { Metadata } from "next";
import {
  CheckCircle2,
  CircleDot,
  OctagonAlert,
  Sunrise,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { DAILY_REPORTS } from "@/lib/data/dailyReports";
import { person } from "@/lib/data/team";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Daily Reports" };

function sentimentTone(s: number): "emerald" | "amber" | "rose" {
  if (s >= 4) return "emerald";
  if (s === 3) return "amber";
  return "rose";
}

const SECTIONS = [
  { key: "completed", label: "Completed", icon: CheckCircle2, tone: "text-status-emerald" },
  { key: "inProgress", label: "In progress", icon: CircleDot, tone: "text-status-sky" },
  { key: "blockers", label: "Blockers", icon: OctagonAlert, tone: "text-status-rose" },
  { key: "tomorrow", label: "Tomorrow", icon: Sunrise, tone: "text-violet-soft" },
] as const;

export default function DailyReportsPage() {
  const dates = [...new Set(DAILY_REPORTS.map((r) => r.date))].sort((a, b) =>
    a < b ? 1 : -1,
  );
  const withBlockers = DAILY_REPORTS.filter((r) => r.blockers.length > 0).length;

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        subtitle="Structured end-of-day check-ins: completed, in progress, blockers, and tomorrow's plan."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="slate">{DAILY_REPORTS.length} check-ins</Badge>
            <Badge tone={withBlockers ? "rose" : "emerald"} dot>
              {withBlockers} with blockers
            </Badge>
          </div>
        }
      />

      <div className="space-y-8">
        {dates.map((date) => {
          const reports = DAILY_REPORTS.filter((r) => r.date === date);
          return (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-200">
                  {formatDate(date)}
                </h2>
                <span className="h-px flex-1 bg-hairline" />
                <span className="text-xs text-slate-500">
                  {reports.length} {reports.length === 1 ? "report" : "reports"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {reports.map((r) => {
                  const author = person(r.authorId);
                  if (!author) return null;
                  return (
                    <Card key={r.id}>
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar person={author} />
                            <div>
                              <p className="text-sm font-medium text-slate-100">
                                {author.name}
                              </p>
                              <p className="text-xs text-slate-400">{author.role}</p>
                            </div>
                          </div>
                          <Badge tone={sentimentTone(r.sentiment)}>
                            Energy {r.sentiment}/5
                          </Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {SECTIONS.map((section) => {
                            const items = r[section.key];
                            const Icon = section.icon;
                            return (
                              <div key={section.key}>
                                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                                  <Icon className={cn("h-3.5 w-3.5", section.tone)} />
                                  {section.label}
                                </p>
                                {items.length === 0 ? (
                                  <p className="text-xs italic text-slate-600">None</p>
                                ) : (
                                  <ul className="space-y-1">
                                    {items.map((item, i) => (
                                      <li
                                        key={i}
                                        className="flex gap-1.5 text-sm text-slate-300"
                                      >
                                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
