import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/15 ring-1 ring-inset ring-violet/30">
        <Compass className="h-6 w-6 text-violet-300" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-xl font-semibold text-slate-50">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        This page isn&apos;t part of NEXORA Phase 1. Use the navigation to reach one of the eight modules.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to the command center
      </Link>
    </div>
  );
}
