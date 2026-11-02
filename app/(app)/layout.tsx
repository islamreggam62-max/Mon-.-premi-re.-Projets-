import { AppShell } from "@/components/layout/AppShell";
import { APPROVALS } from "@/lib/data/approvals";
import { NOTIFICATIONS } from "@/lib/data/dashboard";
import { CURRENT_USER_ID, WORKSPACES } from "@/lib/data/meta";
import { TEAM } from "@/lib/data/team";
import { isOpenApproval } from "@/lib/metrics";

/** Product layout: sidebar, top bar, and demo data context for the 8 modules. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const currentUser = TEAM.find((p) => p.id === CURRENT_USER_ID) ?? TEAM[0];
  const openApprovals = APPROVALS.filter((a) => isOpenApproval(a.status)).length;

  return (
    <AppShell
      currentUser={currentUser}
      workspaces={WORKSPACES}
      notifications={NOTIFICATIONS}
      navBadges={{ "/approvals": openApprovals }}
    >
      {children}
    </AppShell>
  );
}
