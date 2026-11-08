"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { SearchInput, ToggleChip } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocTypeBadge, PartyBadge, VerdictBadge } from "@/components/lexaudit/LexBadges";
import { RiskChip } from "@/components/lexaudit/RiskGauge";
import { useLang } from "@/components/lexaudit/LangProvider";
import { LEX_HOME } from "@/lib/lexaudit/nav";
import { AUDIT_LOG } from "@/lib/lexaudit/data/log";
import type { AuditStatus, DocumentType } from "@/lib/lexaudit/types";

const DOC_TYPES: DocumentType[] = ["supply", "services", "tender", "nda"];

const STATUS_TONE: Record<AuditStatus, Tone> = {
  completed: "emerald",
  "in-progress": "sky",
  "action-required": "amber",
};

export function AuditLogView() {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<DocumentType | "all">("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AUDIT_LOG.filter((r) => {
      if (type !== "all" && r.documentType !== type) return false;
      if (!q) return true;
      return r.fileName.toLowerCase().includes(q) || r.counterparty.toLowerCase().includes(q);
    });
  }, [query, type]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          label={t("log.searchPlaceholder")}
          placeholder={t("log.searchPlaceholder")}
          className="lg:w-80"
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("log.col.type")}>
          <ToggleChip pressed={type === "all"} onToggle={() => setType("all")}>
            {t("common.all")}
          </ToggleChip>
          {DOC_TYPES.map((d) => (
            <ToggleChip key={d} pressed={type === d} onToggle={() => setType(d)}>
              {t(`doc.${d}`)}
            </ToggleChip>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ScrollText} title={t("res.noFindings")} description={t("res.noFindingsHint")} />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden lg:block">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-hairline text-start text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 text-start font-medium">{t("log.col.document")}</th>
                  <th className="px-5 py-3 text-start font-medium">{t("log.col.type")}</th>
                  <th className="px-5 py-3 text-start font-medium">{t("log.col.party")}</th>
                  <th className="px-5 py-3 text-start font-medium">{t("log.col.date")}</th>
                  <th className="px-5 py-3 text-start font-medium">{t("log.col.findings")}</th>
                  <th className="px-5 py-3 text-start font-medium">{t("log.col.risk")}</th>
                  <th className="px-5 py-3 text-start font-medium">{t("log.col.status")}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="max-w-xs px-5 py-3.5">
                      <p className="truncate font-medium text-slate-100">{r.fileName}</p>
                      <p className="truncate text-xs text-slate-400">{r.counterparty}</p>
                    </td>
                    <td className="px-5 py-3.5"><DocTypeBadge type={r.documentType} /></td>
                    <td className="px-5 py-3.5"><PartyBadge party={r.party} /></td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-300">{r.date}</td>
                    <td className="px-5 py-3.5">
                      <FindingCounts c={r.critical} m={r.major} n={r.minor} t={t} />
                    </td>
                    <td className="px-5 py-3.5"><RiskChip score={r.riskScore} /></td>
                    <td className="px-5 py-3.5">
                      <Badge tone={STATUS_TONE[r.status]} dot>
                        {t(`log.status.${r.status}`)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-end">
                      {r.resultId && (
                        <Link
                          href={`${LEX_HOME}/results`}
                          className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-violet-300 hover:text-violet-200"
                          aria-label={`${t("common.viewResult")} — ${r.fileName}`}
                        >
                          {t("common.viewResult")} <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {rows.map((r) => {
              const body = (
                <div className="glass p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">{r.fileName}</p>
                      <p className="truncate text-xs text-slate-400">{r.counterparty}</p>
                    </div>
                    <RiskChip score={r.riskScore} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <DocTypeBadge type={r.documentType} />
                    <PartyBadge party={r.party} />
                    <Badge tone={STATUS_TONE[r.status]} dot>{t(`log.status.${r.status}`)}</Badge>
                    <span className="text-xs text-slate-400">{r.date}</span>
                  </div>
                  <div className="mt-2">
                    <FindingCounts c={r.critical} m={r.major} n={r.minor} t={t} />
                  </div>
                </div>
              );
              return (
                <li key={r.id}>
                  {r.resultId ? (
                    <Link href={`${LEX_HOME}/results`} className="focus-ring block">{body}</Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function FindingCounts({ c, m, n, t }: { c: number; m: number; n: number; t: (k: string) => string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="inline-flex items-center gap-1 rounded-md bg-status-rose/10 px-1.5 py-0.5 font-semibold text-rose-300" title={t("sev.critical")}>
        {c}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-status-amber/10 px-1.5 py-0.5 font-semibold text-amber-300" title={t("sev.major")}>
        {m}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 font-semibold text-slate-300" title={t("sev.minor")}>
        {n}
      </span>
    </span>
  );
}
