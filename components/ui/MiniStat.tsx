import { t } from "@/lib/i18n/core";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MiniTone = "default" | "rose" | "amber" | "emerald" | "violet";

const VALUE_TONE: Record<MiniTone, string> = {
  default: "text-slate-50",
  rose: "text-rose-300",
  amber: "text-amber-300",
  emerald: "text-emerald-300",
  violet: "text-violet-200",
};

export function MiniStat({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: MiniTone;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass p-4">
      <p className="flex items-center gap-1.5 text-xs text-slate-300">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
        {t(label)}
      </p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", VALUE_TONE[tone])}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{t(hint)}</p>}
      {children}
    </div>
  );
}
