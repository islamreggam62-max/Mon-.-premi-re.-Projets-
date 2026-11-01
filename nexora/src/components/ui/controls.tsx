import type { ComponentProps, ReactNode } from "react";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Form controls styled for the dark surfaces. Plain elements, so they work in
 * both Server and Client Components; interactive wiring lives in the caller.
 */
export const controlClass =
  "h-9 w-full rounded-lg border border-line bg-canvas/70 px-3 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-line-strong focus-visible:border-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/40 disabled:cursor-not-allowed disabled:opacity-60";

export function SearchField({
  label,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { readonly label: string }) {
  return (
    <label className={cn("relative block min-w-0", className)}>
      <span className="sr-only">{label}</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
      />
      <input type="search" className={cn(controlClass, "pl-9")} {...props} />
    </label>
  );
}

export function SelectField({
  label,
  children,
  className,
  ...props
}: ComponentProps<"select"> & { readonly label: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="sr-only">{label}</span>
      <select className={cn(controlClass, "pr-8")} {...props}>
        {children}
      </select>
    </label>
  );
}

const BUTTON_VARIANTS = {
  primary:
    "bg-brand text-white shadow-[0_0_0_1px_rgb(139_92_246/0.4),0_8px_24px_-8px_rgb(124_58_237/0.6)] hover:bg-brand-hover",
  secondary: "border border-line bg-white/[0.04] text-ink hover:border-line-strong hover:bg-white/[0.07]",
  ghost: "text-ink-muted hover:bg-white/[0.05] hover:text-ink",
  danger: "border border-bad-base/30 bg-bad-base/10 text-bad-ink hover:bg-bad-base/20",
  success: "border border-good-base/30 bg-good-base/10 text-good-ink hover:bg-good-base/20",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(variant: ButtonVariant = "secondary", size: "sm" | "md" = "md"): string {
  return cn(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
    BUTTON_VARIANTS[variant],
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  children,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  readonly variant?: ButtonVariant;
  readonly size?: "sm" | "md";
  readonly icon?: LucideIcon;
  readonly children: ReactNode;
}) {
  return (
    <button type={type} className={cn(buttonClass(variant, size), className)} {...props}>
      {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
      {children}
    </button>
  );
}

interface ToggleOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
  readonly icon?: LucideIcon;
}

/** Mutually exclusive view switch built from aria-pressed toggle buttons. */
export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  readonly label: string;
  readonly options: readonly ToggleOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-lg border border-line bg-canvas/60 p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              active
                ? "bg-raised text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "rounded px-1 tabular-nums",
                  active ? "bg-brand-soft/20 text-brand-ink-strong" : "bg-white/[0.06] text-ink-subtle",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
