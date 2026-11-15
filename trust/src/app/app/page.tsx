import type { Metadata } from "next";
import Link from "next/link";
import { Banner, Empty, PageHeader, RiskLevelBadge, Section, SeverityBadge, StatusBadge } from "@/components/ui";
import { getContext } from "@/lib/context";
import { addDaysIso, describeDue, formatDate, todayIso } from "@/lib/format";
import type { Contract, Deadline, Severity } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = await getContext();
  const today = todayIso();
  const [contracts, risks, deadlines, overdue, reviews] = await Promise.all([
    context.supabase.from("contracts").select("id, title, counterparty, status, risk_level, risk_score").eq("org_id", context.org.id)
      .order("risk_score", { ascending: false, nullsFirst: false }).limit(1000),
    context.supabase.from("risks").select("severity").eq("org_id", context.org.id).eq("status", "open").eq("superseded", false).limit(5000),
    context.supabase.from("deadlines").select("*").eq("org_id", context.org.id).gte("due_date", today).lte("due_date", addDaysIso(today, 90))
      .order("due_date").limit(8),
    context.supabase.from("deadlines").select("contract_id", { count: "exact", head: true }).eq("org_id", context.org.id).lt("due_date", today),
    context.supabase.from("reviews").select("id", { count: "exact", head: true }).eq("org_id", context.org.id).eq("status", "pending")
      .eq("reviewer_id", context.user.id),
  ]);
  const failed = [contracts, risks, deadlines, overdue, reviews].some((result) => result.error);
  const contractRows = (contracts.data ?? []) as Pick<Contract, "id" | "title" | "counterparty" | "status" | "risk_level" | "risk_score">[];
  const openBySeverity = new Map<Severity, number>();
  for (const risk of risks.data ?? []) openBySeverity.set(risk.severity as Severity, (openBySeverity.get(risk.severity as Severity) ?? 0) + 1);
  const live = contractRows.filter((contract) => !["expired", "terminated"].includes(contract.status));
  const exposed = live.filter((contract) => contract.risk_level === "critical" || contract.risk_level === "high");
  const upcoming = (deadlines.data ?? []) as Deadline[];

  const tiles = [
    { label: "Contracts in force or in progress", value: live.length, href: "/app/contracts" },
    { label: "High or critical risk contracts", value: exposed.length, href: "/app/contracts?risk=high" },
    { label: "Deadlines overdue", value: overdue.count ?? 0, href: "/app/deadlines" },
    { label: "Reviews waiting for you", value: reviews.count ?? 0, href: "/app/reviews" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description={`Risk and deadlines across ${context.org.name}.`} />
      <Banner searchParams={params} />
      {failed ? <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Some figures could not be loaded. Reload the page to try again.</p> : null}
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link href={tile.href} className="card block p-4 hover:border-brand">
              <span className="block text-3xl font-bold tabular-nums">{tile.value}</span>
              <span className="mt-1 block text-sm text-ink-muted">{tile.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Open risks by severity">
          {(risks.data ?? []).length === 0 ? (
            <Empty>No open risks. Risks appear here after a contract is analysed or when a risk is recorded by hand.</Empty>
          ) : (
            <ul className="space-y-2">
              {SEVERITY_ORDER.map((severity) => (
                <li key={severity} className="flex items-center justify-between text-sm">
                  <SeverityBadge severity={severity} />
                  <span className="font-semibold tabular-nums">{openBySeverity.get(severity) ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-muted">Counts every open finding, including those whose quotation could not be confirmed.</p>
        </Section>
        <Section title="Next 90 days" aside={<Link href="/app/deadlines" className="text-sm font-semibold text-brand underline">All deadlines</Link>}>
          {upcoming.length === 0 ? (
            <Empty>No deadline in the next 90 days.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((deadline, index) => (
                <li key={`${deadline.contract_id}-${deadline.kind}-${index}`} className="py-2 text-sm">
                  <Link href={`/app/contracts/${deadline.contract_id}`} className="font-medium text-brand underline">{deadline.contract_title}</Link>
                  <span className="block text-ink-soft">{deadline.label}</span>
                  <span className="text-xs text-ink-muted">{formatDate(deadline.due_date)} · {describeDue(deadline.due_date, today)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
      <Section title="Most exposed contracts">
        {contractRows.filter((contract) => contract.risk_score !== null).length === 0 ? (
          <Empty>
            No contract has been assessed yet. <Link href="/app/contracts/new" className="font-semibold text-brand underline">Add a contract</Link> and run an analysis.
          </Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {contractRows.filter((contract) => contract.risk_score !== null).slice(0, 6).map((contract) => (
              <li key={contract.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <Link href={`/app/contracts/${contract.id}`} className="font-medium text-brand underline">{contract.title}</Link>
                  {contract.counterparty ? <span className="text-ink-muted"> · {contract.counterparty}</span> : null}
                </span>
                <span className="flex gap-2"><StatusBadge status={contract.status} /><RiskLevelBadge level={contract.risk_level} score={contract.risk_score} /></span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
