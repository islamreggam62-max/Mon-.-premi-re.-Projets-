import type { ClockTime, ISODate, ISODateTime } from "@/types";

/**
 * Calendar arithmetic on ISO dates using integer day numbers.
 *
 * Nothing here reads the runtime clock (`Date.now()` / `new Date()`): every
 * relative computation is anchored to the workspace reference date. That keeps
 * results identical on server and client and lets every route prerender.
 */

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (value: number): string => String(value).padStart(2, "0");

/** Days since 1970-01-01 (UTC) for a calendar date. */
export function toDayNumber(date: ISODate): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new RangeError(`Invalid ISO date: ${date}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / MS_PER_DAY;
}

/** Inverse of `toDayNumber` (Howard Hinnant's civil-from-days algorithm). */
export function fromDayNumber(dayNumber: number): ISODate {
  const z = dayNumber + 719_468;
  const era = Math.floor(z / 146_097);
  const dayOfEra = z - era * 146_097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1_460) +
      Math.floor(dayOfEra / 36_524) -
      Math.floor(dayOfEra / 146_096)) /
      365,
  );
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthIndex = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * monthIndex + 2) / 5) + 1;
  const month = monthIndex < 10 ? monthIndex + 3 : monthIndex - 9;
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
  return `${year}-${pad2(month)}-${pad2(day)}` as ISODate;
}

/** Epoch milliseconds at 00:00 UTC of a calendar date (for Intl formatting). */
export function toEpochMs(date: ISODate): number {
  return toDayNumber(date) * MS_PER_DAY;
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromDayNumber(toDayNumber(date) + days);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function diffInDays(from: ISODate, to: ISODate): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** 0 = Sunday … 6 = Saturday. Day 0 (1970-01-01) was a Thursday. */
export function dayOfWeek(date: ISODate): number {
  return (((toDayNumber(date) + 4) % 7) + 7) % 7;
}

export function isWeekend(date: ISODate): boolean {
  const day = dayOfWeek(date);
  return day === 0 || day === 6;
}

export function startOfWeek(date: ISODate, weekStartsOn: "monday" | "sunday" = "monday"): ISODate {
  const day = dayOfWeek(date);
  const offset = weekStartsOn === "monday" ? (day + 6) % 7 : day;
  return addDays(date, -offset);
}

/** Inclusive range check. */
export function isWithin(date: ISODate, from: ISODate, to: ISODate): boolean {
  const value = toDayNumber(date);
  return value >= toDayNumber(from) && value <= toDayNumber(to);
}

/** Wall-clock date and time of an instant in an IANA time zone. */
export function zonedDateTime(
  instant: ISODateTime,
  timeZone: string,
): { readonly date: ISODate; readonly time: ClockTime } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(Date.parse(instant));
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}` as ISODate,
    time: `${part("hour")}:${part("minute")}` as ClockTime,
  };
}

/** Compares zero-padded `HH:MM` strings; negative when `a` is earlier. */
export function compareClockTimes(a: ClockTime, b: ClockTime): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
