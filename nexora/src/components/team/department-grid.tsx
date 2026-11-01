import { OctagonAlert, Users } from "lucide-react";
import type { DepartmentRow } from "@/lib/queries";
import { formatPercent, pluralize } from "@/lib/format";
import { workloadMeterTone } from "@/lib/presentation";
import { workloadBand } from "@/lib/analytics/team";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";

export function DepartmentGrid({ departments }: { readonly departments: readonly DepartmentRow[] }) {
  return (
    <section aria-labelledby="departments-heading">
      <h2 id="departments-heading" className="mb-3 text-sm font-semibold text-ink">
        Departments
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {departments.map((department) => {
          const average = department.averageUtilization;
          return (
            <li key={department.id} className="min-w-0">
              <Card className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink">{department.name}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-ink-muted">{department.mission}</p>
                  </div>
                  <Badge tone="brand">{department.code}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar initials={department.head.initials} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink">{department.head.name}</p>
                    <p className="truncate text-[11px] text-ink-subtle">Head · {department.head.title}</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-ink-subtle">
                    <span className="inline-flex items-center gap-1">
                      <Users aria-hidden="true" className="size-3" />
                      {pluralize(department.headcount, "person", "people")}
                    </span>
                    <span className="tabular-nums">
                      {average === null ? "No load" : `${formatPercent(average)} avg. load`}
                    </span>
                  </div>
                  <Meter
                    value={average ?? 0}
                    tone={workloadMeterTone(average === null ? null : workloadBand(average))}
                    label={`${department.name} average utilization`}
                    valueText={average === null ? "No capacity tracked" : `${formatPercent(average)} average utilization`}
                  />
                  {department.overloaded > 0 ? (
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-bad-ink">
                      <OctagonAlert aria-hidden="true" className="size-3" />
                      {pluralize(department.overloaded, "person", "people")} over capacity
                    </p>
                  ) : null}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
