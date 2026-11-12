import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env";

const PROTECTED = ["/app", "/onboarding", "/invite", "/api"];

/** Keeps the session cookie fresh and sends signed-out visitors to the login page. */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const needsUser = PROTECTED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const env = supabaseEnv();

  if (!env) {
    if (!needsUser) return NextResponse.next();
    return redirectToLogin(request, pathname + search, "not_configured");
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() checks the token with the auth server; do not replace it with getSession().
  const { data } = await supabase.auth.getUser();
  if (!data.user && needsUser) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    return redirectToLogin(request, pathname + search);
  }
  return response;
}

function redirectToLogin(request: NextRequest, next: string, error?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", next);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
