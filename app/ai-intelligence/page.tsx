import type { Metadata } from "next";
import { Ban, FlaskConical, ShieldCheck, UserCheck } from "lucide-react";
import { BottleneckRow, InsightCard, SummaryCard } from "@/components/ai/PreviewCards";
import { DemoBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabbedPanels } from "@/components/ui/Tabs";
import { AI_INSIGHTS, BOTTLENECKS, REPORT_SUMMARIES } from "@/lib/data/aiPreview";
import { DAILY_REPORTS } from "@/lib/data/dailyReports";
import { TEAM } from "@/lib/data/team";
import { computePulse, indexById } from "@/lib/metrics";

export const metadata: Metadata = { title: "AI Intelligence" };

export default function AiIntelligencePage() {
  const people = indexById(TEAM);

  const insights = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {AI_INSIGHTS.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );

  const summaries = (
    <div className="space-y-4">
      {REPORT_SUMMARIES.map((summary) => (
        <SummaryCard
          key={summary.id}
          summary={summary}
          pulse={computePulse(DAILY_REPORTS, TEAM, summary.date)}
        />
      ))}
    </div>
  );

  const bottlenecks = (
    <ul className="space-y-4">
      {BOTTLENECKS.map((item) => (
        <BottleneckRow
          key={item.id}
          item={item}
          people={item.affectedIds.map((id) => people[id]).filter(Boolean)}
        />
      ))}
    </ul>
  );

  return (
    <div>
      <PageHeader
        title="AI Operational Intelligence"
        subtitle="How NEXORA will present executive insights, daily report summaries, and bottleneck detection."
        action={<DemoBadge label="Demo / Preview UI" />}
      />

      <div
        role="note"
        className="mb-6 flex flex-col gap-4 rounded-2xl border border-violet/30 bg-violet/[0.07] p-5 sm:flex-row sm:items-start"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-violet-soft shadow-glow">
          <FlaskConical className="h-5 w-5 text-white" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-50">Preview only — no AI model is connected</p>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-300">
            Everything on this page is static, hand-written demonstration content. It shows the layout and tone of
            future AI output. No API is called, nothing is generated, and counts come straight from the demo data.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-400">
            <li className="flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" /> No model calls
            </li>
            <li className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" /> Insights are advisory; executives decide
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" /> No keys or credentials in this build
            </li>
          </ul>
        </div>
      </div>

      <TabbedPanels
        ariaLabel="AI Intelligence previews"
        idPrefix="ai"
        tabs={[
          { id: "insights", label: "Executive insights", count: AI_INSIGHTS.length, content: insights },
          { id: "summaries", label: "Daily report summaries", count: REPORT_SUMMARIES.length, content: summaries },
          { id: "bottlenecks", label: "Bottleneck detection", count: BOTTLENECKS.length, content: bottlenecks },
        ]}
      />
    </div>
  );
}
