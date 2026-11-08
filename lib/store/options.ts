import { ACCESS_ROLE_LABEL, ACCESS_ROLE_ORDER, DEPARTMENT_ORDER } from "@/lib/labels";

/** Choices shared by the forms. */

export const CURRENCY_OPTIONS = [
  { value: "DZD", label: "DZD — Algerian dinar" },
  { value: "USD", label: "USD — US dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "MAD", label: "MAD — Moroccan dirham" },
  { value: "TND", label: "TND — Tunisian dinar" },
  { value: "SAR", label: "SAR — Saudi riyal" },
  { value: "AED", label: "AED — UAE dirham" },
  { value: "QAR", label: "QAR — Qatari riyal" },
  { value: "KWD", label: "KWD — Kuwaiti dinar" },
  { value: "GBP", label: "GBP — Pound sterling" },
] as const;

export const DEPARTMENT_OPTIONS = DEPARTMENT_ORDER.map((d) => ({ value: d, label: d }));

export const ROLE_OPTIONS = ACCESS_ROLE_ORDER.map((r) => ({ value: r, label: ACCESS_ROLE_LABEL[r] }));

/** The device's time zone, e.g. "Africa/Algiers". */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
