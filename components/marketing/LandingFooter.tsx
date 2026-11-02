import Link from "next/link";
import { APP_HOME, pageUrl } from "@/lib/basePath";

/**
 * Footer for the public pages. `onLanding` keeps the section links in-page;
 * elsewhere they point at the landing page with a plain <a> (a next/link to
 * the root route would prefetch "<base>.txt", which 404s on GitHub Pages).
 */
export function LandingFooter({ onLanding = false }: { onLanding?: boolean }) {
  const home = onLanding ? "" : pageUrl("/");
  const linkClass = "hover:text-slate-200";
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-slate-400 sm:flex-row sm:px-6">
        <p>© 2026 NEXORA. All rights reserved.</p>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link href={APP_HOME} className={linkClass}>
            Live demo
          </Link>
          <a href={`${home}#pricing`} className={linkClass}>
            Pricing
          </a>
          <a href={`${home}#faq`} className={linkClass}>
            FAQ
          </a>
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
