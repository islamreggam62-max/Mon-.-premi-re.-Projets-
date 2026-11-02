import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { RetryButton } from "@/components/pwa/RetryButton";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

/** Served by the service worker when a page is requested offline and isn't cached yet. */
export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/15 ring-1 ring-inset ring-violet/30">
        <WifiOff className="h-6 w-6 text-violet-300" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-xl font-semibold text-slate-50">You’re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-300">
        This page isn’t saved on this device yet. The eight NEXORA modules you have opened stay available offline;
        reconnect to load anything new.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <RetryButton />
        <Link href="/" className="btn btn-secondary">
          Open the dashboard
        </Link>
      </div>
    </div>
  );
}
