import { t } from "@/lib/i18n/core";
import { ACCESS_ROLE_LABEL, ACCESS_ROLE_ORDER, DEPARTMENT_ORDER, departmentLabel } from "@/lib/labels";

/** Choices shared by the forms. Functions, so the labels follow the interface language. */

const CURRENCIES = [
  ["DZD", "Algerian dinar"],
  ["USD", "US dollar"],
  ["EUR", "Euro"],
  ["MAD", "Moroccan dirham"],
  ["TND", "Tunisian dinar"],
  ["SAR", "Saudi riyal"],
  ["AED", "UAE dirham"],
  ["QAR", "Qatari riyal"],
  ["KWD", "Kuwaiti dinar"],
  ["GBP", "Pound sterling"],
] as const;

export const CURRENCY_CODES: readonly string[] = CURRENCIES.map(([code]) => code);

export function currencyOptions(): { value: string; label: string }[] {
  return CURRENCIES.map(([code, name]) => ({ value: code, label: `${code} — ${t(name)}` }));
}

export function departmentOptions() {
  return DEPARTMENT_ORDER.map((d) => ({ value: d, label: departmentLabel(d) }));
}

export function roleOptions() {
  return ACCESS_ROLE_ORDER.map((r) => ({ value: r, label: ACCESS_ROLE_LABEL[r] }));
}

/** The device's time zone, e.g. "Africa/Algiers". */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
