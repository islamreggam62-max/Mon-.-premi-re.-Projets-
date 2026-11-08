"use client";

import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { useDismiss } from "@/lib/hooks/useDismiss";
import { cn } from "@/lib/utils";

/** Button-anchored panel that closes on outside press, Escape, or `close()`. */
export function Popover({
  trigger,
  children,
  panelLabel,
  triggerLabel,
  align = "right",
  panelClassName,
  triggerClassName,
}: {
  trigger: (open: boolean) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  panelLabel: string;
  /** Accessible name for icon-only triggers. */
  triggerLabel?: string;
  align?: "left" | "right";
  panelClassName?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn("focus-ring rounded-xl", triggerClassName)}
      >
        {trigger(open)}
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={panelLabel}
          data-dismiss-on-back=""
          className={cn(
            "absolute top-full z-50 mt-2 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-hairline bg-base-800/95 shadow-2xl shadow-black/50 backdrop-blur-xl motion-safe:animate-fade-in",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}
