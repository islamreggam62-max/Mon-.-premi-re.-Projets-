"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  ClipboardList,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { NAV_ITEMS, isActivePath } from "@/lib/nav";
import type { NavIcon, Workspace } from "@/lib/types";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { cn, formatDate } from "@/lib/utils";

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  team: Users,
  projects: FolderKanban,
  tasks: ListChecks,
  reports: ClipboardList,
  approvals: BadgeCheck,
  ai: Sparkles,
  settings: Settings,
};

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-violet-soft text-sm font-bold text-white shadow-glow",
        className,
      )}
      aria-hidden="true"
    >
      N
    </span>
  );
}

export function Sidebar({
  variant,
  collapsed = false,
  onToggleCollapse,
  onClose,
  badges = {},
  workspaces,
}: {
  variant: "desktop" | "mobile";
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  /** Count pills keyed by nav href, e.g. { "/approvals": 6 }. */
  badges?: Record<string, number>;
  workspaces: Workspace[];
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-hairline",
          collapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        <Link
          href="/"
          onClick={onClose}
          className="focus-ring flex items-center gap-2.5 rounded-xl"
          aria-label="NEXORA — go to Dashboard"
        >
          <LogoMark />
          {!collapsed && (
            <span className="text-[15px] font-semibold tracking-[0.2em] text-slate-50">NEXORA</span>
          )}
        </Link>
        {variant === "mobile" && (
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            className="focus-ring rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-slate-200"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className={cn("shrink-0 border-b border-hairline", collapsed ? "flex justify-center px-2 py-3" : "p-3")}>
        <WorkspaceSwitcher workspaces={workspaces} collapsed={collapsed} />
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Modules
          </p>
        )}
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActivePath(pathname, item.href);
            const badge = badges[item.href];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "focus-ring group relative flex items-center gap-3 rounded-xl py-2.5 text-sm transition-colors",
                    collapsed ? "justify-center px-0" : "px-3",
                    active
                      ? "bg-violet/15 text-slate-50 ring-1 ring-inset ring-violet/30"
                      : "text-slate-300 hover:bg-white/5 hover:text-slate-100",
                  )}
                >
                  {active && !collapsed && (
                    <span
                      className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-violet-soft"
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active ? "text-violet-300" : "text-slate-400 group-hover:text-slate-300",
                    )}
                    aria-hidden="true"
                  />
                  {collapsed ? (
                    <span className="sr-only">{item.label}</span>
                  ) : (
                    <span className="flex-1 truncate font-medium">{item.label}</span>
                  )}
                  {badge !== undefined && badge > 0 &&
                    (collapsed ? (
                      <span
                        className="absolute right-3 top-2 h-2 w-2 rounded-full bg-status-amber ring-2 ring-base-900"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="rounded-full bg-status-amber/15 px-1.5 text-[11px] font-semibold tabular-nums text-amber-300">
                        {badge}
                      </span>
                    ))}
                  {badge !== undefined && badge > 0 && <span className="sr-only">({badge} open)</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 space-y-2 border-t border-hairline p-3">
        <InstallAppButton collapsed={collapsed} />
        {!collapsed && (
          <div className="rounded-xl border border-violet/20 bg-violet/[0.06] p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-200">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              Demo mode
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
              Static demonstration data as of {formatDate(DEMO_AS_OF)}. Nothing is saved.
            </p>
          </div>
        )}
        {variant === "desktop" && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "focus-ring flex w-full items-center gap-2 rounded-xl py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-slate-200",
              collapsed ? "justify-center" : "px-3",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />
                Collapse sidebar
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
