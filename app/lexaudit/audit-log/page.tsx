import type { Metadata } from "next";
import { LexPageHeader } from "@/components/lexaudit/LexPageHeader";
import { AuditLogView } from "@/components/lexaudit/AuditLogView";

export const metadata: Metadata = { title: { absolute: "LexAudit AI — Journal d'audit" } };

export default function AuditLogPage() {
  return (
    <div>
      <LexPageHeader titleKey="log.title" subtitleKey="log.subtitle" />
      <AuditLogView />
    </div>
  );
}
