import type { Metadata } from "next";
import { LexPageHeader } from "@/components/lexaudit/LexPageHeader";
import { AuditResults } from "@/components/lexaudit/AuditResults";
import { AUDIT_RESULTS } from "@/lib/lexaudit/data/audits";
import { TENDER_RESULT } from "@/lib/lexaudit/data/tender";

export const metadata: Metadata = { title: { absolute: "LexAudit AI — Résultat d'audit" } };

// Order: supply (flagship), tender, NDA.
const [SUPPLY, NDA] = AUDIT_RESULTS;
const RESULTS = [SUPPLY, TENDER_RESULT, NDA];

export default function ResultsPage() {
  return (
    <div>
      <LexPageHeader titleKey="res.title" subtitleKey="res.subtitle" />
      <AuditResults results={RESULTS} storageDefault />
    </div>
  );
}
