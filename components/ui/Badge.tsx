import { Eye, FlaskConical, OctagonAlert, ShieldCheck, type LucideIcon } from "lucide-react";
import {
  APPROVAL_STATUS_LABEL,
  DEPARTMENT_HEALTH_LABEL,
  HEALTH_LABEL,
  PRESENCE_LABEL,
  PRIORITY_LABEL,
  SEVERITY_LABEL,
  TASK_STATUS_LABEL,
  URGENCY_LABEL,
} from "@/lib/labels";
import type {
  ApprovalStatus,
  ApprovalUrgency,
  DepartmentHealthStatus,
  Health,
  PresenceStatus,
  Priority,
  Severity,
  TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export type Tone = "emerald" | "amber" | "rose" | "violet" | "sky" | "slate";

const TONE: Record<Tone, string> = {
  emerald: "bg-status-emerald/10 text-emerald-300 ring-status-emerald/25",
  amber: "bg-status-amber/10 text-amber-300 ring-status-amber/25",
  rose: "bg-status-rose/10 text-rose-300 ring-status-rose/25",
  violet: "bg-violet/15 text-violet-200 ring-violet/30",
  sky: "bg-status-sky/10 text-sky-300 ring-status-sky/25",
  slate: "bg-white/5 text-slate-300 ring-white/10",
};

export function Badge({
  children,
  tone = "slate",
  className,
  dot = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Marks content as static demonstration material. */
export function DemoBadge({ label = "Static demo preview" }: { label?: string }) {
  return (
    <Badge tone="violet">
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export const HEALTH_TONE: Record<Health, Tone> = {
  "on-track": "emerald",
  "at-risk": "amber",
  delayed: "rose",
};

export function HealthBadge({ health }: { health: Health }) {
  return (
    <Badge tone={HEALTH_TONE[health]} dot>
      {HEALTH_LABEL[health]}
    </Badge>
  );
}

const PRIORITY_TONE: Record<Priority, Tone> = {
  critical: "rose",
  high: "amber",
  medium: "sky",
  low: "slate",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}

const SEVERITY_TONE: Record<Severity, Tone> = { high: "rose", medium: "amber", low: "slate" };

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge tone={SEVERITY_TONE[severity]}>{SEVERITY_LABEL[severity]}</Badge>;
}

const TASK_TONE: Record<TaskStatus, Tone> = {
  todo: "slate",
  "in-progress": "violet",
  "in-review": "sky",
  blocked: "rose",
  done: "emerald",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={TASK_TONE[status]}>{TASK_STATUS_LABEL[status]}</Badge>;
}

const APPROVAL_TONE: Record<ApprovalStatus, Tone> = {
  pending: "amber",
  "in-review": "sky",
  "changes-requested": "violet",
  approved: "emerald",
  rejected: "rose",
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <Badge tone={APPROVAL_TONE[status]} dot>
      {APPROVAL_STATUS_LABEL[status]}
    </Badge>
  );
}

const URGENCY_TONE: Record<ApprovalUrgency, Tone> = {
  overdue: "rose",
  "due-today": "rose",
  "due-soon": "amber",
  "on-schedule": "slate",
};

export function UrgencyBadge({ urgency }: { urgency: ApprovalUrgency }) {
  return (
    <Badge tone={URGENCY_TONE[urgency]} dot={urgency !== "on-schedule"}>
      {URGENCY_LABEL[urgency]}
    </Badge>
  );
}

const PRESENCE_TONE: Record<PresenceStatus, Tone> = {
  active: "emerald",
  away: "amber",
  offline: "slate",
  "on-leave": "sky",
};

export function PresenceBadge({ status }: { status: PresenceStatus }) {
  return (
    <Badge tone={PRESENCE_TONE[status]} dot>
      {PRESENCE_LABEL[status]}
    </Badge>
  );
}

const DEPT_HEALTH: Record<DepartmentHealthStatus, { tone: Tone; icon: LucideIcon }> = {
  healthy: { tone: "emerald", icon: ShieldCheck },
  watch: { tone: "amber", icon: Eye },
  critical: { tone: "rose", icon: OctagonAlert },
};

/** Status color always ships with an icon and a label, never color alone. */
export function DepartmentHealthBadge({ status }: { status: DepartmentHealthStatus }) {
  const { tone, icon: Icon } = DEPT_HEALTH[status];
  return (
    <Badge tone={tone}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {DEPARTMENT_HEALTH_LABEL[status]}
    </Badge>
  );
}

export const PRESENCE_DOT: Record<PresenceStatus, string> = {
  active: "bg-status-emerald",
  away: "bg-status-amber",
  offline: "bg-slate-500",
  "on-leave": "bg-status-sky",
};
