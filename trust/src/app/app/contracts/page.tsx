import type { Metadata } from "next";
import Link from "next/link";
import { Banner, Empty, PageHeader, RiskLevelBadge, StatusBadge } from "@/components/ui";
import { getContext } from "@/lib/context";
import { formatDate, humanize } from "@/lib/format";
import type { Contract, ContractStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Contracts" };

const STATUSES: ContractStatus[] = ["draft", "in_review", "approved", "active", "expired", "terminated"];

export default async function ContractsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = await getContext();
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = STATUSES.find((candidate) => candidate === params.status);
  const highRisk = params.risk === "high";

  let query = context.supabase
    .from("contracts")
    .select("id, title, counterparty, contract_type, status, risk_level, risk_score, expiration_date, notice_deadline")
    .eq("org_id", context.org.id)
    .order("created_at", { ascending: false })
    .limit(500);
  // % and _ are wildcards in ILIKE; treat what the user typed as plain text.
  if (q) query = query.ilike("title", `%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`);
  if (status) query = query.eq("status", status);
  if (highRisk) query = query.in("risk_level", ["high", "critical"]);
  const { data, error } = await query;
  const contracts = (data ?? []) as Contract[];

  return (
    <>
      <PageHeader
        title="Contracts"
        description="Every contract of your organisation, with its status and assessed risk."
        action={context.canManage ? <Link href="/app/contracts/new" className="btn-primary">Add contract</Link> : undefined}
      />
      <Banner searchParams={params} />
      <form method="get" className="card mb-4 flex flex-wrap items-end gap-3 p-4" role="search">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="q" className="label">Search by title</label>
          <input id="q" name="q" type="search" defaultValue={q} className="input" />
        </div>
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="input">
            <option value="">All</option>
            {STATUSES.map((candidate) => <option key={candidate} value={candidate}>{humanize(candidate)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="risk" className="label">Risk</label>
          <select id="risk" name="risk" defaultValue={highRisk ? "high" : ""} className="input">
            <option value="">All</option>
            <option value="high">High and critical</option>
          </select>
        </div>
        <button type="submit" className="btn-secondary">Filter</button>
      </form>
      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">The list could not be loaded.</p>
      ) : contracts.length === 0 ? (
        <Empty>{q || status || highRisk ? "No contract matches these filters." : "No contracts yet. Add the first one to get started."}</Empty>
      ) : (
        <div className="card relative overflow-x-auto">
          <table className="w-full min-w-[42rem]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th scope="col" className="th">Contract</th>
                <th scope="col" className="th">Status</th>
                <th scope="col" className="th">Risk</th>
                <th scope="col" className="th">Expires</th>
                <th scope="col" className="th">Notice by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td className="td">
                    <Link href={`/app/contracts/${contract.id}`} className="font-medium text-brand underline">{contract.title}</Link>
                    <span className="block text-xs text-ink-muted">{[contract.counterparty, contract.contract_type].filter(Boolean).join(" · ") || "—"}</span>
                  </td>
                  <td className="td"><StatusBadge status={contract.status} /></td>
                  <td className="td"><RiskLevelBadge level={contract.risk_level} score={contract.risk_score} /></td>
                  <td className="td whitespace-nowrap">{formatDate(contract.expiration_date)}</td>
                  <td className="td whitespace-nowrap">{formatDate(contract.notice_deadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
