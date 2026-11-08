"use client";

import { t, tn } from "@/lib/i18n/core";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { FormActions, FormGrid, SelectField, TextArea, TextField } from "@/components/ui/Form";
import { HEALTH_LABEL, HEALTH_ORDER } from "@/lib/labels";
import { departmentOptions } from "@/lib/store/options";
import { asOfDay } from "@/lib/store/derived";
import { newId } from "@/lib/store/schema";
import { useNexora } from "@/lib/store/StoreProvider";
import type { Department, Health, Milestone, Project } from "@/lib/types";
import { DeleteButton, parseAmount, parseWhole, peopleOptions } from "./shared";


export function ProjectFormDialog({ open, onClose, project }: { open: boolean; onClose: () => void; project?: Project }) {
  return (
    <Dialog open={open} onClose={onClose} title={project ? t("Edit {name}", { name: project.name }) : "New project"}>
      <ProjectForm key={project?.id ?? "new"} project={project} onDone={onClose} />
    </Dialog>
  );
}

function ProjectForm({ project, onDone }: { project?: Project; onDone: () => void }) {
  const { data, actions } = useNexora();
  const [code, setCode] = useState(project?.code ?? "");
  const [name, setName] = useState(project?.name ?? "");
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [ownerId, setOwnerId] = useState(project?.ownerId ?? data.currentUserId);
  const [department, setDepartment] = useState<Department>(project?.department ?? "Operations");
  const [health, setHealth] = useState<Health>(project?.health ?? "on-track");
  const [progress, setProgress] = useState(String(project?.progress ?? 0));
  const [startDate, setStartDate] = useState(project?.startDate ?? asOfDay(data));
  const [targetDate, setTargetDate] = useState(project?.targetDate ?? "");
  const [budget, setBudget] = useState(project ? String(project.budget) : "");
  const [spent, setSpent] = useState(project ? String(project.spent) : "0");
  const [milestones, setMilestones] = useState<Milestone[]>(project?.milestones ?? []);
  const [error, setError] = useState("");

  const linkedTasks = project ? data.tasks.filter((t) => t.projectId === project.id).length : 0;
  const linkedApprovals = project ? data.approvals.filter((a) => a.projectId === project.id).length : 0;
  const healthOptions = HEALTH_ORDER.map((h) => ({ value: h, label: HEALTH_LABEL[h] }));
  const linked = [linkedTasks ? tn(linkedTasks, "{n} task", "{n} tasks") : "", linkedApprovals ? tn(linkedApprovals, "{n} approval", "{n} approvals") : ""].filter(Boolean);
  const blockedReason = linked.length ? t("Linked to {items}: move or delete those first.", { items: linked.join(t(", ")) }) : undefined;

  function setMilestone(i: number, patch: Partial<Milestone>) {
    setMilestones((list) => list.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,8}$/.test(c)) return setError(t("The code is 2 to 8 letters or digits, e.g. ATLAS."));
    if (data.projects.some((p) => p.code === c && p.id !== project?.id)) return setError(t("Another project already uses the code {code}.", { code: c }));
    if (name.trim().length < 2) return setError(t("Enter a project name (at least 2 characters)."));
    const pct = parseWhole(progress, 0, 100);
    if (pct === null) return setError(t("Progress is a whole number from 0 to 100."));
    if (!targetDate) return setError(t("Choose a target date."));
    if (targetDate < startDate) return setError(t("The target date comes before the start date."));
    const budgetValue = budget.trim() ? parseAmount(budget) : 0;
    const spentValue = spent.trim() ? parseAmount(spent) : 0;
    if (budgetValue === null || spentValue === null) return setError(t("Budget and spent are amounts in digits, e.g. 2500000."));
    const cleanMilestones = milestones.filter((m) => m.name.trim());
    if (cleanMilestones.some((m) => !m.due)) return setError(t("Every milestone needs a due date."));
    actions.saveProject({
      id: project?.id ?? newId("prj"),
      code: c,
      name: name.trim(),
      summary: summary.trim(),
      health,
      progress: pct,
      ownerId,
      memberIds: project ? Array.from(new Set([ownerId, ...project.memberIds.filter((id) => data.people.some((p) => p.id === id))])) : [ownerId],
      department,
      startDate,
      targetDate,
      budget: budgetValue,
      spent: spentValue,
      milestones: cleanMilestones.map((m) => ({ ...m, name: m.name.trim() })),
      tags: project?.tags ?? [],
    });
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormGrid>
        <TextField label="Code" value={code} onChange={(v) => setCode(v.toUpperCase())} required maxLength={8} placeholder="ATLAS" />
        <TextField label="Name" value={name} onChange={setName} required />
        <TextArea label="Summary" value={summary} onChange={setSummary} rows={2} className="sm:col-span-2" />
        <SelectField label="Owner" value={ownerId} onChange={setOwnerId} options={peopleOptions(data.people)} />
        <SelectField label="Department" value={department} onChange={setDepartment} options={departmentOptions()} />
        <SelectField label="Health" value={health} onChange={setHealth} options={healthOptions} />
        <TextField label="Progress %" value={progress} onChange={setProgress} inputMode="numeric" hint="0–100" />
        <TextField label="Start date" type="date" value={startDate} onChange={setStartDate} />
        <TextField label="Target date" type="date" value={targetDate} onChange={setTargetDate} required />
        <TextField label="Budget" value={budget} onChange={setBudget} inputMode="numeric" hint={`(${data.mode === "sample" ? "USD" : data.company.currency})`} />
        <TextField label="Spent so far" value={spent} onChange={setSpent} inputMode="numeric" />
      </FormGrid>

      <fieldset className="mt-5">
        <legend className="text-xs font-semibold text-slate-300">{t("Milestones")}</legend>
        <ul className="mt-2 space-y-2">
          {milestones.map((m, i) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2">
              <input
                aria-label={t("Milestone {n} name", { n: i + 1 })}
                value={m.name}
                onChange={(e) => setMilestone(i, { name: e.target.value })}
                className="field min-w-0 flex-1 basis-40"
              />
              <input
                aria-label={t("Milestone {n} due date", { n: i + 1 })}
                type="date"
                value={m.due}
                onChange={(e) => setMilestone(i, { due: e.target.value })}
                className="field w-auto"
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-300">
                <input type="checkbox" checked={m.done} onChange={(e) => setMilestone(i, { done: e.target.checked })} className="h-4 w-4 accent-violet-500" />
                {t("Done")}
              </label>
              <button
                type="button"
                aria-label={t("Remove milestone {n}", { n: i + 1 })}
                onClick={() => setMilestones((list) => list.filter((_, j) => j !== i))}
                className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn-secondary mt-2 px-3 py-2 text-sm"
          onClick={() => setMilestones((list) => [...list, { id: newId("ms"), name: "", due: targetDate || asOfDay(data), done: false }])}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("Add milestone")}
        </button>
      </fieldset>

      <FormActions
        error={error}
        onCancel={onDone}
        submitLabel={project ? "Save changes" : "Create project"}
        extra={
          project && (
            <DeleteButton
              label="Delete project"
              blockedReason={blockedReason}
              onConfirm={() => {
                actions.removeProject(project.id);
                onDone();
              }}
            />
          )
        }
      />
    </form>
  );
}
