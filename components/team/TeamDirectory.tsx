"use client";

import { useMemo, useState } from "react";
import { Mail, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PRESENCE_DOT, PresenceBadge } from "@/components/ui/Badge";
import { SearchInput, Select } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar, type ProgressTone } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { ACCESS_ROLE_LABEL, DEPARTMENT_ORDER, PRESENCE_LABEL } from "@/lib/labels";
import { ComplianceStrip } from "@/components/reports/ComplianceStrip";
import { WORKLOAD_BAND_LABEL, workloadBand, type Compliance, type WorkloadBand } from "@/lib/metrics";
import type { Department, Person, PresenceStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type DepartmentFilter = "all" | Department;
type StatusFilter = "all" | PresenceStatus;
type SortKey = "name" | "workload-desc" | "workload-asc" | "streak-desc";

const BAND_TONE: Record<WorkloadBand, ProgressTone> = {
  healthy: "emerald",
  stretched: "amber",
  overloaded: "rose",
  unavailable: "slate",
};
const BAND_TEXT: Record<WorkloadBand, string> = {
  healthy: "text-emerald-300",
  stretched: "text-amber-300",
  overloaded: "text-rose-300",
  unavailable: "text-slate-300",
};

function matches(person: Person, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return [person.name, person.title, person.email, person.location, person.department].some((field) =>
    field.toLowerCase().includes(q),
  );
}

export function TeamDirectory({
  people,
  compliance,
  asOf,
}: {
  people: Person[];
  compliance: Record<string, Compliance>;
  asOf: string;
}) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<DepartmentFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("name");

  // Search + status apply first; department tabs show counts within that result.
  const base = useMemo(
    () => people.filter((p) => matches(p, query.trim()) && (status === "all" || p.status === status)),
    [people, query, status],
  );

  const departmentTabs = useMemo(() => {
    const present = DEPARTMENT_ORDER.filter((d) => people.some((p) => p.department === d));
    return [
      { id: "all" as DepartmentFilter, label: "All", count: base.length },
      ...present.map((d) => ({
        id: d as DepartmentFilter,
        label: d,
        count: base.filter((p) => p.department === d).length,
      })),
    ];
  }, [people, base]);

  const visible = useMemo(() => {
    const list = base.filter((p) => department === "all" || p.department === department);
    return [...list].sort((a, b) => {
      if (sort === "workload-desc") return b.workload - a.workload;
      if (sort === "workload-asc") return a.workload - b.workload;
      if (sort === "streak-desc") {
        const sa = compliance[a.id]?.expected ? compliance[a.id].streak : -1;
        const sb = compliance[b.id]?.expected ? compliance[b.id].streak : -1;
        return sb - sa || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [base, department, sort, compliance]);

  const filtersActive = query !== "" || status !== "all" || department !== "all";

  function reset() {
    setQuery("");
    setStatus("all");
    setDepartment("all");
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search team"
          placeholder="Search name, title, email, location…"
          className="md:max-w-sm md:flex-1"
        />
        <div className="grid grid-cols-2 gap-3 md:ml-auto md:flex">
          <Select<StatusFilter>
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All statuses" },
              ...(["active", "away", "offline", "on-leave"] as PresenceStatus[]).map((s) => ({
                value: s,
                label: PRESENCE_LABEL[s],
              })),
            ]}
            className="md:w-40"
          />
          <Select<SortKey>
            label="Sort by"
            value={sort}
            onChange={setSort}
            options={[
              { value: "name", label: "Name (A–Z)" },
              { value: "workload-desc", label: "Workload (high → low)" },
              { value: "workload-asc", label: "Workload (low → high)" },
              { value: "streak-desc", label: "Report streak (longest)" },
            ]}
            className="md:w-52"
          />
        </div>
      </div>

      <Tabs
        items={departmentTabs}
        value={department}
        onChange={setDepartment}
        ariaLabel="Filter by department"
        className="mt-5"
      />

      <p className="mt-4 text-xs text-slate-400" aria-live="polite">
        Showing {visible.length} of {people.length} people
      </p>

      {visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Users}
            title="No one matches these filters"
            description="Try a different search term, department, or status."
            action={
              <button type="button" onClick={reset} className="btn btn-secondary">
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => {
            const band = workloadBand(p);
            return (
              <li key={p.id} className="glass flex flex-col p-5 motion-safe:animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Avatar person={p} size="lg" />
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-base-900",
                        PRESENCE_DOT[p.status],
                      )}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-50">{p.name}</p>
                    <p className="truncate text-sm text-slate-300">{p.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{p.department}</p>
                  </div>
                  <PresenceBadge status={p.status} />
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {p.location}
                  </p>
                  <p className="flex min-w-0 items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    <a href={`mailto:${p.email}`} className="focus-ring truncate rounded text-violet-300 hover:underline">
                      {p.email}
                    </a>
                  </p>
                </div>

                <div className="mt-4 border-t border-hairline pt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Workload</span>
                    <span className={cn("font-medium tabular-nums", BAND_TEXT[band])}>
                      {band === "unavailable" ? "On leave" : `${p.workload}% · ${WORKLOAD_BAND_LABEL[band]}`}
                    </span>
                  </div>
                  <ProgressBar value={p.workload} tone={BAND_TONE[band]} label={`${p.name} workload`} />
                  {band !== "unavailable" && (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Capacity left: <span className="font-semibold tabular-nums text-slate-200">{Math.max(0, 100 - p.workload)}%</span>
                    </p>
                  )}
                </div>

                <div className="mt-4 border-t border-hairline pt-4">
                  <ReportCompliance person={p} compliance={compliance[p.id]} asOf={asOf} />
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Joined {formatDate(p.joined)}</span>
                  <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 font-medium text-slate-300">
                    {ACCESS_ROLE_LABEL[p.accessRole]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {filtersActive && visible.length > 0 && (
        <div className="mt-4">
          <button type="button" onClick={reset} className="btn btn-secondary">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function ReportCompliance({
  person,
  compliance,
  asOf,
}: {
  person: Person;
  compliance: Compliance | undefined;
  asOf: string;
}) {
  if (!compliance || !compliance.expected) {
    return (
      <p className="text-xs text-slate-400">
        Daily reports: {person.status === "on-leave" ? "excused while on leave" : "not required for this role"}
      </p>
    );
  }
  const submittedDays = compliance.days.filter((d) => d.status === "submitted").length;
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-300">Report streak</span>
        <span className="font-semibold tabular-nums text-slate-50" data-testid={`streak-${person.id}`}>
          {compliance.streak} {compliance.streak === 1 ? "day" : "days"}
          {!compliance.submittedToday && <span className="ml-1.5 font-medium text-amber-300">· due today</span>}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <ComplianceStrip
          days={compliance.days}
          asOf={asOf}
          label={`${person.name}: submitted ${submittedDays} of the last ${compliance.days.length} business days`}
        />
        <span className="text-[11px] tabular-nums text-slate-400">{compliance.rate}% / 10 days</span>
      </div>
    </>
  );
}
