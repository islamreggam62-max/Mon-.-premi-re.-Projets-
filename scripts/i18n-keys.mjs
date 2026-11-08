// Lists every interface string the app translates and checks that each
// catalog (lib/i18n/fr.ts, ar.ts, zh.ts) has it.
//   node scripts/i18n-keys.mjs           → report missing keys, exit 1 if any
//   node scripts/i18n-keys.mjs --json    → print all keys as JSON
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app/(app)", "components", "lib"];
const SKIP = ["components/marketing", "components/settings", "components/ai", "lib/data", "lib/i18n"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (SKIP.some((s) => path.startsWith(s))) continue;
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(tsx?|mjs)$/.test(name)) out.push(path);
  }
  return out;
}

const STR = String.raw`"((?:[^"\\]|\\.)*)"`;
const keys = new Map(); // key -> { plural: one-form | null, files: Set }
function add(key, file, one = null) {
  key = JSON.parse(`"${key}"`);
  if (!/[A-Za-z]/.test(key)) return;
  const entry = keys.get(key) ?? { one: null, files: new Set() };
  if (one) entry.one = JSON.parse(`"${one}"`);
  entry.files.add(file);
  keys.set(key, entry);
}

// Props the shared components translate themselves (components/ui).
const PROPS = ["label", "hint", "placeholder", "title", "subtitle", "description", "submitLabel"];
const OBJ_PROPS = ["label", "detail", "body", "action", "hint"];

for (const file of ROOTS.flatMap((r) => walk(r))) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(new RegExp(String.raw`\b(?:t|tr)\(\s*${STR}`, "g"))) add(m[1], file);
  for (const m of src.matchAll(new RegExp(String.raw`,\s*${STR}\s*,\s*${STR}`, "g"))) if (m[1].includes("{n}") && m[2].includes("{n}")) add(m[2], file, m[1]);
  for (const prop of PROPS) {
    for (const m of src.matchAll(new RegExp(String.raw`\b${prop}=${STR}`, "g"))) add(m[1], file);
    for (const m of src.matchAll(new RegExp(String.raw`\b${prop}=\{[^{}]*?\?\s*${STR}\s*:\s*${STR}\s*\}`, "g"))) {
      add(m[1], file);
      add(m[2], file);
    }
  }
  for (const prop of OBJ_PROPS) for (const m of src.matchAll(new RegExp(String.raw`\b${prop}:\s*${STR}`, "g"))) add(m[1], file);
  // Label maps read through translated() (lib/labels.ts, lib/metrics.ts) and the AMOUNT_LABEL maps.
  for (const block of src.matchAll(/translated\(\{([\s\S]*?)\}\)/g)) for (const m of block[1].matchAll(new RegExp(String.raw`:\s*${STR}`, "g"))) add(m[1], file);
  for (const block of src.matchAll(/AMOUNT_LABEL[^=]*=\s*\{([\s\S]*?)\}/g)) for (const m of block[1].matchAll(new RegExp(String.raw`:\s*${STR}`, "g"))) add(m[1], file);
  // Department names (departmentLabel) and the navigation (lib/nav.ts).
  for (const block of src.matchAll(/DEPARTMENT_ORDER: Department\[\] = \[([\s\S]*?)\]/g)) for (const m of block[1].matchAll(new RegExp(STR, "g"))) add(m[1], file);
  if (file.endsWith("lib/nav.ts")) for (const m of src.matchAll(new RegExp(String.raw`(?:label|description):\s*${STR}`, "g"))) add(m[1], file);
}
// Read from variables, not literals.
for (const k of ["Offline", "How NEXORA works", "Page not found", "Algerian dinar", "US dollar", "Euro", "Moroccan dirham", "Tunisian dinar", "Saudi riyal", "UAE dirham", "Qatari riyal", "Kuwaiti dinar", "Pound sterling"]) add(JSON.stringify(k).slice(1, -1), "(extra)");

// Context suffixes ("Owner|role") are part of the key.
if (process.argv.includes("--json")) {
  console.log(JSON.stringify([...keys].map(([key, v]) => (v.one ? { key, one: v.one } : { key })), null, 2));
  process.exit(0);
}

let missing = 0;
for (const lang of ["fr", "ar", "zh"]) {
  const src = readFileSync(`lib/i18n/${lang}.ts`, "utf8");
  const have = new Set([...src.matchAll(new RegExp(String.raw`^\s*${STR}:`, "gm"))].map((m) => JSON.parse(`"${m[1]}"`)));
  const lacking = [...keys.keys()].filter((k) => !have.has(k));
  missing += lacking.length;
  console.log(`${lang}: ${keys.size - lacking.length}/${keys.size} keys`);
  for (const k of lacking.slice(0, 40)) console.log(`  missing: ${JSON.stringify(k)}`);
  if (lacking.length > 40) console.log(`  … and ${lacking.length - 40} more`);
}
process.exit(missing ? 1 : 0);
