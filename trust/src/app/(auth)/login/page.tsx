import type { Metadata } from "next";
import Link from "next/link";
import { Banner } from "@/components/ui";
import { signIn } from "@/lib/actions";
import { safeNextPath } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  return (
    <div className="card p-6">
      <h1 className="mb-4 text-xl font-bold">Sign in</h1>
      <Banner searchParams={params} />
      <form action={signIn} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="label">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </div>
        <button type="submit" className="btn-primary w-full">Sign in</button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        No account yet?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-brand underline">Create one</Link>
      </p>
    </div>
  );
}
