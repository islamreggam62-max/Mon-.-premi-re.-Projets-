import type { Metadata } from "next";
import { getDailyReportsView } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { BlockersPanel } from "@/components/daily-reports/blockers-panel";
import { CompliancePanel } from "@/components/daily-reports/compliance-panel";
import { DailyReportsWorkspace } from "@/components/daily-reports/daily-reports-workspace";

export const metadata: Metadata = {
  title: "Daily Reports",
  description: "Structured end-of-day check-ins: completed, in progress, blockers and tomorrow's plan.",
};

export default function DailyReportsPage() {
  const view = getDailyReportsView();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadence"
        title="Daily Reports"
        description="Structured end-of-day check-ins: what got done, what is moving, what is blocked and what comes next."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <CompliancePanel view={view} />
        <BlockersPanel reports={view.reports} className="xl:col-span-2" />
      </div>
      <DailyReportsWorkspace view={view} />
    </div>
  );
}
