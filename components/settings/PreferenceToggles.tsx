"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/Controls";

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
    description: "Morning summary of KPIs, risks, and pending approvals.",
    defaultOn: true,
  },
  {
    id: "reminders",
    label: "Daily report reminders",
    description: "Nudge people who haven't filed an end-of-day check-in.",
    defaultOn: true,
  },
  {
    id: "approval-escalation",
    label: "Approval escalation",
    description: "Escalate approvals 24 hours before they are due.",
    defaultOn: false,
  },
  {
    id: "ai-alerts",
    label: "AI risk alerts",
    description: "Available once AI Intelligence leaves preview.",
    defaultOn: false,
  },
];

/** Toggles are local UI state only; delivery channels arrive in Phase 2. */
export function PreferenceToggles() {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFS.map((p) => [p.id, p.defaultOn])),
  );

  return (
    <ul className="divide-y divide-white/5">
      {PREFS.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-100">{p.label}</p>
            <p className="mt-0.5 text-xs text-slate-400">{p.description}</p>
          </div>
          <Switch
            label={p.label}
            checked={state[p.id]}
            disabled={p.id === "ai-alerts"}
            onChange={(checked) => setState((s) => ({ ...s, [p.id]: checked }))}
          />
        </li>
      ))}
    </ul>
  );
}
