"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { navSections } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const configured = isSupabaseConfigured();

  return (
    <div className="flex h-full flex-col bg-surface/95 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between gap-2 border-b border-border/70 px-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="nx-focus flex items-center gap-2.5 rounded-lg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow-sm">
            <span className="text-sm font-bold tracking-tight text-white">
              NX
            </span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              NEXORA
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-subtle">
              Executive OS
            </span>
          </span>
        </Link>
        {onNavigate ? (
          <button
            onClick={onNavigate}
            className="nx-focus rounded-lg p-1.5 text-muted hover:bg-surface-2 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-subtle">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "nx-focus group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-violet-500/15 text-foreground"
                          : "text-muted hover:bg-surface-2/70 hover:text-foreground"
                      )}
                    >
                      {active ? (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient"
                          aria-hidden
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition",
                          active
                            ? "text-violet-300"
                            : "text-subtle group-hover:text-muted"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge ? (
                        <Badge
                          tone={active ? "brand" : "neutral"}
                          className="ml-auto"
                        >
                          {item.badge}
                        </Badge>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / status card */}
      <div className="border-t border-border/70 p-3">
        <div className="nx-panel nx-sheen rounded-xl p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                configured ? "bg-success" : "bg-warning"
              )}
            />
            {configured ? "Live workspace" : "Demo mode"}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-subtle">
            {configured
              ? "Connected to Supabase — showing your real data."
              : "Connect Supabase to replace demo data with your workspace."}
          </p>
        </div>
      </div>
    </div>
  );
}
