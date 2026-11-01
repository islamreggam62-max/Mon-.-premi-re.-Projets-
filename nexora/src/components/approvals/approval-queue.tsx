"use client";

import { useState } from "react";
import { Check, CircleCheck, FlaskConical, MessageSquareWarning, ShieldAlert, X } from "lucide-react";
import { APPROVAL_CATEGORIES } from "@/types";
import type {
  ApprovalCategory,
  ApprovalDecision,
  ApprovalDetails,
  ApprovalId,
  CurrencyCode,
  DecisionOutcome,
  ISODate,
  ISODateTime,
} from "@/types";
import type { ApprovalRow, MemberRef } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { sumMoney } from "@/lib/analytics/approvals";
import { zonedDateTime } from "@/lib/dates";
import {
  describeDue,
  formatDate,
  formatMoney,
  formatPercent,
  formatTime,
  pluralize,
} from "@/lib/format";
import { APPROVAL_CATEGORY_LABELS } from "@/lib/labels";
import {
  CATEGORY_STYLES,
  DECISION_STYLES,
  PRIORITY_STYLES,
  SLA_STYLES,
} from "@/lib/presentation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button, controlClass, SelectField, ToggleGroup } from "@/components/ui/controls";
import { MiniStat } from "@/components/ui/mini-stat";
import { DemoNotice, EmptyState } from "@/components/ui/notice";

type Tab = "mine" | "pending" | "decided" | "all";
const ALL = "all";

interface LocalDecision {
  readonly status: DecisionOutcome;
  readonly comment: string;
}

/** Effective decision: a local (demo) decision overrides the recorded one. */
function effectiveStatus(row: ApprovalRow, local: LocalDecision | undefined): ApprovalDecision["status"] {
  return local?.status ?? row.request.decision.status;
}

function DetailFacts({ details, amountLabel }: { readonly details: ApprovalDetails; readonly amountLabel: string | null }) {
  const facts: { label: string; value: string }[] = [];
  if (details.category === "budget") {
    facts.push({ label: "Cost center", value: details.costCenter });
    facts.push({ label: "Approved budget", value: formatMoney(details.currentBudget, { compact: true }) });
  } else if (details.category === "hiring") {
    facts.push({ label: "Role", value: `${details.roleTitle} (${details.level})` });
    facts.push({ label: "Headcount", value: String(details.headcount) });
    facts.push({ label: "Location", value: details.location });
    facts.push({ label: "Headcount plan", value: details.inHeadcountPlan ? "In plan" : "Outside plan" });
  } else {
    facts.push({ label: "Policy", value: details.policy });
    if (details.duration) facts.push({ label: "Duration", value: details.duration });
    facts.push({ label: "Risk level", value: details.riskLevel[0]?.toUpperCase() + details.riskLevel.slice(1) });
  }
  if (amountLabel) facts.unshift({ label: details.category === "hiring" ? "Annual cost" : "Amount", value: amountLabel });
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className="text-[11px] text-ink-subtle">{fact.label}</dt>
          <dd className="text-sm break-words text-ink">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ApprovalCard({
  row,
  local,
  currentUser,
  today,
  timeZone,
  onDecide,
}: {
  readonly row: ApprovalRow;
  readonly local: LocalDecision | undefined;
  readonly currentUser: MemberRef;
  readonly today: ISODate;
  readonly timeZone: string;
  readonly onDecide: (id: ApprovalId, decision: LocalDecision) => void;
}) {
  const { request } = row;
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const status = effectiveStatus(row, local);
  const pending = status === "pending";
  const mine = request.approverId === currentUser.id;
  const category = CATEGORY_STYLES[request.details.category];
  const headingId = `approval-${request.id}`;
  const commentId = `${request.id}-comment`;
  const budgetIncrease =
    request.details.category === "budget" && request.amount && request.details.currentBudget.amount > 0
      ? (request.amount.amount / request.details.currentBudget.amount) * 100
      : null;

  const decide = (outcome: DecisionOutcome) => {
    if (outcome !== "approved" && comment.trim().length === 0) {
      setError("A reason is required to reject or to request changes.");
      return;
    }
    setError("");
    onDecide(request.id, { status: outcome, comment: comment.trim() });
  };

  const recorded = request.decision.status === "pending" ? null : request.decision;
  const decidedAt: ISODateTime | null = recorded?.decidedAt ?? null;

  return (
    <Card
      aria-labelledby={headingId}
      className={cn("p-4 sm:p-5", pending && row.sla === "overdue" && "border-bad-base/30")}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={category.tone} icon={category.icon}>
          {category.label}
        </Badge>
        <span className="font-mono text-[11px] text-ink-subtle">{request.reference}</span>
        <StatusBadge style={PRIORITY_STYLES[request.priority]} prefix="Priority" />
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          {pending && row.sla ? <StatusBadge style={SLA_STYLES[row.sla]} prefix="Deadline" /> : null}
          {!pending ? <StatusBadge style={DECISION_STYLES[status]} prefix="Decision" /> : null}
        </span>
      </div>

      <h3 id={headingId} className="mt-2.5 text-base font-semibold text-ink">
        {request.title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-ink-muted">{request.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <Avatar initials={row.requester.initials} size="xs" />
          {row.requester.name}
        </span>
        <span>{row.department}</span>
        {row.project ? <Badge tone="brand">{row.project.code}</Badge> : null}
        <span>
          Submitted {formatDate(zonedDateTime(request.submittedAt, timeZone).date, "short")} ·{" "}
          {formatTime(request.submittedAt, timeZone)}
        </span>
        <span className={cn(pending && row.sla === "overdue" && "font-medium text-bad-ink")}>
          Decision due {formatDate(request.decisionDueBy, "short")}
          {pending ? ` (${describeDue(request.decisionDueBy, today).toLowerCase()})` : ""}
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-canvas/40 p-3">
        <DetailFacts
          details={request.details}
          amountLabel={request.amount ? formatMoney(request.amount) : null}
        />
        {budgetIncrease !== null ? (
          <p className="mt-2 text-xs text-ink-subtle">
            Equivalent to {formatPercent(budgetIncrease)} of the approved budget.
          </p>
        ) : null}
      </div>

      {request.policyFlags.length > 0 ? (
        <ul className="mt-3 space-y-1.5" aria-label="Policy checks">
          {request.policyFlags.map((flag) => (
            <li key={flag} className="flex gap-2 text-xs leading-5 text-warn-ink">
              <ShieldAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              {flag}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 border-t border-line pt-4">
        {pending && mine ? (
          <div className="space-y-3">
            <div>
              <label htmlFor={commentId} className="text-xs font-medium text-ink">
                Decision note
              </label>
              <p id={`${commentId}-hint`} className="text-[11px] text-ink-subtle">
                Optional to approve; required to reject or request changes.
              </p>
              <textarea
                id={commentId}
                rows={2}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${commentId}-hint ${commentId}-error` : `${commentId}-hint`}
                className={cn(controlClass, "mt-1.5 h-auto py-2")}
              />
              {error ? (
                <p id={`${commentId}-error`} className="mt-1 text-xs text-bad-ink">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="success" size="sm" icon={Check} onClick={() => decide("approved")}>
                Approve
              </Button>
              <Button variant="secondary" size="sm" icon={MessageSquareWarning} onClick={() => decide("changes-requested")}>
                Request changes
              </Button>
              <Button variant="danger" size="sm" icon={X} onClick={() => decide("rejected")}>
                Reject
              </Button>
            </div>
          </div>
        ) : pending ? (
          <p className="flex items-center gap-2 text-xs text-ink-muted">
            <Avatar initials={row.approver.initials} size="xs" />
            Awaiting {row.approver.name} ({row.approver.title})
          </p>
        ) : local ? (
          <div className="space-y-1.5 text-xs">
            <p className="flex flex-wrap items-center gap-2 text-ink-muted">
              <Badge tone="brand" icon={FlaskConical}>
                Demo · not saved
              </Badge>
              Decided by you just now.
            </p>
            {local.comment ? <p className="text-sm text-ink">“{local.comment}”</p> : null}
          </div>
        ) : recorded && row.decidedBy ? (
          <div className="space-y-1.5 text-xs">
            <p className="flex items-center gap-2 text-ink-muted">
              <Avatar initials={row.decidedBy.initials} size="xs" />
              {row.decidedBy.name}
              {decidedAt
                ? ` · ${formatDate(zonedDateTime(decidedAt, timeZone).date)} at ${formatTime(decidedAt, timeZone)}`
                : ""}
            </p>
            {recorded.comment ? <p className="text-sm text-ink">“{recorded.comment}”</p> : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function ApprovalQueue({
  rows,
  currentUser,
  today,
  timeZone,
  currency,
}: {
  readonly rows: readonly ApprovalRow[];
  readonly currentUser: MemberRef;
  readonly today: ISODate;
  readonly timeZone: string;
  readonly currency: CurrencyCode;
}) {
  const [tab, setTab] = useState<Tab>("mine");
  const [category, setCategory] = useState<ApprovalCategory | typeof ALL>(ALL);
  const [decisions, setDecisions] = useState<ReadonlyMap<ApprovalId, LocalDecision>>(new Map());
  const [announcement, setAnnouncement] = useState("");

  const statusOf = (row: ApprovalRow) => effectiveStatus(row, decisions.get(row.request.id));
  const isPendingRow = (row: ApprovalRow) => statusOf(row) === "pending";
  const tabs: Record<Tab, (row: ApprovalRow) => boolean> = {
    mine: (row) => isPendingRow(row) && row.request.approverId === currentUser.id,
    pending: isPendingRow,
    decided: (row) => !isPendingRow(row),
    all: () => true,
  };

  const visible = rows.filter(
    (row) => tabs[tab](row) && (category === ALL || row.request.details.category === category),
  );
  const pending = rows.filter(isPendingRow);
  const mine = rows.filter(tabs.mine);
  const pendingValue = sumMoney(pending.map((row) => row.request.amount), currency);
  const mineValue = sumMoney(mine.map((row) => row.request.amount), currency);
  const late = pending.filter((row) => row.sla === "overdue").length;

  const onDecide = (id: ApprovalId, decision: LocalDecision) => {
    setDecisions((current) => new Map(current).set(id, decision));
    const row = rows.find((candidate) => candidate.request.id === id);
    setAnnouncement(
      `${row?.request.reference ?? "Request"} marked ${DECISION_STYLES[decision.status].label.toLowerCase()}. Demo mode: not saved.`,
    );
  };

  return (
    <div className="space-y-6">
      <section aria-label="Summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MiniStat label="Awaiting you" value={mine.length} context={formatMoney(mineValue.total, { compact: true })} />
        <MiniStat label="Pending overall" value={pending.length} context={formatMoney(pendingValue.total, { compact: true })} />
        <MiniStat label="Past deadline" value={late} context="Pending beyond the decision date" />
        <MiniStat label="Decided" value={rows.length - pending.length} context="Recorded decisions" />
      </section>

      <DemoNotice>
        Demo mode: decisions you record here update this page only. Nothing is sent or saved, and a page reload restores the queue.
      </DemoNotice>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup<Tab>
          label="Queue"
          value={tab}
          onChange={setTab}
          options={[
            { value: "mine", label: "Awaiting me", count: mine.length },
            { value: "pending", label: "All pending", count: pending.length },
            { value: "decided", label: "Decided", count: rows.length - pending.length },
            { value: "all", label: "All", count: rows.length },
          ]}
        />
        <SelectField
          label="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value as ApprovalCategory | typeof ALL)}
          className="w-full sm:w-48"
        >
          <option value={ALL}>All categories</option>
          {APPROVAL_CATEGORIES.map((key) => (
            <option key={key} value={key}>
              {APPROVAL_CATEGORY_LABELS[key]}
            </option>
          ))}
        </SelectField>
      </div>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title={tab === "mine" ? "Nothing awaits your decision" : "No requests in this view"}
          description={tab === "mine" ? "Every request assigned to you has a decision." : undefined}
        />
      ) : (
        <>
          <p className="text-xs text-ink-subtle">{pluralize(visible.length, "request")}, most urgent first.</p>
          <ul className="grid gap-4 2xl:grid-cols-2">
            {visible.map((row) => (
              <li key={row.request.id} className="min-w-0">
                <ApprovalCard
                  row={row}
                  local={decisions.get(row.request.id)}
                  currentUser={currentUser}
                  today={today}
                  timeZone={timeZone}
                  onDecide={onDecide}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
