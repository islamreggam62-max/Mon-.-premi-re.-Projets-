import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClass } from "@/components/ui/controls";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-soft/10 ring-1 ring-brand-soft/25">
        <Compass aria-hidden="true" className="size-6 text-brand-ink" />
      </span>
      <div>
        <h1 className="text-xl font-semibold text-ink">This page is not part of the workspace</h1>
        <p className="mt-1 text-sm text-ink-muted">
          The link may be outdated. Every NEXORA module is available from the navigation.
        </p>
      </div>
      <Link href="/" className={buttonClass("primary")}>
        Back to the Command Center
      </Link>
    </div>
  );
}
