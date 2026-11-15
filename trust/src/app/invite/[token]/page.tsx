import type { Metadata } from "next";
import Link from "next/link";
import { Banner } from "@/components/ui";
import { acceptInvitation } from "@/lib/actions";
import { getSession } from "@/lib/context";

export const metadata: Metadata = { title: "Join an organisation" };

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const { user } = await getSession();
  const wellFormed = /^[0-9a-f]{64}$/.test(token);
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <span className="mb-6 text-2xl font-extrabold tracking-tight text-brand-dark">TRUST</span>
      <div className="card p-6">
        <h1 className="mb-2 text-xl font-bold">Join an organisation</h1>
        <Banner searchParams={query} />
        {wellFormed ? (
          <>
            <p className="mb-4 text-sm text-ink-soft">
              You are signed in as <strong>{user.email}</strong>. The invitation can only be accepted by the email address it was sent to.
            </p>
            <form action={acceptInvitation}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn-primary w-full">Accept invitation</button>
            </form>
          </>
        ) : (
          <p className="text-sm text-ink-soft">This invitation link is not valid. Ask the person who invited you to send a new one.</p>
        )}
        <p className="mt-4 text-sm"><Link href="/app" className="font-semibold text-brand underline">Go to the application</Link></p>
      </div>
    </main>
  );
}
