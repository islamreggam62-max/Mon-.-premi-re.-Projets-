import type {
  ApprovalId,
  DepartmentId,
  ISODate,
  ISODateTime,
  MemberId,
  Money,
  Priority,
  ProjectId,
} from "./common";

export const APPROVAL_CATEGORIES = ["budget", "hiring", "exception"] as const;
export type ApprovalCategory = (typeof APPROVAL_CATEGORIES)[number];

export interface BudgetRequestDetails {
  readonly category: "budget";
  readonly costCenter: string;
  /** Budget approved before this request. */
  readonly currentBudget: Money;
}

export interface HiringRequestDetails {
  readonly category: "hiring";
  readonly roleTitle: string;
  readonly headcount: number;
  readonly level: string;
  readonly location: string;
  readonly inHeadcountPlan: boolean;
}

export interface ExceptionRequestDetails {
  readonly category: "exception";
  /** The policy the request departs from. */
  readonly policy: string;
  readonly duration: string | null;
  readonly riskLevel: "low" | "medium" | "high";
}

/** Category-specific facts. `details.category` is the request's category. */
export type ApprovalDetails = BudgetRequestDetails | HiringRequestDetails | ExceptionRequestDetails;

export const DECISION_OUTCOMES = ["approved", "rejected", "changes-requested"] as const;
export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];

export interface PendingDecision {
  readonly status: "pending";
}

export interface RecordedDecision {
  readonly status: DecisionOutcome;
  readonly decidedById: MemberId;
  readonly decidedAt: ISODateTime;
  readonly comment: string;
}

export type ApprovalDecision = PendingDecision | RecordedDecision;

export interface ApprovalRequest {
  readonly id: ApprovalId;
  /** Audit reference, e.g. `APR-2026-0412`. */
  readonly reference: string;
  readonly title: string;
  readonly summary: string;
  readonly details: ApprovalDetails;
  readonly requesterId: MemberId;
  readonly approverId: MemberId;
  readonly departmentId: DepartmentId;
  readonly projectId: ProjectId | null;
  /** Financial commitment requested; null for non-monetary exceptions. */
  readonly amount: Money | null;
  readonly priority: Priority;
  readonly submittedAt: ISODateTime;
  /** Service-level deadline for the decision. */
  readonly decisionDueBy: ISODate;
  /** Policy checks the request triggered, shown to the approver. */
  readonly policyFlags: readonly string[];
  readonly decision: ApprovalDecision;
}
