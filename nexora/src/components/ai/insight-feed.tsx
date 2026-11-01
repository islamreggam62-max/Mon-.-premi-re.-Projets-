import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import type { Insight } from "@/types";
import { cn } from "@/lib/cn";
import { INSIGHT_CATEGORY_LABELS, MODULE_LABELS } from "@/lib/labels";
import { INSIGHT_STYLES } from "@/lib/presentation";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MODULE_HREFS } from "@/components/shell/nav-items";

const ACCENT = {
  bad: "before:bg-bad",
  warn: "before:bg-warn",
  info: "before:bg-info",
  good: "before:bg-good",
  brand: "before:bg-brand-soft",
  neutral: "before:bg-mark-muted",
} as const;

export function InsightFeed({ insights }: { readonly insights: readonly Insight[] }) {
  return (
    <section aria-labelledby="insights-heading" className="space-y-3">
      <div>
        <h2 id="insights-heading" className="text-sm font-semibold text-ink">
          Signals and recommendations
        </h2>
        <p className="text-xs text-ink-muted">Most severe first. Each signal lists its evidence and a first move.</p>
      </div>
      <ul className="grid gap-4 2xl:grid-cols-2">
        {insights.map((insight) => {
          const style = INSIGHT_STYLES[insight.severity];
          const headingId = `insight-${insight.id}`;
          return (
            <li key={insight.id} className="min-w-0">
              <Card
                aria-labelledby={headingId}
                className={cn(
                  "relative h-full overflow-hidden p-4 before:absolute before:inset-y-0 before:left-0 before:w-0.5 sm:p-5",
                  ACCENT[style.tone],
                )}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge style={style} prefix="Severity" />
                  <Badge tone="neutral">{INSIGHT_CATEGORY_LABELS[insight.category]}</Badge>
                </div>
                <h3 id={headingId} className="mt-2.5 text-base font-semibold leading-6 text-ink">
                  {insight.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-ink-muted">{insight.summary}</p>
                {insight.evidence.length > 0 ? (
                  <>
                    <h4 className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Evidence</h4>
                    <ul className="mt-1.5 space-y-1">
                      {insight.evidence.map((line) => (
                        <li key={line} className="flex gap-2 text-xs leading-5 text-ink-muted">
                          <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-ink-subtle" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <div className="mt-3 flex gap-2 rounded-lg border border-brand-soft/20 bg-brand-soft/[0.06] p-2.5">
                  <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-ink" />
                  <p className="text-sm leading-5 text-ink">
                    <span className="sr-only">Recommendation: </span>
                    {insight.recommendation}
                  </p>
                </div>
                <Link
                  href={MODULE_HREFS[insight.module]}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-ink hover:text-brand-ink-strong"
                >
                  Open {MODULE_LABELS[insight.module]}
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
