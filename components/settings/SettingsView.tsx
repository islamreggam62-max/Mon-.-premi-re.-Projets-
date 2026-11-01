"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CreditCard,
  FileText,
  KeyRound,
  Lock,
  Palette,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { PreferenceToggles } from "@/components/settings/PreferenceToggles";
import { ACCESS_ROLE_LABEL, ACCESS_ROLE_ORDER, DEPARTMENT_ORDER, PERMISSION_LABEL } from "@/lib/labels";
import type {
  AccessRole,
  OrganizationProfile,
  PermissionLevel,
  PermissionRow,
  Person,
  RoleDefinition,
  SecurityControl,
  Workspace,
} from "@/lib/types";
import { percent } from "@/lib/utils";

type SettingsTab = "general" | "organization" | "roles" | "security" | "billing";

const PERMISSION_TONE: Record<PermissionLevel, Tone> = {
  full: "violet",
  edit: "sky",
  view: "slate",
  none: "slate",
};

export function SettingsView({
  organization,
  roles,
  permissions,
  people,
  securityControls,
  workspace,
  seatsIncluded,
}: {
  organization: OrganizationProfile;
  roles: RoleDefinition[];
  permissions: PermissionRow[];
  people: Person[];
  securityControls: SecurityControl[];
  workspace: Workspace;
  seatsIncluded: number;
}) {
  const [tab, setTab] = useState<SettingsTab>("general");

  return (
    <div>
      <Tabs<SettingsTab>
        ariaLabel="Settings sections"
        idPrefix="settings"
        value={tab}
        onChange={setTab}
        items={[
          { id: "general", label: "General", icon: SlidersHorizontal },
          { id: "organization", label: "Organization", icon: Building2 },
          { id: "roles", label: "Roles & Access", icon: Users },
          { id: "security", label: "Security", icon: ShieldCheck },
          { id: "billing", label: "Billing", icon: CreditCard },
        ]}
      />

      <div
        role="tabpanel"
        id={`settings-panel-${tab}`}
        aria-labelledby={`settings-tab-${tab}`}
        tabIndex={0}
        className="pt-6 focus:outline-none"
      >
        {tab === "general" && <GeneralPanel workspace={workspace} organization={organization} />}
        {tab === "organization" && <OrganizationPanel organization={organization} people={people} />}
        {tab === "roles" && <RolesPanel roles={roles} permissions={permissions} people={people} />}
        {tab === "security" && <SecurityPanel controls={securityControls} />}
        {tab === "billing" && <BillingPanel workspace={workspace} seatsUsed={people.length} seatsIncluded={seatsIncluded} />}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * General
 * ------------------------------------------------------------------------- */

function PhaseNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs text-slate-500">
      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </p>
  );
}

function GeneralPanel({ workspace, organization }: { workspace: Workspace; organization: OrganizationProfile }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader title="Workspace preferences" subtitle="Applies to everyone in this workspace" />
        <CardBody>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
              Workspace name
              <input className="field" defaultValue={workspace.name} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
              Workspace URL
              <input className="field" defaultValue="app.nexora.example/hq" readOnly aria-readonly="true" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
              Default time zone
              <select className="field appearance-none" defaultValue="America/New_York">
                <option className="bg-base-800" value="America/New_York">America/New_York (UTC−05:00)</option>
                <option className="bg-base-800" value="Europe/London">Europe/London (UTC+00:00)</option>
                <option className="bg-base-800" value="Africa/Algiers">Africa/Algiers (UTC+01:00)</option>
                <option className="bg-base-800" value="Asia/Singapore">Asia/Singapore (UTC+08:00)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
              Language
              <select className="field appearance-none" defaultValue="en-US">
                <option className="bg-base-800" value="en-US">English (United States)</option>
                <option className="bg-base-800" value="fr-FR">Français</option>
                <option className="bg-base-800" value="ar">العربية</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
              Date format
              <select className="field appearance-none" defaultValue="mdy">
                <option className="bg-base-800" value="mdy">Oct 30, 2026</option>
                <option className="bg-base-800" value="dmy">30 Oct 2026</option>
                <option className="bg-base-800" value="iso">2026-10-30</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
              Fiscal year starts
              <input className="field" defaultValue={organization.fiscalYearStart} />
            </label>
            <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <PhaseNote>Saving workspace settings arrives with Supabase in Phase 2.</PhaseNote>
              <button type="submit" className="btn btn-primary" disabled>
                Save changes
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Notifications" subtitle="Local preview — not delivered yet" />
          <CardBody>
            <PreferenceToggles />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Appearance" subtitle="Theme" />
          <CardBody>
            <div className="flex items-center justify-between rounded-xl border border-violet/30 bg-violet/[0.06] px-4 py-3">
              <div className="flex items-center gap-3">
                <Palette className="h-4 w-4 text-violet-300" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-slate-100">Dark · Enterprise</p>
                  <p className="text-xs text-slate-400">Deep navy with royal violet</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-5 w-5 rounded-full bg-base-900 ring-1 ring-white/15" />
                <span className="h-5 w-5 rounded-full bg-base-700 ring-1 ring-white/15" />
                <span className="h-5 w-5 rounded-full bg-violet ring-1 ring-white/15" />
              </span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Organization
 * ------------------------------------------------------------------------- */

function OrganizationPanel({ organization, people }: { organization: OrganizationProfile; people: Person[] }) {
  const fields: [string, string][] = [
    ["Legal name", organization.legalName],
    ["Display name", organization.displayName],
    ["Industry", organization.industry],
    ["Company size", organization.size],
    ["Headquarters", organization.headquarters],
    ["Website", organization.website],
    ["Fiscal year start", organization.fiscalYearStart],
    ["Time zone", organization.timezone],
    ["Locale", organization.locale],
    ["Reporting currency", organization.currency],
  ];

  const departments = DEPARTMENT_ORDER.map((department) => {
    const members = people.filter((p) => p.department === department);
    const available = members.filter((p) => p.status !== "on-leave");
    const lead =
      members.find((p) => p.accessRole === "owner" || p.accessRole === "admin") ??
      members.find((p) => p.accessRole === "manager") ??
      members[0];
    const avg = available.length ? Math.round(available.reduce((s, p) => s + p.workload, 0) / available.length) : 0;
    return { department, members, lead, avg };
  }).filter((d) => d.members.length > 0);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-2">
        <CardHeader title="Organization details" subtitle="Legal and regional profile" />
        <CardBody>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-hairline bg-white/[0.02] px-4 py-3">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader title="Departments" subtitle="Derived from the team directory" />
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th scope="col" className="pb-3 pr-4">Department</th>
                <th scope="col" className="pb-3 pr-4">Lead</th>
                <th scope="col" className="pb-3 pr-4 text-right">Headcount</th>
                <th scope="col" className="w-40 pb-3">Avg workload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {departments.map(({ department, members, lead, avg }) => (
                <tr key={department}>
                  <th scope="row" className="py-3 pr-4 text-left font-medium text-slate-100">{department}</th>
                  <td className="py-3 pr-4">
                    {lead && (
                      <span className="flex items-center gap-2">
                        <Avatar person={lead} size="xs" />
                        <span className="whitespace-nowrap text-slate-300">{lead.name}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-300">{members.length}</td>
                  <td className="py-3">
                    <ProgressBar
                      value={avg}
                      tone={avg >= 90 ? "rose" : avg >= 75 ? "amber" : "emerald"}
                      showLabel
                      label={`${department} average workload`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Roles & access
 * ------------------------------------------------------------------------- */

function RolesPanel({
  roles,
  permissions,
  people,
}: {
  roles: RoleDefinition[];
  permissions: PermissionRow[];
  people: Person[];
}) {
  const initial = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p.accessRole])), [people]);
  const [assignments, setAssignments] = useState<Record<string, AccessRole>>(initial);
  const changed = people.filter((p) => assignments[p.id] !== p.accessRole).length;

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {roles.map((role) => {
          const members = people.filter((p) => assignments[p.id] === role.id);
          return (
            <li key={role.id} className="glass flex flex-col p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">{role.label}</p>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs tabular-nums text-slate-300">
                  {members.length}
                </span>
              </div>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-400">{role.description}</p>
              <div className="mt-3 flex -space-x-2">
                {members.slice(0, 5).map((p) => (
                  <Avatar key={p.id} person={p} size="xs" className="ring-2 ring-base-900" />
                ))}
                {members.length === 0 && <span className="text-xs text-slate-600">No members</span>}
              </div>
            </li>
          );
        })}
      </ul>

      <Card>
        <CardHeader title="Permission matrix" subtitle="Module access by role (preview — enforced in Phase 2)" />
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th scope="col" className="pb-3 pr-4">Module</th>
                {ACCESS_ROLE_ORDER.map((r) => (
                  <th key={r} scope="col" className="px-2 pb-3 text-center">
                    {ACCESS_ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {permissions.map((row) => (
                <tr key={row.module}>
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium text-slate-200">{row.module}</th>
                  {ACCESS_ROLE_ORDER.map((r) => {
                    const level = row.levels[r];
                    return (
                      <td key={r} className="px-2 py-2.5 text-center">
                        {level === "none" ? (
                          <span className="text-xs text-slate-600">—<span className="sr-only">No access</span></span>
                        ) : (
                          <Badge tone={PERMISSION_TONE[level]}>{PERMISSION_LABEL[level]}</Badge>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Members & roles"
          subtitle="Role changes here are a local preview and are not saved"
          action={
            <button type="button" className="btn btn-secondary" disabled title="Invitations arrive in Phase 2">
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" /> Invite member
            </button>
          }
        />
        {changed > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-status-amber/[0.06] px-5 py-3 text-xs text-amber-200">
            <span>
              {changed} unsaved role {changed === 1 ? "change" : "changes"} — role management is saved in Phase 2.
            </span>
            <button type="button" className="btn btn-secondary" onClick={() => setAssignments(initial)}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
            </button>
          </div>
        )}
        <ul className="divide-y divide-white/5">
          {people.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar person={p} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {p.title} · {p.email}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <span className="sr-only">Role for {p.name}</span>
                <select
                  className="field w-full appearance-none sm:w-36"
                  value={assignments[p.id]}
                  disabled={p.accessRole === "owner"}
                  onChange={(event) =>
                    setAssignments((current) => ({ ...current, [p.id]: event.target.value as AccessRole }))
                  }
                >
                  {ACCESS_ROLE_ORDER.filter((r) => r !== "owner" || p.accessRole === "owner").map((r) => (
                    <option key={r} value={r} className="bg-base-800">
                      {ACCESS_ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Security (placeholder)
 * ------------------------------------------------------------------------- */

function SecurityPanel({ controls }: { controls: SecurityControl[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-hairline bg-white/[0.02] p-4 text-sm text-slate-300">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
        <p>
          Security controls are placeholders in Phase 1. No credentials, API keys, or secrets are stored in this build;
          authentication and policies arrive with Supabase Auth in Phase 2.
        </p>
      </div>
      <Card>
        <CardHeader title="Security controls" subtitle="Planned capabilities" />
        <ul className="divide-y divide-white/5">
          {controls.map((control) => (
            <li key={control.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-100">
                  {control.label}
                  <Badge tone={control.phase === "Phase 2" ? "violet" : "slate"}>{control.phase}</Badge>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{control.description}</p>
              </div>
              <Switch checked={false} disabled label={`${control.label} (not available yet)`} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Billing (placeholder — Stripe intentionally not configured)
 * ------------------------------------------------------------------------- */

function BillingPanel({
  workspace,
  seatsUsed,
  seatsIncluded,
}: {
  workspace: Workspace;
  seatsUsed: number;
  seatsIncluded: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-status-amber/25 bg-status-amber/[0.06] p-4 text-sm text-amber-100">
        <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
        <p>
          Billing is not connected in Phase 1. No payment provider is configured and no payment details can be entered.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Plan" subtitle="Demo subscription" action={<Badge tone="violet">{workspace.plan}</Badge>} />
          <CardBody className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                <span>Seats used</span>
                <span className="tabular-nums text-slate-200">
                  {seatsUsed} of {seatsIncluded}
                </span>
              </div>
              <ProgressBar value={percent(seatsUsed, seatsIncluded)} label="Seats used" />
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["Billing cycle", "Not configured"],
                ["Next invoice", "—"],
                ["Billing contact", "Not set"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-hairline bg-white/[0.02] px-4 py-3">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-300">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-secondary" disabled>
                Change plan
              </button>
              <button type="button" className="btn btn-secondary" disabled>
                Manage seats
              </button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Payment method" />
          <CardBody>
            <p className="text-sm text-slate-400">No payment method on file.</p>
            <button type="button" className="btn btn-secondary mt-4" disabled>
              Add payment method
            </button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Invoices" />
        <CardBody>
          <EmptyState icon={FileText} title="No invoices yet" description="Invoices appear here once billing is connected." />
        </CardBody>
      </Card>
    </div>
  );
}
