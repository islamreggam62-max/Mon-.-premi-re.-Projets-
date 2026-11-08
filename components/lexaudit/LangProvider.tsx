"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_LANG, dirOf, translate, type Lang } from "@/lib/lexaudit/i18n";

const STORAGE_KEY = "lexaudit:lang";

interface LangContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  /** Translate a key into the active language. */
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Restore the per-viewer language after mount (keeps SSR markup stable).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === "ar" || saved === "fr" || saved === "en") setLangState(saved);
    } catch {
      /* storage unavailable: keep the default */
    }
  }, []);

  // Reflect language + direction onto the document while LexAudit is mounted,
  // and restore the document defaults when leaving the product area.
  useEffect(() => {
    const el = document.documentElement;
    const prevLang = el.getAttribute("lang");
    const prevDir = el.getAttribute("dir");
    el.setAttribute("lang", lang);
    el.setAttribute("dir", dirOf(lang));
    return () => {
      el.setAttribute("lang", prevLang ?? "en");
      if (prevDir) el.setAttribute("dir", prevDir);
      else el.removeAttribute("dir");
    };
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: preference lasts for this page view only */
    }
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      dir: dirOf(lang),
      setLang,
      t: (key: string) => translate(key, lang),
    }),
    [lang, setLang],
  );

  return (
    <LangContext.Provider value={value}>
      <div dir={value.dir} lang={lang} data-lexaudit className="lex-root">
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within a LangProvider");
  return ctx;
}
