"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import type { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Workspace badge + switcher. Only the current workspace is available in Phase 1. */
export function WorkspaceSwitcher({
  workspaces,
  collapsed = false,
}: {
  workspaces: Workspace[];
  collapsed?: boolean;
}) {
  const current = workspaces.find((w) => w.current) ?? workspaces[0];

  return (
    <Popover
      align="left"
      panelLabel="Workspaces"
      panelClassName="w-72"
      triggerLabel={collapsed ? `Workspace: ${current.name} (${current.plan})` : undefined}
      triggerClassName={cn(
        "block w-full border border-hairline bg-white/[0.03] text-left hover:border-white/20 hover:bg-white/[0.05]",
        collapsed && "p-0",
      )}
      trigger={() =>
        collapsed ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-[11px] font-bold text-violet-200">
            {initials(current.name)}
          </span>
        ) : (
          <span className="flex items-center gap-3 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/20 text-[11px] font-bold text-violet-100 ring-1 ring-inset ring-violet/40">
              {initials(current.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="sr-only">Workspace: </span>
              <span className="block truncate text-sm font-semibold text-slate-50">{current.name}</span>
              <span className="mt-0.5 inline-flex items-center rounded-md bg-violet/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-violet-200 ring-1 ring-inset ring-violet/30">
                {current.plan}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </span>
        )
      }
    >
      <div className="border-b border-hairline px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Workspaces</p>
      </div>
      <ul className="p-2">
        {workspaces.map((ws) => (
          <li key={ws.id}>
            <div
              aria-disabled={!ws.available}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", ws.current ? "bg-violet/10" : "opacity-70")}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-semibold text-slate-200">
                {initials(ws.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">{ws.name}</p>
                <p className="truncate text-xs text-slate-400">
                  {ws.plan} · {ws.region}
                </p>
              </div>
              {ws.current ? (
                <Check className="h-4 w-4 text-violet-300" aria-label="Current workspace" />
              ) : (
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Phase 2</span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="border-t border-hairline px-4 py-3 text-xs text-slate-400">
        Switching between workspaces arrives in Phase 2.
      </p>
    </Popover>
  );
}
