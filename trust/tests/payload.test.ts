import { describe, expect, it } from "vitest";
import { buildPayload, isoDate } from "@/lib/ai/payload";
import type { AnalysisOutput } from "@/lib/ai/schema";
import type { ExtractedDocument } from "@/lib/documents/extract";

const document: ExtractedDocument = {
  kind: "pdf",
  pagination: "exact",
  pages: [
    { pageNumber: 1, text: "This Agreement is made between ACME Ltd and Globex SA and remains in force until 30 June 2027." },
    { pageNumber: 2, text: "The Supplier's liability shall be unlimited. Invoices are payable within thirty (30) days." },
  ],
};

function output(overrides: Partial<AnalysisOutput> = {}): AnalysisOutput {
  return {
    is_contract: true,
    document_language: "en",
    contract_type: "Supply agreement",
    summary: "A supply agreement.",
    parties: [{ name: "ACME Ltd", role: "Supplier", evidence: { page: 1, clause: null, quote: "ACME Ltd" } }],
    key_terms: [
      {
        field: "expiration_date", label: "Expiry", value_text: "30 June 2027", value_date: "2027-06-30",
        value_number: null, currency: null, evidence: { page: 1, clause: null, quote: "remains in force until 30 June 2027" },
      },
    ],
    obligations: [
      {
        responsible_party: "Buyer", category: "payment", description: "Pay invoices within 30 days", due_date: null,
        recurrence: "each invoice", evidence: { page: 2, clause: "5.1", quote: "Invoices are payable within thirty (30) days." },
      },
    ],
    risks: [
      {
        category: "liability", severity: "critical", title: "Unlimited liability", explanation: "No cap.",
        recommendation: "Negotiate a cap.", evidence: { page: 2, clause: "9", quote: "The Supplier's liability shall be unlimited." },
      },
    ],
    missing_protections: [
      { category: "force_majeure", severity: "high", title: "No force majeure clause", explanation: "Absent.", recommendation: "Add one." },
    ],
    ...overrides,
  };
}

describe("buildPayload", () => {
  it("marks findings whose quotation is in the document as verified", () => {
    const { payload, stats } = buildPayload(output(), document);
    expect(payload.parties[0]).toMatchObject({ name: "ACME Ltd", page_number: 1, evidence_verified: true });
    expect(payload.facts[0]).toMatchObject({ value_date: "2027-06-30", evidence_verified: true });
    expect(payload.obligations[0]).toMatchObject({ clause_ref: "5.1", evidence_verified: true });
    expect(payload.risks[0]).toMatchObject({ evidence_kind: "quote", severity: "critical", evidence_verified: true });
    expect(stats).toEqual({ findings: 4, verified: 4, unverified: 0, pageCorrected: 0 });
  });

  it("keeps a finding with an invented quotation but marks it unverified", () => {
    const base = output();
    const { payload, stats } = buildPayload(
      output({ risks: [{ ...base.risks[0]!, evidence: { page: 2, clause: null, quote: "The Buyer waives all rights to damages." } }] }),
      document,
    );
    expect(payload.risks[0]).toMatchObject({ evidence_verified: false, page_number: 2 });
    expect(stats.unverified).toBe(1);
  });

  it("stores missing protections as absence findings that are never verified", () => {
    const { payload } = buildPayload(output(), document);
    expect(payload.risks[1]).toMatchObject({
      evidence_kind: "absence", evidence_verified: false, page_number: null, quote: null, title: "No force majeure clause",
    });
  });

  it("corrects a wrong page number instead of trusting it", () => {
    const base = output();
    const { payload, stats } = buildPayload(
      output({ risks: [{ ...base.risks[0]!, evidence: { ...base.risks[0]!.evidence, page: 1 } }] }),
      document,
    );
    expect(payload.risks[0]).toMatchObject({ page_number: 2, evidence_verified: true });
    expect(stats.pageCorrected).toBe(1);
  });

  it("drops impossible dates, bad currencies and non-finite numbers instead of failing the write", () => {
    const base = output();
    const { payload } = buildPayload(
      output({
        key_terms: [{ ...base.key_terms[0]!, value_date: "2027-02-30", value_number: Number.POSITIVE_INFINITY, currency: "dollars" }],
        obligations: [{ ...base.obligations[0]!, due_date: "next month" }],
      }),
      document,
    );
    expect(payload.facts[0]).toMatchObject({ value_date: null, value_number: null, currency: null });
    expect(payload.obligations[0]!.due_date).toBeNull();
  });

  it("removes NUL characters and enforces the column length limits", () => {
    const base = output();
    const { payload } = buildPayload(
      output({ risks: [{ ...base.risks[0]!, title: `Bad\u0000 title ${"x".repeat(400)}` }] }),
      document,
    );
    expect(payload.risks[0]!.title).not.toContain("\u0000");
    expect(payload.risks[0]!.title.length).toBe(300);
  });

  it("drops findings that have no usable text", () => {
    const base = output();
    const { payload } = buildPayload(output({ parties: [{ ...base.parties[0]!, name: "  " }] }), document);
    expect(payload.parties).toHaveLength(0);
  });
});

describe("isoDate", () => {
  it("accepts real calendar dates only", () => {
    expect(isoDate("2028-02-29")).toBe("2028-02-29");
    expect(isoDate("2027-02-29")).toBeNull();
    expect(isoDate("30/06/2027")).toBeNull();
    expect(isoDate("0001-01-01")).toBeNull();
    expect(isoDate(null)).toBeNull();
  });
});
