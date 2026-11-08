import type { LexNavItem } from "@/lib/lexaudit/types";

/** LexAudit home route. All in-app links are prefixed with this. */
export const LEX_HOME = "/lexaudit";

/** The six product sections, in sidebar order. */
export const LEX_NAV: LexNavItem[] = [
  { href: LEX_HOME, labelKey: "nav.dashboard", icon: "dashboard" },
  { href: `${LEX_HOME}/new-audit`, labelKey: "nav.newAudit", icon: "new-audit" },
  { href: `${LEX_HOME}/tender-review`, labelKey: "nav.tender", icon: "tender" },
  { href: `${LEX_HOME}/audit-log`, labelKey: "nav.log", icon: "log" },
  { href: `${LEX_HOME}/rules`, labelKey: "nav.rules", icon: "rules" },
  { href: `${LEX_HOME}/subscription`, labelKey: "nav.subscription", icon: "subscription" },
];

/** Drops the static export's trailing slash: "/lexaudit/rules/" → "/lexaudit/rules". */
export function normalizeLexPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function isActiveLexPath(pathname: string, href: string): boolean {
  const path = normalizeLexPath(pathname);
  if (href === LEX_HOME) return path === LEX_HOME;
  return path === href || path.startsWith(`${href}/`);
}
