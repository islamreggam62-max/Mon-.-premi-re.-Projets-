import type { Metadata } from "next";
import { getApprovalsView } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { ApprovalQueue } from "@/components/approvals/approval-queue";

export const metadata: Metadata = {
  title: "Approvals",
  description: "Executive sign-off queue for budget, hiring and policy exceptions.",
};

export default function ApprovalsPage() {
  const view = getApprovalsView();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Approvals"
        description="Budget, hiring and policy-exception requests that need an executive decision, with the policy checks each one triggered."
      />
      <ApprovalQueue
        rows={view.rows}
        currentUser={view.currentUser}
        today={view.today}
        timeZone={view.timeZone}
        currency={view.currency}
      />
    </div>
  );
}
