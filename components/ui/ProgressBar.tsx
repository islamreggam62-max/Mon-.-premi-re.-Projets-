import { cn } from "@/lib/utils";

type Tone = "violet" | "emerald" | "amber" | "rose";

const FILL: Record<Tone, string> = {
  violet: "bg-gradient-to-r from-violet to-violet-soft",
  emerald: "bg-status-emerald",
  amber: "bg-status-amber",
  rose: "bg-status-rose",
};

export function ProgressBar({
  value,
  tone = "violet",
  className,
  showLabel = false,
}: {
  value: number;
  tone?: Tone;
  className?: string;
  showLabel?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className={cn("h-full rounded-full transition-all", FILL[tone])}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-slate-400">
          {clamped}%
        </span>
      )}
    </div>
  );
}
