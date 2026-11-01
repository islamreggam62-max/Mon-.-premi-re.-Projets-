import type { NavItem } from "@/lib/types";

/** The 8 core NEXORA modules, in command-center order. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard", description: "Executive command center" },
  { href: "/team", label: "Team", icon: "team", description: "Directory, roles & workloads" },
  { href: "/projects", label: "Projects", icon: "projects", description: "Strategic portfolio" },
  { href: "/tasks", label: "Tasks", icon: "tasks", description: "Execution view" },
  { href: "/daily-reports", label: "Daily Reports", icon: "reports", description: "Structured check-ins" },
  { href: "/approvals", label: "Approvals", icon: "approvals", description: "Executive decision queue" },
  { href: "/ai-intelligence", label: "AI Intelligence", icon: "ai", description: "Preview UI · static" },
  { href: "/settings", label: "Settings", icon: "settings", description: "Workspace & access" },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function currentNavItem(pathname: string): NavItem {
  return NAV_ITEMS.find((item) => isActivePath(pathname, item.href)) ?? NAV_ITEMS[0];
}
