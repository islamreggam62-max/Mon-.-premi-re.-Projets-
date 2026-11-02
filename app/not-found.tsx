import Link from "next/link";
import { Compass } from "lucide-react";
import { APP_HOME, pageUrl } from "@/lib/basePath";

/**
 * Site-wide 404, shared by the landing page and the app, so it renders without
 * the app shell. The home link is a plain <a>: a next/link to the root route
 * would prefetch "<base>.txt" in the static export, which 404s on GitHub Pages.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/15 ring-1 ring-inset ring-violet/30">
        <Compass className="h-6 w-6 text-violet-300" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-xl font-semibold text-slate-50">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-300">
        This page doesn&apos;t exist. Open the command center or go back to the NEXORA home page.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        <Link href={APP_HOME} className="btn btn-primary">
          Open the command center
        </Link>
        <a href={pageUrl("/")} className="btn btn-secondary">
          NEXORA home
        </a>
      </div>
    </main>
  );
}
