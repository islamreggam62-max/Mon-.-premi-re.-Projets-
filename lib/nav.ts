import { APP_HOME } from "@/lib/basePath";
import type { NavItem } from "@/lib/types";

/** The 8 core NEXORA modules, in command-center order. */
export const NAV_ITEMS: NavItem[] = [
  { href: APP_HOME, label: "Dashboard", icon: "dashboard", description: "Executive command center" },
  { href: "/team", label: "Team", icon: "team", description: "Directory, roles & workloads" },
  { href: "/projects", label: "Projects", icon: "projects", description: "Strategic portfolio" },
  { href: "/tasks", label: "Tasks", icon: "tasks", description: "Execution view" },
  { href: "/daily-reports", label: "Daily Reports", icon: "reports", description: "Structured check-ins" },
  { href: "/approvals", label: "Approvals", icon: "approvals", description: "Executive decision queue" },
  { href: "/ai-intelligence", label: "AI Intelligence", icon: "ai", description: "Preview UI · static" },
  { href: "/settings", label: "Settings", icon: "settings", description: "Workspace & access" },
];

/** Drops the static export's trailing slash: "/team/" → "/team" (root stays "/"). */
export function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function isActivePath(pathname: string, href: string): boolean {
  const path = normalizePath(pathname);
  return path === href || path.startsWith(`${href}/`);
}

/** The module a path belongs to, or undefined for routes outside the 8 modules (404, /offline). */
export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
}
