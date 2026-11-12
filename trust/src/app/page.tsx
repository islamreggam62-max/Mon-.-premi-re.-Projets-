import Link from "next/link";
import { LEGAL_NOTICE } from "@/components/ui";

const FEATURES = [
  { title: "Every finding shows its source", text: "Each risk, obligation and key term carries the page, the clause and the exact words it is based on. The platform checks that the quoted words really are in the document." },
  { title: "Deadlines you cannot miss", text: "Expiry dates, renewal notice windows and obligation due dates in one calendar, with what is overdue shown first." },
  { title: "Review before approval", text: "A contract is approved only by a named reviewer who is not the person who submitted it. Every decision is recorded." },
  { title: "Your organisation's data stays yours", text: "Each organisation is isolated in the database itself. Roles decide who can read, edit, review and administer." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-xl font-extrabold tracking-tight text-brand-dark">TRUST</span>
        <nav aria-label="Account" className="flex gap-2">
          <Link href="/login" className="btn-secondary">Sign in</Link>
          <Link href="/signup" className="btn-primary">Create account</Link>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 pb-16">
        <section className="py-10 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Contract risk &amp; intelligence</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Know what your contracts commit you to, and where they expose you.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-soft">
            Upload a PDF or Word contract. TRUST extracts the parties, dates, amounts and obligations, points out the clauses that carry risk,
            and shows the passage behind each finding so your team can check it in seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary">Start with your first contract</Link>
            <Link href="/login" className="btn-secondary">Sign in</Link>
          </div>
        </section>
        <section aria-label="What TRUST does" className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card p-5">
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{feature.text}</p>
            </div>
          ))}
        </section>
        <p className="mt-10 max-w-3xl text-xs text-ink-muted">{LEGAL_NOTICE}</p>
      </main>
    </div>
  );
}
