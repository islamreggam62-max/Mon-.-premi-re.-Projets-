import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/types";
import { cn } from "@/lib/cn";
import type { StatusStyle } from "@/lib/presentation";

const TONE_CLASSES: Record<Tone, string> = {
  good: "bg-good-base/10 text-good-ink ring-good-base/25",
  warn: "bg-warn-base/10 text-warn-ink ring-warn-base/25",
  bad: "bg-bad-base/10 text-bad-ink ring-bad-base/25",
  info: "bg-info-base/10 text-info-ink ring-info-base/25",
  brand: "bg-brand-soft/10 text-brand-ink-strong ring-brand-soft/25",
  neutral: "bg-white/[0.04] text-ink-muted ring-white/10",
};

interface BadgeProps {
  readonly tone?: Tone;
  readonly icon?: LucideIcon;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Badge({ tone = "neutral", icon: Icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 ring-1 ring-inset",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3 shrink-0" strokeWidth={2.25} /> : null}
      {children}
    </span>
  );
}

/** Renders a status with its icon, tone and label; optional prefix for context. */
export function StatusBadge({
  style,
  prefix,
  className,
}: {
  readonly style: StatusStyle;
  readonly prefix?: string;
  readonly className?: string;
}) {
  return (
    <Badge tone={style.tone} icon={style.icon} className={className}>
      {prefix ? <span className="sr-only">{prefix}: </span> : null}
      {style.label}
    </Badge>
  );
}

const TEXT_TONE: Record<Tone, string> = {
  good: "text-good-ink",
  warn: "text-warn-ink",
  bad: "text-bad-ink",
  info: "text-info-ink",
  brand: "text-brand-ink",
  neutral: "text-ink-muted",
};

/** Inline icon + label without a pill, for dense rows. */
export function StatusText({
  style,
  className,
}: {
  readonly style: StatusStyle;
  readonly className?: string;
}) {
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", TEXT_TONE[style.tone], className)}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} />
      {style.label}
    </span>
  );
}
