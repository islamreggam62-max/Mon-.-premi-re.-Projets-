import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/env";

/**
 * Service-role client. It BYPASSES row-level security.
 * Use it only in the analysis pipeline, and only after the request has been
 * authorised with the user's own client. Never import it from client code.
 */
export function createAdminClient() {
  const { url } = requireSupabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set.");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
