import type { ComplianceDay } from "@/lib/metrics";
import { cn, formatShortDate, formatWeekdayShort } from "@/lib/utils";

/**
 * One cell per business day, oldest → newest. Filled = submitted, hollow = missing,
 * dashed = today still open. The container's accessible name carries the summary,
 * so the cells are never the only signal.
 */
export function ComplianceStrip({
  days,
  asOf,
  label,
}: {
  days: ComplianceDay[];
  asOf: string;
  label: string;
}) {
  return (
    <div role="img" aria-label={label} className="flex items-center gap-1">
      {days.map((d) => {
        const today = d.date === asOf;
        const title = `${formatWeekdayShort(d.date)} ${formatShortDate(d.date)}: ${
          d.status === "submitted" ? "submitted" : d.status === "excused" ? "excused" : today ? "not yet submitted" : "missing"
        }`;
        return (
          <span
            key={d.date}
            title={title}
            className={cn(
              "h-3 w-3 rounded-[3px]",
              d.status === "submitted" && "bg-status-emerald",
              d.status === "excused" && "bg-white/10",
              d.status === "missing" && !today && "border border-status-rose/70",
              d.status === "missing" && today && "border border-dashed border-slate-400",
            )}
          />
        );
      })}
    </div>
  );
}
