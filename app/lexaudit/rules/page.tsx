import type { Metadata } from "next";
import { LexPageHeader } from "@/components/lexaudit/LexPageHeader";
import { RulesView } from "@/components/lexaudit/RulesView";

export const metadata: Metadata = { title: { absolute: "LexAudit AI — Règles réglementaires" } };

export default function RulesPage() {
  return (
    <div>
      <LexPageHeader titleKey="rules.title" subtitleKey="rules.subtitle" />
      <RulesView />
    </div>
  );
}
