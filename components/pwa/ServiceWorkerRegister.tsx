"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { isNativeApp } from "@/lib/native";

/**
 * Registers the offline service worker in production builds only (in dev it
 * would cache pages and fight hot reload). The version query ties the worker's
 * cache to the build; `ts` tells it whether page URLs end with a slash (static export).
 * Not in the Android app: its files are already on the device, and a worker
 * cache could keep serving an old version after an app update.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || isNativeApp()) return;
    const params = new URLSearchParams({
      v: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
      ts: process.env.NEXT_PUBLIC_TRAILING_SLASH === "1" ? "1" : "0",
    });
    const register = () => {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js?${params}`, { scope: `${BASE_PATH}/` }).catch(() => {
        /* offline support is optional: the app works without it */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
