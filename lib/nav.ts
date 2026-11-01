import type { NavItem } from "@/lib/types";

/** The 8 core NEXORA modules, in command-center order. */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: "LayoutDashboard",
    description: "Executive command center",
  },
  {
    href: "/team",
    label: "Team",
    icon: "Users",
    description: "Org directory & workloads",
  },
  {
    href: "/projects",
    label: "Projects",
    icon: "FolderKanban",
    description: "Strategic initiatives",
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: "ListChecks",
    description: "Execution board",
  },
  {
    href: "/daily-reports",
    label: "Daily Reports",
    icon: "ClipboardList",
    description: "Structured check-ins",
  },
  {
    href: "/approvals",
    label: "Approvals",
    icon: "BadgeCheck",
    description: "Executive sign-off queue",
  },
  {
    href: "/ai-intelligence",
    label: "AI Intelligence",
    icon: "Sparkles",
    description: "Synthesis & risk analysis",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: "Settings",
    description: "Workspace & RBAC",
  },
];
