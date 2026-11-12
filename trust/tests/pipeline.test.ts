import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AnalysisError, type AnalysisModel } from "@/lib/ai/model";
import { runAnalysis, storagePathFor } from "@/lib/ai/pipeline";
import type { AnalysisOutput } from "@/lib/ai/schema";

/**
 * Runs the whole pipeline against an in-memory stand-in for the service-role
 * client and a scripted model. It checks the orchestration: claiming the job,
 * integrity of the file, what is stored, and that every failure ends in a
 * "failed" analysis with a message that is safe to show.
 * It does not check the database rules; supabase/tests does that for real.
 */

type Row = Record<string, unknown>;

class Query implements PromiseLike<{ data: unknown; error: { message: string } | null }> {
  private filters: ((row: Row) => boolean)[] = [];
  private values: Row | Row[] | null = null;
  private returning = false;
  private mode: "many" | "maybeSingle" | "single" = "many";
  constructor(
    private readonly rows: Row[],
    private op: "select" | "update" | "delete" | "insert" = "select",
  ) {}
  select() { if (this.op === "select") return this; this.returning = true; return this; }
  update(values: Row) { this.op = "update"; this.values = values; return this; }
  delete() { this.op = "delete"; return this; }
  insert(values: Row | Row[]) { this.op = "insert"; this.values = values; return this; }
  eq(column: string, value: unknown) { this.filters.push((row) => row[column] === value); return this; }
  in(column: string, values: unknown[]) { this.filters.push((row) => values.includes(row[column])); return this; }
  maybeSingle() { this.mode = "maybeSingle"; return this; }
  single() { this.mode = "single"; return this; }
  private run() {
    const matches = this.rows.filter((row) => this.filters.every((filter) => filter(row)));
    let result: Row[] = matches;
    if (this.op === "update") for (const row of matches) Object.assign(row, this.values);
    if (this.op === "delete") for (const row of matches) this.rows.splice(this.rows.indexOf(row), 1);
    if (this.op === "insert") {
      result = Array.isArray(this.values) ? this.values : [this.values as Row];
      this.rows.push(...result);
    }
    if (this.mode === "many") return { data: this.op === "select" || this.returning ? result : null, error: null };
    if (result.length === 1) return { data: result[0], error: null };
    return { data: null, error: this.mode === "single" ? { message: "no single row" } : null };
  }
  then<A, B>(resolve?: ((value: { data: unknown; error: { message: string } | null }) => A | PromiseLike<A>) | null, reject?: ((reason: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve(this.run()).then(resolve, reject);
  }
}

const ORG = "11111111-1111-4111-8111-111111111111";
const CONTRACT = "22222222-2222-4222-8222-222222222222";
const DOCUMENT = "33333333-3333-4333-8333-333333333333";

async function makePdf(lines: string[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([595, 842]);
  lines.forEach((line, index) => page.drawText(line, { x: 50, y: 780 - index * 20, size: 11, font }));
  return pdf.save();
}

async function setup(options: { file?: Uint8Array; recordedHash?: string; rpcError?: string } = {}) {
  const file = options.file ?? (await makePdf(["SUPPLY AGREEMENT between ACME Ltd and Globex SA.", "The Supplier's liability under this Agreement shall be unlimited."]));
  const tables: Record<string, Row[]> = {
    analyses: [{ id: "an-1", org_id: ORG, contract_id: CONTRACT, document_id: DOCUMENT, status: "queued" }],
    // storage_path is deliberately hostile: the pipeline must ignore it and build the path from the ids.
    documents: [{ id: DOCUMENT, org_id: ORG, contract_id: CONTRACT, mime_type: "application/pdf", storage_path: "../../other-org/secret.pdf?x=1", filename: "supply.pdf", sha256: options.recordedHash ?? createHash("sha256").update(file).digest("hex") }],
    contracts: [{ id: CONTRACT, our_party: "the Buyer" }],
    document_pages: [],
  };
  const rpcCalls: { name: string; args: { _analysis: string; _payload: Record<string, unknown> } }[] = [];
  const downloads: string[] = [];
  const admin = {
    from: (table: string) => new Query(tables[table]!),
    rpc: async (name: string, args: { _analysis: string; _payload: Record<string, unknown> }) => {
      rpcCalls.push({ name, args });
      if (options.rpcError) return { error: { message: options.rpcError } };
      Object.assign(tables.analyses![0]!, { status: "completed" });
      return { error: null };
    },
    storage: { from: () => ({ download: async (path: string) => { downloads.push(path); return { data: new Blob([file as BlobPart]), error: null }; } }) },
  } as unknown as SupabaseClient;
  return { admin, tables, rpcCalls, downloads, analysis: () => tables.analyses![0]! };
}

const goodOutput: AnalysisOutput = {
  is_contract: true, document_language: "en", contract_type: "Supply", summary: "A supply agreement.",
  parties: [{ name: "ACME Ltd", role: "Supplier", evidence: { page: 1, clause: null, quote: "ACME Ltd" } }],
  key_terms: [], obligations: [],
  risks: [
    { category: "liability", severity: "critical", title: "Unlimited liability", explanation: "No cap.", recommendation: "Cap it.", evidence: { page: 1, clause: null, quote: "The Supplier's liability under this Agreement shall be unlimited." } },
    { category: "termination", severity: "high", title: "Invented", explanation: "x", recommendation: "y", evidence: { page: 1, clause: null, quote: "The Buyer may never terminate this Agreement." } },
  ],
  missing_protections: [],
};

function model(result: AnalysisOutput | Error, seen: { perspective?: string | null; pages?: number } = {}): AnalysisModel {
  return {
    async analyze(document, context) {
      seen.perspective = context.perspective;
      seen.pages = document.pages.length;
      if (result instanceof Error) throw result;
      return { output: result, model: "scripted-model", inputTokens: 1200, outputTokens: 300 };
    },
  };
}

describe("runAnalysis", () => {
  it("extracts, analyses, checks quotations and stores the result once", async () => {
    const context = await setup();
    const seen: { perspective?: string | null; pages?: number } = {};
    await runAnalysis(context.admin, "an-1", model(goodOutput, seen));

    expect(seen).toEqual({ perspective: "the Buyer", pages: 1 });
    expect(context.tables.document_pages).toHaveLength(1);
    expect(context.tables.document_pages![0]).toMatchObject({ document_id: DOCUMENT, org_id: ORG, page_number: 1 });
    expect(context.downloads).toEqual([`${ORG}/${CONTRACT}/${DOCUMENT}.pdf`]);
    expect(context.tables.documents![0]!.page_count).toBe(1);

    expect(context.rpcCalls).toHaveLength(1);
    const { name, args } = context.rpcCalls[0]!;
    expect(name).toBe("store_analysis_results");
    expect(args._analysis).toBe("an-1");
    expect(args._payload).toMatchObject({ model: "scripted-model", input_tokens: 1200, output_tokens: 300 });
    expect(String(args._payload.prompt_version)).toMatch(/^contract-analysis\//);
    const risks = args._payload.risks as { title: string; evidence_verified: boolean }[];
    expect(risks.map((risk) => [risk.title, risk.evidence_verified])).toEqual([["Unlimited liability", true], ["Invented", false]]);
    expect(context.analysis().status).toBe("completed");
  });

  it("does nothing when the job is not queued (a second worker cannot process it again)", async () => {
    const context = await setup();
    context.analysis().status = "analyzing";
    await runAnalysis(context.admin, "an-1", model(goodOutput));
    expect(context.rpcCalls).toHaveLength(0);
    expect(context.analysis().status).toBe("analyzing");
    expect(context.tables.document_pages).toHaveLength(0);
  });

  it("stops if the stored file is not the file that was uploaded", async () => {
    const context = await setup({ recordedHash: "0".repeat(64) });
    const seen: { pages?: number } = {};
    await runAnalysis(context.admin, "an-1", model(goodOutput, seen));
    expect(seen.pages).toBeUndefined(); // the model was never called
    expect(context.analysis()).toMatchObject({ status: "failed", error: expect.stringContaining("does not match") });
    expect(context.rpcCalls).toHaveLength(0);
  });

  it("fails with a clear reason for a scanned PDF, without calling the model", async () => {
    const blank = await PDFDocument.create();
    blank.addPage([595, 842]);
    const context = await setup({ file: await blank.save() });
    const seen: { pages?: number } = {};
    await runAnalysis(context.admin, "an-1", model(goodOutput, seen));
    expect(seen.pages).toBeUndefined();
    expect(context.analysis()).toMatchObject({ status: "failed", error: expect.stringContaining("no readable text") });
  });

  it("records a safe message when the model fails, and stores no findings", async () => {
    const context = await setup();
    await runAnalysis(context.admin, "an-1", model(new AnalysisError("The AI service is busy. Please try again in a few minutes.")));
    expect(context.analysis()).toMatchObject({ status: "failed", error: "The AI service is busy. Please try again in a few minutes." });
    expect(context.rpcCalls).toHaveLength(0);
  });

  it("never shows an internal error to the user", async () => {
    const context = await setup({ rpcError: 'connection to server at "10.0.0.7" failed: password authentication failed' });
    await runAnalysis(context.admin, "an-1", model(goodOutput));
    expect(context.analysis().status).toBe("failed");
    expect(context.analysis().error).toBe("The analysis failed unexpectedly.");
  });

  it("refuses a document of another organisation even if the job points at it", async () => {
    const context = await setup();
    context.tables.documents![0]!.org_id = "99999999-9999-4999-8999-999999999999";
    await runAnalysis(context.admin, "an-1", model(goodOutput));
    expect(context.analysis()).toMatchObject({ status: "failed", error: "The document could not be found." });
    expect(context.rpcCalls).toHaveLength(0);
    expect(context.downloads).toHaveLength(0);
  });

  it("refuses a document that belongs to another contract", async () => {
    const context = await setup();
    context.tables.documents![0]!.contract_id = "44444444-4444-4444-8444-444444444444";
    await runAnalysis(context.admin, "an-1", model(goodOutput));
    expect(context.analysis().status).toBe("failed");
    expect(context.downloads).toHaveLength(0);
  });
});

describe("storagePathFor", () => {
  it("builds the path from the ids", () => {
    expect(storagePathFor(ORG, CONTRACT, DOCUMENT, "application/pdf")).toBe(`${ORG}/${CONTRACT}/${DOCUMENT}.pdf`);
    expect(storagePathFor(ORG, CONTRACT, DOCUMENT, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toMatch(/\.docx$/);
  });
  it("refuses anything that is not three ids and a known type", () => {
    for (const bad of ["../..", `${ORG}/..`, "", null, 7, `${ORG}?select=id`]) {
      expect(() => storagePathFor(bad, CONTRACT, DOCUMENT, "application/pdf")).toThrow();
      expect(() => storagePathFor(ORG, CONTRACT, bad, "application/pdf")).toThrow();
    }
    expect(() => storagePathFor(ORG, CONTRACT, DOCUMENT, "text/html")).toThrow();
  });
});
