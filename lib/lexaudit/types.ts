/**
 * ============================================================================
 *  LexAudit AI — domain model
 * ----------------------------------------------------------------------------
 *  Smart auditor for contracts and tender specifications (cahiers des charges).
 *  Everything the UI renders is typed here. In Phase 1 the demo layer in
 *  lib/lexaudit/data/ satisfies these shapes with hand-written, realistic
 *  sample analyses. No document is ever uploaded, parsed, or sent to a model.
 * ============================================================================
 */

export type ISODate = string; // "YYYY-MM-DD"

/* ----------------------------------------------------------------------------
 * Documents
 * ------------------------------------------------------------------------- */

/** Kind of legal document submitted for audit. */
export type DocumentType = "supply" | "services" | "tender" | "nda";

/** The side whose interests the audit defends. */
export type Party = "buyer" | "supplier" | "contractor";

/** Finding severity, mirroring a classic legal-review scale. */
export type Severity = "critical" | "major" | "minor";

/** Overall go/no-go verdict on the document. */
export type Verdict = "signable" | "conditional" | "not-signable";

/**
 * Review checkpoint a finding belongs to. These are the systematic control
 * points of a contract review, used to group and filter findings.
 */
export type Checkpoint =
  | "parties"
  | "object"
  | "duration"
  | "price"
  | "delivery"
  | "guarantees"
  | "penalties"
  | "liability"
  | "force-majeure"
  | "termination"
  | "confidentiality"
  | "hse"
  | "law"
  | "form";

/* ----------------------------------------------------------------------------
 * Findings
 * ------------------------------------------------------------------------- */

/**
 * One significant point raised by the audit. The shape follows a review row:
 * which clause, how it reads now, what is wrong, the risk it creates for the
 * party we defend, how severe it is, and a ready-to-insert redraft.
 */
export interface Finding {
  id: string;
  /** Clause reference, e.g. "Article 9 — Pénalités de retard". */
  clause: string;
  checkpoint: Checkpoint;
  severity: Severity;
  /** Short title of the issue. */
  title: string;
  /** How the clause currently reads (excerpt). */
  current: string;
  /** The legal or commercial defect. */
  defect: string;
  /** The concrete risk this creates for the party we defend. */
  risk: string;
  /** Precise, ready-to-insert replacement wording. */
  proposed: string;
  /**
   * Legal basis invoked, each carrying an unverified flag so the UI can mark
   * references the user must confirm against a primary source (JORADP).
   */
  basis?: LegalReference[];
}

export interface LegalReference {
  label: string;
  /** True until confirmed against a primary source — rendered as "à vérifier". */
  unverified: boolean;
}

/** A protection the audit expected to find but did not, with a clause to add. */
export interface MissingProtection {
  id: string;
  checkpoint: Checkpoint;
  title: string;
  why: string;
  /** Suggested clause to add. */
  clause: string;
}

/**
 * A commercial condition (price, quantity, discount). Flagged for the business
 * owner, never redrafted by the legal review.
 */
export interface CommercialItem {
  id: string;
  label: string;
  value: string;
  note: string;
}

/* ----------------------------------------------------------------------------
 * Audit result
 * ------------------------------------------------------------------------- */

export interface AuditResult {
  id: string;
  /** File name as submitted. */
  fileName: string;
  documentType: DocumentType;
  party: Party;
  /** Counterparty, fictional in the demo. */
  counterparty: string;
  auditedOn: ISODate;
  /** Governing-law family the analysis assumes. */
  governingLaw: string;
  /** Overall exposure, 0 (none) – 100 (severe). */
  riskScore: number;
  verdict: Verdict;
  /** Five-line executive summary, one bullet per line. */
  synthesis: string[];
  findings: Finding[];
  missing: MissingProtection[];
  commercial: CommercialItem[];
  /** Pages / clauses the audit read. */
  pages: number;
  clausesReviewed: number;
}

/* ----------------------------------------------------------------------------
 * Audit log
 * ------------------------------------------------------------------------- */

export type AuditStatus = "completed" | "in-progress" | "action-required";

export interface AuditRecord {
  id: string;
  fileName: string;
  documentType: DocumentType;
  party: Party;
  counterparty: string;
  date: ISODate;
  riskScore: number;
  verdict: Verdict;
  status: AuditStatus;
  critical: number;
  major: number;
  minor: number;
  /** Links to a full result when one exists in the demo. */
  resultId?: string;
}

/* ----------------------------------------------------------------------------
 * Custom regulatory rules
 * ------------------------------------------------------------------------- */

export interface RegulatoryRule {
  id: string;
  title: string;
  checkpoint: Checkpoint;
  /** What the rule requires the audit to check. */
  requirement: string;
  /** Legal basis (may be unverified). */
  basis: LegalReference[];
  /** Document types the rule applies to. */
  appliesTo: DocumentType[];
  enabled: boolean;
  /** True for built-in starter rules shipped with the demo. */
  builtIn: boolean;
}

/* ----------------------------------------------------------------------------
 * Subscription
 * ------------------------------------------------------------------------- */

export interface Plan {
  id: string;
  /** i18n key for the plan name. */
  nameKey: string;
  /** Monthly price in the display currency, or null for "on request". */
  priceMonthly: number | null;
  /** i18n keys for the feature bullets. */
  featureKeys: string[];
  /** i18n key for the audience line. */
  audienceKey: string;
  current: boolean;
  featured: boolean;
}

/* ----------------------------------------------------------------------------
 * Navigation
 * ------------------------------------------------------------------------- */

export type LexNavIcon =
  | "dashboard"
  | "new-audit"
  | "tender"
  | "log"
  | "rules"
  | "subscription";

export interface LexNavItem {
  href: string;
  /** i18n key for the label. */
  labelKey: string;
  icon: LexNavIcon;
}
