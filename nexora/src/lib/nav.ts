import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  ShieldCheck,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Short description used in tooltips / search later. */
  description: string;
  /** Optional badge shown in the sidebar (demo counts). */
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Single source of truth for navigation. The sidebar, the mobile nav and
 * the command surface all read from here so links stay consistent.
 */
export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        description: "Executive overview and key metrics",
      },
      {
        label: "AI Intelligence",
        href: "/ai-intelligence",
        icon: Sparkles,
        description: "Insights, signals and recommendations",
        badge: "Preview",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Team",
        href: "/team",
        icon: Users,
        description: "People, roles and workload",
      },
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        description: "Portfolio of active initiatives",
      },
      {
        label: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
        description: "Work items across the organization",
      },
      {
        label: "Daily Reports",
        href: "/daily-reports",
        icon: FileText,
        description: "End-of-day updates from the team",
      },
      {
        label: "Approvals",
        href: "/approvals",
        icon: ShieldCheck,
        description: "Requests awaiting a decision",
        badge: "4",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Workspace and account configuration",
      },
    ],
  },
];

/** Flat list for lookups (active state, breadcrumbs). */
export const allNavItems: NavItem[] = navSections.flatMap((s) => s.items);
