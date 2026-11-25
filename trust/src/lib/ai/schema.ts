import { z } from "zod";

/** What the model must return. Kept flat and explicit: it is also the JSON schema sent to the API. */

export const RISK_CATEGORIES = [
  "liability", "indemnification", "termination", "renewal", "payment", "penalties",
  "intellectual_property", "confidentiality", "data_protection", "warranties",
  "force_majeure", "dispute_resolution", "governing_law", "assignment", "exclusivity",
  "compliance", "insurance", "ambiguity", "other",
] as const;

export const OBLIGATION_CATEGORIES = [
  "payment", "delivery", "reporting", "notice", "renewal", "compliance",
  "confidentiality", "insurance", "audit", "other",
] as const;

export const FACT_FIELDS = [
  "effective_date", "expiration_date", "auto_renews", "renewal_term_months",
  "notice_period_days", "total_value", "governing_law", "payment_terms",
  "liability_cap", "dispute_resolution", "other",
] as const;

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;

const Evidence = z.object({
  page: z.number().int().describe("Page number exactly as given in the <page number=...> tag that contains the quotation."),
  clause: z.string().nullable().describe("Clause or article reference as written in the document, e.g. 'Article 12.3'. Null if the passage is not numbered."),
  quote: z.string().describe("Word-for-word quotation from that page, in the document's own language. One or two sentences, never paraphrased or translated."),
});

export const AnalysisOutputSchema = z.object({
  is_contract: z.boolean().describe("False if the document is not a contract or contractual instrument."),
  document_language: z.string().describe("ISO 639-1 code of the document's main language, e.g. 'en', 'fr', 'ar'."),
  contract_type: z.string().nullable(),
  summary: z.string().describe("Five sentences at most: what the contract is, who the parties are, term, value, and the main exposure."),
  parties: z.array(z.object({
    name: z.string(),
    role: z.string().nullable().describe("Role as the contract names it, e.g. 'Supplier', 'Client', 'Lessor'."),
    evidence: Evidence,
  })),
  key_terms: z.array(z.object({
    field: z.enum(FACT_FIELDS),
    label: z.string(),
    value_text: z.string().describe("The value as the contract states it."),
    value_date: z.string().nullable().describe("ISO date YYYY-MM-DD, only for date fields and only if the contract states a full date."),
    value_number: z.number().nullable().describe("Numeric value for amounts, months or days. For auto_renews use 1 (yes) or 0 (no)."),
    currency: z.string().nullable().describe("ISO 4217 code for amounts, e.g. 'USD', 'EUR', 'DZD'."),
    evidence: Evidence,
  })),
  obligations: z.array(z.object({
    responsible_party: z.string().describe("Name or role of the party that must perform."),
    category: z.enum(OBLIGATION_CATEGORIES),
    description: z.string(),
    due_date: z.string().nullable().describe("ISO date YYYY-MM-DD if the contract fixes a calendar date; otherwise null."),
    recurrence: z.string().nullable().describe("e.g. 'monthly', 'within 30 days of each invoice'. Null for one-off obligations."),
    evidence: Evidence,
  })),
  risks: z.array(z.object({
    category: z.enum(RISK_CATEGORIES),
    severity: z.enum(SEVERITIES),
    title: z.string(),
    explanation: z.string().describe("What the clause says and why it exposes the assessed party."),
    recommendation: z.string().describe("A concrete step: what to renegotiate, clarify or monitor."),
    evidence: Evidence,
  })),
  missing_protections: z.array(z.object({
    category: z.enum(RISK_CATEGORIES),
    severity: z.enum(SEVERITIES),
    title: z.string(),
    explanation: z.string().describe("Which usual protection is absent and what that exposes the assessed party to."),
    recommendation: z.string(),
  })).describe("Protections one would expect in this type of contract that the document does not contain. No quotation is possible for these."),
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
