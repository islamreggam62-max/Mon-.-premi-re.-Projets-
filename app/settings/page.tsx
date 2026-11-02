import type { Metadata } from "next";
import { DemoBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsView } from "@/components/settings/SettingsView";
import { DEMO_SEATS_INCLUDED, WORKSPACES } from "@/lib/data/meta";
import {
  GOVERNANCE_POLICIES,
  ORGANIZATION,
  PERMISSIONS,
  ROLE_DEFINITIONS,
  SECURITY_CONTROLS,
} from "@/lib/data/settings";
import { TEAM } from "@/lib/data/team";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  const workspace = WORKSPACES.find((w) => w.current) ?? WORKSPACES[0];
  return (
    <div>
      <PageHeader
        title="Workspace Settings"
        subtitle="Workspace governance, organization profile, role-based access control (preview), and system preferences."
        action={<DemoBadge label="Static demo data" />}
      />
      <SettingsView
        governance={GOVERNANCE_POLICIES}
        organization={ORGANIZATION}
        roles={ROLE_DEFINITIONS}
        permissions={PERMISSIONS}
        people={TEAM}
        securityControls={SECURITY_CONTROLS}
        workspace={workspace}
        seatsIncluded={DEMO_SEATS_INCLUDED}
      />
    </div>
  );
}
