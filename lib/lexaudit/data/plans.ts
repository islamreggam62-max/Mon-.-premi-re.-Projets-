/** STATIC DEMO — subscription plans. Prices are illustrative (display only). */
import type { Plan } from "@/lib/lexaudit/types";

/** Display currency symbol for the plan prices. */
export const PLAN_CURRENCY = "€";

export const PLANS: Plan[] = [
  {
    id: "plan-essential",
    nameKey: "sub.plan.essential",
    audienceKey: "sub.aud.essential",
    priceMonthly: 49,
    featureKeys: ["sub.feat.audits10", "sub.feat.docTypes", "sub.feat.redraft", "sub.feat.seats3"],
    current: true,
    featured: false,
  },
  {
    id: "plan-cabinet",
    nameKey: "sub.plan.cabinet",
    audienceKey: "sub.aud.cabinet",
    priceMonthly: 149,
    featureKeys: [
      "sub.feat.auditsUnlimited",
      "sub.feat.customRules",
      "sub.feat.redraft",
      "sub.feat.seats3",
      "sub.feat.support",
    ],
    current: false,
    featured: true,
  },
  {
    id: "plan-enterprise",
    nameKey: "sub.plan.enterprise",
    audienceKey: "sub.aud.enterprise",
    priceMonthly: null,
    featureKeys: [
      "sub.feat.auditsUnlimited",
      "sub.feat.seatsUnlimited",
      "sub.feat.sso",
      "sub.feat.api",
      "sub.feat.onprem",
      "sub.feat.support",
    ],
    current: false,
    featured: false,
  },
];
