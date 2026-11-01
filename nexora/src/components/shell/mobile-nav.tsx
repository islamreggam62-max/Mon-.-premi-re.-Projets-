"use client";

import { useRef } from "react";
import { Menu, X } from "lucide-react";
import type { ModuleKey } from "@/types";
import { BrandLockup } from "./brand";
import { SidebarNav } from "./sidebar-nav";

/**
 * Off-canvas navigation for phones and tablets, built on the native <dialog>
 * element: it traps focus, closes on Escape and restores focus to the trigger
 * without any extra library.
 */
export function MobileNav({ badges }: { readonly badges: Partial<Record<ModuleKey, number>> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink lg:hidden"
        aria-label="Open navigation"
        aria-haspopup="dialog"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Navigation"
        onClick={(event) => {
          // A click on the dialog element itself is a click on the backdrop.
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-y-0 left-0 m-0 h-full max-h-none w-72 max-w-[85vw] border-r border-line bg-surface p-0 text-ink shadow-2xl"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <BrandLockup />
            <button
              type="button"
              onClick={close}
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-white/[0.06] hover:text-ink"
              aria-label="Close navigation"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarNav badges={badges} onNavigate={close} />
          </div>
        </div>
      </dialog>
    </>
  );
}
