/**
 * Subscription plans shown on the landing page.
 *
 * Prices are the owner's commercial decision — change them here only; the
 * landing page derives every other figure (monthly equivalent, savings).
 * Online payment is NOT connected yet: no checkout, no payment provider.
 */
export type PlanId = "monthly" | "annual";

export interface Plan {
  id: PlanId;
  name: string;
  /** Price per billing interval, in CURRENCY. */
  price: number;
  interval: "month" | "year";
  tagline: string;
}

export const CURRENCY = "USD";

export const PLANS: Plan[] = [
  { id: "monthly", name: "Monthly", price: 50, interval: "month", tagline: "Flexible — billed every month" },
  { id: "annual", name: "Annual", price: 100, interval: "year", tagline: "One payment for the full year" },
];

/** What every plan includes (describes the product as it exists today). */
export const PLAN_FEATURES: string[] = [
  "All 8 modules: Dashboard, Team, Projects, Tasks, Daily Reports, Approvals, AI Intelligence, Settings",
  "Executive KPIs, department health, and critical blockers at a glance",
  "Daily report submission tracking and compliance streaks",
  "Approval queue for budgets, contracts, hiring, and exceptions",
  "Installable app on desktop, Android, and iPhone — works offline",
];
