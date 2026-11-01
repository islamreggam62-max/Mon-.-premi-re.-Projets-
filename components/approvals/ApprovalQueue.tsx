"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ApprovalStatusBadge, Badge, PriorityBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { person } from "@/lib/data/team";
import type { Approval, ApprovalKind, ApprovalStatus } from "@/lib/types";
import { cn, formatCurrency, formatDate, relativeDay } from "@/lib/utils";

const TODAY = new Date("2026-11-01");

const KIND_LABEL: Record<ApprovalKind, string> = {
  budget: "Budget",
  hiring: "Hiring",
  exception: "Exception",
  procurement: "Procurement",
  policy: "Policy",
};

export function ApprovalQueue({ initial }: { initial: Approval[] }) {
  // Client-side only: decisions live in component state, never persisted.
  const [overrides, setOverrides] = useState<Record<string, ApprovalStatus>>({});

  const items = useMemo(
    () => initial.map((a) => ({ ...a, status: overrides[a.id] ?? a.status })),
    [initial, overrides],
  );

  const pending = items.filter((a) => a.status === "pending");
  const decided = items.filter((a) => a.status !== "pending");

  function decide(id: string, status: ApprovalStatus) {
    setOverrides((prev) => ({ ...prev, [id]: status }));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader
            title="Pending sign-off"
            subtitle="Decisions awaiting an executive"
            action={<Badge tone="amber">{pending.length} pending</Badge>}
          />
          <CardBody className="space-y-3">
            {pending.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                Queue is clear — nothing awaiting sign-off.
              </p>
            )}
            {pending.map((a) => {
              const requester = person(a.requestedById);
              const due = new Date(a.dueBy);
              const urgent = due <= new Date("2026-11-05");
              return (
                <div
                  key={a.id}
                  className="rounded-xl border border-hairline bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="violet">{KIND_LABEL[a.kind]}</Badge>
                        <PriorityBadge priority={a.priority} />
                        {a.amount !== undefined && (
                          <span className="text-sm font-semibold text-slate-100">
                            {formatCurrency(a.amount)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-100">
                        {a.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">{a.summary}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {requester && <Avatar person={requester} size="sm" />}
                      <span>{requester?.name}</span>
                      <span className="text-slate-600">·</span>
                      <span className={cn(urgent && "text-status-amber")}>
                        Due {relativeDay(a.dueBy, TODAY)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decide(a.id, "rejected")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-status-rose/40 hover:text-status-rose"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => decide(a.id, "approved")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet to-violet-soft px-3 py-1.5 text-xs font-semibold text-white shadow-glow hover:opacity-90"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <div>
        <Card className="h-full">
          <CardHeader title="Recent decisions" subtitle="This cycle" />
          <CardBody className="space-y-3">
            {decided.map((a) => {
              const requester = person(a.requestedById);
              return (
                <div
                  key={a.id}
                  className="rounded-xl border border-hairline bg-white/[0.02] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="slate">{KIND_LABEL[a.kind]}</Badge>
                    <ApprovalStatusBadge status={a.status} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-100">{a.title}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    {requester && <Avatar person={requester} size="sm" />}
                    <span>{requester?.name}</span>
                    <span className="text-slate-600">·</span>
                    <span>{formatDate(a.submitted)}</span>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
