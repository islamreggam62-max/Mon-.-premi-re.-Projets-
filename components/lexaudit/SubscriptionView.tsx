"use client";

import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useLang } from "@/components/lexaudit/LangProvider";
import { PLANS, PLAN_CURRENCY } from "@/lib/lexaudit/data/plans";
import type { Plan } from "@/lib/lexaudit/types";
import { cn } from "@/lib/utils";

export function SubscriptionView() {
  const { t } = useLang();
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PLANS.map((plan) => (
        <PlanCard key={plan.id} plan={plan} t={t} />
      ))}
    </div>
  );
}

function PlanCard({ plan, t }: { plan: Plan; t: (k: string) => string }) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 shadow-glass backdrop-blur-sm",
        plan.featured
          ? "border-violet/50 bg-violet/[0.08] ring-1 ring-inset ring-violet/30"
          : "border-hairline bg-white/[0.03]",
      )}
    >
      {plan.featured && (
        <span className="absolute -top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-700 to-violet-500 px-3 py-0.5 text-[11px] font-semibold text-white shadow-glow" style={{ insetInlineStart: "1.5rem" }}>
          <Sparkles className="h-3 w-3" aria-hidden="true" /> {t("sub.plan.cabinet")}
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-50">{t(plan.nameKey)}</h3>
        {plan.current && <Badge tone="emerald" dot>{t("sub.current")}</Badge>}
      </div>
      <p className="mt-1 text-xs text-slate-400">{t(plan.audienceKey)}</p>

      <div className="mt-4 flex items-end gap-1">
        {plan.priceMonthly === null ? (
          <span className="text-2xl font-semibold text-slate-50">{t("sub.onRequest")}</span>
        ) : (
          <>
            <span className="text-3xl font-semibold tabular-nums text-slate-50">
              {PLAN_CURRENCY}{plan.priceMonthly}
            </span>
            <span className="pb-1 text-sm text-slate-400">{t("sub.perMonth")}</span>
          </>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.featureKeys.map((key) => (
          <li key={key} className="flex items-start gap-2 text-sm text-slate-200">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
            {t(key)}
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={plan.current}
        aria-disabled={plan.current}
        className={cn("btn mt-6 w-full py-2.5 text-sm", plan.featured ? "btn-primary" : "btn-secondary")}
      >
        {plan.current ? t("sub.current") : plan.priceMonthly === null ? t("sub.contact") : t("sub.choose")}
      </button>
    </div>
  );
}
