import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/layout/Sidebar";
import { APP_HOME } from "@/lib/basePath";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Landing header. The logo scrolls to #top rather than linking to "/": in the
 * static export a link to the root route prefetches a payload outside the site.
 */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-base-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a href="#top" className="focus-ring flex items-center gap-2.5 rounded-xl" aria-label="NEXORA — back to top">
          <LogoMark className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-[0.2em] text-slate-50">NEXORA</span>
        </a>
        <nav aria-label="Landing page" className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="focus-ring rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-50"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex-1" />
        <a
          href="#pricing"
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
