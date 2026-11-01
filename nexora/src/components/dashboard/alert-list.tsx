import Link from "next/link";
import { ArrowRight, CircleCheck } from "lucide-react";
import type { Insight } from "@/types";
import { cn } from "@/lib/cn";
import { MODULE_LABELS } from "@/lib/labels";
import { INSIGHT_STYLES } from "@/lib/presentation";
import { Panel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/notice";
import { MODULE_HREFS } from "@/components/shell/nav-items";

const ICON_TONE = {
  bad: "bg-bad-base/10 text-bad ring-bad-base/25",
  warn: "bg-warn-base/10 text-warn ring-warn-base/25",
  info: "bg-info-base/10 text-info ring-info-base/25",
  good: "bg-good-base/10 text-good ring-good-base/25",
  brand: "bg-brand-soft/10 text-brand-ink ring-brand-soft/25",
  neutral: "bg-white/5 text-ink-muted ring-white/10",
} as const;

export function AlertList({
  alerts,
  className,
}: {
  readonly alerts: readonly Insight[];
  readonly className?: string;
}) {
  return (
    <Panel
      id="alerts"
      title="Alerts"
      description="Critical and warning signals across the workspace."
      className={className}
      action={
        <Link
          href="/ai-intelligence"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-ink hover:text-brand-ink-strong"
        >
          Analysis <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      }
    >
      {alerts.length === 0 ? (
        <EmptyState icon={CircleCheck} title="No alerts" description="Nothing needs executive attention right now." />
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => {
            const style = INSIGHT_STYLES[alert.severity];
            const Icon = style.icon;
            return (
              <li key={alert.id}>
                <Link
                  href={MODULE_HREFS[alert.module]}
                  className="group flex gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:border-line hover:bg-white/[0.03]"
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                      ICON_TONE[style.tone],
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="sr-only">{style.label}: </span>
                    <span className="block text-sm font-medium leading-5 text-ink">{alert.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-ink-muted">{alert.summary}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-ink group-hover:text-brand-ink-strong">
                      Open {MODULE_LABELS[alert.module]}
                      <ArrowRight aria-hidden="true" className="size-3" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
