import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Server Supabase client (for Server Components, Route Handlers and Server
 * Actions). Reads the user's session from cookies so Row-Level Security
 * applies. Only call this when Supabase is configured.
 *
 * In a pure Server Component the cookie store is read-only, so writes are
 * wrapped in try/catch — session refresh is handled by middleware.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component without a writable cookie store.
          // Safe to ignore — middleware refreshes the session.
        }
      },
    },
  });
}
