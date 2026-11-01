import { cn } from "@/lib/cn";

interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  /** Accessible name when no visible label is associated via `labelledBy`. */
  readonly label?: string;
  readonly labelledBy?: string;
  readonly describedBy?: string;
  readonly disabled?: boolean;
}

/** On/off control exposed as role="switch" with aria-checked. */
export function Switch({ checked, onChange, label, labelledBy, describedBy, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-brand-soft bg-brand" : "border-line-strong bg-white/[0.06]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-3.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[1.125rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
