import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const tones: Record<Tone, string> = {
  neutral: "border-border bg-surface-2/80 text-muted",
  brand: "border-violet-500/30 bg-violet-500/15 text-violet-200",
  success: "border-success/30 bg-success/15 text-success",
  warning: "border-warning/30 bg-warning/15 text-warning",
  danger: "border-danger/30 bg-danger/15 text-danger",
  info: "border-info/30 bg-info/15 text-info",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {dot ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      ) : null}
      {children}
    </span>
  );
}

export type { Tone as BadgeTone };
