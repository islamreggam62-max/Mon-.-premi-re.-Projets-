"use client";

import { useState } from "react";
import { Stamp } from "lucide-react";
import { ApprovalFormDialog } from "@/components/forms/ApprovalForm";
import { ApprovalQueue } from "@/components/approvals/ApprovalQueue";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { asOfDay } from "@/lib/store/derived";
import { useNexora } from "@/lib/store/StoreProvider";
import type { Approval } from "@/lib/types";
import { HeaderActions, NewButton } from "./shared";

export function ApprovalsView() {
  const { data, actions } = useNexora();
  const [editing, setEditing] = useState<Approval | "new" | null>(null);
  const asOf = asOfDay(data);

  return (
    <div>
      <PageHeader
        title="Executive Approvals"
        subtitle="Decision queue for budget sign-offs, contracts, hiring requests, and operational exceptions, most urgent first."
        action={<HeaderActions label="New request" onNew={() => setEditing("new")} />}
      />

      {data.approvals.length === 0 ? (
        <EmptyState
          icon={Stamp}
          title="No approval requests yet"
          description="Log the budgets, contracts, hires, and exceptions waiting on a decision, then approve or reject them here."
          action={<NewButton label="New request" onClick={() => setEditing("new")} />}
        />
      ) : (
        <ApprovalQueue
          approvals={data.approvals}
          people={data.people}
          projects={data.projects}
          asOf={asOf}
          onDecide={(a, status) => actions.decideApproval(a.id, status, undefined, asOf)}
          onEdit={setEditing}
        />
      )}

      <ApprovalFormDialog open={editing !== null} onClose={() => setEditing(null)} approval={editing === "new" || editing === null ? undefined : editing} />
    </div>
  );
}
