import type { ExtractedDocument } from "@/lib/documents/extract";
import { EvidenceIndex } from "./evidence";
import type { AnalysisOutput } from "./schema";

/**
 * Turns the model's output into the rows the database stores.
 * Nothing the model says is trusted as-is: quotations are looked up in the
 * document, dates and numbers are validated, and text is cleaned and bounded so
 * a malformed value cannot abort the whole write.
 */

interface EvidenceColumns {
  page_number: number | null;
  clause_ref: string | null;
  quote: string | null;
  evidence_verified: boolean;
}

export interface StoredPayload {
  summary: string;
  document_language: string | null;
  parties: (EvidenceColumns & { name: string; role: string | null })[];
  facts: (EvidenceColumns & {
    field: string;
    label: string;
    value_text: string;
    value_date: string | null;
    value_number: number | null;
    currency: string | null;
  })[];
  obligations: (EvidenceColumns & {
    responsible_party: string | null;
    category: string;
    description: string;
    due_date: string | null;
    recurrence: string | null;
  })[];
  risks: (EvidenceColumns & {
    evidence_kind: "quote" | "absence";
    category: string;
    severity: string;
    title: string;
    explanation: string;
    recommendation: string | null;
  })[];
}

export interface PayloadStats {
  findings: number;
  verified: number;
  unverified: number;
  pageCorrected: number;
}

export function buildPayload(
  output: AnalysisOutput,
  document: ExtractedDocument,
): { payload: StoredPayload; stats: PayloadStats } {
  const index = new EvidenceIndex(document.pages);
  const stats: PayloadStats = { findings: 0, verified: 0, unverified: 0, pageCorrected: 0 };

  const check = (evidence: { page: number; clause: string | null; quote: string }): EvidenceColumns => {
    const result = index.locate(evidence.quote, evidence.page);
    stats.findings += 1;
    if (result.verified) {
      stats.verified += 1;
      if (result.pageNumber !== evidence.page) stats.pageCorrected += 1;
    } else {
      stats.unverified += 1;
    }
    return {
      page_number: result.pageNumber !== null && result.pageNumber >= 1 ? result.pageNumber : null,
      clause_ref: optionalText(evidence.clause, 200),
      quote: optionalText(evidence.quote, 2000),
      evidence_verified: result.verified,
    };
  };

  const payload: StoredPayload = {
    summary: text(output.summary, 4000),
    document_language: optionalText(output.document_language, 12),
    parties: output.parties
      .filter((party) => text(party.name, 300))
      .map((party) => ({ name: text(party.name, 300), role: optionalText(party.role, 200), ...check(party.evidence) })),
    facts: output.key_terms
      .filter((term) => text(term.value_text, 2000))
      .map((term) => ({
        field: term.field,
        label: text(term.label, 200) || term.field,
        value_text: text(term.value_text, 2000),
        value_date: isoDate(term.value_date),
        value_number: boundedNumber(term.value_number),
        currency: currencyCode(term.currency),
        ...check(term.evidence),
      })),
    obligations: output.obligations
      .filter((obligation) => text(obligation.description, 2000))
      .map((obligation) => ({
        responsible_party: optionalText(obligation.responsible_party, 300),
        category: obligation.category,
        description: text(obligation.description, 2000),
        due_date: isoDate(obligation.due_date),
        recurrence: optionalText(obligation.recurrence, 300),
        ...check(obligation.evidence),
      })),
    risks: [
      ...output.risks
        .filter((risk) => text(risk.title, 300))
        .map((risk) => ({
          evidence_kind: "quote" as const,
          category: risk.category,
          severity: risk.severity,
          title: text(risk.title, 300),
          explanation: text(risk.explanation, 4000),
          recommendation: optionalText(risk.recommendation, 4000),
          ...check(risk.evidence),
        })),
      ...output.missing_protections
        .filter((gap) => text(gap.title, 300))
        .map((gap) => ({
          evidence_kind: "absence" as const,
          category: gap.category,
          severity: gap.severity,
          title: text(gap.title, 300),
          explanation: text(gap.explanation, 4000),
          recommendation: optionalText(gap.recommendation, 4000),
          page_number: null,
          clause_ref: null,
          quote: null,
          evidence_verified: false,
        })),
    ],
  };
  return { payload, stats };
}

/** Postgres rejects NUL in text and jsonb; lengths match the table constraints. */
function text(value: string | null | undefined, max: number): string {
  return (value ?? "").replace(/\u0000/g, "").trim().slice(0, max);
}

function optionalText(value: string | null | undefined, max: number): string | null {
  const cleaned = text(value, max);
  return cleaned.length > 0 ? cleaned : null;
}

/** Accepts only a real calendar date in YYYY-MM-DD form. */
export function isoDate(value: string | null | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return null;
  const year = parsed.getUTCFullYear();
  return year >= 1900 && year <= 2200 ? value : null;
}

function boundedNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) >= 1e15) return null;
  return Math.round(value * 100) / 100;
}

function currencyCode(value: string | null | undefined): string | null {
  const code = (value ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}
