"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileSearch,
  Gauge,
  OctagonAlert,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DocTypeBadge, VerdictBadge } from "@/components/lexaudit/LexBadges";
import { RiskChip } from "@/components/lexaudit/RiskGauge";
import { useLang } from "@/components/lexaudit/LangProvider";
import { LEX_HOME } from "@/lib/lexaudit/nav";
import { AUDIT_LOG } from "@/lib/lexaudit/data/log";
import { AUDIT_RESULTS } from "@/lib/lexaudit/data/audits";
import { TENDER_RESULT } from "@/lib/lexaudit/data/tender";
import { portfolioStats, riskByCheckpoint, RISK_BAND_LABEL, riskBand } from "@/lib/lexaudit/metrics";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const { t, lang } = useLang();
  const stats = portfolioStats(AUDIT_LOG);
  const recent = AUDIT_LOG.slice(0, 5);
  const byCheckpoint = riskByCheckpoint([...AUDIT_RESULTS, TENDER_RESULT]).slice(0, 7);
  const maxScore = Math.max(1, ...byCheckpoint.map((r) => r.score));
  const avgBand = riskBand(stats.avgRisk);

  return (
    <div className="space-y-6">
      <section aria-label="KPIs" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={FileSearch} label={t("dash.kpi.audited")} value={String(stats.audited)} hint={t("dash.thisMonth")} />
        <Kpi icon={ShieldAlert} label={t("dash.kpi.openRisks")} value={String(stats.openRisks)} hint={t("dash.acrossPortfolio")} tone="amber" />
        <Kpi
          icon={Gauge}
          label={t("dash.kpi.avgRisk")}
          value={String(stats.avgRisk)}
          hint={RISK_BAND_LABEL[avgBand][lang]}
          tone="violet"
        />
        <Kpi icon={OctagonAlert} label={t("dash.kpi.critical")} value={String(stats.criticalFindings)} hint={t("dash.needAttention")} tone="rose" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Recent audits */}
        <Card>
          <CardHeader
            title={t("dash.recent")}
            action={
              <Link href={`${LEX_HOME}/audit-log`} className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-violet-300 hover:text-violet-200">
                {t("nav.log")} <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="p-0">
            <ul className="divide-y divide-white/5">
              {recent.map((r) => {
                const row = (
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-100">{r.fileName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <DocTypeBadge type={r.documentType} />
                        <span className="text-xs text-slate-400">{r.counterparty}</span>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <VerdictBadge verdict={r.verdict} />
                    </div>
                    <RiskChip score={r.riskScore} />
                    {r.resultId && <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 rtl:rotate-180" aria-hidden="true" />}
                  </div>
                );
                return (
                  <li key={r.id}>
                    {r.resultId ? (
                      <Link href={`${LEX_HOME}/results`} className="focus-ring block transition-colors hover:bg-white/[0.03]">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        {/* Risk by checkpoint + CTA */}
        <div className="space-y-6">
          <Card>
            <CardHeader title={t("dash.byCategory")} />
            <CardBody>
              <ul className="space-y-3">
                {byCheckpoint.map((r) => (
                  <li key={r.checkpoint}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-slate-300">{t(`cp.${r.checkpoint}`)}</span>
                      <span className="tabular-nums text-slate-400">{r.score}</span>
                    </div>
                    <span className="mt-1 block h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-500"
                        style={{ width: `${(r.score / maxScore) * 100}%` }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card strong className="overflow-hidden">
            <CardBody className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-slate-50">{t("brand.tagline")}</p>
              <Link href={`${LEX_HOME}/new-audit`} className="btn btn-primary w-full py-2.5 text-sm">
                <FileSearch className="h-4 w-4" aria-hidden="true" /> {t("dash.startAudit")}
              </Link>
              <Link href={`${LEX_HOME}/results`} className="btn btn-secondary w-full py-2.5 text-sm">
                {t("dash.openResult")} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "amber" | "rose" | "violet";
}) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/15 ring-1 ring-inset ring-violet/30">
          <Icon className="h-4 w-4 text-violet-200" aria-hidden="true" />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tabular-nums",
          tone === "amber" && "text-amber-300",
          tone === "rose" && "text-rose-300",
          tone === "violet" && "text-violet-200",
          tone === "default" && "text-slate-50",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
