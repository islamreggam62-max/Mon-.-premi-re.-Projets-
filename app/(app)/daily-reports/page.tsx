import type { Metadata } from "next";
import { DemoBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportFeed } from "@/components/reports/ReportFeed";
import { DAILY_REPORTS, REPORT_HISTORY } from "@/lib/data/dailyReports";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { TEAM } from "@/lib/data/team";

export const metadata: Metadata = { title: "Daily Reports" };

export default function DailyReportsPage() {
  return (
    <div>
      <PageHeader
        title="Daily Reports"
        subtitle="Structured end-of-day logs — Completed Work, Priorities, and Blockers — with submission tracking."
        action={<DemoBadge label="Static demo data" />}
      />
      <ReportFeed reports={DAILY_REPORTS} history={REPORT_HISTORY} people={TEAM} asOf={DEMO_AS_OF} />
    </div>
  );
}
