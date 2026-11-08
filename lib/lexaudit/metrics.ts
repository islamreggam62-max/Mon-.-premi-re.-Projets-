/**
 * Pure derivations over LexAudit data. No data imports: callers pass records
 * in, so the same functions serve the demo today and real results later.
 */
import type {
  AuditRecord,
  AuditResult,
  Checkpoint,
  Finding,
  Severity,
  Verdict,
} from "@/lib/lexaudit/types";

/* ----------------------------------------------------------------------------
 * Risk scoring
 * ------------------------------------------------------------------------- */

export type RiskBand = "severe" | "high" | "moderate" | "low";

/** Map a 0–100 score to a band. */
export function riskBand(score: number): RiskBand {
  if (score >= 75) return "severe";
  if (score >= 55) return "high";
  if (score >= 35) return "moderate";
  return "low";
}

export const RISK_BAND_LABEL: Record<RiskBand, Record<"ar" | "fr" | "en", string>> = {
  severe: { ar: "مرتفع جداً", fr: "Très élevé", en: "Severe" },
  high: { ar: "مرتفع", fr: "Élevé", en: "High" },
  moderate: { ar: "متوسط", fr: "Modéré", en: "Moderate" },
  low: { ar: "منخفض", fr: "Faible", en: "Low" },
};

/* ----------------------------------------------------------------------------
 * Severity
 * ------------------------------------------------------------------------- */

/** Lower = more severe (sorts critical first). */
export const SEVERITY_RANK: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };
export const SEVERITY_ORDER: Severity[] = ["critical", "major", "minor"];

export function sortFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

export function severityCounts(findings: readonly Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, major: 0, minor: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return counts;
}

/** Distinct checkpoints present in a finding set, in review order. */
export const CHECKPOINT_ORDER: Checkpoint[] = [
  "parties",
  "object",
  "duration",
  "price",
  "delivery",
  "guarantees",
  "penalties",
  "liability",
  "force-majeure",
  "termination",
  "confidentiality",
  "hse",
  "law",
  "form",
];

export function checkpointsIn(findings: readonly Finding[]): Checkpoint[] {
  const present = new Set(findings.map((f) => f.checkpoint));
  return CHECKPOINT_ORDER.filter((c) => present.has(c));
}

/* ----------------------------------------------------------------------------
 * Verdict
 * ------------------------------------------------------------------------- */

export type VerdictTone = "emerald" | "amber" | "rose";

export const VERDICT_TONE: Record<Verdict, VerdictTone> = {
  signable: "emerald",
  conditional: "amber",
  "not-signable": "rose",
};

/* ----------------------------------------------------------------------------
 * Portfolio aggregates (dashboard)
 * ------------------------------------------------------------------------- */

export interface PortfolioStats {
  audited: number;
  /** Sum of unresolved critical + major findings across the log. */
  openRisks: number;
  /** Mean risk score across audits, rounded. */
  avgRisk: number;
  criticalFindings: number;
}

export function portfolioStats(records: readonly AuditRecord[]): PortfolioStats {
  const audited = records.length;
  const openRisks = records.reduce((n, r) => n + r.critical + r.major, 0);
  const criticalFindings = records.reduce((n, r) => n + r.critical, 0);
  const avgRisk = audited
    ? Math.round(records.reduce((n, r) => n + r.riskScore, 0) / audited)
    : 0;
  return { audited, openRisks, avgRisk, criticalFindings };
}

/** Mean risk contribution per checkpoint across a set of results, 0–100. */
export function riskByCheckpoint(results: readonly AuditResult[]): { checkpoint: Checkpoint; score: number }[] {
  const weight: Record<Severity, number> = { critical: 34, major: 18, minor: 7 };
  const totals = new Map<Checkpoint, number>();
  for (const result of results) {
    for (const f of result.findings) {
      totals.set(f.checkpoint, (totals.get(f.checkpoint) ?? 0) + weight[f.severity]);
    }
  }
  return CHECKPOINT_ORDER.filter((c) => totals.has(c))
    .map((checkpoint) => ({ checkpoint, score: Math.min(100, totals.get(checkpoint) ?? 0) }))
    .sort((a, b) => b.score - a.score);
}
