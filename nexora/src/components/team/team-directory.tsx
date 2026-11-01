"use client";

import { useMemo, useState } from "react";
import { Mail, MapPin, SearchX } from "lucide-react";
import { ROLE_KEYS, WORKLOAD_BANDS } from "@/types";
import type { RoleKey, WorkloadBand } from "@/types";
import type { DepartmentRow, MemberRow } from "@/lib/queries";
import { formatDate, formatPercent, pluralize } from "@/lib/format";
import { ROLE_LABELS, WORKLOAD_BAND_LABELS } from "@/lib/labels";
import {
  AVAILABILITY_STYLES,
  ROLE_STYLES,
  workloadMeterTone,
} from "@/lib/presentation";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, StatusText } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { SearchField, SelectField } from "@/components/ui/controls";
import { Meter } from "@/components/ui/meter";
import { EmptyState } from "@/components/ui/notice";

type SortKey = "name" | "load";
const ALL = "all";

function availabilityNote(row: MemberRow): string | null {
  if (row.availability.status === "busy") return row.availability.note;
  if (row.availability.status === "out-of-office") {
    return `Away until ${formatDate(row.availability.until, "short")}`;
  }
  return null;
}

function WorkloadCell({ row }: { readonly row: MemberRow }) {
  if (row.utilization === null) {
    return <span className="text-xs text-ink-subtle">Not tracked</span>;
  }
  return (
    <div className="min-w-28">
      <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px] tabular-nums">
        <span className="font-semibold text-ink">{formatPercent(row.utilization)}</span>
        <span className="text-ink-subtle">
          {row.committedHours}/{row.capacityHours} h
        </span>
      </div>
      <Meter
        value={row.utilization}
        tone={workloadMeterTone(row.band)}
        label={`${row.member.name} utilization`}
        valueText={`${formatPercent(row.utilization)}: ${row.committedHours} of ${row.capacityHours} hours committed`}
      />
    </div>
  );
}

export function TeamDirectory({
  members,
  departments,
}: {
  readonly members: readonly MemberRow[];
  readonly departments: readonly DepartmentRow[];
}) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<string>(ALL);
  const [role, setRole] = useState<RoleKey | typeof ALL>(ALL);
  const [band, setBand] = useState<WorkloadBand | typeof ALL>(ALL);
  const [sort, setSort] = useState<SortKey>("name");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members
      .filter((row) => {
        if (department !== ALL && row.department.id !== department) return false;
        if (role !== ALL && row.role !== role) return false;
        if (band !== ALL && row.band !== band) return false;
        if (!needle) return true;
        return [row.member.name, row.member.title, row.location, row.email, row.department.name]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .slice()
      .sort((a, b) =>
        sort === "load"
          ? (b.utilization ?? -1) - (a.utilization ?? -1)
          : a.member.name.localeCompare(b.member.name, "en"),
      );
  }, [members, query, department, role, band, sort]);

  return (
    <Panel
      id="directory"
      title="Directory"
      description={`${pluralize(rows.length, "person", "people")} shown of ${members.length}.`}
      bodyClassName="px-0 sm:px-0 pb-2"
    >
      <div className="grid gap-2 px-4 pb-3 sm:grid-cols-2 sm:px-5 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <SearchField
          label="Search people"
          placeholder="Search name, title, city…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <SelectField label="Department" value={department} onChange={(event) => setDepartment(event.target.value)}>
          <option value={ALL}>All departments</option>
          {departments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value as RoleKey | typeof ALL)}
        >
          <option value={ALL}>All roles</option>
          {ROLE_KEYS.map((key) => (
            <option key={key} value={key}>
              {ROLE_LABELS[key]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Workload"
          value={band}
          onChange={(event) => setBand(event.target.value as WorkloadBand | typeof ALL)}
        >
          <option value={ALL}>Any workload</option>
          {WORKLOAD_BANDS.map((key) => (
            <option key={key} value={key}>
              {WORKLOAD_BAND_LABELS[key]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Sort by" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
          <option value="name">Sort: name</option>
          <option value="load">Sort: workload</option>
        </SelectField>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 pb-2 sm:px-5">
          <EmptyState icon={SearchX} title="No one matches these filters" description="Clear a filter or broaden the search." />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[60rem] text-left text-sm">
              <thead>
                <tr className="border-y border-line text-[11px] uppercase tracking-wider text-ink-subtle">
                  <th scope="col" className="px-5 py-2 font-medium">Member</th>
                  <th scope="col" className="px-3 py-2 font-medium">Department</th>
                  <th scope="col" className="px-3 py-2 font-medium">Role</th>
                  <th scope="col" className="px-3 py-2 font-medium">Location</th>
                  <th scope="col" className="px-3 py-2 font-medium">Availability</th>
                  <th scope="col" className="px-3 py-2 font-medium">Workload</th>
                  <th scope="col" className="px-5 py-2 text-right font-medium">Open tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => {
                  const note = availabilityNote(row);
                  return (
                    <tr key={row.member.id} className="transition-colors hover:bg-white/[0.02]">
                      <th scope="row" className="px-5 py-2.5 font-normal">
                        <div className="flex items-center gap-3">
                          <Avatar initials={row.member.initials} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{row.member.name}</p>
                            <p className="truncate text-xs text-ink-subtle">{row.member.title}</p>
                          </div>
                        </div>
                      </th>
                      <td className="px-3 py-2.5">
                        <p className="text-ink">{row.department.name}</p>
                        <p className="text-xs text-ink-subtle">
                          {row.manager ? `Reports to ${row.manager.name}` : "No manager"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge style={ROLE_STYLES[row.role]} prefix="Role" />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-ink">{row.location}</p>
                        <p className="text-xs text-ink-subtle">{row.timeZone}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusText style={AVAILABILITY_STYLES[row.availability.status]} />
                        {note ? <p className="mt-0.5 text-[11px] text-ink-subtle">{note}</p> : null}
                      </td>
                      <td className="w-40 px-3 py-2.5">
                        <WorkloadCell row={row} />
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums">
                        <span className="text-ink">{row.openTasks}</span>
                        {row.overdueTasks > 0 ? (
                          <span className="ml-1.5 text-xs text-bad-ink">{row.overdueTasks} overdue</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-line border-t border-line lg:hidden">
            {rows.map((row) => {
              const note = availabilityNote(row);
              return (
                <li key={row.member.id} className="space-y-3 px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <Avatar initials={row.member.initials} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{row.member.name}</p>
                      <p className="text-xs text-ink-subtle">
                        {row.member.title} · {row.department.code}
                      </p>
                    </div>
                    <StatusBadge style={ROLE_STYLES[row.role]} prefix="Role" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden="true" className="size-3.5 text-ink-subtle" />
                      {row.location}
                    </span>
                    <StatusText style={AVAILABILITY_STYLES[row.availability.status]} />
                    {note ? <span className="text-ink-subtle">{note}</span> : null}
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-end gap-4">
                    <WorkloadCell row={row} />
                    <p className="text-right text-xs text-ink-muted">
                      {pluralize(row.openTasks, "open task")}
                      {row.overdueTasks > 0 ? <span className="block text-bad-ink">{row.overdueTasks} overdue</span> : null}
                    </p>
                  </div>
                  <a
                    href={`mailto:${row.email}`}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-ink hover:text-brand-ink-strong"
                  >
                    <Mail aria-hidden="true" className="size-3.5" />
                    {row.email}
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}
