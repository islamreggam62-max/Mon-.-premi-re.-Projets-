"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  ListChecks,
  OctagonAlert,
  Rows3,
  Target,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, SeverityBadge, type Tone } from "@/components/ui/Badge";
import { SearchInput, Select, ToggleChip } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { ComplianceStrip } from "@/components/reports/ComplianceStrip";
import { computeCompliance, computePulse, indexById, submissionLog } from "@/lib/metrics";
import type { DailyReport, Person, ReportBlocker } from "@/lib/types";
import { cn, formatShortDate, formatTime, relativeDay } from "@/lib/utils";

type View = "reports" | "status";

function energyTone(energy: number): Tone {
  if (energy >= 4) return "emerald";
  if (energy === 3) return "amber";
  return "rose";
}

function reportText(report: DailyReport): string {
  return [
    ...report.completed,
    ...report.priorities,
    ...report.blockers.flatMap((b) => [b.description, b.waitingOn]),
  ]
    .join(" ")
    .toLowerCase();
}

export function ReportFeed({
  reports,
  history,
  people,
  asOf,
}: {
  reports: DailyReport[];
  history: Record<string, string[]>;
  people: Person[];
  asOf: string;
}) {
  const dates = useMemo(
    () => [...new Set(reports.map((r) => r.date))].sort((a, b) => b.localeCompare(a)),
    [reports],
  );
  const [date, setDate] = useState(dates.includes(asOf) ? asOf : dates[0]);
  const [view, setView] = useState<View>("reports");
  const [query, setQuery] = useState("");
  const [authorId, setAuthorId] = useState("all");
  const [blockersOnly, setBlockersOnly] = useState(false);

  const byId = useMemo(() => indexById(people), [people]);
  const pulse = useMemo(() => computePulse(reports, people, date), [reports, people, date]);
  const log = useMemo(() => submissionLog(reports, history), [reports, history]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports
      .filter(
        (r) =>
          r.date === date &&
          (authorId === "all" || r.authorId === authorId) &&
          (!blockersOnly || r.blockers.length > 0) &&
          (!q || reportText(r).includes(q) || (byId[r.authorId]?.name.toLowerCase().includes(q) ?? false)),
      )
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [reports, date, authorId, blockersOnly, query, byId]);

  const dateTabs = dates.map((d) => ({
    id: d,
    label: `${relativeDay(d, asOf)} · ${formatShortDate(d)}`,
    count: reports.filter((r) => r.date === d).length,
  }));

  const authors = pulse.expected.slice().sort((a, b) => a.name.localeCompare(b.name));
  const filtersActive = query !== "" || authorId !== "all" || blockersOnly;

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Tabs items={dateTabs} value={date} onChange={setDate} ariaLabel="Report date" className="md:flex-1" />
        <Tabs<View>
          variant="pill"
          ariaLabel="Choose view"
          value={view}
          onChange={setView}
          items={[
            { id: "reports", label: "Reports", icon: Rows3 },
            { id: "status", label: "Submission status", icon: ListChecks },
          ]}
        />
      </div>

      {/* Submission pulse */}
      <section aria-label="Submission pulse" className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass col-span-2 p-4 lg:col-span-1">
          <p className="text-xs text-slate-300">Submitted</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-50">
            {pulse.submitted.length} / {pulse.expected.length}
            <span className="ml-2 text-sm font-medium text-slate-300">{pulse.rate}%</span>
          </p>
          <ProgressBar
            value={pulse.rate}
            tone={pulse.rate >= 80 ? "emerald" : pulse.rate >= 60 ? "amber" : "rose"}
            className="mt-2"
            label="Submission rate"
          />
        </div>
        <div className="glass p-4">
          <p className="text-xs text-slate-300">Blockers raised</p>
          <p className={cn("mt-1 text-xl font-semibold tabular-nums", pulse.blockerCount ? "text-rose-300" : "text-slate-50")}>
            {pulse.blockerCount}
          </p>
        </div>
        <div className="glass p-4">
          <p className="text-xs text-slate-300">Average energy</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-50">
            {pulse.avgEnergy === null ? "—" : `${pulse.avgEnergy.toFixed(1)} / 5`}
          </p>
        </div>
        <div className="glass col-span-2 p-4 lg:col-span-1">
          <p className="flex items-center gap-1.5 text-xs text-slate-300">
            <UserX className="h-3.5 w-3.5" aria-hidden="true" /> Not submitted · {pulse.missing.length}
          </p>
          {pulse.missing.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-300">Everyone reported.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {pulse.missing.map((p) => (
                <li key={p.id} className="flex items-center gap-1.5 rounded-full bg-white/[0.06] py-0.5 pl-0.5 pr-2.5">
                  <Avatar person={p} size="xs" />
                  <span className="text-xs text-slate-200">{p.name.split(" ")[0]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {view === "status" ? (
        <SubmissionTracker people={people} reports={reports} log={log} date={date} asOf={asOf} />
      ) : (
        <>
          {/* Filters */}
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
            <SearchInput
              value={query}
              onChange={setQuery}
              label="Search reports"
              placeholder="Search report content or names…"
              className="md:max-w-sm md:flex-1"
            />
            <Select
              label="Team member"
              value={authorId}
              onChange={setAuthorId}
              options={[{ value: "all", label: "Everyone" }, ...authors.map((p) => ({ value: p.id, label: p.name }))]}
              className="md:w-56"
            />
            <div className="flex items-center gap-3 md:pb-1.5">
              <ToggleChip pressed={blockersOnly} onToggle={() => setBlockersOnly((v) => !v)}>
                <OctagonAlert className="h-3 w-3" aria-hidden="true" /> With blockers only
              </ToggleChip>
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setAuthorId("all");
                    setBlockersOnly(false);
                  }}
                  className="text-xs font-semibold text-violet-300 hover:text-violet-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400" aria-live="polite">
            Showing {visible.length} of {pulse.submitted.length} reports for {formatShortDate(date)}
          </p>

          {visible.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon={ClipboardList} title="No reports match these filters" />
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {visible.map((report) => {
                const author = byId[report.authorId];
                return (
                  <article key={report.id} className="glass overflow-hidden motion-safe:animate-fade-in">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {author && <Avatar person={author} />}
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-semibold text-slate-50">{author?.name}</h2>
                          <p className="truncate text-xs text-slate-300">
                            {author?.title} · {author?.department}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="emerald" dot>
                          Submitted {formatTime(report.submittedAt)}
                        </Badge>
                        <Badge tone={energyTone(report.energy)}>Energy {report.energy}/5</Badge>
                      </div>
                    </header>
                    <div className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-3">
                      <ReportSection icon={CheckCircle2} title="Completed Work" accent="emerald" items={report.completed} />
                      <ReportSection icon={Target} title="Priorities" accent="violet" items={report.priorities} />
                      <BlockerSection blockers={report.blockers} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Submission status tracker
 * ------------------------------------------------------------------------- */

function SubmissionTracker({
  people,
  reports,
  log,
  date,
  asOf,
}: {
  people: Person[];
  reports: DailyReport[];
  log: Record<string, Set<string>>;
  date: string;
  asOf: string;
}) {
  const rows = people
    .map((person) => {
      const compliance = computeCompliance(person, log, date);
      const report = reports.find((r) => r.authorId === person.id && r.date === date);
      return { person, compliance, report };
    })
    .sort((a, b) => {
      const rank = (r: typeof a) => (!r.compliance.expected ? 2 : r.report ? 1 : 0);
      return rank(a) - rank(b) || a.person.name.localeCompare(b.person.name);
    });

  return (
    <div className="glass mt-6 overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">Daily report submission status for {formatShortDate(date)}</caption>
        <thead>
          <tr className="border-b border-hairline text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <th scope="col" className="px-5 py-3">Member</th>
            <th scope="col" className="px-3 py-3">{formatShortDate(date)}</th>
            <th scope="col" className="px-3 py-3">Streak</th>
            <th scope="col" className="px-3 py-3">Last 10 business days</th>
            <th scope="col" className="px-5 py-3 text-right">Compliance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map(({ person, compliance, report }) => {
            const submittedDays = compliance.days.filter((d) => d.status === "submitted").length;
            return (
              <tr key={person.id} data-testid={`tracker-${person.id}`}>
                <th scope="row" className="px-5 py-3 text-left font-normal">
                  <span className="flex items-center gap-3">
                    <Avatar person={person} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-50">{person.name}</span>
                      <span className="block truncate text-xs text-slate-400">{person.department}</span>
                    </span>
                  </span>
                </th>
                <td className="px-3 py-3">
                  {!compliance.expected ? (
                    <Badge tone="slate">{person.status === "on-leave" ? "Excused · on leave" : "Not required"}</Badge>
                  ) : report ? (
                    <Badge tone="emerald" dot>
                      Submitted {formatTime(report.submittedAt)}
                    </Badge>
                  ) : (
                    <Badge tone={date === asOf ? "amber" : "rose"} dot>
                      {date === asOf ? "Not yet submitted" : "Missing"}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-3 tabular-nums text-slate-100">
                  {compliance.expected ? `${compliance.streak} ${compliance.streak === 1 ? "day" : "days"}` : "—"}
                </td>
                <td className="px-3 py-3">
                  {compliance.expected ? (
                    <ComplianceStrip
                      days={compliance.days}
                      asOf={asOf}
                      label={`${person.name}: submitted ${submittedDays} of the last ${compliance.days.length} business days`}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {compliance.expected ? (
                    <span className={cn("font-semibold", compliance.rate < 70 ? "text-amber-300" : "text-slate-100")}>
                      {compliance.rate}%
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline px-5 py-3 text-[11px] text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-status-emerald" aria-hidden="true" /> Submitted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] border border-status-rose/70" aria-hidden="true" /> Missing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] border border-dashed border-slate-400" aria-hidden="true" /> Today, still open
        </span>
        <span className="text-slate-400">Streak counts consecutive business days; today counts once submitted.</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Report sections
 * ------------------------------------------------------------------------- */

const ACCENT: Record<"emerald" | "rose" | "violet", { bar: string; icon: string; dot: string }> = {
  emerald: { bar: "before:bg-status-emerald", icon: "text-emerald-300", dot: "bg-status-emerald" },
  rose: { bar: "before:bg-status-rose", icon: "text-rose-300", dot: "bg-status-rose" },
  violet: { bar: "before:bg-violet-soft", icon: "text-violet-300", dot: "bg-violet-soft" },
};

function SectionShell({
  icon: Icon,
  title,
  accent,
  count,
  children,
}: {
  icon: LucideIcon;
  title: string;
  accent: keyof typeof ACCENT;
  count: number;
  children: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <section
      className={cn(
        "relative bg-base-900 px-5 py-4 before:absolute before:inset-y-4 before:left-0 before:w-0.5 before:rounded-r-full",
        a.bar,
      )}
    >
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
        <Icon className={cn("h-4 w-4", a.icon)} aria-hidden="true" />
        {title}
        <span className="font-normal text-slate-400">· {count}</span>
      </h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function ReportSection({
  icon,
  title,
  accent,
  items,
}: {
  icon: LucideIcon;
  title: string;
  accent: keyof typeof ACCENT;
  items: string[];
}) {
  return (
    <SectionShell icon={icon} title={title} accent={accent} count={items.length}>
      {items.length === 0 ? (
        <p className="text-sm italic text-slate-400">Nothing reported</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-200">
              <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", ACCENT[accent].dot)} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

function BlockerSection({ blockers }: { blockers: ReportBlocker[] }) {
  return (
    <SectionShell icon={OctagonAlert} title="Blockers" accent="rose" count={blockers.length}>
      {blockers.length === 0 ? (
        <p className="flex items-center gap-1.5 text-sm text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> No blockers
        </p>
      ) : (
        <ul className="space-y-2.5">
          {blockers.map((b) => (
            <li key={b.id} className="rounded-lg border border-status-rose/30 bg-status-rose/[0.07] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-50">{b.description}</p>
                <SeverityBadge severity={b.severity} />
              </div>
              <p className="mt-1.5 text-xs text-slate-300">Waiting on {b.waitingOn}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}
