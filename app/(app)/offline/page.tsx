import type { Metadata } from "next";
import { OfflineView } from "@/components/views/OfflineView";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

/** Served by the service worker when a page is requested offline and isn't cached yet. */
export default function OfflinePage() {
  return <OfflineView />;
}
