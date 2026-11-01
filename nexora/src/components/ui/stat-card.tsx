import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/lib/demo-data";

export function StatCard({ kpi }: { kpi: Kpi }) {
  const up = kpi.trend === "up";
  const TrendIcon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="nx-card nx-sheen group relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl transition-opacity group-hover:opacity-80"
        aria-hidden
      />
      <p className="text-xs font-medium uppercase tracking-wide text-subtle">
        {kpi.label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {kpi.value}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
            up
              ? "bg-success/15 text-success"
              : "bg-danger/15 text-danger"
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {Math.abs(kpi.deltaPct)}%
        </span>
        <span className="text-subtle">{kpi.hint}</span>
      </div>
    </div>
  );
}
