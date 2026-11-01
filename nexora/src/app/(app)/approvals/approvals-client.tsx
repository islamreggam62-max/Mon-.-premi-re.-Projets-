"use client";

import { useMemo, useState } from "react";
import { Check, X, Clock, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { type Approval, type TaskPriority } from "@/lib/demo-data";

type Decision = "pending" | "approved" | "rejected";

const priorityTone: Record<TaskPriority, BadgeTone> = {
  Low: "neutral",
  Medium: "info",
  High: "warning",
  Urgent: "danger",
};

export function ApprovalsClient({ approvals }: { approvals: Approval[] }) {
  // Local, in-memory only. Decisions reset on reload — persisting them is a
  // follow-up (a Supabase update to approvals.decision via a Server Action).
  const [decisions, setDecisions] = useState<Record<string, Decision>>(
    () =>
      Object.fromEntries(approvals.map((a) => [a.id, "pending"])) as Record<
        string,
        Decision
      >
  );

  const pendingCount = useMemo(
    () => Object.values(decisions).filter((d) => d === "pending").length,
    [decisions]
  );

  function decide(id: string, decision: Decision) {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Requests awaiting an executive decision."
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-info/25 bg-info/5 px-4 py-3 text-sm text-info">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Approve / Reject update this screen only — decisions are held in
          memory and reset on reload. Persisting them to the database is a
          planned follow-up (a Server Action writing to{" "}
          <code className="text-xs">approvals.decision</code>).
        </p>
      </div>

      <Card sheen>
        <CardHeader
          title="Decision queue"
          subtitle={`${pendingCount} of ${approvals.length} still pending`}
        />
        <CardBody className="divide-y divide-border/60 p-0">
          {approvals.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-subtle">
              No approvals in the queue.
            </p>
          ) : (
            approvals.map((a) => {
              const decision = decisions[a.id];
              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                >
                  <Avatar initials={a.initials} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {a.title}
                      </p>
                      <Badge tone="neutral">{a.type}</Badge>
                      <Badge tone={priorityTone[a.priority]} dot>
                        {a.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
                      <Clock className="h-3 w-3" />
                      {a.requestedBy} · {a.submitted}
                      {a.amount ? (
                        <span className="ml-1 font-medium text-muted">
                          · {a.amount}
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {decision === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decide(a.id, "rejected")}
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => decide(a.id, "approved")}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={decision === "approved" ? "success" : "danger"}
                          dot
                        >
                          {decision === "approved" ? "Approved" : "Rejected"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => decide(a.id, "pending")}
                        >
                          Undo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}
