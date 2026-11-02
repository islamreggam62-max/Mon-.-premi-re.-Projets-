import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

/**
 * Root layout: document, metadata, and the offline worker. The product UI
 * (sidebar + top bar) lives in app/(app)/layout.tsx; the public landing page
 * in app/(marketing) has its own header and footer.
 */
export const metadata: Metadata = {
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
