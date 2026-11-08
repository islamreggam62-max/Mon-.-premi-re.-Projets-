import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/lib/types";

/** KPI tile: label, value, signed delta (colored by whether the move is good; hidden when empty), basis. */
export function StatCard({ kpi, icon: Icon }: { kpi: Kpi; icon?: LucideIcon }) {
  const good = kpi.trend === "flat" ? null : (kpi.trend === "up") === kpi.positiveWhenUp;
  const TrendIcon = kpi.trend === "up" ? ArrowUpRight : kpi.trend === "down" ? ArrowDownRight : Minus;

  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{kpi.label}</p>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/15 ring-1 ring-inset ring-violet/30">
            <Icon className="h-4 w-4 text-violet-200" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold tracking-tight text-slate-50">{kpi.value}</span>
        {kpi.delta && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
            good === null && "bg-white/5 text-slate-200 ring-white/15",
            good === true && "bg-status-emerald/10 text-emerald-300 ring-status-emerald/30",
            good === false && "bg-status-rose/10 text-rose-300 ring-status-rose/30",
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {kpi.delta}
          <span className="sr-only">
            {good === null ? "(unchanged)" : good ? "(favorable)" : "(unfavorable)"}
          </span>
        </span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">{kpi.hint}</p>
    </>
  );

  const className = "glass block p-5 transition-colors hover:border-white/20";
  return kpi.href ? (
    <Link href={kpi.href} className={cn(className, "focus-ring")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
