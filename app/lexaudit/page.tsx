import type { Metadata } from "next";
import { LexPageHeader } from "@/components/lexaudit/LexPageHeader";
import { DashboardView } from "@/components/lexaudit/DashboardView";

export const metadata: Metadata = { title: { absolute: "LexAudit AI — Dashboard" } };

export default function LexDashboardPage() {
  return (
    <div>
      <LexPageHeader titleKey="dash.title" subtitleKey="dash.subtitle" />
      <DashboardView />
    </div>
  );
}
