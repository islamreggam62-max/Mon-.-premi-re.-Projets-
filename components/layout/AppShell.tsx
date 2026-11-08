"use client";

import { t } from "@/lib/i18n/core";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AppNotification, Person, Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const COLLAPSE_KEY = "nexora:sidebar-collapsed";

export function AppShell({
  children,
  currentUser,
  workspaces,
  notifications,
  navBadges,
}: {
  children: React.ReactNode;
  currentUser: Person;
  workspaces: Workspace[];
  notifications: AppNotification[];
  navBadges: Record<string, number>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerWasOpen = useRef(false);

  // Restore the per-viewer sidebar preference after mount (keeps SSR markup stable).
  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {
      /* storage unavailable: keep the default */
    }
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Drawer behaviour: scroll lock, Escape, focus in/out, auto-close at desktop width.
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

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable: preference lasts for this page view only */
    }
  }

  return (
    <div
      className={cn(
        "min-h-screen lg:grid lg:transition-[grid-template-columns] lg:duration-200",
        collapsed ? "lg:grid-cols-[5rem_minmax(0,1fr)]" : "lg:grid-cols-[17rem_minmax(0,1fr)]",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-violet focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t("Skip to content")}
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-e border-hairline bg-base-900/60 backdrop-blur lg:block">
        <Sidebar
          variant="desktop"
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          badges={navBadges}
          workspaces={workspaces}
        />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          // Closed: stop intercepting taps at once; hide after the 200 ms slide-out finishes.
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
          aria-label={t("Navigation menu")}
          data-dismiss-on-back={mobileOpen ? "" : undefined}
          className={cn(
            "absolute inset-y-0 start-0 w-[17rem] max-w-[85vw] border-e border-hairline bg-base-900 shadow-2xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
          )}
        >
          <Sidebar
            variant="mobile"
            onClose={() => setMobileOpen(false)}
            badges={navBadges}
            workspaces={workspaces}
          />
        </div>
      </div>

      <div className="flex min-h-screen min-w-0 flex-col">
        <Topbar
          onOpenMenu={() => setMobileOpen(true)}
          menuButtonRef={menuButtonRef}
          currentUser={currentUser}
          workspaces={workspaces}
          notifications={notifications}
        />
        <main id="main" className="mx-auto w-full max-w-[90rem] flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
