import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { ExtractedDocument } from "@/lib/documents/extract";
import { ANALYSIS_SYSTEM_PROMPT, renderDocument, renderRequest, type AnalysisRequestContext } from "./prompts";
import { AnalysisOutputSchema, type AnalysisOutput } from "./schema";

export interface ModelResult {
  output: AnalysisOutput;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/** The pipeline depends on this interface, not on a vendor SDK, so it can be tested with a fake. */
export interface AnalysisModel {
  analyze(document: ExtractedDocument, context: AnalysisRequestContext): Promise<ModelResult>;
}

/** An analysis failure whose message is safe to show to the user. */
export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisError";
  }
}

const DEFAULT_MODEL = "claude-opus-5-5";

export class ClaudeAnalysisModel implements AnalysisModel {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(options: { client?: Anthropic; model?: string } = {}) {
    this.client = options.client ?? new Anthropic();
    this.model = options.model ?? process.env.TRUST_ANALYSIS_MODEL ?? DEFAULT_MODEL;
  }

  async analyze(document: ExtractedDocument, context: AnalysisRequestContext): Promise<ModelResult> {
    let message;
    try {
      // Streaming keeps the connection alive on long documents; we only need the final message.
      const stream = this.client.beta.messages.stream({
        model: this.model,
        max_tokens: 64000,
        // If a safety classifier declines the request, retry server-side on the fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "high", format: zodOutputFormat(AnalysisOutputSchema) },
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              // The document is the large, stable part: cache it so a re-run is cheaper.
              { type: "text", text: renderDocument(document, context.filename), cache_control: { type: "ephemeral" } },
              { type: "text", text: renderRequest(context) },
            ],
          },
        ],
      });
      message = await stream.finalMessage();
    } catch (error) {
      throw toAnalysisError(error);
    }

    if (message.stop_reason === "refusal") {
      throw new AnalysisError("The AI service declined to analyse this document.");
    }
    if (message.stop_reason === "max_tokens") {
      throw new AnalysisError("The analysis was too long to complete for this document. Nothing was saved.");
    }

    const raw = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    let output: AnalysisOutput;
    try {
      output = AnalysisOutputSchema.parse(JSON.parse(raw));
    } catch {
      throw new AnalysisError("The AI service returned an answer in an unexpected format. Nothing was saved.");
    }

    const usage = message.usage;
    return {
      output,
      model: message.model,
      inputTokens:
        usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0),
      outputTokens: usage.output_tokens,
    };
  }
}

/** Maps SDK errors to messages that reveal nothing about keys or infrastructure. */
function toAnalysisError(error: unknown): AnalysisError {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new AnalysisError("The AI service is not configured correctly. Please contact your administrator.");
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AnalysisError("The AI service is busy. Please try again in a few minutes.");
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new AnalysisError("The AI service could not process this document.");
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AnalysisError("The AI service could not be reached. Please try again.");
  }
  if (error instanceof Anthropic.APIError) {
    return new AnalysisError("The AI service returned an error. Please try again later.");
  }
  return new AnalysisError("The analysis failed unexpectedly.");
}
