import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ClaudeAnalysisModel } from "@/lib/ai/model";
import { runAnalysis } from "@/lib/ai/pipeline";
import { analysisConfigured, supabaseEnv } from "@/lib/env";
import { errorCode } from "@/lib/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

/** A job that has not finished after this long is considered dead and may be started again. */
const STALE_AFTER_MS = 15 * 60 * 1000;

/**
 * Ceiling on analyses started per day across ALL organisations. Each organisation
 * has its own monthly limit, but sign-up is open, so this bounds the total AI spend
 * if many accounts are created to abuse the free allowance. Set it to your budget.
 */
const DAILY_CEILING = Number(process.env.TRUST_MAX_ANALYSES_PER_DAY ?? 200);

function originHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null; // "null" or malformed: treat as another site
  }
}

function refuse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/**
 * Starts an AI analysis of one document. Answers at once with 202; the work
 * continues after the response and the page polls for the result.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Browsers send Origin on POST; a mismatch means the request came from another site.
  const origin = request.headers.get("origin");
  if (origin && originHost(origin) !== request.headers.get("host")) return refuse("forbidden", 403);
  if (!supabaseEnv() || !analysisConfigured()) return refuse("not_configured", 503);

  const contractId = z.uuid().safeParse((await params).id);
  const body = z.object({ documentId: z.uuid() }).safeParse(await request.json().catch(() => null));
  if (!contractId.success || !body.success) return refuse("invalid_input", 400);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return refuse("not_authenticated", 401);

  // Everything below runs as the user: row-level security decides what they may see and start.
  const { data: document } = await supabase
    .from("documents")
    .select("id, org_id, contract_id")
    .eq("id", body.data.documentId)
    .eq("contract_id", contractId.data)
    .maybeSingle();
  if (!document) return refuse("not_found", 404);

  const { data: running } = await supabase
    .from("analyses")
    .select("id, created_at")
    .eq("contract_id", contractId.data)
    .in("status", ["queued", "extracting", "analyzing"])
    .gte("created_at", new Date(Date.now() - STALE_AFTER_MS).toISOString())
    .limit(1);
  if (running && running.length > 0) return refuse("already_running", 409);

  const admin = createAdminClient();
  const dayStart = new Date(new Date().toISOString().slice(0, 10)).toISOString();
  const { count: startedToday, error: countError } = await admin
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", "analysis")
    .gte("created_at", dayStart);
  if (countError || (startedToday ?? 0) >= DAILY_CEILING) return refuse("service_busy", 429);

  const { data: analysis, error } = await supabase
    .from("analyses")
    .insert({ org_id: document.org_id, contract_id: contractId.data, document_id: document.id, requested_by: auth.user.id })
    .select("id")
    .single();
  if (error || !analysis) {
    const code = errorCode(error);
    const status: Record<string, number> = { forbidden: 403, plan_limit_analyses: 402, already_running: 409, contract_locked: 409, subscription_inactive: 402 };
    return refuse(code, status[code] ?? 500);
  }

  const analysisId = analysis.id as string;
  after(async () => {
    try {
      await runAnalysis(admin, analysisId, new ClaudeAnalysisModel());
    } catch (failure) {
      console.error("analysis could not run", { analysisId, failure });
    }
  });
  return NextResponse.json({ analysisId }, { status: 202 });
}
