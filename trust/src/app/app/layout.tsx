import Link from "next/link";
import { signOut, switchOrganization } from "@/lib/actions";
import { getContext } from "@/lib/context";
import { humanize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await getContext();
  const links = [
    { href: "/app", label: "Dashboard" },
    { href: "/app/contracts", label: "Contracts" },
    { href: "/app/deadlines", label: "Deadlines" },
    { href: "/app/obligations", label: "Obligations" },
    { href: "/app/reviews", label: "Reviews" },
    { href: "/app/team", label: "Team" },
    ...(context.canAdmin ? [{ href: "/app/audit", label: "Audit log" }, { href: "/app/billing", label: "Plan" }] : []),
  ];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/app" className="text-lg font-extrabold tracking-tight text-brand-dark">TRUST</Link>
            {context.memberships.length > 1 ? (
              <form action={switchOrganization} className="flex items-center gap-1">
                <label htmlFor="org_id" className="sr-only">Organisation</label>
                <select id="org_id" name="org_id" defaultValue={context.org.id} className="input max-w-[12rem] py-1">
                  {context.memberships.map((membership) => (
                    <option key={membership.orgId} value={membership.orgId}>{membership.orgName}</option>
                  ))}
                </select>
                <button type="submit" className="btn-secondary min-h-0 px-2 py-1">Switch</button>
              </form>
            ) : (
              <span className="max-w-[14rem] truncate text-sm font-medium text-ink-soft">{context.org.name}</span>
            )}
          </div>
          <form action={signOut} className="flex items-center gap-3 text-sm text-ink-muted">
            <span className="hidden sm:inline">{context.user.email} · {humanize(context.role)}</span>
            <button type="submit" className="font-semibold text-brand underline">Sign out</button>
          </form>
        </div>
        <nav aria-label="Main" className="mx-auto max-w-6xl overflow-x-auto px-4">
          <ul className="flex gap-1 whitespace-nowrap pb-2 text-sm font-medium">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block rounded-md px-3 py-2 text-ink-soft hover:bg-slate-100 hover:text-ink">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
