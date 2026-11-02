/**
 * Organizational risk radar, drawn as ranked horizontal bars (one hue, 0–100 scale)
 * with a tick for last week's score. Bars on a shared baseline compare more
 * precisely than a polar chart. Static preview values — not model output.
 */
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { RISK_LEVEL_LABEL, riskLevel } from "@/lib/metrics";
import type { RiskDimension } from "@/lib/types";
import { cn } from "@/lib/utils";

const TICKS = [0, 25, 50, 75, 100];

export function RiskRadar({ dimensions }: { dimensions: RiskDimension[] }) {
  const ranked = [...dimensions].sort((a, b) => b.score - a.score);

  return (
    <div>
      <div className="hidden grid-cols-[13rem_minmax(0,1fr)_7rem] items-end gap-4 pb-2 sm:grid" aria-hidden="true">
        <span />
        <div className="relative h-4">
          {TICKS.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 text-[10px] tabular-nums text-slate-400"
              style={{ left: `${t}%` }}
            >
              {t}
            </span>
          ))}
        </div>
        <span />
      </div>

      <ul className="space-y-4">
        {ranked.map((d) => {
          const delta = d.score - d.previous;
          const level = riskLevel(d.score);
          const TrendIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
          return (
            <li key={d.id} className="sm:grid sm:grid-cols-[13rem_minmax(0,1fr)_7rem] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-50">{d.label}</p>
                <p className="truncate text-xs text-slate-400">{d.drivers[0]}</p>
              </div>

              <div
                tabIndex={0}
                aria-label={`${d.label}: ${d.score} of 100 (${RISK_LEVEL_LABEL[level]}), last week ${d.previous}. ${d.drivers.join(". ")}.`}
                className="focus-ring group relative mt-2 h-6 cursor-default rounded sm:mt-0"
              >
                {/* gridlines */}
                {TICKS.slice(1, -1).map((t) => (
                  <span key={t} className="absolute inset-y-0 border-l border-white/[0.06]" style={{ left: `${t}%` }} aria-hidden="true" />
                ))}
                {/* track + bar (4px rounded data end, anchored to the 0 baseline) */}
                <span className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-[4px] bg-white/[0.08]" aria-hidden="true" />
                <span
                  className="absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-[4px] bg-violet-soft"
                  style={{ width: `${d.score}%` }}
                  aria-hidden="true"
                />
                {/* last week's score */}
                <span
                  className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-200 ring-2 ring-base-900"
                  style={{ left: `${d.previous}%` }}
                  aria-hidden="true"
                />
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-72 rounded-xl border border-hairline bg-base-800 p-3 text-xs shadow-2xl shadow-black/60 group-hover:block group-focus:block"
                >
                  <p className="font-semibold text-slate-50">
                    {d.label} · {d.score}/100 · {RISK_LEVEL_LABEL[level]}
                  </p>
                  <p className="mt-1 text-slate-300">Last week {d.previous}</p>
                  <ul className="mt-2 space-y-1 text-slate-300">
                    {d.drivers.map((driver) => (
                      <li key={driver}>• {driver}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-1 flex items-baseline justify-between gap-2 sm:mt-0 sm:block sm:text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-50">
                  {d.score} <span className="text-xs font-medium text-slate-300">{RISK_LEVEL_LABEL[level]}</span>
                </p>
                <p
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs tabular-nums",
                    delta > 0 ? "text-rose-300" : delta < 0 ? "text-emerald-300" : "text-slate-400",
                  )}
                >
                  <TrendIcon className="h-3 w-3" aria-hidden="true" />
                  {delta > 0 ? `+${delta}` : delta < 0 ? `−${-delta}` : "0"} vs last week
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-3 text-[11px] text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-[3px] bg-violet-soft" aria-hidden="true" /> This week
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded-full bg-slate-200" aria-hidden="true" /> Last week
        </span>
        <span className="text-slate-400">Scale 0–100 · High ≥ 70 · Elevated 50–69 · Moderate 30–49 · Low &lt; 30</span>
      </div>
    </div>
  );
}
