import type { Metadata } from "next";
import { LexPageHeader } from "@/components/lexaudit/LexPageHeader";
import { AuditResults } from "@/components/lexaudit/AuditResults";
import { TENDER_RESULT } from "@/lib/lexaudit/data/tender";

export const metadata: Metadata = { title: { absolute: "LexAudit AI — Cahiers des charges" } };

export default function TenderReviewPage() {
  return (
    <div>
      <LexPageHeader titleKey="tender.title" subtitleKey="tender.subtitle" />
      <AuditResults results={[TENDER_RESULT]} />
    </div>
  );
}
