"use client";

import { useState } from "react";
import { ChartColumn, Table2 } from "lucide-react";
import type { ThroughputBar } from "@/types";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber, pluralize } from "@/lib/format";
import { Panel } from "@/components/ui/card";
import { ToggleGroup } from "@/components/ui/controls";

/** Clean y-axis: about four intervals on a 1-2-4-5 step ladder. */
function niceScale(max: number, intervals = 4): { readonly max: number; readonly ticks: number[] } {
  if (max <= 0) return { max: 1, ticks: [0, 1] };
  const raw = max / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 4, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? 10 * magnitude;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let tick = 0; tick <= niceMax + step / 1e6; tick += step) ticks.push(Number(tick.toFixed(6)));
  return { max: niceMax, ticks };
}

type View = "chart" | "table";

/**
 * Weekly completions as columns. Emphasis form: the current week in the
 * accent, earlier weeks in the de-emphasis gray. Every bar is a focusable
 * button with its own tooltip (hover, focus or tap), and a table view carries
 * the same values without any pointer.
 */
export function ThroughputChart({
  bars,
  className,
}: {
  readonly bars: readonly ThroughputBar[];
  readonly className?: string;
}) {
  const [view, setView] = useState<View>("chart");
  const [active, setActive] = useState<number | null>(null);
  const scale = niceScale(Math.max(...bars.map((bar) => bar.completed)));
  const current = bars[bars.length - 1];
  const previous = bars[bars.length - 2];
  const activeBar = active === null ? undefined : bars[active];

  const describe = (bar: ThroughputBar): string =>
    `Week of ${formatDate(bar.weekStart, "short")}: ${pluralize(bar.completed, "task")} completed${bar.isCurrent ? " (current week)" : ""}`;

  return (
    <Panel
      id="throughput"
      title="Tasks completed per week"
      description={
        current && previous
          ? `${pluralize(current.completed, "task")} this week vs ${formatNumber(previous.completed)} last week. Current week highlighted.`
          : "Weekly completions."
      }
      className={className}
      action={
        <ToggleGroup<View>
          label="Display"
          value={view}
          onChange={setView}
          options={[
            { value: "chart", label: "Chart", icon: ChartColumn },
            { value: "table", label: "Table", icon: Table2 },
          ]}
        />
      }
    >
      {view === "chart" ? (
        <figure className="m-0" onPointerLeave={() => setActive(null)}>
          <figcaption className="sr-only">
            Column chart of tasks completed per week. {bars.map(describe).join(". ")}.
          </figcaption>
          <div className="flex gap-2">
            {/* Y axis */}
            <div aria-hidden="true" className="relative h-40 w-5 shrink-0 text-right text-[10px] tabular-nums text-ink-subtle">
              {scale.ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-0 translate-y-1/2 leading-none"
                  style={{ bottom: `${(tick / scale.max) * 100}%` }}
                >
                  {formatNumber(tick)}
                </span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              {/* Plot */}
              <div className="relative h-40 border-b border-white/15">
                {scale.ticks
                  .filter((tick) => tick > 0)
                  .map((tick) => (
                    <div
                      key={tick}
                      aria-hidden="true"
                      className="absolute inset-x-0 border-t border-white/[0.06]"
                      style={{ bottom: `${(tick / scale.max) * 100}%` }}
                    />
                  ))}
                <ol className="absolute inset-0 flex items-end">
                  {bars.map((bar, index) => {
                    const height = (bar.completed / scale.max) * 100;
                    return (
                      <li key={bar.weekStart} className="flex h-full min-w-0 flex-1 justify-center">
                        <button
                          type="button"
                          aria-label={describe(bar)}
                          onPointerEnter={() => setActive(index)}
                          onFocus={() => setActive(index)}
                          onBlur={() => setActive(null)}
                          onClick={() => setActive(index)}
                          className="group relative flex h-full w-full max-w-12 items-end justify-center rounded-md focus-visible:outline-offset-0"
                        >
                          {bar.isCurrent ? (
                            <span
                              aria-hidden="true"
                              className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums text-ink"
                              style={{ bottom: `calc(${height}% + 4px)` }}
                            >
                              {formatNumber(bar.completed)}
                            </span>
                          ) : null}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "block w-full max-w-6 rounded-t-[4px] transition-[filter] group-hover:brightness-125 group-focus-visible:brightness-125",
                              bar.isCurrent ? "bg-brand-soft" : "bg-mark-muted",
                              active === index && "brightness-125",
                            )}
                            style={{ height: `${height}%` }}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ol>
                {activeBar && active !== null ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute z-10 w-max rounded-lg border border-line-strong bg-raised/95 px-2.5 py-1.5 shadow-xl backdrop-blur"
                    style={{
                      left: `${((active + 0.5) / bars.length) * 100}%`,
                      bottom: `calc(${(activeBar.completed / scale.max) * 100}% + 22px)`,
                      transform: `translateX(${active === 0 ? "-20%" : active === bars.length - 1 ? "-80%" : "-50%"})`,
                    }}
                  >
                    <p className="text-sm font-semibold tabular-nums text-ink">
                      {pluralize(activeBar.completed, "task")}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Week of {formatDate(activeBar.weekStart, "short")}
                      {activeBar.isCurrent ? " · current" : ""}
                    </p>
                  </div>
                ) : null}
              </div>
              {/* X axis */}
              <ol aria-hidden="true" className="mt-1.5 flex text-[10px] text-ink-subtle">
                {bars.map((bar, index) => (
                  <li
                    key={bar.weekStart}
                    className={cn(
                      "min-w-0 flex-1 truncate text-center",
                      bar.isCurrent && "font-semibold text-ink-muted",
                      index % 2 === 1 && !bar.isCurrent && "max-sm:invisible",
                    )}
                  >
                    {bar.isCurrent ? "This wk" : formatDate(bar.weekStart, "short")}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </figure>
      ) : (
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Tasks completed per week</caption>
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-subtle">
              <th scope="col" className="py-2 font-medium">Week of</th>
              <th scope="col" className="py-2 text-right font-medium">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bars.map((bar) => (
              <tr key={bar.weekStart}>
                <th scope="row" className="py-1.5 font-normal text-ink-muted">
                  {formatDate(bar.weekStart)}
                  {bar.isCurrent ? <span className="ml-1.5 text-xs text-brand-ink">current</span> : null}
                </th>
                <td className="py-1.5 text-right tabular-nums text-ink">{formatNumber(bar.completed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
