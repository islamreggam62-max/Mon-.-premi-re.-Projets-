"use client";

import { t } from "@/lib/i18n/core";
import { RotateCw } from "lucide-react";

/** Retries the page the user originally asked for (same-origin paths only). */
export function RetryButton() {
  function retry() {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from && from.startsWith("/") && !from.startsWith("//")) window.location.href = from;
    else window.location.reload();
  }

  return (
    <button type="button" onClick={retry} className="btn btn-primary">
      <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> {t("Try again")}
    </button>
  );
}
