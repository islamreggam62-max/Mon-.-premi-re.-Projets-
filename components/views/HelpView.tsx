"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BrainCircuit,
  Building2,
  ClipboardList,
  FlaskConical,
  FolderKanban,
  History,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldCheck,
  Smartphone,
  Stamp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { APP_HOME } from "@/lib/basePath";
import { t } from "@/lib/i18n/core";

/**
 * The user guide. It renders even before any data exists (ConnectedShell shows
 * it without the app shell then), so it uses no device data. Texts are built at
 * render so they follow the interface language.
 */
export function HelpView() {
  const START: { icon: LucideIcon; title: string; body: string }[] = [
    {
      icon: Building2,
      title: t("Set up my company"),
      body: t("Enter your company's name, its currency, and your own name. You start empty and add your team, projects, and the rest."),
    },
    {
      icon: FlaskConical,
      title: t("Explore with sample data"),
      body: t("A fictional company of 12 people, to try every screen. You can set up your own company later from Settings; it replaces the sample."),
    },
    {
      icon: History,
      title: t("Restore from a backup"),
      body: t("Bring back the data you saved from Settings, for example on a new phone."),
    },
  ];

  const MODULES: { icon: LucideIcon; href: string; label: string; body: string }[] = [
    { icon: LayoutDashboard, href: APP_HOME, label: t("Dashboard"), body: t("Today at a glance: what is overdue or blocked, decisions waiting, project health, and department workload.") },
    { icon: Users, href: "/team", label: t("Team"), body: t("Your people with their title, department, role, workload, and whether they file a daily report.") },
    { icon: FolderKanban, href: "/projects", label: t("Projects"), body: t("Each initiative with an owner, target date, budget, milestones, and a health status: On Track, At Risk, or Delayed.") },
    { icon: ListChecks, href: "/tasks", label: t("Tasks"), body: t("Who does what, by when, and how urgent. Change a task's status straight from the list.") },
    { icon: ClipboardList, href: "/daily-reports", label: t("Daily Reports"), body: t("Each person's end-of-day update: completed work, priorities, and blockers, with submission tracking.") },
    { icon: Stamp, href: "/approvals", label: t("Approvals"), body: t("Budgets, contracts, hires, and exceptions waiting on a decision. Approve or reject, most urgent first.") },
    { icon: BrainCircuit, href: "/ai-intelligence", label: t("AI Intelligence"), body: t("Not connected to an AI model yet. The sample company shows a preview of the layout.") },
    { icon: Settings, href: "/settings", label: t("Settings"), body: t("Your company profile, roles, and your data: back up, restore, or erase.") },
  ];

  const DAY: { title: string; body: string; href: string; action: string }[] = [
    { title: t("Set up once"), body: t("Add your team, then your projects with an owner and a target date."), href: "/team", action: t("Team → Add member") },
    { title: t("Hand out the work"), body: t("Create tasks, assign them, and give each a priority and a due date."), href: "/tasks", action: t("Tasks → New task") },
    {
      title: t("Record the day"),
      body: t("At the end of the day, people send you their update by phone or chat. Record it for them: they do not need an account."),
      href: "/daily-reports",
      action: t("Daily Reports → Add report"),
    },
    { title: t("Decide"), body: t("Log each request that needs your decision, then approve or reject it."), href: "/approvals", action: t("Approvals → New request") },
    {
      title: t("Check every morning"),
      body: t("Open the Dashboard and its “Needs attention today” card, or the bell at the top: overdue approvals, high blockers, delayed projects."),
      href: APP_HOME,
      action: t("Dashboard"),
    },
  ];

  const RULES = [
    t("One daily report per person per day. To change it, edit the existing report."),
    t("The approver must be someone other than the requester, and an owner, admin, or manager."),
    t("A person or project still linked to tasks, approvals, or reports cannot be deleted. Reassign or delete those first."),
    t("You cannot remove yourself."),
  ];

  const LIMITS = [
    t("One device: what you enter on your phone does not appear on a computer, and your team cannot sign in with their own accounts yet."),
    t("Roles do not lock anything on this device: whoever opens NEXORA here can see and edit everything. Protect the phone with a screen lock."),
    t("No AI model is connected, and nothing is sent anywhere."),
    t("Storage holds a few megabytes, years of reports for a small company. NEXORA warns you if a change cannot be saved."),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="How NEXORA works"
        subtitle="Run your company's projects, tasks, daily reports, and approvals from one place. Everything is saved on this device."
      />

      <div
        role="note"
        className="mb-6 flex items-start gap-3 rounded-2xl border border-status-amber/30 bg-status-amber/[0.08] p-4 text-sm text-amber-100"
      >
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
        <p>
          <strong className="font-semibold">{t("Your data lives only on this device.")}</strong>{" "}
          {t("No account, no server, and it works offline. Uninstalling the app or clearing its storage erases it, so make a backup every week (see step 5).")}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="1. Getting started" subtitle="The first screen offers three choices" />
          <CardBody>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {START.map(({ icon: Icon, title, body }) => (
                <li key={title} className="rounded-xl border border-hairline bg-white/[0.02] p-4">
                  <Icon className="h-5 w-5 text-violet-300" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-slate-50">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{body}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="2. The modules" subtitle="Open them from the menu (☰ on a phone)" />
          <ul className="divide-y divide-white/10">
            {MODULES.map(({ icon: Icon, href, label, body }) => (
              <li key={label} className="flex gap-3 px-5 py-3.5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" aria-hidden="true" />
                <div className="min-w-0">
                  <Link href={href} className="focus-ring rounded text-sm font-semibold text-slate-50 hover:text-violet-200">
                    {label}
                  </Link>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline px-5 py-3 text-xs text-slate-400">
            {t("To change anything, tap Edit on it, or tap a task's title.")}
          </p>
        </Card>

        <Card>
          <CardHeader title="3. A typical day" subtitle="How an executive uses NEXORA" />
          <CardBody>
            <ol className="space-y-4">
              {DAY.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet/15 text-sm font-semibold text-violet-200 ring-1 ring-inset ring-violet/30">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-50">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{step.body}</p>
                    <Link href={step.href} className="focus-ring mt-1 inline-block rounded text-xs font-semibold text-violet-300 hover:text-violet-200">
                      {step.action}
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="4. Rules NEXORA checks for you" />
          <CardBody>
            <ul className="space-y-2">
              {RULES.map((rule) => (
                <li key={rule} className="flex gap-2 text-sm leading-relaxed text-slate-200">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-soft" aria-hidden="true" />
                  {rule}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card id="backup" className="scroll-mt-24">
          <CardHeader title="5. Back up your data" subtitle="Once a week, and before changing phones" />
          <CardBody>
            <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-slate-200">
              <li>
                <Link href="/settings#data" className="font-semibold text-violet-300 hover:text-violet-200">
                  {t("Open Settings → Your data.")}
                </Link>
              </li>
              <li>
                {t("In the Android app, tap Share backup file and send it to Google Drive, your email, or Files. On a computer, tap Download backup file. Copy backup as text works everywhere.")}
              </li>
              <li>
                {t("To restore it, use Restore in the same section, or Restore from a backup on the first screen of a new phone.")}
              </li>
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="6. On an Android phone" />
          <CardBody className="space-y-2 text-sm leading-relaxed text-slate-200">
            <p className="flex gap-2">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
              {t("The Back button closes the open form, menu, or panel first, then goes back a page. On the first page it sends NEXORA to the background without closing it.")}
            </p>
            <p className="flex gap-2">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
              {t("Alerts appear under the bell inside the app. NEXORA does not send phone notifications.")}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="7. What this version does not do yet" />
          <CardBody>
            <ul className="space-y-2">
              {LIMITS.map((limit) => (
                <li key={limit} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
                  {limit}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Link href={APP_HOME} className="btn btn-secondary px-4 py-2 text-sm">
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {t("Back to NEXORA")}
        </Link>
        <Link href="/privacy" className="text-slate-300 underline-offset-4 hover:text-slate-50 hover:underline">
          {t("Privacy policy")}
        </Link>
        <Link href="/terms" className="text-slate-300 underline-offset-4 hover:text-slate-50 hover:underline">
          {t("Terms of use")}
        </Link>
      </div>
    </div>
  );
}
