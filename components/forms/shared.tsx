"use client";

import { t } from "@/lib/i18n/core";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Person } from "@/lib/types";

/** Options for a person picker, sorted by name. */
export function peopleOptions(people: Person[], { includeNone = false, noneLabel = "Nobody" } = {}) {
  const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ value: p.id, label: `${p.name}${p.title ? ` · ${p.title}` : ""}` }));
  return includeNone ? [{ value: "", label: noneLabel }, ...sorted] : sorted;
}

/** Whole number in [min, max], or null when the text is not one. */
export function parseWhole(text: string, min: number, max: number): number | null {
  if (!/^\s*-?\d+\s*$/.test(text)) return null;
  const n = Number(text);
  return n >= min && n <= max ? n : null;
}

/** Amount (digits, optional spaces or separators), or null. */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[\s,]/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned));
}

/** One line per item; blank lines dropped. */
export function lines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Delete button with an inline confirmation step; disabled with a reason when deletion is blocked. */
export function DeleteButton({ label, onConfirm, blockedReason }: { label: string; onConfirm: () => void; blockedReason?: string }) {
  const [confirm, setConfirm] = useState(false);
  if (blockedReason) return <p className="max-w-xs text-xs text-slate-400">{blockedReason}</p>;
  if (!confirm) {
    return (
      <button type="button" className="btn btn-danger px-3 py-2 text-sm" onClick={() => setConfirm(true)}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {t(label)}
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-300">{t("Delete for good?")}</span>
      <button type="button" className="btn btn-danger px-3 py-2 text-sm" onClick={onConfirm}>
        {t("Delete")}
      </button>
      <button type="button" className="btn btn-secondary px-3 py-2 text-sm" onClick={() => setConfirm(false)}>
        {t("Keep")}
      </button>
    </span>
  );
}
