import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractDocument, ExtractionError, type ExtractedDocument } from "@/lib/documents/extract";
import { AnalysisError, type AnalysisModel } from "./model";
import { buildPayload } from "./payload";
import { PROMPT_VERSION } from "./prompts";

/** Above this the document is refused rather than cut: a partial analysis would look complete. */
export const MAX_DOCUMENT_CHARS = 1_200_000;

const PAGE_INSERT_BATCH = 200;

/**
 * Runs one queued analysis end to end: read the file, extract its text, ask the
 * model, check every quotation, store the result atomically.
 *
 * `admin` is the service-role client. The caller must already have authorised
 * the request: the analysis row itself is created under the user's own
 * permissions, so its existence proves a permitted user asked for it.
 */
export async function runAnalysis(admin: SupabaseClient, analysisId: string, model: AnalysisModel): Promise<void> {
  // Claim the job. If two workers race, only one moves it out of "queued".
  const { data: claimed, error: claimError } = await admin
    .from("analyses")
    .update({ status: "extracting", started_at: new Date().toISOString() })
    .eq("id", analysisId)
    .eq("status", "queued")
    .select("id, org_id, contract_id, document_id")
    .maybeSingle();
  if (claimError) throw new Error(`could not claim analysis: ${claimError.message}`);
  if (!claimed) return;

  try {
    const [{ data: document, error: documentError }, { data: contract, error: contractError }] = await Promise.all([
      admin.from("documents").select("id, org_id, contract_id, mime_type, filename, sha256").eq("id", claimed.document_id).single(),
      admin.from("contracts").select("id, our_party").eq("id", claimed.contract_id).single(),
    ]);
    if (
      documentError || contractError || !document || !contract ||
      document.org_id !== claimed.org_id || document.contract_id !== claimed.contract_id
    ) {
      throw new AnalysisError("The document could not be found.");
    }

    const { data: file, error: downloadError } = await admin.storage
      .from("contracts")
      .download(storagePathFor(document.org_id, document.contract_id, document.id, document.mime_type));
    if (downloadError || !file) throw new AnalysisError("The document file could not be read from storage.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== document.sha256) {
      throw new AnalysisError("The stored file does not match the file that was uploaded. Analysis stopped.");
    }

    const extracted = await extractDocument(bytes);
    const totalChars = extracted.pages.reduce((sum, page) => sum + page.text.length, 0);
    if (totalChars > MAX_DOCUMENT_CHARS) {
      throw new AnalysisError("The document is too long to analyse in one pass. Splitting long documents is not supported yet.");
    }
    await storePages(admin, claimed.org_id, document.id, extracted);

    await must(admin.from("analyses").update({ status: "analyzing" }).eq("id", analysisId));
    const result = await model.analyze(extracted, {
      filename: document.filename,
      perspective: contract.our_party,
      outputLanguage: null,
    });

    const { payload } = buildPayload(result.output, extracted);
    await must(
      admin.rpc("store_analysis_results", {
        _analysis: analysisId,
        _payload: {
          ...payload,
          model: result.model,
          prompt_version: PROMPT_VERSION,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
        },
      }),
    );
  } catch (error) {
    const message =
      error instanceof AnalysisError || error instanceof ExtractionError
        ? error.message
        : "The analysis failed unexpectedly.";
    if (!(error instanceof AnalysisError || error instanceof ExtractionError)) {
      console.error("analysis failed", { analysisId, error });
    }
    await admin
      .from("analyses")
      .update({ status: "failed", error: message, finished_at: new Date().toISOString() })
      .eq("id", analysisId)
      .in("status", ["extracting", "analyzing"]);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Where a document's file lives. This client can read every tenant's files, so the
 * path is built here from validated ids and never taken from a stored or supplied
 * string: a path containing "..", "?" or another folder cannot be formed.
 */
export function storagePathFor(orgId: unknown, contractId: unknown, documentId: unknown, mimeType: unknown): string {
  const ids = [orgId, contractId, documentId];
  if (!ids.every((id): id is string => typeof id === "string" && UUID.test(id))) {
    throw new AnalysisError("The document could not be found.");
  }
  const extension =
    mimeType === "application/pdf" ? "pdf"
    : mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? "docx"
    : null;
  if (!extension) throw new AnalysisError("The document could not be found.");
  return `${ids.join("/")}.${extension}`;
}

async function storePages(admin: SupabaseClient, orgId: string, documentId: string, extracted: ExtractedDocument) {
  await must(admin.from("document_pages").delete().eq("document_id", documentId));
  for (let start = 0; start < extracted.pages.length; start += PAGE_INSERT_BATCH) {
    const rows = extracted.pages.slice(start, start + PAGE_INSERT_BATCH).map((page) => ({
      document_id: documentId,
      org_id: orgId,
      page_number: page.pageNumber,
      content: page.text,
    }));
    await must(admin.from("document_pages").insert(rows));
  }
  await must(admin.from("documents").update({ page_count: extracted.pages.length }).eq("id", documentId));
}

async function must(query: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await query;
  if (error) throw new Error(error.message);
}
