import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  Mail,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import { LandingHeader } from "@/components/marketing/LandingHeader";
import { APP_HOME } from "@/lib/basePath";
import { CURRENCY, PLANS, PLAN_FEATURES } from "@/lib/data/pricing";
import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_NAME, absoluteUrl, salesMailto } from "@/lib/site";
import { cn, formatCurrency, percent } from "@/lib/utils";
import productShot from "@/public/screenshots/wide.png";

export const metadata: Metadata = {
  title: { absolute: "NEXORA — The Executive Business Operating System" },
  description:
    "One command center for executives: KPIs, projects, tasks, daily reports, approvals, and AI operational intelligence. Monthly or annual plans.",
};

const FLOW = ["Projects & Tasks", "Daily Reports", "Executive Approvals", "AI Strategic Intelligence"];

const MODULES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: LayoutDashboard, title: "Executive Dashboard", body: "Operational velocity, active projects, report submission, and pending approvals in one view." },
  { icon: Users, title: "Team", body: "Roles, departments, workload capacity, and daily report compliance streaks." },
  { icon: FolderKanban, title: "Projects", body: "Strategic portfolio with owners, timelines, progress, and On Track / At Risk / Delayed health." },
  { icon: ListChecks, title: "Tasks", body: "Execution board and list with priorities, assignees, deadlines, and filters." },
  { icon: ClipboardList, title: "Daily Reports", body: "Structured logs — Completed Work, Priorities, Blockers — with submission tracking." },
  { icon: BadgeCheck, title: "Approvals", body: "Decision queue for budgets, contracts, hiring, and exceptions, ordered by urgency." },
  { icon: Sparkles, title: "AI Intelligence", body: "Risk radar, bottleneck detection, and executive synthesis (preview in this release)." },
  { icon: Settings, title: "Settings & Governance", body: "Organization profile, approval policies, and role-based access control." },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What do I get today?",
    a: "The full NEXORA interface — all eight modules — running on sample company data. Connecting your own company's data arrives with the next release.",
  },
  {
    q: "Can I install NEXORA like an app?",
    a: "Yes. Open the live demo and use “Install NEXORA app” in the sidebar (Chrome, Edge, Android), or Share → Add to Home Screen on iPhone.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. Once installed, the modules you have opened stay available without a connection.",
  },
  {
    q: "Is the AI live?",
    a: "Not yet. AI Intelligence shows how insights, report synthesis, and bottleneck detection will look, using static examples clearly labeled as a preview.",
  },
  {
    q: "How do I subscribe?",
    a: CONTACT_EMAIL
      ? `Email ${CONTACT_EMAIL} with the plan you want, Monthly or Annual, and we will reply with the next steps. Online checkout will come later.`
      : "Online payment is being set up. Until checkout opens, explore the live demo — the plans and prices below are the ones that will apply.",
  },
];

export default function LandingPage() {
  const monthly = PLANS.find((p) => p.id === "monthly")!;
  const annual = PLANS.find((p) => p.id === "annual")!;
  const yearAtMonthlyRate = monthly.price * 12;
  const annualSavings = yearAtMonthlyRate - annual.price;
  const annualPerMonth = annual.price / 12;

  // Structured data for search engines and directories: the product and its two
  // plans, nothing more (no ratings or reviews until real customers leave them).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.toFixed(2),
      priceCurrency: CURRENCY,
      url: `${absoluteUrl("/")}#pricing`,
    })),
  };

  return (
    <div id="top" className="min-h-screen">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <LandingHeader onLanding />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet/40 bg-violet/10 px-3 py-1 text-xs font-semibold text-violet-100">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Early access · live demo with sample data
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
            Run your company from one executive command center
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg">
            NEXORA connects daily execution to executive oversight — projects, tasks, daily reports, and approvals in
            one place, with AI intelligence on top.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={APP_HOME} className="btn btn-primary px-5 py-3 text-sm">
              Try the live demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a href="#pricing" className="btn btn-secondary px-5 py-3 text-sm">
              See pricing
            </a>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-violet/20 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-2xl border border-hairline bg-base-800 shadow-2xl shadow-black/60">
              <Image
                src={productShot}
                alt="NEXORA executive dashboard with KPIs, department health, and the AI executive brief"
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        {/* Flow */}
        <section aria-labelledby="flow-title" className="border-y border-hairline bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <h2 id="flow-title" className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
              One operating flow
            </h2>
            <ol className="mt-5 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-2">
              {FLOW.map((step, i) => (
                <li key={step} className="flex items-center gap-2 md:gap-2">
                  <span className="rounded-xl border border-hairline bg-base-800 px-4 py-2 text-sm font-medium text-slate-100">
                    <span className="mr-2 text-violet-300">{i + 1}</span>
                    {step}
                  </span>
                  {i < FLOW.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 text-slate-400 md:block" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="features-title" className="text-3xl font-semibold tracking-tight text-slate-50">
              Eight modules, one command center
            </h2>
            <p className="mt-3 text-slate-300">Everything an executive team needs to see execution and decide fast.</p>
          </div>
          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="glass p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 ring-1 ring-inset ring-violet/30">
                  <Icon className="h-5 w-5 text-violet-200" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-slate-50">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 border-t border-hairline bg-white/[0.02]">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="pricing-title" className="text-3xl font-semibold tracking-tight text-slate-50">
                Simple pricing
              </h2>
              <p className="mt-3 text-slate-300">Every plan includes every module. Choose how you want to be billed.</p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              {[monthly, annual].map((plan) => {
                const featured = plan.id === "annual";
                return (
                  <article
                    key={plan.id}
                    aria-labelledby={`plan-${plan.id}`}
                    className={cn(
                      "relative flex flex-col rounded-2xl border p-6 sm:p-8",
                      featured ? "border-violet/60 bg-violet/[0.08] shadow-glow" : "border-hairline bg-base-800/60",
                    )}
                  >
                    {featured && annualSavings > 0 && (
                      <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-violet to-violet-soft px-3 py-1 text-xs font-semibold text-white">
                        Best value
                      </span>
                    )}
                    <h3 id={`plan-${plan.id}`} className="text-lg font-semibold text-slate-50">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">{plan.tagline}</p>
                    <p className="mt-6 flex items-baseline gap-1.5" data-testid={`price-${plan.id}`}>
                      <span className="text-5xl font-semibold tracking-tight text-slate-50">{formatCurrency(plan.price)}</span>{" "}
                      {/* the space keeps "$50 / month" readable for screen readers and copy-paste */}
                      <span className="text-sm text-slate-300">/ {plan.interval}</span>
                    </p>
                    <p className="mt-2 min-h-[1.25rem] text-sm text-slate-300" data-testid={`price-note-${plan.id}`}>
                      {featured
                        ? `≈ $${annualPerMonth.toFixed(2)} per month${
                            annualSavings > 0
                              ? ` · save ${formatCurrency(annualSavings)} (${percent(annualSavings, yearAtMonthlyRate)}%) vs monthly`
                              : ""
                          }`
                        : `${formatCurrency(yearAtMonthlyRate)} per year`}
                    </p>
                    <ul className="mt-6 flex-1 space-y-3">
                      {PLAN_FEATURES.map((feature) => (
                        <li key={feature} className="flex gap-2.5 text-sm text-slate-200">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {CONTACT_EMAIL ? (
                      <div className="mt-8 flex flex-col items-center gap-3">
                        <a
                          href={salesMailto(plan.name)}
                          className={cn("btn w-full py-3 text-sm", featured ? "btn-primary" : "btn-secondary")}
                          data-testid={`request-${plan.id}`}
                        >
                          <Mail className="h-4 w-4" aria-hidden="true" />
                          Request the {plan.name} plan
                        </a>
                        <Link href={APP_HOME} className="text-sm text-slate-300 underline-offset-4 hover:text-slate-50 hover:underline">
                          or try the live demo first
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={APP_HOME}
                        className={cn("btn mt-8 w-full py-3 text-sm", featured ? "btn-primary" : "btn-secondary")}
                      >
                        Start with the live demo
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>

            <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-slate-400" data-testid="pricing-note">
              {CONTACT_EMAIL ? (
                <>
                  Prices in US dollars. Online payment is not open yet: to subscribe, email{" "}
                  <a href={salesMailto()} className="font-medium text-violet-200 underline underline-offset-2">
                    {CONTACT_EMAIL}
                  </a>{" "}
                  with the plan you want and we will reply with the next steps. NEXORA is in early access and currently
                  runs on sample data.
                </>
              ) : (
                <>
                  Prices in US dollars. Online payment is not open yet — subscriptions start when checkout launches.
                  NEXORA is in early access and currently runs on sample data.
                </>
              )}
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 id="faq-title" className="text-center text-3xl font-semibold tracking-tight text-slate-50">
            Questions
          </h2>
          <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-hairline">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded text-sm font-medium text-slate-50">
                  {q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-3xl border border-violet/40 bg-violet/[0.08] px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50">See NEXORA with your own eyes</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Open the live demo — no account needed — and install it on your phone in one tap.
            </p>
            <Link href={APP_HOME} className="btn btn-primary mt-7 px-5 py-3 text-sm">
              Open the live demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter onLanding />
    </div>
  );
}
