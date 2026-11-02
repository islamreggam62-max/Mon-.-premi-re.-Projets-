import type { Metadata } from "next";
import { Ban, FlaskConical, ShieldCheck, UserCheck } from "lucide-react";
import { BottleneckRow, InsightCard, SummaryCard } from "@/components/ai/PreviewCards";
import { PromptComposer } from "@/components/ai/PromptComposer";
import { RiskRadar } from "@/components/ai/RiskRadar";
import { DemoBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabbedPanels } from "@/components/ui/Tabs";
import {
  AI_INSIGHTS,
  BOTTLENECKS,
  PROMPT_SUGGESTIONS,
  REPORT_SUMMARIES,
  RISK_RADAR,
} from "@/lib/data/aiPreview";
import { DAILY_REPORTS } from "@/lib/data/dailyReports";
import { TEAM } from "@/lib/data/team";
import { computePulse, indexById, riskLevel } from "@/lib/metrics";

export const metadata: Metadata = { title: "AI Intelligence" };

export default function AiIntelligencePage() {
  const people = indexById(TEAM);
  const elevated = RISK_RADAR.filter((d) => ["high", "elevated"].includes(riskLevel(d.score))).length;
  const rising = RISK_RADAR.filter((d) => d.score > d.previous).length;

  const radar = (
    <Card>
      <CardHeader
        title="Organizational risk radar"
        subtitle={`Exposure by dimension, 0–100 · ${elevated} high or elevated · ${rising} rising since last week`}
        action={<DemoBadge />}
      />
      <CardBody>
        <RiskRadar dimensions={RISK_RADAR} />
      </CardBody>
    </Card>
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

  const synthesis = (
    <div className="space-y-8">
      <section aria-labelledby="ai-insights-heading">
        <h2 id="ai-insights-heading" className="mb-3 text-sm font-semibold text-slate-50">
          Executive insights
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {AI_INSIGHTS.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>
      <section aria-labelledby="ai-summaries-heading">
        <h2 id="ai-summaries-heading" className="mb-3 text-sm font-semibold text-slate-50">
          Daily report synthesis
        </h2>
        <div className="space-y-4">
          {REPORT_SUMMARIES.map((summary) => (
            <SummaryCard
              key={summary.id}
              summary={summary}
              pulse={computePulse(DAILY_REPORTS, TEAM, summary.date)}
            />
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="AI Operational Intelligence"
        subtitle="Risk radar, detected bottlenecks, automated synthesis, and the prompt interface — previewed with static content."
        action={<DemoBadge label="Demo / Preview UI" />}
      />

      <div
        role="note"
        className="mb-6 flex flex-col gap-4 rounded-2xl border border-violet/40 bg-violet/[0.08] p-5 sm:flex-row sm:items-start"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-violet-soft shadow-glow">
          <FlaskConical className="h-5 w-5 text-white" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-50">Preview only — no AI model is connected</p>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-200">
            Everything on this page is static, hand-written demonstration content showing the layout of future AI output.
            No API is called, nothing is generated, and counts come straight from the demo data.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-300">
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

      <PromptComposer suggestions={PROMPT_SUGGESTIONS} />

      <div className="mt-8">
        <TabbedPanels
          ariaLabel="AI Intelligence previews"
          idPrefix="ai"
          tabs={[
            { id: "radar", label: "Risk radar", count: RISK_RADAR.length, content: radar },
            { id: "bottlenecks", label: "Bottlenecks", count: BOTTLENECKS.length, content: bottlenecks },
            { id: "synthesis", label: "Synthesis", count: AI_INSIGHTS.length + REPORT_SUMMARIES.length, content: synthesis },
          ]}
        />
      </div>
    </div>
  );
}
