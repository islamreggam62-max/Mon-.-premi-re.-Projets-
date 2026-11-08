"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LogoMark } from "@/components/layout/Sidebar";
import { APP_HOME } from "@/lib/basePath";
import { normalizePath } from "@/lib/nav";
import { currentUser, notificationsFor, openApprovalCount, workspacesFor } from "@/lib/store/derived";
import { useStore } from "@/lib/store/StoreProvider";
import { setDisplayCurrency } from "@/lib/utils";
import { RestoreBackup } from "./BackupPanel";
import { Welcome } from "./Welcome";

/**
 * The product shell, once the device data is loaded. Before that: a short
 * loading screen, the welcome screen (no data yet), or a recovery screen (data
 * that cannot be read). A link with ?demo=1 (the website's "Try the live demo")
 * opens the sample company directly when the device has no data yet.
 */
export function ConnectedShell({ children }: { children: React.ReactNode }) {
  const { status, data, actions, saveFailed } = useStore();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "empty") return;
    if (new URLSearchParams(window.location.search).has("demo")) actions.startSample();
  }, [status, actions]);

  if (status === "loading") return <Loading />;
  if (status === "unreadable") return <Unreadable />;
  // The guide is readable before any company exists (linked from the welcome screen).
  if ((status === "empty" || !data) && normalizePath(pathname) === "/help") return <StandaloneGuide>{children}</StandaloneGuide>;
  if (status === "empty" || !data) return <Welcome />;

  setDisplayCurrency(data.mode === "sample" ? "USD" : data.company.currency);
  return (
    <AppShell
      currentUser={currentUser(data)}
      workspaces={workspacesFor(data)}
      notifications={notificationsFor(data)}
      navBadges={{ "/approvals": openApprovalCount(data) }}
    >
      {saveFailed && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-status-rose/30 bg-status-rose/10 px-3 py-2 text-sm text-rose-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Your last change could not be saved on this device (storage full or blocked). Make a backup from Settings.
        </p>
      )}
      {children}
    </AppShell>
  );
}

function StandaloneGuide({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href={APP_HOME} className="focus-ring mb-6 inline-flex items-center gap-2 rounded text-sm font-semibold text-violet-300 hover:text-violet-200">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to the start screen
      </Link>
      <main id="main">{children}</main>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-busy="true" aria-label="Loading NEXORA">
      <LogoMark className="h-12 w-12 motion-safe:animate-pulse" />
    </div>
  );
}

function Unreadable() {
  const { actions } = useStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-50">Your saved data could not be read</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        The data stored on this device is damaged or comes from another version. Restore a backup, or start over (this
        erases the unreadable data).
      </p>
      <div className="glass mt-6 p-5">
        <RestoreBackup />
      </div>
      <div className="mt-4">
        {confirm ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-300">Erase the unreadable data?</span>
            <button type="button" className="btn btn-danger px-4 py-2 text-sm" onClick={actions.eraseAll}>
              Erase and start over
            </button>
            <button type="button" className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setConfirm(true)}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
