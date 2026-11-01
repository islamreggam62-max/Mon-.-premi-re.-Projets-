import { cn } from "@/lib/cn";
import type { MeterTone } from "@/lib/presentation";

const FILL: Record<MeterTone, string> = {
  brand: "bg-brand-soft",
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
  muted: "bg-mark-muted",
};

/** The unfilled track is a lighter step of the fill's own hue. */
const TRACK: Record<MeterTone, string> = {
  brand: "bg-brand-soft/15",
  good: "bg-good/15",
  warn: "bg-warn/15",
  bad: "bg-bad/15",
  muted: "bg-white/10",
};

interface MeterProps {
  readonly value: number;
  readonly max?: number;
  readonly tone?: MeterTone;
  /** Accessible name, e.g. "Budget used". */
  readonly label: string;
  /** Spoken value, e.g. "84% of budget spent". */
  readonly valueText: string;
  readonly size?: "sm" | "md";
  readonly className?: string;
}

/** A single ratio against a limit. Values above `max` fill the track. */
export function Meter({
  value,
  max = 100,
  tone = "brand",
  label,
  valueText,
  size = "sm",
  className,
}: MeterProps) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.max(0, Math.min(value, max))}
      aria-valuetext={valueText}
      className={cn(
        "relative w-full overflow-hidden rounded-full",
        size === "sm" ? "h-1.5" : "h-2",
        TRACK[tone],
        className,
      )}
    >
      <div className={cn("h-full rounded-full", FILL[tone])} style={{ width: `${percent}%` }} />
    </div>
  );
}
