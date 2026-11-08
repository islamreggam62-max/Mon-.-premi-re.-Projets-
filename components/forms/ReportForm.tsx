"use client";

import { t } from "@/lib/i18n/core";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { FormActions, FormGrid, SelectField, TextArea, TextField } from "@/components/ui/Form";
import { SEVERITY_LABEL } from "@/lib/labels";
import { asOfDay } from "@/lib/store/derived";
import { newId } from "@/lib/store/schema";
import { useNexora } from "@/lib/store/StoreProvider";
import type { DailyReport, EnergyLevel, ReportBlocker, Severity } from "@/lib/types";
import { DeleteButton, lines, peopleOptions } from "./shared";

const ENERGY_OPTIONS = ([1, 2, 3, 4, 5] as const).map((e) => ({ value: String(e), label: `${e} / 5` }));

/**
 * One person's end-of-day report. The author can be anyone on the team: on a
 * single device, the executive also records the updates sent by phone or chat.
 */
export function ReportFormDialog({ open, onClose, report }: { open: boolean; onClose: () => void; report?: DailyReport }) {
  return (
    <Dialog open={open} onClose={onClose} title={report ? "Edit daily report" : "Add a daily report"} description="Completed work, priorities, and blockers, one item per line.">
      <ReportForm key={report?.id ?? "new"} report={report} onDone={onClose} />
    </Dialog>
  );
}

function ReportForm({ report, onDone }: { report?: DailyReport; onDone: () => void }) {
  const { data, actions } = useNexora();
  const [authorId, setAuthorId] = useState(report?.authorId ?? data.currentUserId);
  const [date, setDate] = useState(report?.date ?? asOfDay(data));
  const [completed, setCompleted] = useState((report?.completed ?? []).join("\n"));
  const [priorities, setPriorities] = useState((report?.priorities ?? []).join("\n"));
  const [blockers, setBlockers] = useState<ReportBlocker[]>(report?.blockers ?? []);
  const [energy, setEnergy] = useState(String(report?.energy ?? 4));
  const [error, setError] = useState("");

  const severityOptions = (["high", "medium", "low"] as Severity[]).map((s) => ({ value: s, label: SEVERITY_LABEL[s] }));

  function setBlocker(i: number, patch: Partial<ReportBlocker>) {
    setBlockers((list) => list.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!date) return setError(t("Choose the report's date."));
    const duplicate = data.reports.find((r) => r.authorId === authorId && r.date === date && r.id !== report?.id);
    if (duplicate) return setError(t("This person already has a report for that day. Edit that report instead."));
    const done = lines(completed);
    const next = lines(priorities);
    const cleanBlockers = blockers.filter((b) => b.description.trim()).map((b) => ({ ...b, description: b.description.trim(), waitingOn: b.waitingOn.trim() || "—" }));
    if (!done.length && !next.length && !cleanBlockers.length) return setError(t("Add at least one completed item, priority, or blocker."));
    actions.saveReport({
      id: report?.id ?? newId("r"),
      authorId,
      date,
      submittedAt: report?.submittedAt ?? new Date().toISOString(),
      completed: done,
      priorities: next,
      blockers: cleanBlockers,
      energy: Number(energy) as EnergyLevel,
    });
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormGrid>
        <SelectField label="Author" value={authorId} onChange={setAuthorId} options={peopleOptions(data.people)} />
        <TextField label="Date" type="date" value={date} onChange={setDate} required />
        <TextArea label="Completed work" value={completed} onChange={setCompleted} rows={4} hint="one per line" className="sm:col-span-2" />
        <TextArea label="Priorities" value={priorities} onChange={setPriorities} rows={3} hint="one per line" className="sm:col-span-2" />
      </FormGrid>

      <fieldset className="mt-5">
        <legend className="text-xs font-semibold text-slate-300">{t("Blockers")}</legend>
        <ul className="mt-2 space-y-3">
          {blockers.map((b, i) => (
            <li key={b.id} className="rounded-xl border border-hairline p-3">
              <div className="flex items-start gap-2">
                <input
                  aria-label={t("Blocker {n}", { n: i + 1 })}
                  placeholder={t("What is blocked")}
                  value={b.description}
                  onChange={(e) => setBlocker(i, { description: e.target.value })}
                  className="field min-w-0 flex-1"
                />
                <button
                  type="button"
                  aria-label={t("Remove blocker {n}", { n: i + 1 })}
                  onClick={() => setBlockers((list) => list.filter((_, j) => j !== i))}
                  className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  aria-label={t("Blocker {n}: waiting on", { n: i + 1 })}
                  placeholder={t("Waiting on (person, team, supplier…)")}
                  value={b.waitingOn === "—" ? "" : b.waitingOn}
                  onChange={(e) => setBlocker(i, { waitingOn: e.target.value })}
                  className="field min-w-0 flex-1 basis-48"
                />
                <select
                  aria-label={t("Blocker {n}: severity", { n: i + 1 })}
                  value={b.severity}
                  onChange={(e) => setBlocker(i, { severity: e.target.value as Severity })}
                  className="field w-auto"
                >
                  {severityOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn-secondary mt-2 px-3 py-2 text-sm"
          onClick={() => setBlockers((list) => [...list, { id: newId("b"), description: "", waitingOn: "", severity: "medium" }])}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("Add blocker")}
        </button>
      </fieldset>

      <div className="mt-5 max-w-[12rem]">
        <SelectField label="Energy" value={energy} onChange={setEnergy} options={ENERGY_OPTIONS} />
      </div>

      <FormActions
        error={error}
        onCancel={onDone}
        submitLabel={report ? "Save changes" : "Add report"}
        extra={
          report && (
            <DeleteButton
              label="Delete report"
              onConfirm={() => {
                actions.removeReport(report.id);
                onDone();
              }}
            />
          )
        }
      />
    </form>
  );
}
