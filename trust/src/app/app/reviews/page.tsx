import type { Metadata } from "next";
import Link from "next/link";
import { Banner, Empty, PageHeader, Section } from "@/components/ui";
import { decideReview } from "@/lib/actions";
import { getContext, getMembers, memberName } from "@/lib/context";
import { formatDate, humanize } from "@/lib/format";
import type { Review } from "@/lib/types";

export const metadata: Metadata = { title: "Reviews" };

type ReviewRow = Review & { contracts: { title: string } | { title: string }[] | null };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = await getContext();
  const [{ data, error }, members] = await Promise.all([
    context.supabase.from("reviews").select("*, contracts(title)").eq("org_id", context.org.id).order("created_at", { ascending: false }).limit(200),
    getMembers(context),
  ]);
  const rows = (data ?? []) as unknown as ReviewRow[];
  const title = (review: ReviewRow) => (Array.isArray(review.contracts) ? review.contracts[0]?.title : review.contracts?.title) ?? "Contract";
  const mine = rows.filter((review) => review.status === "pending" && review.reviewer_id === context.user.id);
  const others = rows.filter((review) => review.status === "pending" && review.reviewer_id !== context.user.id);
  const decided = rows.filter((review) => review.status !== "pending").slice(0, 30);

  return (
    <>
      <PageHeader title="Reviews" description="A contract is approved only by its named reviewer, who cannot be the person who submitted it. Read the findings on the contract page before deciding." />
      <Banner searchParams={params} />
      {error ? <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">The reviews could not be loaded.</p> : null}
      <Section title={`Waiting for your decision (${mine.length})`}>
        {mine.length === 0 ? <Empty>Nothing is waiting for you.</Empty> : (
          <ul className="space-y-4">
            {mine.map((review) => (
              <li key={review.id} className="rounded-md border border-slate-200 p-3">
                <Link href={`/app/contracts/${review.contract_id}`} className="font-semibold text-brand underline">{title(review)}</Link>
                <p className="text-xs text-ink-muted">Requested {formatDate(review.created_at)} by {memberName(members, review.requested_by)}</p>
                <form action={decideReview} className="mt-3 space-y-2">
                  <input type="hidden" name="review_id" value={review.id} />
                  <input type="hidden" name="back" value="/app/reviews" />
                  <label htmlFor={`comment-${review.id}`} className="label">Comment (required to reject or request changes)</label>
                  <textarea id={`comment-${review.id}`} name="comment" rows={2} maxLength={4000} className="input" />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" name="decision" value="approved" className="btn-primary">Approve</button>
                    <button type="submit" name="decision" value="changes_requested" className="btn-secondary">Request changes</button>
                    <button type="submit" name="decision" value="rejected" className="btn-danger">Reject</button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {others.length > 0 ? (
        <Section title={`Waiting for others (${others.length})`}>
          <ul className="divide-y divide-slate-100 text-sm">
            {others.map((review) => (
              <li key={review.id} className="py-2">
                <Link href={`/app/contracts/${review.contract_id}`} className="font-medium text-brand underline">{title(review)}</Link>
                <span className="text-ink-muted"> · with {memberName(members, review.reviewer_id)} since {formatDate(review.created_at)}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Section title="Recent decisions">
        {decided.length === 0 ? <Empty>No decision recorded yet.</Empty> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {decided.map((review) => (
              <li key={review.id} className="py-2">
                <Link href={`/app/contracts/${review.contract_id}`} className="font-medium text-brand underline">{title(review)}</Link>
                <span className="text-ink-soft"> · {humanize(review.status)} by {memberName(members, review.reviewer_id)} on {formatDate(review.decided_at)}</span>
                {review.comment ? <span className="block text-ink-muted" dir="auto">“{review.comment}”</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
