"use client";

import { t } from "@/lib/i18n/core";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNativeApp } from "@/lib/native";

/** Chromium's install prompt event (not yet in TypeScript's DOM lib). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "hidden" | "prompt" | "ios";

/**
 * "Install app" control. Chromium browsers (Chrome, Edge, Android) get the native
 * install prompt; iPhone/iPad Safari gets Add-to-Home-Screen instructions, since
 * iOS has no install API. Hidden when already running as an installed app or
 * inside the Android app.
 */
export function InstallAppButton({ collapsed = false }: { collapsed?: boolean }) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || isNativeApp()) return;

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIos) setMode("ios");

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("prompt");
    };
    const onInstalled = () => {
      setDeferred(null);
      setMode("hidden");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  async function install() {
    if (mode === "ios") {
      setShowIosHelp((v) => !v);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") setMode("hidden");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={install}
        aria-expanded={mode === "ios" ? showIosHelp : undefined}
        title={collapsed ? t("Install NEXORA app") : undefined}
        aria-label={collapsed ? t("Install NEXORA app") : undefined}
        className={cn(
          "focus-ring flex w-full items-center gap-2 rounded-xl bg-gradient-to-r from-violet to-violet-soft py-2 text-xs font-semibold text-white shadow-glow hover:brightness-110",
          collapsed ? "justify-center" : "px-3",
        )}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {!collapsed && t("Install NEXORA app")}
      </button>
      {showIosHelp && (
        <div
          role="dialog"
          aria-label={t("Install on iPhone or iPad")}
          className="absolute bottom-full start-0 z-50 mb-2 w-64 rounded-xl border border-hairline bg-base-800 p-3 text-xs text-slate-200 shadow-2xl shadow-black/60"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-50">{t("Install on iPhone / iPad")}</p>
            <button
              type="button"
              onClick={() => setShowIosHelp(false)}
              aria-label={t("Close")}
              className="focus-ring rounded p-0.5 text-slate-400 hover:text-slate-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <ol className="mt-2 list-decimal space-y-1 ps-4 text-slate-300">
            <li>
              {t("Tap the Share button in Safari.")} <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden="true" />
            </li>
            <li>{t("Choose “Add to Home Screen”.")}</li>
            <li>{t("Open NEXORA from your home screen.")}</li>
          </ol>
        </div>
      )}
    </div>
  );
}
