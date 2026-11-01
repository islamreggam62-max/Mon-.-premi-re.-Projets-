import type { Metadata } from "next";
import { DemoBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportFeed } from "@/components/reports/ReportFeed";
import { DAILY_REPORTS } from "@/lib/data/dailyReports";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { TEAM } from "@/lib/data/team";

export const metadata: Metadata = { title: "Daily Reports" };

export default function DailyReportsPage() {
  return (
    <div>
      <PageHeader
        title="Daily Reports"
        subtitle="Structured end-of-day check-ins: Completed Today, In Progress, Blockers, and Tomorrow's Plan."
        action={<DemoBadge label="Static demo data" />}
      />
      <ReportFeed reports={DAILY_REPORTS} people={TEAM} asOf={DEMO_AS_OF} />
    </div>
  );
}
