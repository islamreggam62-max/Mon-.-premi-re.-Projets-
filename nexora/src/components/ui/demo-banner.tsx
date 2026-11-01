import { FlaskConical } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Persistent notice that everything on screen is sample data. Renders only
 * while NEXORA runs in demo mode — once Supabase is configured it disappears,
 * because the app is then showing real workspace data.
 */
export function DemoBanner() {
  if (isSupabaseConfigured()) return null;
  return (
    <div className="flex items-center gap-2.5 border-b border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs text-violet-100 sm:px-6">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-violet-300" />
      <p className="leading-snug">
        <span className="font-semibold">Demo mode</span>
        <span className="mx-1.5 text-violet-300/60">·</span>
        All figures, people and activity shown are fictional sample data.
        Connect Supabase to replace them with your workspace&apos;s real data.
      </p>
    </div>
  );
}

/** Small inline tag; hidden once Supabase is connected. */
export function DemoTag({ className }: { className?: string }) {
  if (isSupabaseConfigured()) return null;
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
