"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** "underline" for section tabs, "pill" for compact segmented controls. */
  variant?: "underline" | "pill";
  /** Enables aria-controls wiring to panels with ids `${idPrefix}-panel-${id}`. */
  idPrefix?: string;
  className?: string;
}

/** Accessible tablist with roving focus (Arrow keys, Home, End). */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  variant = "underline",
  idPrefix,
  className,
}: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  }

  const underline = variant === "underline";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        underline
          ? "flex gap-1 overflow-x-auto border-b border-hairline"
          : "inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-hairline bg-white/[0.03] p-1",
        className,
      )}
    >
      {items.map((item, index) => {
        const selected = item.id === value;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={idPrefix ? `${idPrefix}-tab-${item.id}` : undefined}
            aria-controls={idPrefix ? `${idPrefix}-panel-${item.id}` : undefined}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "focus-ring relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors",
              underline
                ? cn(
                    "rounded-t-lg px-3 py-2.5 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full",
                    selected
                      ? "text-slate-50 after:bg-violet-soft"
                      : "text-slate-300 after:bg-transparent hover:text-slate-200",
                  )
                : cn(
                    "rounded-lg px-3 py-1.5",
                    selected
                      ? "bg-violet/20 text-slate-50 ring-1 ring-inset ring-violet/40"
                      : "text-slate-300 hover:bg-white/5 hover:text-slate-200",
                  ),
            )}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[11px] tabular-nums",
                  selected ? "bg-violet/25 text-violet-100" : "bg-white/[0.06] text-slate-300",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Tabs whose panels are rendered by the parent (works with server-rendered content). */
export function TabbedPanels({
  tabs,
  ariaLabel,
  idPrefix,
}: {
  tabs: { id: string; label: string; count?: number; content: ReactNode }[];
  ariaLabel: string;
  idPrefix: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  return (
    <div>
      <Tabs
        items={tabs.map(({ id, label, count }) => ({ id, label, count }))}
        value={active}
        onChange={setActive}
        ariaLabel={ariaLabel}
        idPrefix={idPrefix}
      />
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${idPrefix}-panel-${tab.id}`}
          aria-labelledby={`${idPrefix}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="pt-6 focus:outline-none"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
