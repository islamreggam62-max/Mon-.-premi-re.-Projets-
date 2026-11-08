"use client";

import { t } from "@/lib/i18n/core";
import { useState } from "react";
import { Activity, ClipboardCheck, Gauge, TriangleAlert, Users } from "lucide-react";
import { PersonFormDialog } from "@/components/forms/PersonForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { MiniStat } from "@/components/ui/MiniStat";
import { PageHeader } from "@/components/ui/PageHeader";
import { TeamDirectory } from "@/components/team/TeamDirectory";
import { computeCompliance, submissionLog, workloadBand, type Compliance } from "@/lib/metrics";
import { asOfDay } from "@/lib/store/derived";
import { useNexora } from "@/lib/store/StoreProvider";
import type { Person } from "@/lib/types";
import { HeaderActions, NewButton, mean, pct } from "./shared";

export function TeamView() {
  const { data } = useNexora();
  const [editing, setEditing] = useState<Person | "new" | null>(null);
  const asOf = asOfDay(data);
  const team = data.people;

  const log = submissionLog(data.reports, data.reportHistory);
  const compliance: Record<string, Compliance> = Object.fromEntries(team.map((p) => [p.id, computeCompliance(p, log, asOf)]));
  const avgCompliance = mean(Object.values(compliance).filter((c) => c.expected).map((c) => c.rate));
  const avgWorkload = mean(team.filter((p) => p.status !== "on-leave").map((p) => p.workload));
  const overloaded = team.filter((p) => workloadBand(p) === "overloaded").length;
  const active = team.filter((p) => p.status === "active").length;

  return (
    <div>
      <PageHeader
        title="Team & Organization"
        subtitle="Members, roles, departments, workload capacity, and daily report compliance."
        action={<HeaderActions label="Add member" onNew={() => setEditing("new")} />}
      />

      <section aria-label={t("Team summary")} className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={Activity} label="Active now" value={`${active} / ${team.length}`} hint="marked Active" />
        <MiniStat icon={Gauge} label="Avg workload" value={pct(avgWorkload)} hint="excluding leave" />
        <MiniStat
          icon={TriangleAlert}
          label="Over capacity"
          value={String(overloaded)}
          hint="at 90% workload or above"
          tone={overloaded > 0 ? "rose" : "default"}
        />
        <MiniStat icon={ClipboardCheck} label="Report compliance" value={pct(avgCompliance)} hint="last 10 business days" />
      </section>

      {team.length <= 1 && data.mode === "company" && (
        <div className="mb-6">
          <EmptyState
            icon={Users}
            title="Only you so far"
            description="Add the people you manage. They do not need an account: you record their reports and tasks here."
            action={<NewButton label="Add member" onClick={() => setEditing("new")} />}
          />
        </div>
      )}

      <TeamDirectory people={team} compliance={compliance} asOf={asOf} onEdit={setEditing} />

      <PersonFormDialog open={editing !== null} onClose={() => setEditing(null)} person={editing === "new" || editing === null ? undefined : editing} />
    </div>
  );
}
