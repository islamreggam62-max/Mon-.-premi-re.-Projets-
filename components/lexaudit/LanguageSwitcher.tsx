"use client";

import { Check, Languages } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useLang } from "@/components/lexaudit/LangProvider";
import { LANGS } from "@/lib/lexaudit/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  const active = LANGS.find((l) => l.id === lang);

  return (
    <Popover
      align="right"
      panelLabel={t("top.language")}
      triggerLabel={t("top.language")}
      triggerClassName="h-9 px-3 inline-flex items-center gap-2 rounded-xl border border-hairline bg-white/[0.03] text-sm text-slate-200 hover:border-white/20 hover:bg-white/[0.06]"
      trigger={() => (
        <>
          <Languages className="h-4 w-4 text-violet-300" aria-hidden="true" />
          <span className="font-medium">{active?.label}</span>
        </>
      )}
      panelClassName="w-44 p-1.5"
    >
      {(close) => (
        <ul role="menu" aria-label={t("top.language")}>
          {LANGS.map((l) => {
            const selected = l.id === lang;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setLang(l.id);
                    close();
                  }}
                  dir={l.dir}
                  className={cn(
                    "focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm",
                    selected ? "bg-violet/15 text-slate-50" : "text-slate-200 hover:bg-white/5",
                  )}
                >
                  <span>{l.label}</span>
                  {selected && <Check className="h-4 w-4 text-violet-300" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Popover>
  );
}
