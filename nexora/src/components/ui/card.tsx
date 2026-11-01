import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-line bg-surface/80 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
        className,
      )}
      {...props}
    />
  );
}

interface PanelProps {
  /** Unique on the page; also usable as an in-page anchor. */
  readonly id: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly bodyClassName?: string;
}

/** A titled card section, labelled for assistive technology by its heading. */
export function Panel({
  id,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  const titleId = `${id}-title`;
  return (
    <Card id={id} aria-labelledby={titleId} className={cn("scroll-mt-24", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-semibold text-ink">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("px-4 pb-4 pt-3 sm:px-5", bodyClassName)}>{children}</div>
    </Card>
  );
}
