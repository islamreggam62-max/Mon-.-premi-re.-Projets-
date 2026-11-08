"use client";

import { t } from "@/lib/i18n/core";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { FormActions, FormGrid, SelectField, TextField } from "@/components/ui/Form";
import { PRIORITY_LABEL, PRIORITY_ORDER, TASK_STATUS_LABEL, TASK_STATUS_ORDER } from "@/lib/labels";
import { asOfDay } from "@/lib/store/derived";
import { newId } from "@/lib/store/schema";
import { useNexora } from "@/lib/store/StoreProvider";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import { DeleteButton, parseWhole, peopleOptions } from "./shared";


/** Next task key, e.g. "T-12" (keys already used, including the sample's, are skipped). */
function nextKey(tasks: Task[]): string {
  const max = tasks.reduce((m, t) => {
    const n = Number(/(\d+)$/.exec(t.key)?.[1] ?? 0);
    return n > m ? n : m;
  }, 0);
  return `T-${max + 1}`;
}

export function TaskFormDialog({ open, onClose, task }: { open: boolean; onClose: () => void; task?: Task }) {
  return (
    <Dialog open={open} onClose={onClose} title={task ? t("Edit {name}", { name: task.key }) : "New task"}>
      <TaskForm key={task?.id ?? "new"} task={task} onDone={onClose} />
    </Dialog>
  );
}

function TaskForm({ task, onDone }: { task?: Task; onDone: () => void }) {
  const { data, actions } = useNexora();
  const [title, setTitle] = useState(task?.title ?? "");
  const [projectId, setProjectId] = useState(task?.projectId ?? data.projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? data.currentUserId);
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [due, setDue] = useState(task?.due ?? asOfDay(data));
  const [estimate, setEstimate] = useState(String(task?.estimateHours ?? 4));
  const [error, setError] = useState("");

  const statusOptions = TASK_STATUS_ORDER.map((s) => ({ value: s, label: TASK_STATUS_LABEL[s] }));
  const priorityOptions = [...PRIORITY_ORDER].reverse().map((p) => ({ value: p, label: PRIORITY_LABEL[p] }));
  const projectOptions = [
    { value: "", label: t("No project") },
    ...[...data.projects].sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` })),
  ];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length < 3) return setError(t("Describe the task (at least 3 characters)."));
    if (!due) return setError(t("Choose a due date."));
    const hours = parseWhole(estimate, 0, 1000);
    if (hours === null) return setError(t("The estimate is a whole number of hours."));
    actions.saveTask({
      id: task?.id ?? newId("t"),
      key: task?.key ?? nextKey(data.tasks),
      title: title.trim(),
      projectId,
      assigneeId,
      status,
      priority,
      due,
      estimateHours: hours,
      tags: task?.tags ?? [],
    });
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormGrid>
        <TextField label="Task" value={title} onChange={setTitle} required className="sm:col-span-2" />
        <SelectField label="Project" value={projectId} onChange={setProjectId} options={projectOptions} />
        <SelectField label="Assignee" value={assigneeId} onChange={setAssigneeId} options={peopleOptions(data.people)} />
        <SelectField label="Status" value={status} onChange={setStatus} options={statusOptions} />
        <SelectField label="Priority" value={priority} onChange={setPriority} options={priorityOptions} />
        <TextField label="Due date" type="date" value={due} onChange={setDue} required />
        <TextField label="Estimate (hours)" value={estimate} onChange={setEstimate} inputMode="numeric" />
      </FormGrid>
      <FormActions
        error={error}
        onCancel={onDone}
        submitLabel={task ? "Save changes" : "Create task"}
        extra={
          task && (
            <DeleteButton
              label="Delete task"
              onConfirm={() => {
                actions.removeTask(task.id);
                onDone();
              }}
            />
          )
        }
      />
    </form>
  );
}
