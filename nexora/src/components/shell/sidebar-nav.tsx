"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuleKey } from "@/types";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";

interface SidebarNavProps {
  /** Count of items awaiting the signed-in user, per module. */
  readonly badges: Partial<Record<ModuleKey, number>>;
  readonly onNavigate?: () => void;
}

export function SidebarNav({ badges, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Modules">
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = badges[item.key];
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-soft/[0.12] text-ink shadow-[inset_0_0_0_1px_rgb(139_92_246/0.25)]"
                    : "text-ink-muted hover:bg-white/[0.04] hover:text-ink",
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand-soft"
                  />
                ) : null}
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-brand-ink" : "text-ink-subtle group-hover:text-ink-muted",
                  )}
                />
                <span className="truncate">{item.label}</span>
                {badge ? (
                  <span className="ml-auto rounded-md bg-brand px-1.5 py-px text-[11px] font-semibold tabular-nums text-white">
                    <span aria-hidden="true">{badge}</span>
                    <span className="sr-only">{badge} awaiting your decision</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
