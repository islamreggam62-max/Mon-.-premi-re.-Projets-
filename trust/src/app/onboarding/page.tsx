import type { Metadata } from "next";
import { Banner } from "@/components/ui";
import { createOrganization, signOut } from "@/lib/actions";
import { getMemberships, getSession } from "@/lib/context";

export const metadata: Metadata = { title: "Set up your organisation" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { user } = await getSession();
  const memberships = await getMemberships();
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <span className="mb-6 text-2xl font-extrabold tracking-tight text-brand-dark">TRUST</span>
      <div className="card p-6">
        <h1 className="text-xl font-bold">{memberships.length === 0 ? "Set up your organisation" : "Add another organisation"}</h1>
        <p className="mb-4 mt-1 text-sm text-ink-muted">
          Contracts, findings and team members belong to an organisation. You will be its owner and can invite colleagues afterwards.
          If a colleague has already set one up, ask them for an invitation link instead.
        </p>
        <Banner searchParams={params} />
        <form action={createOrganization} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">Organisation name</label>
            <input id="name" name="name" required minLength={2} maxLength={120} autoComplete="organization" className="input" />
          </div>
          <button type="submit" className="btn-primary w-full">Create organisation</button>
        </form>
      </div>
      <form action={signOut} className="mt-4 text-sm text-ink-muted">
        Signed in as {user.email}. <button type="submit" className="font-semibold text-brand underline">Sign out</button>
      </form>
    </main>
  );
}
