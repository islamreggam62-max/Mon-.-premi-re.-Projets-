import { describe, expect, it } from "vitest";
import { addDaysIso, daysUntil, describeDue, formatDate, formatMoney } from "@/lib/format";
import { safeNextPath } from "@/lib/env";
import { errorCode, MESSAGES } from "@/lib/messages";

describe("dates", () => {
  it("counts whole days across month and year ends", () => {
    expect(daysUntil("2027-01-01", "2026-12-31")).toBe(1);
    expect(daysUntil("2026-11-12", "2026-11-12")).toBe(0);
    expect(daysUntil("2026-11-02", "2026-11-12")).toBe(-10);
    expect(daysUntil("2028-03-01", "2028-02-28")).toBe(2); // leap year
  });
  it("adds days in UTC", () => {
    expect(addDaysIso("2026-11-12", 90)).toBe("2027-02-10");
    expect(addDaysIso("2027-03-01", -1)).toBe("2027-02-28");
  });
  it("describes due dates", () => {
    expect(describeDue("2026-11-11", "2026-11-12")).toBe("1 day overdue");
    expect(describeDue("2026-11-12", "2026-11-12")).toBe("today");
    expect(describeDue("2026-11-19", "2026-11-12")).toBe("in 7 days");
  });
  it("formats dates and money, with a dash for missing values", () => {
    expect(formatDate("2027-06-30")).toBe("30 Jun 2027");
    expect(formatDate(null)).toBe("—");
    expect(formatMoney(1250000.5, "DZD")).toBe("1,250,000.5 DZD");
    expect(formatMoney(null, "USD")).toBe("—");
  });
});

describe("safeNextPath", () => {
  it("accepts same-site paths only", () => {
    expect(safeNextPath("/invite/abc")).toBe("/invite/abc");
    expect(safeNextPath("https://evil.example")).toBe("/app");
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("/\\evil.example")).toBe("/app");
    expect(safeNextPath("/\t/evil.example")).toBe("/app");   // browsers drop the tab: "//evil.example"
    expect(safeNextPath("/\r/evil.example")).toBe("/app");
    expect(safeNextPath("/ /evil.example")).toBe("/app");
    expect(safeNextPath("/app/contracts?error=x#risks")).toBe("/app/contracts?error=x#risks");
    expect(safeNextPath(undefined)).toBe("/app");
  });
});

describe("errorCode", () => {
  it("maps database errors to known message codes and never leaks the raw text", () => {
    expect(errorCode({ message: "plan_limit_contracts" })).toBe("plan_limit_contracts");
    expect(errorCode({ message: 'new row violates row-level security policy for table "contracts"' })).toBe("forbidden");
    expect(errorCode({ message: "permission denied for table risks", code: "42501" })).toBe("forbidden");
    expect(errorCode({ message: "connection reset by peer at 10.0.0.3" })).toBe("unexpected");
    expect(errorCode(null)).toBe("unexpected");
  });
  it("only returns codes that have a message", () => {
    for (const sample of ["last_owner", "comment_required", "invitation_email_mismatch", "weird"]) {
      expect(MESSAGES[errorCode({ message: sample })]).toBeDefined();
    }
  });
});
