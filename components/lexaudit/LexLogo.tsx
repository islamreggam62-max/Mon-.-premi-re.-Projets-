import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

/** LexAudit mark: a royal-violet gradient tile with a scales-of-justice glyph. */
export function LexLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-700 to-violet-500 text-white shadow-glow",
        className,
      )}
      aria-hidden="true"
    >
      <Scale className="h-5 w-5" />
    </span>
  );
}
