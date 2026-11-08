"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { CheckboxField, FormActions, FormGrid, SelectField, TextField } from "@/components/ui/Form";
import { PRESENCE_LABEL } from "@/lib/labels";
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS } from "@/lib/store/options";
import { initialsOf, newId, todayISO } from "@/lib/store/schema";
import { useNexora } from "@/lib/store/StoreProvider";
import type { AccessRole, Department, Person, PresenceStatus } from "@/lib/types";
import { DeleteButton, parseWhole } from "./shared";

const PRESENCE_OPTIONS = (Object.keys(PRESENCE_LABEL) as PresenceStatus[]).map((s) => ({ value: s, label: PRESENCE_LABEL[s] }));

export function PersonFormDialog({ open, onClose, person }: { open: boolean; onClose: () => void; person?: Person }) {
  return (
    <Dialog open={open} onClose={onClose} title={person ? `Edit ${person.name}` : "Add a team member"} description="Saved on this device. People do not need an account.">
      <PersonForm key={person?.id ?? "new"} person={person} onDone={onClose} />
    </Dialog>
  );
}

function PersonForm({ person, onDone }: { person?: Person; onDone: () => void }) {
  const { data, actions } = useNexora();
  const isSelf = person?.id === data.currentUserId;
  const [name, setName] = useState(person?.name ?? "");
  const [title, setTitle] = useState(person?.title ?? "");
  const [department, setDepartment] = useState<Department>(person?.department ?? "Operations");
  const [role, setRole] = useState<AccessRole>(person?.accessRole ?? "member");
  const [email, setEmail] = useState(person?.email ?? "");
  const [location, setLocation] = useState(person?.location ?? "");
  const [workload, setWorkload] = useState(String(person?.workload ?? 50));
  const [status, setStatus] = useState<PresenceStatus>(person?.status ?? "active");
  const [reportsDaily, setReportsDaily] = useState(person?.reportsDaily ?? true);
  const [error, setError] = useState("");

  const roleOptions = isSelf ? ROLE_OPTIONS.filter((r) => r.value === role) : ROLE_OPTIONS.filter((r) => r.value !== "owner");

  const references = person
    ? [
        [data.tasks.filter((t) => t.assigneeId === person.id).length, "task"],
        [data.projects.filter((p) => p.ownerId === person.id || p.memberIds.includes(person.id)).length, "project"],
        [data.approvals.filter((a) => a.requestedById === person.id || a.approverId === person.id).length, "approval"],
        [data.reports.filter((r) => r.authorId === person.id).length, "report"],
      ].filter(([n]) => (n as number) > 0)
    : [];
  const blockedReason = isSelf
    ? "You cannot remove yourself."
    : references.length
      ? `Linked to ${references.map(([n, w]) => `${n} ${w}${n === 1 ? "" : "s"}`).join(", ")}: reassign or delete those first.`
      : undefined;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setError("Enter a name (at least 2 characters).");
    const load = parseWhole(workload, 0, 100);
    if (load === null) return setError("Workload is a whole number from 0 to 100.");
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError("Enter a valid email address, or leave it empty.");
    actions.savePerson({
      id: person?.id ?? newId("p"),
      name: name.trim(),
      initials: initialsOf(name),
      title: title.trim(),
      department,
      email: email.trim(),
      location: location.trim(),
      joined: person?.joined ?? todayISO(),
      workload: load,
      status,
      accessRole: role,
      reportsDaily,
    });
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormGrid>
        <TextField label="Name" value={name} onChange={setName} required autoComplete="name" />
        <TextField label="Title" value={title} onChange={setTitle} placeholder="Sales manager" />
        <SelectField label="Department" value={department} onChange={setDepartment} options={DEPARTMENT_OPTIONS} />
        <SelectField label="Role" value={role} onChange={setRole} options={roleOptions} />
        <TextField label="Email" type="email" value={email} onChange={setEmail} hint="(optional)" />
        <TextField label="Location" value={location} onChange={setLocation} placeholder="Algiers" hint="(optional)" />
        <TextField label="Workload %" value={workload} onChange={setWorkload} inputMode="numeric" hint="0–100" />
        <SelectField label="Status" value={status} onChange={setStatus} options={PRESENCE_OPTIONS} />
      </FormGrid>
      <div className="mt-4">
        <CheckboxField
          label="Files a daily report"
          checked={reportsDaily}
          onChange={setReportsDaily}
          hint="Counted in report submission and compliance."
        />
      </div>
      <FormActions
        error={error}
        onCancel={onDone}
        submitLabel={person ? "Save changes" : "Add member"}
        extra={
          person && (
            <DeleteButton
              label="Remove"
              blockedReason={blockedReason}
              onConfirm={() => {
                actions.removePerson(person.id);
                onDone();
              }}
            />
          )
        }
      />
    </form>
  );
}
