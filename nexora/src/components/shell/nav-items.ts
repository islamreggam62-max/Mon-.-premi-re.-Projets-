import type { Route } from "next";
import {
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Stamp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ModuleKey } from "@/types";
import { MODULE_LABELS } from "@/lib/labels";

export interface NavItem {
  readonly key: ModuleKey;
  readonly label: string;
  readonly href: Route;
  readonly icon: LucideIcon;
}

/** The eight NEXORA modules, in navigation order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: "dashboard", label: MODULE_LABELS.dashboard, href: "/", icon: LayoutDashboard },
  { key: "team", label: MODULE_LABELS.team, href: "/team", icon: Users },
  { key: "projects", label: MODULE_LABELS.projects, href: "/projects", icon: FolderKanban },
  { key: "tasks", label: MODULE_LABELS.tasks, href: "/tasks", icon: ListChecks },
  { key: "daily-reports", label: MODULE_LABELS["daily-reports"], href: "/daily-reports", icon: ClipboardList },
  { key: "approvals", label: MODULE_LABELS.approvals, href: "/approvals", icon: Stamp },
  { key: "ai-intelligence", label: MODULE_LABELS["ai-intelligence"], href: "/ai-intelligence", icon: Sparkles },
  { key: "settings", label: MODULE_LABELS.settings, href: "/settings", icon: Settings },
];

export const MODULE_HREFS: Readonly<Record<ModuleKey, Route>> = {
  dashboard: "/",
  team: "/team",
  projects: "/projects",
  tasks: "/tasks",
  "daily-reports": "/daily-reports",
  approvals: "/approvals",
  "ai-intelligence": "/ai-intelligence",
  settings: "/settings",
};
