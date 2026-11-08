"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Labelled form controls sharing the `.field` look. Each keeps a stable id for its label. */

function Label({ htmlFor, label, required, hint }: { htmlFor: string; label: string; required?: boolean; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-300">
      {label}
      {required && (
        <span className="text-rose-300" aria-hidden="true">
          {" "}
          *
        </span>
      )}
      {hint && <span className="ml-1 font-normal text-slate-400">{hint}</span>}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  required,
  hint,
  type = "text",
  placeholder,
  autoComplete = "off",
  className,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  type?: "text" | "email" | "date" | "number";
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} required={required} hint={hint} />
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 3,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} hint={hint} />
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="field resize-y leading-relaxed"
      />
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
  hint,
  className,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} required={required} hint={hint} />
      <select
        id={id}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value as T)}
        className="field"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-violet-500"
      />
      <label htmlFor={id} className="text-sm text-slate-200">
        {label}
        {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      </label>
    </div>
  );
}

/** Two columns on wider screens, one on phones. */
export function FormGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

/** Bottom bar of a form: error message, then the buttons. */
export function FormActions({
  error,
  onCancel,
  submitLabel,
  extra,
}: {
  error?: string;
  onCancel?: () => void;
  submitLabel: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mt-6 space-y-3">
      {error && (
        <p role="alert" className="rounded-lg border border-status-rose/30 bg-status-rose/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>{extra}</div>
        <div className="flex flex-wrap gap-2">
          {onCancel && (
            <button type="button" className="btn btn-secondary px-4 py-2 text-sm" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary px-4 py-2 text-sm">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
