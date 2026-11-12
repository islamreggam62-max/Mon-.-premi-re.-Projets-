import type { Metadata } from "next";
import Link from "next/link";
import { Banner } from "@/components/ui";
import { signUp } from "@/lib/actions";
import { safeNextPath } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  return (
    <div className="card p-6">
      <h1 className="mb-4 text-xl font-bold">Create your account</h1>
      <Banner searchParams={params} />
      <form action={signUp} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="full_name" className="label">Full name</label>
          <input id="full_name" name="full_name" autoComplete="name" required maxLength={120} className="input" />
        </div>
        <div>
          <label htmlFor="email" className="label">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} aria-describedby="password-help" className="input" />
          <p id="password-help" className="mt-1 text-xs text-ink-muted">At least 10 characters.</p>
        </div>
        <button type="submit" className="btn-primary w-full">Create account</button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        Already registered?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand underline">Sign in</Link>
      </p>
    </div>
  );
}
