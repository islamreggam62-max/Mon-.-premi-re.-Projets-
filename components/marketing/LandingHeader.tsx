import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/layout/Sidebar";
import { APP_HOME, pageUrl } from "@/lib/basePath";

const LINKS = [
  { hash: "#features", label: "Features" },
  { hash: "#pricing", label: "Pricing" },
  { hash: "#faq", label: "FAQ" },
];

/**
 * Header for the public pages. Links to the landing page are plain <a>
 * elements, never next/link: in the static export a link to the root route
 * prefetches a payload outside the site. On the landing page itself
 * (`onLanding`) they stay in-page.
 */
export function LandingHeader({ onLanding = false }: { onLanding?: boolean }) {
  const home = onLanding ? "" : pageUrl("/");
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-base-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a
          href={onLanding ? "#top" : home}
          className="focus-ring flex items-center gap-2.5 rounded-xl"
          aria-label={onLanding ? "NEXORA — back to top" : "NEXORA — home"}
        >
          <LogoMark className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-[0.2em] text-slate-50">NEXORA</span>
        </a>
        <nav aria-label="Landing page" className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.hash}
              href={`${home}${link.hash}`}
              className="focus-ring rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-50"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex-1" />
        <a
          href={`${home}#pricing`}
          className="focus-ring hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:text-slate-50 sm:block md:hidden"
        >
          Pricing
        </a>
        <Link href={APP_HOME} className="btn btn-primary px-4 py-2 text-sm">
          Live demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
