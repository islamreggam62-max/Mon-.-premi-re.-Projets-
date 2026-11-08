import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { NativeAppSetup } from "@/components/native/NativeAppSetup";

/**
 * Root layout: document, metadata, the offline worker (web), and the Android
 * app setup (components/native). The product UI
 * (sidebar + top bar) lives in app/(app)/layout.tsx; the public landing page
 * in app/(marketing) has its own header and footer.
 */
export const metadata: Metadata = {
  // Absolute origin for link previews (Next.js adds the base path itself);
  // app/opengraph-image.png and app/twitter-image.png supply the card image.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "NEXORA",
    title: "NEXORA — The Executive Business Operating System",
    description:
      "One command center for executives: KPIs, projects, tasks, daily reports, approvals, and AI operational intelligence.",
  },
  twitter: { card: "summary_large_image" },
  title: {
    default: "NEXORA — Executive Business Operating System",
    template: "%s · NEXORA",
  },
  description:
    "NEXORA centralizes enterprise execution: executive KPIs, team, projects, tasks, daily reports, approvals, and AI operational intelligence.",
  applicationName: "NEXORA",
  // Installed-app behavior on iOS (Add to Home Screen); Android/desktop use app/manifest.ts.
  appleWebApp: {
    capable: true,
    title: "NEXORA",
    statusBarStyle: "black",
  },
  formatDetection: { telephone: false },
};

/**
 * Mobile viewport. Dark navy paints the browser and system bars to match the
 * page; the violet accent (#7C3AED) is the Android theme accent and the icon's.
 * viewport-fit stays "auto": the UI has no safe-area padding, so Capacitor keeps
 * the Android WebView inside the status and navigation bars. Zoom stays allowed.
 */
export const viewport: Viewport = {
  themeColor: "#060913",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "auto",
  // The on-screen keyboard resizes the page, so focused fields stay visible.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <ServiceWorkerRegister />
        <NativeAppSetup />
      </body>
    </html>
  );
}
