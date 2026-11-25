import type { Metadata } from "next";
import Link from "next/link";
import { Empty, PageHeader, Pill, Section } from "@/components/ui";
import { getContext } from "@/lib/context";
import { daysUntil, describeDue, formatDate, todayIso } from "@/lib/format";
import type { Deadline } from "@/lib/types";

export const metadata: Metadata = { title: "Deadlines" };

const KIND_LABEL: Record<Deadline["kind"], string> = { expiration: "Expiry", notice: "Notice window", obligation: "Obligation" };

export default async function DeadlinesPage() {
  const context = await getContext();
  const today = todayIso();
  const { data, error } = await context.supabase.from("deadlines").select("*").eq("org_id", context.org.id).order("due_date").limit(1000);
  const all = (data ?? []) as Deadline[];
  const groups: { title: string; items: Deadline[] }[] = [
    { title: "Overdue", items: all.filter((deadline) => daysUntil(deadline.due_date, today) < 0) },
    { title: "Next 30 days", items: all.filter((deadline) => { const days = daysUntil(deadline.due_date, today); return days >= 0 && days <= 30; }) },
    { title: "31 to 90 days", items: all.filter((deadline) => { const days = daysUntil(deadline.due_date, today); return days > 30 && days <= 90; }) },
    { title: "Later", items: all.filter((deadline) => daysUntil(deadline.due_date, today) > 90) },
  ];
  return (
    <>
      <PageHeader title="Deadlines" description="Contract expiry dates, the last day to give notice, and dated obligations that are still open. Dates come from the contract record and the obligations list." />
      {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">The deadlines could not be loaded.</p> : null}
      {!error && all.length === 0 ? <Empty>No dated deadline yet. Add expiration dates and notice periods to your contracts to see them here.</Empty> : null}
      {groups.filter((group) => group.items.length > 0).map((group) => (
        <Section key={group.title} title={`${group.title} (${group.items.length})`}>
          <ul className="divide-y divide-slate-100">
            {group.items.map((deadline, index) => (
              <li key={`${deadline.contract_id}-${deadline.kind}-${deadline.obligation_id ?? index}`} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <Link href={`/app/contracts/${deadline.contract_id}${deadline.kind === "obligation" ? "#obligations" : ""}`} className="font-medium text-brand underline">{deadline.contract_title}</Link>
                  <span className="block text-ink-soft" dir="auto">{deadline.label}</span>
                </span>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Pill className="bg-white text-ink-soft ring-slate-200">{KIND_LABEL[deadline.kind]}</Pill>
                  <span className={group.title === "Overdue" ? "font-semibold text-red-700" : "text-ink-soft"}>{formatDate(deadline.due_date)} · {describeDue(deadline.due_date, today)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <p className="text-xs text-ink-muted">Reminders by email are not available yet: check this page regularly.</p>
    </>
  );
}
