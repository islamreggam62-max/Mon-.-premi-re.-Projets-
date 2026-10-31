import type { Metadata } from "next";
import { Check, AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { dailyReports, type DailyReport } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Daily Reports" };

const moodTone: Record<DailyReport["mood"], BadgeTone> = {
  Great: "success",
  Good: "brand",
  Okay: "warning",
  Blocked: "danger",
};

export default function DailyReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Reports"
        description="End-of-day updates from the team: what shipped, what's blocked, how it feels."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Submit report
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {dailyReports.map((r) => (
          <Card key={r.id} sheen>
            <CardBody className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar initials={r.initials} size="lg" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {r.author}
                    </p>
                    <p className="text-xs text-subtle">
                      {r.role} · {r.date}
                    </p>
                  </div>
                </div>
                <Badge tone={moodTone[r.mood]} dot>
                  {r.mood}
                </Badge>
              </div>

              <p className="text-sm leading-relaxed text-muted">{r.summary}</p>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
                  Completed
                </p>
                <ul className="space-y-1.5">
                  {r.done.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                        <Check className="h-3 w-3" />
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {r.blockers.length > 0 ? (
                <div className="rounded-xl border border-warning/25 bg-warning/5 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Blockers
                  </p>
                  <ul className="space-y-1">
                    {r.blockers.map((b, i) => (
                      <li key={i} className="text-sm text-muted">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-success">No blockers reported.</p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
