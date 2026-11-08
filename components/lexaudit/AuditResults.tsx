"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Copy,
  FileText,
  Gavel,
  Info,
  PlusCircle,
  RotateCcw,
  ScrollText,
  ShieldPlus,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ToggleChip, Select } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { DocTypeBadge, PartyBadge, SeverityBadge, VerdictBadge } from "@/components/lexaudit/LexBadges";
import { RiskGauge } from "@/components/lexaudit/RiskGauge";
import { useLang } from "@/components/lexaudit/LangProvider";
import { LAST_DOC_KEY } from "@/components/lexaudit/UploadDropzone";
import {
  SEVERITY_ORDER,
  checkpointsIn,
  severityCounts,
  sortFindings,
} from "@/lib/lexaudit/metrics";
import type {
  AuditResult,
  Checkpoint,
  DocumentType,
  Finding,
  MissingProtection,
  Severity,
} from "@/lib/lexaudit/types";
import { cn } from "@/lib/utils";

type ResultTab = "synthesis" | "findings" | "missing" | "commercial";
type SevFilter = "all" | Severity;

const DOC_TO_ID: Record<DocumentType, string> = {
  supply: "r-supply",
  services: "r-supply",
  tender: "r-tender",
  nda: "r-nda",
};

export function AuditResults({
  results,
  storageDefault = false,
}: {
  results: AuditResult[];
  storageDefault?: boolean;
}) {
  const { t } = useLang();
  const [selectedId, setSelectedId] = useState(results[0]?.id ?? "");

  // Preselect the sample matching the last upload choice (set in the dropzone).
  useEffect(() => {
    if (!storageDefault) return;
    try {
      const raw = window.localStorage.getItem(LAST_DOC_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { docType?: DocumentType };
      const wantId = parsed.docType ? DOC_TO_ID[parsed.docType] : undefined;
      if (wantId && results.some((r) => r.id === wantId)) setSelectedId(wantId);
    } catch {
      /* ignore */
    }
  }, [storageDefault, results]);

  const result = results.find((r) => r.id === selectedId) ?? results[0];
  if (!result) return null;

  return (
    <div>
      {results.length > 1 && (
        <div className="mb-6 max-w-sm">
          <Select
            label={t("res.selectSample")}
            value={result.id}
            onChange={setSelectedId}
            options={results.map((r) => ({ value: r.id, label: `${t(`doc.${r.documentType}`)} — ${r.fileName}` }))}
          />
        </div>
      )}
      <ResultBody key={result.id} result={result} t={t} />
    </div>
  );
}

function ResultBody({
  result,
  t,
}: {
  result: AuditResult;
  t: (k: string) => string;
}) {
  const [tab, setTab] = useState<ResultTab>("synthesis");
  const counts = useMemo(() => severityCounts(result.findings), [result.findings]);

  const tabs = [
    { id: "synthesis" as ResultTab, label: t("res.tab.synthesis") },
    { id: "findings" as ResultTab, label: t("res.tab.findings"), count: result.findings.length },
    { id: "missing" as ResultTab, label: t("res.tab.missing"), count: result.missing.length },
    ...(result.commercial.length
      ? [{ id: "commercial" as ResultTab, label: t("res.tab.commercial"), count: result.commercial.length }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Document header */}
      <Card strong>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet/15 ring-1 ring-inset ring-violet/30">
              <FileText className="h-5 w-5 text-violet-200" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-50">{result.fileName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DocTypeBadge type={result.documentType} />
                <span className="text-xs text-slate-400">{t("party.weDefend")}:</span>
                <PartyBadge party={result.party} />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {t("res.counterparty")}: {result.counterparty}
                {" · "}
                <Gavel className="inline h-3 w-3 text-slate-400" aria-hidden="true" /> {result.governingLaw}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-4 text-xs text-slate-300 sm:flex-col sm:items-end sm:text-end">
            <span>{result.auditedOn}</span>
            <span className="tabular-nums">
              {result.clausesReviewed} {t("res.clauses")} · {result.pages} {t("res.pages")}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Risk + verdict */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Card>
          <CardHeader title={t("res.riskScore")} />
          <CardBody className="flex flex-col items-center gap-4">
            <RiskGauge score={result.riskScore} />
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">{t("res.verdict")}</span>
              <VerdictBadge verdict={result.verdict} />
            </div>
            <div className="grid w-full grid-cols-3 gap-2 border-t border-hairline pt-4">
              <SevCount label={t("sev.critical")} value={counts.critical} tone="rose" />
              <SevCount label={t("sev.major")} value={counts.major} tone="amber" />
              <SevCount label={t("sev.minor")} value={counts.minor} tone="slate" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("res.synthesisTitle")} />
          <CardBody>
            <ul className="space-y-3">
              {result.synthesis.map((line, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-200">
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      i === 0
                        ? "bg-violet/20 text-violet-200 ring-1 ring-inset ring-violet/30"
                        : "bg-white/5 text-slate-300",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <div>
        <Tabs items={tabs} value={tab} onChange={setTab} ariaLabel={t("res.title")} />
        <div className="pt-6">
          {tab === "synthesis" && <SynthesisPanel result={result} t={t} />}
          {tab === "findings" && <FindingsPanel result={result} t={t} />}
          {tab === "missing" && <MissingPanel items={result.missing} t={t} />}
          {tab === "commercial" && result.commercial.length > 0 && (
            <CommercialPanel result={result} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Synthesis */

function SynthesisPanel({ result, t }: { result: AuditResult; t: (k: string) => string }) {
  const top = sortFindings(result.findings).slice(0, 3);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title={t("res.topRisks")} />
        <CardBody className="space-y-3">
          {top.map((f) => (
            <div key={f.id} className="rounded-xl border border-hairline bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-violet-200">{f.clause}</span>
                <SeverityBadge severity={f.severity} />
              </div>
              <p className="mt-1.5 text-sm font-medium text-slate-100">{f.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.risk}</p>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("dash.byCategory")} />
        <CardBody>
          <CheckpointBars findings={result.findings} t={t} />
        </CardBody>
      </Card>
    </div>
  );
}

function CheckpointBars({ findings, t }: { findings: Finding[]; t: (k: string) => string }) {
  const weight: Record<Severity, number> = { critical: 34, major: 18, minor: 7 };
  const map = new Map<Checkpoint, number>();
  for (const f of findings) map.set(f.checkpoint, (map.get(f.checkpoint) ?? 0) + weight[f.severity]);
  const rows = [...map.entries()]
    .map(([checkpoint, score]) => ({ checkpoint, score: Math.min(100, score) }))
    .sort((a, b) => b.score - a.score);
  const max = Math.max(1, ...rows.map((r) => r.score));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.checkpoint} className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3">
          <span className="truncate text-xs text-slate-300">{t(`cp.${r.checkpoint}`)}</span>
          <span className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-500"
              style={{ width: `${(r.score / max) * 100}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------------- Findings */

function FindingsPanel({ result, t }: { result: AuditResult; t: (k: string) => string }) {
  const [sev, setSev] = useState<SevFilter>("all");
  const [checkpoint, setCheckpoint] = useState<Checkpoint | "all">("all");
  const [handled, setHandled] = useState<Record<string, boolean>>({});

  const checkpoints = useMemo(() => checkpointsIn(result.findings), [result.findings]);
  const counts = useMemo(() => severityCounts(result.findings), [result.findings]);

  const visible = useMemo(() => {
    const list = result.findings.filter(
      (f) => (sev === "all" || f.severity === sev) && (checkpoint === "all" || f.checkpoint === checkpoint),
    );
    return sortFindings(list);
  }, [result.findings, sev, checkpoint]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("res.filterSeverity")}>
          <ToggleChip pressed={sev === "all"} onToggle={() => setSev("all")}>
            {t("common.all")} ({result.findings.length})
          </ToggleChip>
          {SEVERITY_ORDER.map((s) => (
            <ToggleChip key={s} pressed={sev === s} onToggle={() => setSev(s)}>
              {t(`sev.${s}`)} ({counts[s]})
            </ToggleChip>
          ))}
        </div>
        <Select
          label={t("res.filterCheckpoint")}
          hideLabel
          value={checkpoint}
          onChange={(v) => setCheckpoint(v as Checkpoint | "all")}
          className="lg:w-64"
          options={[
            { value: "all", label: t("res.filterCheckpoint") },
            ...checkpoints.map((c) => ({ value: c, label: t(`cp.${c}`) })),
          ]}
        />
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-hairline bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
        {t("res.handledNote")}
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={AlertTriangle} title={t("res.noFindings")} description={t("res.noFindingsHint")} />
      ) : (
        <ul className="space-y-4">
          {visible.map((f) => (
            <FindingCard
              key={f.id}
              finding={f}
              t={t}
              handled={Boolean(handled[f.id])}
              onToggle={() => setHandled((prev) => ({ ...prev, [f.id]: !prev[f.id] }))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FindingCard({
  finding,
  t,
  handled,
  onToggle,
}: {
  finding: Finding;
  t: (k: string) => string;
  handled: boolean;
  onToggle: () => void;
}) {
  return (
    <li className={cn("glass p-5 motion-safe:animate-fade-in", handled && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <Badge tone="slate">{t(`cp.${finding.checkpoint}`)}</Badge>
          {handled && (
            <Badge tone="emerald">
              <Check className="h-3 w-3" aria-hidden="true" /> {t("res.resolved")}
            </Badge>
          )}
        </div>
        <span className="text-xs font-medium text-violet-200">{finding.clause}</span>
      </div>

      <h3 className={cn("mt-3 text-base font-semibold text-slate-50", handled && "line-through decoration-slate-500")}>
        {finding.title}
      </h3>

      <dl className="mt-4 space-y-3 text-sm">
        <Field label={t("res.current")} tone="neutral">
          <span className="italic text-slate-300">{finding.current}</span>
        </Field>
        <Field label={t("res.defect")} tone="rose">
          {finding.defect}
        </Field>
        <Field label={t("res.risk")} tone="amber">
          {finding.risk}
        </Field>
        <ProposedField proposed={finding.proposed} t={t} />
      </dl>

      {finding.basis && finding.basis.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <ScrollText className="h-3.5 w-3.5" aria-hidden="true" /> {t("res.basis")}:
          </span>
          {finding.basis.map((b, i) => (
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

      <div className="mt-4 flex justify-end">
        <button type="button" className="btn btn-secondary" onClick={onToggle}>
          {handled ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> {t("res.undo")}
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> {t("res.resolve")}
            </>
          )}
        </button>
      </div>
    </li>
  );
}

function Field({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "neutral" | "rose" | "amber";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        tone === "neutral" && "border-hairline bg-white/[0.02]",
        tone === "rose" && "border-status-rose/20 bg-status-rose/[0.05]",
        tone === "amber" && "border-status-amber/20 bg-status-amber/[0.05]",
      )}
    >
      <dt
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wide",
          tone === "neutral" && "text-slate-400",
          tone === "rose" && "text-rose-300",
          tone === "amber" && "text-amber-300",
        )}
      >
        {label}
      </dt>
      <dd className="mt-1 leading-relaxed text-slate-200">{children}</dd>
    </div>
  );
}

function ProposedField({ proposed, t }: { proposed: string; t: (k: string) => string }) {
  return (
    <div className="rounded-xl border border-status-emerald/25 bg-status-emerald/[0.06] p-3">
      <div className="flex items-center justify-between gap-2">
        <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
          <ShieldPlus className="h-3.5 w-3.5" aria-hidden="true" /> {t("res.proposed")}
        </dt>
        <CopyButton text={proposed} t={t} />
      </div>
      <dd className="mt-1 leading-relaxed text-emerald-100">{proposed}</dd>
    </div>
  );
}

function CopyButton({ text, t }: { text: string; t: (k: string) => string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-white/20"
    >
      {copied ? (
        <>
          <ClipboardCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" /> {t("common.copied")}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" /> {t("common.copy")}
        </>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ Missing */

function MissingPanel({ items, t }: { items: MissingProtection[]; t: (k: string) => string }) {
  if (items.length === 0) {
    return <EmptyState icon={ShieldPlus} title={t("res.tab.missing")} />;
  }
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map((m) => (
        <li key={m.id} className="glass p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/15 ring-1 ring-inset ring-violet/30">
              <PlusCircle className="h-4 w-4 text-violet-200" aria-hidden="true" />
            </span>
            <Badge tone="slate">{t(`cp.${m.checkpoint}`)}</Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-50">{m.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("res.whyMissing")}: </span>
            {m.why}
          </p>
          <div className="mt-3 rounded-xl border border-status-emerald/25 bg-status-emerald/[0.06] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                <ShieldPlus className="h-3.5 w-3.5" aria-hidden="true" /> {t("res.addClause")}
              </span>
              <CopyButton text={m.clause} t={t} />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-emerald-100">{m.clause}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------- Commercial */

function CommercialPanel({ result, t }: { result: AuditResult; t: (k: string) => string }) {
  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-xl border border-status-sky/25 bg-status-sky/[0.06] px-3 py-2.5 text-xs text-sky-200">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t("res.commercialNote")}
      </p>
      <Card>
        <ul className="divide-y divide-white/5">
          {result.commercial.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100">{c.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{c.note}</p>
              </div>
              <span className="shrink-0 rounded-lg border border-hairline bg-white/[0.03] px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-100">
                {c.value}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------- utils */

function SevCount({ label, value, tone }: { label: string; value: number; tone: "rose" | "amber" | "slate" }) {
  return (
    <div className="text-center">
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "rose" && "text-rose-300",
          tone === "amber" && "text-amber-300",
          tone === "slate" && "text-slate-200",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
