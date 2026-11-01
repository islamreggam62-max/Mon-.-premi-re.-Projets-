"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type Decision = "pending" | "approved" | "rejected";

export interface DecisionResult {
  ok: boolean;
  /** true only when the decision was written to the database. */
  persisted: boolean;
  error?: string;
}

/**
 * Persist an approval decision.
 *
 * Demo mode (no Supabase): a no-op that reports success without persisting,
 * so the UI can keep its local, in-memory behavior.
 * Live mode: updates approvals.decision under Row-Level Security and
 * revalidates the dashboard (which shows the open-approvals count).
 */
export async function decideApproval(
  id: string,
  decision: Decision
): Promise<DecisionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true, persisted: false };
  }
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("approvals")
      .update({ decision })
      .eq("id", id);

    if (error) return { ok: false, persisted: false, error: error.message };

    // Dashboard shows the open-approvals KPI/preview; keep it in sync.
    revalidatePath("/");
    return { ok: true, persisted: true };
  } catch (e) {
    return {
      ok: false,
      persisted: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
