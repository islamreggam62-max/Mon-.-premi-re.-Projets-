"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import { allNavItems } from "@/lib/nav";
import { Avatar } from "@/components/ui/avatar";

function currentLabel(pathname: string) {
  if (pathname === "/") return "Dashboard";
  const match = allNavItems.find(
    (i) => i.href !== "/" && pathname.startsWith(i.href)
  );
  return match?.label ?? "Dashboard";
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const label = currentLabel(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-surface/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenu}
        className="nx-focus rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 flex-col lg:flex">
        <span className="text-[11px] font-medium uppercase tracking-wider text-subtle">
          Workspace
        </span>
        <span className="truncate text-sm font-semibold text-foreground">
          {label}
        </span>
      </div>

      {/* Search (visual only in Phase 1) */}
      <div className="relative ml-auto w-full max-w-md lg:ml-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          type="text"
          disabled
          placeholder="Search — coming soon"
          aria-label="Search (not available in Phase 1)"
          className="nx-focus h-10 w-full cursor-not-allowed rounded-xl border border-border bg-surface-2/60 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle"
        />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          className="nx-focus relative rounded-lg p-2 text-muted hover:bg-surface-2"
          aria-label="Notifications (demo)"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
        </button>

        <div className="ml-1 flex items-center gap-2.5 rounded-xl border border-border bg-surface-2/50 py-1 pl-1 pr-3">
          <Avatar initials="AH" size="sm" />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-xs font-semibold text-foreground">
              Amelia Hart
            </span>
            <span className="text-[10px] text-subtle">Demo account</span>
          </div>
        </div>
      </div>
    </header>
  );
}
