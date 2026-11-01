import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PreferenceToggles } from "@/components/settings/PreferenceToggles";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

const ROLES = ["Owner", "Admin", "Manager", "Member", "Viewer"] as const;
type Role = (typeof ROLES)[number];

const CAPABILITIES: { module: string; access: Record<Role, boolean> }[] = [
  { module: "Dashboard", access: { Owner: true, Admin: true, Manager: true, Member: true, Viewer: true } },
  { module: "Team", access: { Owner: true, Admin: true, Manager: true, Member: true, Viewer: true } },
  { module: "Projects", access: { Owner: true, Admin: true, Manager: true, Member: true, Viewer: false } },
  { module: "Tasks", access: { Owner: true, Admin: true, Manager: true, Member: true, Viewer: false } },
  { module: "Daily Reports", access: { Owner: true, Admin: true, Manager: true, Member: true, Viewer: false } },
  { module: "Approvals", access: { Owner: true, Admin: true, Manager: true, Member: false, Viewer: false } },
  { module: "AI Intelligence", access: { Owner: true, Admin: true, Manager: true, Member: false, Viewer: false } },
  { module: "Settings", access: { Owner: true, Admin: true, Manager: false, Member: false, Viewer: false } },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Workspace Settings"
        subtitle="Preferences, access control, and configuration."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Workspace" subtitle="Organization-wide identity" />
            <CardBody className="space-y-4">
              <Field label="Workspace name" value="NEXORA HQ" />
              <Field label="Primary domain" value="nexora.io" />
              <Field label="Plan" value="Enterprise" badge="Active" />
              <Field label="Region" value="Multi-region (US-East, EU-West)" />
              <Field label="Fiscal year start" value="January" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Role-based access control"
              subtitle="Preview of module permissions per role"
              action={<Badge tone="violet">Preview</Badge>}
            />
            <CardBody className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left">
                    <th className="pb-3 pr-4 font-medium text-slate-400">Module</th>
                    {ROLES.map((r) => (
                      <th
                        key={r}
                        className="px-2 pb-3 text-center font-medium text-slate-400"
                      >
                        {r}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {CAPABILITIES.map((row) => (
                    <tr key={row.module}>
                      <td className="py-2.5 pr-4 text-slate-200">{row.module}</td>
                      {ROLES.map((r) => (
                        <td key={r} className="px-2 py-2.5 text-center">
                          {row.access[r] ? (
                            <Check className="mx-auto h-4 w-4 text-status-emerald" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-slate-600" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Notifications" subtitle="How NEXORA keeps you informed" />
            <CardBody>
              <PreferenceToggles />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Appearance" subtitle="Theme" />
            <CardBody>
              <div className="flex items-center justify-between rounded-xl border border-violet/30 bg-violet/[0.06] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-100">Dark · Enterprise</p>
                  <p className="text-xs text-slate-400">Deep navy + royal violet</p>
                </div>
                <span className="flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-base-900 ring-1 ring-white/10" />
                  <span className="h-5 w-5 rounded-full bg-base-700 ring-1 ring-white/10" />
                  <span className="h-5 w-5 rounded-full bg-violet ring-1 ring-white/10" />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Additional themes arrive with the design system (Forge).
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-white/[0.02] px-4 py-3">
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-100">{value}</p>
      </div>
      {badge && (
        <Badge tone="emerald" dot>
          {badge}
        </Badge>
      )}
    </div>
  );
}
