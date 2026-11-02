"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker in production builds only (in dev it
 * would cache pages and fight hot reload). The version query ties the worker's
 * cache to the build, so each deployment replaces the previous cache.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const version = encodeURIComponent(process.env.NEXT_PUBLIC_APP_VERSION ?? "dev");
    const register = () => {
      navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: "/" }).catch(() => {
        /* offline support is optional: the app works without it */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
