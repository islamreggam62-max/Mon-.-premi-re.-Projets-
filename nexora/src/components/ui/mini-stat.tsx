import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface MiniStatProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly context?: ReactNode;
  readonly icon?: LucideIcon;
  readonly className?: string;
}

/** Compact headline figure for module pages (not a link, no trend). */
export function MiniStat({ label, value, context, icon: Icon, className }: MiniStatProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-line bg-surface/80 px-4 py-3 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        {Icon ? <Icon aria-hidden="true" className="size-3.5 text-ink-subtle" /> : null}
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink">{value}</p>
      {context ? <p className="mt-0.5 truncate text-xs text-ink-subtle">{context}</p> : null}
    </div>
  );
}

export function MiniStatGrid({ children }: { readonly children: ReactNode }) {
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {children}
    </section>
  );
}
