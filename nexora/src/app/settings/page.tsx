import type { Metadata } from "next";
import { getSettingsView } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";

export const metadata: Metadata = {
  title: "Settings",
  description: "Workspace preferences, role-based access preview and configuration.",
};

export default function SettingsPage() {
  const view = getSettingsView();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Workspace preferences, check-in policy, notifications, role-based access and security."
      />
      <SettingsWorkspace view={view} />
    </div>
  );
}
