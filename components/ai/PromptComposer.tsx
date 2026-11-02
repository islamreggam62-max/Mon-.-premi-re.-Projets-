"use client";

import { useId, useState } from "react";
import { Lock, SendHorizontal, Sparkles } from "lucide-react";
import { DemoBadge } from "@/components/ui/Badge";

/**
 * Prompt UI structure only. Phase 1 sends nothing, generates nothing, and shows
 * no simulated response: the send action is disabled by design.
 */
export function PromptComposer({ suggestions }: { suggestions: string[] }) {
  const [value, setValue] = useState("");
  const inputId = useId();
  const hintId = useId();

  return (
    <section aria-labelledby={`${inputId}-title`} className="glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`${inputId}-title`} className="flex items-center gap-2 text-sm font-semibold text-slate-50">
          <Sparkles className="h-4 w-4 text-violet-300" aria-hidden="true" />
          Ask NEXORA
        </h2>
        <DemoBadge label="UI preview · not connected" />
      </div>

      <form className="mt-4" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor={inputId} className="sr-only">
          Question for NEXORA (preview, not sent)
        </label>
        <div className="rounded-2xl border border-hairline bg-base-900/70 focus-within:border-violet/50 focus-within:ring-2 focus-within:ring-violet/30">
          <textarea
            id={inputId}
            rows={3}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-describedby={hintId}
            placeholder="Ask about risks, decisions, or team capacity…"
            className="block w-full resize-none rounded-2xl bg-transparent px-4 pt-3 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3 pt-1">
            <p id={hintId} className="flex items-center gap-1.5 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Preview only — nothing is sent and no answer is generated in Phase 1.
            </p>
            <button type="submit" className="btn btn-primary" disabled aria-disabled="true">
              <SendHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> Send
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400" id={`${inputId}-suggestions`}>
          Example questions
        </p>
        <ul className="mt-2 flex flex-wrap gap-2" aria-labelledby={`${inputId}-suggestions`}>
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setValue(s)}
                className="focus-ring rounded-full border border-hairline bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200 hover:border-violet/40 hover:text-slate-50"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
