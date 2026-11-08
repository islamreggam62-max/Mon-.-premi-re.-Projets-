"use client";

import { t, tn } from "@/lib/i18n/core";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  Info,
  FileSignature,
  MessageSquareWarning,
  Pencil,
  RotateCcw,
  Shuffle,
  Stamp,
  UserPlus,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ApprovalStatusBadge, Badge, UrgencyBadge } from "@/components/ui/Badge";
import { ToggleChip } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import {
  APPROVAL_KIND_LABEL,
  APPROVAL_KIND_ORDER,
  APPROVAL_STATUS_LABEL,
  APPROVAL_STATUS_ORDER,
} from "@/lib/labels";
import { approvalUrgency, indexById, isOpenApproval, sortOpenApprovals } from "@/lib/metrics";
import type { Approval, ApprovalKind, ApprovalStatus, Person, Project } from "@/lib/types";
import { cn, dueLabel, formatCompactCurrency, formatCurrency, formatDate } from "@/lib/utils";

type StateFilter = "open" | ApprovalStatus | "all";
type KindFilter = "all" | ApprovalKind;

const KIND_ICON: Record<ApprovalKind, LucideIcon> = {
  budget: Wallet,
  contract: FileSignature,
  hiring: UserPlus,
  exception: Shuffle,
};

/** What the amount means for each request type. */
const AMOUNT_LABEL: Record<ApprovalKind, string> = {
  budget: "Requested budget",
  contract: "Contract value",
  hiring: "",
  exception: "Exposure",
};

/** A decision taken in this tab. Lives in React state only — never persisted. */
interface LocalDecision {
  status: ApprovalStatus;
  decidedAt?: string;
  decisionNote?: string;
}

const LOCAL_NOTE: Partial<Record<ApprovalStatus, string>> = {
  approved: "Approved from the executive queue in this demo session.",
  rejected: "Rejected from the executive queue in this demo session.",
  "changes-requested": "Changes requested from the executive queue in this demo session.",
};

export function ApprovalQueue({
  approvals,
  people,
  projects,
  asOf,
  onDecide,
  onEdit,
}: {
  approvals: Approval[];
  people: Person[];
  projects: Project[];
  asOf: string;
  /** When given, decisions are saved by the caller instead of living in this tab only. */
  onDecide?: (approval: Approval, status: ApprovalStatus) => void;
  /** When given, open requests have an Edit button. */
  onEdit?: (approval: Approval) => void;
}) {
  const [decisions, setDecisions] = useState<Record<string, LocalDecision>>({});
  /** Saved decisions taken on this screen: the status to go back to on Undo. */
  const [undoTo, setUndoTo] = useState<Record<string, ApprovalStatus>>({});
  const [stateFilter, setStateFilter] = useState<StateFilter>("open");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [announcement, setAnnouncement] = useState("");

  const peopleById = useMemo(() => indexById(people), [people]);
  const projectsById = useMemo(() => indexById(projects), [projects]);

  const items = useMemo(
    () => approvals.map((a) => (decisions[a.id] ? { ...a, ...decisions[a.id] } : a)),
    [approvals, decisions],
  );

  const ofKind = items.filter((a) => kindFilter === "all" || a.kind === kindFilter);
  const open = items.filter((a) => isOpenApproval(a.status));

  const stats = {
    open: open.length,
    overdue: open.filter((a) => approvalUrgency(a.dueBy, asOf) === "overdue").length,
    dueSoon: open.filter((a) => {
      const u = approvalUrgency(a.dueBy, asOf);
      return u === "due-today" || u === "due-soon";
    }).length,
    value: open.reduce((sum, a) => sum + (a.amount ?? 0), 0),
  };

  const tabs = [
    { id: "open" as StateFilter, label: t("Open"), count: ofKind.filter((a) => isOpenApproval(a.status)).length },
    ...APPROVAL_STATUS_ORDER.map((s) => ({
      id: s as StateFilter,
      label: APPROVAL_STATUS_LABEL[s],
      count: ofKind.filter((a) => a.status === s).length,
    })),
    { id: "all" as StateFilter, label: t("All"), count: ofKind.length },
  ];

  const visible = useMemo(() => {
    const list = ofKind.filter((a) =>
      stateFilter === "all" ? true : stateFilter === "open" ? isOpenApproval(a.status) : a.status === stateFilter,
    );
    const openOnes = sortOpenApprovals(list.filter((a) => isOpenApproval(a.status)), asOf);
    const decided = list
      .filter((a) => !isOpenApproval(a.status))
      .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""));
    return [...openOnes, ...decided];
  }, [ofKind, stateFilter, asOf]);

  function decide(approval: Approval, status: ApprovalStatus) {
    if (onDecide) {
      setUndoTo((prev) => (approval.id in prev ? prev : { ...prev, [approval.id]: approval.status }));
      onDecide(approval, status);
      setAnnouncement(`${APPROVAL_STATUS_LABEL[status]}: ${approval.title}`);
      return;
    }
    setDecisions((prev) => ({
      ...prev,
      [approval.id]: {
        status,
        decidedAt: status === "approved" || status === "rejected" ? asOf : undefined,
        decisionNote: LOCAL_NOTE[status],
      },
    }));
    setAnnouncement(`${APPROVAL_STATUS_LABEL[status]}: ${approval.title}`);
  }

  function undo(approval: Approval) {
    if (onDecide) {
      const previous = undoTo[approval.id];
      if (previous) onDecide(approval, previous);
      setUndoTo((prev) => {
        const next = { ...prev };
        delete next[approval.id];
        return next;
      });
      setAnnouncement(t("Decision undone: {title}", { title: approval.title }));
      return;
    }
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[approval.id];
      return next;
    });
    setAnnouncement(t("Decision undone: {title}", { title: approval.title }));
  }

  return (
    <div>
      <section aria-label={t("Queue summary")} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open decisions" value={String(stats.open)} />
        <Stat label="Overdue" value={String(stats.overdue)} tone={stats.overdue ? "rose" : undefined} />
        <Stat label="Due within 3 days" value={String(stats.dueSoon)} tone={stats.dueSoon ? "amber" : undefined} />
        <Stat label="Value awaiting decision" value={formatCompactCurrency(stats.value)} />
      </section>

      <div className="mt-6 flex flex-col gap-4">
        <Tabs items={tabs} value={stateFilter} onChange={setStateFilter} ariaLabel={t("Filter by review state")} />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("Filter by request type")}>
          <ToggleChip pressed={kindFilter === "all"} onToggle={() => setKindFilter("all")}>
            {t("All types")}
          </ToggleChip>
          {APPROVAL_KIND_ORDER.map((kind) => {
            const Icon = KIND_ICON[kind];
            return (
              <ToggleChip key={kind} pressed={kindFilter === kind} onToggle={() => setKindFilter(kind)}>
                <Icon className="h-3 w-3" aria-hidden="true" />
                {APPROVAL_KIND_LABEL[kind]}
              </ToggleChip>
            );
          })}
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-hairline bg-white/[0.02] px-3 py-2 text-xs text-slate-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
        {onDecide
          ? t("Decisions are saved on this device as soon as you take them.")
          : t("Decisions update this browser tab only — nothing is sent or stored, and the queue resets on reload.")}
      </p>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="mt-5">
        {visible.length === 0 ? (
          <EmptyState icon={Stamp} title="Nothing in this view" description="Try another review state or request type." />
        ) : (
          <ul className="space-y-4">
            {visible.map((a) => {
              const Icon = KIND_ICON[a.kind];
              const requester = peopleById[a.requestedById];
              const approver = peopleById[a.approverId];
              const project = a.projectId ? projectsById[a.projectId] : undefined;
              const isOpen = isOpenApproval(a.status);
              const urgency = approvalUrgency(a.dueBy, asOf);
              const changedHere = Boolean(decisions[a.id]) || a.id in undoTo;
              return (
                <li key={a.id} className="glass p-5 motion-safe:animate-fade-in">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="violet">
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {APPROVAL_KIND_LABEL[a.kind]}
                    </Badge>
                    <ApprovalStatusBadge status={a.status} />
                    {isOpen && <UrgencyBadge urgency={urgency} />}
                    {changedHere && <Badge tone="slate">{onDecide ? t("Decided just now") : t("Changed in this session")}</Badge>}
                  </div>

                  <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 lg:max-w-2xl">
                      <h2 className="text-base font-semibold text-slate-50">{a.title}</h2>
                      {a.counterparty && (
                        <p className="mt-0.5 text-xs font-medium text-violet-200">{t("Counterparty: {name}", { name: a.counterparty })}</p>
                      )}
                      <p className="mt-1 text-sm text-slate-300">{a.summary}</p>
                    </div>
                    <div className="shrink-0 lg:text-end">
                      {a.amount !== undefined && (
                        <>
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">{t(AMOUNT_LABEL[a.kind])}</p>
                          <p className="text-xl font-semibold tabular-nums text-slate-50">{formatCurrency(a.amount)}</p>
                        </>
                      )}
                      {a.headcount !== undefined && (
                        <p className="text-xl font-semibold tabular-nums text-slate-50">{tn(a.headcount, "{n} role", "{n} roles")}</p>
                      )}
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-4">
                    <div>
                      <dt className="text-slate-400">{t("Requested by")}</dt>
                      <dd className="mt-1 flex items-center gap-1.5 text-slate-200">
                        {requester && <Avatar person={requester} size="xs" />}
                        <span className="truncate">{requester?.name}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{t("Approver")}</dt>
                      <dd className="mt-1 flex items-center gap-1.5 text-slate-200">
                        {approver && <Avatar person={approver} size="xs" />}
                        <span className="truncate">{approver?.name}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{t("Submitted")}</dt>
                      <dd className="mt-1 text-slate-200">{formatDate(a.submitted)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{isOpen ? t("Decision due") : t("Decided")}</dt>
                      <dd className="mt-1 text-slate-200">
                        {isOpen ? formatDate(a.dueBy) : a.decidedAt ? formatDate(a.decidedAt) : "—"}
                      </dd>
                      {isOpen && (
                        <dd className={cn(urgency === "overdue" || urgency === "due-today" ? "text-rose-300" : "text-slate-400")}>
                          {dueLabel(a.dueBy, asOf)}
                        </dd>
                      )}
                    </div>
                  </dl>

                  {a.decisionNote && (
                    <p
                      className={cn(
                        "mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
                        a.status === "approved" && "bg-status-emerald/[0.07] text-emerald-200",
                        a.status === "rejected" && "bg-status-rose/[0.07] text-rose-200",
                        isOpen && "bg-violet/[0.08] text-violet-200",
                      )}
                    >
                      <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {a.decisionNote}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
                    {project ? (
                      <Link
                        href={`/projects#${project.id}`}
                        className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-violet-300 hover:text-violet-200"
                      >
                        {t("{name} project", { name: project.name.split(" — ")[0] })} <ArrowRight className="h-3 w-3 rtl:-scale-x-100" aria-hidden="true" />
                      </Link>
                    ) : (
                      <span />
                    )}
                    <div className="flex flex-wrap gap-2">
                      {a.status === "pending" && (
                        <button type="button" className="btn btn-secondary" onClick={() => decide(a, "in-review")}>
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {t("Start review")}
                        </button>
                      )}
                      {a.status === "in-review" && (
                        <button type="button" className="btn btn-secondary" onClick={() => decide(a, "changes-requested")}>
                          <MessageSquareWarning className="h-3.5 w-3.5" aria-hidden="true" /> {t("Request changes")}
                        </button>
                      )}
                      {isOpen && (
                        <>
                          <button type="button" className="btn btn-danger" onClick={() => decide(a, "rejected")}>
                            <X className="h-3.5 w-3.5" aria-hidden="true" /> {t("Reject")}
                          </button>
                          <button type="button" className="btn btn-primary" onClick={() => decide(a, "approved")}>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" /> {t("Approve")}
                          </button>
                        </>
                      )}
                      {onEdit && isOpen && (
                        <button type="button" className="btn btn-secondary" onClick={() => onEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> {t("Edit")}
                        </button>
                      )}
                      {changedHere && (
                        <button type="button" className="btn btn-secondary" onClick={() => undo(a)}>
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> {t("Undo")}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "rose" | "amber" }) {
  return (
    <div className="glass p-4">
      <p className="text-xs text-slate-300">{t(label)}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "rose" ? "text-rose-300" : tone === "amber" ? "text-amber-300" : "text-slate-50",
        )}
      >
        {value}
      </p>
    </div>
  );
}
