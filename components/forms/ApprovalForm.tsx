"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { FormActions, FormGrid, SelectField, TextArea, TextField } from "@/components/ui/Form";
import { APPROVAL_KIND_LABEL, APPROVAL_KIND_ORDER } from "@/lib/labels";
import { asOfDay } from "@/lib/store/derived";
import { newId } from "@/lib/store/schema";
import { useNexora } from "@/lib/store/StoreProvider";
import type { Approval, ApprovalKind } from "@/lib/types";
import { DeleteButton, parseAmount, parseWhole, peopleOptions } from "./shared";

const KIND_OPTIONS = APPROVAL_KIND_ORDER.map((k) => ({ value: k, label: APPROVAL_KIND_LABEL[k] }));
const AMOUNT_LABEL: Record<ApprovalKind, string> = {
  budget: "Requested budget",
  contract: "Contract value",
  hiring: "",
  exception: "Exposure",
};

export function ApprovalFormDialog({ open, onClose, approval }: { open: boolean; onClose: () => void; approval?: Approval }) {
  return (
    <Dialog open={open} onClose={onClose} title={approval ? "Edit request" : "New approval request"} description="Budget, contract, hiring, or exception waiting on a decision.">
      <ApprovalForm key={approval?.id ?? "new"} approval={approval} onDone={onClose} />
    </Dialog>
  );
}

function ApprovalForm({ approval, onDone }: { approval?: Approval; onDone: () => void }) {
  const { data, actions } = useNexora();
  const deciders = data.people.filter((p) => p.accessRole === "owner" || p.accessRole === "admin" || p.accessRole === "manager");
  const [title, setTitle] = useState(approval?.title ?? "");
  const [kind, setKind] = useState<ApprovalKind>(approval?.kind ?? "budget");
  const [amount, setAmount] = useState(approval?.amount !== undefined ? String(approval.amount) : "");
  const [counterparty, setCounterparty] = useState(approval?.counterparty ?? "");
  const [headcount, setHeadcount] = useState(approval?.headcount !== undefined ? String(approval.headcount) : "1");
  const [requestedById, setRequestedById] = useState(approval?.requestedById ?? data.people.find((p) => p.id !== data.currentUserId)?.id ?? data.currentUserId);
  const [approverId, setApproverId] = useState(approval?.approverId ?? data.currentUserId);
  const [projectId, setProjectId] = useState(approval?.projectId ?? "");
  const [dueBy, setDueBy] = useState(approval?.dueBy ?? "");
  const [summary, setSummary] = useState(approval?.summary ?? "");
  const [error, setError] = useState("");

  const projectOptions = [{ value: "", label: "No project" }, ...data.projects.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }))];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length < 3) return setError("Give the request a title (at least 3 characters).");
    if (approverId === requestedById) return setError("The approver must be someone other than the requester.");
    if (!dueBy) return setError("Choose the date a decision is needed by.");
    let amountValue: number | undefined;
    if (kind !== "hiring") {
      if (amount.trim()) {
        const parsed = parseAmount(amount);
        if (parsed === null) return setError("The amount is a number in digits, e.g. 1500000.");
        amountValue = parsed;
      } else if (kind === "budget" || kind === "contract") {
        return setError(`${AMOUNT_LABEL[kind]} is required for this type of request.`);
      }
    }
    if (kind === "contract" && !counterparty.trim()) return setError("Name the contract's counterparty.");
    let headcountValue: number | undefined;
    if (kind === "hiring") {
      const parsed = parseWhole(headcount, 1, 500);
      if (parsed === null) return setError("Headcount is the number of roles, from 1.");
      headcountValue = parsed;
    }
    actions.saveApproval({
      id: approval?.id ?? newId("a"),
      title: title.trim(),
      kind,
      requestedById,
      approverId,
      status: approval?.status ?? "pending",
      amount: amountValue,
      counterparty: kind === "contract" ? counterparty.trim() : undefined,
      headcount: headcountValue,
      projectId: projectId || undefined,
      submitted: approval?.submitted ?? asOfDay(data),
      dueBy,
      summary: summary.trim(),
      decidedAt: approval?.decidedAt,
      decisionNote: approval?.decisionNote,
    });
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormGrid>
        <TextField label="Request" value={title} onChange={setTitle} required className="sm:col-span-2" />
        <SelectField label="Type" value={kind} onChange={setKind} options={KIND_OPTIONS} />
        {kind === "hiring" ? (
          <TextField label="Roles to hire" value={headcount} onChange={setHeadcount} inputMode="numeric" />
        ) : (
          <TextField
            label={AMOUNT_LABEL[kind]}
            value={amount}
            onChange={setAmount}
            inputMode="numeric"
            required={kind !== "exception"}
            hint={`(${data.mode === "sample" ? "USD" : data.company.currency})`}
          />
        )}
        {kind === "contract" && <TextField label="Counterparty" value={counterparty} onChange={setCounterparty} required className="sm:col-span-2" />}
        <SelectField label="Requested by" value={requestedById} onChange={setRequestedById} options={peopleOptions(data.people)} />
        <SelectField
          label="Approver"
          value={approverId}
          onChange={setApproverId}
          options={peopleOptions(deciders.length ? deciders : data.people)}
          hint="(owner, admin, or manager)"
        />
        <SelectField label="Project" value={projectId} onChange={setProjectId} options={projectOptions} />
        <TextField label="Decision needed by" type="date" value={dueBy} onChange={setDueBy} required />
        <TextArea label="Summary" value={summary} onChange={setSummary} rows={3} className="sm:col-span-2" />
      </FormGrid>
      <FormActions
        error={error}
        onCancel={onDone}
        submitLabel={approval ? "Save changes" : "Submit request"}
        extra={
          approval && (
            <DeleteButton
              label="Delete request"
              onConfirm={() => {
                actions.removeApproval(approval.id);
                onDone();
              }}
            />
          )
        }
      />
    </form>
  );
}
