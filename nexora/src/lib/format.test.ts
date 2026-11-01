import { describe, expect, it } from "vitest";
import {
  describeDue,
  formatDate,
  formatMoney,
  formatPercent,
  formatSigned,
  formatTime,
  initials,
  joinList,
  pluralize,
} from "./format";

describe("display formatting", () => {
  it("formats calendar dates without depending on the runtime time zone", () => {
    expect(formatDate("2026-10-30")).toBe("Oct 30, 2026");
    expect(formatDate("2026-10-30", "short")).toBe("Oct 30");
    expect(formatDate("2026-10-30", "long")).toBe("Friday, October 30, 2026");
  });

  it("formats times on a 24-hour clock in the given zone", () => {
    expect(formatTime("2026-10-30T18:22:00+01:00", "Africa/Algiers")).toBe("18:22");
    expect(formatTime("2026-10-30T18:22:00+01:00", "Europe/London")).toBe("17:22");
  });

  it("formats money in standard and compact notation", () => {
    expect(formatMoney({ amount: 180_000, currency: "USD" })).toBe("$180,000");
    expect(formatMoney({ amount: 1_200_000, currency: "USD" }, { compact: true })).toBe("$1.2M");
    expect(formatMoney({ amount: 795_000, currency: "USD" }, { compact: true })).toBe("$795K");
  });

  it("formats percentages, signs and plurals", () => {
    expect(formatPercent(81.8)).toBe("82%");
    expect(formatSigned(2)).toBe("+2");
    expect(formatSigned(-9.1)).toBe("−9");
    expect(pluralize(1, "task")).toBe("1 task");
    expect(pluralize(4, "person", "people")).toBe("4 people");
  });

  it("phrases deadlines relative to the reference date", () => {
    expect(describeDue("2026-10-30", "2026-10-30")).toBe("Due today");
    expect(describeDue("2026-10-31", "2026-10-30")).toBe("Due tomorrow");
    expect(describeDue("2026-11-04", "2026-10-30")).toBe("Due in 5 days");
    expect(describeDue("2026-10-29", "2026-10-30")).toBe("1 day overdue");
    expect(describeDue("2026-10-23", "2026-10-30")).toBe("7 days overdue");
  });

  it("builds initials and natural-language lists", () => {
    expect(initials("Fatima Zahra Idrissi")).toBe("FI");
    expect(initials("Mei Lin")).toBe("ML");
    expect(joinList(["Youssef Haddad", "Thomas Keller"])).toBe("Youssef Haddad and Thomas Keller");
    expect(joinList(["A", "B", "C"])).toBe("A, B and C");
  });
});
