import { Bot, Lock } from "lucide-react";
import { Panel } from "@/components/ui/card";
import { controlClass } from "@/components/ui/controls";
import { cn } from "@/lib/cn";

const EXAMPLES = [
  "Which initiatives will miss their target date?",
  "Who is overloaded, and what can be deferred?",
  "Summarize this week for the board.",
] as const;

/**
 * Placeholder for natural-language questions. Deliberately inert in Phase 1:
 * no model is connected, and the UI says so instead of simulating answers.
 */
export function AskPanel() {
  return (
    <Panel
      id="ask"
      title={
        <span className="inline-flex items-center gap-1.5">
          <Bot aria-hidden="true" className="size-4 text-brand-ink" />
          Ask NEXORA
        </span>
      }
      description="Natural-language questions about the workspace."
    >
      <label htmlFor="ask-input" className="sr-only">
        Question for NEXORA (not available in Phase 1)
      </label>
      <textarea
        id="ask-input"
        rows={3}
        disabled
        placeholder="Ask about initiatives, people, approvals…"
        aria-describedby="ask-status"
        className={cn(controlClass, "h-auto resize-none py-2")}
      />
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Example questions">
        {EXAMPLES.map((example) => (
          <li
            key={example}
            className="rounded-full border border-line px-3 py-1 text-xs text-ink-subtle"
          >
            {example}
          </li>
        ))}
      </ul>
      <p id="ask-status" className="mt-3 flex gap-2 text-xs leading-5 text-ink-muted">
        <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ink-subtle" />
        Not available in Phase 1: no AI model is connected. It will need a configured model provider, with
        access limited by the RBAC rules in Settings.
      </p>
    </Panel>
  );
}
