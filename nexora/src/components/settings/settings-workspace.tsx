"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { CircleCheck, Plug, Save } from "lucide-react";
import { CURRENCY_CODES, NOTIFICATION_CHANNELS, ROLE_KEYS } from "@/types";
import type { NotificationChannel, NotificationRule, RoleKey } from "@/types";
import type { SettingsView } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { INTEGRATION_CATEGORY_LABELS, ROLE_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { Button, controlClass } from "@/components/ui/controls";
import { DemoNotice } from "@/components/ui/notice";
import { Switch } from "@/components/ui/switch";
import { RbacMatrix, RoleCards } from "./rbac-matrix";

const TIME_ZONES = [
  "Africa/Algiers",
  "Europe/Paris",
  "Europe/London",
  "Asia/Dubai",
  "Asia/Singapore",
  "America/New_York",
  "America/Toronto",
  "UTC",
] as const;

const LOCALES = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "ar-DZ", label: "العربية (الجزائر)" },
] as const;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  "in-app": "In-app",
  email: "Email",
  slack: "Slack",
};

const SECTIONS = [
  { id: "workspace", label: "Workspace" },
  { id: "check-ins", label: "Daily check-ins" },
  { id: "notifications", label: "Notifications" },
  { id: "access", label: "Access control" },
  { id: "security", label: "Security" },
  { id: "integrations", label: "Integrations" },
] as const;

function FormRow({
  id,
  label,
  hint,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <div>
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
        {hint ? <p className="text-[11px] text-ink-subtle">{hint}</p> : null}
      </div>
      <div className="min-w-0 sm:max-w-sm">{children}</div>
    </div>
  );
}

function SaveBar({ message }: { readonly message: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <Button type="submit" variant="primary" icon={Save}>
        Save changes
      </Button>
      <p role="status" className={cn("text-xs text-ink-muted", !message && "sr-only")}>
        {message ? (
          <span className="inline-flex items-center gap-1.5">
            <CircleCheck aria-hidden="true" className="size-3.5 text-good" />
            {message}
          </span>
        ) : null}
      </p>
    </div>
  );
}

const PREVIEW_MESSAGE = "Preview only: kept on this page until you leave, not saved.";

export function SettingsWorkspace({ view }: { readonly view: SettingsView }) {
  const [profile, setProfile] = useState({
    name: view.workspace.name,
    slug: view.workspace.slug,
    timeZone: view.workspace.timeZone,
    locale: view.workspace.locale,
    currency: view.workspace.currency,
    weekStartsOn: view.workspace.weekStartsOn,
    fiscalYearStartMonth: view.workspace.fiscalYearStartMonth,
  });
  const [policy, setPolicy] = useState({
    deadline: String(view.reportPolicy.deadline),
    reminderAt: String(view.reportPolicy.reminderAt),
    requiredRoles: new Set<RoleKey>(view.reportPolicy.requiredRoles),
    escalateAfterMissedDays: view.reportPolicy.escalateAfterMissedDays,
  });
  const [rules, setRules] = useState<readonly NotificationRule[]>(view.notificationRules);
  const [twoFactor, setTwoFactor] = useState(view.security.enforceTwoFactor);
  const [sessionHours, setSessionHours] = useState(view.security.sessionTimeoutHours);
  const [messages, setMessages] = useState<Record<string, string>>({});

  const save = (section: string) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessages((current) => ({ ...current, [section]: PREVIEW_MESSAGE }));
  };

  const updateRule = (id: NotificationRule["id"], change: Partial<Pick<NotificationRule, "enabled" | "channels">>) =>
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, ...change } : rule)));

  return (
    <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="hidden lg:block">
        <ul className="sticky top-24 space-y-0.5">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-6">
        <DemoNotice>
          Settings are a Phase 1 preview. Controls respond on this page, but nothing is saved or applied to the
          rest of the workspace.
        </DemoNotice>

        <Panel id="workspace" title="Workspace" description="Identity and regional formats for the whole workspace.">
          <form onSubmit={save("workspace")} className="space-y-4">
            <FormRow id="ws-name" label="Workspace name">
              <input
                id="ws-name"
                className={controlClass}
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              />
            </FormRow>
            <FormRow id="ws-slug" label="Workspace URL" hint="Lowercase letters, digits and hyphens.">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-ink-subtle">nexora.example/</span>
                <input
                  id="ws-slug"
                  className={controlClass}
                  value={profile.slug}
                  pattern="[a-z0-9\-]+"
                  onChange={(event) =>
                    setProfile({ ...profile, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                  }
                />
              </div>
            </FormRow>
            <FormRow id="ws-tz" label="Time zone" hint="Deadlines and timestamps use this zone.">
              <select
                id="ws-tz"
                className={controlClass}
                value={profile.timeZone}
                onChange={(event) => setProfile({ ...profile, timeZone: event.target.value })}
              >
                {TIME_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow id="ws-locale" label="Number and date format">
              <select
                id="ws-locale"
                className={controlClass}
                value={profile.locale}
                onChange={(event) => setProfile({ ...profile, locale: event.target.value })}
              >
                {LOCALES.map((locale) => (
                  <option key={locale.value} value={locale.value}>
                    {locale.label}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow id="ws-currency" label="Reporting currency">
              <select
                id="ws-currency"
                className={controlClass}
                value={profile.currency}
                onChange={(event) =>
                  setProfile({ ...profile, currency: event.target.value as (typeof CURRENCY_CODES)[number] })
                }
              >
                {CURRENCY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow id="ws-week" label="Week starts on">
              <select
                id="ws-week"
                className={controlClass}
                value={profile.weekStartsOn}
                onChange={(event) =>
                  setProfile({ ...profile, weekStartsOn: event.target.value as "monday" | "sunday" })
                }
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </FormRow>
            <FormRow id="ws-fiscal" label="Fiscal year starts in">
              <select
                id="ws-fiscal"
                className={controlClass}
                value={profile.fiscalYearStartMonth}
                onChange={(event) => setProfile({ ...profile, fiscalYearStartMonth: Number(event.target.value) })}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </FormRow>
            <SaveBar message={messages.workspace ?? ""} />
          </form>
        </Panel>

        <Panel id="check-ins" title="Daily check-ins" description="Who reports, by when, and when silence escalates.">
          <form onSubmit={save("check-ins")} className="space-y-4">
            <FormRow id="ci-deadline" label="Submission deadline" hint="Local workspace time.">
              <input
                id="ci-deadline"
                type="time"
                className={controlClass}
                value={policy.deadline}
                onChange={(event) => setPolicy({ ...policy, deadline: event.target.value })}
              />
            </FormRow>
            <FormRow id="ci-reminder" label="Reminder">
              <input
                id="ci-reminder"
                type="time"
                className={controlClass}
                value={policy.reminderAt}
                onChange={(event) => setPolicy({ ...policy, reminderAt: event.target.value })}
              />
            </FormRow>
            <fieldset>
              <legend className="sr-only">Roles required to check in</legend>
              <div className="grid gap-1.5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4">
              <p aria-hidden="true" className="text-sm text-ink">
                Required for
              </p>
              <div className="flex flex-wrap gap-2">
                {ROLE_KEYS.map((role) => {
                  const checked = policy.requiredRoles.has(role);
                  return (
                    <label
                      key={role}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                        checked ? "border-brand-soft/40 bg-brand-soft/10 text-ink" : "border-line text-ink-muted",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="size-3.5 accent-brand-soft"
                        checked={checked}
                        onChange={() =>
                          setPolicy((current) => {
                            const next = new Set(current.requiredRoles);
                            if (next.has(role)) next.delete(role);
                            else next.add(role);
                            return { ...current, requiredRoles: next };
                          })
                        }
                      />
                      {ROLE_LABELS[role]}
                    </label>
                  );
                })}
              </div>
              </div>
            </fieldset>
            <FormRow id="ci-escalate" label="Escalate after" hint="Consecutive missed check-ins.">
              <div className="flex items-center gap-2">
                <input
                  id="ci-escalate"
                  type="number"
                  min={1}
                  max={10}
                  className={cn(controlClass, "w-24")}
                  value={policy.escalateAfterMissedDays}
                  onChange={(event) =>
                    setPolicy({
                      ...policy,
                      escalateAfterMissedDays: Math.min(10, Math.max(1, Number(event.target.value) || 1)),
                    })
                  }
                />
                <span className="text-xs text-ink-subtle">days</span>
              </div>
            </FormRow>
            <SaveBar message={messages["check-ins"] ?? ""} />
          </form>
        </Panel>

        <Panel id="notifications" title="Notifications" description="What NEXORA tells executives, and where.">
          <ul className="divide-y divide-line">
            {rules.map((rule) => {
              const labelId = `${rule.id}-label`;
              const descriptionId = `${rule.id}-description`;
              return (
                <li key={rule.id} className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
                  <Switch
                    checked={rule.enabled}
                    onChange={(enabled) => updateRule(rule.id, { enabled })}
                    labelledBy={labelId}
                    describedBy={descriptionId}
                  />
                  <div className="min-w-0 flex-1">
                    <p id={labelId} className="text-sm font-medium text-ink">
                      {rule.label}
                    </p>
                    <p id={descriptionId} className="text-xs leading-5 text-ink-muted">
                      {rule.description}
                    </p>
                  </div>
                  <fieldset className="flex flex-wrap gap-1.5" disabled={!rule.enabled}>
                    <legend className="sr-only">Channels for {rule.label}</legend>
                    {NOTIFICATION_CHANNELS.map((channel) => {
                      const connected = channel !== "slack";
                      const active = rule.channels.includes(channel);
                      return (
                        <label
                          key={channel}
                          title={connected ? undefined : "Requires the Slack integration"}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]",
                            connected ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                            active ? "border-brand-soft/40 bg-brand-soft/10 text-ink" : "border-line text-ink-muted",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-3 accent-brand-soft"
                            checked={active}
                            disabled={!connected}
                            onChange={() =>
                              updateRule(rule.id, {
                                channels: active
                                  ? rule.channels.filter((item) => item !== channel)
                                  : [...rule.channels, channel],
                              })
                            }
                          />
                          {CHANNEL_LABELS[channel]}
                        </label>
                      );
                    })}
                  </fieldset>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          id="access"
          title="Access control"
          description="Role-based permissions, read-only preview. Enforcement arrives with authentication."
        >
          <div className="space-y-4">
            <RoleCards roles={view.roles} counts={view.roleCounts} />
            <RbacMatrix permissions={view.permissions} roles={view.roles} />
          </div>
        </Panel>

        <Panel id="security" title="Security" description="Authentication and session policy.">
          <form onSubmit={save("security")} className="space-y-4">
            <div className="grid gap-1.5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <div>
                <p id="sec-2fa-label" className="text-sm text-ink">
                  Require two-factor authentication
                </p>
                <p id="sec-2fa-hint" className="text-[11px] text-ink-subtle">
                  Applies to every member at next sign-in.
                </p>
              </div>
              <Switch
                checked={twoFactor}
                onChange={setTwoFactor}
                labelledBy="sec-2fa-label"
                describedBy="sec-2fa-hint"
              />
            </div>
            <FormRow id="sec-session" label="Session timeout">
              <select
                id="sec-session"
                className={controlClass}
                value={sessionHours}
                onChange={(event) => setSessionHours(Number(event.target.value))}
              >
                {[1, 4, 8, 12, 24].map((hours) => (
                  <option key={hours} value={hours}>
                    {hours} {hours === 1 ? "hour" : "hours"}
                  </option>
                ))}
              </select>
            </FormRow>
            <div className="grid gap-1.5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <p className="text-sm text-ink">Single sign-on</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">Not configured</Badge>
                <span className="text-xs text-ink-subtle">Needs an identity integration (SAML or OIDC).</span>
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <p className="text-sm text-ink">Audit log retention</p>
              <p className="text-sm text-ink-muted">{view.security.auditLogRetentionDays} days</p>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <p className="text-sm text-ink">Planned data region</p>
              <p className="text-sm text-ink-muted">{view.security.dataRegion}</p>
            </div>
            <SaveBar message={messages.security ?? ""} />
          </form>
        </Panel>

        <Panel id="integrations" title="Integrations" description="Phase 1 ships without live connectors.">
          <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {view.integrations.map((integration) => (
              <li key={integration.id} className="flex min-w-0 flex-col gap-2 rounded-lg border border-line bg-canvas/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                    <Plug aria-hidden="true" className="size-4 shrink-0 text-ink-subtle" />
                    <span className="truncate">{integration.name}</span>
                  </span>
                  <Badge tone="neutral">{INTEGRATION_CATEGORY_LABELS[integration.category]}</Badge>
                </div>
                <p className="text-xs leading-5 text-ink-muted">{integration.description}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-ink-subtle">Not connected</span>
                  <Button size="sm" disabled>
                    Connect
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
