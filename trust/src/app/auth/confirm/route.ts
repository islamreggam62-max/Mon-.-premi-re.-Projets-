import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath, supabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point of the link in the confirmation email.
 *
 * Only the code exchange is accepted. The code is useless without the verifier cookie
 * set in the browser that started the sign-up, so a link prepared by someone else cannot
 * sign a visitor into that person's account. Opened on another device, the link still
 * confirms the address but does not sign in: the user then signs in normally.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNextPath(url.searchParams.get("next"));
  const failure = new URL("/login?error=confirm_failed", url.origin);
  if (!supabaseEnv()) return NextResponse.redirect(failure);

  const supabase = await createClient();
  const code = url.searchParams.get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(error ? failure : new URL(next, url.origin));
  }
  return NextResponse.redirect(failure);
}
