import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, PageHeader } from "@/components/ui";
import { getContext, getMembers, memberName } from "@/lib/context";
import { formatDateTime, humanize } from "@/lib/format";

export const metadata: Metadata = { title: "Audit log" };

const ENTITIES = ["contract", "document", "analysis", "risk", "obligation", "review", "membership", "invitation", "subscription"];

interface AuditRow {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

function describe(row: AuditRow): string {
  const meta = row.metadata ?? {};
  if (typeof meta.status_from === "string" && typeof meta.status_to === "string") return `status: ${humanize(meta.status_from)} → ${humanize(meta.status_to)}`;
  if (typeof meta.role_from === "string" && typeof meta.role_to === "string") return `role: ${humanize(meta.role_from)} → ${humanize(meta.role_to)}`;
  if (Array.isArray(meta.changed)) return `changed: ${meta.changed.filter((item): item is string => typeof item === "string").map(humanize).join(", ")}`;
  return "";
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = await getContext();
  if (!context.canAdmin) redirect("/app?error=forbidden");
  const entity = ENTITIES.find((candidate) => candidate === params.entity);
  let query = context.supabase.from("audit_log").select("id, actor_id, action, entity_type, metadata, created_at").eq("org_id", context.org.id)
    .order("id", { ascending: false }).limit(200);
  if (entity) query = query.eq("entity_type", entity);
  const [{ data, error }, members] = await Promise.all([query, getMembers(context)]);
  const rows = (data ?? []) as AuditRow[];
  return (
    <>
      <PageHeader title="Audit log" description="Who did what, and when. Entries are written by the database itself and cannot be edited or deleted. Showing the latest 200." />
      <form method="get" className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label htmlFor="entity" className="label">Show</label>
          <select id="entity" name="entity" defaultValue={entity ?? ""} className="input">
            <option value="">Everything</option>
            {ENTITIES.map((candidate) => <option key={candidate} value={candidate}>{humanize(candidate)}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-secondary">Filter</button>
      </form>
      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">The audit log could not be loaded.</p>
      ) : rows.length === 0 ? <Empty>No entry.</Empty> : (
        <div className="card relative overflow-x-auto">
          <table className="w-full min-w-[40rem]">
            <thead className="border-b border-slate-200 bg-slate-50"><tr><th scope="col" className="th">When (UTC)</th><th scope="col" className="th">Who</th><th scope="col" className="th">What</th><th scope="col" className="th">Detail</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="td whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                  <td className="td">{row.actor_id ? memberName(members, row.actor_id) : "System"}</td>
                  <td className="td">{humanize(row.action.replace(".", " "))}</td>
                  <td className="td text-ink-soft">{describe(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
