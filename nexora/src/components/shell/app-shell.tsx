import type { ReactNode } from "react";
import { CalendarClock, FlaskConical } from "lucide-react";
import { getShellView } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { BrandLockup } from "./brand";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({ children }: { readonly children: ReactNode }) {
  const shell = getShellView();
  const badges = { approvals: shell.badges.approvals };
  const asOf = `${formatDate(shell.today, "weekday")} · ${formatTime(shell.asOf, shell.timeZone)}`;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      {/* Ambient violet glow behind the content. Decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_85%_-10%,rgb(124_58_237/0.16),transparent_60%),radial-gradient(40rem_24rem_at_10%_110%,rgb(139_92_246/0.08),transparent_60%)]"
      />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-canvas/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <BrandLockup />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
            Workspace
          </p>
          <SidebarNav badges={badges} />
        </div>
        <div className="border-t border-line p-4">
          <div className="rounded-lg border border-brand-soft/20 bg-brand-soft/[0.06] p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-ink-strong">
              <FlaskConical aria-hidden="true" className="size-3.5" />
              Phase 1 · Demo mode
            </p>
            <p className="mt-1 text-[11px] leading-4 text-ink-muted">
              Static demo data, no backend. Changes are not saved.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <MobileNav badges={badges} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{shell.workspaceName}</p>
              <p className="truncate text-[11px] text-ink-subtle">{shell.plan}</p>
            </div>
            <p className="hidden items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-ink-muted md:flex">
              <CalendarClock aria-hidden="true" className="size-3.5 text-brand-ink" />
              <span>
                <span className="sr-only">Demo data as of </span>
                {asOf}
              </span>
            </p>
            <div className="flex items-center gap-2.5">
              <Avatar initials={shell.currentUser.initials} />
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-xs font-semibold text-ink">{shell.currentUser.name}</p>
                <p className="truncate text-[11px] text-ink-subtle">{shell.currentUser.title}</p>
              </div>
            </div>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 focus:outline-none sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>
    </>
  );
}
