import { cn } from "@/lib/utils";
import type {
  ApprovalStatus,
  Health,
  Priority,
  TaskStatus,
} from "@/lib/types";

type Tone = "emerald" | "amber" | "rose" | "violet" | "sky" | "slate";

const TONE: Record<Tone, string> = {
  emerald: "bg-status-emerald/12 text-status-emerald ring-status-emerald/25",
  amber: "bg-status-amber/12 text-status-amber ring-status-amber/25",
  rose: "bg-status-rose/12 text-status-rose ring-status-rose/25",
  violet: "bg-violet/15 text-violet-soft ring-violet/30",
  sky: "bg-status-sky/12 text-status-sky ring-status-sky/25",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const HEALTH_TONE: Record<Health, Tone> = {
  "on-track": "emerald",
  "at-risk": "amber",
  "off-track": "rose",
};
const HEALTH_LABEL: Record<Health, string> = {
  "on-track": "On track",
  "at-risk": "At risk",
  "off-track": "Off track",
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
  return (
    <Badge tone={PRIORITY_TONE[priority]} className="capitalize">
      {priority}
    </Badge>
  );
}

const APPROVAL_TONE: Record<ApprovalStatus, Tone> = {
  pending: "amber",
  approved: "emerald",
  rejected: "rose",
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <Badge tone={APPROVAL_TONE[status]} dot className="capitalize">
      {status}
    </Badge>
  );
}

const TASK_TONE: Record<TaskStatus, Tone> = {
  backlog: "slate",
  todo: "sky",
  "in-progress": "violet",
  review: "amber",
  done: "emerald",
};
const TASK_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  "in-progress": "In progress",
  review: "Review",
  done: "Done",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={TASK_TONE[status]}>{TASK_LABEL[status]}</Badge>;
}
