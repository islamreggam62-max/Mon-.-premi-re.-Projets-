import type { Metadata } from "next";
import { ApprovalQueue } from "@/components/approvals/ApprovalQueue";
import { DemoBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { APPROVALS } from "@/lib/data/approvals";
import { DEMO_AS_OF } from "@/lib/data/meta";
import { PROJECTS } from "@/lib/data/projects";
import { TEAM } from "@/lib/data/team";

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return (
    <div>
      <PageHeader
        title="Executive Approvals"
        subtitle="Decision queue for budget sign-offs, contracts, hiring requests, and operational exceptions — most urgent first."
        action={<DemoBadge label="Static demo data" />}
      />
      <ApprovalQueue approvals={APPROVALS} people={TEAM} projects={PROJECTS} asOf={DEMO_AS_OF} />
    </div>
  );
}
