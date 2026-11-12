import { unzipSync, strFromU8 } from "fflate";

export type DocumentKind = "pdf" | "docx";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  kind: DocumentKind;
  /**
   * "exact": page numbers are the PDF's real pages.
   * "approximate": a DOCX has no fixed pages; numbers follow the page breaks Word
   * last recorded, or fixed-size sections when the file records none.
   */
  pagination: "exact" | "approximate";
  pages: ExtractedPage[];
}

export type ExtractionErrorCode = "unsupported_type" | "corrupt_file" | "no_text_layer" | "too_large";

export class ExtractionError extends Error {
  constructor(
    public readonly code: ExtractionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

export const MIME_BY_KIND: Record<DocumentKind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const DOCX_MAX_XML_BYTES = 60 * 1024 * 1024;
const DOCX_SECTION_CHARS = 3000;
/** Below this many characters per page on average, a PDF is treated as scanned. */
const MIN_CHARS_PER_PAGE = 40;

/** Decides the file type from its first bytes, never from its name or declared type. */
export function sniffKind(bytes: Uint8Array): DocumentKind | null {
  if (bytes.length >= 5 && strFromU8(bytes.subarray(0, 5), true) === "%PDF-") return "pdf";
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return "docx"; // a zip container; extractDocx confirms it really is a Word document
  }
  return null;
}

/** Cheap check at upload time that a zip container really is a Word document. */
export function isWordDocument(bytes: Uint8Array): boolean {
  try {
    let found = false;
    unzipSync(bytes, {
      filter: (file) => {
        if (file.name === "word/document.xml") found = true;
        return false; // only list the entries; do not inflate anything
      },
    });
    return found;
  } catch {
    return false;
  }
}

export async function extractDocument(bytes: Uint8Array): Promise<ExtractedDocument> {
  const kind = sniffKind(bytes);
  if (kind === "pdf") return extractPdf(bytes);
  if (kind === "docx") return extractDocx(bytes);
  throw new ExtractionError("unsupported_type", "Only PDF and DOCX files are supported.");
}

export async function extractPdf(bytes: Uint8Array): Promise<ExtractedDocument> {
  let texts: string[];
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    // pdf.js takes ownership of the buffer it is given, so hand it a copy.
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const result = await extractText(pdf, { mergePages: false });
    texts = result.text;
  } catch {
    throw new ExtractionError("corrupt_file", "The PDF could not be read. It may be damaged or password-protected.");
  }
  const pages = texts.map((text, index) => ({ pageNumber: index + 1, text: tidy(text) }));
  const totalChars = pages.reduce((sum, page) => sum + page.text.length, 0);
  if (pages.length === 0 || totalChars / pages.length < MIN_CHARS_PER_PAGE) {
    throw new ExtractionError(
      "no_text_layer",
      "This PDF has no readable text (it looks like a scan). Text recognition (OCR) is not supported yet.",
    );
  }
  return { kind: "pdf", pagination: "exact", pages };
}

export function extractDocx(bytes: Uint8Array): ExtractedDocument {
  let xml: string;
  try {
    const files = unzipSync(bytes, {
      filter: (file) => {
        if (file.name !== "word/document.xml") return false;
        if (file.originalSize > DOCX_MAX_XML_BYTES) {
          throw new ExtractionError("too_large", "The document is too large to process.");
        }
        return true;
      },
    });
    const entry = files["word/document.xml"];
    if (!entry) throw new ExtractionError("unsupported_type", "The file is not a Word (.docx) document.");
    xml = strFromU8(entry);
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError("corrupt_file", "The Word document could not be read. It may be damaged.");
  }

  const { chunks, sawPageBreak } = readDocxBody(xml);
  let pageTexts = chunks.map(tidy).filter((text) => text.length > 0);
  if (!sawPageBreak) pageTexts = splitIntoSections(pageTexts.join("\n"), DOCX_SECTION_CHARS);
  if (pageTexts.length === 0) {
    throw new ExtractionError("no_text_layer", "The Word document contains no readable text.");
  }
  return {
    kind: "docx",
    pagination: "approximate",
    pages: pageTexts.map((text, index) => ({ pageNumber: index + 1, text })),
  };
}

/**
 * Walks the WordprocessingML body in document order. Reads visible text only:
 * deleted tracked changes (w:delText) are skipped, inserted ones are kept, so the
 * result is the document as it reads with all changes accepted.
 * Headers, footers, footnotes and text boxes are separate parts and are not read.
 */
function readDocxBody(xml: string): { chunks: string[]; sawPageBreak: boolean } {
  const chunks: string[] = [];
  let current = "";
  let sawPageBreak = false;
  const token = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:(tab|cr|lastRenderedPageBreak)\b[^>]*\/>|<w:br\b([^>]*)\/>|<\/w:(p|tc)>/g;
  let match: RegExpExecArray | null;
  while ((match = token.exec(xml)) !== null) {
    const [, text, simple, brAttributes, closing] = match;
    if (text !== undefined) {
      current += decodeXml(text);
    } else if (simple === "tab") {
      current += "\t";
    } else if (simple === "cr") {
      current += "\n";
    } else if (simple === "lastRenderedPageBreak" || (brAttributes !== undefined && /w:type="page"/.test(brAttributes))) {
      sawPageBreak = true;
      chunks.push(current);
      current = "";
    } else if (brAttributes !== undefined) {
      current += "\n";
    } else if (closing === "p") {
      current += "\n";
    } else if (closing === "tc") {
      current += "\t";
    }
  }
  chunks.push(current);
  return { chunks, sawPageBreak };
}

function splitIntoSections(text: string, size: number): string[] {
  const sections: string[] = [];
  let current = "";
  for (const paragraph of text.split("\n")) {
    if (current.length > 0 && current.length + paragraph.length + 1 > size) {
      sections.push(current);
      current = "";
    }
    current += (current ? "\n" : "") + paragraph;
  }
  if (current.trim()) sections.push(current);
  return sections.map(tidy).filter((section) => section.length > 0);
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&");
}

function safeCodePoint(code: number): string {
  return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
}

/** Postgres text cannot hold NUL; also trims trailing spaces and runs of blank lines. */
function tidy(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
