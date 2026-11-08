"use client";

import { t } from "@/lib/i18n/core";
import Link from "next/link";
import { ArrowRight, Ban, BrainCircuit, FlaskConical, ShieldCheck, UserCheck } from "lucide-react";
import { BottleneckRow, InsightCard, SummaryCard } from "@/components/ai/PreviewCards";
import { PromptComposer } from "@/components/ai/PromptComposer";
import { RiskRadar } from "@/components/ai/RiskRadar";
import { DemoBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabbedPanels } from "@/components/ui/Tabs";
import { AI_INSIGHTS, BOTTLENECKS, PROMPT_SUGGESTIONS, REPORT_SUMMARIES, RISK_RADAR } from "@/lib/data/aiPreview";
import { computePulse, indexById, riskLevel } from "@/lib/metrics";
import { useNexora } from "@/lib/store/StoreProvider";
import { DataBadge } from "./shared";

/**
 * AI Intelligence. The sample company shows the hand-written preview of future
 * AI output. A real company sees that no model is connected yet, instead of
 * fictional insights about another company.
 */
export function AiView() {
  const { data } = useNexora();
  return data.mode === "sample" ? <SampleAiPreview /> : <AiNotConnected />;
}

function AiNotConnected() {
  const links = [
    { href: "/dashboard", label: "Needs attention today", detail: "overdue, blocked, and delayed items, counted from your records" },
    { href: "/daily-reports", label: "Daily reports", detail: "blockers and submission by person" },
    { href: "/approvals", label: "Approvals", detail: "decisions by urgency" },
  ];
  return (
    <div>
      <PageHeader
        title="AI Operational Intelligence"
        subtitle="Risk radar, bottleneck detection, and report synthesis from your company's data."
        action={<DataBadge />}
      />
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet/15 ring-1 ring-inset ring-violet/30">
            <BrainCircuit className="h-5 w-5 text-violet-200" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-50">{t("No AI model is connected yet")}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">
              {t("AI analysis needs your records to be sent to a model, so it comes with company accounts, with your consent. Until then, nothing leaves this device and NEXORA does not invent insights about your company.")}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("Available now, without AI")}</p>
            <ul className="mt-2 space-y-2">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-semibold text-violet-300 hover:text-violet-200"
                  >
                    {t(l.label)} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                  <span className="ms-2 text-sm text-slate-400">{t(l.detail)}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function SampleAiPreview() {
  const { data } = useNexora();
  const people = indexById(data.people);
  const elevated = RISK_RADAR.filter((d) => ["high", "elevated"].includes(riskLevel(d.score))).length;
  const rising = RISK_RADAR.filter((d) => d.score > d.previous).length;

  const radar = (
    <Card>
      <CardHeader
        title="Organizational risk radar"
        subtitle={t("Exposure by dimension, 0–100 · {a} high or elevated · {b} rising since last week", { a: elevated, b: rising })}
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
          {t("Executive insights")}
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {AI_INSIGHTS.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>
      <section aria-labelledby="ai-summaries-heading">
        <h2 id="ai-summaries-heading" className="mb-3 text-sm font-semibold text-slate-50">
          {t("Daily report synthesis")}
        </h2>
        <div className="space-y-4">
          {REPORT_SUMMARIES.map((summary) => (
            <SummaryCard
              key={summary.id}
              summary={summary}
              pulse={computePulse(data.reports, data.people, summary.date)}
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
        action={<DemoBadge label="Sample data · Preview" />}
      />

      <div
        role="note"
        className="mb-6 flex flex-col gap-4 rounded-2xl border border-violet/40 bg-violet/[0.08] p-5 sm:flex-row sm:items-start"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-violet-soft shadow-glow">
          <FlaskConical className="h-5 w-5 text-white" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-50">{t("Preview only — no AI model is connected")}</p>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-200">
            {t("Everything on this page is static, hand-written demonstration content showing the layout of future AI output. No API is called and nothing is generated.")}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-300">
            <li className="flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" /> {t("No model calls")}
            </li>
            <li className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" /> {t("Insights are advisory; executives decide")}
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" /> {t("No keys or credentials in this build")}
            </li>
          </ul>
        </div>
      </div>

      <PromptComposer suggestions={PROMPT_SUGGESTIONS} />

      <div className="mt-8">
        <TabbedPanels
          ariaLabel={t("AI Intelligence previews")}
          idPrefix="ai"
          tabs={[
            { id: "radar", label: t("Risk radar"), count: RISK_RADAR.length, content: radar },
            { id: "bottlenecks", label: t("Bottlenecks"), count: BOTTLENECKS.length, content: bottlenecks },
            { id: "synthesis", label: t("Synthesis"), count: AI_INSIGHTS.length + REPORT_SUMMARIES.length, content: synthesis },
          ]}
        />
      </div>
    </div>
  );
}
