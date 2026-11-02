import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { APPROVALS } from "@/lib/data/approvals";
import { NOTIFICATIONS } from "@/lib/data/dashboard";
import { CURRENT_USER_ID, WORKSPACES } from "@/lib/data/meta";
import { TEAM } from "@/lib/data/team";
import { isOpenApproval } from "@/lib/metrics";

export const metadata: Metadata = {
  title: {
    default: "NEXORA — Executive Business Operating System",
    template: "%s · NEXORA",
  },
  description:
    "NEXORA centralizes enterprise execution: executive KPIs, team, projects, tasks, daily reports, approvals, and AI operational intelligence.",
  applicationName: "NEXORA",
};

export const viewport: Viewport = {
  themeColor: "#060913",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentUser = TEAM.find((p) => p.id === CURRENT_USER_ID) ?? TEAM[0];
  const openApprovals = APPROVALS.filter((a) => isOpenApproval(a.status)).length;

  return (
    <html lang="en">
      <body className="font-sans">
        <AppShell
          currentUser={currentUser}
          workspaces={WORKSPACES}
          notifications={NOTIFICATIONS}
          navBadges={{ "/approvals": openApprovals }}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
