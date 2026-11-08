"use client";

import { useEffect, useState } from "react";
import { Building2, KeyRound, Smartphone } from "lucide-react";
import { OrganizationForm } from "@/components/forms/OrganizationForm";
import { SettingsView } from "@/components/settings/SettingsView";
import { BackupPanel } from "@/components/store/BackupPanel";
import { CompanySetupForm } from "@/components/store/Welcome";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DEMO_SEATS_INCLUDED, WORKSPACES } from "@/lib/data/meta";
import { GOVERNANCE_POLICIES, ORGANIZATION, PERMISSIONS, ROLE_DEFINITIONS, SECURITY_CONTROLS } from "@/lib/data/settings";
import { ACCESS_ROLE_LABEL, ACCESS_ROLE_ORDER } from "@/lib/labels";
import { useNexora } from "@/lib/store/StoreProvider";
import { pluralize } from "@/lib/utils";
import { DataBadge } from "./shared";

/**
 * Settings. Own company: the editable profile, roles as recorded on each
 * person, and the device data (backup, restore, erase). Sample company: the
 * same data section, a way to start the real company, then the sample's
 * workspace settings preview.
 */
export function SettingsPageView() {
  const { data } = useNexora();
  const sample = data.mode === "sample";

  // The data section is rendered after the device data loads, so the browser's own jump to #data can miss it.
  useEffect(() => {
    if (window.location.hash === "#data") document.getElementById("data")?.scrollIntoView();
  }, []);

  return (
    <div>
      <PageHeader
        title={sample ? "Workspace Settings" : "Settings"}
        subtitle={
          sample
            ? "Your data on this device, then the sample workspace's governance, roles, and preferences (preview)."
            : "Company profile, roles, and the data saved on this device."
        }
        action={<DataBadge />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {sample ? (
          <StartCompanyCard />
        ) : (
          <Card>
            <CardHeader title="Company profile" subtitle="Shown across NEXORA on this device" />
            <CardBody>
              <OrganizationForm />
            </CardBody>
          </Card>
        )}

        <Card id="data" className="scroll-mt-24">
          <CardHeader title="Your data" subtitle="Saved on this device only, never sent anywhere" />
          <CardBody>
            <BackupPanel />
          </CardBody>
        </Card>

        {!sample && <RolesCard />}
      </div>

      {sample && (
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-semibold text-slate-50">Sample workspace settings (preview)</h2>
          <SettingsView
            governance={GOVERNANCE_POLICIES}
            organization={ORGANIZATION}
            roles={ROLE_DEFINITIONS}
            permissions={PERMISSIONS}
            people={data.people}
            securityControls={SECURITY_CONTROLS}
            workspace={WORKSPACES.find((w) => w.current) ?? WORKSPACES[0]}
            seatsIncluded={DEMO_SEATS_INCLUDED}
          />
        </div>
      )}
    </div>
  );
}

function StartCompanyCard() {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-violet/30">
      <CardHeader title="Start your own company" subtitle="Leave the sample and enter your real data" />
      <CardBody>
        {open ? (
          <>
            <p className="rounded-lg border border-status-amber/30 bg-status-amber/10 px-3 py-2 text-sm text-amber-100">
              This replaces the sample company on this device. Your edits to the sample are not kept.
            </p>
            <CompanySetupForm onCancel={() => setOpen(false)} />
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-300">
              Start empty with your company&apos;s name and your own profile, then add your team, projects, tasks,
              reports, and approvals. Everything stays on this device.
            </p>
            <button type="button" className="btn btn-primary mt-4 px-4 py-2 text-sm" onClick={() => setOpen(true)}>
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Set up my company
            </button>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function RolesCard() {
  const { data } = useNexora();
  return (
    <Card className="xl:col-span-2">
      <CardHeader title="Roles" subtitle="Recorded on each person; change them from Team" />
      <CardBody className="space-y-4">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {ACCESS_ROLE_ORDER.map((role) => {
            const count = data.people.filter((p) => p.accessRole === role).length;
            return (
              <li key={role} className="rounded-xl border border-hairline bg-white/[0.02] p-3">
                <p className="text-xs text-slate-400">{ACCESS_ROLE_LABEL[role]}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-slate-50">{count}</p>
              </li>
            );
          })}
        </ul>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex gap-2">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
            Roles decide who can approve requests ({pluralize(data.people.filter((p) => ["owner", "admin", "manager"].includes(p.accessRole)).length, "person", "people")} can
            today). They do not lock anything on this device: whoever opens NEXORA here can see and edit everything.
          </li>
          <li className="flex gap-2">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
            Protect the device with a screen lock. Separate sign-ins and permissions per person come with company
            accounts.
          </li>
        </ul>
      </CardBody>
    </Card>
  );
}
