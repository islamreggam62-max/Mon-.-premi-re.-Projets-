import { ar } from "./ar";
import { fr } from "./fr";
import { zh } from "./zh";

/**
 * NEXORA's interface languages. English strings in the code are the keys: a
 * catalog maps each one to its translation, and a missing key shows the English
 * text. Count phrases use the language's plural rules (Arabic has six forms).
 */
export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "zh", label: "中文", dir: "ltr" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>>;
export type Entry = string | PluralForms;
export type Catalog = Record<string, Entry>;
type Vars = Record<string, string | number>;

const CATALOGS: Record<Lang, Catalog> = { en: {}, fr, ar, zh };

let current: Lang = "en";

/** Set by the language provider before the interface renders. */
export function setLanguage(lang: Lang): void {
  current = lang;
}

export function getLanguage(): Lang {
  return current;
}

export function isLang(value: unknown): value is Lang {
  return LANGUAGES.some((l) => l.code === value);
}

export function isRtl(lang: Lang = current): boolean {
  return lang === "ar";
}

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

function pick(forms: PluralForms, n: number): string | undefined {
  return forms[new Intl.PluralRules(current).select(n)] ?? forms.other;
}

/** "Owner|role" → "Owner": a "|context" suffix tells apart keys whose English is the same. */
function english(key: string): string {
  const bar = key.indexOf("|");
  return bar === -1 ? key : key.slice(0, bar);
}

/** Translates an English interface string, filling {placeholders} from `vars`. */
export function t(key: string, vars?: Vars): string {
  const entry = CATALOGS[current][key];
  if (entry === undefined) return fill(english(key), vars);
  const text = typeof entry === "string" ? entry : pick(entry, Number(vars?.n ?? 0)) ?? key;
  return fill(text, vars);
}

/**
 * A count phrase: tn(3, "{n} task", "{n} tasks"). The English plural form is the
 * catalog key; its entry holds the language's plural forms.
 */
export function tn(n: number, one: string, other: string, vars?: Vars): string {
  const all = { ...vars, n };
  const entry = current === "en" ? undefined : CATALOGS[current][other];
  if (entry === undefined) return fill(english(n === 1 ? one : other), all);
  const text = typeof entry === "string" ? entry : pick(entry, n) ?? other;
  return fill(text, all);
}

/** BCP 47 tag for Intl formatting. Arabic uses the Algerian locale, which writes 0–9 digits. */
export function intlLocale(lang: Lang = current): string {
  return { en: "en-US", fr: "fr-FR", ar: "ar-DZ", zh: "zh-CN" }[lang];
}
