import { STORE_VERSION, type NexoraData } from "./schema";

/** localStorage key of the device copy. Survives app updates; removed with the app's storage. */
export const DATA_KEY = "nexora:data";

const ARRAY_FIELDS = ["people", "projects", "tasks", "reports", "approvals"] as const;

/**
 * Checks that a parsed value is a NEXORA document this version can read.
 * Returns the reason when it is not, so an import can say what is wrong.
 */
export function validateData(value: unknown): { ok: true; data: NexoraData } | { ok: false; reason: string } {
  if (!value || typeof value !== "object") return { ok: false, reason: "This is not a NEXORA backup." };
  const v = value as Partial<NexoraData>;
  if (v.version !== STORE_VERSION) return { ok: false, reason: "This backup comes from another version of NEXORA." };
  if (v.mode !== "sample" && v.mode !== "company") return { ok: false, reason: "This backup has no data mode." };
  if (!v.company || typeof v.company.name !== "string") return { ok: false, reason: "This backup has no company profile." };
  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(v[field])) return { ok: false, reason: `This backup is missing its ${field}.` };
  }
  if (typeof v.currentUserId !== "string" || !v.people!.some((p) => p?.id === v.currentUserId)) {
    return { ok: false, reason: "This backup does not say who uses it." };
  }
  return { ok: true, data: { ...v, reportHistory: v.reportHistory ?? {} } as NexoraData };
}

/** Reads the device copy: the document, null when there is none, or "unreadable". */
export function loadData(): NexoraData | null | "unreadable" {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(DATA_KEY);
  } catch {
    return "unreadable";
  }
  if (!raw) return null;
  try {
    const result = validateData(JSON.parse(raw));
    return result.ok ? result.data : "unreadable";
  } catch {
    return "unreadable";
  }
}

/** Writes the device copy. Returns false when the browser refused (storage full or blocked). */
export function saveData(data: NexoraData): boolean {
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearData(): void {
  try {
    window.localStorage.removeItem(DATA_KEY);
  } catch {
    /* nothing stored, or storage blocked */
  }
}
