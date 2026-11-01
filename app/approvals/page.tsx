import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApprovalQueue } from "@/components/approvals/ApprovalQueue";
import { APPROVALS } from "@/lib/data/approvals";

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return (
    <div>
      <PageHeader
        title="Executive Approvals"
        subtitle="Sign-off workflow for budget, hiring, procurement, and policy exceptions."
      />
      <ApprovalQueue initial={APPROVALS} />
    </div>
  );
}
