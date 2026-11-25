import { describe, expect, it } from "vitest";
import { EvidenceIndex, normalizeForMatch } from "@/lib/ai/evidence";

const pages = [
  { pageNumber: 1, text: "SUPPLY AGREEMENT between ACME Ltd (the “Supplier”) and Globex SA (the “Buyer”)." },
  { pageNumber: 2, text: "12.3 The Supplier’s liability under this Agreement shall be\nunlimited. The Buyer shall pay within thirty" },
  { pageNumber: 3, text: "(30) days of receipt of each invoice. This Agreement renews auto-\nmatically for successive terms." },
];
const index = new EvidenceIndex(pages);

describe("normalizeForMatch", () => {
  it("ignores whitespace, case, typographic quotes and dashes", () => {
    expect(normalizeForMatch("The  “Supplier”\n— liable")).toBe(normalizeForMatch('the "supplier" - liable'));
  });
  it("ignores soft hyphens and zero-width characters", () => {
    expect(normalizeForMatch("termi­nation​")).toBe("termination");
  });
});

describe("EvidenceIndex.locate", () => {
  it("verifies a quotation found on the claimed page", () => {
    expect(index.locate("The Supplier's liability under this Agreement shall be unlimited.", 2)).toEqual({ verified: true, pageNumber: 2 });
  });

  it("verifies across a line break inside the quotation", () => {
    expect(index.locate("shall be unlimited", 2).verified).toBe(true);
  });

  it("corrects the page number when the quotation is on another page", () => {
    expect(index.locate("ACME Ltd", 3)).toEqual({ verified: true, pageNumber: 1 });
  });

  it("verifies a quotation that runs across a page boundary and reports the starting page", () => {
    expect(index.locate("The Buyer shall pay within thirty (30) days of receipt of each invoice.", 2)).toEqual({ verified: true, pageNumber: 2 });
    expect(index.locate("The Buyer shall pay within thirty (30) days of receipt of each invoice.", 3)).toEqual({ verified: true, pageNumber: 2 });
  });

  it("rejects a paraphrase", () => {
    expect(index.locate("The Supplier has unlimited liability", 2)).toEqual({ verified: false, pageNumber: 2 });
  });

  it("rejects a quotation that is not in the document", () => {
    expect(index.locate("The Buyer may terminate for convenience at any time.", 1).verified).toBe(false);
  });

  it("rejects empty and trivially short quotations", () => {
    expect(index.locate("", 1).verified).toBe(false);
    expect(index.locate("the", 1).verified).toBe(false);
    expect(index.locate(null, 1).verified).toBe(false);
  });

  it("does not match text stitched together from non-adjacent pages", () => {
    expect(index.locate("the “Buyer”). (30) days of receipt", 1).verified).toBe(false);
  });

  it("keeps a page the document does not have as unverified, without inventing one", () => {
    expect(index.locate("no such passage here at all", 99)).toEqual({ verified: false, pageNumber: 99 });
    expect(index.locate("no such passage here at all", null)).toEqual({ verified: false, pageNumber: null });
  });
});
