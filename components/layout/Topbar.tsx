"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";

function currentItem(pathname: string) {
  const sorted = [...NAV_ITEMS].sort((a, b) => b.href.length - a.href.length);
  return (
    sorted.find((i) =>
      i.href === "/" ? pathname === "/" : pathname.startsWith(i.href),
    ) ?? NAV_ITEMS[0]
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const item = currentItem(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-base-900/70 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">{item.label}</p>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            {item.description}
          </p>
        </div>

        <label className="relative hidden items-center md:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search NEXORA…"
            className="w-56 rounded-xl border border-hairline bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet/40 focus:outline-none focus:ring-2 focus:ring-violet/30 lg:w-72"
          />
        </label>

        <button
          className="relative rounded-xl border border-hairline bg-white/[0.03] p-2.5 text-slate-300 hover:border-white/15 hover:text-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-status-rose ring-2 ring-base-900" />
        </button>
      </div>
    </header>
  );
}
