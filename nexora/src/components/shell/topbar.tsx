"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search, LogOut, ChevronDown } from "lucide-react";
import { allNavItems } from "@/lib/nav";
import { Avatar } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/auth";

function currentLabel(pathname: string) {
  if (pathname === "/") return "Dashboard";
  const match = allNavItems.find(
    (i) => i.href !== "/" && pathname.startsWith(i.href)
  );
  return match?.label ?? "Dashboard";
}

export function Topbar({
  onMenu,
  profile,
}: {
  onMenu: () => void;
  profile: UserProfile | null;
}) {
  const pathname = usePathname();
  const label = currentLabel(pathname);

  const name = profile?.fullName ?? "Amelia Hart";
  const initials = profile?.initials ?? "AH";
  const sub = profile ? profile.role || profile.email : "Demo account";

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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

      {/* Search (visual only for now) */}
      <div className="relative ml-auto w-full max-w-md lg:ml-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          type="text"
          disabled
          placeholder="Search — coming soon"
          aria-label="Search (not yet available)"
          className="nx-focus h-10 w-full cursor-not-allowed rounded-xl border border-border bg-surface-2/60 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle"
        />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          className="nx-focus relative rounded-lg p-2 text-muted hover:bg-surface-2"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
        </button>

        {profile ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="nx-focus ml-1 flex items-center gap-2.5 rounded-xl border border-border bg-surface-2/50 py-1 pl-1 pr-2 hover:bg-surface-2"
            >
              <Avatar initials={initials} size="sm" />
              <div className="hidden flex-col leading-tight text-left sm:flex">
                <span className="max-w-[9rem] truncate text-xs font-semibold text-foreground">
                  {name}
                </span>
                <span className="max-w-[9rem] truncate text-[10px] text-subtle">
                  {sub}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-subtle" />
            </button>

            {open ? (
              <div
                role="menu"
                className="nx-card absolute right-0 mt-2 w-56 overflow-hidden p-1"
              >
                <div className="border-b border-border/60 px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {name}
                  </p>
                  <p className="truncate text-xs text-subtle">
                    {profile.email}
                  </p>
                </div>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    role="menuitem"
                    className="nx-focus flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="ml-1 flex items-center gap-2.5 rounded-xl border border-border bg-surface-2/50 py-1 pl-1 pr-3">
            <Avatar initials={initials} size="sm" />
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-xs font-semibold text-foreground">
                {name}
              </span>
              <span className="text-[10px] text-subtle">{sub}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
