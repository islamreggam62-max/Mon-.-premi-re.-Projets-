import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ExecutiveBriefing as Briefing, Tone } from "@/types";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { MODULE_HREFS } from "@/components/shell/nav-items";

const DECISION_RING: Partial<Record<Tone, string>> = {
  bad: "border-bad-base/30",
  warn: "border-warn-base/30",
};

export function ExecutiveBriefing({ briefing }: { readonly briefing: Briefing }) {
  return (
    <Card
      aria-labelledby="briefing-heading"
      className="relative overflow-hidden bg-[linear-gradient(135deg,rgb(124_58_237/0.16),transparent_50%)] p-5 sm:p-6"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-brand-ink">
        <Sparkles aria-hidden="true" className="size-3.5" />
        Executive briefing
      </p>
      <h2 id="briefing-heading" className="mt-2 text-xl font-semibold leading-7 text-ink sm:text-2xl">
        {briefing.headline}
      </h2>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          {briefing.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-6 text-ink-muted">
              {paragraph}
            </p>
          ))}
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Decisions needed</h3>
          {briefing.decisions.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">No decision is pending.</p>
          ) : (
            <ol className="mt-2 space-y-2">
              {briefing.decisions.map((decision, index) => (
                <li key={decision.title}>
                  <Link
                    href={MODULE_HREFS[decision.module]}
                    className={cn(
                      "group flex gap-3 rounded-lg border bg-canvas/50 p-3 transition-colors hover:border-brand-soft/40",
                      DECISION_RING[decision.tone] ?? "border-line",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-soft/15 text-[11px] font-semibold text-brand-ink-strong"
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-5 text-ink">{decision.title}</span>
                      <span className="block text-xs text-ink-subtle">{decision.detail}</span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-ink-subtle group-hover:text-brand-ink"
                    />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Card>
  );
}
