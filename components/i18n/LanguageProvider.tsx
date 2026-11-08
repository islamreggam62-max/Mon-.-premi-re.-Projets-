"use client";

import { Fragment, createContext, useCallback, useContext, useEffect, useState } from "react";
import { LANGUAGES, isLang, isRtl, setLanguage, type Lang } from "@/lib/i18n/core";

const KEY = "nexora:language";

/** The saved choice, or the device's language when NEXORA has it, else English. */
function initialLanguage(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Storage blocked: fall back to the device language.
  }
  const device = (navigator.languages?.[0] ?? navigator.language ?? "en").slice(0, 2).toLowerCase();
  return isLang(device) ? device : "en";
}

const LanguageContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({ lang: "en", setLang: () => {} });

/**
 * Interface language for the app. The static HTML is English; the saved or
 * device language applies right after the first render (the store is still
 * loading then, so nothing flashes). Changing the language re-renders the whole
 * app under it; the data store sits above and keeps its state.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => setLangState(initialLanguage()), []);

  setLanguage(lang);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang === "zh" ? "zh-Hans" : lang;
    root.dir = isRtl(lang) ? "rtl" : "ltr";
  }, [lang]);

  // Leaving the app (the website pages are English): restore the defaults.
  useEffect(
    () => () => {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
      setLanguage("en");
    },
    [],
  );

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Not saved: the choice lasts until the app is closed.
    }
    setLangState(next);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <Fragment key={lang}>{children}</Fragment>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export { LANGUAGES };
