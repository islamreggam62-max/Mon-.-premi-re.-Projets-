import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TRUST — Contract risk & intelligence", template: "%s · TRUST" },
  description:
    "TRUST helps organisations understand, monitor and control contractual risks and obligations, with every AI finding traced to the page and clause it comes from.",
  robots: { index: false, follow: false }, // private application; the marketing site is separate
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1E3A8A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
