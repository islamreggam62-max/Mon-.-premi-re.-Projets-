"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { DemoBadge } from "@/components/ui/Badge";
import { useLang } from "@/components/lexaudit/LangProvider";

/** Translated page header for LexAudit sections, with a standing demo badge. */
export function LexPageHeader({
  titleKey,
  subtitleKey,
  showDemo = true,
}: {
  titleKey: string;
  subtitleKey?: string;
  showDemo?: boolean;
}) {
  const { t } = useLang();
  return (
    <PageHeader
      title={t(titleKey)}
      subtitle={subtitleKey ? t(subtitleKey) : undefined}
      action={showDemo ? <DemoBadge label={t("common.demo")} /> : undefined}
    />
  );
}
