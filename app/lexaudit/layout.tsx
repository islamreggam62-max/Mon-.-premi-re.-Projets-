import type { Metadata } from "next";
import { LangProvider } from "@/components/lexaudit/LangProvider";
import { LexShell } from "@/components/lexaudit/LexShell";

export const metadata: Metadata = {
  title: { absolute: "LexAudit AI — مدقّق العقود الذكي" },
  description:
    "LexAudit AI — audit intelligent de contrats et cahiers des charges : indice de risque, constats clause par clause, protections manquantes et rédactions proposées.",
};

/**
 * LexAudit product area. The language provider sets direction (RTL/LTR) for the
 * whole sub-app; the shell supplies the sidebar and top bar. Pages below render
 * inside this frame and stay server components so they keep their own metadata.
 */
export default function LexAuditLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <LexShell>{children}</LexShell>
    </LangProvider>
  );
}
