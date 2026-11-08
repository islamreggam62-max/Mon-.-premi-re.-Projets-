import { DEMO_AS_OF, WORKSPACES } from "@/lib/data/meta";
import { NOTIFICATIONS } from "@/lib/data/dashboard";
import { approvalUrgency, collectBlockers, isOpenApproval } from "@/lib/metrics";
import type { AppNotification, Person, Workspace } from "@/lib/types";
import { t } from "@/lib/i18n/core";
import { formatCompactCurrency } from "@/lib/utils";
import { todayISO, type NexoraData } from "./schema";

/** Reference day for every "overdue" or "today": the sample's fixed day, or today. */
export function asOfDay(data: NexoraData): string {
  return data.mode === "sample" ? DEMO_AS_OF : todayISO();
}

export function currentUser(data: NexoraData): Person {
  return data.people.find((p) => p.id === data.currentUserId) ?? data.people[0];
}

export function workspacesFor(data: NexoraData): Workspace[] {
  if (data.mode === "sample") return WORKSPACES;
  return [{ id: "ws-device", name: data.company.name, plan: t("On this device"), region: data.company.timezone, current: true, available: true }];
}

export function openApprovalCount(data: NexoraData): number {
  return data.approvals.filter((a) => isOpenApproval(a.status)).length;
}

/**
 * Alerts for the bell. Sample: the demonstration alerts. Own company: computed
 * from the records (overdue or due approvals, today's high blockers, delayed projects).
 */
export function notificationsFor(data: NexoraData): AppNotification[] {
  if (data.mode === "sample") return NOTIFICATIONS;
  const asOf = asOfDay(data);
  const at = `${asOf}T08:00:00`;
  const list: AppNotification[] = [];
  for (const a of data.approvals) {
    if (!isOpenApproval(a.status)) continue;
    const urgency = approvalUrgency(a.dueBy, asOf);
    if (urgency === "overdue" || urgency === "due-today") {
      list.push({
        id: `n-appr-${a.id}`,
        tone: urgency === "overdue" ? "critical" : "warning",
        title: urgency === "overdue" ? t("Approval overdue") : t("Approval due today"),
        detail: `${a.title}${a.amount !== undefined ? ` (${formatCompactCurrency(a.amount)})` : ""}`,
        time: at,
        href: "/approvals",
      });
    }
  }
  for (const { blocker, report } of collectBlockers(data.reports, asOf)) {
    if (blocker.severity !== "high") continue;
    const author = data.people.find((p) => p.id === report.authorId);
    list.push({
      id: `n-block-${blocker.id}`,
      tone: "critical",
      title: t("High blocker reported"),
      detail: `${author ? `${author.name}: ` : ""}${blocker.description}`,
      time: report.submittedAt,
      href: "/daily-reports",
    });
  }
  for (const p of data.projects) {
    if (p.health !== "delayed") continue;
    list.push({ id: `n-proj-${p.id}`, tone: "warning", title: t("{name} is Delayed", { name: p.name }), detail: p.summary || t("Marked Delayed."), time: at, href: `/projects#${p.id}` });
  }
  return list;
}
