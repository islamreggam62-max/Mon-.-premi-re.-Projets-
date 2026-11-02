import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

/**
 * Root layout: document, metadata, and the offline worker. The product UI
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

export const viewport: Viewport = {
  themeColor: "#060913",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
