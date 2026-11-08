import { t } from "@/lib/i18n/core";
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
        const state = d.status === "submitted" ? t("submitted") : d.status === "excused" ? t("excused") : today ? t("not yet submitted") : t("missing");
        const title = `${formatWeekdayShort(d.date)} ${formatShortDate(d.date)}: ${state}`;
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
