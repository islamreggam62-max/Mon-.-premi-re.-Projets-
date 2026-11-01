"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { CircleCheck, NotebookPen, SearchX, Send } from "lucide-react";
import { BLOCKER_SEVERITIES } from "@/types";
import type { BlockerSeverity, DepartmentId } from "@/types";
import type { DailyReportsView, ReportLine } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";
import { BLOCKER_SEVERITY_LABELS } from "@/lib/labels";
import { Card } from "@/components/ui/card";
import { Button, controlClass, SearchField, SelectField } from "@/components/ui/controls";
import { DemoNotice, EmptyState } from "@/components/ui/notice";
import { ReportCard } from "./report-card";
import type { FeedReport } from "./report-card";

const ALL = "all";

interface Draft {
  readonly completed: string;
  readonly inProgress: string;
  readonly blockers: string;
  readonly severity: BlockerSeverity;
  readonly tomorrow: string;
  readonly hours: string;
}

type DraftErrors = Partial<Record<"completed" | "tomorrow" | "hours", string>>;

const EMPTY_DRAFT: Draft = {
  completed: "",
  inProgress: "",
  blockers: "",
  severity: "medium",
  tomorrow: "",
  hours: "8",
};

const toLines = (text: string): ReportLine[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ text: line, taskKey: null }));

function validate(draft: Draft): DraftErrors {
  const errors: DraftErrors = {};
  if (toLines(draft.completed).length + toLines(draft.inProgress).length === 0) {
    errors.completed = "Add at least one completed or in-progress item.";
  }
  if (toLines(draft.tomorrow).length === 0) {
    errors.tomorrow = "Add at least one item to tomorrow's plan.";
  }
  const hours = Number(draft.hours);
  if (draft.hours.trim() === "" || !Number.isFinite(hours) || hours < 0 || hours > 24) {
    errors.hours = "Enter the hours worked today, between 0 and 24.";
  }
  return errors;
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-xs font-medium text-ink">
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-[11px] text-ink-subtle">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-bad-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function DailyReportsWorkspace({ view }: { readonly view: DailyReportsView }) {
  const formId = useId();
  const ids = {
    completed: `${formId}-completed`,
    inProgress: `${formId}-progress`,
    blockers: `${formId}-blockers`,
    severity: `${formId}-severity`,
    tomorrow: `${formId}-tomorrow`,
    hours: `${formId}-hours`,
  };
  const fieldRefs = useRef<Partial<Record<keyof DraftErrors, HTMLElement | null>>>({});

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [submitted, setSubmitted] = useState<FeedReport[]>([]);
  const [confirmation, setConfirmation] = useState("");
  const [department, setDepartment] = useState<DepartmentId | typeof ALL>(ALL);
  const [blockersOnly, setBlockersOnly] = useState(false);
  const [query, setQuery] = useState("");

  const update = (key: keyof Draft) => (event: { target: { value: string } }) =>
    setDraft((current) => ({ ...current, [key]: event.target.value }));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(draft);
    setErrors(found);
    const first = (["completed", "tomorrow", "hours"] as const).find((key) => found[key]);
    if (first) {
      fieldRefs.current[first]?.focus();
      setConfirmation("");
      return;
    }
    const report: FeedReport = {
      id: `demo-${submitted.length + 1}`,
      author: view.currentUser,
      department: view.currentUserDepartment,
      submittedAt: view.asOf,
      status: "late",
      hoursLogged: Number(draft.hours),
      completed: toLines(draft.completed),
      inProgress: toLines(draft.inProgress),
      blockers: toLines(draft.blockers).map((line) => ({
        ...line,
        severity: draft.severity,
        needsHelpFrom: null,
      })),
      tomorrowPlan: toLines(draft.tomorrow),
      demo: true,
    };
    setSubmitted((current) => [report, ...current]);
    setDraft(EMPTY_DRAFT);
    setConfirmation("Check-in added to today's feed. Demo mode: it disappears when you leave this page.");
  };

  const feed = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...submitted, ...view.reports].filter((report) => {
      if (department !== ALL && report.department.id !== department) return false;
      if (blockersOnly && report.blockers.length === 0) return false;
      if (!needle) return true;
      const text = [
        report.author.name,
        ...report.completed.map((line) => line.text),
        ...report.inProgress.map((line) => line.text),
        ...report.blockers.map((line) => line.text),
        ...report.tomorrowPlan.map((line) => line.text),
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(needle);
    });
  }, [submitted, view.reports, department, blockersOnly, query]);

  const describedBy = (key: keyof typeof ids, hasHint = false): string | undefined => {
    const parts = [hasHint ? `${ids[key]}-hint` : null, errors[key as keyof DraftErrors] ? `${ids[key]}-error` : null].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : undefined;
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <details className="group" open={view.currentUserRequired}>
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-5 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-soft/15 ring-1 ring-brand-soft/25">
              <NotebookPen aria-hidden="true" className="size-4 text-brand-ink" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">Submit your check-in</span>
              <span className="block text-xs text-ink-subtle">
                {view.currentUserRequired
                  ? `Due by ${view.policy.deadline} (${view.timeZone}).`
                  : "Optional for your role. Managers and contributors are required to check in."}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="text-xs font-medium text-brand-ink transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <form noValidate onSubmit={onSubmit} className="space-y-4 border-t border-line px-4 py-4 sm:px-5" aria-label="Daily check-in">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id={ids.completed} label="Completed today" hint="One item per line." error={errors.completed}>
                <textarea
                  id={ids.completed}
                  ref={(node) => {
                    fieldRefs.current.completed = node;
                  }}
                  rows={3}
                  value={draft.completed}
                  onChange={update("completed")}
                  aria-invalid={errors.completed ? true : undefined}
                  aria-describedby={describedBy("completed", true)}
                  className={cn(controlClass, "h-auto py-2")}
                />
              </Field>
              <Field id={ids.inProgress} label="In progress" hint="One item per line.">
                <textarea
                  id={ids.inProgress}
                  rows={3}
                  value={draft.inProgress}
                  onChange={update("inProgress")}
                  aria-describedby={`${ids.inProgress}-hint`}
                  className={cn(controlClass, "h-auto py-2")}
                />
              </Field>
              <Field id={ids.blockers} label="Blockers" hint="Optional. One blocker per line.">
                <textarea
                  id={ids.blockers}
                  rows={3}
                  value={draft.blockers}
                  onChange={update("blockers")}
                  aria-describedby={`${ids.blockers}-hint`}
                  className={cn(controlClass, "h-auto py-2")}
                />
              </Field>
              <Field id={ids.tomorrow} label="Tomorrow's plan" hint="One item per line." error={errors.tomorrow}>
                <textarea
                  id={ids.tomorrow}
                  ref={(node) => {
                    fieldRefs.current.tomorrow = node;
                  }}
                  rows={3}
                  value={draft.tomorrow}
                  onChange={update("tomorrow")}
                  aria-invalid={errors.tomorrow ? true : undefined}
                  aria-describedby={describedBy("tomorrow", true)}
                  className={cn(controlClass, "h-auto py-2")}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-[repeat(2,minmax(0,12rem))_1fr] sm:items-end">
              <Field id={ids.severity} label="Blocker severity">
                <select id={ids.severity} value={draft.severity} onChange={update("severity")} className={controlClass}>
                  {BLOCKER_SEVERITIES.map((severity) => (
                    <option key={severity} value={severity}>
                      {BLOCKER_SEVERITY_LABELS[severity]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={ids.hours} label="Hours worked" error={errors.hours}>
                <input
                  id={ids.hours}
                  ref={(node) => {
                    fieldRefs.current.hours = node;
                  }}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={24}
                  step={0.5}
                  value={draft.hours}
                  onChange={update("hours")}
                  aria-invalid={errors.hours ? true : undefined}
                  aria-describedby={describedBy("hours")}
                  className={controlClass}
                />
              </Field>
              <div className="flex sm:justify-end">
                <Button type="submit" variant="primary" icon={Send}>
                  Submit check-in
                </Button>
              </div>
            </div>
            <p role="status" className={cn("text-xs text-good-ink", !confirmation && "sr-only")}>
              {confirmation ? (
                <span className="inline-flex items-center gap-1.5">
                  <CircleCheck aria-hidden="true" className="size-3.5" />
                  {confirmation}
                </span>
              ) : null}
            </p>
            <DemoNotice>Demo mode: check-ins submitted here stay in this browser tab and are not saved.</DemoNotice>
          </form>
        </details>
      </Card>

      <section aria-labelledby="feed-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="feed-heading" className="text-sm font-semibold text-ink">
              Today&apos;s check-ins
            </h2>
            <p className="text-xs text-ink-muted" aria-live="polite">
              {pluralize(feed.length, "check-in")} shown, newest first.
            </p>
          </div>
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(0,14rem)_minmax(0,12rem)_auto]">
            <SearchField
              label="Search check-ins"
              placeholder="Search people or items…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <SelectField
              label="Department"
              value={department}
              onChange={(event) => setDepartment(event.target.value as DepartmentId | typeof ALL)}
            >
              <option value={ALL}>All departments</option>
              {view.departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
            <button
              type="button"
              aria-pressed={blockersOnly}
              onClick={() => setBlockersOnly((value) => !value)}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors",
                blockersOnly
                  ? "border-bad-base/40 bg-bad-base/15 text-bad-ink"
                  : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
              )}
            >
              With blockers
            </button>
          </div>
        </div>
        {feed.length === 0 ? (
          <EmptyState icon={SearchX} title="No check-ins match" description="Clear a filter or broaden the search." />
        ) : (
          <ul className="grid gap-4 2xl:grid-cols-2">
            {feed.map((report) => (
              <li key={report.id} className="min-w-0">
                <ReportCard report={report} timeZone={view.timeZone} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
