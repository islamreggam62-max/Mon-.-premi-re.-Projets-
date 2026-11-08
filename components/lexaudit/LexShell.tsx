"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { LexLogo } from "@/components/lexaudit/LexLogo";
import { LexSidebar } from "@/components/lexaudit/LexSidebar";
import { LanguageSwitcher } from "@/components/lexaudit/LanguageSwitcher";
import { useLang } from "@/components/lexaudit/LangProvider";
import { LEX_HOME } from "@/lib/lexaudit/nav";
import { cn } from "@/lib/utils";

/**
 * LexAudit product frame: a fixed sidebar on wide screens, a slide-in drawer on
 * phones, and a sticky top bar. Layout uses logical properties so Arabic (RTL)
 * places the sidebar on the right and the drawer slides from the inline-start.
 */
export function LexShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, dir } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerWasOpen = useRef(false);

  // Close the drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Drawer behaviour: scroll lock, Escape, focus management, desktop auto-close.
  useEffect(() => {
    if (!mobileOpen) {
      if (drawerWasOpen.current) {
        drawerWasOpen.current = false;
        menuButtonRef.current?.focus();
      }
      return;
    }
    drawerWasOpen.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [mobileOpen]);

  // Drawer slides in from the inline-start edge (left in LTR, right in RTL).
  const closedTransform = dir === "rtl" ? "translate-x-full" : "-translate-x-full";

  return (
    <div className="lex-shell flex min-h-screen" style={{ backgroundColor: "#0B0F19" }}>
      <a
        href="#lex-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-violet-600 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        style={{ insetInlineStart: "1rem" }}
      >
        {t("nav.dashboard")}
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-e border-hairline bg-base-900/60 backdrop-blur lg:block">
        <LexSidebar variant="desktop" />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "visible" : "pointer-events-none invisible transition-[visibility] duration-0 delay-200",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.modules")}
          className={cn(
            "absolute inset-y-0 w-[17rem] max-w-[85vw] border-e border-hairline bg-base-900 shadow-2xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : closedTransform,
          )}
          style={{ insetInlineStart: 0 }}
        >
          <LexSidebar variant="mobile" onClose={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-hairline bg-base-900/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              className="focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-slate-100 lg:hidden"
              aria-label={t("nav.modules")}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <Link
              href={LEX_HOME}
              className="focus-ring flex items-center gap-2 rounded-xl lg:hidden"
              aria-label={t("brand.name")}
            >
              <LexLogo className="h-8 w-8" />
            </Link>

            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-medium text-slate-200">{t("brand.tagline")}</p>
            </div>

            <div className="ms-auto flex items-center gap-3">
              <LanguageSwitcher />
              <span className="hidden items-center gap-2 rounded-xl border border-hairline bg-white/[0.03] px-3 py-1.5 sm:flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 to-violet-500 text-[10px] font-semibold text-white">
                  DJ
                </span>
                <span className="text-xs text-slate-300">{t("top.demoUser")}</span>
              </span>
            </div>
          </div>
        </header>

        <main id="lex-main" className="mx-auto w-full max-w-[88rem] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
