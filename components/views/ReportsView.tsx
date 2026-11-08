"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { ReportFormDialog } from "@/components/forms/ReportForm";
import { ReportFeed } from "@/components/reports/ReportFeed";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { asOfDay } from "@/lib/store/derived";
import { useNexora } from "@/lib/store/StoreProvider";
import type { DailyReport } from "@/lib/types";
import { HeaderActions, NewButton } from "./shared";

export function ReportsView() {
  const { data } = useNexora();
  const [editing, setEditing] = useState<DailyReport | "new" | null>(null);

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        subtitle="Structured end-of-day logs (completed work, priorities, and blockers) with submission tracking."
        action={<HeaderActions label="Add report" onNew={() => setEditing("new")} />}
      />

      {data.reports.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No daily reports yet"
          description="Record each person's end-of-day update: what they finished, what comes next, and what blocks them."
          action={<NewButton label="Add report" onClick={() => setEditing("new")} />}
        />
      ) : (
        <ReportFeed reports={data.reports} history={data.reportHistory} people={data.people} asOf={asOfDay(data)} onEdit={setEditing} />
      )}

      <ReportFormDialog open={editing !== null} onClose={() => setEditing(null)} report={editing === "new" || editing === null ? undefined : editing} />
    </div>
  );
}
