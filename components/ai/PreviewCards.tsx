/**
 * Presentational cards for the AI Intelligence preview.
 * Server-safe: no state, no effects, no network. Every card is labeled static.
 */
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Lightbulb,
  ShieldAlert,
  TrendingUp,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { AvatarStack } from "@/components/ui/Avatar";
import { Badge, DemoBadge, PriorityBadge } from "@/components/ui/Badge";
import type { ReportPulse } from "@/lib/metrics";
import type {
  AiInsightPreview,
  BottleneckPreview,
  InsightKind,
  Person,
  ReportSummaryPreview,
} from "@/lib/types";
import { cn, formatLongDate, pluralize } from "@/lib/utils";

const KIND_META: Record<InsightKind, { label: string; icon: LucideIcon; className: string }> = {
  risk: { label: "Risk", icon: ShieldAlert, className: "bg-status-rose/10 text-rose-300 ring-status-rose/25" },
  opportunity: {
    label: "Opportunity",
    icon: TrendingUp,
    className: "bg-status-emerald/10 text-emerald-300 ring-status-emerald/25",
  },
  recommendation: {
    label: "Recommendation",
    icon: Lightbulb,
    className: "bg-violet/15 text-violet-200 ring-violet/30",
  },
};

export function InsightCard({ insight }: { insight: AiInsightPreview }) {
  const meta = KIND_META[insight.kind];
  const Icon = meta.icon;
  return (
    <article className="glass flex flex-col p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
            meta.className,
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {meta.label}
        </span>
        <PriorityBadge priority={insight.impact} />
        <span className="ml-auto">
          <DemoBadge />
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-50">{insight.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{insight.body}</p>
      <div className="mt-4 flex-1 rounded-xl border border-hairline bg-base-900/40 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Based on demo data</p>
        <ul className="mt-2 space-y-1">
          {insight.evidence.map((e) => (
            <li key={e} className="flex gap-2 text-xs text-slate-300">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
              {e}
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={insight.href}
        className="focus-ring mt-4 inline-flex w-fit items-center gap-1 rounded text-xs font-medium text-violet-300 hover:text-violet-200"
      >
        Open {insight.module} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </article>
  );
}

export function SummaryCard({ summary, pulse }: { summary: ReportSummaryPreview; pulse: ReportPulse }) {
  return (
    <article className="glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-300">{formatLongDate(summary.date)}</p>
        <DemoBadge label="Sample summary format" />
      </div>
      <h3 className="mt-3 flex items-start gap-2 text-base font-semibold text-slate-50">
        <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
        {summary.headline}
      </h3>
      <p className="mt-2 text-xs text-slate-400">
        Source coverage (counted from demo data): {pulse.submitted.length} of {pulse.expected.length} expected reports ·{" "}
        {pluralize(pulse.blockerCount, "blocker")}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-status-emerald/20 bg-status-emerald/[0.05] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Highlights
          </p>
          <ul className="mt-2 space-y-1.5">
            {summary.highlights.map((h) => (
              <li key={h} className="text-sm leading-relaxed text-slate-300">
                {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-status-amber/20 bg-status-amber/[0.05] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-300">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Watch items
          </p>
          <ul className="mt-2 space-y-1.5">
            {summary.watchItems.map((w) => (
              <li key={w} className="text-sm leading-relaxed text-slate-300">
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function BottleneckRow({ item, people }: { item: BottleneckPreview; people: Person[] }) {
  return (
    <li className="glass p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={item.severity} />
            <Badge tone="slate">{item.area}</Badge>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-slate-50">{item.title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-200">{item.signal}</p>
          <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
        </div>
        <div className="flex flex-col gap-3 lg:w-80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Affected</span>
            <AvatarStack people={people} />
          </div>
          <div className="rounded-xl border border-violet/20 bg-violet/[0.06] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-violet-300">Suggested next step</p>
            <p className="mt-1 text-sm text-slate-200">{item.suggestedAction}</p>
          </div>
        </div>
      </div>
    </li>
  );
}
