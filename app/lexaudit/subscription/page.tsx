import type { Metadata } from "next";
import { LexPageHeader } from "@/components/lexaudit/LexPageHeader";
import { SubscriptionView } from "@/components/lexaudit/SubscriptionView";

export const metadata: Metadata = { title: { absolute: "LexAudit AI — Abonnement" } };

export default function SubscriptionPage() {
  return (
    <div>
      <LexPageHeader titleKey="sub.title" subtitleKey="sub.subtitle" />
      <SubscriptionView />
    </div>
  );
}
