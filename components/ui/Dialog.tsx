"use client";

import { t } from "@/lib/i18n/core";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal dialog on the native <dialog> element: focus moves in and is trapped,
 * Escape closes, and the page behind is inert. On phones it fills the width and
 * scrolls inside.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className={cn(
        "m-auto max-h-[92vh] w-[min(100%-1.5rem,40rem)] overflow-y-auto rounded-2xl border border-hairline bg-base-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-slate-50">
                {t(title)}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-slate-400">
                  {t(description)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("Close")}
              className="focus-ring -me-1 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
