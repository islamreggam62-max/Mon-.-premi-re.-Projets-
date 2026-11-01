/**
 * Presentation helpers.
 *
 * Dates and numbers are formatted by hand, in UTC, so the server render and the
 * browser hydration always produce identical strings regardless of the viewer's
 * time zone or ICU version (avoids React hydration mismatches).
 */
import { DEMO_AS_OF } from "@/lib/data/meta";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ----------------------------------------------------------------------------
 * Dates
 * ------------------------------------------------------------------------- */

const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "YYYY-MM-DD" (or a full ISO timestamp) → epoch ms at UTC midnight of that day. */
export function dayValue(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `ref` to `iso` (negative when `iso` is in the past). */
export function daysUntil(iso: string, ref: string = DEMO_AS_OF): number {
  return Math.round((dayValue(iso) - dayValue(ref)) / DAY_MS);
}

function dateParts(iso: string) {
  const d = new Date(dayValue(iso));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate(), wd: d.getUTCDay() };
}

/** "Oct 30, 2026" */
export function formatDate(iso: string): string {
  const { y, m, day } = dateParts(iso);
  return `${MONTHS[m]} ${day}, ${y}`;
}

/** "Oct 30" */
export function formatShortDate(iso: string): string {
  const { m, day } = dateParts(iso);
  return `${MONTHS[m]} ${day}`;
}

/** "Friday, Oct 30, 2026" */
export function formatLongDate(iso: string): string {
  const { y, m, day, wd } = dateParts(iso);
  return `${WEEKDAYS[wd]}, ${MONTHS[m]} ${day}, ${y}`;
}

/** "5:42 PM UTC" */
export function formatTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return isoDateTime;
  const h = d.getUTCHours();
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${h < 12 ? "AM" : "PM"} UTC`;
}

/** "Today", "Yesterday", "Tomorrow", "in 4 days", "3 days ago". */
export function relativeDay(iso: string, ref: string = DEMO_AS_OF): string {
  const d = daysUntil(iso, ref);
  if (d === 0) return "Today";
  if (d === -1) return "Yesterday";
  if (d === 1) return "Tomorrow";
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}

/** Deadline phrasing: "Due today", "Due in 3 days", "2 days overdue". */
export function dueLabel(iso: string, ref: string = DEMO_AS_OF): string {
  const d = daysUntil(iso, ref);
  if (d < -1) return `${-d} days overdue`;
  if (d === -1) return "1 day overdue";
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d} days`;
}

/* ----------------------------------------------------------------------------
 * Numbers
 * ------------------------------------------------------------------------- */

function groupThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "$85,000" */
export function formatCurrency(value: number): string {
  return `${value < 0 ? "-" : ""}$${groupThousands(Math.abs(value))}`;
}

/** "$85K", "$1.2M" */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
