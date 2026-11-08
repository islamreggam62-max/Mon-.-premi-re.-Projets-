import { cn } from "@/lib/utils";

export type ProgressTone = "violet" | "emerald" | "amber" | "rose" | "sky" | "slate";

const FILL: Record<ProgressTone, string> = {
  violet: "bg-gradient-to-r from-violet to-violet-soft",
  emerald: "bg-status-emerald",
  amber: "bg-status-amber",
  rose: "bg-status-rose",
  sky: "bg-status-sky",
  slate: "bg-slate-500",
};

export function ProgressBar({
  value,
  tone = "violet",
  className,
  showLabel = false,
  label,
}: {
  value: number;
  tone?: ProgressTone;
  className?: string;
  showLabel?: boolean;
  /** Accessible name, e.g. "Atlas completion". */
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", FILL[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-end text-xs tabular-nums text-slate-300">
          {clamped}%
        </span>
      )}
    </div>
  );
}
