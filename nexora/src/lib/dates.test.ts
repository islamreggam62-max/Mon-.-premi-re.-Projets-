import { describe, expect, it } from "vitest";
import {
  addDays,
  dayOfWeek,
  diffInDays,
  fromDayNumber,
  isWithin,
  startOfWeek,
  toDayNumber,
  zonedDateTime,
} from "./dates";

describe("calendar arithmetic", () => {
  it("round-trips every day across leap years and century rules", () => {
    for (let day = toDayNumber("1999-12-25"); day <= toDayNumber("2101-03-05"); day += 1) {
      expect(toDayNumber(fromDayNumber(day))).toBe(day);
    }
  });

  it("handles month and leap-day boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2100-02-28", 1)).toBe("2100-03-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(diffInDays("2026-04-01", "2026-12-15")).toBe(258);
  });

  it("knows the weekday and the start of the week", () => {
    expect(dayOfWeek("2026-10-30")).toBe(5); // Friday
    expect(startOfWeek("2026-10-30")).toBe("2026-10-26");
    expect(startOfWeek("2026-11-01")).toBe("2026-10-26"); // Sunday belongs to the Monday week
    expect(startOfWeek("2026-11-01", "sunday")).toBe("2026-11-01");
  });

  it("checks inclusive ranges", () => {
    expect(isWithin("2026-10-26", "2026-10-26", "2026-11-01")).toBe(true);
    expect(isWithin("2026-11-02", "2026-10-26", "2026-11-01")).toBe(false);
  });

  it("rejects malformed dates instead of producing NaN", () => {
    expect(() => toDayNumber("2026-1-30" as never)).toThrow(RangeError);
  });

  it("reads wall-clock time in an IANA zone", () => {
    expect(zonedDateTime("2026-10-30T18:41:00+01:00", "Africa/Algiers")).toEqual({
      date: "2026-10-30",
      time: "18:41",
    });
    // 23:30 in Algiers is already the next day in Singapore.
    expect(zonedDateTime("2026-10-30T23:30:00+01:00", "Asia/Singapore")).toEqual({
      date: "2026-10-31",
      time: "06:30",
    });
  });
});
