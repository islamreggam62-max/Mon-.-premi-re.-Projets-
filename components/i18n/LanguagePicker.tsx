"use client";

import { Check, Languages } from "lucide-react";
import { LANGUAGES, t } from "@/lib/i18n/core";
import { cn } from "@/lib/utils";
import { useLanguage } from "./LanguageProvider";

/**
 * Interface language choice. "compact" is a small menu (welcome screen); "list"
 * shows every language as a choice (Settings). Names are written in their own
 * language so anyone can find theirs.
 */
export function LanguagePicker({ variant = "list" }: { variant?: "list" | "compact" }) {
  const { lang, setLang } = useLanguage();

  if (variant === "compact") {
    return (
      <label className="relative inline-flex items-center">
        <span className="sr-only">{t("Language")}</span>
        <Languages className="pointer-events-none absolute start-3 h-4 w-4 text-slate-400" aria-hidden="true" />
        <select
          value={lang}
          onChange={(event) => setLang(event.target.value as typeof lang)}
          className="field w-auto py-2 pe-8 ps-9 text-sm"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} lang={l.code} className="bg-base-800">
              {l.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div role="radiogroup" aria-label={t("Language")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {LANGUAGES.map((l) => {
        const selected = l.code === lang;
        return (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={selected}
            lang={l.code}
            onClick={() => setLang(l.code)}
            className={cn(
              "focus-ring flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium",
              selected ? "border-violet/60 bg-violet/15 text-slate-50" : "border-hairline text-slate-300 hover:border-white/25",
            )}
          >
            {l.label}
            {selected && <Check className="h-4 w-4 text-violet-300" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
