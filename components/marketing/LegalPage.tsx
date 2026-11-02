import { LandingFooter } from "@/components/marketing/LandingFooter";
import { LandingHeader } from "@/components/marketing/LandingHeader";
import { LEGAL_UPDATED } from "@/lib/site";
import { formatDate } from "@/lib/utils";

/** Shared frame for the privacy policy and terms: header, readable column, footer. */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-slate-400">
          Last updated: <time dateTime={LEGAL_UPDATED}>{formatDate(LEGAL_UPDATED)}</time>
        </p>
        <p className="mt-6 text-base leading-relaxed text-slate-300">{intro}</p>
        <div className="legal mt-10 space-y-10">{children}</div>
      </main>
      <LandingFooter />
    </div>
  );
}

/** One numbered section of a legal page. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-300 [&_a]:text-violet-200 [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
