import type { Metadata } from "next";
import Link from "next/link";
import { Banner, Empty, PageHeader, Pill } from "@/components/ui";
import { updateObligation } from "@/lib/actions";
import { getContext, getMembers, memberName } from "@/lib/context";
import { describeDue, formatDate, humanize, todayIso } from "@/lib/format";
import type { Obligation } from "@/lib/types";

export const metadata: Metadata = { title: "Obligations" };

export default async function ObligationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = await getContext();
  const mine = params.view === "mine";
  const showClosed = params.closed === "1";
  let query = context.supabase
    .from("obligations")
    .select("id, contract_id, source, responsible_party, category, description, due_date, recurrence, status, assignee_id, contracts(title)")
    .eq("org_id", context.org.id)
    .eq("superseded", false)
    .order("due_date", { nullsFirst: false })
    .limit(1000);
  if (mine) query = query.eq("assignee_id", context.user.id);
  if (!showClosed) query = query.in("status", ["open", "in_progress"]);
  const [{ data, error }, members] = await Promise.all([query, getMembers(context)]);
  const rows = (data ?? []) as unknown as (Obligation & { contracts: { title: string } | { title: string }[] | null })[];
  const today = todayIso();
  const link = (view: string | null, closed: boolean) => {
    const search = new URLSearchParams();
    if (view) search.set("view", view);
    if (closed) search.set("closed", "1");
    const text = search.toString();
    return text ? `/app/obligations?${text}` : "/app/obligations";
  };

  return (
    <>
      <PageHeader title="Obligations" description="What each contract requires someone to do, with its due date and who is following it." />
      <Banner searchParams={params} />
      <nav aria-label="Filters" className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href={link(null, showClosed)} aria-current={!mine ? "page" : undefined} className={!mine ? "btn-primary min-h-0 py-1" : "btn-secondary min-h-0 py-1"}>Everyone</Link>
        <Link href={link("mine", showClosed)} aria-current={mine ? "page" : undefined} className={mine ? "btn-primary min-h-0 py-1" : "btn-secondary min-h-0 py-1"}>Assigned to me</Link>
        <Link href={link(mine ? "mine" : null, !showClosed)} className="btn-secondary min-h-0 py-1">{showClosed ? "Hide done and waived" : "Show done and waived"}</Link>
      </nav>
      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">The obligations could not be loaded.</p>
      ) : rows.length === 0 ? (
        <Empty>{mine ? "Nothing is assigned to you." : "No open obligation. They appear after a contract is analysed, or when added by hand on a contract page."}</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map((obligation) => {
            const contractTitle = (Array.isArray(obligation.contracts) ? obligation.contracts[0]?.title : obligation.contracts?.title) ?? "Contract";
            const overdue = obligation.due_date !== null && obligation.due_date < today && ["open", "in_progress"].includes(obligation.status);
            const mayUpdate = context.canManage || obligation.assignee_id === context.user.id;
            return (
              <li key={obligation.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/app/contracts/${obligation.contract_id}#obligations`} className="text-sm font-semibold text-brand underline">{contractTitle}</Link>
                  <Pill className="bg-white text-ink-soft ring-slate-200">{humanize(obligation.category)}</Pill>
                  <Pill className={obligation.status === "done" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"}>{humanize(obligation.status)}</Pill>
                  {overdue ? <Pill className="bg-red-100 text-red-800 ring-red-200">Overdue</Pill> : null}
                </div>
                <p className="mt-2 text-sm" dir="auto">{obligation.description}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {[obligation.responsible_party ? `Responsible: ${obligation.responsible_party}` : null,
                    obligation.due_date ? `Due ${formatDate(obligation.due_date)} (${describeDue(obligation.due_date, today)})` : "No fixed date",
                    obligation.recurrence, `Assigned to ${memberName(members, obligation.assignee_id)}`].filter(Boolean).join(" · ")}
                </p>
                {mayUpdate ? (
                  <form action={updateObligation} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="obligation_id" value={obligation.id} />
                    <input type="hidden" name="back" value="/app/obligations" />
                    <div>
                      <label htmlFor={`status-${obligation.id}`} className="label">Status</label>
                      <select id={`status-${obligation.id}`} name="status" defaultValue={obligation.status} className="input">
                        <option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="waived">Waived</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-secondary">Save</button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
