"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Mail, Lock, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Mode = "signin" | "signup";

function LoginForm() {
  const configured = isSupabaseConfigured();
  const router = useRouter();
  const params = useSearchParams();
  const redirectedFrom = params.get("redirectedFrom") || "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(
    null
  );

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setBusy(true);
    setMsg(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(redirectedFrom);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMsg({
          kind: "ok",
          text: "Account created. Check your email to confirm, then sign in.",
        });
        setMode("signin");
      }
    } catch (err) {
      setMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    if (!configured || !email) {
      setMsg({ kind: "error", text: "Enter your email first." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMsg({ kind: "ok", text: "Magic link sent — check your inbox." });
    } catch (err) {
      setMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Could not send link.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow-sm">
            <span className="text-base font-bold tracking-tight text-white">
              NX
            </span>
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Welcome to NEXORA
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "signin"
              ? "Sign in to your workspace"
              : "Create your workspace account"}
          </p>
        </div>

        <div className="nx-card nx-sheen p-6">
          {!configured ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/5 px-4 py-3 text-sm text-warning">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Supabase isn&apos;t connected yet, so sign-in is disabled. Add
                your <code className="text-xs">NEXT_PUBLIC_SUPABASE_*</code>{" "}
                keys to <code className="text-xs">.env.local</code> to enable
                authentication. Until then the app runs in open demo mode.
              </p>
            </div>
          ) : null}

          <form onSubmit={handlePassword} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-subtle">
                Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <input
                  type="email"
                  required
                  disabled={!configured || busy}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="nx-focus h-11 w-full rounded-xl border border-border bg-surface-2/60 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-subtle">
                Password
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <input
                  type="password"
                  required
                  minLength={6}
                  disabled={!configured || busy}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="nx-focus h-11 w-full rounded-xl border border-border bg-surface-2/60 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </label>

            {msg ? (
              <p
                className={
                  msg.kind === "error"
                    ? "text-sm text-danger"
                    : "text-sm text-success"
                }
              >
                {msg.text}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={!configured || busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={!configured || busy}
            className="nx-focus mt-3 w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2/70 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Email me a magic link
          </button>

          <p className="mt-5 text-center text-xs text-subtle">
            {mode === "signin" ? "New to NEXORA? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMsg(null);
              }}
              className="nx-focus rounded font-medium text-violet-300 hover:text-violet-200"
            >
              {mode === "signin" ? "Create a workspace" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
