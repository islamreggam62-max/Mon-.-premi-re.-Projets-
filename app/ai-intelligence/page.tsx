import type { Metadata } from "next";
import {
  Lightbulb,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, PriorityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AI_INSIGHTS } from "@/lib/data/aiInsights";
import type { InsightKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "AI Intelligence" };

const KIND_META: Record<
  InsightKind,
  { label: string; icon: typeof ShieldAlert; tone: string; ring: string }
> = {
  risk: {
    label: "Risk",
    icon: ShieldAlert,
    tone: "text-status-rose",
    ring: "bg-status-rose/10 ring-status-rose/25",
  },
  opportunity: {
    label: "Opportunity",
    icon: TrendingUp,
    tone: "text-status-emerald",
    ring: "bg-status-emerald/10 ring-status-emerald/25",
  },
  synthesis: {
    label: "Synthesis",
    icon: Wand2,
    tone: "text-status-sky",
    ring: "bg-status-sky/10 ring-status-sky/25",
  },
  recommendation: {
    label: "Recommendation",
    icon: Lightbulb,
    tone: "text-violet-soft",
    ring: "bg-violet/10 ring-violet/25",
  },
};

export default function AiIntelligencePage() {
  const risks = AI_INSIGHTS.filter((i) => i.kind === "risk").length;
  const avgConfidence = Math.round(
    AI_INSIGHTS.reduce((s, i) => s + i.confidence, 0) / AI_INSIGHTS.length,
  );

  return (
    <div>
      <PageHeader
        title="AI Operational Intelligence"
        subtitle="Executive synthesis and risk analysis across every module."
        action={
          <Badge tone="violet" dot>
            Demo mode · Phase 1
          </Badge>
        }
      />

      <Card className="mb-6 border-violet/20 bg-violet/[0.05]">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-violet-soft shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Synthesis is illustrative in Phase 1
              </p>
              <p className="mt-0.5 max-w-xl text-sm text-slate-400">
                These insights are static examples of the executive briefing NEXORA
                will generate from live project, task, and team signal. No model is
                invoked in this build.
              </p>
            </div>
          </div>
          <div className="flex gap-6 sm:gap-8">
            <div>
              <p className="text-2xl font-semibold tabular-nums text-slate-50">
                {AI_INSIGHTS.length}
              </p>
              <p className="text-xs text-slate-400">Insights</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-status-rose">
                {risks}
              </p>
              <p className="text-xs text-slate-400">Risks</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-slate-50">
                {avgConfidence}%
              </p>
              <p className="text-xs text-slate-400">Avg confidence</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {AI_INSIGHTS.map((insight) => {
          const meta = KIND_META[insight.kind];
          const Icon = meta.icon;
          return (
            <Card key={insight.id} className="flex flex-col">
              <CardBody className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      meta.ring,
                      meta.tone,
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                  <PriorityBadge priority={insight.impact} />
                </div>

                <h3 className="mt-3 text-sm font-semibold text-slate-50">
                  {insight.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">
                  {insight.body}
                </p>

                <div className="mt-4 border-t border-hairline pt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                    <span>Model confidence</span>
                    <span className="tabular-nums">{insight.confidence}%</span>
                  </div>
                  <ProgressBar value={insight.confidence} tone="violet" />
                  <p className="mt-2 text-xs text-slate-500">
                    Related module · {insight.relatedModule}
                  </p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
