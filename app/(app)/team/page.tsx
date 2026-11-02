import type { Metadata } from "next";
import { Activity, ClipboardCheck, Gauge, TriangleAlert } from "lucide-react";
import { DemoBadge } from "@/components/ui/Badge";
import { MiniStat } from "@/components/ui/MiniStat";
import { PageHeader } from "@/components/ui/PageHeader";
import { TeamDirectory } from "@/components/team/TeamDirectory";
import { DAILY_REPORTS, REPORT_HISTORY } from "@/lib/data/dailyReports";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { TEAM } from "@/lib/data/team";
import { computeCompliance, submissionLog, workloadBand, type Compliance } from "@/lib/metrics";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  const log = submissionLog(DAILY_REPORTS, REPORT_HISTORY);
  const compliance: Record<string, Compliance> = Object.fromEntries(
    TEAM.map((p) => [p.id, computeCompliance(p, log, DEMO_AS_OF)]),
  );
  const expected = Object.values(compliance).filter((c) => c.expected);
  const avgCompliance = Math.round(expected.reduce((s, c) => s + c.rate, 0) / expected.length);

  const available = TEAM.filter((p) => p.status !== "on-leave");
  const avgWorkload = Math.round(available.reduce((sum, p) => sum + p.workload, 0) / available.length);
  const overloaded = TEAM.filter((p) => workloadBand(p) === "overloaded").length;
  const active = TEAM.filter((p) => p.status === "active").length;

  return (
    <div>
      <PageHeader
        title="Team & Organization"
        subtitle="Members, roles, departments, workload capacity, and daily report compliance."
        action={<DemoBadge label="Static demo data" />}
      />

      <section aria-label="Team summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={Activity} label="Active now" value={`${active} / ${TEAM.length}`} hint="people online" />
        <MiniStat icon={Gauge} label="Avg workload" value={`${avgWorkload}%`} hint="excluding leave" />
        <MiniStat
          icon={TriangleAlert}
          label="Over capacity"
          value={String(overloaded)}
          hint="at 90% workload or above"
          tone={overloaded > 0 ? "rose" : "default"}
        />
        <MiniStat
          icon={ClipboardCheck}
          label="Report compliance"
          value={`${avgCompliance}%`}
          hint="last 10 business days"
        />
      </section>

      <TeamDirectory people={TEAM} compliance={compliance} asOf={DEMO_AS_OF} />
    </div>
  );
}
