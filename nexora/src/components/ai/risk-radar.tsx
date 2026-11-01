import { TriangleAlert } from "lucide-react";
import type { RiskLevel } from "@/types";
import type { RiskRow } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { HEALTH_STYLES, RISK_STYLES } from "@/lib/presentation";
import type { MeterTone } from "@/lib/presentation";
import { StatusBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";

const LEVEL_TONE: Record<RiskLevel, MeterTone> = { low: "brand", elevated: "warn", high: "bad" };

export function RiskRadar({ risks }: { readonly risks: readonly RiskRow[] }) {
  return (
    <Panel
      id="risk-radar"
      title="Risk radar"
      description="Signal-based delivery risk per initiative in flight. Expand a row for the factor breakdown."
      bodyClassName="px-0 sm:px-0 pb-1"
    >
      <ul className="divide-y divide-line border-t border-line">
        {risks.map((risk) => (
          <li key={risk.projectId} className="px-4 py-3.5 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate text-sm font-medium text-ink">{risk.project.name}</p>
                <p className="truncate text-xs text-ink-subtle">
                  {risk.project.code} · {risk.project.owner.name} · target {formatDate(risk.project.targetDate, "short")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge style={HEALTH_STYLES[risk.reportedHealth]} prefix="Reported" />
                <StatusBadge style={RISK_STYLES[risk.level]} prefix="Signals" />
              </div>
              <div className="w-full sm:w-40">
                <div className="mb-1 flex justify-between text-[11px] tabular-nums text-ink-subtle">
                  <span>Score</span>
                  <span className="font-semibold text-ink">{risk.score}/100</span>
                </div>
                <Meter
                  value={risk.score}
                  tone={LEVEL_TONE[risk.level]}
                  label={`${risk.project.name} risk score`}
                  valueText={`${risk.score} out of 100`}
                />
              </div>
            </div>
            {risk.optimismGap ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-warn-ink">
                <TriangleAlert aria-hidden="true" className="size-3.5" />
                The reported status is more optimistic than the signals.
              </p>
            ) : null}
            <details className="group mt-2">
              <summary className="cursor-pointer text-xs font-medium text-brand-ink hover:text-brand-ink-strong">
                Factor breakdown
              </summary>
              <table className="mt-2 w-full text-left text-xs">
                <caption className="sr-only">Risk factors for {risk.project.name}</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Factor</th>
                    <th scope="col">Evidence</th>
                    <th scope="col">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {risk.factors.map((factor) => (
                    <tr key={factor.key}>
                      <th scope="row" className="w-36 py-1.5 pr-3 font-medium text-ink-muted">
                        {factor.label}
                      </th>
                      <td className="py-1.5 pr-3 text-ink-subtle">{factor.detail}</td>
                      <td className="w-28 py-1.5">
                        <div className="flex items-center gap-2">
                          <div aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-soft/15">
                            <div
                              className="h-full rounded-full bg-brand-soft"
                              style={{ width: `${(factor.points / factor.maxPoints) * 100}%` }}
                            />
                          </div>
                          <span className="w-10 text-right tabular-nums text-ink">
                            {factor.points}/{factor.maxPoints}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
