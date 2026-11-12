/** Public Supabase settings; null when the app has not been configured yet. */
export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export function requireSupabaseEnv(): { url: string; key: string } {
  const env = supabaseEnv();
  if (!env) {
    throw new Error(
      "TRUST is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
    );
  }
  return env;
}

/** True when the server can run AI analyses. */
export function analysisConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY && process.env.ANTHROPIC_API_KEY);
}

/** Only same-site relative paths are accepted as redirect targets. */
export function safeNextPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("\n")) return fallback;
  return value;
}
