"use client";

import { useState } from "react";
import { Gavel, Info, Lock, Plus, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Controls";
import { useLang } from "@/components/lexaudit/LangProvider";
import { REGULATORY_RULES } from "@/lib/lexaudit/data/rules";
import type { RegulatoryRule } from "@/lib/lexaudit/types";
import { cn } from "@/lib/utils";

export function RulesView() {
  const { t } = useLang();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () => Object.fromEntries(REGULATORY_RULES.map((r) => [r.id, r.enabled])),
  );

  const activeCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-slate-100 tabular-nums">{activeCount}</span> / {REGULATORY_RULES.length}{" "}
          {t("rules.enabled").toLowerCase()}
        </p>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <button type="button" disabled aria-disabled="true" className="btn btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" /> {t("rules.add")}
          </button>
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="h-3 w-3" aria-hidden="true" /> {t("rules.addDisabled")}
          </span>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {REGULATORY_RULES.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            enabled={Boolean(enabled[rule.id])}
            onToggle={() => setEnabled((prev) => ({ ...prev, [rule.id]: !prev[rule.id] }))}
            t={t}
          />
        ))}
      </ul>
    </div>
  );
}

function RuleCard({
  rule,
  enabled,
  onToggle,
  t,
}: {
  rule: RegulatoryRule;
  enabled: boolean;
  onToggle: () => void;
  t: (k: string) => string;
}) {
  return (
    <li className={cn("glass p-5", !enabled && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet/15 ring-1 ring-inset ring-violet/30">
            <Gavel className="h-4 w-4 text-violet-200" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-50">{rule.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="slate">{t(`cp.${rule.checkpoint}`)}</Badge>
              {rule.builtIn && <Badge tone="violet">{t("rules.builtIn")}</Badge>}
            </div>
          </div>
        </div>
        <Switch checked={enabled} onChange={onToggle} label={enabled ? t("rules.enabled") : t("rules.disabled")} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t("rules.requirement")}</p>
          <p className="mt-1 leading-relaxed text-slate-200">{rule.requirement}</p>
        </div>

        {rule.basis.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {rule.basis.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/[0.03] px-2.5 py-0.5 text-xs text-slate-300"
              >
                {b.label}
                {b.unverified && <span className="text-[10px] font-semibold text-amber-300">· {t("common.toVerify")}</span>}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="h-3.5 w-3.5" aria-hidden="true" /> {t("rules.appliesTo")}:
          </span>
          {rule.appliesTo.map((d) => (
            <Badge key={d} tone="sky">{t(`doc.${d}`)}</Badge>
          ))}
        </div>
      </div>
    </li>
  );
}
