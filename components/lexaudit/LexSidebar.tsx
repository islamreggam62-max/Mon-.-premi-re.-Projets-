"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FileSearch,
  FlaskConical,
  Gavel,
  LayoutDashboard,
  ScrollText,
  ClipboardList,
  X,
  type LucideIcon,
} from "lucide-react";
import { LexLogo } from "@/components/lexaudit/LexLogo";
import { useLang } from "@/components/lexaudit/LangProvider";
import { LEX_HOME, LEX_NAV, isActiveLexPath } from "@/lib/lexaudit/nav";
import type { LexNavIcon } from "@/lib/lexaudit/types";
import { cn } from "@/lib/utils";

const ICONS: Record<LexNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  "new-audit": FileSearch,
  tender: ClipboardList,
  log: ScrollText,
  rules: Gavel,
  subscription: CreditCard,
};

export function LexSidebar({ variant, onClose }: { variant: "desktop" | "mobile"; onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-hairline px-5">
        <Link
          href={LEX_HOME}
          onClick={onClose}
          className="focus-ring flex min-w-0 items-center gap-2.5 rounded-xl"
          aria-label={`${t("brand.name")} — ${t("nav.dashboard")}`}
        >
          <LexLogo />
          <span className="truncate text-[15px] font-semibold tracking-wide text-slate-50">
            {t("brand.name")}
          </span>
        </Link>
        {variant === "mobile" && (
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            className="focus-ring rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {t("nav.modules")}
        </p>
        <ul className="space-y-1">
          {LEX_NAV.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActiveLexPath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-ring group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-violet/15 text-slate-50 ring-1 ring-inset ring-violet/30"
                      : "text-slate-300 hover:bg-white/5 hover:text-slate-100",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active ? "text-violet-300" : "text-slate-400 group-hover:text-slate-300",
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate font-medium">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-hairline p-3">
        <div className="rounded-xl border border-violet/20 bg-violet/[0.06] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-200">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            {t("common.demoShort")}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{t("common.previewOnly")}</p>
        </div>
      </div>
    </div>
  );
}
