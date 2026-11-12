export type OrgRole = "owner" | "admin" | "manager" | "reviewer" | "viewer";
export type ContractStatus = "draft" | "in_review" | "approved" | "active" | "expired" | "terminated";
export type Severity = "low" | "medium" | "high" | "critical";
export type RiskStatus = "open" | "accepted" | "mitigated" | "dismissed";
export type ObligationStatus = "open" | "in_progress" | "done" | "waived";
export type ReviewStatus = "pending" | "approved" | "rejected" | "changes_requested" | "cancelled";
export type AnalysisStatus = "queued" | "extracting" | "analyzing" | "completed" | "failed";

export interface Contract {
  id: string;
  org_id: string;
  title: string;
  counterparty: string | null;
  our_party: string | null;
  contract_type: string | null;
  description: string | null;
  status: ContractStatus;
  effective_date: string | null;
  expiration_date: string | null;
  auto_renews: boolean | null;
  renewal_term_months: number | null;
  notice_period_days: number | null;
  notice_deadline: string | null;
  total_value: number | null;
  currency: string | null;
  governing_law: string | null;
  owner_id: string | null;
  risk_score: number | null;
  risk_level: Severity | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  contract_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  page_count: number | null;
  uploaded_by: string;
  created_at: string;
}

export interface Analysis {
  id: string;
  contract_id: string;
  document_id: string;
  status: AnalysisStatus;
  model: string | null;
  prompt_version: string | null;
  summary: string | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface Evidence {
  page_number: number | null;
  clause_ref: string | null;
  quote: string | null;
  evidence_verified: boolean;
}

export interface Party extends Evidence {
  id: string;
  name: string;
  role: string | null;
}

export interface Fact extends Evidence {
  id: string;
  field: string;
  label: string;
  value_text: string;
  value_date: string | null;
  value_number: number | null;
  currency: string | null;
}

export interface Risk extends Evidence {
  id: string;
  contract_id: string;
  source: "ai" | "manual";
  evidence_kind: "quote" | "absence";
  category: string;
  severity: Severity;
  title: string;
  explanation: string;
  recommendation: string | null;
  status: RiskStatus;
  resolution_note: string | null;
  created_at: string;
}

export interface Obligation extends Evidence {
  id: string;
  contract_id: string;
  source: "ai" | "manual";
  responsible_party: string | null;
  category: string;
  description: string;
  due_date: string | null;
  recurrence: string | null;
  status: ObligationStatus;
  assignee_id: string | null;
}

export interface Review {
  id: string;
  contract_id: string;
  requested_by: string;
  reviewer_id: string;
  status: ReviewStatus;
  comment: string | null;
  created_at: string;
  decided_at: string | null;
}

export interface Deadline {
  contract_id: string;
  contract_title: string;
  kind: "expiration" | "notice" | "obligation";
  label: string;
  due_date: string;
  obligation_id: string | null;
}

export interface Member {
  user_id: string;
  role: OrgRole;
  email: string;
  full_name: string | null;
}

export const MANAGE_ROLES: OrgRole[] = ["owner", "admin", "manager"];
export const ADMIN_ROLES: OrgRole[] = ["owner", "admin"];
export const REVIEWER_ROLES: OrgRole[] = ["owner", "admin", "reviewer"];
