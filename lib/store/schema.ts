import type { Approval, DailyReport, ISODate, Person, Project, Task } from "@/lib/types";

/**
 * Everything NEXORA keeps on the device, in one document. The shapes are the
 * domain types the UI already renders, and match the Supabase tables
 * (supabase/migrations), so moving this data to company accounts later is a copy.
 */
export const STORE_VERSION = 1;

/** "sample": the demonstration company; "company": the user's own company. */
export type DataMode = "sample" | "company";

export interface CompanyProfile {
  name: string;
  industry: string;
  timezone: string;
  /** ISO 4217 code, e.g. "DZD". */
  currency: string;
  createdAt: string;
}

export interface NexoraData {
  version: typeof STORE_VERSION;
  mode: DataMode;
  company: CompanyProfile;
  /** The person using this device (their reports, their approvals). */
  currentUserId: string;
  people: Person[];
  projects: Project[];
  tasks: Task[];
  reports: DailyReport[];
  /** Earlier submission days per person (sample data only; own data uses `reports`). */
  reportHistory: Record<string, ISODate[]>;
  approvals: Approval[];
  updatedAt: string;
}

/** Today in the device's time zone, "YYYY-MM-DD". */
export function todayISO(now = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** A new unique id. */
export function newId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

/** "Amina Benali" -> "AB". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}
