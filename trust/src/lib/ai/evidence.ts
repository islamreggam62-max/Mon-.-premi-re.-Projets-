import type { ExtractedPage } from "@/lib/documents/extract";

/**
 * Evidence check for AI findings.
 *
 * Every finding must quote the document word for word. Before a finding is stored
 * we look that quotation up in the text we extracted ourselves. A finding whose
 * quotation is not in the document is kept but marked unverified, and it does not
 * count toward the risk score.
 *
 * What "verified" means: the quoted words exist at the cited place.
 * What it does NOT mean: that the model's reading of those words is legally right.
 * That judgement stays with a person.
 */

const MIN_QUOTE_LENGTH = 6;

/**
 * Makes two renderings of the same passage comparable: Unicode compatibility
 * forms, typographic quotes and dashes, soft hyphens, letter case and ALL
 * whitespace are ignored (PDF text breaks lines and words unpredictably).
 */
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟«»″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/[­​-‍﻿]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export interface EvidenceResult {
  verified: boolean;
  /** The page the quotation was actually found on; the claimed page if not found. */
  pageNumber: number | null;
}

export class EvidenceIndex {
  private readonly pages: { pageNumber: number; text: string }[];

  constructor(pages: ExtractedPage[]) {
    this.pages = pages.map((page) => ({ pageNumber: page.pageNumber, text: normalizeForMatch(page.text) }));
  }

  /**
   * Looks for the quotation on the claimed page first, then across a page
   * boundary, then anywhere in the document. If it is found elsewhere, the page
   * number is corrected rather than trusted.
   */
  locate(quote: string | null | undefined, claimedPage: number | null | undefined): EvidenceResult {
    const claimed = typeof claimedPage === "number" && Number.isInteger(claimedPage) ? claimedPage : null;
    const needle = normalizeForMatch(quote ?? "");
    if (needle.length < MIN_QUOTE_LENGTH) return { verified: false, pageNumber: claimed };

    const claimedIndex = claimed === null ? -1 : this.pages.findIndex((page) => page.pageNumber === claimed);
    if (claimedIndex >= 0 && this.foundAt(claimedIndex, needle)) return { verified: true, pageNumber: claimed };

    for (let index = 0; index < this.pages.length; index++) {
      if (index !== claimedIndex && this.foundAt(index, needle)) {
        return { verified: true, pageNumber: this.pages[index]!.pageNumber };
      }
    }
    return { verified: false, pageNumber: claimed };
  }

  /** True if the quotation sits on this page, or starts on it and runs onto the next. */
  private foundAt(index: number, needle: string): boolean {
    const page = this.pages[index]!;
    if (page.text.includes(needle)) return true;
    const next = this.pages[index + 1];
    if (!next) return false;
    const joined = page.text + next.text;
    const at = joined.indexOf(needle);
    return at >= 0 && at < page.text.length;
  }
}
