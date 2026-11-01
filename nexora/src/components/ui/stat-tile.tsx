import Link from "next/link";
import type { Route } from "next";
import { CircleCheck, Minus, OctagonAlert, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import type { Kpi, KpiFormat, Tone } from "@/types";
import { cn } from "@/lib/cn";
import { formatNumber, formatPercent, formatSigned } from "@/lib/format";
import { Sparkline } from "./sparkline";

function formatValue(value: number, format: KpiFormat): string {
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
}

const CONTEXT_ICON: Partial<Record<Tone, { icon: typeof CircleCheck; className: string; label: string }>> = {
  good: { icon: CircleCheck, className: "text-good", label: "Healthy" },
  warn: { icon: TriangleAlert, className: "text-warn", label: "Needs attention" },
  bad: { icon: OctagonAlert, className: "text-bad", label: "Critical" },
};

/**
 * KPI stat tile: label · value (proportional figures) · signed delta vs a named
 * period · optional sparkline. The whole tile links to its module.
 */
export function StatTile({ kpi, href }: { readonly kpi: Kpi; readonly href: Route }) {
  const status = CONTEXT_ICON[kpi.tone];
  const StatusIcon = status?.icon;
  const delta = kpi.delta;
  const deltaGood = delta ? (delta.value > 0) === delta.higherIsBetter : false;
  const deltaRounded = delta ? Math.round(delta.value) : 0;
  const DeltaIcon = deltaRounded > 0 ? TrendingUp : deltaRounded < 0 ? TrendingDown : Minus;
  const unit = kpi.format === "percent" ? " pts" : "";

  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-line bg-surface/80 p-4 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition-colors hover:border-brand-soft/40 hover:bg-surface"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-ink-muted">{kpi.label}</p>
        {StatusIcon && status ? (
          <StatusIcon aria-label={status.label} role="img" className={cn("size-4 shrink-0", status.className)} />
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-[1.75rem] font-semibold leading-none tracking-tight text-ink">
          {formatValue(kpi.value, kpi.format)}
        </p>
        {kpi.trend ? (
          <>
            <Sparkline values={kpi.trend} domain={kpi.format === "percent" ? [0, 100] : undefined} />
            <span className="sr-only">
              {kpi.trendLabel}: {kpi.trend.map((value) => formatValue(value, kpi.format)).join(", ")}
            </span>
          </>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              deltaRounded === 0 ? "text-ink-muted" : deltaGood ? "text-good-ink" : "text-bad-ink",
            )}
          >
            <DeltaIcon aria-hidden="true" className="size-3.5" />
            {formatSigned(delta.value)}
            {unit} <span className="font-normal text-ink-subtle">{delta.comparison}</span>
          </span>
        ) : null}
        <span className="min-w-0 text-ink-subtle">{kpi.context}</span>
      </div>
    </Link>
  );
}
