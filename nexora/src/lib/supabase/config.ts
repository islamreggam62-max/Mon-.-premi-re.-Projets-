/**
 * Supabase configuration detection.
 *
 * NEXORA is designed to run with OR without a database connected. These
 * helpers let the data layer decide, at request time, whether to read from
 * Supabase or fall back to the labeled demo data. No secrets are hard-coded —
 * values come from the environment only.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True only when both public Supabase values are present. */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
