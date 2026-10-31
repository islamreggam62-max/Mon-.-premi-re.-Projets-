import { FlaskConical } from "lucide-react";

/**
 * Persistent, unmissable notice that everything on screen is sample data.
 * Rendered once in the app shell so it appears on every page.
 */
export function DemoBanner() {
  return (
    <div className="flex items-center gap-2.5 border-b border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs text-violet-100 sm:px-6">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-violet-300" />
      <p className="leading-snug">
        <span className="font-semibold">Demo mode</span>
        <span className="mx-1.5 text-violet-300/60">·</span>
        All figures, people and activity shown are fictional sample data. No
        backend, database or AI is connected yet.
      </p>
    </div>
  );
}

/** Small inline tag to drop next to any widget fed by demo data. */
export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-md border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-200 " +
        (className ?? "")
      }
    >
      Demo data
    </span>
  );
}
