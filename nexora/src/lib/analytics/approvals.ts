import type { ApprovalRequest, CurrencyCode, ISODate, Money, SlaState } from "@/types";
import { diffInDays } from "@/lib/dates";

/** Window, in days, in which a pending decision counts as "due soon". */
export const SLA_SOON_DAYS = 2;

export function isPending(request: ApprovalRequest): boolean {
  return request.decision.status === "pending";
}

/** Null once a decision is recorded: the SLA no longer applies. */
export function slaState(request: ApprovalRequest, today: ISODate): SlaState | null {
  if (!isPending(request)) return null;
  const days = diffInDays(today, request.decisionDueBy);
  if (days < 0) return "overdue";
  if (days === 0) return "due-today";
  if (days <= SLA_SOON_DAYS) return "due-soon";
  return "on-track";
}

/**
 * Sums amounts in one currency. Amounts in other currencies are counted, not
 * silently converted, so the UI can say what the total leaves out.
 */
export function sumMoney(
  amounts: readonly (Money | null)[],
  currency: CurrencyCode,
): { readonly total: Money; readonly excluded: number } {
  let total = 0;
  let excluded = 0;
  for (const amount of amounts) {
    if (amount === null) continue;
    if (amount.currency === currency) total += amount.amount;
    else excluded += 1;
  }
  return { total: { amount: total, currency }, excluded };
}

/** Pending first, most urgent deadline first, then larger amounts. */
export function compareByUrgency(a: ApprovalRequest, b: ApprovalRequest): number {
  const pendingOrder = Number(isPending(b)) - Number(isPending(a));
  if (pendingOrder !== 0) return pendingOrder;
  const dueOrder = diffInDays(b.decisionDueBy, a.decisionDueBy);
  if (dueOrder !== 0) return dueOrder;
  return (b.amount?.amount ?? 0) - (a.amount?.amount ?? 0);
}
