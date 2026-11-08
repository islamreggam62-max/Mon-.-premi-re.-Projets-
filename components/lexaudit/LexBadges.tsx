"use client";

import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { useLang } from "@/components/lexaudit/LangProvider";
import type { DocumentType, Party, Severity, Verdict } from "@/lib/lexaudit/types";

const SEVERITY_TONE: Record<Severity, Tone> = { critical: "rose", major: "amber", minor: "slate" };
const SEVERITY_ICON: Record<Severity, LucideIcon> = {
  critical: OctagonAlert,
  major: TriangleAlert,
  minor: Info,
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { t } = useLang();
  const Icon = SEVERITY_ICON[severity];
  return (
    <Badge tone={SEVERITY_TONE[severity]}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t(`sev.${severity}`)}
    </Badge>
  );
}

const VERDICT_TONE: Record<Verdict, Tone> = {
  signable: "emerald",
  conditional: "amber",
  "not-signable": "rose",
};
const VERDICT_ICON: Record<Verdict, LucideIcon> = {
  signable: CircleCheck,
  conditional: CircleAlert,
  "not-signable": CircleX,
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { t } = useLang();
  const Icon = VERDICT_ICON[verdict];
  return (
    <Badge tone={VERDICT_TONE[verdict]} dot={false}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t(`verdict.${verdict}`)}
    </Badge>
  );
}

export function DocTypeBadge({ type }: { type: DocumentType }) {
  const { t } = useLang();
  return <Badge tone="violet">{t(`doc.${type}`)}</Badge>;
}

export function PartyBadge({ party }: { party: Party }) {
  const { t } = useLang();
  return <Badge tone="sky">{t(`party.${party}`)}</Badge>;
}
