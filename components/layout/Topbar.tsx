"use client";

import { t } from "@/lib/i18n/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Info,
  LogOut,
  Menu,
  Search,
  Settings,
  Smartphone,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Popover } from "@/components/ui/Popover";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { ACCESS_ROLE_LABEL } from "@/lib/labels";
import { APP_HOME } from "@/lib/basePath";
import { findNavItem, normalizePath } from "@/lib/nav";
import { useStore } from "@/lib/store/StoreProvider";
import type { AppNotification, NotificationTone, Person, Workspace } from "@/lib/types";
import { cn, formatLongDate, formatShortDate, formatTime } from "@/lib/utils";

export function Topbar({
  onOpenMenu,
  menuButtonRef,
  currentUser,
  workspaces,
  notifications,
}: {
  onOpenMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  currentUser: Person;
  workspaces: Workspace[];
  notifications: AppNotification[];
}) {
  const pathname = usePathname();
  const page = findNavItem(pathname) ?? {
    label: normalizePath(pathname) === "/offline" ? "Offline" : normalizePath(pathname) === "/help" ? "How NEXORA works" : "Page not found",
    description: "",
  };
  const workspace = workspaces.find((w) => w.current) ?? workspaces[0];

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-base-900/75 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          className="focus-ring -ms-1 rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-slate-200 lg:hidden"
          aria-label={t("Open navigation menu")}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <nav aria-label={t("Breadcrumb")} className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            <li className="hidden shrink-0 md:block">
              <Link href={APP_HOME} className="focus-ring rounded text-slate-400 hover:text-slate-200">
                {workspace.name}
              </Link>
            </li>
            <li className="hidden shrink-0 text-slate-400 md:block" aria-hidden="true">
              <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
            </li>
            <li className="min-w-0">
              <span aria-current="page" className="block truncate font-semibold text-slate-50">
                {t(page.label)}
              </span>
              <span className="hidden truncate text-xs text-slate-400 xl:block">{page.description && t(page.description)}</span>
            </li>
          </ol>
        </nav>

        <SearchPlaceholder />
        <DemoModeBadge />
        <NotificationsMenu items={notifications} />
        <ProfileMenu user={currentUser} />
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------------
 * Search (placeholder)
 * ------------------------------------------------------------------------- */

function SearchPlaceholder() {
  return (
    <div className="relative hidden md:block" title={t("Global search arrives in Phase 2")}>
      <Search
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        readOnly
        aria-label={t("Global search (available in Phase 2)")}
        placeholder={t("Search NEXORA…")}
        className="field w-56 cursor-default ps-9 pe-16 lg:w-72"
      />
      <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 rounded-md border border-hairline bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
        {t("Phase 2")}
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Demo mode badge
 * ------------------------------------------------------------------------- */

function DemoModeBadge() {
  const { data } = useStore();
  if (data?.mode === "company") return <DeviceModeBadge />;
  return (
    <Popover
      panelLabel={t("About demo data mode")}
      panelClassName="w-80"
      trigger={() => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-violet/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-100 ring-1 ring-inset ring-violet/50">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-violet-soft opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-soft" />
          </span>
          {t("Demo data mode")}
        </span>
      )}
    >
      <div className="p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <FlaskConical className="h-4 w-4 text-violet-300" aria-hidden="true" />
          {t("You are viewing a sample company")}
        </p>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
          <li>{t("People, projects, and figures are fictional, dated {date}.", { date: formatLongDate(DEMO_AS_OF) })}</li>
          <li>{t("Your edits are saved on this device only. No server, database, or AI model is connected.")}</li>
          <li>
            <Link href="/settings#data" className="text-violet-300 underline-offset-2 hover:underline">
              {t("Set up your own company when you are ready.")}
            </Link>
          </li>
        </ul>
      </div>
    </Popover>
  );
}

/** Own company: where the data lives, and the reminder to back it up. */
function DeviceModeBadge() {
  return (
    <Popover
      panelLabel={t("Where your data is saved")}
      panelClassName="w-80"
      trigger={() => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-inset ring-white/15">
          <Smartphone className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
          <span className="hidden sm:inline">{t("On this device")}</span>
        </span>
      )}
    >
      <div className="p-4">
        <p className="text-sm font-semibold text-slate-100">{t("Saved on this device")}</p>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
          <li>{t("Every change is saved here at once, and NEXORA works offline.")}</li>
          <li>{t("Nothing is sent anywhere. Company accounts shared with your team come in a later version.")}</li>
          <li>
            {t("Uninstalling the app or clearing its storage erases the data.")}{" "}
            <Link href="/settings#data" className="text-violet-300 underline-offset-2 hover:underline">
              {t("Keep a backup.")}
            </Link>
          </li>
        </ul>
      </div>
    </Popover>
  );
}

/* ----------------------------------------------------------------------------
 * Notifications
 * ------------------------------------------------------------------------- */

const TONE_ICON: Record<NotificationTone, { icon: typeof Info; className: string }> = {
  critical: { icon: CircleAlert, className: "text-rose-300 bg-status-rose/10 ring-status-rose/25" },
  warning: { icon: AlertTriangle, className: "text-amber-300 bg-status-amber/10 ring-status-amber/25" },
  info: { icon: Info, className: "text-sky-300 bg-status-sky/10 ring-status-sky/25" },
};

function NotificationsMenu({ items }: { items: AppNotification[] }) {
  const { data } = useStore();
  const sample = data?.mode !== "company";
  return (
    <Popover
      panelLabel={t("Notifications")}
      triggerLabel={`${t("Notifications")} (${items.length})`}
      panelClassName="w-[22rem]"
      triggerClassName="border border-hairline bg-white/[0.03] hover:border-white/15"
      trigger={() => (
        <span className="relative flex p-2.5 text-slate-300">
          <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
          {items.length > 0 && (
            <span
              className="absolute end-2 top-2 h-2 w-2 rounded-full bg-status-rose ring-2 ring-base-900"
              aria-hidden="true"
            />
          )}
        </span>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <p className="text-sm font-semibold text-slate-100">{t("Notifications")}</p>
            {sample && <Badge tone="violet">{t("Demo")}</Badge>}
          </div>
          {items.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400">
              {t("No alerts. Overdue approvals, high blockers in today's reports, and delayed projects show up here.")}
            </p>
          )}
          <ul className="max-h-[60vh] divide-y divide-white/5 overflow-y-auto">
            {items.map((n) => {
              const tone = TONE_ICON[n.tone];
              const Icon = tone.icon;
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={close}
                    className="focus-ring flex gap-3 px-4 py-3 hover:bg-white/[0.04]"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                        tone.className,
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-100">{n.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-300">{n.detail}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">
                        {formatShortDate(n.time)} · {formatTime(n.time)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Popover>
  );
}

/* ----------------------------------------------------------------------------
 * Profile
 * ------------------------------------------------------------------------- */

function ProfileMenu({ user }: { user: Person }) {
  return (
    <Popover
      panelLabel={t("Account")}
      triggerLabel={t("Account menu for {name}", { name: user.name })}
      panelClassName="w-72"
      triggerClassName="hover:bg-white/5"
      trigger={() => (
        <span className="flex items-center gap-2 rounded-xl p-1 lg:pe-2">
          <Avatar person={user} size="sm" />
          <span className="hidden text-start lg:block">
            <span className="block max-w-[10rem] truncate text-sm font-medium leading-tight text-slate-100">
              {user.name}
            </span>
            <span className="block max-w-[10rem] truncate text-[11px] leading-tight text-slate-400">
              {user.title}
            </span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" aria-hidden="true" />
        </span>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 border-b border-hairline px-4 py-4">
            <Avatar person={user} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
              <p className="truncate text-xs text-slate-300">{user.email}</p>
              <Badge tone="violet" className="mt-1.5">
                {ACCESS_ROLE_LABEL[user.accessRole]}
              </Badge>
            </div>
          </div>
          <ul className="p-2 text-sm">
            <li>
              <Link
                href="/settings"
                onClick={close}
                className="focus-ring flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-slate-100"
              >
                <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {t("Workspace settings")}
              </Link>
            </li>
            <li>
              <Link
                href="/team"
                onClick={close}
                className="focus-ring flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-slate-100"
              >
                <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {t("Team directory")}
              </Link>
            </li>
            <li className="mt-1 border-t border-hairline pt-1">
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-slate-400"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t("Sign out")}
                <span className="ms-auto text-[10px] uppercase tracking-wide">{t("Auth · Phase 2")}</span>
              </button>
            </li>
          </ul>
        </>
      )}
    </Popover>
  );
}
