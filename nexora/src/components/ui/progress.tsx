import { cn } from "@/lib/utils";

type Tone = "brand" | "success" | "warning" | "danger";

const fills: Record<Tone, string> = {
  brand: "bg-brand-gradient",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function Progress({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-surface-2",
        className
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", fills[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
