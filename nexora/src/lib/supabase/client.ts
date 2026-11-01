"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Browser Supabase client (for Client Components, e.g. auth forms and
 * realtime subscriptions). Only call this when Supabase is configured.
 *
 * Query result rows are cast to the types in ./types.ts at the data layer,
 * so the client itself is left untyped to avoid brittle generic inference.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
