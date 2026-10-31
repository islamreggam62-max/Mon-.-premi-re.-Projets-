"use client";

import { useState } from "react";
import { Database, Plug, Bell, Palette, UserCog, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Workspace and account configuration. Saving is disabled in Phase 1 — these controls are for layout and interaction only."
        showDemoTag
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-info/25 bg-info/5 px-4 py-3 text-sm text-info">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Form fields and toggles below are not persisted. Account, workspace
          and integration data will be wired up when Supabase is connected.
        </p>
      </div>

      {/* Profile */}
      <Card sheen>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-violet-300" /> Profile
            </span>
          }
          subtitle="How you appear across the workspace"
        />
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar initials="AH" size="lg" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Amelia Hart
              </p>
              <p className="text-xs text-subtle">Demo account · Executive</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" disabled>
              Change photo
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" value="Amelia Hart" />
            <Field label="Role" value="Chief Operating Officer" />
            <Field label="Email" value="amelia.hart@demo.nexora.app" />
            <Field label="Timezone" value="UTC+01:00 — Algiers" />
          </div>
        </CardBody>
      </Card>

      {/* Appearance */}
      <Card sheen>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-violet-300" /> Appearance
            </span>
          }
          subtitle="Theme and brand identity"
        />
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-2/40 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-subtle">
                NEXORA ships with a dark navy &amp; violet identity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-navy-900 ring-1 ring-border-strong" />
              <span className="h-6 w-6 rounded-full bg-brand-gradient ring-1 ring-white/10" />
              <Badge tone="brand">Active</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Notifications */}
      <NotificationsCard />

      {/* Integrations */}
      <Card sheen>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-violet-300" /> Integrations
            </span>
          }
          subtitle="Data sources and services"
        />
        <CardBody className="space-y-3">
          <IntegrationRow
            icon={<Database className="h-4 w-4" />}
            name="Supabase"
            desc="Database, auth & storage — planned for Phase 2"
            status="Not connected"
          />
          <IntegrationRow
            icon={<Plug className="h-4 w-4" />}
            name="Billing (Stripe)"
            desc="Deferred — not configured in Phase 1"
            status="Not connected"
          />
        </CardBody>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-subtle">
        {label}
      </span>
      <input
        defaultValue={value}
        disabled
        className="h-10 w-full cursor-not-allowed rounded-xl border border-border bg-surface-2/50 px-3 text-sm text-foreground"
      />
    </label>
  );
}

function IntegrationRow({
  icon,
  name,
  desc,
  status,
}: {
  icon: React.ReactNode;
  name: string;
  desc: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-2/40 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-subtle">{desc}</p>
      </div>
      <Badge tone="neutral" dot>
        {status}
      </Badge>
    </div>
  );
}

function NotificationsCard() {
  const [prefs, setPrefs] = useState({
    daily: true,
    approvals: true,
    mentions: false,
    weekly: true,
  });

  const rows: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "daily", label: "Daily report digest", desc: "Summary of team updates each evening" },
    { key: "approvals", label: "Approval requests", desc: "When a decision needs your attention" },
    { key: "mentions", label: "Mentions", desc: "When someone @mentions you" },
    { key: "weekly", label: "Weekly executive brief", desc: "Monday morning portfolio overview" },
  ];

  return (
    <Card sheen>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-violet-300" /> Notifications
          </span>
        }
        subtitle="Local preview — choices are not saved"
      />
      <CardBody className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-surface-2/40 p-4"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{r.label}</p>
              <p className="text-xs text-subtle">{r.desc}</p>
            </div>
            <Toggle
              on={prefs[r.key]}
              onChange={() =>
                setPrefs((p) => ({ ...p, [r.key]: !p[r.key] }))
              }
              label={r.label}
            />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "nx-focus relative h-6 w-11 shrink-0 rounded-full transition",
        on ? "bg-brand-gradient" : "bg-surface-2 ring-1 ring-border-strong"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
