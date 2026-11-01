import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import { getIntelligenceView } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { DemoNotice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { AskPanel } from "@/components/ai/ask-panel";
import { ExecutiveBriefing } from "@/components/ai/briefing";
import { InsightFeed } from "@/components/ai/insight-feed";
import { Methodology } from "@/components/ai/methodology";
import { RiskRadar } from "@/components/ai/risk-radar";

export const metadata: Metadata = {
  title: "AI Intelligence",
  description: "Executive synthesis, risk analysis and recommendations (demo mode).",
};

export default function IntelligencePage() {
  const view = getIntelligenceView();
  const { scope } = view;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="AI Intelligence"
        description="Executive synthesis and risk analysis across initiatives, people, check-ins and approvals."
        actions={
          <Badge tone="brand" icon={FlaskConical} className="px-2.5 py-1 text-xs">
            Demo mode
          </Badge>
        }
      />

      <DemoNotice>
        Phase 1 runs in demo mode. The briefing and signals below come from transparent rules applied to
        workspace data ({scope.initiatives} initiatives, {scope.tasks} tasks, {scope.checkIns} check-ins,{" "}
        {scope.approvals} approvals, {scope.people} people) as of {formatDate(view.today, "weekday")},{" "}
        {formatTime(view.asOf, view.timeZone)}. No AI model is connected, and no data leaves this application.
      </DemoNotice>

      <ExecutiveBriefing briefing={view.briefing} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <RiskRadar risks={view.risks} />
        {/* min-w-0: lets the methodology table scroll inside its card instead of widening the column. */}
        <div className="min-w-0 space-y-6">
          <Methodology />
          <AskPanel />
        </div>
      </div>

      <InsightFeed insights={view.insights} />
    </div>
  );
}
