import type { DailyReportsView } from "@/lib/queries";
import { formatDate, formatPercent } from "@/lib/format";
import { SUBMISSION_STYLES } from "@/lib/presentation";
import { Avatar } from "@/components/ui/avatar";
import { StatusText } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";

/**
 * Today's submission split as a thin segmented bar (status colors, 2px surface
 * gaps, no text on the bar): the legend beside it carries every figure.
 */
export function CompliancePanel({ view }: { readonly view: DailyReportsView }) {
  const parts = [
    { key: "on-time" as const, count: view.onTime, className: "bg-good" },
    { key: "late" as const, count: view.late, className: "bg-warn" },
    { key: "missing" as const, count: view.missing.length, className: "bg-bad" },
  ];
  const previous = view.trend.slice(0, -1);

  return (
    <Panel
      id="compliance"
      title="Check-in compliance"
      description={`${formatDate(view.today, "weekday")} · deadline ${view.policy.deadline}, ${view.timeZone}`}
    >
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-semibold tracking-tight text-ink">{formatPercent(view.rate)}</p>
        <p className="text-sm text-ink-muted">
          {view.onTime + view.late} of {view.expected} submitted
        </p>
      </div>

      <div
        role="img"
        aria-label={`On time ${view.onTime}, late ${view.late}, missing ${view.missing.length}, of ${view.expected} expected`}
        className="mt-3 flex h-2 w-full gap-0.5"
      >
        {parts
          .filter((part) => part.count > 0)
          .map((part) => (
            <span
              key={part.key}
              className={`h-full rounded-full ${part.className}`}
              style={{ flexGrow: part.count, flexBasis: 0 }}
            />
          ))}
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {parts.map((part) => (
          <li key={part.key} className="min-w-0">
            <StatusText style={SUBMISSION_STYLES[part.key]} className="text-[11px]" />
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{part.count}</p>
          </li>
        ))}
      </ul>

      {view.missing.length > 0 ? (
        <div className="mt-4 border-t border-line pt-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Awaiting check-in</h3>
          <ul className="mt-2 space-y-2">
            {view.missing.map((member) => (
              <li key={member.id} className="flex items-center gap-2">
                <Avatar initials={member.initials} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{member.name}</p>
                  <p className="truncate text-[11px] text-ink-subtle">{member.title}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 border-t border-line pt-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
          Previous working days
        </h3>
        <ol className="mt-2 flex flex-wrap gap-1.5">
          {previous.map((point) => (
            <li
              key={point.date}
              className="rounded-md border border-line px-1.5 py-1 text-center"
              title={`${formatDate(point.date)}: ${formatPercent(point.rate)}`}
            >
              <span className="block text-[10px] text-ink-subtle">{formatDate(point.date, "short")}</span>
              <span className="block text-xs font-medium tabular-nums text-ink">{formatPercent(point.rate)}</span>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}
