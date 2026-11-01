import type { ISODate, ISODateTime, Money } from "@/types";
import { diffInDays, toEpochMs } from "./dates";

/**
 * Display formatting. The locale and time zones are always explicit: the same
 * input yields the same string on the server and in every browser, so client
 * components hydrate without mismatches regardless of the viewer's locale.
 * Times use a 24-hour clock, which also avoids engine differences in AM/PM
 * spacing.
 */
const LOCALE = "en-US";

const DATE_FORMATS = {
  /** Oct 30 */
  short: new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", timeZone: "UTC" }),
  /** Oct 30, 2026 */
  medium: new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }),
  /** Friday, October 30, 2026 */
  long: new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }),
  /** Fri, Oct 30 */
  weekday: new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }),
} as const;

export type DateStyle = keyof typeof DATE_FORMATS;

export function formatDate(date: ISODate, style: DateStyle = "medium"): string {
  return DATE_FORMATS[style].format(toEpochMs(date));
}

/** `17:42` in the given IANA time zone. */
export function formatTime(instant: ISODateTime, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(Date.parse(instant));
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

/** `value` is already a percentage (0–100). */
export function formatPercent(value: number, fractionDigits = 0): string {
  return `${formatNumber(value, fractionDigits)}%`;
}

/** Signed with a typographic minus: `+2`, `−3`, `0`. */
export function formatSigned(value: number, fractionDigits = 0): string {
  const magnitude = formatNumber(Math.abs(value), fractionDigits);
  if (value > 0) return `+${magnitude}`;
  if (value < 0) return `−${magnitude}`;
  return magnitude;
}

export function formatMoney(money: Money, options: { readonly compact?: boolean } = {}): string {
  const compact = options.compact ?? false;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: money.currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 0,
  }).format(money.amount);
}

export function formatHours(hours: number): string {
  return `${formatNumber(hours, 1)} h`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** Human distance between two dates: "today", "in 3 days", "2 days ago". */
export function formatRelativeDays(from: ISODate, to: ISODate): string {
  const days = diffInDays(from, to);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

/** Deadline phrasing used across tasks, milestones and approvals. */
export function describeDue(due: ISODate, today: ISODate): string {
  const days = diffInDays(today, due);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `Due in ${days} days`;
  return days === -1 ? "1 day overdue" : `${-days} days overdue`;
}

/** "A", "A and B", "A, B and C". */
export function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "Amina Benali" → "AB"; first and last word. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}
