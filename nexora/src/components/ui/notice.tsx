import type { ReactNode } from "react";
import { FlaskConical, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Inline statement of a Phase 1 limitation, e.g. that changes are not saved. */
export function DemoNotice({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-brand-soft/20 bg-brand-soft/[0.06] px-3 py-2 text-xs leading-5 text-ink-muted",
        className,
      )}
    >
      <FlaskConical aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-brand-ink" />
      <span>{children}</span>
    </p>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-6 py-10 text-center">
      <Icon aria-hidden="true" className="size-5 text-ink-subtle" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="max-w-sm text-xs text-ink-muted">{description}</p> : null}
    </div>
  );
}
