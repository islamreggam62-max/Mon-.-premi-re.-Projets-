import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, Section } from "@/components/ui";
import { getContext } from "@/lib/context";
import { formatDate, humanize } from "@/lib/format";

export const metadata: Metadata = { title: "Plan" };

export default async function BillingPage() {
  const context = await getContext();
  if (!context.canAdmin) redirect("/app?error=forbidden");
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const [subscription, contracts, seats, analyses] = await Promise.all([
    context.supabase.from("subscriptions").select("*").eq("org_id", context.org.id).maybeSingle(),
    context.supabase.from("contracts").select("id", { count: "exact", head: true }).eq("org_id", context.org.id),
    context.supabase.from("memberships").select("user_id", { count: "exact", head: true }).eq("org_id", context.org.id),
    context.supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("org_id", context.org.id).eq("kind", "analysis").gte("created_at", monthStart),
  ]);
  const plan = subscription.data as { plan: string; status: string; seat_limit: number; contract_limit: number; monthly_analysis_limit: number; current_period_end: string } | null;
  const usage = plan
    ? [
        { label: "Team members", used: seats.count ?? 0, limit: plan.seat_limit },
        { label: "Contracts", used: contracts.count ?? 0, limit: plan.contract_limit },
        { label: "AI analyses this month", used: analyses.count ?? 0, limit: plan.monthly_analysis_limit },
      ]
    : [];
  return (
    <>
      <PageHeader title="Plan" description="What your organisation's plan includes and how much of it is in use." />
      <Section title="Current plan">
        {!plan ? <p className="text-sm text-ink-soft">No plan information is available.</p> : (
          <>
            <p className="text-sm"><strong className="font-semibold">{humanize(plan.plan)}</strong> · {humanize(plan.status)} · current period ends {formatDate(plan.current_period_end)}</p>
            <ul className="mt-4 space-y-3">
              {usage.map((item) => (
                <li key={item.label}>
                  <div className="flex justify-between text-sm"><span>{item.label}</span><span className="tabular-nums">{item.used} of {item.limit}</span></div>
                  <progress className="mt-1 h-2 w-full" value={Math.min(item.used, item.limit)} max={item.limit} aria-label={`${item.label}: ${item.used} of ${item.limit}`} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>
      <p className="text-sm text-ink-muted">Online payment and plan changes are not connected yet. To change your plan, contact your TRUST provider.</p>
    </>
  );
}
