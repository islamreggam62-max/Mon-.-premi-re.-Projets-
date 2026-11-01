"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Pref {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const PREFS: Pref[] = [
  {
    id: "digest",
    label: "Daily executive digest",
    description: "Email summary of KPIs, risks, and pending approvals at 7:00 AM.",
    defaultOn: true,
  },
  {
    id: "reminders",
    label: "Daily report reminders",
    description: "Nudge team members who haven't filed an end-of-day check-in.",
    defaultOn: true,
  },
  {
    id: "ai-alerts",
    label: "AI risk alerts",
    description: "Surface high-confidence risks to the command center in real time.",
    defaultOn: true,
  },
  {
    id: "approvals-escalation",
    label: "Approval escalation",
    description: "Auto-escalate approvals within 24h of their due date.",
    defaultOn: false,
  },
];

export function PreferenceToggles() {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFS.map((p) => [p.id, p.defaultOn])),
  );

  return (
    <div className="divide-y divide-white/5">
      {PREFS.map((p) => {
        const on = state[p.id];
        return (
          <div key={p.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100">{p.label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{p.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={on}
              aria-label={p.label}
              onClick={() => setState((s) => ({ ...s, [p.id]: !s[p.id] }))}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                on ? "bg-violet" : "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  on ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
