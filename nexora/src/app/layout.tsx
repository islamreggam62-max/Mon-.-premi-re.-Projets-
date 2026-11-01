import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NEXORA — Executive Business Operating System",
    template: "%s · NEXORA",
  },
  description:
    "NEXORA is an AI-powered Executive Business Operating System. Connect Supabase to replace demo data with your workspace.",
  applicationName: "NEXORA",
};

export const viewport: Viewport = {
  themeColor: "#070b17",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
