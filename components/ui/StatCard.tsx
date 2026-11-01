import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/lib/types";

export function StatCard({ kpi }: { kpi: Kpi }) {
  const good =
    kpi.trend === "flat"
      ? null
      : (kpi.trend === "up") === kpi.positiveWhenUp;

  const TrendIcon =
    kpi.trend === "up" ? ArrowUpRight : kpi.trend === "down" ? ArrowDownRight : Minus;

  return (
    <div className="glass p-5 transition-colors hover:border-white/15">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {kpi.label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight text-slate-50">
          {kpi.value}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            good === null && "bg-white/5 text-slate-300 ring-white/10",
            good === true && "bg-status-emerald/12 text-status-emerald ring-status-emerald/25",
            good === false && "bg-status-rose/12 text-status-rose ring-status-rose/25",
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {kpi.delta}
        </span>
      </div>
    </div>
  );
}
