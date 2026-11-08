"use client";

import { t } from "@/lib/i18n/core";
import { Plus, Smartphone } from "lucide-react";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { useNexora } from "@/lib/store/StoreProvider";

/** Page badge: "Sample data" for the demonstration company, "On this device" for the user's own. */
export function DataBadge() {
  const { data } = useNexora();
  if (data.mode === "sample") return <DemoBadge label="Sample data" />;
  return (
    <Badge tone="slate">
      <Smartphone className="h-3 w-3" aria-hidden="true" />
      {t("On this device")}
    </Badge>
  );
}

/** Header actions: the data badge and a primary "New …" button. */
export function HeaderActions({ label, onNew }: { label: string; onNew: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DataBadge />
      <NewButton label={label} onClick={onNew} />
    </div>
  );
}

export function NewButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-primary px-4 py-2 text-sm">
      <Plus className="h-4 w-4" aria-hidden="true" />
      {t(label)}
    </button>
  );
}

/** Mean of a list, rounded; null when the list is empty (shown as "—"). */
export function mean(values: number[]): number | null {
  return values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null;
}

export function pct(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}
